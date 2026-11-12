// Botão "Administrador" + tela de login em modal (a URL nunca muda).
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { ADMIN_EMAILS } from "./admin-config.js";
import { store, schedule } from "./site.js";

const $ = (id) => document.getElementById(id);
const allowed = (email) => ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).includes(String(email || "").trim().toLowerCase());

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

/* ---------- modal ---------- */
const modal = document.createElement("div");
modal.className = "lg-overlay";
modal.hidden = true;
modal.innerHTML = `
  <form class="lg-card" id="lgForm" role="dialog" aria-modal="true" aria-labelledby="lgTitle" autocomplete="on">
    <button class="lg-x" id="lgClose" type="button" aria-label="Fechar">×</button>
    <div class="lg-lock" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
    </div>
    <p class="lg-eyebrow">Área restrita</p>
    <h2 id="lgTitle">Administrador</h2>
    <p class="lg-sub">Acesso exclusivo para quem gerencia o site.</p>
    <label>E-mail<input id="lgEmail" type="email" autocomplete="username" required placeholder="seu@email.com"></label>
    <label>Senha<span class="lg-pass"><input id="lgPass" type="password" autocomplete="current-password" required placeholder="••••••••"><button type="button" id="lgEye" aria-label="Mostrar senha">Mostrar</button></span></label>
    <button class="btn btn-red lg-go" id="lgGo" type="submit">Entrar</button>
    <button class="lg-link" id="lgReset" type="button">Esqueci minha senha</button>
    <p class="lg-msg" id="lgMsg" role="alert"></p>
  </form>`;
document.body.append(modal);

const msg = (t, ok) => { $("lgMsg").textContent = t; $("lgMsg").classList.toggle("ok", !!ok); };
const open = () => { modal.hidden = false; document.body.classList.add("lg-open"); msg(""); setTimeout(() => $("lgEmail").focus(), 30); };
const close = () => { modal.hidden = true; document.body.classList.remove("lg-open"); };
const resetBtn = () => { $("lgGo").disabled = false; $("lgGo").textContent = "Entrar"; };

let currentUser = null;
let entered = false;

async function enterEditMode() {
  if (entered) return;
  entered = true;
  close();
  store.editing = true;
  schedule();
  try {
    const m = await import("./admin.js");
    m.initAdmin(store);
  } catch (e) { console.error("Falha ao carregar o painel:", e); entered = false; store.editing = false; schedule(); }
}

onAuthStateChanged(auth, (u) => {
  currentUser = u && allowed(u.email) ? u : null;
  if (u && !currentUser) signOut(auth); // sessão de e-mail não autorizado
});

$("adminBtn").addEventListener("click", () => { if (currentUser) enterEditMode(); else open(); });
$("lgClose").addEventListener("click", close);
modal.addEventListener("mousedown", (e) => { if (e.target === modal) close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

$("lgEye").addEventListener("click", () => {
  const p = $("lgPass"), show = p.type === "password";
  p.type = show ? "text" : "password";
  $("lgEye").textContent = show ? "Ocultar" : "Mostrar";
});

$("lgForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("lgEmail").value.trim();
  msg("");
  if (!allowed(email)) { msg("Este e-mail não tem permissão de acesso."); return; }
  $("lgGo").disabled = true; $("lgGo").textContent = "Entrando…";
  try {
    const cred = await signInWithEmailAndPassword(auth, email, $("lgPass").value);
    if (!allowed(cred.user.email)) { await signOut(auth); msg("Este e-mail não tem permissão de acesso."); resetBtn(); return; }
    currentUser = cred.user;
    $("lgPass").value = "";
    resetBtn();
    enterEditMode();
  } catch (err) {
    msg(ERR[err.code] || "Não foi possível entrar (" + (err.code || err.message) + ").");
    resetBtn();
  }
});

$("lgReset").addEventListener("click", async () => {
  const email = $("lgEmail").value.trim();
  if (!email) return msg("Digite seu e-mail acima e clique novamente.");
  if (!allowed(email)) return msg("Este e-mail não tem permissão de acesso.");
  try { await sendPasswordResetEmail(auth, email); msg("Enviamos um link para redefinir a senha.", true); }
  catch (err) { msg(ERR[err.code] || "Não foi possível enviar o e-mail."); }
});
