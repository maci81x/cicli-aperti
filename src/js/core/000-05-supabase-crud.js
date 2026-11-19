// ══════════════════════════════════════════════════════════════
// SUPABASE CRUD
// ══════════════════════════════════════════════════════════════
async function loadAll() {
  state.loading = true;
  if (state.view === 'matrix') renderSkeleton();

  try {
    const [r1, r2] = await Promise.all([
      db.from('cicli').select('*').order('created_at', { ascending: false }),
      db.from('persone').select('*').order('nome')
    ]);
    if (r1.error) throw r1.error;
    if (r2.error) throw r2.error;
    // v11 · le cose eliminate dall'app (eliminato_at) restano nel database ma non si vedono
    const tutte = r1.data || [];
    state.eliminatoColOk = tutte.length ? Object.prototype.hasOwnProperty.call(tutte[0], 'eliminato_at') : !!state.eliminatoColOk;
    state.eliminati = new Set(tutte.filter(c => c.eliminato_at).map(c => c.id));
    state.cicli   = tutte.filter(c => !c.eliminato_at);
    state.persone = r2.data || [];
  } catch (e) {
    showToast('Errore Supabase: ' + e.message, 'error');
  }

  try {
    const { data, error } = await db.from('categorie').select('*').order('ordine');
    if (!error) state.categorie = data || [];
  } catch (_) { state.categorie = []; }

  await reloadWeekData();

  state.loading = false;
  render();
}

// Dati che dipendono dalla settimana selezionata (override agenda + battle plan).
async function reloadWeekData() {
  await loadAgendaOverrides();
  await loadBattlePlan();
}

// Carica gli override agenda della SOLA settimana selezionata.
// Gli override valgono per una singola settimana: cambiando settimana si ricarica.
async function loadAgendaOverrides() {
  // Le colonne giorno_settimana/fascia_oraria potrebbero non essere ancora
  // migrate: rilevalo per non inviarle nei payload e rompere il salvataggio.
  try {
    const { error } = await db.from('cicli').select('id,giorno_settimana,fascia_oraria').limit(1);
    state.agendaColsOk = !error;
    if (error) console.warn('[Agenda] colonne cicli non migrate:', error.message);
  } catch (_) { state.agendaColsOk = false; }

  try {
    const { error } = await db.from('cicli').select('id,parcheggiato,parcheggiato_at').limit(1);
    state.parcheggioColsOk = !error;
    if (error) console.warn('[Parcheggio] colonne cicli non migrate:', error.message);
  } catch (_) { state.parcheggioColsOk = false; }

  try {
    const { error } = await db.from('cicli').select('id,pianificato_data,pianificato_ripetizione').limit(1);
    state.pianificaColsOk = !error;
    if (error) console.warn('[Pianifica] colonne cicli non migrate:', error.message);
  } catch (_) { state.pianificaColsOk = false; }

  try {
    const { error } = await db.from('cicli').select('id,ora_inizio,durata_minuti').limit(1);
    state.ritualiColsOk = !error;
    if (error) console.warn('[Rituali] colonne cicli non migrate:', error.message);
  } catch (_) { state.ritualiColsOk = false; }

  await loadRitualiCompletati();

  try {
    const { data, error } = await db.from('agenda_override')
      .select('*')
      .eq('settimana', state.week)
      .eq('anno', state.year);
    if (error) throw error;
    state.agendaOverrides = data || [];
    state.agendaTableOk   = true;
  } catch (e) {
    state.agendaOverrides = [];
    if (state.agendaTableOk) {
      state.agendaTableOk = false;
      console.warn('[Agenda] override non disponibili:', e.message);
    }
  }
}

async function upsertCiclo(data) {
  const now = new Date().toISOString();
  if (data.id) {
    const { data: rows, error } = await db.from('cicli')
      .update({ ...data, updated_at: now }).eq('id', data.id).select();
    if (error) throw error;
    return (rows && rows[0]) || { ...data };
  }
  // 22/10 · una cosa nuova prende l'area dalla sua categoria (se non ne ha già una scelta)
  const area = data.macro_area || (typeof areaDaCategoria === 'function' ? areaDaCategoria(data.cat) : null) || null;
  const { data: rows, error } = await db.from('cicli')
    .insert({ ...data, macro_area: area, created_at: now, updated_at: now }).select();
  if (error) throw error;
  return (rows && rows[0]) || null;
}

async function removeCiclo(id) {
  const { error } = await db.from('cicli').delete().eq('id', id);
  if (error) throw error;
}

async function flipDone(id, currentDone) {
  const newDone  = !currentDone;
  const newStatus = newDone ? 'done' : 'planned';
  const ora = new Date().toISOString();
  // 22/10 · chiuso_at sempre: si scrive alla chiusura (anche passi e ricorrenti, che passano tutti da qui), si toglie se si riapre
  const chiuso_at = newDone ? ora : null;
  const { error } = await db.from('cicli')
    .update({ done: newDone, execution_status: newStatus, sync_status: 'pending', updated_at: ora, chiuso_at })
    .eq('id', id);
  if (error) throw error;
  state.cicli = state.cicli.map(c => c.id === id ? { ...c, done: newDone, execution_status: newStatus, chiuso_at } : c);
  // Sync to Google Calendar in background
  const ciclo = state.cicli.find(c => c.id === id);
  if (ciclo) syncCicloToGcal({ ...ciclo, done: newDone, execution_status: newStatus }).catch(() => {});
}

