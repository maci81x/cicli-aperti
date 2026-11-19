// ══════════════════════════════════════════════════════════════
// 24/10 · IPHONE: la vista non resta «scivolata» sotto la barra dopo la tastiera o il microfono
// Il documento non scorre mai (scorre solo #main): a tastiera chiusa si riporta in cima, e se l'app non copre
// lo schermo visibile se ne fissa l'altezza. Se Oggi resta vuota con i dati caricati: errore in console e ridisegno.
// ══════════════════════════════════════════════════════════════
const VISTA = { RITARDO_MS: 350, RIDISEGNO_MIN_MS: 2000 };
const campoAttivo = () => {
  const a = document.activeElement;
  if (!a || a === document.body) return false;
  if (a.isContentEditable || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') return true;
  return a.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(a.type);
};
function altezzaVisibile() {
  const vv = window.visualViewport;
  return Math.round(vv ? vv.height * (vv.scale || 1) : window.innerHeight);
}
let _oggiRidisegnata = 0;
function controllaOggiVuota(motivo) {
  if (!_appAvviata || ui.tab !== 'oggi' || ui.sub || state.loading || state.searchQuery) return;
  const view = $('view');
  if (!view || !(state.cicli || []).length) return;
  if (view.querySelector('.vh') && view.getBoundingClientRect().height > 0) return;
  const msg = `[Oggi] vista vuota con ${state.cicli.length} cose caricate (${motivo}): la ridisegno`;
  console.error(msg);
  if (window.__salvaErrore) window.__salvaErrore('vista', msg, '');
  if (Date.now() - _oggiRidisegnata < VISTA.RIDISEGNO_MIN_MS) return;
  _oggiRidisegnata = Date.now();
  delete view.dataset.vista;
  render();
}
function ripristinaVista(motivo) {
  if (campoAttivo()) return;   // tastiera aperta: è iOS che sposta la vista, apposta
  const se = document.scrollingElement || document.documentElement;
  if (window.scrollY || window.pageYOffset || se.scrollTop || document.body.scrollTop) {
    window.scrollTo(0, 0);
    se.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  const app = $('app'), main = $('main'), view = $('view');
  if (app && window.innerWidth < 768) {
    const h = altezzaVisibile(), r = app.getBoundingClientRect();
    if (Math.abs(r.top) > 1 || Math.abs(r.height - h) > 2) {
      app.style.height = h + 'px';
      console.warn(`[Vista] app spostata (${motivo}): top ${Math.round(r.top)}, alta ${Math.round(r.height)} su ${h}: rimessa a posto`);
    }
  }
  // il contenuto finito fuori dalla parte che scorre: si torna in cima
  if (main && view) {
    const rm = main.getBoundingClientRect(), rv = view.getBoundingClientRect();
    if (rv.bottom < rm.top || rv.top > rm.bottom) main.scrollTop = 0;
  }
  controllaOggiVuota(motivo);
}
let _vistaTimer = null;
function ripristinaVistaPoi(motivo, azzeraAltezza) {
  clearTimeout(_vistaTimer);
  _vistaTimer = setTimeout(() => {
    if (azzeraAltezza && !campoAttivo() && $('app')) $('app').style.height = '';
    ripristinaVista(motivo);
  }, VISTA.RITARDO_MS);
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => ripristinaVistaPoi('tastiera'));
  window.visualViewport.addEventListener('scroll', () => ripristinaVistaPoi('scorrimento'));
}
document.addEventListener('focusout', () => ripristinaVistaPoi('campo lasciato'));
window.addEventListener('orientationchange', () => ripristinaVistaPoi('rotazione', true));
window.addEventListener('resize', () => ripristinaVistaPoi('dimensioni', true));
window.addEventListener('pageshow', () => ripristinaVistaPoi('riapertura', true));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ripristinaVistaPoi('primo piano', true); });
// dopo ogni disegno: Oggi non deve restare vuota
const _renderVista = render;
render = function () {
  const r = _renderVista.apply(this, arguments);
  setTimeout(() => controllaOggiVuota('disegno'), 0);
  return r;
};

// ══════════════════════════════════════════════════════════════
// 24/10 · APPUNTAMENTI SEMPRE RILETTI DA GOOGLE
// Prima una settimana letta restava in memoria (e nella copia locale) finché non si ricaricava la pagina:
// un appuntamento cancellato su Google restava in Oggi. Ora: a ogni apertura e ogni 5 minuti si rilegge
// ogni settimana da Google e la si SOSTITUISCE (niente unione); gli annullati non entrano.
// La copia locale si usa solo finché Google non risponde; se ha più di 12 ore la vista lo dice («dati di ieri»).
// ══════════════════════════════════════════════════════════════
const EVENTI_AGG = { OGNI_MS: 5 * 60 * 1000, RIPROVA_MS: 60 * 1000, VECCHI_MS: 12 * 3600 * 1000, TS: 'gcal_eventi_cache_ts', MAX_SETTIMANE: 10 };
ui.eventiLetti = {};      // settimana → quando è arrivata da Google (in questa apertura)
ui.eventiTentati = {};    // settimana → ultimo tentativo (anche fallito)
ui.eventiCacheTs = leggiJson(EVENTI_AGG.TS, {});
const _salvaCacheEventiAgg = salvaCacheEventi;
salvaCacheEventi = function () {
  _salvaCacheEventiAgg();
  const ts = {}, prima = leggiJson(EVENTI_AGG.TS, {});
  settimaneDaTenere().forEach(k => {
    if (Array.isArray(ui.eventi[k]) && !ui.eventiDaCache.has(k) && ui.eventiLetti[k]) ts[k] = ui.eventiLetti[k];
    else if (prima[k]) ts[k] = prima[k];
  });
  ui.eventiCacheTs = ts;
  try { localStorage.setItem(EVENTI_AGG.TS, JSON.stringify(ts)); } catch (e) { console.warn('[GCal] data della copia locale:', e.message); }
};
function rileggiSettimana(week, year) {
  const k = settKey(week, year);
  if (ui.eventiCarico[k]) return ui.eventiCarico[k];
  ui.eventiTentati[k] = Date.now();
  const da = getWeekStart(week, year), a = new Date(da); a.setDate(a.getDate() + 7);
  const p = leggiEventi(da, a).then(lista => {
    // a token scaduto durante la lettura Google non ha risposto davvero: si tiene quello che c'è
    if (!isGcalTokenValid() && !lista.length) return ui.eventi[k] || [];
    ui.eventi[k] = lista.filter(e => e && e.status !== 'cancelled');   // sostituisce la settimana intera
    ui.eventiDaCache.delete(k);
    ui.eventiLetti[k] = Date.now();
    if (settimaneDaTenere().includes(k)) salvaCacheEventi();
    render();
    return ui.eventi[k];
  }).catch(e => { console.warn('[GCal] lettura appuntamenti:', e.message); return ui.eventi[k] || []; })
    .finally(() => { delete ui.eventiCarico[k]; });
  ui.eventiCarico[k] = p;
  return p;
}
function caricaEventi(week, year) {
  const k = settKey(week, year);
  if (!isGcalTokenValid()) return Promise.resolve(ui.eventi[k] || []);
  if (ui.eventiCarico[k]) return ui.eventiCarico[k];
  const letto = ui.eventiLetti[k] || 0;
  if (ui.eventi[k] && !ui.eventiDaCache.has(k) && letto && Date.now() - letto < EVENTI_AGG.OGNI_MS) return Promise.resolve(ui.eventi[k]);
  const fallito = (ui.eventiTentati[k] || 0) > letto;
  if (fallito && Date.now() - ui.eventiTentati[k] < EVENTI_AGG.RIPROVA_MS) return Promise.resolve(ui.eventi[k] || []);
  return rileggiSettimana(week, year);
}
function chiaveSett(k) { const m = /^(\d{4})-W(\d{2})$/.exec(k); return m ? { week: +m[2], year: +m[1] } : null; }
function aggiornaEventiAperti(motivo) {
  if (!_appAvviata || !isGcalTokenValid() || document.visibilityState === 'hidden') return;
  const chiavi = [...new Set([...settimaneDaTenere(), settKey(state.week, state.year), ...Object.keys(ui.eventi || {})])].slice(0, EVENTI_AGG.MAX_SETTIMANE);
  chiavi.forEach(k => {
    const w = chiaveSett(k);
    if (!w || ui.eventiCarico[k]) return;
    const letto = ui.eventiLetti[k] || 0;
    if (letto && !ui.eventiDaCache.has(k) && Date.now() - letto < EVENTI_AGG.OGNI_MS - 5000) return;
    rileggiSettimana(w.week, w.year);
  });
}
setInterval(() => aggiornaEventiAperti('ogni 5 minuti'), EVENTI_AGG.OGNI_MS);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') aggiornaEventiAperti('primo piano'); });
window.addEventListener('pageshow', e => { if (e.persisted) aggiornaEventiAperti('riapertura'); });
const _handleGcalTokenAgg = _handleGcalToken;
_handleGcalToken = async function (resp) {
  const r = await _handleGcalTokenAgg.apply(this, arguments);
  aggiornaEventiAperti('nuovo token');
  return r;
};
// «dati di ieri»: la settimana di oggi viene da una lettura di più di 12 ore fa (copia locale o token scaduto)
function eventiVecchi() {
  if (!gcalEraCollegato()) return false;
  const cur = bpSettimanaCorrente(), k = settKey(cur.week, cur.year);
  if (!Array.isArray(ui.eventi[k])) return false;
  const quando = ui.eventiLetti[k] || (ui.eventiDaCache.has(k) ? (ui.eventiCacheTs || {})[k] || 0 : 0);
  return Date.now() - quando > EVENTI_AGG.VECCHI_MS;
}
const notaEventiVecchi = () => eventiVecchi() ? '<p class="gcal-ieri"><i class="ti ti-cloud-off" aria-hidden="true"></i>Appuntamenti: dati di ieri</p>' : '';
const _vistaOggiAgg = vistaOggi;
vistaOggi = function () { const h = _vistaOggiAgg.apply(this, arguments); const n = notaEventiVecchi(); return n ? h.replace('</h1></div>', '</h1>' + n + '</div>') : h; };
const _vistaPianificaAgg = vistaPianifica;
vistaPianifica = function () { const h = _vistaPianificaAgg.apply(this, arguments); const n = notaEventiVecchi(); return n && h.includes('</h1></div>') ? h.replace('</h1></div>', '</h1>' + n + '</div>') : h; };

