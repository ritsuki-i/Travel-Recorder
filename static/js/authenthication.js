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
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

/*import firebaseConfig from "./loginapi.json" assert { type: "json" };*/
async function fetchFirebaseConfig() {
  try {
    const response = await fetch('/login-api-json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const firebaseConfig = await response.json();

    // Initialize Firebase
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

          fetch("/to-my-map", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToPython),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Data from Python:", data);
              window.location.href = "/to-my-map";
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });

    const LoginEmail = document.getElementById("login-email");
    const LoginPass = document.getElementById("login-pass");
    const emailpassLogin = document.getElementById("login-emailpass");
    emailpassLogin?.addEventListener("click", function () {
      signInWithEmailAndPassword(auth, LoginEmail.value, LoginPass.value)
        .then((userCredential) => {
          const user = userCredential.user;
          const token = userCredential.accessToken;
          const dataToPython = { User: user, Token: token };
          const emailVerified = user.emailVerified;

          if (emailVerified) {
            fetch("/to-my-map", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(dataToPython),
            })
              .then((response) => response.json())
              .then((data) => {
                console.log("Data from Python:", data);
                window.location.href = "/to-my-map";
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
    const guestLogin = document.getElementById("guest-account");
    guestLogin?.addEventListener("click", () => {
      signInAnonymously(auth)
        .then((userCredential) => {
          const user = userCredential.user;
          const userId = user.uid; // ユーザーIDの取得
          const userEmail = user.email || ""; // 匿名ユーザーの場合、メールアドレスはないかもしれません

          fetch("/to-my-map-guest", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ User: { uid: userId, email: userEmail } }),  // ユーザーIDとメールアドレスを送信
          })
            .then(response => {
              if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
              }
              return response.json();
            })
            .then(data => {
              console.log("Data from Python:", data);
              window.location.href = "/to-my-map";
            })
            .catch(error => {
              console.error("Error:", error);
              alert("An error occurred: " + error.message);
            });
        })
        .catch(error => {
          console.error("Error signing in anonymously:", error);
          alert("An error occurred during sign in: " + error.message);
        });
    });

    const inputEmail = document.getElementById("input-email");
    const inputPass = document.getElementById("input-pass");
    const createAccount = document.getElementById("create-account");
    createAccount?.addEventListener("click", function () {
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

    const ChangePassword = document.getElementById("change-password");
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
  } catch (error) {
    console.error('Error fetching Firebase config:', error);
  }
}

fetchFirebaseConfig();
