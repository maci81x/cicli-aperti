// v50 · accessibilità (axe, WCAG 2.1 AA)
{ // il suggerimento vuoto non si annuncia
  const t = $('tooltip');
  if (t) { const agg = () => { const on = t.classList.contains('visible') && t.textContent.trim(); if (on) { t.setAttribute('role', 'tooltip'); t.removeAttribute('aria-hidden'); } else { t.removeAttribute('role'); t.setAttribute('aria-hidden', 'true'); } }; agg(); new MutationObserver(agg).observe(t, { attributes: true, attributeFilter: ['class'], childList: true }); }
}
// appuntamenti: niente bottoni dentro un bottone; si apre dal titolo (Invio o clic), la spunta e il cestino restano bottoni
function v50Appuntamenti() {
  document.querySelectorAll('#view .evt-riga[role="button"]').forEach(r => {
    const t = r.querySelector('.item-title');
    if (!t) return;
    t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0');
    t.setAttribute('data-act', r.dataset.act || 'evt-apri');
    if (r.dataset.evt) t.setAttribute('data-evt', r.dataset.evt);
    if (r.dataset.evtId) t.setAttribute('data-evt-id', r.dataset.evtId);
    if (r.getAttribute('aria-label')) t.setAttribute('aria-label', r.getAttribute('aria-label'));
    r.removeAttribute('role'); r.removeAttribute('tabindex');
  });
}
{
  const _disegnaV50b = disegna;
  disegna = function () { const r = _disegnaV50b.apply(this, arguments); try { v50Appuntamenti(); } catch (e) { console.warn('[v50] appuntamenti:', e.message); } return r; };
}
