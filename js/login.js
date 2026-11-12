// Login do painel (Firebase Authentication — e-mail e senha).
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const $ = (id) => document.getElementById(id);
const msg = (t, ok) => { $("msg").textContent = t; $("msg").classList.toggle("ok", !!ok); };

const ERR = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
  "auth/operation-not-allowed": "Login por e-mail/senha não está ativado no Firebase.",
  "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase Authentication."
};

onAuthStateChanged(auth, (u) => { if (u) location.replace("index.html?edit=1"); });

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg(""); $("go").disabled = true; $("go").textContent = "Entrando…";
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("pass").value);
  } catch (err) {
    msg(ERR[err.code] || "Não foi possível entrar (" + (err.code || err.message) + ").");
    $("go").disabled = false; $("go").textContent = "Entrar";
  }
});

$("reset").addEventListener("click", async () => {
  const email = $("email").value.trim();
  if (!email) return msg("Digite seu e-mail acima e clique novamente.");
  try { await sendPasswordResetEmail(auth, email); msg("Enviamos um link para redefinir a senha.", true); }
  catch (err) { msg(ERR[err.code] || "Não foi possível enviar o e-mail."); }
});
