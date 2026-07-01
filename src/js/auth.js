console.log("auth.js 読み込み成功");
/* ===========================
新規登録
=========================== */

async function signUp() {
  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("登録しました。メール認証してください。");
}
/* ===========================
ログイン
=========================== */

async function login() {
  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  await checkLogin();
}
/* ===========================
ログアウト
=========================== */

async function logout() {
  await supabaseClient.auth.signOut();

  location.reload();
}
/* ===========================
             ログイン確認
          =========================== */

async function checkLogin() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    document.getElementById("authArea").classList.remove("hidden");

    document.getElementById("appArea").classList.add("hidden");

    return;
  }

  document.getElementById("authArea").classList.add("hidden");

  document.getElementById("appArea").classList.remove("hidden");

  document.getElementById("userInfo").innerHTML = session.user.email;

  initMap();

  await loadLogs();

  //startTracking();

  await initBackgroundGPS();
}
window.login = login;
window.logout = logout;
window.checkLogin = checkLogin;
window.signUp = signUp;
