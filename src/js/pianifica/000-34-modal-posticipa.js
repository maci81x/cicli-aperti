// ══════════════════════════════════════════════════════════════
// MODAL POSTICIPA
// ══════════════════════════════════════════════════════════════

async function doPostpone(days) {
  if (!_postponeId) return;
  const ciclo = state.cicli.find(c => c.id === _postponeId);
  if (!ciclo) return;
  const newDate = addDays(ciclo.scheduled_date || todayISO(), days);
  await _applyPostpone(ciclo, newDate);
}

async function doPostponeCustom() {
  if (!_postponeId) return;
  const ciclo    = state.cicli.find(c => c.id === _postponeId);
  const newDate  = document.getElementById('postpone-custom-date')?.value;
  if (!ciclo || !newDate) return;
  await _applyPostpone(ciclo, newDate);
}

async function _applyPostpone(ciclo, newDate) {
  try {
    const now = new Date().toISOString();
    await db.from('cicli').update({
      scheduled_date: newDate,
      execution_status: 'postponed',
      sync_status: 'pending',
      settimana_anno: isoWeekStr(new Date(newDate)),
      updated_at: now
    }).eq('id', ciclo.id);
    closeModal('postponeOverlay');
    showToast(`Spostato al ${newDate} ✓`, 'success');
    syncCicloToGcal({ ...ciclo, scheduled_date: newDate, execution_status: 'postponed' }).catch(() => {});
  } catch (e) {
    showToast('Errore: ' + e.message, 'error');
  }
}

