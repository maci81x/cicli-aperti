// ══════════════════════════════════════════════════════════════
// RITUALI QUOTIDIANI
// ══════════════════════════════════════════════════════════════
function isGiornaliero(c) {
  return !!c && c.pianificato_ripetizione === 'giornaliera';
}

function formatDurata(min) {
  if (!min) return '';
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}` : (h === 1 ? '1 ora' : `${h} ore`);
}

function formatOra(t) {
  return (t || '').slice(0, 5);
}

// Rituali del contesto corrente, ordinati per ora_inizio
function ritualiQuotidiani() {
  return state.cicli
    .filter(c => vedi(c.ctx) && isAttivo(c) && isGiornaliero(c))
    .sort((a, b) => formatOra(a.ora_inizio).localeCompare(formatOra(b.ora_inizio)));
}

function rituraleFattoOggi(cicloId) {
  const oggi = todayISO();
  return state.ritualiCompletati.some(r => r.ciclo_id === cicloId && r.data_completamento === oggi);
}

async function loadRitualiCompletati() {
  try {
    const { data, error } = await db.from('rituali_completati')
      .select('*').eq('data_completamento', todayISO());
    if (error) throw error;
    state.ritualiCompletati = data || [];
    state.ritualiTableOk = true;
  } catch (e) {
    state.ritualiCompletati = [];
    if (state.ritualiTableOk) {
      state.ritualiTableOk = false;
      console.warn('[Rituali] tabella non disponibile:', e.message);
    }
  }
}

// Spunta/despunta il rituale per OGGI: non chiude il ciclo, domani riappare.
async function toggleRitualeOggi(cicloId) {
  if (!state.ritualiTableOk) { showToast('Migration rituali non applicata', 'error'); return; }
  const oggi = todayISO();
  const gia  = rituraleFattoOggi(cicloId);
  try {
    if (gia) {
      const { error } = await db.from('rituali_completati')
        .delete().eq('ciclo_id', cicloId).eq('data_completamento', oggi);
      if (error) throw error;
      state.ritualiCompletati = state.ritualiCompletati
        .filter(r => !(r.ciclo_id === cicloId && r.data_completamento === oggi));
      showToast('Riaperta per oggi', 'info');
    } else {
      const { data, error } = await db.from('rituali_completati')
        .insert({ ciclo_id: cicloId, data_completamento: oggi }).select();
      if (error) throw error;
      state.ritualiCompletati = [...state.ritualiCompletati,
        (data && data[0]) || { ciclo_id: cicloId, data_completamento: oggi }];
      showToast('Fatto per oggi ✓', 'success');
    }
    renderAgenda();
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
  }
}



