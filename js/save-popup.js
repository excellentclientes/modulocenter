// Pop-up elegante: "Salvando imagem" → check verde animado → "Imagem salva".
// Uso:  const pop = savingPopup();  ...  await pop.success();   ou   pop.fail("mensagem");
const SVG = {
  ring: '<svg class="sv-ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="sv-ring-bg" cx="32" cy="32" r="26"/><circle class="sv-ring-arc" cx="32" cy="32" r="26"/></svg>',
  ok:   '<svg class="sv-ok" viewBox="0 0 64 64" aria-hidden="true"><circle class="sv-ok-c" cx="32" cy="32" r="28"/><path class="sv-ok-p" d="M19 33.5l8.5 8.5L45 23.5"/></svg>',
  bad:  '<svg class="sv-bad" viewBox="0 0 64 64" aria-hidden="true"><circle class="sv-bad-c" cx="32" cy="32" r="28"/><path class="sv-bad-p" d="M23 23l18 18M41 23L23 41"/></svg>'
};

export function savingPopup({ saving = "Salvando imagem", done = "Imagem salva" } = {}) {
  const ov = document.createElement("div");
  ov.className = "sv-ov";
  ov.innerHTML = `
    <div class="sv-card" data-state="loading" role="alertdialog" aria-live="polite" aria-labelledby="svTitle">
      <div class="sv-icon">${SVG.ring}${SVG.ok}${SVG.bad}</div>
      <h4 class="sv-title" id="svTitle">${saving}</h4>
      <p class="sv-sub">Só um instante…</p>
      <button type="button" class="sv-close" hidden>Fechar</button>
    </div>`;
  document.body.append(ov);

  const card = ov.querySelector(".sv-card");
  const title = ov.querySelector(".sv-title");
  const sub = ov.querySelector(".sv-sub");
  const closeBtn = ov.querySelector(".sv-close");
  const started = Date.now();

  const remove = () => {
    ov.classList.add("out");
    setTimeout(() => ov.remove(), 220);
  };
  closeBtn.addEventListener("click", remove);
  requestAnimationFrame(() => ov.classList.add("in"));

  // Garante que o pop-up não "pisque" quando a gravação é muito rápida.
  const minWait = () => new Promise((r) => setTimeout(r, Math.max(0, 700 - (Date.now() - started))));

  return {
    async success(text = done) {
      await minWait();
      title.textContent = text;
      sub.textContent = "";
      card.dataset.state = "success";
      await new Promise((r) => setTimeout(r, 1500));
      remove();
    },
    async fail(message = "Não foi possível salvar a imagem.") {
      await minWait();
      title.textContent = "Não foi possível salvar";
      sub.textContent = message;
      card.dataset.state = "error";
      closeBtn.hidden = false;
      closeBtn.focus();
    }
  };
}
