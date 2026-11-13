// Prepara imagens para serem gravadas como texto (base64 / data URL) no Firestore.
// Tudo acontece em segundo plano: o usuário escolhe a foto e o sistema ajusta o peso sozinho.

// Limites (em caracteres do data URL). O Firestore aceita 1 MiB por documento;
// ficamos bem abaixo disso e mantemos o site leve para quem visita.
export const IMG = {
  product: { maxSide: 720, budget: 110000 },   // foto do card do módulo
  site:    { maxSide: 900, budget: 200000 }    // logo e imagens dos destaques
};

let webpOk = null;
function supportsWebp() {
  if (webpOk === null) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webpOk = c.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpOk;
}

async function decode(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { /* tenta o método clássico */ }
  }
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => { URL.revokeObjectURL(u); res(i); };
    i.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Não foi possível ler essa imagem. Tente JPG, PNG ou WebP.")); };
    i.src = u;
  });
}

const tick = () => new Promise((r) => setTimeout(r, 0)); // deixa a animação respirar

// Reduz dimensões e qualidade, só o necessário, até caber no orçamento.
export async function compressImage(file, { maxSide, budget }) {
  if (!file) throw new Error("Nenhuma imagem escolhida.");
  const img = await decode(file);
  const w = img.width, h = img.height;
  if (!w || !h) throw new Error("Imagem inválida.");

  const type = supportsWebp() ? "image/webp" : "image/jpeg";   // webp mantém transparência (logos)
  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];
  let side = Math.min(maxSide, Math.max(w, h));

  while (side >= 260) {
    const k = Math.min(1, side / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    for (const q of qualities) {
      const url = c.toDataURL(type, q);
      if (url.length <= budget) { if (img.close) img.close(); return url; }
      await tick();
    }
    side = Math.round(side * 0.8);
  }
  if (img.close) img.close();
  throw new Error("Não foi possível reduzir essa imagem. Tente outra foto.");
}

// Evita que uma gravação fique "pendurada" para sempre se a conexão cair.
export function withTimeout(promise, ms = 25000) {
  let t;
  const limit = new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error("A conexão está lenta. Tente novamente."), { code: "timeout" })), ms); });
  return Promise.race([promise, limit]).finally(() => clearTimeout(t));
}
