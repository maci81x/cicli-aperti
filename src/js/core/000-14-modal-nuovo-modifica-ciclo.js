// ══════════════════════════════════════════════════════════════
// MODAL NUOVO/MODIFICA CICLO
// ══════════════════════════════════════════════════════════════
let editingId  = null;
let selectedQ  = 2;
let modalCtx   = 'lavoro';

function openModal(defaultQ, editId) {
  editingId = editId || null;
  selectedQ = defaultQ || 2;
  modalCtx  = state.ctx;

  const overlay = document.getElementById('modalOverlay');
  const title   = document.getElementById('modalTitle');
  const btnDel  = document.getElementById('btn-delete');
  const btnSave = document.getElementById('btn-save');
  btnSave.textContent = 'Salva';
  btnSave.disabled = false;

  let desideredCat = null;

  if (editId) {
    const c = state.cicli.find(x => x.id === editId);
    if (!c) return;
    title.textContent = 'MODIFICA CICLO';
    document.getElementById('f-title').value          = c.title || '';
    document.getElementById('f-note').value           = c.note  || '';
    desideredCat = c.cat || null;
    document.getElementById('f-date').value           = c.due_date || '';
    document.getElementById('f-week').value           = c.week  || state.week;
    document.getElementById('f-scheduled-date').value = c.scheduled_date || todayISO();
    document.getElementById('f-scheduled-time').value = c.scheduled_time || '';
    document.getElementById('f-macro-area').value     = c.macro_area || '';
    document.getElementById('f-giorno-settimana').value = c.giorno_settimana || '';
    document.getElementById('f-fascia-oraria').value    = c.fascia_oraria || '';
    selectedQ = c.q || 2;
    modalCtx  = c.ctx || state.ctx;
    btnDel.style.display = 'block';
    initPersonaChips(c.persone_menzionate || []);
  } else {
    title.textContent = 'NUOVO CICLO APERTO';
    document.getElementById('f-title').value          = '';
    document.getElementById('f-note').value           = '';
    desideredCat = state.ctx === 'personale' ? 'salute' : 'management';
    document.getElementById('f-date').value           = '';
    document.getElementById('f-week').value           = state.week;
    document.getElementById('f-scheduled-date').value = todayISO();
    document.getElementById('f-scheduled-time').value = '';
    document.getElementById('f-macro-area').value     = '';
    document.getElementById('f-giorno-settimana').value = '';
    document.getElementById('f-fascia-oraria').value    = '';
    btnDel.style.display = 'none';
    initPersonaChips([]);
  }

  const agendaRow = document.getElementById('agenda-fields-row');
  const agendaHint = document.getElementById('agenda-fields-hint');
  if (agendaRow)  agendaRow.style.display  = state.agendaColsOk ? '' : 'none';
  if (agendaHint) agendaHint.style.display = state.agendaColsOk ? '' : 'none';

  setModalCtx(modalCtx, true);
  // riapplica la categoria del ciclo dopo aver costruito le opzioni
  document.getElementById('f-cat').value = catOptionEsiste(desideredCat)
    ? desideredCat
    : (modalCtx === 'personale' ? 'salute' : 'management');
  selectQ(selectedQ);
  // On mobile, collapse "Più opzioni" by default; on desktop always open
  if (window.innerWidth <= 768) closeMoreOpts();
  else openMoreOpts();
  overlay.classList.add('open');
  if (!editId) setTimeout(() => document.getElementById('f-title').focus(), 200);   // sul dettaglio niente tastiera che salta su
}

function closeModal(overlayId) {
  const id = overlayId || 'modalOverlay';
  document.getElementById(id).classList.remove('open');
  if (id === 'modalOverlay') editingId = null;
}

function closeModalOnBg(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

// Ripopola #f-cat includendo le categorie custom (custom_<id>) nel gruppo del
// contesto giusto. Senza questo, aprire un ciclo con categoria custom perde il valore.
// Ricostruisce #f-cat con TUTTE le categorie del contesto:
// prima le builtin, poi le custom da Supabase ordinate per `ordine`.
// I value sono quelli realmente salvati in cicli.cat: 'management', 'vendite', 'custom_5'...
function renderCatOptions(ctx) {
  const sel = document.getElementById('f-cat');
  if (!sel) return;
  sel.innerHTML = '';

  const mk = (value, testo) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = testo;
    return o;
  };

  const gBuiltin = document.createElement('optgroup');
  gBuiltin.label = ctx === 'personale' ? 'Personale' : 'Lavoro';
  (CAT_BUILTIN[ctx] || CAT_BUILTIN.lavoro).forEach(k =>
    gBuiltin.appendChild(mk(k, (CAT_EMOJIS[k] || CAT_FALLBACK_EMOJI) + ' ' + (CAT_LABELS[k] || k))));
  sel.appendChild(gBuiltin);

  const custom = (state.categorie || [])
    .filter(c => c.ctx === ctx)
    .sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0));
  if (custom.length) {
    const gCustom = document.createElement('optgroup');
    gCustom.label = 'Personalizzate';
    custom.forEach(c =>
      gCustom.appendChild(mk('custom_' + c.id, (c.emoji || CAT_FALLBACK_EMOJI) + ' ' + c.nome)));
    sel.appendChild(gCustom);
  }
}

function catOptionEsiste(value) {
  const sel = document.getElementById('f-cat');
  return !!sel && [...sel.options].some(o => o.value === value);
}

// keepCat: true quando si sta solo ripristinando lo stato di un ciclo esistente,
// così il cambio di contesto non sovrascrive la categoria già impostata.
// keepCat: true da openModal (sta ripristinando un ciclo). Senza il flag (click
// su Lavoro/Personale) la scelta precedente viene mantenuta solo se esiste ancora
// nel nuovo contesto, altrimenti si ricade sul default.
function setModalCtx(ctx, keepCat) {
  modalCtx = ctx;
  const sel = document.getElementById('f-cat');
  const precedente = sel ? sel.value : null;

  document.getElementById('cpk-lavoro').classList.toggle('selected', ctx === 'lavoro');
  document.getElementById('cpk-personale').classList.toggle('selected', ctx === 'personale');
  renderCatOptions(ctx);

  if (!keepCat) {
    sel.value = catOptionEsiste(precedente)
      ? precedente
      : (ctx === 'personale' ? 'salute' : 'management');
  }
  document.getElementById('btn-save').className = 'btn-save' + (ctx === 'personale' ? ' personale' : '');
}

function selectQ(q) {
  selectedQ = q;
  document.querySelectorAll('.q-pick-btn').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.q) === q);
  });
  // I Q2 spariscono se non vengono piazzati in agenda: banner informativo, non bloccante
  const nudge = document.getElementById('q2-nudge');
  if (nudge) nudge.classList.toggle('show', q === 2);
}

async function saveCiclo() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { showToast('Inserisci un titolo', 'warn'); return; }

  const scheduledDate = document.getElementById('f-scheduled-date').value || todayISO();
  if (!scheduledDate) { showToast('La data pianificata è obbligatoria', 'warn'); return; }

  const persone_menzionate = _modalPersone.map(p => p.nome).filter(Boolean);
  const macroArea = document.getElementById('f-macro-area').value || null;

  const data = {
    title,
    note:             document.getElementById('f-note').value.trim() || null,
    cat:              document.getElementById('f-cat').value,
    due_date:         document.getElementById('f-date').value || null,
    week:             parseInt(document.getElementById('f-week').value) || state.week,
    year:             state.year,
    q:                selectedQ,
    ctx:              modalCtx,
    persone_menzionate,
    done:             false,
    da_plaud:         false,
    scheduled_date:   scheduledDate,
    scheduled_time:   document.getElementById('f-scheduled-time').value || null,
    macro_area:       macroArea,
    execution_status: 'planned',
    sync_status:      'pending',
    settimana_anno:   isoWeekStr(new Date(scheduledDate))
  };

  if (state.agendaColsOk) {
    data.giorno_settimana = document.getElementById('f-giorno-settimana').value || null;
    data.fascia_oraria    = document.getElementById('f-fascia-oraria').value || null;
  }

  if (editingId) {
    const existing = state.cicli.find(c => c.id === editingId);
    data.id            = editingId;
    data.done          = existing?.done       || false;
    data.da_plaud      = existing?.da_plaud   || false;
    data.execution_status = existing?.execution_status || 'planned';
    data.google_event_id  = existing?.google_event_id || null;
  }

  const btn = document.getElementById('btn-save');
  btn.textContent = 'Salvataggio...';
  btn.disabled = true;

  try {
    const eraModifica = !!editingId;
    const saved = await upsertCiclo(data);
    closeModal('modalOverlay');   // azzera editingId: leggilo prima
    showToast(eraModifica ? 'Salvata' : 'Aggiunta', 'success');
    // stato locale immutabile: il realtime arriverà, ma il chiamante può servire subito l'id
    if (saved && saved.id) {
      state.cicli = [saved, ...state.cicli.filter(c => c.id !== saved.id)];
    }
    // Sync to Google Calendar in background
    syncCicloToGcal({ ...data }).catch(() => {});
    return saved;
  } catch (e) {
    showToast('Errore: ' + e.message, 'error');
    btn.textContent = 'Salva';
    btn.disabled = false;
    return null;
  }
}

async function deleteCurrent() {
  if (!editingId) return;
  if (!confirm('Eliminare questo ciclo? Operazione irreversibile.')) return;
  try {
    await removeCiclo(editingId);
    closeModal('modalOverlay');
    showToast('Eliminata', 'info');
  } catch (e) {
    showToast('Errore eliminazione: ' + e.message, 'error');
  }
}

