// v2 · DISEGNO
// ══════════════════════════════════════════════════════════════
let _renderInCoda = false;
function render() {
  // un solo disegno per giro: realtime e azioni possono chiamare render più volte di fila
  if (_renderInCoda) return;
  _renderInCoda = true;
  Promise.resolve().then(() => { _renderInCoda = false; disegna(); });
}

function disegna() {
  document.querySelectorAll('[data-tab]').forEach(b => {
    if (b.dataset.tab === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('ctx-lavoro').setAttribute('aria-pressed', String(state.ctx === 'lavoro'));
  $('ctx-personale').setAttribute('aria-pressed', String(state.ctx === 'personale'));
  updateGcalButton();
  applyTheme();

  const view = $('view');
  if (state.loading && !state.cicli.length) { renderSkeleton(); return; }
  const larga = ui.tab === 'pianifica' && !ui.sub && window.innerWidth >= 768;
  view.classList.toggle('wide', larga);

  // Tutto tiene fermo il campo di ricerca mentre si scrive: aggiorna solo l'elenco
  const vista = (modoSemplice() ? 'semplice:' : '') + (ui.sub ? ui.tab + ':' + ui.sub : ui.tab);
  if (ui.tab === 'tutto' && !ui.sub && view.dataset.vista === vista && $('tutto-corpo')) { aggiornaTutto(); return; }

  const aperto = document.querySelector('.item.is-swiped');
  const apertoId = aperto ? aperto.dataset.id : null;
  let html = '';
  if (ui.tab === 'oggi') html = vistaOggi();
  else if (ui.tab === 'pianifica') html = vistaPianifica();
  else if (ui.tab === 'tutto') html = ui.sub === 'attesa' ? vistaAttesa() : vistaTutto();
  else html = ui.sub === 'fatte' ? vistaFatte() : ui.sub === 'guida' ? vistaGuida() : ui.sub === 'impostazioni' ? vistaImpostazioni() : vistaAltro();
  view.dataset.vista = vista;
  view.innerHTML = html;
  if (ui.tab === 'tutto' && !ui.sub) aggiornaTutto();
  if (ui.tab === 'pianifica' && ui.pian === 'settimana' && window.innerWidth >= 768) agganciaAgenda();
  if (apertoId) { const el = view.querySelector(`.item[data-id="${apertoId}"]`); if (el && el.querySelector('.swipe-actions')) el.classList.add('is-swiped'); }
  if (editingId && $('modalOverlay').classList.contains('open')) disegnaPassi(ciclo(editingId));
}

function renderSkeleton() {
  $('view').innerHTML = '<div class="vh"><div><h1>&nbsp;</h1></div></div>' + '<div class="skel"></div>'.repeat(5);
}

// Nomi dei vecchi disegni ancora chiamati dalla logica: ridisegnano la vista corrente.
function renderAgenda() { render(); }
function renderBattlePlan() { render(); }

function updateGcalButton() {
  const btn = $('gcalBtn');
  if (!btn) return;
  const ok = !!isGcalTokenValid();
  btn.classList.toggle('connected', ok);
  btn.dataset.tip = ok ? 'Google Calendar collegato' : gcalDaRicollegare() ? 'Ricollega Google Calendar' : gcalEraCollegato() ? 'Google Calendar: rinnovo il collegamento' : 'Collega Google Calendar';
  btn.setAttribute('aria-label', btn.dataset.tip);
}

function vuoto(icona, titolo, testo, azione) {
  return `<div class="group empty"><span class="empty-ico"><i class="ti ${icona}"></i></span><h3 class="t-title">${titolo}</h3>${testo ? `<p>${testo}</p>` : ''}${azione || ''}</div>`;
}

function accordion(chiave, titolo, destra, corpo) {
  const aperto = ui.aperti.has(chiave);
  return `<div class="acc"><button type="button" class="acc-head" data-act="acc" data-k="${chiave}" aria-expanded="${aperto}"><i class="ti ti-chevron-right"></i><span class="acc-title">${titolo}</span><span class="acc-count">${destra || ''}</span></button><div class="acc-body">${aperto ? corpo : ''}</div></div>`;
}

const SVG_SPUNTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>';

// Una riga: spunta, titolo, tipo + un dato, ora. Azioni rapide con lo swipe (telefono) o «···» (desktop).
function riga(r, opz) {
  const o = opz && opz.solaLettura ? { ...opz, senzaAzioni: true } : (opz || {});
  const c = r.c;
  const q = computeEffectiveQ(c);
  const fatto = !!r.fatto;
  const inRitardo = !fatto && !!c.due_date && getDaysLeft(c.due_date) < 0;
  // modalità semplice: dei tipi resta solo «Subito», come icona
  const meta = !modoSemplice() ? [tagTipo(q)] : q === 1 ? [`<span class="tag tag-q1" aria-label="Subito"><i class="ti ti-flame"></i></span>`] : [];
  const delega = c.q === 3 && !fatto ? delegaTesto(c) : '';
  const passi = !o.routine && !o.nelDettaglio ? infoPassi(c, fatto) : '';
  if (o.passato && !fatto) meta.unshift('<span class="ritardo">in ritardo</span>');   // giorno passato, non fatta
  else if (delega) meta.push(`<span>${escHtml(delega)}</span>`);
  else if (r.item && r.item.tipo_slot === 'cuscinetto' && !fatto) meta.push('<span class="hint-quando"><i class="ti ti-lifebuoy"></i>nel cuscinetto</span>');
  else if (passi) meta.push(passi);
  else if (o.routine) { meta.length = 0; meta.push(`<i class="ti ti-repeat" style="font-size:14px"></i><span>ogni giorno${r.durata ? ' · ' + formatDurata(r.durata) : ''}</span>`); }
  else if (!fatto && q === 2 && !haPianificazione(c) && o.suggerisci) meta.push(`<span class="hint-quando"><i class="ti ti-calendar-plus"></i>Scegli quando</span>`);
  else if (c.due_date && !fatto) meta.push(scadenzaHtml(c));
  else if (o.extra) meta.push(`<span>${escHtml(o.extra)}</span>`);
  else if (ripetizioneDi(c) !== 'nessuna') meta.push(`<span><i class="ti ti-repeat" style="font-size:12px"></i> ${RIP_LABELS[ripetizioneDi(c)].toLowerCase()}</span>`);
  else if ((c.persone_menzionate || []).length) meta.push(`<span>${escHtml(c.persone_menzionate[0])}</span>`);
  if (bloccoEsterno(c) && !o.routine) meta.push(TAG_DAL_CAL);   // collegata a un appuntamento rimasto sul calendario
  const sep = '<span class="sep">·</span>';
  const titolo = (o.evidenzia ? evidenzia(c.title, o.evidenzia) : escHtml(c.title)) + (!fatto && !o.routine && eRapida(c, r.item) ? RAPIDA_CHIP : '');
  const stella = o.stellaDi ? o.stellaDi(r) : null;   // 'on' | 'off' | null (righe fuori dal piano)
  const btnStella = stella ? `<button type="button" class="btn btn-icon stella" data-act="stella" aria-pressed="${stella === 'on'}" aria-label="${stella === 'on' ? 'Oggi non la porto a casa' : 'Oggi la porto a casa'}" data-tip="${stella === 'on' ? 'Oggi non la porto a casa' : 'Oggi la porto a casa'}"><i class="ti ${stella === 'on' ? 'ti-star-filled' : 'ti-star'}"></i></button>` : '';
  const data = o.data ? ` data-data="${o.data}"` : '';
  const azioni = o.senzaAzioni ? '' : `<div class="swipe-actions" aria-hidden="true">
      <button type="button" class="a-fatto" data-act="q-fatto" tabindex="-1"><i class="ti ti-check"></i>Fatto</button>
      <button type="button" data-act="q-domani" tabindex="-1"><i class="ti ti-arrow-right"></i>Domani</button>
      <button type="button" data-act="q-quando" tabindex="-1"><i class="ti ti-calendar-event"></i>Quando</button>
      ${c.q === 3 ? '<button type="button" data-act="q-tornata" tabindex="-1"><i class="ti ti-arrow-back-up"></i>Tornata</button>' : '<button type="button" data-act="q-delega" tabindex="-1"><i class="ti ti-user-share"></i>Delega</button>'}
      <button type="button" data-act="q-scomponi" tabindex="-1"><i class="ti ti-list-tree"></i>Scomponi</button>
      <button type="button" data-act="q-blocca" tabindex="-1"><i class="ti ${c.calendar_event_id ? 'ti-calendar-x' : 'ti-calendar-plus'}"></i>${c.calendar_event_id ? 'Sblocca' : 'Blocca'}</button>
      <button type="button" class="a-lascia" data-act="q-lascia" tabindex="-1"><i class="ti ti-wind"></i>Lascia</button>
    </div>`;
  // 22/10 · l'icona «si ripete» sempre visibile nella riga (le routine di ogni giorno lo dicono già nel testo)
  const ripete = !o.routine && ripetizioneDi(c) !== 'nessuna' && !isGiornaliero(c)
    ? `<i class="ti ti-repeat blocco-ico" role="img" aria-label="Si ripete: ${RIP_LABELS[ripetizioneDi(c)].toLowerCase()}" data-tip="Si ripete: ${RIP_LABELS[ripetizioneDi(c)].toLowerCase()}"></i>` : '';
  const blocco = fatto ? '' : c.inderogabile && state.inderoColOk ? '<i class="ti ti-lock blocco-ico" role="img" aria-label="Importante bloccata in agenda: inderogabile" data-tip="Importante bloccata in agenda: non si sposta"></i>'
    : c.calendar_event_id && !bloccoEsterno(c) ? '<i class="ti ti-calendar-check blocco-ico" role="img" aria-label="Bloccata in agenda" data-tip="Bloccata in agenda su Google Calendar"></i>' : '';
  return `<div class="item p-q${q}${fatto ? ' is-done' : ''}${inRitardo ? ' is-late' : ''}" data-id="${c.id}"${data}${o.trascina ? ' draggable="true"' : ''}>
    ${azioni}
    <div class="item-row">
      <label class="check"><input type="checkbox" data-act="spunta"${fatto ? ' checked' : ''}${o.solaLettura ? ' disabled' : ''} aria-label="Fatta: ${esc(c.title)}"><span class="check-box">${SVG_SPUNTA}</span></label>
      <button type="button" class="item-main" data-act="apri"><span class="item-title">${titolo}</span><span class="item-meta">${meta.join(sep)}</span></button>
      <span class="item-side">${ripete}${blocco}${r.ora ? `<span class="mono">${r.ora}</span>` : (o.lato || '')}${btnStella}${o.senzaAzioni ? '' : `<button type="button" class="btn btn-icon" data-act="menu" aria-label="Azioni per ${esc(c.title)}"><i class="ti ti-dots"></i></button>`}</span>
    </div>
  </div>`;
}

function evidenzia(testo, q) {
  const t = String(testo || ''), i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return escHtml(t);
  return escHtml(t.slice(0, i)) + '<mark>' + escHtml(t.slice(i, i + q.length)) + '</mark>' + escHtml(t.slice(i + q.length));
}

// ══════════════════════════════════════════════════════════════
