// ══════════════════════════════════════════════════════════════
// MINI-MODALE PIANIFICA CICLO
// ══════════════════════════════════════════════════════════════
let _pfCicloId = null;
let _pfQuando  = 'questa';
let _pfRip     = 'nessuna';

function openPianificaModal(cicloId) {
  const c = state.cicli.find(x => x.id === cicloId);
  if (!c) return;
  if (!state.agendaColsOk) { showToast('Migration agenda non applicata', 'error'); return; }

  _pfCicloId = cicloId;
  _pfQuando  = 'questa';
  _pfRip     = ripetizioneDi(c);

  document.getElementById('pf-ciclo-title').textContent = c.title || '';
  document.getElementById('pf-giorno').value = c.giorno_settimana || 'lunedi';
  document.getElementById('pf-fascia').value = c.fascia_oraria    || 'mattina';

  const dateInput = document.getElementById('pf-data-specifica');
  dateInput.value = c.pianificato_data || '';
  dateInput.style.display = 'none';

  // ora e durata
  const oraEl = document.getElementById('f-ora-inizio');
  oraEl.value = (c.ora_inizio || '').slice(0,5);
  const durSel = document.getElementById('f-durata');
  const durCus = document.getElementById('f-durata-custom');
  const preset = ['15','30','45','60','90','120','180'];
  if (c.durata_minuti && preset.includes(String(c.durata_minuti))) {
    durSel.value = String(c.durata_minuti); durCus.value = ''; durCus.style.display = 'none';
  } else if (c.durata_minuti) {
    durSel.value = 'custom'; durCus.value = c.durata_minuti; durCus.style.display = '';
  } else {
    durSel.value = ''; durCus.value = ''; durCus.style.display = 'none';
  }
  pfMostraErrore('');

  // Senza la migration rituali il valore 'giornaliera' violerebbe il CHECK:
  // disabilita l'opzione e i campi ora/durata.
  const optGiorn = document.querySelector('#pianificaOverlay .pf-opt[data-rip="giornaliera"]');
  if (optGiorn) {
    optGiorn.style.display = state.ritualiColsOk ? '' : 'none';
    optGiorn.disabled = !state.ritualiColsOk;
  }
  const odField = document.getElementById('pf-oradurata-field');
  if (odField) odField.classList.toggle('pf-hidden', !state.ritualiColsOk);
  if (!state.ritualiColsOk && _pfRip === 'giornaliera') _pfRip = 'nessuna';

  pfSelectQuando('questa');
  pfSelectRip(state.pianificaColsOk ? _pfRip : 'nessuna');
  const ripField = document.querySelector('#pianificaOverlay .pf-opt[data-rip]')?.closest('.pf-field');
  if (ripField) ripField.style.display = state.pianificaColsOk ? '' : 'none';

  const overlay = document.getElementById('pianificaOverlay');
  overlay.classList.toggle('personale-ctx', state.ctx === 'personale');
  document.getElementById('pf-save').className = 'pf-btn-save' + (state.ctx === 'personale' ? ' personale' : '');
  const btn = document.getElementById('pf-save');
  btn.disabled = false;
  btn.textContent = 'Pianifica';
  overlay.classList.add('open');
}

function closePianificaModal() {
  document.getElementById('pianificaOverlay').classList.remove('open');
  _pfCicloId = null;
}

function pfSelectQuando(key) {
  _pfQuando = key;
  document.querySelectorAll('#pianificaOverlay .pf-opt[data-quando]').forEach(b =>
    b.classList.toggle('selected', b.dataset.quando === key));
  const dateInput = document.getElementById('pf-data-specifica');
  dateInput.style.display = key === 'specifica' ? '' : 'none';
  if (key === 'specifica' && !dateInput.value) dateInput.value = todayISO();
}

function pfSelectRip(key) {
  _pfRip = key;
  document.querySelectorAll('#pianificaOverlay .pf-opt[data-rip]').forEach(b =>
    b.classList.toggle('selected', b.dataset.rip === key));

  // Un rituale giornaliero non ha un singolo giorno: l'ora esatta è più precisa.
  const gf = document.getElementById('pf-giornofascia-field');
  if (gf) gf.classList.toggle('pf-hidden', key === 'giornaliera');
  const hint = document.getElementById('pf-oradurata-hint');
  if (hint) hint.textContent = key === 'giornaliera'
    ? 'serve l\'ora'
    : '';
  pfMostraErrore('');
}

function pfMostraErrore(msg) {
  const el = document.getElementById('pf-error');
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? '' : 'none';
}

// Durata scelta in minuti, o null
function pfDurataMinuti() {
  const v = document.getElementById('f-durata').value;
  if (!v) return null;
  if (v === 'custom') {
    const n = parseInt(document.getElementById('f-durata-custom').value, 10);
    return Number.isFinite(n) ? Math.min(480, Math.max(5, n)) : null;
  }
  return parseInt(v, 10);
}

// toggle input "Personalizzata"
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'f-durata') {
    const cus = document.getElementById('f-durata-custom');
    cus.style.display = e.target.value === 'custom' ? '' : 'none';
    if (e.target.value === 'custom') cus.focus();
  }
});

// Data base secondo la scelta "QUANDO"
function pfDataBase() {
  const oggi = new Date();
  if (_pfQuando === 'questa')   return getWeekStart(state.week, state.year);
  if (_pfQuando === 'prossima') { const d = getWeekStart(state.week, state.year); d.setDate(d.getDate() + 7); return d; }
  if (_pfQuando === 'mese1')    return addMesi(oggi, 1);
  if (_pfQuando === 'mese3')    return addMesi(oggi, 3);
  if (_pfQuando === 'specifica') return parseISODate(document.getElementById('pf-data-specifica').value) || oggi;
  return oggi;
}

// Sposta la data al giorno della settimana scelto, restando nella stessa settimana ISO
function pfAggiustaAlGiorno(base, giornoKey) {
  const idx = GIORNI.findIndex(g => g.key === giornoKey);
  const w = isoWeekParts(base);
  const lunedi = getWeekStart(w.week, w.year);
  const d = new Date(lunedi);
  d.setDate(lunedi.getDate() + (idx < 0 ? 0 : idx));
  return d;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function confermaPianificazione() {
  const cicloId = _pfCicloId;
  const c = state.cicli.find(x => x.id === cicloId);
  if (!c) return;

  const giorno = document.getElementById('pf-giorno').value;
  const fascia = document.getElementById('pf-fascia').value;

  if (_pfQuando === 'specifica' && !document.getElementById('pf-data-specifica').value) {
    showToast('Scegli una data', 'warn'); return;
  }

  const oraInizio = document.getElementById('f-ora-inizio').value || null;
  let durata = pfDurataMinuti();

  // Validazione rituale quotidiano
  if (_pfRip === 'giornaliera') {
    if (!state.ritualiColsOk) { showToast('Migration rituali non applicata', 'error'); return; }
    if (!oraInizio) {
      pfMostraErrore('Per una routine di ogni giorno serve l\'ora');
      document.getElementById('f-ora-inizio').focus();
      return;
    }
    if (!durata) durata = 30;   // default
  }
  pfMostraErrore('');

  const data = pfAggiustaAlGiorno(pfDataBase(), giorno);
  const dataISO = toISODate(data);
  const w = isoWeekParts(data);
  const wasParked = isParcheggiato(c);

  const btn = document.getElementById('pf-save');
  btn.disabled = true;
  btn.textContent = 'Salvataggio...';

  const giornaliera = _pfRip === 'giornaliera';

  const patch = {
    // un rituale quotidiano non ha un singolo giorno né una fascia
    giorno_settimana: giornaliera ? null : giorno,
    fascia_oraria:    giornaliera ? null : fascia,
    updated_at:       new Date().toISOString()
  };
  if (state.pianificaColsOk) {
    patch.pianificato_data        = giornaliera ? todayISO() : dataISO;
    patch.pianificato_ripetizione = RIP_DB(_pfRip);
  }
  if (state.ritualiColsOk) {
    patch.ora_inizio    = oraInizio;
    patch.durata_minuti = durata;
  }
  // ricorrenza: campo storico usato dalla logica di ripetizione alla chiusura
  patch.ricorrenza = _pfRip;
  if (wasParked && state.parcheggioColsOk) { patch.parcheggiato = false; patch.parcheggiato_at = null; }

  try {
    const { error } = await db.from('cicli').update(patch).eq('id', cicloId);
    if (error) throw error;

    // override per la settimana della data calcolata
    let savedOv = null;
    if (state.agendaTableOk && !giornaliera) {
      const ovPayload = {
        ciclo_id: cicloId, settimana: w.week, anno: w.year,
        giorno_settimana: giorno, fascia_oraria: fascia
      };
      const { data: ovData, error: ovErr } = await db.from('agenda_override')
        .upsert(ovPayload, { onConflict: 'ciclo_id,settimana,anno' }).select();
      if (ovErr) throw ovErr;
      savedOv = (ovData && ovData[0]) || ovPayload;
    }

    // aggiornamento immutabile dello stato locale
    state.cicli = state.cicli.map(x => x.id === cicloId
      ? { ...x, giorno_settimana: patch.giorno_settimana, fascia_oraria: patch.fascia_oraria,
          ricorrenza: _pfRip,
          ...(state.ritualiColsOk ? { ora_inizio: oraInizio, durata_minuti: durata } : {}),
          ...(state.pianificaColsOk
                ? { pianificato_data: patch.pianificato_data, pianificato_ripetizione: RIP_DB(_pfRip) }
                : {}),
          ...(wasParked ? { parcheggiato: false, parcheggiato_at: null } : {}) }
      : x);

    if (savedOv && w.week === state.week && w.year === state.year) {
      state.agendaOverrides = [
        ...state.agendaOverrides.filter(o =>
          !(o.ciclo_id === cicloId && o.settimana === w.week && o.anno === w.year)),
        savedOv
      ];
    }

    closePianificaModal();
    render();
    if (giornaliera) {
      showToast(`Routine di ogni giorno alle ${oraInizio} · ${formatDurata(durata)}`, 'success');
    } else {
      const g = GIORNI_MAP[giorno].label;
      const f = FASCE_MAP[fascia].label.toLowerCase();
      const dd = `${String(data.getDate()).padStart(2,'0')}/${String(data.getMonth()+1).padStart(2,'0')}`;
      showToast(`Pianificato per ${g} ${dd} ${f}`, 'success');
    }
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Pianifica';
  }
}

// delega dei click sui pulsanti-opzione del modale
document.addEventListener('click', e => {
  const opt = e.target.closest('#pianificaOverlay .pf-opt');
  if (!opt) return;
  if (opt.dataset.quando) pfSelectQuando(opt.dataset.quando);
  else if (opt.dataset.rip) pfSelectRip(opt.dataset.rip);
});

