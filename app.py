from flask import Flask
from flask import render_template , request

app = Flask(__name__)

@app.route('/')
def login():
    return render_template(
        'login.html'
    )

@app.route('/mymap')
def mymap():
    return render_template(
        'mymap.html'
    )
    
if __name__ == "__main__":
    app.run(debug=True)