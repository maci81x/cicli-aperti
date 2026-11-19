// ══════════════════════════════════════════════════════════════
// VISTA AGENDA SETTIMANALE
// ══════════════════════════════════════════════════════════════
let _agendaDragId  = null;   // ciclo in trascinamento





// Override attivo per un ciclo nella settimana corrente (o null)
function agendaOverrideFor(cicloId) {
  return state.agendaOverrides.find(o =>
    o.ciclo_id === cicloId && o.settimana === state.week && o.anno === state.year
  ) || null;
}

// Posizione effettiva del ciclo: override della settimana, altrimenti valore del ciclo
// Settimana ISO (numero + anno-settimana) di una data.
function isoWeekParts(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);          // giovedì della settimana
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { week, year: date.getUTCFullYear() };
}

function parseISODate(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function addMesi(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const giorno = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  // clamp per mesi più corti (es. 31 gen + 1 mese -> 28/29 feb)
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(giorno, ultimo));
  return d;
}

const RIPETIZIONE_MESI = { mensile: 1, trimestrale: 3, annuale: 12 };

// Il ciclo, per la sua pianificato_data + ripetizione, ricade nella settimana (week, year)?
function ricadeInSettimana(c, week, year) {
  const base = parseISODate(c.pianificato_data);
  if (!base) return false;

  const rip = ripetizioneDi(c);
  const baseW = isoWeekParts(base);

  if (rip === 'nessuna') return baseW.week === week && baseW.year === year;

  const target = getWeekStart(week, year);
  const baseWeekStart = getWeekStart(baseW.week, baseW.year);
  if (target < baseWeekStart) return false;               // prima della prima occorrenza

  if (rip === 'settimanale') return true;                 // ogni settimana da lì in poi

  const passo = RIPETIZIONE_MESI[rip];
  if (!passo) return false;
  const fineSettimana = new Date(target); fineSettimana.setDate(target.getDate() + 6);
  for (let n = 0; n < 400; n++) {
    const occ = addMesi(base, n * passo);
    if (occ > fineSettimana) return false;
    const w = isoWeekParts(occ);
    if (w.week === week && w.year === year) return true;
  }
  return false;
}

// Posizione del ciclo nella settimana (week, year), in ordine di priorità:
//   1. agenda_override specifico per quella settimana
//   2. pianificato_data (+ ripetizione) che ricade in quella settimana
//   3. giorno_settimana permanente senza pianificato_data -> sempre presente
function agendaSlotForWeek(c, week, year) {
  const ov = state.agendaOverrides.find(o =>
    o.ciclo_id === c.id && o.settimana === week && o.anno === year);
  if (ov) return { giorno: ov.giorno_settimana, fascia: ov.fascia_oraria, overridden: true };

  if (c.pianificato_data) {
    if (ricadeInSettimana(c, week, year)) {
      const base = parseISODate(c.pianificato_data);
      return {
        giorno: c.giorno_settimana || GIORNI[(base.getDay() + 6) % 7].key,
        fascia: c.fascia_oraria || null,
        overridden: false
      };
    }
    return { giorno: null, fascia: null, overridden: false };
  }

  return { giorno: c.giorno_settimana, fascia: c.fascia_oraria || null, overridden: false };
}

function agendaSlotFor(c) {
  return agendaSlotForWeek(c, state.week, state.year);
}

// Un ciclo è "da pianificare" solo se non ha nessun aggancio temporale.
function haPianificazione(c) {
  if (isGiornaliero(c)) return true;
  if (c.pianificato_data) return true;
  if (c.giorno_settimana) return true;
  return !!agendaOverrideFor(c.id);
}



// «Da sistemare»: una sola definizione per la colonna Da pianificare, Da piazzare, Riordina e la card del coach.
// Aperta (non fatta, non parcheggiata), senza giorno, senza data (né scadenza né data pianificata), fuori dal piano della settimana.
// Non conta le routine di ogni giorno né le cose divise in passi (contano i passi).
const ETICHETTA_CTX = { lavoro: 'Lavoro', personale: 'Personale', tutti: 'Tutti' };
const etichettaCtx = ctx => ETICHETTA_CTX[ctx || ctxVista()] || ETICHETTA_CTX.tutti;
function senzaGiornoNePiano(ctx) {
  const k = ctx || ctxVista();
  const nelPiano = new Set((state.bpItems || []).map(i => i.ciclo_id).filter(Boolean));
  return state.cicli.filter(c => (k === 'tutti' || c.ctx === k) && isAttivo(c) && !isGiornaliero(c) && !haPassiAperti(c)
    && !c.giorno_settimana && !c.pianificato_data && !agendaOverrideFor(c.id) && !nelPiano.has(c.id));
}
const daSistemare = ctx => senzaGiornoNePiano(ctx).filter(c => !c.due_date);
// quelle con una scadenza ma senza giorno: non sono da sistemare, restano a portata in Pianifica
const conScadenzaSenzaGiorno = ctx => senzaGiornoNePiano(ctx).filter(c => c.due_date).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
const perTipoEData = (a, b) => computeEffectiveQ(a) - computeEffectiveQ(b) || String(a.created_at || '').localeCompare(String(b.created_at || ''));


// ── SOTTO-VISTA: PIANIFICATI (griglia 7 giorni × fasce) ──

// ── CARD COMPATTA DELL'AGENDA ──


// ── DRAG & DROP ──
function attachDropZone(slot, giorno, fascia) {
  slot.addEventListener('dragover', e => {
    if (!_agendaDragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    slot.classList.add('drag-over');
  });
  slot.addEventListener('dragleave', e => {
    if (slot.contains(e.relatedTarget)) return;
    slot.classList.remove('drag-over');
  });
  slot.addEventListener('drop', async e => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    let id = _agendaDragId;
    try { id = e.dataTransfer.getData('text/plain') || id; } catch (_) {}
    if (!id) return;
    _agendaDragId = null;
    await moveCicloInAgenda(id, giorno, fascia);
  });
}

// Crea/aggiorna l'override — vale SOLO per la settimana corrente
async function moveCicloInAgenda(cicloId, giorno, fascia) {
  const ciclo = state.cicli.find(c => c.id === cicloId);
  if (!ciclo) return;
  const prev = agendaSlotFor(ciclo);
  if (prev.giorno === giorno && prev.fascia === fascia) return;

  const payload = {
    ciclo_id:         cicloId,
    settimana:        state.week,
    anno:             state.year,
    giorno_settimana: giorno,
    fascia_oraria:    fascia
  };

  try {
    const { data, error } = await db.from('agenda_override')
      .upsert(payload, { onConflict: 'ciclo_id,settimana,anno' })
      .select();
    if (error) throw error;

    // stato immutabile: rimpiazza l'override esistente
    const saved = (data && data[0]) || payload;
    state.agendaOverrides = [
      ...state.agendaOverrides.filter(o => !(o.ciclo_id === cicloId && o.settimana === state.week && o.anno === state.year)),
      saved
    ];
    renderAgenda();
    showToast(`Spostato a ${GIORNI_MAP[giorno].label} ${FASCE_MAP[fascia].label.toLowerCase()} per ${bpwFrase(state.week, state.year).nome}`, 'success');
  } catch (err) {
    showToast('Errore spostamento: ' + err.message, 'error');
  }
}

// ── CARD GRANDE (usata da "Da pianificare" e "Parcheggio") ──


// ── SOTTO-VISTA: DA PIANIFICARE ──

// ── VISTA PARCHEGGIO ──

// ── AZIONI PARCHEGGIO ──

async function riattivaCiclo(cicloId) {
  const now = new Date().toISOString();
  try {
    const { error } = await db.from('cicli')
      .update({ parcheggiato: false, parcheggiato_at: null, updated_at: now })
      .eq('id', cicloId);
    if (error) throw error;
    state.cicli = state.cicli.map(c =>
      c.id === cicloId ? { ...c, parcheggiato: false, parcheggiato_at: null } : c);
      render();
    showToast('Ciclo riattivato ', 'success');
  } catch (err) { showToast('Errore: ' + err.message, 'error'); }
}



