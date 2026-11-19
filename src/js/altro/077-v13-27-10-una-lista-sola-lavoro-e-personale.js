// v13 · 27/10 · UNA LISTA SOLA: lavoro e personale insieme
// · l'interruttore diventa un filtro «Tutto · Lavoro · Personale» che vale solo per guardare (Oggi e Tutto) e parte da Tutto
// · Prepara la settimana, Settimana, 3 mesi, foglio del coach, Tempo per il futuro: sempre tutto
// · sulle righe l'etichetta «Personale»; le personali vanno sul calendario Privato
// · state.ctx resta il contesto proposto per le cose nuove (Lavoro, Personale se filtri Personale)
// ══════════════════════════════════════════════════════════════
const V13 = { PRIVATO: (CAL_LETTURA.find(c => c.tipo === 'privato') || {}).id || 'maci81x@gmail.com',
  PIANO: ['bpWizOverlay', 'bpRevOverlay', 'bpSnOverlay', 'prontoOverlay', 'inviaOverlay', 'riempiOverlay', 'seraOverlay', 'futuroOverlay', 'proteggiOverlay', 'bloccaOverlay'] };
state.filtro = 'tutto';
state.ctx = 'lavoro';
ui._tuttiCtx = 0;
// il filtro vale solo in Oggi e Tutto, e mai mentre prepari o chiudi la settimana
function filtroQui() {
  if (state.filtro === 'tutto' || ui._tuttiCtx > 0) return false;
  if (!['oggi', 'tutto'].includes(ui.tab)) return false;
  return !V13.PIANO.some(id => { const el = document.getElementById(id); return el && el.classList.contains('open'); });
}
function ctxVista() { return filtroQui() ? state.filtro : 'tutti'; }
function vedi(ctx) { const v = ctxVista(); return v === 'tutti' || ctx === v; }
// esegue fn vedendo tutto (anche se in Oggi c'è il filtro)
function conTutto(fn) { return function () { ui._tuttiCtx++; try { return fn.apply(this, arguments); } finally { ui._tuttiCtx--; } }; }
['creaPdfSettimana', 'quotaSettimana', 'vociCoach', 'bpwCandidati', 'righePdfGiorno'].forEach(nome => { if (typeof window[nome] === 'function') window[nome] = conTutto(window[nome]); });

// --- il filtro in alto ---
function switchCtx(ctx) {
  state.filtro = ['lavoro', 'personale'].includes(ctx) ? ctx : 'tutto';
  state.ctx = state.filtro === 'personale' ? 'personale' : 'lavoro';
  state.filter_cat = null;
  state.filter_persona = null;
  try { localStorage.setItem(LS.CAT_FILTER, ''); } catch (_) { /* niente */ }
  render();
}
const _disegnaV13 = disegna;
disegna = function () {
  const r = _disegnaV13.apply(this, arguments);
  [['ctx-tutto', 'tutto'], ['ctx-lavoro', 'lavoro'], ['ctx-personale', 'personale']].forEach(([id, v]) => { const b = $(id); if (b) b.setAttribute('aria-pressed', String(state.filtro === v)); });
  const seg = document.querySelector('.top-ctx');
  if (seg) {
    const qui = ['oggi', 'tutto'].includes(ui.tab);
    seg.style.visibility = qui ? '' : 'hidden';
    seg.setAttribute('aria-label', 'Mostra');
  }
  return r;
};

// --- l'etichetta «Personale» ---
const TAG_PERS = '<span class="tag-pers">Personale</span>';
const _rigaV13 = riga;
riga = function (r, opz) {
  const h = _rigaV13.apply(this, arguments);
  if (!r || !r.c || r.c.ctx !== 'personale' || state.filtro === 'personale' && filtroQui()) return h;
  return h.replace(/(<span class="item-meta">)([\s\S]*?)(<\/span><\/button>)/, (x, a, dentro, b) => a + dentro + (dentro.trim() ? '<span class="sep">·</span>' : '') + TAG_PERS + b);
};
const _rigaSceltaSnV13 = rigaSceltaSn;
rigaSceltaSn = function (id) {
  const h = _rigaSceltaSnV13.apply(this, arguments), c = ciclo(id);
  return c && c.ctx === 'personale' ? h.replace(/(<span class="sn-pick-txt"><span>)([\s\S]*?)(<\/span>)/, (x, a, t, b) => `${a}${t} ${TAG_PERS}${b}`) : h;
};

// --- aggiungere: con «Tutto» niente «Sei in Lavoro: la metto in Personale» ---
const _notaCtxV13 = notaCtx;
notaCtx = function () { return state.filtro === 'tutto' ? '' : _notaCtxV13.apply(this, arguments); };
const _etichettaSalvaV13 = etichettaSalva;
etichettaSalva = function (voci) { return state.filtro === 'tutto' && voci && voci.length === 1 ? 'Salva' : _etichettaSalvaV13.apply(this, arguments); };
const _dopoIlSalvataggioV13 = dopoIlSalvataggio;
dopoIlSalvataggio = function (fatte, vista) {
  if (state.filtro !== 'tutto') return _dopoIlSalvataggioV13.apply(this, arguments);
  return _dopoIlSalvataggioV13((fatte || []).map(x => ({ ...x, c: { ...x.c, ctx: vista } })), vista);
};

// --- calendario della cosa: personali sul Privato, se l'account può scriverci ---
state.calPrivatoOk = null;   // null = non ancora verificato → si scrive sul calendario di sempre
state.calColCosaOk = false;
function calDellaCosa(c) {
  if (c && c.calendar_event_id && c.calendar_event_cal) return c.calendar_event_cal;   // l'evento sta dove è stato creato
  if (c && c.ctx === 'personale' && state.calPrivatoOk === true) return V13.PRIVATO;
  return gcal.calendarId;
}
async function verificaCalPrivato() {
  if (state.calPrivatoOk !== null || !isGcalTokenValid()) return;
  try {
    const r = await gcalFetch(`/users/me/calendarList/${encodeURIComponent(V13.PRIVATO)}`, 'GET');
    state.calPrivatoOk = !!(r && ['owner', 'writer'].includes(r.accessRole));
  } catch (e) { state.calPrivatoOk = false; console.warn('[GCal] Privato non scrivibile:', e.message); }
}
const _ensureGcalCalendarV13 = ensureGcalCalendar;
ensureGcalCalendar = async function () {
  const r = await _ensureGcalCalendarV13.apply(this, arguments);
  await verificaCalPrivato();
  return r;
};

// all'avvio: si parte da Tutto; la colonna del calendario della cosa c'è?
const _avviaAppV13 = avviaApp;
avviaApp = function (sessione) {
  const prima = _appAvviata;
  _avviaAppV13(sessione);
  if (prima) return;
  state.filtro = 'tutto';
  state.ctx = 'lavoro';
  db.from('cicli').select('id,calendar_event_cal').limit(1).then(({ error }) => { state.calColCosaOk = !error; });
  verificaCalPrivato().catch(() => {});
};

// ══════════════════════════════════════════════════════════════
