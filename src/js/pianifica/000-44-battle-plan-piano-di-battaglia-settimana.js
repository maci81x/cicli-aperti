// ══════════════════════════════════════════════════════════════
// BATTLE PLAN — PIANO DI BATTAGLIA SETTIMANALE
// ══════════════════════════════════════════════════════════════
// Un battle_plan è la fotografia di una settimana: quali cicli aperti
// vengono presi in carico, in che giorno e con quale durata prevista.
// I cicli restano la fonte di verità; battle_plan_items è solo il piano.

const BP_DURATA_DEFAULT   = 30;      // minuti, quando il ciclo non ne ha una
const BP_OBIETTIVO_PCT    = 80;      // completamento atteso
const BP_SOVRACCARICO_MIN = 40 * 60; // oltre 40h di pianificato: warning

const BP_STATI = {
  bozza:  { emoji: '', label: 'Bozza'  },
  attivo: { emoji: '', label: 'Attivo' },
  chiuso: { emoji: '', label: 'Chiuso' }
};

// 7 giorni + la colonna "senza giorno specifico"
const BP_ZONE = [
  ...GIORNI.map(g => ({ key: g.key, short: g.short, label: g.label })),
  { key: 'settimana', short: 'SETT.', label: 'Settimana' }
];
const BP_ZONE_MAP = Object.fromEntries(BP_ZONE.map(z => [z.key, z]));

const _bpAutoAperti = new Set();   // week-year per cui il wizard è già stato proposto
const _bpAccAperti  = new Set();   // giorni espansi manualmente (accordion mobile)

// ── CARICAMENTO ──────────────────────────────────────────────
async function loadBattlePlan() {
  try {
    const { data, error } = await db.from('battle_plan')
      .select('*').eq('settimana', state.week).eq('anno', state.year).maybeSingle();
    if (error) throw error;
    state.bp        = data || null;
    state.bpTableOk = true;
  } catch (e) {
    state.bp      = null;
    state.bpItems = [];
    if (state.bpTableOk) {
      state.bpTableOk = false;
      console.warn('[BattlePlan] tabella non disponibile:', e.message);
    }
    return;
  }

  if (!state.bp) { state.bpItems = []; return; }
  try {
    const { data, error } = await db.from('battle_plan_items')
      .select('*').eq('battle_plan_id', state.bp.id).order('ordine');
    if (error) throw error;
    state.bpItems = data || [];
  } catch (e) {
    state.bpItems = [];
    console.warn('[BattlePlan] items non disponibili:', e.message);
  }
}

// Piano + items di una settimana qualsiasi (usato dal wizard sulla settimana futura)
async function bpFetchPlan(week, year) {
  const { data: plan, error } = await db.from('battle_plan')
    .select('*').eq('settimana', week).eq('anno', year).maybeSingle();
  if (error) throw error;
  if (!plan) return { plan: null, items: [] };
  const { data: items, error: e2 } = await db.from('battle_plan_items')
    .select('*').eq('battle_plan_id', plan.id).order('ordine');
  if (e2) throw e2;
  return { plan, items: items || [] };
}

// ── HELPER ───────────────────────────────────────────────────
function bpCiclo(item)        { return state.cicli.find(c => c.id === item.ciclo_id) || null; }
function bpItemsValidi()      { return state.bpItems.filter(i => bpCiclo(i)); }
function bpDurata(item)       { return item.durata_prevista || BP_DURATA_DEFAULT; }
function bpOra(item)          { return item.ora_prevista ? String(item.ora_prevista).slice(0, 5) : null; }

function bpFormatMin(min) {
  if (!min) return '0min';
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function bpStats(items) {
  const tot  = items.length;
  const done = items.filter(i => i.completato).length;
  return { tot, done, pct: tot ? Math.round(done / tot * 100) : 0 };
}

function bpPctClass(pct) { return pct >= 80 ? 'ok' : (pct >= 50 ? 'mid' : 'low'); }

// Un ciclo ricorrente non si chiude quando lo spunti nel piano: torna la settimana dopo.
function bpEricorrente(c) {
  if (!c) return false;
  if (isGiornaliero(c)) return true;
  return ripetizioneDi(c) !== 'nessuna';
}

function bpSottotitolo(week, year) {
  const start = getWeekStart(week, year);
  const end   = new Date(start); end.setDate(start.getDate() + 6);
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  return `Settimana ${String(week).padStart(2,'0')} · ${fmt(start)} – ${fmt(end)} · ${year}`;
}

function bpDataGiorno(week, year, idx) {
  const d = new Date(getWeekStart(week, year));
  d.setDate(d.getDate() + idx);
  return d;
}

// Settimana ISO successiva a (week, year)
function bpSettimanaSuccessiva(week, year) {
  const d = new Date(getWeekStart(week, year));
  d.setDate(d.getDate() + 7);
  return isoWeekParts(d);
}

function bpSettimanaCorrente() { return isoWeekParts(new Date()); }

// La settimana selezionata è passata? (piani passati sono in sola lettura)
function bpSettimanaPassata() {
  const oggi = getWeekStart(bpSettimanaCorrente().week, bpSettimanaCorrente().year);
  return getWeekStart(state.week, state.year) < oggi;
}

function bpSolaLettura() {
  return !!state.bp && (state.bp.stato === 'chiuso' || bpSettimanaPassata());
}

// ── VISTA BATTLE PLAN ────────────────────────────────────────




// ── GRIGLIA 7 GIORNI + COLONNA SETTIMANA ─────────────────────


// ── COMPLETAMENTO DAL PIANO ──────────────────────────────────
// Spuntare un item chiude anche il ciclo se è "una volta sola".
// I ricorrenti (settimanale/mensile/trimestrale/giornaliera) restano aperti:
// la loro ricomparsa è già gestita da ricadeInSettimana().
async function toggleBpItem(itemId) {
  const item = state.bpItems.find(i => i.id === itemId);
  if (!item) return;
  const nuovo = !item.completato;
  const quando = nuovo ? new Date().toISOString() : null;

  try {
    const { error } = await db.from('battle_plan_items')
      .update({ completato: nuovo, completato_at: quando }).eq('id', itemId);
    if (error) throw error;

    state.bpItems = state.bpItems.map(i =>
      i.id === itemId ? { ...i, completato: nuovo, completato_at: quando } : i);

    const c = bpCiclo(item);
    if (c && !bpEricorrente(c) && !!c.done !== nuovo) {
      await flipDone(c.id, c.done);
      state.cicli = state.cicli.map(x => x.id === c.id
        ? { ...x, done: nuovo, execution_status: nuovo ? 'done' : 'planned' } : x);
    }

    renderBattlePlan();
    const st = bpStats(bpItemsValidi());
    showToast(nuovo ? `Completato ✓ (${st.done}/${st.tot})` : `Riaperto (${st.done}/${st.tot})`,
      nuovo ? 'success' : 'info');
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
  }
}

// ── WIZARD: STEP 1 SELEZIONE + STEP 2 ASSEGNAZIONE ───────────
let _bpwStep  = 1;
let _bpwWeek  = null;
let _bpwYear  = null;
let _bpwPlan  = null;
let _bpwSel   = new Map();   // ciclo_id → { giorno, fascia, ora, durata, completato, completato_at, inAgenda }
let _bpwQuery = '';
let _bpwCat   = '';
let _bpwDragId = null;
let _bpwNelPiano = new Set();   // cicli già nel piano quando il wizard si è aperto (modalità modifica)
let _bpwCusc = new Map();       // cuscinetti vuoti: chiave (id della riga o 'n1', 'n2'…) → { id, giorno, ora, durata }
let _bpwRif = null;             // settimana di riferimento per il 130%: { etichetta, fatte, tot, pct } (null = non ancora letta)

// Modalità modifica: la settimana ha già un piano attivo o in bozza
function bpwModifica() { return !!_bpwPlan && _bpwPlan.stato !== 'chiuso'; }

// «questa settimana» / «la prossima settimana» / «la settimana del 26/10»
function bpwFrase(week, year) {
  const cur = bpSettimanaCorrente(), next = bpSettimanaSuccessiva(cur.week, cur.year);
  if (week === cur.week && year === cur.year) return { nome: 'questa settimana', di: 'di questa settimana' };
  if (week === next.week && year === next.year) return { nome: 'la prossima settimana', di: 'della prossima settimana' };
  const d = getWeekStart(week, year);
  const dm = `${d.getDate()}/${d.getMonth() + 1}`;
  return { nome: `la settimana del ${dm}`, di: `della settimana del ${dm}` };
}

// ‹ Settimana 42 · 12/10–18/10 ›  — non si torna prima della settimana corrente
function bpwDisegnaSettimana() {
  const da = getWeekStart(_bpwWeek, _bpwYear), a = new Date(da); a.setDate(da.getDate() + 6);
  const dm = d => `${d.getDate()}/${d.getMonth() + 1}`;
  const cur = bpSettimanaCorrente();
  const primaDiOggi = getWeekStart(_bpwWeek, _bpwYear) <= getWeekStart(cur.week, cur.year);
  document.getElementById('bpw-sub').innerHTML = `<span class="bpw-sett">
    <button type="button" class="btn btn-icon" data-act="bpw-sett" data-dir="-1" aria-label="Settimana precedente"${primaDiOggi ? ' disabled' : ''}><i class="ti ti-chevron-left"></i></button>
    <span>Settimana <span class="mono">${_bpwWeek}</span> · <span class="mono">${dm(da)}–${dm(a)}</span></span>
    <button type="button" class="btn btn-icon" data-act="bpw-sett" data-dir="1" aria-label="Settimana successiva"><i class="ti ti-chevron-right"></i></button></span>`;
}

// Armadio: cicli aperti del contesto, esclusi i rituali quotidiani
function bpwCandidati() {
  return state.cicli
    .filter(c => isAttivo(c) && !isGiornaliero(c) && !haPassiAperti(c))   // si pianificano i passi, non la cosa intera
    .sort((a, b) => {
      const qa = computeEffectiveQ(a), qb = computeEffectiveQ(b);
      if (qa !== qb) return qa - qb;
      return String(a.created_at || '').localeCompare(String(b.created_at || ''));
    });
}

function bpwDefaultDurata(c) { return (c && c.durata_minuti) || BP_DURATA_DEFAULT; }
function bpwDefaultOra(c) {
  const o = (c && (c.ora_inizio || c.scheduled_time)) || null;
  return o ? String(o).slice(0, 5) : null;
}

async function openBpWizard(week, year, preselIds) {
  if (!state.bpTableOk) { showToast('Il piano della settimana non è disponibile: migration non applicata', 'error'); return; }

  _bpwWeek = week; _bpwYear = year;
  _bpwQuery = ''; _bpwCat = ''; _bpwStep = 1;
  _bpwSel = new Map();
  _bpwNelPiano = new Set();
  _bpwCusc = new Map();
  _bpwRif = null;

  try {
    const { plan, items } = await bpFetchPlan(week, year);
    _bpwPlan = plan;
    if (bpwModifica()) items.forEach(i => { if (i.ciclo_id) _bpwNelPiano.add(i.ciclo_id); });
    items.forEach(i => {
      if (!i.ciclo_id && i.tipo_slot === 'cuscinetto') {   // cuscinetto ancora vuoto
        _bpwCusc.set(i.id, { id: i.id, giorno: i.giorno, ora: i.ora_prevista ? String(i.ora_prevista).slice(0, 5) : CUSC.META, durata: i.durata_prevista || CUSC.DURATA });
        return;
      }
      if (!state.cicli.find(c => c.id === i.ciclo_id)) return;
      _bpwSel.set(i.ciclo_id, {
        giorno: i.giorno || null, fascia: i.fascia || null,
        ora: i.ora_prevista ? String(i.ora_prevista).slice(0, 5) : null,
        durata: i.durata_prevista || BP_DURATA_DEFAULT,
        completato: !!i.completato, completato_at: i.completato_at || null,
        tipo_slot: i.tipo_slot || 'cosa'
      });
    });
    // piano nuovo (o in bozza) senza cuscinetti: due al giorno nei giorni lavorativi, se l'impostazione è accesa
    const nuovo = !plan || plan.stato === 'bozza';
    if (nuovo && state.cuscColOk && cuscAutomatici() && !items.some(i => i.tipo_slot === 'cuscinetto')) {
      GIORNI.slice(0, 5).forEach(g => { bpwAggiungiCusc(g.key, 'meta', true); bpwAggiungiCusc(g.key, 'fine', true); });
    }
  } catch (e) {
    showToast('Errore lettura piano: ' + e.message, 'error');
    return;
  }

  // Pre-selezione: cicli già pianificati in agenda per questa settimana
  bpwCandidati().forEach(c => {
    if (_bpwSel.has(c.id)) return;
    const slot = agendaSlotForWeek(c, week, year);
    if (!slot.giorno) return;
    _bpwSel.set(c.id, {
      giorno: slot.giorno, fascia: slot.fascia || null,
      ora: bpwDefaultOra(c), durata: bpwDefaultDurata(c), inAgenda: true
    });
  });

  // Cicli rinviati dalla review della settimana precedente
  (preselIds || []).forEach(id => {
    if (_bpwSel.has(id)) return;
    const c = state.cicli.find(x => x.id === id);
    if (!c) return;
    _bpwSel.set(id, { giorno: null, fascia: null, ora: bpwDefaultOra(c), durata: bpwDefaultDurata(c) });
  });

  bpwDisegnaSettimana();
  bpwCaricaRiferimento(week, year);
  const overlay = document.getElementById('bpWizOverlay');
  overlay.classList.toggle('personale-ctx', state.ctx === 'personale');
  bpwRenderCatFilter();
  bpwGoStep(1);
  overlay.classList.add('open');
}

function closeBpWizard() {
  document.getElementById('bpWizOverlay').classList.remove('open');
}

function bpwGoStep(n) {
  _bpwStep = n;
  // l'ordine del metodo i-Time: 1. le Q2 della settimana · 2. i cicli aperti realistici in 7 giorni · 3. distribuisci nei giorni
  document.getElementById('bpw-step1').style.display = n <= 2 ? '' : 'none';
  document.getElementById('bpw-step2').style.display = n === 3 ? '' : 'none';
  document.getElementById('bpw-s1').classList.toggle('on', n >= 1);
  document.getElementById('bpw-s2').classList.toggle('on', n >= 2);
  document.getElementById('bpw-s3').classList.toggle('on', n >= 3);

  const isP = state.ctx === 'personale';
  document.getElementById('bpw-title').textContent = n === 1 ? 'Le tue Q2 della settimana'
    : n === 2 ? 'Cicli aperti realistici in 7 giorni' : 'Distribuisci nei giorni';

  const next = document.getElementById('bpw-next');
  next.textContent = n < 3 ? 'Avanti' : bpwModifica() ? 'Salva il piano' : 'Attiva il piano';
  next.className = 'bp-btn primary' + (isP ? ' personale' : '');
  next.disabled = false;
  document.getElementById('bpw-back').textContent = n === 1 ? 'Annulla' : 'Indietro';

  if (n <= 2) { bpwRenderStep1(); $('bpw-list').scrollTop = 0; } else bpwRenderStep2();
}

function bpwBack() { if (_bpwStep > 1) bpwGoStep(_bpwStep - 1); else closeBpWizard(); }

async function bpwNext() {
  if (_bpwStep < 3) {
    if (_bpwStep === 2 && !_bpwSel.size) { showToast('Scegli almeno una cosa', 'warn'); return; }
    bpwGoStep(_bpwStep + 1);
    return;
  }
  await bpAttiva();
}

// ── STEP 1 ───────────────────────────────────────────────────
function bpwRenderCatFilter() {
  const sel = document.getElementById('bpw-cat');
  if (!sel) return;
  const usate = [...new Set(bpwCandidati().map(c => c.cat).filter(Boolean))];
  sel.innerHTML = '<option value="">Tutte le categorie</option>' +
    usate.map(k => `<option value="${escHtml(k)}">${escHtml(catNome(k))}</option>`).join('');
  sel.value = _bpwCat;
}

function bpwSetQuery(v) { _bpwQuery = (v || '').toLowerCase().trim(); bpwRenderStep1(); }
function bpwSetCat(v)   { _bpwCat = v || ''; bpwRenderStep1(); }

function bpwToggle(cicloId) {
  if (_bpwSel.has(cicloId)) {
    _bpwSel.delete(cicloId);
  } else {
    const c = state.cicli.find(x => x.id === cicloId);
    const slot = c ? agendaSlotForWeek(c, _bpwWeek, _bpwYear) : { giorno: null, fascia: null };
    _bpwSel.set(cicloId, {
      giorno: slot.giorno || null, fascia: slot.fascia || null,
      ora: bpwDefaultOra(c), durata: bpwDefaultDurata(c)
    });
  }
  bpwRenderStep1();
}

function bpwRenderStep1() {
  const list = document.getElementById('bpw-list');
  if (!list) return;
  list.innerHTML = '';

  const filtra = arr => arr
    .filter(c => !_bpwCat || c.cat === _bpwCat)
    .filter(c => !_bpwQuery ||
      (c.title || '').toLowerCase().includes(_bpwQuery) ||
      (c.note  || '').toLowerCase().includes(_bpwQuery));

  // passo 1: solo le Importanti (Q2) · passo 2: tutto il resto
  const q2 = _bpwStep === 1;
  const inPasso = c => (computeEffectiveQ(c) === 2) === q2;
  // in modifica: quello che è già nel piano sta in cima, anche se nel frattempo è stato tolto la spunta
  const nelPiano = filtra([..._bpwNelPiano]
    .map(id => state.cicli.find(c => c.id === id))
    .filter(c => c && inPasso(c)));
  const cicli = filtra(bpwCandidati().filter(c => !_bpwNelPiano.has(c.id) && inPasso(c)));

  const intro = document.createElement('p');
  intro.className = 'bpw-intro';
  intro.textContent = q2 ? 'Prima le attività importanti: quelle già in agenda sono inderogabili e sono già scelte.'
    : 'Ora i cicli aperti che è realistico chiudere nei prossimi 7 giorni. Il resto aspetta in Tutto.';
  list.appendChild(intro);
  if (!cicli.length && !nelPiano.length) {
    const e = document.createElement('div');
    e.className = 'bp-col-empty';
    e.textContent = q2 ? 'Nessuna Importante aperta: aggiungile da Tutto o con l\'esercizio Q2.' : 'Nessuna cosa aperta con questi filtri.';
    list.appendChild(e);
  }

  const inAgenda = c => !!c.inderogabile || !!c.calendar_event_id || !!agendaSlotForWeek(c, _bpwWeek, _bpwYear).giorno;
  const gruppi = [
    { etichetta: '<span class="tag">Già nel piano</span>', cicli: nelPiano },
    ...(q2 ? [{ etichetta: '<span class="tag tag-q2"><i class="ti ti-lock"></i>In agenda o bloccate</span>', cicli: cicli.filter(inAgenda) },
              { etichetta: '<span class="tag tag-q2"><i class="ti ti-target"></i>Altre Importanti</span>', cicli: cicli.filter(c => !inAgenda(c)) }]
      : [1, 3, 4].map(q => ({ etichetta: tagTipo(q), cicli: cicli.filter(c => computeEffectiveQ(c) === q) })))
  ];
  gruppi.forEach(g => {
    if (!g.cicli.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'bp-qgroup';
    const hd = document.createElement('div');
    hd.className = 'bp-qgroup-hd';
    hd.innerHTML = `${g.etichetta}<span style="color:var(--text-dim)">${g.cicli.length}</span>`;
    wrap.appendChild(hd);
    g.cicli.forEach(c => wrap.appendChild(bpwRigaScelta(c)));
    list.appendChild(wrap);
  });

  bpwRenderSummary();
}

function bpwRigaScelta(c) {
  const sel = _bpwSel.get(c.id);
  const row = document.createElement('label');
  row.className = 'bp-pick' + (sel ? ' sel' : '');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!sel;
  cb.onchange = () => bpwToggle(c.id);
  row.appendChild(cb);

  const main = document.createElement('div');
  main.className = 'bp-pick-main';
  const t = document.createElement('div');
  t.className = 'bp-pick-title';
  t.textContent = c.title || '';
  main.appendChild(t);

  const meta = document.createElement('div');
  meta.className = 'bp-pick-meta';
  const chip = (txt, cls) => { const s = document.createElement('span'); s.className = 'bp-chip' + (cls || ''); s.textContent = txt; meta.appendChild(s); };
  if (sel && sel.giorno && _bpwNelPiano.has(c.id)) chip(sel.giorno === 'settimana' ? 'in settimana' : GIORNI_MAP[sel.giorno].label.toLowerCase());
  if (c.parent_id && ciclo(c.parent_id)) chip(`passo di «${ciclo(c.parent_id).title}»`);
  if (c.cat) chip(catNome(c.cat));
  if (!c.parent_id && !passiDi(c.id).length && (c.durata_minuti || 0) >= PASSI.GROSSA) chip('grossa: scomponila in passi');
  const persone = (c.persone_menzionate || []).filter(Boolean);
  if (persone.length) chip(persone.slice(0, 2).join(', ') + (persone.length > 2 ? ` +${persone.length-2}` : ''));
  if (c.due_date) chip(formatDaysLeft(getDaysLeft(c.due_date)));
  if (sel && sel.inAgenda) chip('già in agenda');
  if (c.inderogabile) chip('inderogabile');
  main.appendChild(meta);
  row.appendChild(main);
  return row;
}

// «Hai scelto»: quante cose e quante ore, e il confronto con l'ultima settimana chiusa.
// Il metodo: pianificane il 130 % di quello che pensi di fare, ne chiuderai circa l'80 %.
function bpwRenderSummary() {
  const box = document.getElementById('bpw-summary');
  if (!box) return;
  const n      = _bpwSel.size;
  const minuti = [..._bpwSel.values()].reduce((s, v) => s + (v.durata || BP_DURATA_DEFAULT), 0);
  const cusc   = [..._bpwCusc.values()];
  const app    = bpwMinutiAppuntamenti();
  const rif    = _bpwRif && _bpwRif.tot ? _bpwRif : null;
  const ancora = rif && n < rif.tot * PIANO.ANCORA;

  box.innerHTML = `
    <div class="bp-sum-h">${bpwModifica() ? 'Nel piano' : 'Hai scelto'}</div>
    <div class="bp-sum-pian">Pianificato: <b class="mono">${n}</b> ${n === 1 ? 'cosa' : 'cose'} / <b class="mono">${fmtTempo(minuti)}</b></div>
    ${cusc.length ? `<div class="bp-sum-row"><span>Cuscinetti</span><strong>${cusc.length} · ${fmtTempo(cusc.reduce((s, v) => s + v.durata, 0))}</strong></div>` : ''}
    ${app ? `<div class="bp-sum-row"><span>Appuntamenti in calendario</span><strong>${fmtTempo(app)}</strong></div>` : ''}
    <div class="bp-sum-row"><span>Traguardo: farne</span><strong>${Math.ceil(n * BP_OBIETTIVO_PCT / 100)}</strong></div>
    <div class="bp-sum-rif">
      ${rif ? `<p>${rif.etichetta} ne hai chiuse <b class="mono">${rif.fatte}</b> su <b class="mono">${rif.tot}</b> (<span class="mono">${rif.pct}%</span>).</p>` : ''}
      <p>Pianificane circa il 30% in più di quante pensi di fare.</p>
      ${ancora ? `<p class="bp-sum-ancora"><i class="ti ti-plus"></i>Puoi aggiungerne ancora</p>` : ''}
    </div>`;
}

// ── STEP 2: ASSEGNAZIONE AI GIORNI (drag & drop + tap) ───────
function bpwRenderStep2() {
  const pool = document.getElementById('bpw-pool');
  const days = document.getElementById('bpw-days');
  if (!pool || !days) return;
  pool.innerHTML = '';
  days.innerHTML = '';

  const daAssegnare = [..._bpwSel.entries()].filter(([, v]) => !v.giorno);
  document.getElementById('bpw-pool-hd').textContent =
    `Senza giorno: ${daAssegnare.length}`;

  if (!daAssegnare.length) {
    const e = document.createElement('div');
    e.className = 'bp-col-empty';
    e.textContent = 'Ogni cosa ha il suo giorno';
    pool.appendChild(e);
  } else {
    daAssegnare.forEach(([id, v]) => pool.appendChild(bpwMiniCard(id, v, null)));
  }

  BP_ZONE.forEach((z, idx) => {
    const isWeekCol = z.key === 'settimana';
    const date  = isWeekCol ? null : bpDataGiorno(_bpwWeek, _bpwYear, idx);
    const lista = [..._bpwSel.entries()].filter(([, v]) => v.giorno === z.key);
    const min   = lista.reduce((s, [, v]) => s + (v.durata || BP_DURATA_DEFAULT), 0);

    const zone = document.createElement('div');
    zone.className = 'bp-drop';
    zone.dataset.zona = z.key;

    const hd = document.createElement('div');
    hd.className = 'bp-drop-hd';
    hd.innerHTML = isWeekCol
      ? `<span>IN SETTIMANA</span><span class="bp-drop-tot">${lista.length ? bpFormatMin(min) : '—'}</span>`
      : `<span>${z.short} ${date.getDate()}/${date.getMonth()+1}</span><span class="bp-drop-tot">${lista.length ? bpFormatMin(min) : '—'}</span>`;
    zone.appendChild(hd);

    const body = document.createElement('div');
    body.className = 'bp-drop-body';
    if (!lista.length) {
      const e = document.createElement('div');
      e.className = 'bp-col-empty';
      e.textContent = '—';
      body.appendChild(e);
    } else {
      lista
        .sort((a, b) => (a[1].ora || '99:99').localeCompare(b[1].ora || '99:99'))
        .forEach(([id, v]) => body.appendChild(bpwMiniCard(id, v, z.key)));
    }
    zone.appendChild(body);

    bpwAttachDrop(zone, z.key);
    days.appendChild(zone);
  });
}

function bpwMiniCard(cicloId, v, zonaKey) {
  const c = state.cicli.find(x => x.id === cicloId);
  const q = c ? computeEffectiveQ(c) : 2;

  const el = document.createElement('div');
  el.className = 'bp-mini q' + q;
  el.draggable = true;
  el.dataset.id = cicloId;
  el.dataset.tip = 'Trascina in un giorno, oppure tocca per scegliere giorno e momento';

  const x = document.createElement('span');
  x.className = 'bp-mini-x';
  x.textContent = '✕';
  x.setAttribute('aria-label', 'Togli dal piano');
  x.onclick = e => { e.stopPropagation(); _bpwSel.delete(cicloId); bpwRenderStep2(); };
  el.appendChild(x);

  const t = document.createElement('span');
  t.textContent = c ? (c.title || '') : '(ciclo eliminato)';
  el.appendChild(t);

  const meta = document.createElement('div');
  meta.className = 'bp-mini-meta';
  const parti = [];
  if (v.ora) parti.push(v.ora);
  if (v.fascia && FASCE_MAP[v.fascia]) parti.push(FASCE_MAP[v.fascia].label.toLowerCase());
  parti.push(bpFormatMin(v.durata || BP_DURATA_DEFAULT));
  meta.textContent = parti.join(' · ');
  el.appendChild(meta);

  el.onclick = () => bpSlotOpen(cicloId, zonaKey || v.giorno || 'lunedi');
  el.addEventListener('dragstart', e => {
    _bpwDragId = cicloId;
    el.classList.add('dragging');
    try { e.dataTransfer.setData('text/plain', cicloId); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
  });
  el.addEventListener('dragend', () => {
    _bpwDragId = null;
    el.classList.remove('dragging');
    document.querySelectorAll('.bp-drop.drag-over').forEach(z => z.classList.remove('drag-over'));
  });
  return el;
}

function bpwAttachDrop(zone, zonaKey) {
  zone.addEventListener('dragover', e => {
    if (!_bpwDragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', e => {
    if (zone.contains(e.relatedTarget)) return;
    zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    let id = _bpwDragId;
    try { id = e.dataTransfer.getData('text/plain') || id; } catch (_) {}
    _bpwDragId = null;
    if (!id || !_bpwSel.has(id)) return;
    const v = _bpwSel.get(id);
    // Fascia e durata già note (o colonna "settimana"): assegna diretto, senza chiedere
    if (zonaKey === 'settimana' || (v.fascia && v.durata)) {
      _bpwSel.set(id, { ...v, giorno: zonaKey, fascia: zonaKey === 'settimana' ? null : v.fascia });
      bpwRenderStep2();
    } else {
      bpSlotOpen(id, zonaKey);
    }
  });
}

// ── MINI PANNELLO: giorno / fascia / ora / durata ────────────
let _bpsCicloId = null;
let _bpsFascia  = 'mattina';

function bpSlotOpen(cicloId, giornoKey) {
  const v = _bpwSel.get(cicloId);
  if (!v) return;
  const c = state.cicli.find(x => x.id === cicloId);
  _bpsCicloId = cicloId;
  _bpsFascia  = v.fascia || 'mattina';

  document.getElementById('bps-sub').textContent = c ? (c.title || '') : '';

  const gsel = document.getElementById('bps-giorno');
  gsel.innerHTML = BP_ZONE.map(z =>
    `<option value="${z.key}">${z.key === 'settimana' ? 'In settimana, senza giorno' : z.label}</option>`).join('');
  gsel.value = giornoKey || v.giorno || 'lunedi';

  const fasce = document.getElementById('bps-fasce');
  fasce.innerHTML = '';
  FASCE.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bp-slot-opt' + (f.key === _bpsFascia ? ' sel' : '');
    b.textContent = f.label;
    b.onclick = () => {
      _bpsFascia = f.key;
      [...fasce.children].forEach(x => x.classList.toggle('sel', x === b));
    };
    fasce.appendChild(b);
  });

  document.getElementById('bps-ora').value = v.ora || '';
  const dsel = document.getElementById('bps-durata');
  const dur  = String(v.durata || bpwDefaultDurata(c));
  dsel.value = [...dsel.options].some(o => o.value === dur) ? dur : String(BP_DURATA_DEFAULT);

  const panel = document.getElementById('bpSlotPanel');
  panel.classList.toggle('personale-ctx', state.ctx === 'personale');
  panel.classList.add('open');
}

function bpSlotClose() {
  document.getElementById('bpSlotPanel').classList.remove('open');
  _bpsCicloId = null;
}

function bpSlotConfirm() {
  const id = _bpsCicloId;
  if (!id || !_bpwSel.has(id)) { bpSlotClose(); return; }
  const giorno = document.getElementById('bps-giorno').value;
  const ora    = document.getElementById('bps-ora').value || null;
  const durata = parseInt(document.getElementById('bps-durata').value, 10) || BP_DURATA_DEFAULT;

  _bpwSel.set(id, {
    ..._bpwSel.get(id),
    giorno,
    fascia: giorno === 'settimana' ? null : _bpsFascia,
    ora, durata
  });
  bpSlotClose();
  bpwRenderStep2();
}

document.getElementById('bpSlotPanel').addEventListener('click', e => {
  if (e.target.id === 'bpSlotPanel') bpSlotClose();
});

// ── STEP 3: ATTIVAZIONE ──────────────────────────────────────
async function bpAttiva() {
  const btn = document.getElementById('bpw-next');
  btn.disabled = true;
  btn.textContent = 'Un attimo...';

  try {
    const { data: planRows, error } = await db.from('battle_plan')
      .upsert({ settimana: _bpwWeek, anno: _bpwYear, stato: 'attivo' }, { onConflict: 'settimana,anno' })
      .select();
    if (error) throw error;
    const plan = (planRows && planRows[0]) || _bpwPlan;
    if (!plan) throw new Error('Piano non creato');

    // rimuovi gli item non più selezionati
    const { data: esistenti, error: e1 } = await db.from('battle_plan_items')
      .select('id,ciclo_id').eq('battle_plan_id', plan.id);
    if (e1) throw e1;
    // via le cose tolte e i cuscinetti vuoti tolti (le righe senza cosa restano solo se sono ancora nel wizard)
    const daEliminare = (esistenti || []).filter(i => i.ciclo_id ? !_bpwSel.has(i.ciclo_id) : !_bpwCusc.has(i.id)).map(i => i.id);
    if (daEliminare.length) {
      const { error: e2 } = await db.from('battle_plan_items').delete().in('id', daEliminare);
      if (e2) throw e2;
    }

    const rows = [..._bpwSel.entries()].map(([cicloId, v], idx) => ({
      battle_plan_id:  plan.id,
      ciclo_id:        cicloId,
      giorno:          v.giorno || 'settimana',
      fascia:          v.giorno === 'settimana' || !v.giorno ? null : (v.fascia || null),
      ora_prevista:    v.ora || null,
      durata_prevista: v.durata || BP_DURATA_DEFAULT,
      completato:      !!v.completato,
      completato_at:   v.completato_at || null,
      ordine:          idx,
      ...(state.cuscColOk ? { tipo_slot: v.tipo_slot || 'cosa' } : {})
    }));
    if (rows.length) {
      const { error: e3 } = await db.from('battle_plan_items')
        .upsert(rows, { onConflict: 'battle_plan_id,ciclo_id' });
      if (e3) throw e3;
    }
    if (state.cuscColOk) await bpwSalvaCuscinetti(plan.id, rows.length);
    const suCalendar = !!(document.getElementById('bpw-cal') || {}).checked;
    if (document.getElementById('bpw-cal')) lsScrivi(LS4.BPW_CAL, suCalendar ? '1' : null);

    const n = rows.length;
    const modifica = bpwModifica();
    closeBpWizard();

    // porta la vista sulla settimana appena pianificata
    if (state.week !== _bpwWeek || state.year !== _bpwYear) {
      state.week = _bpwWeek; state.year = _bpwYear;
      localStorage.setItem(LS.WEEK, state.week);
      await reloadWeekData();
    } else {
      await loadBattlePlan();
    }
    ui.pian = 'settimana';
    vai('pianifica');
    caricaRimaste();
    ui.pianoProssima = null;
    showToast(modifica ? `Piano aggiornato: ${n} cose` : `Piano della settimana pronto: ${n} cose`, 'success');
    // gli eventi già bloccati seguono il nuovo giorno/ora; con la spunta si creano anche quelli che mancano
    if (suCalendar) setTimeout(() => mettiPianoSuCalendar(), 600); else allineaBlocchi();
  } catch (err) {
    showToast('Errore attivazione: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = bpwModifica() ? 'Salva il piano' : 'Attiva il piano';
  }
}

// ── REVIEW: CHIUSURA SETTIMANA ───────────────────────────────
let _bpRevScelte = new Map();   // item_id → 'sposta' | 'armadio' | 'chiudi'

const BP_REV_OPZIONI = [
  { key: 'sposta',  label: ' Prossima settimana' },
  { key: 'armadio', label: ' Rimetti nell\'armadio' },
  { key: 'chiudi',  label: ' Chiudi comunque' }
];



// ── Q2: SPINTA VERSO L'AGENDA ────────────────────────────────
// Banner informativo sotto il quadrant picker: i Q2 non urgenti spariscono
// se non vengono piazzati in agenda. Non blocca il salvataggio.
async function q2PianificaOra() {
  if (editingId) {
    const id = editingId;
    closeModal('modalOverlay');
    openPianificaModal(id);
    return;
  }
  const titolo = document.getElementById('f-title').value.trim();
  if (!titolo) { showToast('Inserisci prima un titolo', 'warn'); return; }
  const saved = await saveCiclo();
  if (saved && saved.id) setTimeout(() => openPianificaModal(saved.id), 150);
}

// ── EXPORT PDF A4 ────────────────────────────────────────────
// jsPDF usa i font standard PDF (WinAnsi): niente emoji, vanno rimosse
// altrimenti escono caratteri sporchi.
function pdfTxt(s) {
  return String(s || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}


// ── REALTIME BATTLE PLAN (canale separato: se la tabella non è in
//    publication non arrivano eventi, ma il resto dell'app non si rompe) ──
try {
  db.channel('bp-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_plan' },
        () => loadBattlePlan().then(() => { if (state.view === 'bp') renderBattlePlan(); }))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_plan_items' },
        () => loadBattlePlan().then(() => { if (state.view === 'bp') renderBattlePlan(); }))
    .subscribe();
} catch (e) { console.warn('[BattlePlan] realtime non attivo:', e.message); }


// ╔════════════════════════════════════════════════════════════╗
