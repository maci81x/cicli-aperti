// v20 · 29/10 · SEMPRE L'ULTIMA VERSIONE
// Un telefono o una scheda rimasti aperti da giorni usano il codice vecchio (es. la lettera che si ricreava).
// Quando l'app torna in primo piano, e ogni 10 minuti, guarda se sul sito c'è una versione nuova:
// se non stai scrivendo si ricarica da sola, altrimenti un messaggio con «Aggiorna».
// A OGNI RILASCIO cambiare VERSIONE_APP (vedi NOTE_LOGICA.md).
// ══════════════════════════════════════════════════════════════
const VERSIONE_APP = '2026-11-23 v53 riordino';
async function controllaVersione() {
  try {
    const r = await fetch(location.pathname + '?versione=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const m = (await r.text()).match(/const VERSIONE_APP = '([^']+)'/);
    if (!m || m[1] === VERSIONE_APP) return;
    const att = document.activeElement;
    const occupato = !!document.querySelector('.modal-overlay.open') || !!(att && /^(INPUT|TEXTAREA|SELECT)$/.test(att.tagName) && att.value);
    if (!occupato) { window.__v20Ricarica ? window.__v20Ricarica() : location.reload(); return; }
    if (ui._v20Avvisato) return;
    ui._v20Avvisato = true;
    showToast('C\'è una versione nuova dell\'app', 'info', { durata: 120000, altre: [{ etichetta: 'Aggiorna', fn: () => (window.__v20Ricarica ? window.__v20Ricarica() : location.reload()) }] });
  } catch (_) { /* senza rete: ci riprova dopo */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') controllaVersione(); });
window.addEventListener('focus', () => controllaVersione());
setInterval(controllaVersione, 10 * 60 * 1000);

// ══════════════════════════════════════════════════════════════
