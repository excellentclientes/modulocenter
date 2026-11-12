// Busca tolerante: ignora acentos, aceita código sem traço e 1 erro de digitação.

export function norm(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function lev(a, b) {
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

export function prepare(p) {
  p.codeN = norm(p.c);
  p.nameN = norm(`${p.n} ${p.t}`);
  p.vehN = norm(p.v);
  p.synN = norm(p.s);
  p.all = `${p.codeN} ${p.nameN} ${p.vehN} ${p.synN}`;
  p.compact = p.all.replace(/ /g, "");
  p.words = p.all.split(" ");
  return p;
}

export function score(p, tokens) {
  let total = 0;
  for (const t of tokens) {
    let s = 0;
    if (p.codeN.includes(t)) s = 10;
    else if (p.nameN.includes(t)) s = 6;
    else if (p.vehN.includes(t)) s = 5;
    else if (p.synN.includes(t)) s = 3;
    else if (t.length > 3 && p.compact.includes(t)) s = 8;
    else if (t.length > 3) {
      for (const w of p.words) {
        if (Math.abs(w.length - t.length) <= 1 && lev(t, w) <= 1) { s = 1; break; }
      }
    }
    if (!s) return 0;
    total += s;
  }
  return total;
}
