// ══════════════════════════════════════════════════════════════
// BATCH MIGRAZIONE MACRO AREE SU CICLI ESISTENTI
// ══════════════════════════════════════════════════════════════
async function batchMigrateAree() {
  if (!claudeDisponibile()) { showToast('Serve la chiave di Claude: Altro, Impostazioni', 'warn'); return; }

  const toMigrate = state.cicli.filter(c => !areaDi(c) && c.ctx === 'lavoro').slice(0, 50);   // v5: chi ha l'area dalla categoria resta così
  if (!toMigrate.length) { showToast('Tutte le cose hanno già un\'area', 'info'); return; }

  showToast(`Assegno l\'area a ${toMigrate.length} cose...`, 'info');
  let done = 0;

  for (const c of toMigrate) {
    const area = await autoCategoria(c.title, c.note).catch(() => null);
    if (area) {
      await db.from('cicli').update({ macro_area: area, updated_at: new Date().toISOString() }).eq('id', c.id).catch(() => {});
      done++;
    }
    await new Promise(r => setTimeout(r, 200)); // rate limit
  }

  await loadAll();
  showToast(`${done}/${toMigrate.length} cose con un\'area`, 'success');
}

