import os

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials
from firebase_admin import firestore,storage
import json
import datetime

from src.user import User

# ===================== Firebase =====================================
# このPythonファイルと同じ階層に認証ファイル(秘密鍵)を配置して、ファイル名を格納
#githubから見えないようにするためのもの


load_dotenv()
firebase_api_key = json.loads(os.getenv("FIREBASE_API_KEY"))
firebase_storageBucket=json.loads(os.getenv("FIREBASE_STORAGEBUCKET"))


# Firebase初期化
cred = credentials.Certificate(firebase_api_key)

# Firebaseアプリの初期化
firebase_admin.initialize_app(cred, firebase_storageBucket)

db = firestore.client()
bucket = storage.bucket()
# ====================================================================


collectionName="name" #'name'-->コレクション名
colectionLocate="location" # 'location'-->サブコレクション名
 #<-マップマーカー用辞書のリスト

#Cloud Firestoreのコレクションに個人のデータを格納
def setUser(User):
    doc_ref=db.collection(collectionName).document(User.UserID)
    doc_ref.set({
        u'Email': User.UserEmail,
        u'Id': User.UserID
    })
    
#Cloud Firestoreのサブコレクションにマーカー情報を格納
def save_marker_to_firestore(marker_info, userId, locationid):
    markers_ref = db.collection(collectionName).document(str(userId)).collection(colectionLocate).document(str(locationid))
    markers_ref.set({
        'label': marker_info['label'],
        'lat': marker_info['lat'],
        'lng': marker_info['lng'],
        'description': marker_info['description'],
        'date': marker_info['date'],
        'locationid': str(marker_info['locationid'])
    })
    
#Firestorageにimageをアップロードしてurlを返す
def upload_image_to_storage(user_id, location_id, image_file):
    blob = bucket.blob(f"{user_id}/{location_id}/{image_file.filename}")
    blob.upload_from_file(image_file)
    blob.make_public()
    print('File uploaded successfully')
    return blob.public_url

# Function to save marker and image to Firestore
def save_marker_to_firestore_with_image(marker_info, user_id, location_id, image_files):
    image_urls = []
    for image_file in image_files:
        print(type(image_file))
        image_url = upload_image_to_storage(user_id, location_id, image_file)
        image_urls.append(image_url)
        
    # marker_infoのUUIDオブジェクトを文字列に変換
    marker_info['locationid'] = str(marker_info['locationid'])
    marker_info['image_urls'] = image_urls
    markers_ref = db.collection(collectionName).document(str(user_id)).collection(colectionLocate).document(str(location_id))
    markers_ref.set(marker_info)

  
#Cloud Firestoreのサブコレクションにある全てのドキュメントの情報をすべて取得
def get_allmarker_from_firestore(Id):
    docs = db.collection(collectionName).document(Id).collection(colectionLocate).stream()
    docs_list = []
    for doc in docs:
        #Firestoreから取得したドキュメントを辞書のリストとして格納
        docs_list.append(doc.to_dict())
        #print(f"{doc.id} => {doc.to_dict()}")
    return docs_list  #全てのドキュメントの情報を辞書のリスト形式で返す
        
#Cloud Firestoreのサブコレクションにある各ドキュメントの情報をすべて取得
def get_marker_from_firestore(Id):
    doc_ref = db.collection(collectionName).document(Id).collection(colectionLocate).stream()
    doc = doc_ref.get()
    if doc.exists:
        print(f"Document data: {doc.to_dict()}")
        return doc.to_dict #ドキュメントの情報を辞書形式で返す
    else:
        print("No such document!")

def delete_marker_from_firestore(Id, LocationId):
    doc = db.collection(collectionName).document(Id).collection(colectionLocate).document(LocationId)
    res = doc.delete()
    if res:
        print("Deleted")
    else:
        print("No such document!")

#Firestorageからimageをデリート
def delete_image_from_storage(user_id, location_id):
    blobs = bucket.list_blobs(prefix=f"{user_id}/{location_id}/")
    for blob in blobs:
        blob.delete()
        print(f'File {blob.name} deleted successfully')
    


#ex
User=User()
User.UserID="15822096" #<-自動で割当(uuid)

User.UserEmail="15822097@aoyama.jp"

Lname="Shinjuku"
lat=135
lng=68
description="hitoippai"
date = datetime.datetime.now()
ts = datetime.datetime.timestamp(date)
LocationId="IZ0JM1G5m8bHOWLCNgP7"
#マップマーカーの辞書

marker= {"label": Lname, "lat": lat, "lng": lng, "description": description, "date":ts,"locationid":LocationId}


#setUser(User)
#save_marker_to_firestore(marker,User.UserID,LocationId)
#get_allmarker_to_firestore(User.UserID)
#get_marker_from_firestore(User.UserID)