// v5 · ESERCIZIO Q2 · prossimi 3 mesi
// 1. le Q2 già in agenda + le aree dalla lista della guida · 2. attività specifiche · 3. giorno e momento
// ══════════════════════════════════════════════════════════════
const Q2_LISTA = [
  { l: 'Pianificazione dello sviluppo aziendale', area: 'Management' },
  { l: 'Formazione personale', area: 'Formazione', es: 'Corso sulla negoziazione, due mattine a novembre' },
  { l: 'Organizzazione della settimana (giorno fisso)', area: 'Management' },
  { l: 'Formazione dei collaboratori', area: 'Formazione', es: 'Sessione con il team commerciale sui follow-up' },
  { l: 'Affiancamento dei collaboratori', area: 'Management', es: 'Una giornata in visita clienti con un commerciale' },
  { l: 'Salute fisica e mentale', area: 'Famiglia / cose personali', es: 'Visita di controllo e check-up' },
  { l: 'Famiglia', area: 'Famiglia / cose personali', es: 'Settimana bianca a Cortina con la famiglia' },
  { l: 'Viaggi e vacanze', area: 'Famiglia / cose personali', es: 'Un weekend a Roma, solo noi due' },
  { l: 'Momenti con i collaboratori fuori dal lavoro', area: 'Management', es: 'Cena di Natale con il team' },
  { l: 'Nuove alleanze (network)', area: 'Vendite' },
  { l: 'Studio di nuovi prodotti e tecnologie', area: 'Ricerca e sviluppo' },
  { l: 'Riunioni con i collaboratori', area: 'Management' },
  { l: 'Obiettivi annuali', area: 'Management', es: 'Mezza giornata per gli obiettivi 2027' },
  { l: 'Eventi e conferenze di settore', area: 'Formazione' },
  { l: 'Analisi dei numeri dell\'azienda', area: 'Amministrazione' },
  { l: 'Controllo del piano finanziario', area: 'Amministrazione' },
  { l: 'Ricerca di un big deal', area: 'Vendite' },
  { l: 'Sviluppo sociale e beneficenza', area: 'Famiglia / cose personali' },
  { l: 'Recruiting di persone vincenti', area: 'Management' },
  { l: 'Piani di carriera dei collaboratori', area: 'Management' },
  { l: 'Investimenti personali', area: 'Famiglia / cose personali' },
  { l: 'Mansionari e procedure interne', area: 'Management' },
  { l: 'Partnership e collaborazioni', area: 'Vendite' }
];
const PAROLE_Q2 = /(revisione|obiettivi|controllo settimanale|preparazione|gestione finanziaria|aggiornamento normativo|formazione|allineamento)/;
const GENERICHE = new Set(['salute', 'famiglia', 'vacanze', 'vacanza', 'viaggi', 'viaggio', 'formazione', 'collaboratori', 'riunioni', 'riunione', 'obiettivi', 'numeri',
  'recruiting', 'beneficenza', 'investimenti', 'partnership', 'procedure', 'mansionari', 'eventi', 'conferenze', 'alleanze', 'network', 'marketing', 'vendite', 'sport',
  'allenamento', 'personale', 'lavoro', 'team', 'affiancamento', 'pianificazione', 'sviluppo', 'prodotti', 'tecnologie', 'analisi', 'controllo', 'studio',
  'organizzazione', 'carriera', 'azienda', 'aziendale', 'clienti', 'mentale', 'fisica', 'tempo', 'libero', 'crescita', 'strategia', 'deal']);
const PAROLE_VUOTE = new Set(['di', 'del', 'della', 'dei', 'delle', 'degli', 'con', 'la', 'il', 'lo', 'le', 'i', 'gli', 'e', 'per', 'a', 'in', 'un', 'una', 'mia', 'mio', 'miei', 'mie']);
// «Famiglia», «Formazione collaboratori»: categorie, non attività a cui dare una data.
function eCategoria(t) {
  const n = normTitolo(t);
  if (!n) return false;
  if (Q2_LISTA.some(x => { const l = normTitolo(x.l); return l === n || l.startsWith(n + ' '); })) return true;
  const parole = n.split(' ').filter(w => !PAROLE_VUOTE.has(w));
  return parole.length > 0 && parole.length <= 2 && parole.every(w => GENERICHE.has(w));
}
const Q2_AVVISO = 'Questa è una categoria: rendila un\'attività a cui dare una data, es. \'Settimana bianca a Cortina con la famiglia\'';
ui.q2 = null;
let _q2N = 0;
function apriEsercizioQ2() {
  if (!state.esQ2Ok) { showToast('Esercizio Q2 spento: manca la migration (vedi Impostazioni)', 'warn'); return; }
  ui.q2 = { passo: 1, scelte: new Set(), attivita: [], agenda: null, attiva: null, occupato: null };
  disegnaQ2();
  $('q2Overlay').classList.add('open');
  caricaQ2InAgenda();
}
// Le Q2 che hai già in agenda: eventi ricorrenti di Lavoro creati da te, con una parola da attività importante nel titolo
async function caricaQ2InAgenda() {
  if (!isGcalTokenValid()) { ui.q2 = { ...ui.q2, agenda: [] }; if (ui.q2.passo === 1) disegnaQ2(); return; }
  try {
    const da = new Date(); da.setHours(0, 0, 0, 0);
    const a = new Date(da); a.setDate(a.getDate() + 28);
    const ev = await leggiEventi(da, a, CAL_LETTURA.filter(c => c.tipo === 'lavoro'));
    const scelte = leggiJson(LS5.Q2_AGENDA, {});
    const collegate = new Set(state.cicli.filter(c => bloccoEsterno(c)).map(c => c.calendar_event_id.slice(4)));
    const serie = new Map();
    ev.forEach(e => { if (e.serie && e.mio && !serie.has(e.serie) && !scelte[e.serie] && !collegate.has(e.serie) && PAROLE_Q2.test(normTitolo(e.titolo))) serie.set(e.serie, e); });
    ui.q2 = { ...ui.q2, agenda: [...serie.values()] };
  } catch (e) { console.warn('[Q2] in agenda:', e.message); ui.q2 = { ...ui.q2, agenda: [] }; }
  if (ui.q2 && ui.q2.passo === 1) disegnaQ2();
}
const RIP_DA_RRULE = r => /FREQ=MONTHLY/.test(r) ? (/INTERVAL=3/.test(r) ? 'trimestrale' : 'mensile') : /FREQ=YEARLY/.test(r) ? 'annuale' : 'settimanale';
// [È una Q2]: diventa un'Importante inderogabile collegata all'evento. Se c'è già una cosa con lo stesso titolo, si collega quella.
async function q2DaAgenda(serie, si) {
  const e = (ui.q2.agenda || []).find(x => x.serie === serie);
  if (!e) return;
  scriviJson(LS5.Q2_AGENDA, { ...leggiJson(LS5.Q2_AGENDA, {}), [serie]: si ? 'q2' : 'no' });
  ui.q2 = { ...ui.q2, agenda: ui.q2.agenda.filter(x => x.serie !== serie) };
  if (!si) { disegnaQ2(); return; }
  try {
    const m = await eventoMaster(e.calId, serie);
    const rip = RIP_DA_RRULE(((m && m.recurrence) || []).join(';'));
    const d = parseISODate(e.giorno);
    const campiQ2 = { q: 2, ...(state.inderoColOk ? { inderogabile: true } : {}), ...(ui.calEventColOk !== false ? { calendar_event_id: 'ext:' + serie } : {}),
      ...(state.ritualiColsOk && e.ora ? { ora_inizio: e.ora, durata_minuti: e.minuti || null } : {}) };
    const doppione = state.cicli.find(c => !c.done && c.ctx === 'lavoro' && titoliUguali(c.title, e.titolo));
    if (doppione) await patchCiclo(doppione.id, campiQ2);
    else {
      const nuova = await upsertCiclo({ ...rigaNuova(e.titolo, { subito: false }, 'lavoro'), ...campiQ2, note: `Evento ricorrente del calendario Lavoro: «${e.titoloOrig}»`,
        ...(state.agendaColsOk ? { giorno_settimana: giornoKeyDi(d), fascia_oraria: fasciaDi(null, e.ora) } : {}),
        ...(state.pianificaColsOk ? { pianificato_data: e.giorno, pianificato_ripetizione: RIP_DB(rip) } : {}), ricorrenza: rip });
      if (nuova) state.cicli = [nuova, ...state.cicli];
    }
    disegnaQ2();
    render();
    showToast(doppione ? `Collegata a «${doppione.title}»: ora è inderogabile` : 'Aggiunta come Importante inderogabile', 'success');
  } catch (err) { showToast('Non riesco: ' + err.message, 'error'); }
}
function disegnaQ2() {
  const s = ui.q2, body = $('q2-body');
  $('q2-passi').innerHTML = [1, 2, 3].map(n => `<span class="bp-wiz-step${s.passo >= n ? ' on' : ''}"></span>`).join('');
  $('q2-back').textContent = s.passo === 1 ? 'Annulla' : 'Indietro';
  if (s.passo === 1) {
    $('q2-titolo').textContent = 'Le tue attività importanti';
    const ag = s.agenda;
    body.innerHTML = `<p class="t-label muted">Le attività che costruiscono il futuro: nessuno ti metterà fretta per farle, per questo vanno fissate in agenda.</p>
      ${ag === null ? '<p class="list-head"><span>Le Q2 che hai già in agenda</span></p><div class="group"><div class="col-vuota">Leggo il calendario…</div></div>'
        : ag.length ? `<p class="list-head"><span>Le Q2 che hai già in agenda</span><span class="mono">${ag.length}</span></p><div class="group q2-agenda">${ag.map(e => `<div class="sugg-riga"><span><i class="ti ti-repeat" aria-hidden="true"></i><span>${escHtml(e.titolo)}<small>${escHtml(fmtGiorno(parseISODate(e.giorno)))}${e.ora ? ' · ' + e.ora : ''} · si ripete</small></span></span>
          <span class="q2-si-no"><button type="button" class="btn btn-secondary btn-sm" data-act="q2-agenda-si" data-k="${esc(e.serie)}">È una Q2</button><button type="button" class="btn btn-ghost btn-sm" data-act="q2-agenda-no" data-k="${esc(e.serie)}">No</button></span></div>`).join('')}</div>` : ''}
      <p class="list-head"><span>Su cosa vuoi lavorare nei prossimi 3 mesi?</span><span class="mono">${s.scelte.size || ''}</span></p>
      <div class="chips chips-wrap q2-chips">${Q2_LISTA.map((x, i) => `<button type="button" class="chip" data-act="q2-scelta" data-i="${i}" aria-pressed="${s.scelte.has(i)}">${escHtml(x.l)}</button>`).join('')}</div>`;
    $('q2-ok').textContent = 'Avanti';
    $('q2-ok').disabled = !s.scelte.size;
    return;
  }
  if (s.passo === 2) {
    $('q2-titolo').textContent = 'Rendile attività con una data';
    body.innerHTML = `<p class="t-label muted">Non «Vacanze con la famiglia», ma «Settimana bianca a Cortina con la famiglia». Puoi scriverne più di una per area.</p>
      ${[...s.scelte].sort((a, b) => a - b).map(i => { const x = Q2_LISTA[i], mie = s.attivita.filter(a => a.voce === i);
        return `<section class="q2-voce"><h4>${escHtml(x.l)}</h4>${mie.map(a => `<div class="q2-att"><div class="q2-att-riga"><input type="text" class="input" data-act="q2-testo" data-id="${a.id}" value="${esc(a.titolo)}" maxlength="140" placeholder="${esc(x.es ? 'Es. ' + x.es : 'Un\'attività a cui puoi dare una data')}" aria-label="Attività: ${esc(x.l)}">
          <button type="button" class="btn btn-icon" data-act="q2-togli" data-id="${a.id}" aria-label="Togli"><i class="ti ti-x"></i></button></div><p class="q2-avviso" id="q2-avv-${a.id}" role="status"${a.titolo && eCategoria(a.titolo) ? '' : ' hidden'}><i class="ti ti-alert-triangle"></i>${escHtml(Q2_AVVISO)}</p></div>`).join('')}
          <button type="button" class="btn btn-ghost btn-sm q2-piu" data-act="q2-piu" data-i="${i}"><i class="ti ti-plus"></i>Un'altra attività</button></section>`; }).join('')}`;
    $('q2-ok').textContent = 'Avanti';
    aggiornaQ2Ok();
    return;
  }
  $('q2-titolo').textContent = 'Fissale in agenda';
  const atts = s.attivita.filter(a => a.titolo.trim());
  if (s.occupato === null) q2CaricaOccupato();
  body.innerHTML = `<p class="t-label muted">Giornate intere o mezze giornate nei prossimi 3 mesi. Se l'agenda è piena, vai avanti finché trovi un giorno libero. Poi non si sposta.</p>
    ${!isGcalTokenValid() ? '<div class="avviso"><i class="ti ti-info-circle"></i><span>Google Calendar non è collegato: le attività entrano nell\'app, ma non nel calendario.</span></div>' : ''}
    ${atts.map(a => { const dd = a.data ? parseISODate(a.data) : null; const aperta = s.attiva === a.id;
      return `<section class="q2-blocco${aperta ? ' aperta' : ''}"><div class="q2-blocco-h"><b>${escHtml(a.titolo)}</b><span class="t-caption muted">${escHtml(Q2_LISTA[a.voce].area)}</span></div>
        <div class="seg" role="group" aria-label="Quanto tempo">${Object.entries(Q2.MOMENTI).map(([k, m]) => `<button type="button" data-act="q2-momento" data-id="${a.id}" data-v="${k}" aria-pressed="${a.momento === k}">${m.l}</button>`).join('')}</div>
        <button type="button" class="riga-link q2-quando" data-act="q2-apri-giorni" data-id="${a.id}" aria-expanded="${aperta}"><i class="ti ti-calendar"></i><span>${dd ? fmtGiornoLungo(dd) : 'Scegli il giorno'}</span><span></span><i class="ti ${aperta ? 'ti-chevron-up' : 'ti-chevron-down'}"></i></button>
        ${aperta ? q2Griglia(a) : ''}</section>`; }).join('')}`;
  $('q2-ok').textContent = isGcalTokenValid() ? `Crea e blocca in agenda (${atts.length})` : `Crea (${atts.length})`;
  $('q2-ok').disabled = !atts.length || atts.some(a => !a.data);
}
function aggiornaQ2Ok() {
  const s = ui.q2, atts = s.attivita.filter(a => a.titolo.trim());
  $('q2-ok').disabled = !atts.length || atts.some(a => eCategoria(a.titolo));
}
// Minuti di appuntamenti per giorno, al mattino (9–13) e al pomeriggio (14–18), nei prossimi 3 mesi
async function q2CaricaOccupato() {
  ui.q2 = { ...ui.q2, occupato: new Map() };
  if (!isGcalTokenValid()) return;
  try {
    const da = new Date(); da.setHours(0, 0, 0, 0);
    const a = new Date(da); a.setDate(a.getDate() + Q2.ORIZZONTE);
    const ev = await leggiEventi(da, a);
    const mappa = new Map(), dentro = (s, f, x, y) => Math.max(0, Math.min(f, y) - Math.max(s, x));
    ev.filter(e => e.ora && e.fine && !e.routine).forEach(e => {
      const s = minDi(e.ora), f = Math.max(s, minDi(e.fine)), v = mappa.get(e.giorno) || { mattina: 0, pomeriggio: 0 };
      mappa.set(e.giorno, { mattina: v.mattina + dentro(s, f, 540, 780), pomeriggio: v.pomeriggio + dentro(s, f, 840, 1080) });
    });
    if (!ui.q2) return;
    ui.q2 = { ...ui.q2, occupato: mappa };
    if (ui.q2.passo === 3) disegnaQ2();
  } catch (e) { console.warn('[Q2] giorni pieni:', e.message); }
}
function statoGiornoQ2(iso, momento) {
  const v = (ui.q2.occupato && ui.q2.occupato.get(iso)) || { mattina: 0, pomeriggio: 0 };
  const min = momento === 'mattina' ? v.mattina : momento === 'pomeriggio' ? v.pomeriggio : v.mattina + v.pomeriggio;
  return min >= Q2.PIENO[momento] ? 'pieno' : min > 0 ? 'parte' : '';
}
function q2Griglia(a) {
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  const primo = new Date(oggi); primo.setDate(primo.getDate() + 1);
  const ultimo = new Date(oggi); ultimo.setDate(ultimo.getDate() + Q2.ORIZZONTE);
  const lun = new Date(primo); lun.setDate(lun.getDate() - giornoIdxDi(lun));
  const altre = new Map(ui.q2.attivita.filter(x => x.id !== a.id && x.data).map(x => [x.data, x.titolo]));
  let celle = '', mese = -1;
  for (let i = 0; i < Q2.SETTIMANE * 7; i++) {
    const d = new Date(lun); d.setDate(lun.getDate() + i);
    if (d > ultimo && giornoIdxDi(d) === 0) break;
    const iso = toISODate(d), fuori = d < primo || d > ultimo;
    const stato = fuori ? '' : statoGiornoQ2(iso, a.momento);
    const nuovoMese = d.getMonth() !== mese && !fuori;
    if (nuovoMese) mese = d.getMonth();
    const etichetta = `${fmtGiornoLungo(d)}${stato === 'pieno' ? ', pieno di appuntamenti' : stato === 'parte' ? ', qualche appuntamento' : ''}${altre.has(iso) ? ', c\'è già ' + altre.get(iso) : ''}`;
    celle += `<button type="button" class="q2-g${stato ? ' ' + stato : ''}${giornoIdxDi(d) > 4 ? ' we' : ''}${altre.has(iso) ? ' presa' : ''}" data-act="q2-giorno" data-id="${a.id}" data-data="${iso}" aria-pressed="${a.data === iso}" aria-label="${esc(etichetta)}"${fuori ? ' disabled' : ''}>
      ${nuovoMese ? `<small>${d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')}</small>` : ''}<b>${d.getDate()}</b></button>`;
  }
  return `<div class="q2-griglia" role="group" aria-label="Giorni dei prossimi 3 mesi">${GIORNI.map(g => `<span class="q2-gh">${g.label.slice(0, 1)}</span>`).join('')}${celle}</div>
    <div class="legenda q2-legenda"><span><i class="q2-leg pieno"></i>pieno di appuntamenti</span><span><i class="q2-leg parte"></i>qualche appuntamento</span><span><i class="q2-leg presa"></i>un'altra attività Q2</span></div>`;
}
async function avantiQ2() {
  const s = ui.q2;
  if (s.passo === 1) {
    const voci = new Set(s.attivita.map(a => a.voce));
    const nuove = [...s.scelte].filter(i => !voci.has(i)).map(i => ({ id: 'a' + (++_q2N), voce: i, titolo: '', data: null, momento: 'giornata' }));
    ui.q2 = { ...s, passo: 2, attivita: [...s.attivita.filter(a => s.scelte.has(a.voce)), ...nuove] };
    disegnaQ2();
    setTimeout(() => { const i = document.querySelector('#q2-body input'); if (i) i.focus(); }, 100);
    return;
  }
  if (s.passo === 2) {
    const atts = s.attivita.filter(a => a.titolo.trim());
    if (!atts.length || atts.some(a => eCategoria(a.titolo))) return;
    ui.q2 = { ...s, passo: 3, attivita: atts, attiva: atts[0].id };
    disegnaQ2();
    return;
  }
  await salvaEsercizioQ2();
}
async function salvaEsercizioQ2() {
  const s = ui.q2, atts = s.attivita.filter(a => a.titolo.trim() && a.data);
  const btn = $('q2-ok');
  btn.disabled = true;
  btn.textContent = 'Un attimo…';
  const calendario = isGcalTokenValid() && await calendarPronto();
  let bloccate = 0;
  const create = [];
  try {
    for (const a of atts) {
      const area = areaPerNome(Q2_LISTA[a.voce].area) || areaPerNome('Management');
      const ctx = area && area.personale ? 'personale' : 'lavoro', m = Q2.MOMENTI[a.momento], d = parseISODate(a.data);
      const c = await upsertCiclo({ ...rigaNuova(a.titolo.trim(), { subito: false }, ctx), cat: catPerArea(area), macro_area: area ? area.nome : null,
        note: `Esercizio Q2 · ${Q2_LISTA[a.voce].l} · ${m.l.toLowerCase()}`, ...(state.inderoColOk ? { inderogabile: true } : {}),
        ...(state.ritualiColsOk ? { ora_inizio: m.ora, durata_minuti: m.durata } : {}) });
      if (!c) continue;
      state.cicli = [c, ...state.cicli];
      create.push(c);
      if (state.agendaColsOk) await pianificaInData(c, d, m.fascia);
      if (calendario) { try { await creaBlocco(ciclo(c.id), { data: a.data, ora: m.ora, durata: m.durata, completo: true }, true); bloccate++; } catch (e) { console.warn('[Q2] blocco:', e.message); } }
    }
    const { data, error } = await db.from('esercizi_q2').insert({ attivita: create.length, note: JSON.stringify(atts.map(a => ({ attivita: a.titolo, area: Q2_LISTA[a.voce].l, data: a.data, momento: a.momento }))) }).select();
    if (error) throw error;
    state.ultimoQ2 = (data && data[0] && data[0].fatto_at) || new Date().toISOString();
    if (calendario) sincronizzaPromemoria('q2', true);
    ui.q2 = null;
    closeModal('q2Overlay');
    render();
    showToast(`${plurale(create.length, 'attività Q2 fissata', 'attività Q2 fissate')}${calendario ? ` · ${bloccate} in agenda` : ''}. Ci rivediamo tra 3 mesi.`, 'success', {});
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Riprova';
    showToast(`Fatte ${create.length}, poi errore: ${e.message}`, 'error', {});
    render();
  }
}

// ══════════════════════════════════════════════════════════════
