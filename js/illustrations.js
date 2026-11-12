// Ilustrações SVG dos módulos (usadas quando o módulo não tem foto).
// Os gradientes (#mcBody, #mcMetal, #mcConn) estão definidos no index.html.

function pins(x, y, cols, rows, gap) {
  let s = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<circle cx="${x + c * gap}" cy="${y + r * gap}" r="1.6" fill="#c9c9ce"/>`;
  return s;
}
function lug(x, y) { return `<circle cx="${x}" cy="${y}" r="5" fill="#0f0f12" stroke="#55555c" stroke-width="1.5"/>`; }
function label(x, y, w, txt) {
  return `<rect x="${x}" y="${y}" width="${w}" height="16" rx="2" fill="#f5f5f4"/><rect x="${x}" y="${y}" width="5" height="16" fill="#d90f26"/><text x="${x + 11}" y="${y + 11.5}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="#0a0a0b">${txt}</text>`;
}

export function modSvg(type) {
  const b = '<rect x="22" y="38" width="150" height="82" rx="9" fill="url(#mcBody)" stroke="#43434a" stroke-width="1.5"/>';
  let inner = "";
  if (type === "ABS") {
    inner = '<rect x="48" y="10" width="102" height="34" rx="5" fill="url(#mcMetal)" stroke="#8b8b93"/>' +
      '<circle cx="66" cy="27" r="7" fill="#1a1a1e" stroke="#c9c9ce" stroke-width="2"/><circle cx="90" cy="27" r="7" fill="#1a1a1e" stroke="#c9c9ce" stroke-width="2"/><circle cx="114" cy="27" r="7" fill="#1a1a1e" stroke="#c9c9ce" stroke-width="2"/><circle cx="138" cy="27" r="3.5" fill="#d90f26"/>' +
      b + lug(34, 50) + lug(34, 108) + lug(160, 108) +
      '<rect x="168" y="58" width="22" height="46" rx="3" fill="url(#mcConn)" stroke="#55555c"/>' + pins(174, 66, 2, 4, 9) + label(52, 66, 82, "ABS");
  } else if (type === "Injeção") {
    inner = '<rect x="22" y="30" width="150" height="90" rx="8" fill="url(#mcBody)" stroke="#43434a" stroke-width="1.5"/>';
    for (let i = 0; i < 6; i++) inner += `<line x1="34" x2="124" y1="${42 + i * 6}" y2="${42 + i * 6}" stroke="#4a4a52" stroke-width="1.5"/>`;
    inner += '<rect x="136" y="40" width="48" height="64" rx="3" fill="url(#mcConn)" stroke="#55555c"/>' + pins(144, 49, 5, 6, 8) + label(34, 94, 82, "ECU");
  } else if (type === "Airbag") {
    inner = '<rect x="38" y="30" width="118" height="92" rx="9" fill="url(#mcBody)" stroke="#43434a" stroke-width="1.5"/>' + lug(30, 40) + lug(164, 40) + lug(30, 112) + lug(164, 112) +
      '<rect x="72" y="104" width="50" height="20" rx="3" fill="url(#mcConn)" stroke="#55555c"/>' + pins(80, 110, 5, 1, 8) + pins(80, 117, 5, 1, 8) +
      '<circle cx="97" cy="62" r="17" fill="none" stroke="#d90f26" stroke-width="2.5"/><circle cx="97" cy="62" r="6" fill="#d90f26"/>' + label(56, 88, 82, "SRS");
  } else if (type === "Carroceria") {
    inner = '<rect x="22" y="26" width="150" height="86" rx="8" fill="url(#mcBody)" stroke="#43434a" stroke-width="1.5"/>' + lug(30, 36) + lug(164, 36) +
      '<rect x="34" y="104" width="56" height="26" rx="3" fill="url(#mcConn)" stroke="#55555c"/>' + pins(41, 111, 6, 2, 8) +
      '<rect x="104" y="104" width="56" height="26" rx="3" fill="url(#mcConn)" stroke="#55555c"/>' + pins(111, 111, 6, 2, 8) + label(40, 56, 82, "BCM");
  } else if (type === "Câmbio") {
    inner = '<rect x="22" y="30" width="150" height="90" rx="8" fill="url(#mcBody)" stroke="#43434a" stroke-width="1.5"/>' +
      '<rect x="60" y="12" width="74" height="24" rx="3" fill="url(#mcConn)" stroke="#55555c"/>' + pins(68, 19, 8, 2, 8) + lug(34, 42) + lug(160, 42);
    for (let j = 0; j < 4; j++) inner += `<line x1="116" x2="160" y1="${74 + j * 8}" y2="${74 + j * 8}" stroke="#4a4a52" stroke-width="1.5"/>`;
    inner += label(34, 78, 74, "TCU");
  } else if (type === "Direção") {
    inner = '<rect x="22" y="34" width="150" height="86" rx="8" fill="url(#mcBody)" stroke="#43434a" stroke-width="1.5"/>' + lug(34, 46) + lug(160, 108) +
      '<circle cx="132" cy="78" r="22" fill="url(#mcConn)" stroke="#8b8b93" stroke-width="2"/><circle cx="132" cy="78" r="12" fill="#0f0f12" stroke="#55555c"/><circle cx="132" cy="78" r="3.5" fill="#d90f26"/>' + label(34, 70, 66, "EPS");
  } else {
    // categoria personalizada: módulo genérico
    inner = '<rect x="22" y="34" width="150" height="86" rx="8" fill="url(#mcBody)" stroke="#43434a" stroke-width="1.5"/>' + lug(34, 46) + lug(160, 46) + lug(34, 108) + lug(160, 108) +
      '<rect x="110" y="56" width="50" height="46" rx="3" fill="url(#mcConn)" stroke="#55555c"/>' + pins(118, 65, 5, 4, 8) + label(34, 70, 66, "MOD");
  }
  return `<svg class="mod" viewBox="0 0 200 140" role="img" aria-label="Ilustração de módulo ${type}">${inner}</svg>`;
}
