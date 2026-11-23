// v29 · 3/11 · IL TEMPO PER PREPARARE GLI APPUNTAMENTI (sezione 10 del canvas, idea di Leo)
// Gli appuntamenti entrano in calendario da soli: appena apri l'app, in cima a Oggi
// «N appuntamenti da preparare?» — solo quelli con persone esterne a SSI (o con parole come preventivo, offerta…).
// Niente · 15' · 30' · 1h · 2h → l'app cerca uno spazio libero dalle 8 alle 18, il giorno lavorativo prima;
// se è pieno il giorno prima ancora, fino a 5 giorni. «Va bene» = una cosa in Oggi + un blocco su Google Calendar.
// Finché non rispondi resta una proposta: non crea niente da sola. Ricorda le scelte per serie e per cliente.
// Se l'appuntamento si sposta, la preparazione lo segue; se sparisce, chiede se toglierla.
// Tabella prep_appuntamenti: chiave evt:<id> (la scelta), serie:<id> e dom:<dominio> (la memoria).
// ══════════════════════════════════════════════════════════════
const V29 = { TAB: 'prep_appuntamenti', DALLE: 8 * 60, ALLE: 18 * 60, GIORNI_PRIMA: 5, ORIZZONTE: 14, MINUTI: [0, 15, 30, 60, 120], VISIBILI: 3, PASSO: 15,
  DOMINIO: 'sisoluzioniimpresa.it', CONTROLLA_MS: 60000,
  PAROLE: /\b(preventiv\w*|offert[ae]|presentazion\w*|riunione periodica|sopralluog\w*|incontro conoscitivo|colloqui\w*|docenz\w*|check.?up|audit|trattativa|proposta|contratto|firma)\b/i };
state.prep = new Map();
ui.v29Scelta = {}; ui.v29Slot = {}; ui.v29Tutti = false; ui.v29Lavoro = new Set();
const v29Etich = m => m === 0 ? 'Niente' : m < 60 ? m + "'" : (m / 60) + 'h';
const v29Durata = m => m < 60 ? m + "'" : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}'` : (m / 60) + 'h';

// --- gli eventi sanno chi è esterno ---
const _eventoDaV29 = eventoDa;
eventoDa = function (raw, cal) {
  const e = _eventoDaV29(raw, cal);
  if (!e || !raw) return e;
  const esterno = m => { m = String(m || '').toLowerCase(); return m.includes('@') && !MIE_EMAIL.has(m) && !m.endsWith('@' + V29.DOMINIO) && !/calendar\.google\.com$/.test(m); };
  e.esterni = unici([...(raw.attendees || []).filter(x => !x.self && !x.resource).map(x => x.email), raw.organizer && !raw.organizer.self ? raw.organizer.email : null].filter(esterno).map(m => m.toLowerCase()));
  e.descrBreve = String(raw.description || '').slice(0, 600);
  e.interni = unici((raw.attendees || []).filter(x => !x.self && !x.resource).map(x => String(x.email || '').toLowerCase()).filter(m => m.endsWith('@' + V29.DOMINIO)));
  return e;
};

// --- caricamento ---
async function v29Carica() {
  const { data, error } = await db.from(V29.TAB).select('*');
  if (error) { console.warn('[v29] prep:', error.message); return; }
  state.prep = new Map((data || []).map(r => [r.chiave, r]));
  render();
}
async function v29CaricaSettimane() {
  const viste = new Set();
  for (let n = 0; n <= V29.ORIZZONTE + 7; n += 7) {
    const w = isoWeekParts(piuGiorni(new Date(), Math.min(n, V29.ORIZZONTE)));
    const k = settKey(w.week, w.year);
    if (viste.has(k)) continue;
    viste.add(k);
    try { await caricaEventi(w.week, w.year); } catch (err) { console.warn('[v29] settimana:', err.message); }
  }
}
async function v29SalvaRighe(righe) {
  righe.forEach(r => state.prep.set(r.chiave, { ...(state.prep.get(r.chiave) || {}), ...r }));
  const { error } = await db.from(V29.TAB).upsert(righe.map(r => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'chiave' });
  if (error) throw error;
}
async function v29TogliRiga(chiave) {
  state.prep.delete(chiave);
  const { error } = await db.from(V29.TAB).delete().eq('chiave', chiave);
  if (error) throw error;
}

// --- quali appuntamenti ---
function v29Motivo(e) {
  const m = V29.PAROLE.exec(`${e.titolo} ${e.descrBreve || ''}`);
  return [(e.esterni || []).length ? 'invitati esterni' : '', m ? `«${m[0].toLowerCase()}»` : ''].filter(Boolean);
}
const v29Dominio = e => { const m = (e.esterni || [])[0]; return m ? m.split('@')[1] : null; };
function v29Memoria(e) {
  const s = e.serie && state.prep.get('serie:' + e.serie);
  if (s) return { minuti: s.minuti, da: 'serie' };
  const d = v29Dominio(e), r = d && state.prep.get('dom:' + d);
  if (r && r.minuti > 0) return { minuti: r.minuti, da: 'cliente' };
  return null;
}
function v29Candidati() {
  const ora = Date.now(), domani = toISODate(piuGiorni(new Date(), 1)), fino = toISODate(piuGiorni(new Date(), V29.ORIZZONTE)), visti = new Set();
  return Object.values(ui.eventi || {}).flat().filter(e => {
    if (!e || visti.has(e.id) || (visti.add(e.id), false)) return false;
    if (!e.ora || e.tuttoIlGiorno || eGiornata(e) || e.inizioMs <= ora || e.giorno < domani || e.giorno > fino) return false;
    if (e.app || e.routine || e.coach || e.prepCoach || eFiglie(e) || tipoEvento(e) !== 'altri') return false;
    if (state.prep.has('evt:' + e.id)) return false;
    const mem = v29Memoria(e);
    if (mem && mem.da === 'serie' && mem.minuti === 0) return false;   // per questa serie hai detto «Niente»
    return (e.esterni || []).length > 0 || V29.PAROLE.test(`${e.titolo} ${e.descrBreve || ''}`);
  }).sort((a, b) => a.inizioMs - b.inizioMs);
}

// --- dove metterla: il primo spazio libero dalle 8 alle 18, dal giorno lavorativo prima, fino a 5 giorni ---
function v29Occupato(d, salta) {
  const occ = eventiDelGiorno(d).filter(e => !eGiornata(e) && e.ora).map(e => [minDi(e.ora), e.fine && minDi(e.fine) > minDi(e.ora) ? minDi(e.fine) : minDi(e.ora) + (e.minuti || 60)]);
  righeGiornoData(d).forEach(r => { if (r.ora && !r.fatto && (!salta || r.c.id !== salta)) occ.push([minDi(r.ora), minDi(r.ora) + (r.durata || BP_DURATA_DEFAULT)]); });
  return occ;
}
function v29Spazio(d, minuti, salta, fine) {
  const occ = v29Occupato(d, salta), oggi = toISODate(d) === oggiLocale(), alle = Math.min(V29.ALLE, fine || V29.ALLE);
  let t = V29.DALLE;
  if (oggi) { const n = new Date(), m = n.getHours() * 60 + n.getMinutes() + 15; t = Math.max(t, Math.ceil(m / V29.PASSO) * V29.PASSO); }
  for (; t + minuti <= alle; t += V29.PASSO) if (!occ.some(([a, b]) => t < b && a < t + minuti)) return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  return null;
}
function v29TrovaSlot(e, minuti, salta) {
  const oggi = parseISODate(oggiLocale()), pieni = [];
  let d = piuGiorni(parseISODate(e.giorno), -1), lavorativi = 0;
  while (lavorativi < V29.GIORNI_PRIMA && d >= oggi) {
    const g = d.getDay();
    if (g !== 0 && g !== 6) {
      lavorativi++;
      const ora = v29Spazio(d, minuti, salta);
      if (ora) return { data: toISODate(d), ora, durata: minuti, completo: true, pieni };
      pieni.push(toISODate(d));
    }
    d = piuGiorni(d, -1);
  }
  // v29.3 · ultima possibilità: il giorno stesso, prima dell'appuntamento
  const stesso = parseISODate(e.giorno);
  if (stesso >= oggi && stesso.getDay() !== 0 && stesso.getDay() !== 6) {
    const ora = v29Spazio(stesso, minuti, salta, minDi(e.ora));
    if (ora) return { data: e.giorno, ora, durata: minuti, completo: true, pieni, stesso: true };
  }
  return { data: null, pieni };
}
const v29GiornoBreve = iso => `${GG_SETT[parseISODate(iso).getDay()]} ${fmtGgMm(iso)}`;
const v29SlotTesto = s => `${v29GiornoBreve(s.data)} · ${s.ora}–${oraFine(s.ora, s.durata)}`;

// --- il riquadro in cima a Oggi ---
function v29Annullati() {
  return [...state.prep.values()].filter(r => r.stato === 'sparito');
}
function v29Blocco() {
  const lista = v29Candidati(), spariti = v29Annullati();
  if (!lista.length && !spariti.length) return '';
  const vis = ui.v29Tutti ? lista : lista.slice(0, V29.VISIBILI);
  const voce = e => {
    const mem = v29Memoria(e), scelta = ui.v29Scelta[e.id] !== undefined ? ui.v29Scelta[e.id] : mem ? mem.minuti : null;
    const occupato = ui.v29Lavoro.has(e.id);
    let sotto = '';
    if (scelta > 0) {
      const s = ui.v29Slot[e.id] && ui.v29Slot[e.id].durata === scelta ? ui.v29Slot[e.id] : v29TrovaSlot(e, scelta);
      const proposta = ui.v29Scelta[e.id] === undefined && mem ? `<p class="v29-mem">Ti propongo <b>${v29Etich(scelta)}</b>, ${mem.da === 'serie' ? 'come le altre volte' : 'come con questo cliente'}.</p>` : '';
      sotto = s.data
        ? `${proposta}<p class="v29-slot"><i class="ti ti-calendar-check" aria-hidden="true"></i><span><b>${escHtml(v29SlotTesto(s))}</b> è libero${s.stesso ? ' (il giorno stesso, prima dell\'appuntamento)' : ''}${s.pieni.length ? ` (${s.pieni.map(v29GiornoBreve).join(', ')} ${s.pieni.length === 1 ? 'è pieno' : 'sono pieni'})` : ''}: la metto lì, anche su Google Calendar.</span></p>
           <div class="v29-ok"><button type="button" class="btn btn-primary btn-sm" data-act="v29-ok" data-evt="${esc(e.id)}"${occupato ? ' disabled' : ''}>Va bene</button><button type="button" class="btn btn-secondary btn-sm" data-act="v29-scegli" data-evt="${esc(e.id)}">Scegli tu</button></div>`
        : `${proposta}<p class="v29-slot v29-pieno"><i class="ti ti-calendar-x" aria-hidden="true"></i><span>Non trovo ${v29Durata(scelta)} liber${scelta >= 60 ? 'e' : 'i'} dalle 8 alle 18 nei ${V29.GIORNI_PRIMA} giorni lavorativi prima, né il giorno stesso prima dell'appuntamento.</span></p>
           <div class="v29-ok"><button type="button" class="btn btn-primary btn-sm" data-act="v29-scegli" data-evt="${esc(e.id)}">Scegli tu</button></div>`;
    }
    const motivo = v29Motivo(e);
    return `<div class="v29-voce${scelta === null ? ' v29-attesa' : ''}">
      <p class="v29-quando mono">${escHtml(v29GiornoBreve(e.giorno).toUpperCase())} · ${escHtml(e.ora)}${e.fine ? '–' + escHtml(e.fine) : ''}</p>
      <p class="v29-tit">${escHtml(e.titolo)}</p>
      <p class="v29-perche">${escHtml(v24ConChi(e))}${motivo.length ? ' · riconosciuto da ' + escHtml(motivo.join(', ')) : ''}</p>
      <div class="v29-min" role="group" aria-label="Tempo per prepararlo">${V29.MINUTI.map(m => `<button type="button" class="chip" data-act="v29-min" data-evt="${esc(e.id)}" data-m="${m}" aria-pressed="${scelta === m}">${v29Etich(m)}</button>`).join('')}</div>
      ${sotto}</div>`;
  };
  const sparito = r => `<div class="v29-voce v29-sparito"><p class="v29-tit">«${escHtml(r.evento_titolo || 'Appuntamento')}» non è più in calendario</p>
      <p class="v29-perche">Avevi messo ${v29Durata(r.minuti)} per prepararlo${r.slot_data ? ', ' + escHtml(v29GiornoBreve(r.slot_data)) : ''}. La tolgo?</p>
      <div class="v29-ok"><button type="button" class="btn btn-primary btn-sm" data-act="v29-sparito-togli" data-k="${esc(r.chiave)}">Togli la preparazione</button><button type="button" class="btn btn-secondary btn-sm" data-act="v29-sparito-tieni" data-k="${esc(r.chiave)}">Tienila</button></div></div>`;
  const n = lista.length;
  return `<section class="v29-prep" aria-label="Appuntamenti da preparare">
    <div class="v29-h"><span class="v29-ico"><i class="ti ti-calendar-time" aria-hidden="true"></i></span>
      <div><p class="v29-t">${n ? (n === 1 ? '1 appuntamento da preparare?' : `${n} appuntamenti da preparare?`) : 'Un appuntamento è sparito'}</p>
      <p class="v29-s">Con persone esterne · nei prossimi ${V29.ORIZZONTE} giorni · quanto tempo ti serve?</p></div></div>
    ${spariti.map(sparito).join('')}${vis.map(voce).join('')}
    ${n > V29.VISIBILI ? `<button type="button" class="btn btn-ghost btn-sm btn-block" data-act="v29-tutti">${ui.v29Tutti ? 'Mostra meno' : `Altri ${n - V29.VISIBILI}`}</button>` : ''}
    <p class="v29-nota">Finché non rispondi resta qui: non creo niente da solo.</p></section>`;
}

// --- le scelte ---
async function v29Memorizza(e, minuti) {
  const righe = [];
  if (e.serie) righe.push({ chiave: 'serie:' + e.serie, minuti, stato: 'memoria', evento_titolo: e.titolo });
  const d = v29Dominio(e);
  if (d) righe.push({ chiave: 'dom:' + d, minuti, stato: 'memoria', evento_titolo: e.titolo });
  return righe;
}
async function v29Niente(e) {
  const riga = { chiave: 'evt:' + e.id, minuti: 0, stato: 'niente', evento_id: e.id, evento_titolo: e.titolo, evento_inizio: new Date(e.inizioMs).toISOString() };
  const prima = [riga.chiave, ...(await v29Memorizza(e, 0)).map(r => r.chiave)].map(k => [k, state.prep.get(k)]);
  await v29SalvaRighe([riga, ...(await v29Memorizza(e, 0))]);
  delete ui.v29Scelta[e.id];
  render();
  showToast(`«${corta(e.titolo, 30)}»: niente preparazione${e.serie ? ' (anche le prossime volte)' : ''}`, 'info', { annulla: async () => {
    for (const [k, r] of prima) { if (r) await v29SalvaRighe([r]); else await v29TogliRiga(k); }
    render();
  } });
}
async function v29Crea(e, s) {
  if (ui.v29Lavoro.has(e.id)) return;
  ui.v29Lavoro.add(e.id);
  render();
  try {
    const ctx = e.cal === 'privato' ? 'personale' : 'lavoro';
    const titolo = `Preparare: ${e.titolo} (${v29GiornoBreve(e.giorno)} ${e.ora})`;
    const note = `Preparazione dell'appuntamento «${e.titolo}», ${v29GiornoBreve(e.giorno)} ${e.ora}${e.fine ? '–' + e.fine : ''}.\n${v24ConChi(e)}`;
    const riga = { ...rigaNuova(titolo, { data: s.data }, ctx), note, scheduled_time: s.ora, ...(v26EventoFisso(e) ? { inderogabile: true } : {}) };
    const c = await upsertCiclo(riga);
    if (!c) throw new Error('la cosa non è stata salvata');
    state.cicli = [c, ...state.cicli.filter(x => x.id !== c.id)];
    await pianificaInData(c, parseISODate(s.data), fasciaDaOra(s.ora));
    if (state.ritualiColsOk) await patchCiclo(c.id, { ora_inizio: s.ora, durata_minuti: s.durata });
    await v29SalvaRighe([{ chiave: 'evt:' + e.id, minuti: s.durata, stato: 'fatta', ciclo_id: c.id, evento_id: e.id, evento_titolo: e.titolo,
      evento_inizio: new Date(e.inizioMs).toISOString(), slot_data: s.data, slot_ora: s.ora }, ...(await v29Memorizza(e, s.durata))]);
    let suCal = false;
    if (isGcalTokenValid() && await calendarPronto()) {
      try { await creaBlocco(ciclo(c.id), { data: s.data, ora: s.ora, durata: s.durata, completo: true }, true); suCal = true; }
      catch (err) { console.warn('[v29] blocco:', err.message); }
    }
    delete ui.v29Scelta[e.id]; delete ui.v29Slot[e.id];
    render();
    showToast(`Preparazione: ${v29SlotTesto(s)}${suCal ? ' · su Google Calendar' : ''}`, 'success', { annulla: () => v29Disfa('evt:' + e.id), etichetta: 'Annulla' });
  } catch (err) { showToast('Non riesco: ' + err.message, 'error'); }
  finally { ui.v29Lavoro.delete(e.id); render(); }
}
async function v29Disfa(chiave, tieniRiga) {
  const r = state.prep.get(chiave), c = r && r.ciclo_id ? ciclo(r.ciclo_id) : null;
  try {
    if (c) { if (c.calendar_event_id) await togliBlocco(c, true); await removeCiclo(c.id); state.cicli = state.cicli.filter(x => x.id !== c.id); }
    if (!tieniRiga) await v29TogliRiga(chiave);
    render();
  } catch (err) { showToast('Non riesco: ' + err.message, 'error'); }
}
Object.assign(AZIONI, {
  'v29-min': async el => {
    const e = eventoPerId(el.dataset.evt), m = +el.dataset.m;
    if (!e) return;
    if (m === 0) { try { await v29Niente(e); } catch (err) { showToast('Non riesco: ' + err.message, 'error'); } return; }
    ui.v29Scelta[e.id] = m; delete ui.v29Slot[e.id];
    render();
  },
  'v29-ok': el => {
    const e = eventoPerId(el.dataset.evt);
    if (!e) return;
    const mem = v29Memoria(e), m = ui.v29Scelta[e.id] !== undefined ? ui.v29Scelta[e.id] : mem && mem.minuti;
    const s = ui.v29Slot[e.id] && ui.v29Slot[e.id].durata === m ? ui.v29Slot[e.id] : v29TrovaSlot(e, m);
    if (s && s.data) v29Crea(e, { data: s.data, ora: s.ora, durata: m });
  },
  'v29-scegli': el => v29ApriScegli(el.dataset.evt),
  'v29-tutti': () => { ui.v29Tutti = !ui.v29Tutti; render(); },
  'v29-sparito-togli': async el => { await v29Disfa(el.dataset.k); showToast('Preparazione tolta', 'info'); },
  'v29-sparito-tieni': async el => { const r = state.prep.get(el.dataset.k); if (r) { await v29SalvaRighe([{ ...r, stato: 'tenuta' }]); render(); } },
  'v29-sc-salva': () => v29SalvaScegli()
});

// --- «Scegli tu»: i tuoi giorni fino all'appuntamento, con appuntamenti, cose e spazi liberi (v29.1) ---
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="v29Overlay" onclick="closeModalOnBg(event,'v29Overlay')">
  <div class="modal sheet v29-sc" role="dialog" aria-labelledby="v29-sc-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><div class="sheet-head-txt"><h3 class="t-title" id="v29-sc-titolo">Quando lo prepari?</h3><p class="t-label muted" id="v29-sc-evt">—</p></div>
      <button type="button" class="btn btn-icon" onclick="closeModal('v29Overlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="v29-sc-corpo"></div>
    <details class="v29-sc-altro"><summary>Un altro giorno o un'altra ora</summary>
      <div class="v29-sc-campi">
        <label class="field-label" for="v29-sc-data">Giorno</label><select class="input" id="v29-sc-data"></select>
        <label class="field-label" for="v29-sc-ora">Ora</label><input type="time" class="input" id="v29-sc-ora" step="900">
      </div>
      <p class="t-caption v29-sc-err" id="v29-sc-err" hidden></p>
      <button type="button" class="btn btn-primary btn-block" data-act="v29-sc-salva">Mettila qui</button>
    </details>
  </div>
</div>`);
const V29_DUR_SC = [15, 30, 60, 90, 120];
// spazi liberi di un giorno tra «da» e «a» (minuti), uniti gli occupati
function v29Buchi(d, da, a, salta) {
  const occ = v29Occupato(d, salta).map(([x, y]) => [Math.max(x, da), Math.min(y, a)]).filter(([x, y]) => y > x).sort((p, q) => p[0] - q[0]);
  const buchi = []; let t = da;
  occ.forEach(([x, y]) => { if (x > t) buchi.push([t, x]); t = Math.max(t, y); });
  if (a > t) buchi.push([t, a]);
  return buchi;
}
const v29Hm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function v29GiorniScelta(e) {
  const oggi = parseISODate(oggiLocale()), giorni = [];
  let d = piuGiorni(parseISODate(e.giorno), -1), n = 0;
  while (n < V29.GIORNI_PRIMA && d >= oggi) { if (d.getDay() !== 0 && d.getDay() !== 6) { giorni.unshift(toISODate(d)); n++; } d = piuGiorni(d, -1); }
  giorni.push(e.giorno);   // v29.3 · anche il giorno stesso, solo prima dell'appuntamento; mai dopo
  return giorni;
}
function v29Interni(e) { return (e.interni || []).filter(m => !MIE_EMAIL.has(m)); }
function v29LinkCalendar(e, s) {
  const f = (iso, hm) => iso.replace(/-/g, '') + 'T' + hm.replace(':', '') + '00';
  const p = new URLSearchParams({ text: `Preparare: ${e.titolo}`, details: `Per l'appuntamento «${e.titolo}», ${v29GiornoBreve(e.giorno)} ${e.ora}.`, ctz: 'Europe/Rome' });
  if (s && s.data) p.set('dates', `${f(s.data, s.ora)}/${f(s.data, oraFine(s.ora, s.durata))}`);
  const chi = v29Interni(e);
  if (chi.length) p.set('add', chi.join(','));
  if (e.calId && e.calId.includes('@')) p.set('authuser', e.calId);
  return 'https://calendar.google.com/calendar/r/eventedit?' + p.toString();
}
function v29DisegnaScegli() {
  const e = eventoPerId(ui.v29Sc), dur = ui.v29ScDur;
  if (!e) return;
  const ora = new Date(), oraMin = ora.getHours() * 60 + ora.getMinutes();
  const giorni = v29GiorniScelta(e).map(iso => {
    const d = parseISODate(iso), oggi = iso === oggiLocale();
    let da = V29.DALLE, a = V29.ALLE;
    if (oggi) da = Math.max(da, Math.ceil((oraMin + 15) / V29.PASSO) * V29.PASSO);
    if (iso === e.giorno) a = Math.min(a, minDi(e.ora));
    const righe = [];
    eventiDelGiorno(d).filter(x => !eGiornata(x) && x.ora).forEach(x => righe.push({ t: minDi(x.ora), html: `<li class="v29-g-evt${x.id === e.id ? ' v29-g-questo' : ''}"><span class="mono">${escHtml(x.ora)}${x.fine ? '–' + escHtml(x.fine) : ''}</span><span>${escHtml(x.titolo)}${x.id === e.id ? ' · <b>da preparare</b>' : v24ConAltri(x) ? ' <i class="ti ti-users" aria-label="con altri"></i>' : ''}</span></li>` }));
    righeGiornoData(d).filter(r => r.ora && !r.fatto).forEach(r => righe.push({ t: minDi(r.ora), html: `<li class="v29-g-cosa"><span class="mono">${escHtml(r.ora)}–${escHtml(oraFine(r.ora, r.durata || BP_DURATA_DEFAULT))}</span><span>${escHtml(r.c.title)}</span></li>` }));
    if (da < a) v29Buchi(d, da, a).forEach(([x, y]) => {
      if (y - x < dur) return;
      const inizi = []; for (let t = x; t + dur <= y && inizi.length < 6; t += 30) inizi.push(t);
      righe.push({ t: x, html: `<li class="v29-g-libero"><span class="mono">${v29Hm(x)}–${v29Hm(y)}</span><span><span class="v29-g-lt">libero</span><span class="v29-g-inizi">${inizi.map(t => `<button type="button" class="chip" data-act="v29-sc-qui" data-d="${iso}" data-o="${v29Hm(t)}">${v29Hm(t)}</button>`).join('')}</span></span></li>` });
    });
    righe.sort((p, q) => p.t - q.t);
    const vuoto = !righe.some(r => /v29-g-libero/.test(r.html));
    return `<section class="v29-g"><h4 class="v29-g-h">${escHtml(v29GiornoBreve(iso))}${iso === e.giorno ? ' · il giorno dell\'appuntamento' : oggi ? ' · oggi' : ''}${vuoto ? ` <span class="v29-g-pieno">nessuno spazio da ${escHtml(v29Durata(dur))}</span>` : ''}</h4><ul class="v29-g-lista">${righe.map(r => r.html).join('') || '<li class="v29-g-cosa"><span></span><span>niente in agenda</span></li>'}</ul></section>`;
  });
  const prima = v29TrovaSlot(e, dur);
  $('v29-sc-corpo').innerHTML = `<div class="v29-sc-dur" role="group" aria-label="Quanto ti serve">${V29_DUR_SC.map(m => `<button type="button" class="chip" data-act="v29-sc-dur" data-m="${m}" aria-pressed="${m === dur}">${v29Durata(m)}</button>`).join('')}</div>
    <p class="t-caption muted v29-sc-guida">Tocca l'ora di inizio in uno spazio libero.</p>
    <div class="v29-giorni">${giorni.join('')}</div>
    <a class="btn btn-secondary btn-block v29-sc-cal" href="${esc(v29LinkCalendar(e, prima.data ? prima : null))}" target="_blank" rel="noopener"><i class="ti ti-users"></i>Serve qualcuno? Apri in Calendar</a>
    <p class="t-caption muted">Calendar ti fa vedere quando sono liberi i colleghi${v29Interni(e).length ? ` (${escHtml(v29Interni(e).map(v24Nome).join(', '))} già invitati)` : ''}. Quello che crei lì è un appuntamento normale.</p>`;
}
function v29ApriScegli(id) {
  const e = eventoPerId(id);
  if (!e) return;
  const mem = v29Memoria(e);
  ui.v29Sc = id;
  ui.v29ScDur = ui.v29Scelta[id] || (mem && mem.minuti) || 30;
  $('v29-sc-evt').textContent = `${e.titolo} · ${v29GiornoBreve(e.giorno)} ${e.ora}`;
  const s = v29TrovaSlot(e, ui.v29ScDur), ieri = toISODate(piuGiorni(parseISODate(e.giorno), -1));
  // v29.2 · a mano: solo i giorni da oggi al giorno prima dell'appuntamento (anche sabato e domenica)
  const scelte = [];
  for (let d = parseISODate(oggiLocale()); toISODate(d) <= e.giorno; d = piuGiorni(d, 1)) scelte.push(toISODate(d));   // fino al giorno stesso compreso
  $('v29-sc-data').innerHTML = scelte.length ? scelte.map(iso => `<option value="${iso}">${escHtml(v29GiornoBreve(iso))}</option>`).join('') : '<option value="">nessun giorno prima</option>';
  $('v29-sc-data').value = s.data && scelte.includes(s.data) ? s.data : scelte.includes(ieri) ? ieri : (scelte[scelte.length - 1] || '');
  $('v29-sc-ora').value = s.ora || '09:00';
  $('v29-sc-err').hidden = true;
  document.querySelector('#v29Overlay .v29-sc-altro').open = false;
  v29DisegnaScegli();
  $('v29Overlay').classList.add('open');
}
function v29MettiQui(data, ora) {
  const e = eventoPerId(ui.v29Sc), durata = ui.v29ScDur;
  const err = t => { const x = $('v29-sc-err'); x.textContent = t; x.hidden = false; document.querySelector('#v29Overlay .v29-sc-altro').open = true; };
  if (!e) { closeModal('v29Overlay'); return; }
  if (!data) return err('Scegli il giorno');
  if (!ora) return err('Scegli l\'ora');
  if (data < oggiLocale()) return err('Il giorno è già passato');
  if (data > e.giorno) return err('Va preparato entro il giorno dell\'appuntamento, non dopo');
  if (new Date(`${data}T${ora}:00`).getTime() + durata * 60000 > e.inizioMs) return err('Deve finire prima dell\'appuntamento');
  closeModal('v29Overlay');
  ui.v29Scelta[e.id] = durata;
  v29Crea(e, { data, ora, durata });
}
function v29SalvaScegli() { v29MettiQui($('v29-sc-data').value, $('v29-sc-ora').value); }
AZIONI['v29-sc-dur'] = el => { ui.v29ScDur = +el.dataset.m; v29DisegnaScegli(); };
AZIONI['v29-sc-qui'] = el => v29MettiQui(el.dataset.d, el.dataset.o);

// --- l'appuntamento si sposta o sparisce ---
let _v29Ultimo = 0, _v29InCorso = false;
function v29ControllaPresto() { if (Date.now() - _v29Ultimo > V29.CONTROLLA_MS && !_v29InCorso) setTimeout(() => v29Controlla().catch(err => console.warn('[v29] controllo:', err.message)), 0); }
function v29SettimanaLetta(iso) {
  const w = isoWeekParts(parseISODate(iso)), k = settKey(w.week, w.year);
  return Array.isArray(ui.eventi[k]) && !ui.eventiDaCache.has(k) && !!ui.eventiLetti[k];
}
async function v29Controlla() {
  if (_v29InCorso || !state.prep.size || !isGcalTokenValid()) return;
  _v29InCorso = true; _v29Ultimo = Date.now();
  let cambi = false;
  try {
    for (const r of [...state.prep.values()].filter(x => x.stato === 'fatta' && x.evento_id && x.ciclo_id)) {
      const c = ciclo(r.ciclo_id);
      if (!c || c.done) continue;
      const vecchio = Date.parse(r.evento_inizio);
      if (!(vecchio > Date.now())) continue;
      const e = eventoPerId(r.evento_id);
      if (!e) {
        if (v29SettimanaLetta(toISODate(new Date(vecchio)))) { await v29SalvaRighe([{ ...r, stato: 'sparito' }]); cambi = true; }
        continue;
      }
      if (e.inizioMs === vecchio) continue;
      const s = v29TrovaSlot(e, r.minuti, c.id);
      if (s.data) {
        await pianificaInData(c, parseISODate(s.data), fasciaDaOra(s.ora));
        await patchCiclo(c.id, { scheduled_date: s.data, scheduled_time: s.ora, title: `Preparare: ${e.titolo} (${v29GiornoBreve(e.giorno)} ${e.ora})`, ...(state.ritualiColsOk ? { ora_inizio: s.ora, durata_minuti: r.minuti } : {}) });
        aggiornaBlocco(c.id);
        showToast(`«${corta(e.titolo, 28)}» si è spostato: la preparazione va a ${v29SlotTesto(s)}`, 'info');
      } else showToast(`«${corta(e.titolo, 28)}» si è spostato e non trovo spazio per prepararlo: sposta tu «${corta(c.title, 24)}»`, 'warn');
      await v29SalvaRighe([{ ...r, evento_inizio: new Date(e.inizioMs).toISOString(), slot_data: s.data || r.slot_data, slot_ora: s.ora || r.slot_ora }]);
      cambi = true;
    }
  } finally { _v29InCorso = false; }
  if (cambi) render();
}

// --- avvio: con le altre tabelle degli appuntamenti ---
const _caricaEventiNascostiV29 = caricaEventiNascosti;
caricaEventiNascosti = async function () {
  const r = await _caricaEventiNascostiV29.apply(this, arguments);
  v29Carica().then(() => v29CaricaSettimane()).catch(err => console.warn('[v29] avvio:', err.message));
  return r;
};

// ══════════════════════════════════════════════════════════════
