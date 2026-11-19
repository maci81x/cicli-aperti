// v40.1 · 10/11 — sul computer le righe del riquadro si trascinano dentro la giornata (= tasto calendario+)
{
  let v40Drag = null;
  const zona = t => t && t.closest && t.closest('.v26-g-main');
  const pulisci = () => { document.querySelectorAll('.v26-g-main.v40-sopra').forEach(x => x.classList.remove('v40-sopra')); document.querySelectorAll('.v40-riga.dragging').forEach(x => x.classList.remove('dragging')); };
  document.addEventListener('dragstart', e => {
    const r = e.target.closest && e.target.closest('.v40-riga[draggable="true"]');
    if (!r) return;
    v40Drag = r.dataset.id;
    try { e.dataTransfer.setData('text/plain', 'v40:' + v40Drag); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
    r.classList.add('dragging');
    rimandaRender(true);
  });
  document.addEventListener('dragover', e => { if (!v40Drag) return; const z = zona(e.target); pulisci(); document.querySelectorAll('.v40-riga[data-id="' + v40Drag + '"]').forEach(x => x.classList.add('dragging')); if (!z) return; e.preventDefault(); z.classList.add('v40-sopra'); });
  document.addEventListener('drop', e => {
    if (!v40Drag) return;
    const id = v40Drag, z = zona(e.target); v40Drag = null; pulisci(); rimandaRender(false);
    if (!z) return;
    e.preventDefault(); e.stopPropagation();
    bordoSposta(id, GIORNI[Math.max(0, Math.min(6, ui.giorno || 0))].key);
  }, true);
  document.addEventListener('dragend', () => { if (!v40Drag) return; v40Drag = null; pulisci(); rimandaRender(false); });
}

