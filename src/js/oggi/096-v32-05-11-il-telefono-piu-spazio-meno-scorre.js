// v32 · 05/11 — il telefono: più spazio, meno scorrere (approvato sul canvas, sezione 13)
// · Oggi: «Adesso» più corto (di giorno niente «Aggiungi una cosa», c'è già il + in basso),
//   la giornata e gli obiettivi affiancati, «Da rispondere» su una riga, «Prima di tutto» senza
//   riquadro dentro un riquadro, la routine già passata chiusa.
// · Subito senza sfondo rosso, titoli su 3 righe.
// · Barra in alto: «Tutto ▾» apre la scelta; scorrendo si riduce al titolo della vista.
// · «Cosa hai in testa?» si apre dal microfono o dal + al centro del menu.
// · Pianifica: il titolo non è più coperto dai bottoni; «Piano in bozza» intero.
// ══════════════════════════════════════════════════════════════
const v32Tel = () => window.matchMedia('(max-width: 767px)').matches && !modoSemplice();

v31Ritmo = (function (orig) {
  return function () { const m = v25Momento(); if (m && m.k === 'giorno') return ''; return orig.apply(this, arguments).replace(/(<\/b>)([^<]+)(<\/span>)/, '$1<small>$2</small>$3'); };
})(v31Ritmo);
v31Giornata = (function (orig) {
  return function () { return orig.apply(this, arguments).replace(/<span class="mono">impegni ([^·]+)· /, '<span class="mono"><span class="v32-imp">impegni $1· </span>'); };
})(v31Giornata);
v31Obiettivi = (function (orig) {
  return function () {
    return orig.apply(this, arguments)
      .replace('<b>Obiettivi della settimana</b>', '<b>Obiettivi<span class="v32-lungo"> della settimana</span></b>')
      .replace('ancora da scrivere · bastano 2 minuti', '<span class="v32-lungo">ancora </span>da scrivere · <span class="v32-lungo">bastano </span>2 minuti');
  };
})(v31Obiettivi);


// --- «Cosa hai in testa?» dal centro del menu ---
function v32ApriCattura(conMic) {
  document.body.classList.add('v32-cat');
  if (!$('v32Scrim')) { document.body.insertAdjacentHTML('beforeend', '<div class="v32-scrim" id="v32Scrim" hidden></div>'); $('v32Scrim').addEventListener('click', v32ChiudiCattura); }
  $('v32Scrim').hidden = false;
  const t = $('cattura-testo'), mic = $('cattura-mic');
  if (conMic && mic && !mic.hidden) mic.click(); else setTimeout(() => t && t.focus(), 30);
}
function v32ChiudiCattura() {
  document.body.classList.remove('v32-cat');
  if ($('v32Scrim')) $('v32Scrim').hidden = true;
  const mic = $('cattura-mic');
  if (mic && mic.getAttribute('aria-pressed') === 'true' && typeof fermaDettatura === 'function') fermaDettatura();
}
(function v32Menu() {
  const nav = document.querySelector('.tabbar'), dopo = nav && nav.querySelector('[data-tab="pianifica"]');
  if (!nav || !dopo || nav.querySelector('.v32-pill')) return;
  dopo.insertAdjacentHTML('afterend', `<div class="v32-pill"><span><button type="button" class="v32-mic" aria-label="Detta una cosa"><i class="ti ti-microphone"></i></button><button type="button" class="v32-piu" aria-label="Aggiungi una cosa"><i class="ti ti-plus"></i></button></span></div>`);
  nav.querySelector('.v32-mic').addEventListener('click', () => v32ApriCattura(true));
  nav.querySelector('.v32-piu').addEventListener('click', () => v32ApriCattura(false));
  const micVero = $('cattura-mic');
  const allinea = () => { const m = nav.querySelector('.v32-mic'); if (m) m.hidden = !micVero || micVero.hidden; };
  allinea(); if (micVero) new MutationObserver(allinea).observe(micVero, { attributes: true, attributeFilter: ['hidden'] });
  $('cattura-testo').addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('v32-cat')) { e.preventDefault(); v32ChiudiCattura(); } });
})();
salvaCattura = (function (orig) {
  return async function () {
    const r = await orig.apply(this, arguments);
    if (document.body.classList.contains('v32-cat') && !$('cattura-testo').value.trim()) v32ChiudiCattura();
    return r;
  };
})(salvaCattura);

// --- la barra in alto: «Tutto ▾» e il titolo quando scorri ---
const V32_CTX = { tutto: 'Tutto', lavoro: 'Lavoro', personale: 'Personale' };
(function v32Testa() {
  const top = document.querySelector('.top'), seg = top && top.querySelector('.top-ctx');
  if (!top || !seg || top.querySelector('.v32-ctx-btn')) return;
  top.querySelector('.logo-top').insertAdjacentHTML('afterend', '<span class="v32-top-tit" aria-hidden="true"></span>');
  seg.insertAdjacentHTML('beforebegin', '<button type="button" class="v32-ctx-btn" aria-haspopup="true" aria-expanded="false"><span>Tutto</span><i class="ti ti-chevron-down" aria-hidden="true"></i></button>');
  const btn = top.querySelector('.v32-ctx-btn');
  const chiudi = () => { top.classList.remove('v32-ctx-aperto'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', e => { e.stopPropagation(); const ap = !top.classList.contains('v32-ctx-aperto'); top.classList.toggle('v32-ctx-aperto', ap); btn.setAttribute('aria-expanded', String(ap)); });
  document.addEventListener('click', e => { if (!btn.contains(e.target)) setTimeout(chiudi, 0); });
  const main = $('main');
  if (main) main.addEventListener('scroll', () => { document.body.classList.toggle('v32-giu', v32Tel() && main.scrollTop > 56); }, { passive: true });
})();
function v32AggiornaTesta() {
  const btn = document.querySelector('.v32-ctx-btn'), seg = document.querySelector('.top-ctx');
  if (btn) { btn.querySelector('span').textContent = V32_CTX[state.filtro] || 'Tutto'; btn.style.display = seg && seg.style.visibility === 'hidden' ? 'none' : ''; }
  const tit = document.querySelector('.v32-top-tit'), h1 = document.querySelector('#view .vh h1');
  if (tit) {
    const t = h1 ? [...h1.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() : '';
    const d = new Date(), gg = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'][d.getDay()], mm = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'][d.getMonth()];
    tit.innerHTML = escHtml(t) + (ui.tab === 'oggi' ? ` <small>· ${gg} ${d.getDate()} ${mm}</small>` : '');
  }
}
v32AggiornaTesta();

// ══════════════════════════════════════════════════════════════
