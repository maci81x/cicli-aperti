// v50 · 19/11 — sfondo salvia; in Oggi ogni cosa è una scheda a sé (Subito / Importante / Delega si distinguono);
// «Da controllare» anche sul telefono; Delega da Smaltisci torna a Smaltisci
// ══════════════════════════════════════════════════════════════
{
  const _disegnaV50 = disegna;
  disegna = function () {
    const r = _disegnaV50.apply(this, arguments);
    const v = $('view'); if (v) v.classList.toggle('v50-oggi', ui.tab === 'oggi');
    return r;
  };
}
// Oggi sul telefono: un solo riquadro «Da controllare» sotto le cose da chiudere
{
  const _oggiV50 = vistaOggi;
  vistaOggi = function () {
    let h = _oggiV50.apply(this, arguments);
    if (/v33-tre/.test(h) || /v49-ctl/.test(h)) return h;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, radice = f.querySelector('.v12-oggi') || f;
      const testo = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
      const righe = [];
      radice.querySelectorAll('.v23-posta').forEach(el => { el.classList.add('v49-diretto'); righe.push(el.outerHTML); el.remove(); });
      const blocchi = [...radice.querySelectorAll('.v29-prep, .banner-piano, .v12-griglia > .v12-card:not(.v12-rosso)')];
      blocchi.forEach(el => {
        const tEl = el.querySelector('.v29-t, b, h3, strong') || el.querySelector('p');
        const t = testo(tEl) || 'Da guardare';
        const sEl = [...el.querySelectorAll('.v29-s, .t-caption, p, small')].find(x => x !== tEl && !x.contains(tEl) && testo(x) && testo(x) !== t);
        const ico = (el.querySelector('i.ti') || {}).className || 'ti ti-point';
        const k = v49Chiave(t);
        righe.push(`<details class="v49-r" data-v49="${esc(k)}"${ui.v49Aperti.has(k) ? ' open' : ''}><summary><i class="${esc(ico)}" aria-hidden="true"></i><span class="v49-r-t"><b>${escHtml(corta(t, 60))}</b>${sEl ? `<small>${escHtml(corta(testo(sEl), 70))}</small>` : ''}</span><i class="ti ti-chevron-down v49-r-v" aria-hidden="true"></i></summary><div class="v49-r-corpo">${el.outerHTML}</div></details>`);
        el.remove();
      });
      if (!righe.length) return h;
      const box = `<section class="v49-ctl v50-tel" aria-label="Da controllare"><p class="v49-ctl-h"><span>Da controllare</span><span class="mono">${righe.length}</span></p>${righe.join('')}</section>`;
      const rosso = radice.querySelector('.v12-card.v12-rosso');
      const dopo = rosso ? (rosso.closest('.v12-griglia') || rosso) : null;
      if (dopo) dopo.insertAdjacentHTML('afterend', box); else radice.insertAdjacentHTML('beforeend', box);
      const d = document.createElement('div'); d.appendChild(f); h = d.innerHTML;
    } catch (e) { console.warn('[v50] da controllare telefono:', e.message); }
    return h;
  };
}
// una riga aperta non ripete il titolo: il titolo della scheda interna si nasconde (resta per i lettori di schermo)
// Smaltisci: Delega apre il suo foglio e, chiuso quello, si torna a Smaltisci
{
  const _listaV50 = v49Lista;
  v49Lista = () => _listaV50().filter(c => !(ui.v49 && ui.v49.gestite && ui.v49.gestite.has(c.id)));
  const _faiV50 = v49Fai;
  v49Fai = async function (tipo, iso) {
    if (tipo !== 'delega') return _faiV50.apply(this, arguments);
    const s = ui.v49, c = s && v49Lista()[s.idx];
    if (!c) return;
    s.riprendi = { id: c.id, prima: { q: c.q, delega_persona_id: c.delega_persona_id || null, delega_controllo: c.delega_controllo || null, persone_menzionate: [...(c.persone_menzionate || [])] } };
    closeModal('v49Overlay');
    apriDelega(c.id);
    if (!$('delegaOverlay') || !$('delegaOverlay').classList.contains('open')) v50Riprendi();
  };
  AZIONI['v49-delega'] = () => v49Fai('delega');
}
function v50Riprendi() {
  const s = ui.v49, r = s && s.riprendi;
  if (!r) return;
  s.riprendi = null;
  s.gestite = s.gestite || new Set();
  const c = ciclo(r.id);
  if (c && c.delega_persona_id && c.delega_persona_id !== r.prima.delega_persona_id) {
    s.gestite.add(r.id); s.fatte++; s.storia.push({ tipo: 'delega', id: r.id, prima: r.prima });
  }
  v49Disegna();
  $('v49Overlay').classList.add('open');
}
{
  const o = $('delegaOverlay');
  if (o) new MutationObserver(() => { if (!o.classList.contains('open') && ui.v49 && ui.v49.riprendi) setTimeout(v50Riprendi, 50); }).observe(o, { attributes: true, attributeFilter: ['class'] });
  const _annV50 = v49Annulla;
  v49Annulla = async function () {
    const s = ui.v49, u = s && s.storia[s.storia.length - 1];
    if (!u || u.tipo !== 'delega') return _annV50.apply(this, arguments);
    s.storia.pop();
    try { await patchCiclo(u.id, u.prima); s.gestite.delete(u.id); s.fatte = Math.max(0, s.fatte - 1); const i = v49Lista().findIndex(x => x.id === u.id); if (i >= 0) s.idx = i; render(); }
    catch (e) { showToast('Non riesco ad annullare: ' + e.message, 'error'); }
    v49Disegna();
  };
  AZIONI['v49-annulla'] = () => v49Annulla();
}
// Smaltisci: Esc chiude, e il fuoco resta dentro la finestra (tastiera)
document.addEventListener('keydown', e => {
  const o = $('v49Overlay');
  if (!o || !o.classList.contains('open')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeModal('v49Overlay'); return; }
  if (e.key !== 'Tab') return;
  const f = [...o.querySelectorAll('button:not([disabled]), [tabindex="0"]')].filter(x => x.offsetParent);
  if (!f.length) return;
  const primo = f[0], ultimo = f[f.length - 1];
  if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
  else if (!o.contains(document.activeElement)) { e.preventDefault(); primo.focus(); }
});
