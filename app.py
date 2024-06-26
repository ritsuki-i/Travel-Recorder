from flask import Flask, redirect, render_template, request, session, url_for, jsonify
from flask_session import Session
from src import firebase_db
from src.user import User
from src.lat_lng_finder import get_lat_lng
import datetime
import os
import uuid
from dotenv import load_dotenv
import json
from google.api_core.datetime_helpers import DatetimeWithNanoseconds

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
user = User()

# .env ファイルを読み込む
load_dotenv()
google_map_key = os.getenv('GOOGLE_MAP_KEY')
login_api_config = os.getenv('LOGIN_API_KEY')

login_api_json = json.loads(os.getenv("LOGIN_API_KEY"))

# デフォルトの緯度と経度を設定
default_lat = 35.6764
default_lng = 139.6500

@app.route('/login-api-json', methods=['GET'])
def get_login_api_json():
    return jsonify(login_api_json)

@app.route('/google-map-key', methods=['GET'])
def get_google_map_key():
    return jsonify({'google_map_key': google_map_key})


@app.route('/', methods=['GET'])
def login():
    user.UserEmail =  None
    user.UserID =  None
    session['marker_list'] = []
    session.clear()
    return render_template(
        'login.html'
    )

@app.route('/to-my-map', methods=['GET','POST'])
def to_my_map():
    if request.method == 'GET':
        if user.UserEmail !=  None and user.UserID !=  None:
            session["user_id"] = user.UserID
            session["user_email"] = user.UserEmail
            session['marker_list'] = firebase_db.get_allmarker_from_firestore(user.UserID)
            return redirect(url_for('map_page'))
        else:
            return render_template(
                'login.html'
            )
    else:
        userData = request.json
        user.UserEmail = userData['User']['email']
        user.UserID = userData['User']['uid']
        firebase_db.setUser(user) #firebaseのコレクション作成＆データ入力
        return jsonify({'message': 'Success'})

@app.route('/to-my-map-guest', methods=['POST'])
def to_my_map_guest():
    if request.is_json:
        userData = request.get_json()
        user.UserEmail = userData['User'].get('email', 'anonymous@example.com')  # デフォルトの匿名メールアドレス
        user.UserID = userData['User']['uid']
        firebase_db.setUser(user)  # firebaseのコレクション作成＆データ入力
        session["user_id"] = user.UserID
        session["user_email"] = user.UserEmail
        session['marker_list'] = firebase_db.get_allmarker_from_firestore(user.UserID)
        return jsonify({'message': 'Success', 'user_id': user.UserID})
    else:
        return jsonify({'error': 'Unsupported Media Type'}), 415

# static/js/myMap.js, templates/my-myMap.html, src/lat_lng_finder.py, app.pyのmap_page()を追加
# 今の時点でデータベースに入れるのは[ 緯度, 経度, ユーザが入力した名前, ユーザが入力したデスクリプション ]
# データベースはまだ設定されていないから、今まだ一個のマーカーしか見せないようにしている。
@app.route('/my-map', methods=['GET', 'POST'])
def map_page():
    if request.method == 'POST':
        # フォームの種類を取得
        form_type = request.form.get('form_type')

        if form_type == 'search_location':
            # ユーザーが入力した場所名から緯度と経度を検索
            location = request.form.get('location')
            lat_lng = get_lat_lng(location) if location else (default_lat, default_lng)
            # セッションに緯度と経度を保存
            session["lat"], session["lng"] = lat_lng if lat_lng else (default_lat, default_lng)

            #session['marker_list'] = firebase_db.get_allmarker_from_firestore(user.UserID)
            print("zoom=15")
            return render_template("my-map.html", zoom=15)

        elif form_type == 'submit_location':
            # ユーザーがフォームに入力した緯度、経度、名前、説明を取得
            lat, lng = request.form.get('lat'), request.form.get('lng')
            label = request.form.get('label')
            description = request.form.get('description')
            date = datetime.datetime.now()
            ts = datetime.datetime.timestamp(date)
            locationid = uuid.uuid4()#場所ごとにuniqueなid生成
            
            image_files = request.files.getlist('image_input')
                        
            map_marker = {"label": label, "lat": float(lat), "lng": float(lng), "description": description, "date": ts, 'locationid': locationid}
            # Firestoreにマーカー情報を保存
            firebase_db.save_marker_to_firestore(map_marker, user.UserID, locationid)
            if(str(image_files)!="[<FileStorage: '' ('application/octet-stream')>]"):
                #imagefile が1こ以上ある場合
                firebase_db.save_marker_to_firestore_with_image(map_marker, user.UserID, locationid, image_files)
            # セッションにマーカー情報を保存
            session["lat"], session["lng"] = default_lat, default_lng
            session['marker_list'].append(map_marker)
            return redirect(url_for('map_page'))

    elif request.method == 'GET':
        if user.UserEmail != None and user.UserID != None:
            # GETリクエストの場合はデフォルト値を使用
            if "lat" not in session or "lng" not in session: #エラー出たため書き換えた
                session["lat"], session["lng"] = default_lat, default_lng
        else:
            # ログインページをレンダリング
            return render_template(
                'login.html'
            )

    session['marker_list'] = firebase_db.get_allmarker_from_firestore(user.UserID)

    # マップページをレンダリング
    return render_template("my-map.html", zoom=6)

@app.route('/create-account', methods=['GET','POST'])
def create_account():
    return render_template(
        'create-account.html'
    )

@app.template_filter('get_date_time')
def get_date_time(ts):
    # タイムスタンプを日付と時刻に変換
    if ts and (type(ts) is float or type(ts) is DatetimeWithNanoseconds):
        time = datetime.datetime.fromtimestamp(ts if type(ts) is float else ts.timestamp())
        return time.strftime("%Y/%m/%d, %H:%M:%S")
    else:
        return "Not Available"
    
@app.route('/change-password', methods=['GET','POST'])
def change_password():
    return render_template(
        'change-password.html'
    )

@app.route('/logout', methods=['POST'])
def logout():
    # セッションの全てのキーを削除
    session['marker_list'] = []
    session.clear()
    # ログインページにリダイレクト
    return redirect(url_for('login'))

@app.route('/delete-marker', methods=['POST'])
def delete_marker():
    data = request.json
    locationid = data.get('locationid')
    

    if locationid:
        try:
            # Firestoreからマーカーを削除
            firebase_db.delete_marker_from_firestore(user.UserID, locationid)
            #cloud storageから画像を削除
            firebase_db.delete_image_from_storage(user.UserID, locationid)
            # セッションからマーカーを削除
            session["lat"], session["lng"] = default_lat, default_lng
            session['marker_list'] = [m for m in session['marker_list'] if m['locationid'] != locationid]
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    else:
        return jsonify({'success': False, 'error': 'Location ID is required'})


@app.route('/view-map', methods=['GET', 'POST'])
def view_map():
    session["lat"], session["lng"] = default_lat, default_lng
    # デフォルトの緯度と経度をセッションに設定
    if request.method == 'POST':
        # フォームの種類を取得
        form_type = request.form.get('form_type')
        if form_type == 'search_location':
            # ユーザーが入力した場所名から緯度と経度を検索
            location = request.form.get('location')
            lat_lng = get_lat_lng(location) if location else (default_lat, default_lng)
            # セッションに緯度と経度を保存
            session["lat"], session["lng"] = lat_lng if lat_lng else (default_lat, default_lng)


    # パラメーターからユーザーIDを読み取る
    view_user_id = request.args.get('user_id', default=None)

    if view_user_id:
        # 指定されたユーザーIDのマーカーリストを取得
        marker_list = firebase_db.get_allmarker_from_firestore(view_user_id)
    else:
        # ユーザーIDがない場合
        return "User ID is Invalid", 400

    # ビュー専用マップページをレンダリング
    return render_template("view-map.html", marker_list=marker_list)


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)