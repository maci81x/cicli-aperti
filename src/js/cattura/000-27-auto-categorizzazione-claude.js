// ══════════════════════════════════════════════════════════════
// AUTO-CATEGORIZZAZIONE CLAUDE
// ══════════════════════════════════════════════════════════════
async function autoCategoria(title, note) {
  if (!title || !claudeDisponibile()) return null;
  const prompt = `Classifica questa attività SSI (consulenza sicurezza sul lavoro) in UNA delle aree: ${nomiAree().join(', ')}. Rispondi SOLO con il nome esatto, nient'altro. Titolo: ${title}. Note: ${note || ''}`;
  const area = (await chiediClaude('area', prompt)).trim();
  return nomiAree().includes(area) ? area : null;
}

// Hook auto-cat al blur del titolo nel modal
document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('f-title');
  if (!titleInput) return;
  titleInput.addEventListener('blur', async () => {
    const title = titleInput.value.trim();
    const current = document.getElementById('f-macro-area')?.value;
    if (!title || current || areaDaCategoria(document.getElementById('f-cat')?.value)) return;   // l'area viene dalla categoria
    const spin = document.getElementById('auto-cat-spin');
    const hint = document.getElementById('auto-cat-hint');
    if (spin) spin.classList.add('active');
    if (hint) hint.textContent = 'cerco l\'area...';
    try {
      const area = await autoCategoria(title, document.getElementById('f-note')?.value || '');
      if (area) {
        const sel = document.getElementById('f-macro-area');
        if (sel && !sel.value) { sel.value = area; }
        if (hint) hint.textContent = `suggerita: ${area}`;
      } else {
        if (hint) hint.textContent = 'scegli tu';
      }
    } catch (_) {
      if (hint) hint.textContent = 'scegli tu';
    }
    if (spin) spin.classList.remove('active');
  });
});

