// Site público: lê tudo do Firestore em tempo real (com fallback para os dados padrão).
// Com ?edit=1 carrega o painel de edição (admin.js).
import { db } from "./firebase-config.js";
import { doc, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { PRODUCTS as DEF_PRODUCTS, REVIEWS as DEF_REVIEWS, SHOW, WA_PATH, BASE_CATS, DEFAULT_CONTACT } from "./defaults.js";
import { modSvg } from "./illustrations.js";
import { prepare, score, norm } from "./search.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const store = {
  editing: new URLSearchParams(location.search).get("edit") === "1",
  content: { texts: {}, images: {}, seeded: false, whatsapp: DEFAULT_CONTACT.whatsapp, phoneDisplay: DEFAULT_CONTACT.phoneDisplay },
  pending: {},          // textos editados ainda não salvos (preservados quando chega um snapshot)
  products: [],
  reviews: [],
  loaded: { content: false, produtos: false, avaliacoes: false },
  error: null,
  onRendered: null
};

const state = { q: "", cat: "Todos" };
const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

/* ---------- dados efetivos ---------- */
function getProducts() {
  const list = store.content.seeded
    ? store.products
    : DEF_PRODUCTS.map((p) => ({ ...p, id: null, photo: "" }));
  return list.map((p) => prepare({ ...p }));
}
function getReviews() {
  return store.content.seeded
    ? store.reviews
    : DEF_REVIEWS.map((r) => ({ id: null, t: r[0], n: r[1], r: r[2] }));
}
function getCats(list) {
  const extras = [...new Set(list.map((p) => p.t).filter(Boolean))].filter((c) => !BASE_CATS.includes(c));
  return ["Todos", ...BASE_CATS, ...extras];
}
export function waLink(msg) {
  return "https://wa.me/" + store.content.whatsapp + "?text=" + encodeURIComponent(msg);
}

/* ---------- renderização ---------- */
function applyTexts() {
  const t = store.content.texts || {};
  $$("[data-edit]").forEach((el) => {
    const k = el.dataset.edit;
    if (t[k] !== undefined && document.activeElement !== el && el.textContent !== t[k]) el.textContent = t[k];
  });
}

function renderImages() {
  const imgs = store.content.images || {};
  $$("img[data-img]").forEach((img) => {
    const url = imgs[img.dataset.img] || img.dataset.def;
    if (img.getAttribute("src") !== url) { img.classList.remove("broken"); img.setAttribute("src", url); }
    if (!img.dataset.bound) {
      img.dataset.bound = "1";
      img.addEventListener("error", () => img.classList.add("broken"));
      img.addEventListener("load", () => img.classList.remove("broken"));
    }
  });
}

let showSig = null;
function renderShowcase() {
  const imgs = store.content.images || {};
  const sig = SHOW.map((_, i) => imgs["show_" + i] || "").join("|");
  if (sig === showSig) return;
  showSig = sig;
  $("#showcase").innerHTML = SHOW.map((s, i) => {
    const custom = imgs["show_" + i];
    const media = custom ? `<img class="mod" src="${esc(custom)}" alt="${esc(s[1])}" loading="lazy">` : modSvg(s[0]);
    return `<div class="tile"><div class="tile-media" data-img="show_${i}">${media}</div><b data-edit="show_${i}_t">${esc(s[1])}</b><small data-edit="show_${i}_s">${esc(s[2])}</small></div>`;
  }).join("");
}

function renderContact() {
  const c = store.content;
  $$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
  $("#waBtn").href = waLink("Olá! Vim pelo site da Módulo Center.");
  $("#waFloat").href = waLink("Olá! Vim pelo site da Módulo Center e gostaria de atendimento.");
  $("#phoneNum").textContent = c.phoneDisplay;
  $$(".wa-path").forEach((p) => p.setAttribute("d", WA_PATH));
}

function renderCats(all) {
  const cats = getCats(all);
  if (!cats.includes(state.cat)) state.cat = "Todos";
  $("#cats").innerHTML = cats.map((c) => `<button type="button" aria-pressed="${c === state.cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
}

function renderGrid(all) {
  const tokens = norm(state.q).split(" ").filter(Boolean);
  const list = all
    .map((p, i) => ({ p, i, s: tokens.length ? score(p, tokens) : 1 }))
    .filter((x) => x.s > 0 && (state.cat === "Todos" || x.p.t === state.cat))
    .sort((a, b) => b.s - a.s || a.i - b.i);

  $("#clear").hidden = !state.q;
  const txt = list.length + (list.length === 1 ? " módulo encontrado" : " módulos encontrados");
  $("#count").textContent = state.q ? `${txt} para "${state.q.trim()}"` : txt;

  const addCard = store.editing
    ? '<article class="card add"><div class="add-inner"><span>＋</span><b>Adicionar módulo</b></div></article>'
    : "";

  if (!list.length) {
    const msg = "Olá! Procuro um módulo" + (state.q ? ": " + state.q.trim() : "") + ". Vocês têm disponível?";
    $("#grid").innerHTML = `<div class="empty"><h3>Não achamos esse módulo no catálogo</h3><p>Ele pode estar disponível mesmo assim. Envie o código ou o modelo e o ano do veículo que verificamos para você.</p><a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(msg)}"><svg class="wi" viewBox="0 0 24 24" aria-hidden="true"><path d="${WA_PATH}"/></svg>Consultar no WhatsApp</a></div>` + addCard;
    return;
  }
  $("#grid").innerHTML = list.map(({ p }) => {
    const m = `Olá! Tenho interesse no módulo ${p.n} (código ${p.c}). Pode me passar valor e disponibilidade?`;
    const media = p.photo ? `<img class="mod" src="${esc(p.photo)}" alt="${esc(p.n)}" loading="lazy">` : modSvg(p.t);
    return `<article class="card"${p.id ? ` data-id="${esc(p.id)}"` : ""}><div class="media"><span class="tag">${esc(p.t)}</span>${media}</div><div class="body"><h3>${esc(p.n)}</h3><span class="code">${esc(p.c)}</span><p class="veh">${esc(p.v)}</p><a class="btn btn-red btn-sm" target="_blank" rel="noopener" href="${waLink(m)}">Pedir orçamento</a></div></article>`;
  }).join("") + addCard;
}

function renderReviews() {
  const list = getReviews();
  $("#avaliacoes").hidden = !list.length && !store.editing;
  const html = (hidden) => list.map((r) =>
    `<figure class="rev"${hidden ? ' aria-hidden="true"' : ""}${!hidden && r.id ? ` data-id="${esc(r.id)}"` : ""}><div class="stars" role="img" aria-label="5 estrelas">${star.repeat(5)}</div><p>${esc(r.t)}</p><footer><b>${esc(r.n)}</b>${esc(r.r)}</footer></figure>`
  ).join("");
  const track = $("#track");
  if (store.editing) {
    track.innerHTML = html(false) + '<figure class="rev add"><div class="add-inner"><span>＋</span><b>Adicionar avaliação</b></div></figure>';
  } else {
    track.innerHTML = html(false) + html(true);
    track.style.animationDuration = Math.max(24, list.length * 10) + "s";
  }
}

function renderAll() {
  const all = getProducts();
  renderShowcase();
  renderCats(all);
  renderGrid(all);
  renderReviews();
  renderContact();
  renderImages();
  applyTexts();
  if (store.onRendered) store.onRendered();
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; renderAll(); });
}

/* ---------- Firestore em tempo real ---------- */
onSnapshot(doc(db, "site", "content"), (snap) => {
  const d = snap.exists() ? snap.data() : {};
  store.content = {
    texts: { ...(d.texts || {}), ...store.pending },
    images: d.images || {},
    seeded: !!d.seeded,
    whatsapp: d.whatsapp || DEFAULT_CONTACT.whatsapp,
    phoneDisplay: d.phoneDisplay || DEFAULT_CONTACT.phoneDisplay
  };
  store.loaded.content = true;
  schedule();
}, (err) => { console.warn("Firestore (site/content):", err); store.error = err; store.loaded.content = true; schedule(); });

onSnapshot(query(collection(db, "produtos"), orderBy("ordem")), (snap) => {
  store.products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  store.loaded.produtos = true;
  schedule();
}, (err) => { console.warn("Firestore (produtos):", err); store.error = err; });

onSnapshot(query(collection(db, "avaliacoes"), orderBy("ordem")), (snap) => {
  store.reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  store.loaded.avaliacoes = true;
  schedule();
}, (err) => { console.warn("Firestore (avaliacoes):", err); store.error = err; });

/* ---------- interações ---------- */
$("#q").addEventListener("input", (e) => { state.q = e.target.value; renderGrid(getProducts()); });
$("#clear").addEventListener("click", () => { $("#q").value = ""; state.q = ""; renderGrid(getProducts()); $("#q").focus(); });
$$(".chip").forEach((c) => c.addEventListener("click", () => { $("#q").value = c.dataset.q; state.q = c.dataset.q; renderGrid(getProducts()); }));
$("#cats").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  state.cat = b.dataset.cat;
  renderCats(getProducts());
  renderGrid(getProducts());
});
$("#copyPhone").addEventListener("click", function () {
  const btn = this, el = $("#phoneNum");
  const done = () => { btn.textContent = "Copiado"; setTimeout(() => (btn.textContent = "Copiar número"), 1800); };
  const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Número selecionado"; };
  try { navigator.clipboard.writeText(store.content.phoneDisplay).then(done, fallback); } catch (e) { fallback(); }
});

renderAll();

if (store.editing) {
  import("./admin.js").then((m) => m.initAdmin(store)).catch((e) => console.error("Falha ao carregar o painel:", e));
}
