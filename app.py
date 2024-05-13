from flask import Flask
from flask import render_template , request
from flask import render_template , request, jsonify
from src.User import User

app = Flask(__name__)
User = User()


@app.route('/', methods=['GET'])
def login():
    if request.method == 'GET':
        User.UserEmail =  None
        User.UserID =  None
        return render_template(
        'login.html'
    )
    else:
        return render_template(
            'login.html'
        )


@app.route('/toMyMap', methods=['GET','POST'])
def toMyMap():
    if request.method == 'GET':
        if User.UserEmail !=  None and User.UserID !=  None:
            return render_template(
                'mymap.html', UserEmail=User.UserEmail, UserID=User.UserID
            )
        else:
            return render_template(
            'login.html'
            )
    else:
        UserData = request.json
        print(type(UserData))
        User.UserEmail = UserData['User']['email']
        User.UserID = UserData['User']['uid']
        return jsonify({'message': 'Data received by Python'})

@app.route('/CreateAccount', methods=['GET','POST'])
def CreateAccount():
    return render_template(
        'createAccount.html'
    )

if __name__ == "__main__":
    app.run(debug=True)