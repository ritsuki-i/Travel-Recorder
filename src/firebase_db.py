import os

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials
from firebase_admin import firestore,storage
import json
import datetime

from .User import User

# ===================== Firebase =====================================
# このPythonファイルと同じ階層に認証ファイル(秘密鍵)を配置して、ファイル名を格納
#githubから見えないようにするためのもの


load_dotenv()
firebase_api_key = json.loads(os.getenv("FIREBASE_API_KEY"))


# Firebase初期化
cred = credentials.Certificate(firebase_api_key)
firebase_admin.initialize_app(cred)
db = firestore.client()
# ====================================================================


collectionName="name" #'name'-->コレクション名
colectionLocate="location" # 'location'-->サブコレクション名
docs_list = [] #<-マップマーカー用辞書のリスト




#Cloud Firestoreのコレクションに個人のデータを格納
def setUser(User):
    doc_ref=db.collection(collectionName).document(User.UserID)
    doc_ref.set({
        u'Email': User.UserEmail,
        u'Id': User.UserID
    })
    
#Cloud Firestoreのサブコレクションにマーカー情報を格納
def save_marker_to_firestore(marker_info,userID,locationid):
    db = firestore.client()
    markers_ref = db.collection(collectionName).document(str(userID)).collection(colectionLocate).document(str(locationid))  

    # マーカー情報をFirestoreに保存
    markers_ref.set({
        'label': marker_info['label'],
        'lat': marker_info['lat'],
        'lng': marker_info['lng'],
        'description': marker_info['description'],
        'date':marker_info['date'],
        'locationid':str(marker_info['locationid'])
    })
    
#Cloud Firestoreのサブコレクションにある全てのドキュメントの情報をすべて取得
def get_allmarker_from_firestore(Id):
    docs = db.collection(collectionName).document(Id).collection(colectionLocate).stream()
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

#ex
User=User()
User.UserID="15822096" #<-自動で割当？ 

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