// Modo de edição ao vivo. Carregado por admin-login.js depois do login (a URL não muda).
// Só funciona com usuário autenticado; caso contrário volta ao site.
import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, collection, setDoc, deleteDoc, writeBatch, deleteField } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { PRODUCTS as DEF_PRODUCTS, REVIEWS as DEF_REVIEWS, BASE_CATS } from "./defaults.js";

const contentRef = () => doc(db, "site", "content");

/* ---------- utilitários de UI ---------- */
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "value") e.value = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, "");
    else e.setAttribute(k, v);
  }
  kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
}
const btn = (label, cls, onclick, extra = {}) => h("button", { type: "button", class: "ed-btn " + (cls || ""), onclick, ...extra }, label);

function toast(msg) {
  const t = h("div", { class: "ed-toast", role: "status" }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 4200);
}
function explain(e) {
  if (e && e.code === "permission-denied") return "Sem permissão para gravar. Confira as regras do Firestore/Storage e o UID do administrador (veja o README).";
  if (e && e.code === "unavailable") return "Sem conexão com o Firebase. Tente novamente.";
  return (e && e.message) || "Erro inesperado.";
}

function modal(title, content, buttons) {
  const ov = h("div", { class: "ed-ov" });
  const close = () => ov.remove();
  const box = h("div", { class: "ed-modal", role: "dialog", "aria-modal": "true", "aria-label": title },
    h("h3", {}, title), content, h("div", { class: "ed-actions" }, ...buttons(close)));
  ov.append(box);
  ov.addEventListener("mousedown", (e) => { if (e.target === ov) close(); });
  document.body.append(ov);
  return { close, box };
}
const field = (label, control, hint) => h("label", { class: "ed-field" }, h("span", {}, label), control, hint ? h("small", {}, hint) : null);

/* ---------- imagens ---------- */
function loadImage(file) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => { URL.revokeObjectURL(u); res(i); };
    i.onerror = () => rej(new Error("Não foi possível ler a imagem."));
    i.src = u;
  });
}
async function toBlob(file, max, quality, type) {
  const img = await loadImage(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * k));
  c.height = Math.max(1, Math.round(img.height * k));
  const ctx = c.getContext("2d");
  if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, type, quality));
}
const blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });

// Redimensiona e envia ao Storage. Se o Storage não estiver disponível,
// grava uma versão menor direto no Firestore (data URL).
async function uploadImage(file, folder) {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  const type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
  const blob = await toBlob(file, 1000, 0.85, type);
  const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  try {
    const r = ref(storage, `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
    await uploadBytes(r, blob, { contentType: blob.type });
    return await getDownloadURL(r);
  } catch (e) {
    console.warn("Storage indisponível, usando fallback no Firestore:", e);
    for (const [max, q] of [[640, 0.7], [480, 0.6], [360, 0.5]]) {
      const small = await toBlob(file, max, q, type);
      const url = await blobToDataURL(small);
      if (url.length <= 300000) { toast("Storage indisponível: imagem reduzida e salva no banco de dados."); return url; }
    }
    throw new Error("Não foi possível enviar a imagem. Ative o Firebase Storage (veja o README).");
  }
}
async function deleteStoredImage(url) {
  if (url && url.includes("firebasestorage")) { try { await deleteObject(ref(storage, url)); } catch (e) { /* já removida */ } }
}

/* ---------- painel ---------- */
export function initAdmin(store) {
  onAuthStateChanged(auth, (user) => {
    if (!user) { location.reload(); return; }
    start(store, user);
  });
}

let started = false;
function start(store, user) {
  if (started) return;
  started = true;

  const css = h("link", { rel: "stylesheet", href: "css/admin.css" });
  document.head.append(css);
  document.body.classList.add("editing");
  document.title = "Editando · Módulo Center";

  /* barra superior */
  const status = h("span", { class: "ed-status" }, "Tudo salvo");
  const bar = h("div", { class: "ed-bar" },
    h("strong", {}, "✎ Modo de edição"),
    status,
    h("span", { class: "ed-sp" }),
    btn("Salvar", "primary", () => save(), { "data-act": "save" }),
    btn("＋ Módulo", "", () => openProduct(null)),
    btn("＋ Avaliação", "", () => openReview(null)),
    btn("Configurações", "", () => openSettings()),
    btn("Ver site", "", () => location.reload()),
    btn("Sair", "", () => signOut(auth).then(() => location.reload())),
  );
  bar.setAttribute("title", user.email || "");
  document.body.prepend(bar);
  document.body.append(h("div", { class: "ed-hint" }, "Clique em qualquer texto para editar · clique em um módulo, avaliação ou imagem para alterar"));

  /* ----- salvar textos (autosave) ----- */
  let timer = null, saving = false;
  const setStatus = (t, warn) => { status.textContent = t; status.classList.toggle("warn", !!warn); };
  const pendingCount = () => Object.keys(store.pending).length;

  function queueSave() {
    clearTimeout(timer);
    setStatus(`${pendingCount()} alteração(ões) pendente(s)…`, true);
    timer = setTimeout(save, 1200);
  }
  async function save() {
    clearTimeout(timer);
    if (!pendingCount()) { setStatus("Tudo salvo"); return; }
    if (saving) { timer = setTimeout(save, 600); return; }
    saving = true;
    const batch = { ...store.pending };
    setStatus("Salvando…");
    try {
      await setDoc(contentRef(), { texts: batch }, { merge: true });
      for (const k of Object.keys(batch)) if (store.pending[k] === batch[k]) delete store.pending[k];
      setStatus(pendingCount() ? "Alterações pendentes…" : "Tudo salvo");
      if (pendingCount()) queueSave();
    } catch (e) {
      setStatus("Erro ao salvar", true);
      toast(explain(e));
    } finally { saving = false; }
  }

  /* ----- edição inline de textos ----- */
  function enhance() {
    document.querySelectorAll("[data-edit]").forEach((el) => {
      if (!el.hasAttribute("contenteditable")) { el.setAttribute("contenteditable", "true"); el.setAttribute("spellcheck", "false"); }
    });
    document.querySelectorAll("[data-img]").forEach((el) => el.setAttribute("title", "Clique para trocar a imagem"));
    checkSeed();
  }
  document.addEventListener("focusin", (e) => {
    const t = e.target.closest && e.target.closest("[data-edit]");
    if (t) t.dataset.before = t.textContent;
  });
  document.addEventListener("focusout", (e) => {
    const t = e.target.closest && e.target.closest("[data-edit]");
    if (!t) return;
    const before = t.dataset.before ?? "";
    const val = t.textContent.replace(/\s+/g, " ").trim();
    if (!val) { t.textContent = before; return; }   // não permite texto vazio
    t.textContent = val;                             // descarta formatação colada
    if (val !== before) {
      store.pending[t.dataset.edit] = val;
      store.content.texts[t.dataset.edit] = val;
      queueSave();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.closest && e.target.closest("[data-edit]")) { e.preventDefault(); e.target.blur(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    if (e.key === "Escape") { const ov = [...document.querySelectorAll(".ed-ov")].pop(); if (ov) ov.remove(); }
  });
  document.addEventListener("paste", (e) => {
    if (e.target.closest && e.target.closest("[data-edit]")) {
      e.preventDefault();
      document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s+/g, " "));
    }
  });
  window.addEventListener("beforeunload", (e) => { if (pendingCount()) { e.preventDefault(); e.returnValue = ""; } });

  /* ----- cliques: imagens, módulos, avaliações ----- */
  document.addEventListener("click", async (e) => {
    if (e.target.closest(".ed-bar, .ed-ov, .ed-toast")) return;
    if (e.target.closest("a, button")) e.preventDefault();   // desativa links/botões do site no modo de edição
    const imgEl = e.target.closest("[data-img]");
    if (imgEl) return openImage(imgEl.dataset.img);
    if (e.target.closest("#grid .card.add")) return openProduct(null);
    const card = e.target.closest("#grid .card");
    if (card) {
      if (!card.dataset.id) { if (await ensureSeeded()) toast("Catálogo importado. Clique no módulo novamente para editar."); return; }
      return openProduct(card.dataset.id);
    }
    if (e.target.closest(".rev.add")) return openReview(null);
    const rev = e.target.closest(".rev");
    if (rev) {
      if (!rev.dataset.id) { if (await ensureSeeded()) toast("Dados importados. Clique na avaliação novamente para editar."); return; }
      return openReview(rev.dataset.id);
    }
  }, true);

  /* ----- importação inicial ----- */
  let seedAsked = false;
  function checkSeed() {
    if (seedAsked || !store.loaded.content || store.content.seeded) return;
    seedAsked = true;
    setTimeout(async () => {
      if (store.content.seeded) return;
      if (confirm("Para editar módulos e avaliações, preciso importar o catálogo inicial para o Firebase (isso não apaga nada). Importar agora?")) await ensureSeeded();
    }, 300);
  }
  async function ensureSeeded() {
    if (store.content.seeded) return true;
    if (!store.loaded.content) { toast("Aguarde o carregamento do banco de dados."); return false; }
    if (!confirm("Importar o catálogo inicial para o Firebase para poder editar?")) return false;
    try {
      const b = writeBatch(db);
      DEF_PRODUCTS.forEach((p, i) => b.set(doc(collection(db, "produtos")), { n: p.n, c: p.c, v: p.v, t: p.t, s: p.s, photo: "", ordem: i }));
      DEF_REVIEWS.forEach((r, i) => b.set(doc(collection(db, "avaliacoes")), { t: r[0], n: r[1], r: r[2], ordem: i }));
      b.set(contentRef(), { seeded: true, whatsapp: store.content.whatsapp, phoneDisplay: store.content.phoneDisplay }, { merge: true });
      await b.commit();
      toast("Catálogo inicial importado.");
      return true;
    } catch (e) { toast(explain(e)); return false; }
  }

  /* ----- modal: imagem avulsa (logo / destaques) ----- */
  function openImage(key) {
    const label = key === "logo" ? "Logo" : "Imagem do destaque";
    const file = h("input", { type: "file", accept: "image/*", hidden: true });
    const info = h("p", { class: "ed-note" }, "Envie uma imagem (JPG, PNG ou WebP). Ela é redimensionada automaticamente.");
    file.addEventListener("change", async () => {
      const f = file.files[0]; if (!f) return;
      info.textContent = "Enviando…";
      try {
        const url = await uploadImage(f, "site");
        await setDoc(contentRef(), { images: { [key]: url } }, { merge: true });
        toast(label + " atualizada.");
        m.close();
      } catch (e) { info.textContent = explain(e); }
    });
    const m = modal(label, h("div", {}, info, file), (close) => [
      btn("Escolher imagem", "primary", () => file.click()),
      btn("Voltar ao padrão", "", async () => {
        try { await setDoc(contentRef(), { images: { [key]: deleteField() } }, { merge: true }); toast("Imagem padrão restaurada."); close(); }
        catch (e) { toast(explain(e)); }
      }),
      btn("Cancelar", "ghost", close)
    ]);
  }

  /* ----- modal: módulo ----- */
  const nextOrder = (list) => list.reduce((m, x) => Math.max(m, Number(x.ordem) || 0), -1) + 1;

  async function openProduct(id) {
    if (!(await ensureSeeded())) return;
    const p = id ? store.products.find((x) => x.id === id) : { n: "", c: "", v: "", t: BASE_CATS[0], s: "", photo: "", ordem: nextOrder(store.products) };
    if (!p) return toast("Módulo não encontrado.");
    let photo = p.photo || "";

    const fN = h("input", { type: "text", value: p.n, placeholder: "Ex.: Módulo ABS 4 canais" });
    const fC = h("input", { type: "text", value: p.c, placeholder: "Ex.: MC-ABS-1042" });
    const fV = h("input", { type: "text", value: p.v, placeholder: "Ex.: Gol G5, Voyage 2009–2016" });
    const cats = [...new Set([...BASE_CATS, ...store.products.map((x) => x.t).filter(Boolean)])];
    const dl = h("datalist", { id: "ed-cats" }, cats.map((c) => h("option", { value: c })));
    const fT = h("input", { type: "text", value: p.t, list: "ed-cats", placeholder: "Categoria" });
    const fS = h("input", { type: "text", value: p.s, placeholder: "Palavras extras para a busca (opcional)" });
    const fO = h("input", { type: "number", value: String(p.ordem ?? 0), step: "1" });

    const prev = h("img", { class: "ed-prev", alt: "" });
    const setPrev = () => { prev.style.display = photo ? "block" : "none"; if (photo) prev.src = photo; };
    setPrev();
    const file = h("input", { type: "file", accept: "image/*", hidden: true });
    const photoNote = h("small", {}, "A foto aparece no card do módulo. Sem foto, é usada a ilustração.");
    let busy = false, saveBtn;
    file.addEventListener("change", async () => {
      const f = file.files[0]; if (!f) return;
      busy = true; saveBtn.disabled = true; photoNote.textContent = "Enviando foto…";
      try { photo = await uploadImage(f, "produtos"); setPrev(); photoNote.textContent = "Foto enviada."; }
      catch (e) { photoNote.textContent = explain(e); }
      finally { busy = false; saveBtn.disabled = false; file.value = ""; }
    });

    const body = h("div", { class: "ed-form" },
      h("div", { class: "ed-photo" }, prev,
        h("div", {}, btn("Escolher foto", "", () => file.click()), btn("Remover foto", "ghost", () => { photo = ""; setPrev(); }), file, photoNote)),
      field("Nome", fN), field("Código", fC), field("Veículos compatíveis", fV),
      field("Categoria", fT), dl, field("Busca (extra)", fS),
      field("Posição na lista", fO, "Número menor aparece primeiro."));

    modal(id ? "Editar módulo" : "Novo módulo", body, (close) => {
      saveBtn = btn("Salvar módulo", "primary", async () => {
        if (busy) return;
        if (!fN.value.trim()) { fN.focus(); return toast("Informe o nome do módulo."); }
        const data = { n: fN.value.trim(), c: fC.value.trim(), v: fV.value.trim(), t: fT.value.trim() || "Outros", s: fS.value.trim(), photo, ordem: Number(fO.value) || 0 };
        try {
          const r = id ? doc(db, "produtos", id) : doc(collection(db, "produtos"));
          await setDoc(r, data, { merge: true });
          if (id && p.photo && p.photo !== photo) deleteStoredImage(p.photo);
          toast("Módulo salvo."); close();
        } catch (e) { toast(explain(e)); }
      });
      const acts = [saveBtn, btn("Cancelar", "ghost", close)];
      if (id) acts.push(btn("Excluir", "danger", async () => {
        if (!confirm(`Excluir "${p.n}"? Essa ação não pode ser desfeita.`)) return;
        try { await deleteDoc(doc(db, "produtos", id)); deleteStoredImage(p.photo); toast("Módulo excluído."); close(); }
        catch (e) { toast(explain(e)); }
      }));
      return acts;
    });
  }

  /* ----- modal: avaliação ----- */
  async function openReview(id) {
    if (!(await ensureSeeded())) return;
    const r = id ? store.reviews.find((x) => x.id === id) : { t: "", n: "", r: "", ordem: nextOrder(store.reviews) };
    if (!r) return toast("Avaliação não encontrada.");
    const fT = h("textarea", { rows: "4", value: r.t, placeholder: "Texto da avaliação" });
    const fN = h("input", { type: "text", value: r.n, placeholder: "Nome do cliente" });
    const fR = h("input", { type: "text", value: r.r, placeholder: "Ex.: Oficina mecânica" });
    const fO = h("input", { type: "number", value: String(r.ordem ?? 0), step: "1" });
    modal(id ? "Editar avaliação" : "Nova avaliação",
      h("div", { class: "ed-form" }, field("Texto", fT), field("Nome", fN), field("Cargo / tipo de cliente", fR), field("Posição", fO, "Número menor aparece primeiro.")),
      (close) => {
        const acts = [
          btn("Salvar avaliação", "primary", async () => {
            if (!fT.value.trim() || !fN.value.trim()) return toast("Preencha o texto e o nome.");
            try {
              const ref_ = id ? doc(db, "avaliacoes", id) : doc(collection(db, "avaliacoes"));
              await setDoc(ref_, { t: fT.value.trim(), n: fN.value.trim(), r: fR.value.trim(), ordem: Number(fO.value) || 0 }, { merge: true });
              toast("Avaliação salva."); close();
            } catch (e) { toast(explain(e)); }
          }),
          btn("Cancelar", "ghost", close)
        ];
        if (id) acts.push(btn("Excluir", "danger", async () => {
          if (!confirm("Excluir esta avaliação?")) return;
          try { await deleteDoc(doc(db, "avaliacoes", id)); toast("Avaliação excluída."); close(); } catch (e) { toast(explain(e)); }
        }));
        return acts;
      });
  }

  /* ----- modal: configurações ----- */
  function openSettings() {
    const c = store.content;
    const fW = h("input", { type: "tel", value: c.whatsapp, placeholder: "5511999999999" });
    const fP = h("input", { type: "text", value: c.phoneDisplay, placeholder: "(11) 99999-9999" });
    modal("Configurações de contato",
      h("div", { class: "ed-form" },
        field("WhatsApp (com DDI e DDD, só números)", fW, "Usado em todos os botões de orçamento. Ex.: 5511999999999"),
        field("Telefone exibido no rodapé", fP),
        h("p", { class: "ed-note" }, "Para trocar o logo ou as imagens dos destaques, clique nelas na página.")),
      (close) => [
        btn("Salvar", "primary", async () => {
          let digits = fW.value.replace(/\D/g, "");
          if (digits.length >= 10 && digits.length <= 11) digits = "55" + digits;
          if (digits.length < 12) return toast("Número inválido. Use DDI + DDD + número.");
          try { await setDoc(contentRef(), { whatsapp: digits, phoneDisplay: fP.value.trim() || c.phoneDisplay }, { merge: true }); toast("Contato atualizado."); close(); }
          catch (e) { toast(explain(e)); }
        }),
        btn("Cancelar", "ghost", close)
      ]);
  }

  store.onRendered = enhance;
  enhance();
}
