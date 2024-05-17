from flask import Flask, redirect, render_template, request, session, url_for, jsonify
from flask_session import Session
from src import firebase_db
from src.User import User
from src.lat_lng_finder import get_lat_lng
import datetime
import os
from dotenv import load_dotenv
import json
from google.api_core.datetime_helpers import DatetimeWithNanoseconds

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
user = User()

# .env ファイルを読み込む
load_dotenv()
GOOGLE_MAP_KEY = os.getenv('GOOGLE_MAP_KEY')

try:
    with open("/etc/secrets/loginapi.json", 'r') as file:
        JSON_PATH = "/etc/secrets/loginapi.json"
except FileNotFoundError:
    #discordからダウンロードしてね♡
    JSON_PATH = "./static/js/loginapi.json"
loginapi_json = open(JSON_PATH, 'r')
loginapi_json_value = json.load(loginapi_json)

# デフォルトの緯度と経度を設定
default_lat = 35.6764
default_lng = 139.6500


@app.route('/', methods=['GET'])
def login():
    user.UserEmail =  None
    user.UserID =  None
    return render_template(
        'login.html', loginapi_json_value = loginapi_json_value
    )



@app.route('/toMyMap', methods=['GET','POST'])
def toMyMap():
    if request.method == 'GET':
        if user.UserEmail !=  None and user.UserID !=  None:
            session["user_id"] = user.UserID
            session["user_email"] = user.UserEmail
            return redirect('/my-map')
        else:
            return render_template(
                'login.html',loginapi_json_value=loginapi_json_value
            )
    else:
        userData = request.json
        user.UserEmail = userData['User']['email']
        user.UserID = userData['User']['uid']
        return jsonify({'message': 'Success'})
    

# static/js/map.js, templates/mymap.html, src/lat_lng_finder.py, app.pyのmap_page()を追加
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

        elif form_type == 'submit_location':
            # ユーザーがフォームに入力した緯度、経度、名前、説明を取得
            lat, lng = request.form.get('lat'), request.form.get('lng')
            label = request.form.get('label')
            description = request.form.get('description')
            date = datetime.datetime.now()
            ts = datetime.datetime.timestamp(date)
            locationid = "fake id" #ここ変える
            map_marker = {"label": label, "lat": float(lat), "lng": float(lng), "description": description, 'date': ts, 'locationid': locationid}
            # Firestoreにマーカー情報を保存
            firebase_db.save_marker_to_firestore(map_marker, user.UserID, locationid)

            # セッションにマーカー情報を保存
            session["lat"], session["lng"] = lat, lng
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
                'login.html',loginapi_json_value = loginapi_json_value
            )
    data = {
        "google_map_key": GOOGLE_MAP_KEY,
        "loginapi_json_value": loginapi_json_value
    }

    lat = session.get("lat", default_lat)
    lng = session.get("lng", default_lng)
    marker_list = session.get("marker_list", [])

    # マップページをレンダリング
    return render_template("mymap.html", data=json.dumps(data), lat=lat, lng=lng, marker_list=marker_list) 

@app.route('/CreateAccount', methods=['GET','POST'])
def CreateAccount():
    return render_template(
        'createAccount.html',loginapi_json_value=loginapi_json_value
    )

@app.template_filter('get_date_time')
def get_date_time(ts):
    # タイムスタンプを日付と時刻に変換
    if ts and (type(ts) is float or type(ts) is DatetimeWithNanoseconds):
        time = datetime.datetime.fromtimestamp(ts if type(ts) is float else ts.timestamp())
        return time.strftime("%Y/%m/%d, %H:%M:%S")
    else:
        return "Not Available"
    
@app.route('/ChangePassword', methods=['GET','POST'])
def ChangePassword():
    return render_template(
        'ChangePassword.html',loginapi_json_value=loginapi_json_value
    )

@app.route('/logout', methods=['POST'])
def logout():
    # セッションの全てのキーを削除
    for key in list(session.keys()):
        session.pop(key)
    # ログインページにリダイレクト
    return redirect(url_for('login'))

if __name__ == "__main__":
    app.run(debug=True)