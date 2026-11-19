// v9 · PILA DEI FOGLI: l'ultimo aperto sta sopra; conferme e scelte sopra qualsiasi foglio.
// (prima avevano tutti z-index 40 e vinceva l'ordine nel DOM: la conferma finiva sotto)
// Menu e riquadri (60) restano sopra i fogli, i toast (90) sopra tutto.
// ══════════════════════════════════════════════════════════════
const PILA = { FOGLI: 40, CONFERME: 70, MAX: 19, CONFERME_ID: ['confermaOverlay', 'proteggiOverlay', 'serieOverlay'], SEL: '.modal-overlay, .bp-slot-panel' };
let _pilaN = 0;
function aggiornaPila(el) {
  const aperto = el.classList.contains('open');
  if (aperto === (el.dataset.pila === '1')) return;
  if (!aperto) {
    delete el.dataset.pila;
    el.style.zIndex = '';
    if (!document.querySelector('.modal-overlay.open, .bp-slot-panel.open')) _pilaN = 0;
    return;
  }
  el.dataset.pila = '1';
  _pilaN += 1;
  el.style.zIndex = String((PILA.CONFERME_ID.includes(el.id) ? PILA.CONFERME : PILA.FOGLI) + Math.min(_pilaN, PILA.MAX));
}
new MutationObserver(lista => lista.forEach(m => { if (m.target.matches && m.target.matches(PILA.SEL)) aggiornaPila(m.target); }))
  .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
document.querySelectorAll(PILA.SEL).forEach(aggiornaPila);

// ══════════════════════════════════════════════════════════════
