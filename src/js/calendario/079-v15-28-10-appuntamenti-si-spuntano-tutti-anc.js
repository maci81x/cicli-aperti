// v15 · 28/10 · APPUNTAMENTI: si spuntano tutti, anche quelli di tutto il giorno, e si chiudono con un feedback
// · «Fatto» e «Fatto con feedback» in cima al foglio dell'appuntamento
// · il feedback resta nell'app (Fatte, cercabile) e in fondo alla descrizione su Google (solo i tuoi senza invitati)
// · «Non è mio» e «Cancella da Google Calendar» sotto «Altro»
// ══════════════════════════════════════════════════════════════
const multiGiorno = e => !!(e && e.tuttoIlGiorno && giorniEvento(e) > 1);
eventoSpuntabile = function (e) { return !!(e && e.id && !e.routine && !multiGiorno(e) && !eFiglie(e) && !eNascosto(e)); };

state.evtInfo = {};   // { id evento: { titolo, feedback, giorno, fatto_at } }
async function caricaEventiInfo() {
  const da = toISODate(new Date(Date.now() - 365 * 864e5));
  const { data, error } = await db.from(EVT_FATTI.TABELLA).select('evento_id,giorno,titolo,feedback,fatto_at').gte('giorno', da);
  if (error) return;
  state.evtInfo = Object.fromEntries((data || []).map(r => [r.evento_id, r]));
  state.evtInfoOk = true;
}
// la spunta salva anche il titolo (per ritrovarla in Fatte)
const _segnaEventoV15 = segnaEvento;
segnaEvento = async function (id, fatto) {
  const e = eventoPerId(id);
  await _segnaEventoV15.apply(this, arguments);
  if (!e || !state.evtFattiDb || !state.evtInfoOk) return;
  if (fatto) {
    state.evtInfo[id] = { ...(state.evtInfo[id] || {}), evento_id: id, giorno: e.giorno, titolo: e.titolo, fatto_at: new Date().toISOString() };
    await db.from(EVT_FATTI.TABELLA).update({ titolo: e.titolo }).eq('evento_id', id);
  } else delete state.evtInfo[id];
};
async function chiudiConFeedback(id, testo) {
  const e = eventoPerId(id);
  if (!e) return;
  const fb = String(testo || '').trim();
  state.evtFatti = { ...state.evtFatti, [id]: e.giorno };
  scriviEvtFattiLocali(state.evtFatti);
  state.evtInfo[id] = { evento_id: id, giorno: e.giorno, titolo: e.titolo, feedback: fb || null, fatto_at: new Date().toISOString() };
  try {
    if (state.evtFattiDb) {
      const r = await db.from(EVT_FATTI.TABELLA).upsert({ evento_id: id, giorno: e.giorno, ...(state.evtInfoOk ? { titolo: e.titolo, feedback: fb || null } : {}) }, { onConflict: 'evento_id' });
      if (r.error) throw r.error;
    }
  } catch (err) { showToast('Non riesco a salvare: ' + err.message, 'error'); return; }
  // su Google: in fondo alla descrizione, solo se l'appuntamento è tuo e senza invitati (gli altri lo vedrebbero)
  let suGoogle = false;
  if (fb && e.orgIo && !(e.nomiInvitati || []).length && isGcalTokenValid()) {
    try {
      const path = `/calendars/${encodeURIComponent(e.calId)}/events/${encodeURIComponent(e.id)}`;
      const ev = await gcalFetch(path, 'GET');
      if (!ev || ev.id !== e.id) throw new Error('evento non letto: la descrizione non si tocca');
      const riga = `Feedback ${fmtGgMm(oggiLocale())}: ${fb}`;
      const desc = ev && ev.description ? `${ev.description}\n\n${riga}` : riga;
      await gcalFetchUtente(`${path}?sendUpdates=none`, 'PATCH', { description: desc });   // comando di Roby sul suo appuntamento
      suGoogle = true;
    } catch (err) { console.warn('[GCal] feedback:', err.message); }
  }
  ui.evtFb = null;
  closeModal('evtOverlay');
  render();
  showToast(fb ? (suGoogle ? 'Fatto · feedback salvato, anche su Google' : 'Fatto · feedback salvato') : `Fatto: ${e.titolo}`, 'success',
    { annulla: () => segnaEvento(id, false), durata: 8000, altre: [{ etichetta: '+ Seguito', fn: () => apriSeguito({ id, title: e.titolo, ctx: e.cal === 'privato' ? 'personale' : 'lavoro' }) }] });
}

// il foglio dell'appuntamento, rifatto
ui.evtFb = null;
disegnaFoglioEvento = function (id) {
  const e = eventoPerId(id), corpo = $('evt-corpo');
  if (!corpo) return;
  if (!e) { corpo.innerHTML = '<p class="t-label muted">Questo appuntamento non c\'è più.</p>'; return; }
  $('evt-titolo').textContent = e.titolo;
  const spunta = eventoSpuntabile(e), fatto = spunta && eventoFatto(e), info = state.evtInfo[e.id];
  const chi = e.orgIo ? '' : ` · lo organizza ${escHtml(e.org || 'un\'altra persona')}`;
  const riga = (act, ico, testo, sotto, cls) => `<button type="button" class="riga-link${cls ? ' ' + cls : ''}" data-act="${act}" data-evt="${esc(e.id)}"><i class="ti ${ico}"></i><span>${testo}${sotto ? `<small>${sotto}</small>` : ''}</span><span></span><i class="ti ti-chevron-right"></i></button>`;
  const quando = `<p class="t-label muted evt-quando">${eFiglie(e) ? '<span class="tag-coach tag-figlie">Figlie</span>' : ''}${fmtGiornoLungo(parseISODate(e.giorno))} · <span class="mono">${orarioEvento(e)}</span> · calendario ${escHtml(nomeCalendario(e))}${chi}</p>`;
  const fbVisto = info && info.feedback ? `<p class="v15-fb"><i class="ti ti-message-2" aria-hidden="true"></i><span>${escHtml(info.feedback)}</span></p>` : '';
  let chiudi = '';
  if (spunta && ui.evtFb === e.id) {
    chiudi = `<div class="v15-scrivi"><label class="dl-label" for="evt-fb-testo">Com'è andata?</label>
      <textarea class="input textarea" id="evt-fb-testo" rows="3" placeholder="Es. ok, mi manda il preventivo entro venerdì">${escHtml((info && info.feedback) || '')}</textarea>
      <div class="v15-scrivi-az"><button type="button" class="btn btn-ghost btn-sm" data-act="evt-fb-annulla" data-evt="${esc(e.id)}">Annulla</button>
      <button type="button" class="btn btn-primary btn-sm" data-act="evt-fb-salva" data-evt="${esc(e.id)}"><i class="ti ti-check"></i>Fatto, salva il feedback</button></div>
      <p class="t-caption muted">${e.orgIo && !(e.nomiInvitati || []).length ? 'Lo scrivo anche in fondo alla descrizione su Google Calendar.' : 'Resta nell\'app: l\'evento è condiviso con altri, su Google non lo scrivo.'}</p></div>`;
  } else if (spunta) {
    chiudi = `<div class="group">${riga('evt-fatto', fatto ? 'ti-circle-check' : 'ti-circle', fatto ? 'Fatto' : 'Fatto', fatto ? 'tocca per toglierlo' : 'resta in agenda con la spunta')}
      ${riga('evt-fb', 'ti-message-2', fatto && info && info.feedback ? 'Modifica il feedback' : 'Fatto con feedback', 'scrivi com\'è andata')}</div>`;
  }
  const togli = e.orgIo && !(e.nomiInvitati || []).length ? riga('evt-togli-cal', 'ti-trash', 'Cancella da Google Calendar', 'non c\'è più né qui né su Google (resta 30 giorni nel Cestino di Google)', 'riga-danger') : '';
  corpo.innerHTML = `${quando}${fbVisto}${chiudi}
    <div class="group">
      <a class="riga-link" href="${esc(linkEvento(e))}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i><span>Apri in Google Calendar</span><span></span><i class="ti ti-chevron-right"></i></a>
      ${riga('evt-foglio-sposta', 'ti-arrows-move', 'Sposta', e.ricorrente ? 'solo questa volta o anche le prossime' : '')}
      ${riga('evt-in-elenco', 'ti-list-check', 'È una cosa da fare', 'mettila nell\'elenco')}
    </div>
    <details class="v15-altro"><summary>Altro</summary><div class="group">
      ${riga('evt-nascondi', 'ti-eye-off', 'Non è mio · nascondilo', 'solo nell\'app: il calendario resta com\'è')}
      ${togli}</div>
      ${!e.orgIo ? `<p class="t-caption muted">È un invito di ${escHtml(e.org || 'un\'altra persona')}: per rifiutarlo usa Google Calendar.</p>` : ''}</details>`;
  if (ui.evtFb === e.id) setTimeout(() => { const t = $('evt-fb-testo'); if (t) t.focus(); }, 50);
};
Object.assign(AZIONI, {
  'evt-fb': el => { ui.evtFb = el.dataset.evt; disegnaFoglioEvento(el.dataset.evt); },
  'evt-fb-annulla': el => { ui.evtFb = null; disegnaFoglioEvento(el.dataset.evt); },
  'evt-fb-salva': el => chiudiConFeedback(el.dataset.evt, ($('evt-fb-testo') || {}).value)
});
const _apriFoglioEventoV15 = apriFoglioEvento;
apriFoglioEvento = function (id) { ui.evtFb = null; return _apriFoglioEventoV15.apply(this, arguments); };

// Fatte: anche gli appuntamenti chiusi, con il feedback
const _vistaFatteV15 = vistaFatte;
vistaFatte = function () {
  const h = _vistaFatteV15.apply(this, arguments);
  if (ui.fatte === 'settimane') return h;
  const q = normTitolo(ui.fatteQ || '');
  const evts = Object.values(state.evtInfo || {}).filter(r => r.titolo && (!q || normTitolo(r.titolo).includes(q) || normTitolo(r.feedback || '').includes(q)))
    .sort((a, b) => String(b.giorno).localeCompare(String(a.giorno)));
  if (!evts.length) return h;
  const righe = evts.map(r => `<div class="item is-done v15-evt"><div class="item-row"><span class="evt-ico" aria-hidden="true"><span class="evt-cerchio on"><i class="ti ti-check"></i></span></span>
    <div class="item-main"><span class="item-title">${escHtml(r.titolo)}</span><span class="item-meta"><span>Appuntamento · ${fmtGgMm(r.giorno)}</span></span>${r.feedback ? `<span class="v15-fb-riga">${escHtml(r.feedback)}</span>` : ''}</div></div></div>`).join('');
  return h + `<p class="list-head"><span>Appuntamenti fatti</span><span class="mono">${evts.length}</span></p><div class="group">${righe}</div>`;
};

const _avviaAppV15 = avviaApp;
avviaApp = function (sessione) {
  const prima = _appAvviata;
  _avviaAppV15(sessione);
  if (prima) return;
  caricaEventiInfo().then(() => { if (ui.tab === 'altro') render(); }).catch(err => console.warn('[Appuntamenti] info:', err.message));
};

// ══════════════════════════════════════════════════════════════
