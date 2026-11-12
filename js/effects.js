// Animações: elementos surgem ao rolar, barra de progresso e reveal dos cards gerados dinamicamente.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const SEL = [
  ".hero-text > *", ".logo-hero", ".showcase .tile",
  ".intro .eyebrow", ".intro h2", ".pillar",
  ".catalog .head > *", ".search", ".tryrow", ".cats", ".count", "#grid > *",
  ".why .eyebrow", ".why h2", ".story", ".reasons li",
  ".reviews .eyebrow", ".reviews h2", ".marquee",
  ".contact .eyebrow", ".contact h2", ".contact .sub", ".channels",
  "footer.site > *"
].join(",");

const io = new IntersectionObserver((entries) => {
  const show = entries
    .filter((e) => e.isIntersecting || e.boundingClientRect.top < 0)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
  show.forEach((e, i) => {
    e.target.style.setProperty("--d", Math.min(i * 0.09, 0.55).toFixed(2) + "s");
    e.target.classList.add("in");
    io.unobserve(e.target);
  });
}, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });

function scan() {
  document.querySelectorAll(SEL).forEach((el) => {
    if (el.dataset.rv) return;
    el.dataset.rv = "1";
    el.classList.add("rv");
    io.observe(el);
  });
}

if (!reduce) {
  scan();
  let q = false;
  new MutationObserver(() => {
    if (q) return;
    q = true;
    requestAnimationFrame(() => { q = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
}

/* barra de progresso de rolagem */
const bar = document.createElement("div");
bar.className = "sp";
document.body.append(bar);
let tick = false;
function progress() {
  const h = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = "scaleX(" + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ")";
  tick = false;
}
addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(progress); } }, { passive: true });
progress();
