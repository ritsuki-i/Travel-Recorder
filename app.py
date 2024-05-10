from flask import Flask, redirect, render_template, request

app = Flask(__name__)

@app.route('/', methods=['GET'])
def login():
    return render_template('login.html')
    

if __name__ == "__main__":
    app.run(host='0.0.0.0')