// v7 · GLI APPUNTAMENTI RESTANO VISIBILI mentre il collegamento a Google si rinnova
// Gli appuntamenti di questa settimana e della prossima si tengono anche in localStorage:
// si mostrano subito all'apertura e si rileggono da Google appena il token è valido.
// ══════════════════════════════════════════════════════════════
const GCAL_CACHE = { LS: 'gcal_eventi_cache', SETTIMANE: 2 };
ui.eventiDaCache = new Set();
function settimaneDaTenere() {
  const cur = bpSettimanaCorrente(), n = bpSettimanaSuccessiva(cur.week, cur.year);
  return [settKey(cur.week, cur.year), settKey(n.week, n.year)].slice(0, GCAL_CACHE.SETTIMANE);
}
function salvaCacheEventi() {
  const tieni = settimaneDaTenere(), out = {};
  tieni.forEach(k => { if (Array.isArray(ui.eventi[k]) && !ui.eventiDaCache.has(k)) out[k] = ui.eventi[k]; });
  const prima = leggiJson(GCAL_CACHE.LS, {});
  tieni.forEach(k => { if (!out[k] && Array.isArray(prima[k])) out[k] = prima[k]; });
  try { localStorage.setItem(GCAL_CACHE.LS, JSON.stringify(out)); } catch (e) { console.warn('[GCal] copia locale degli appuntamenti:', e.message); }
}
(function ripristinaCacheEventi() {
  if (!gcalEraCollegato()) return;
  const salvati = leggiJson(GCAL_CACHE.LS, {});
  settimaneDaTenere().forEach(k => {
    if (!Array.isArray(salvati[k]) || ui.eventi[k]) return;
    ui.eventi[k] = salvati[k];
    ui.eventiDaCache.add(k);
  });
})();
// scollegando, la copia locale va via
const _disconnectGcalV6 = disconnectGcal;
disconnectGcal = function () { lsScrivi(GCAL_CACHE.LS, null); ui.eventi = {}; ui.eventiDaCache = new Set(); _disconnectGcalV6(); render(); };

// ══════════════════════════════════════════════════════════════
