// Botão "Administrador" + login exclusivo com Google, em modal (a URL nunca muda).
import { auth } from "./firebase-config.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { ADMIN_EMAILS } from "./admin-config.js";
import { store, schedule } from "./site.js";

const $ = (id) => document.getElementById(id);
const norm = (e) => String(e || "").trim().toLowerCase();
const emailOk = (email) => ADMIN_EMAILS.map(norm).includes(norm(email));
// Só vale sessão feita pelo Google E com e-mail liberado.
const userOk = (u) => !!u && emailOk(u.email) && u.providerData.some((p) => p.providerId === "google.com");

const ERR = {
  "auth/popup-closed-by-user": "Login cancelado. Tente novamente.",
  "auth/cancelled-popup-request": "Login cancelado. Tente novamente.",
  "auth/popup-blocked": "O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.",
  "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
  "auth/operation-not-allowed": "O login com Google não está ativado no Firebase (Authentication → Método de login).",
  "auth/unauthorized-domain": "Acesso não autorizado."
};

/* ---------- modal ---------- */
const modal = document.createElement("div");
modal.className = "lg-overlay";
modal.hidden = true;
modal.innerHTML = `
  <div class="lg-card" role="dialog" aria-modal="true" aria-labelledby="lgTitle">
    <button class="lg-x" id="lgClose" type="button" aria-label="Fechar">×</button>
    <div class="lg-lock" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
    </div>
    <p class="lg-eyebrow">Área restrita</p>
    <h2 id="lgTitle">Administrador</h2>
    <p class="lg-sub">Entre com a conta Google autorizada para gerenciar o site.</p>
    <button class="lg-google" id="lgGoogle" type="button">
      <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      <span id="lgGoogleTxt">Entrar com Google</span>
    </button>
    <p class="lg-msg" id="lgMsg" role="alert"></p>
  </div>`;
document.body.append(modal);

const msg = (t) => { $("lgMsg").textContent = t; };
const open = () => { modal.hidden = false; document.body.classList.add("lg-open"); msg(""); };
const close = () => { modal.hidden = true; document.body.classList.remove("lg-open"); };
const idle = () => { $("lgGoogle").disabled = false; $("lgGoogleTxt").textContent = "Entrar com Google"; };

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
  currentUser = userOk(u) ? u : null;
  if (u && !currentUser) signOut(auth); // sessão que não é do Google ou e-mail não autorizado
});

$("adminBtn").addEventListener("click", () => { if (currentUser) enterEditMode(); else open(); });
$("lgClose").addEventListener("click", close);
modal.addEventListener("mousedown", (e) => { if (e.target === modal) close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

$("lgGoogle").addEventListener("click", async () => {
  msg("");
  $("lgGoogle").disabled = true;
  $("lgGoogleTxt").textContent = "Aguardando o Google…";
  try {
    const provider = new GoogleAuthProvider();
    // já indica ao Google qual conta usar (a liberada), sem depender de escolher na lista
    provider.setCustomParameters({ login_hint: ADMIN_EMAILS[0] });
    // pequena pausa: evita que um toque duplo caia dentro da janela do Google
    await new Promise((r) => setTimeout(r, 500));
    const cred = await signInWithPopup(auth, provider);
    if (!userOk(cred.user)) {
      await signOut(auth);
      currentUser = null;
      msg("Acesso não autorizado.");
      idle();
      return;
    }
    currentUser = cred.user;
    idle();
    enterEditMode();
  } catch (err) {
    console.error("Login Google:", err.code || err);
    msg(ERR[err.code] || "Não foi possível entrar (" + (err.code || err.message) + ").");
    idle();
  }
});
