// l'elenco finisce sempre dentro lo schermo: altezza = spazio fino in fondo, meno quello che c'è sotto (In settimana, Stampa)
function v40Altezza() {
  const sc = document.querySelector('.v40-scroll'); if (!sc) return;
  if (window.innerWidth < 901) { sc.style.maxHeight = ''; return; }
  sc.style.maxHeight = 'none';
  const box = sc.closest('.v40-dametti'), lato = sc.closest('.v26-g-lato');
  const sotto = lato ? [...lato.children].filter(x => box && (box.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING)).reduce((t, x) => t + x.getBoundingClientRect().height + 12, 0) : 0;
  const top = Math.max(sc.getBoundingClientRect().top, 0);
  sc.style.maxHeight = Math.max(200, Math.floor(window.innerHeight - top - sotto - 16 - 12)) + 'px';
}
window.addEventListener('resize', () => requestAnimationFrame(v40Altezza));

// ══════════════════════════════════════════════════════════════
