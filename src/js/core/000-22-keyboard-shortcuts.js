// ══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  const anyOpen = document.querySelector('.modal-overlay.open');
  if (e.key === 'Escape' && anyOpen) { anyOpen.classList.remove('open'); return; }
  if (anyOpen) return;
  if (e.target.closest && e.target.closest('input, textarea, select')) { if (!(e.metaKey || e.ctrlKey)) return; }
  if (e.key === 'ArrowLeft'  && ui.tab === 'pianifica') { e.preventDefault(); changeWeek(-1); }
  if (e.key === 'ArrowRight' && ui.tab === 'pianifica') { e.preventDefault(); changeWeek(1); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); apriRapido(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); openPlaudModal(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); focusRicerca(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('modalOverlay')?.classList.contains('open')) {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') { e.preventDefault(); salvaDalFoglio(); }
  }
});

