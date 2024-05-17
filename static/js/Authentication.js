import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

/*import firebaseConfig from "./loginapi.json" assert { type: "json" };*/

const firebaseConfig = window.firebaseConfig;
const app = initializeApp(firebaseConfig);

const provider_google = new GoogleAuthProvider();
const auth = getAuth(app);
auth.languageCode = "en";

const googleLogin = document.getElementById("login-google");
googleLogin?.addEventListener("click", function () {
  signInWithPopup(auth, provider_google)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      const dataToPython = { User: user, Token: token };

      fetch("/toMyMap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToPython),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Data from Python:", data);
          window.location.href = "/toMyMap";
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

const LoginEmail = document.getElementById("LoginEmail");
const LoginPass = document.getElementById("LoginPass");
const emailpassLogin = document.getElementById("login-emailpass");
emailpassLogin?.addEventListener("click", function () {
  signInWithEmailAndPassword(auth, LoginEmail.value, LoginPass.value)
    .then((userCredential) => {
      const user = userCredential.user;
      const token = userCredential.accessToken;
      const dataToPython = { User: user, Token: token };
      const emailVerified = user.emailVerified;

      if (emailVerified){
        fetch("/toMyMap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToPython),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Data from Python:", data);
            window.location.href = "/toMyMap";
          })
          .catch((error) => {
            alert(error);
            console.error("Error:", error);
          });
      } else {
        alert("メールアドレスの認証が完了しておりません");
      }
    })
    .catch((error) => {
      alert("パスワードが正しくありません");
      console.error("Error:", error);
    });
});

const inputEmail = document.getElementById("inputEmail");
const inputPass = document.getElementById("inputPass");
const CreateAccount = document.getElementById("CreateAccount");
CreateAccount?.addEventListener("click", function () {
  if (!inputEmail.value || !inputPass.value) {
    alert("空文字またはnullです");
  } else {
    createUserWithEmailAndPassword(auth, inputEmail.value, inputPass.value)
      .then((userCredential) => {
        sendEmailVerification(auth.currentUser)
          .then(() => {
            alert("メールアドレス確認用のメールを送信しました。承認してください。");
            window.location.href = "/";
          });
      })
      .catch((error) => {
        if (
          error.message ===
          "Firebase: Password should be at least 6 characters (auth/weak-password)."
        ) {
          alert("パスワードは6文字以上で設定してください");
        } else if (error.message === "Firebase: Error (auth/invalid-email).") {
          alert("存在しないメールアドレスです");
        } else if (
          error.message === "Firebase: Error (auth/email-already-in-use)."
        ) {
          alert("そのメールアドレスはすでに登録されています。");
        } else {
          alert(error.message);
          console.log(error.message);
        }
      });
  }
});


const ChangePassword = document.getElementById("ChangePassword");
ChangePassword?.addEventListener("click", function () {
  if (!inputEmail.value) {
    alert("メールアドレスが入力されていません");
  } else {
    sendPasswordResetEmail(auth, inputEmail.value)
    .then(() => {
      alert("パスワード変更のメールを送信しました。送信されたメールからパスワードを変更してください。");
    })
    .catch((error) => {
      alert("そのメールアドレスは登録されておりません。");
      console.error(error);
    });
  }
});

const Logout = document.getElementById("logout-btn");
Logout?.addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      window.location.href = "/";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

