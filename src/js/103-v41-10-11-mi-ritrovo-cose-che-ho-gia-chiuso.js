// v41 · 10/11 — «mi ritrovo cose che ho già chiuso»
// 1) Le risposte ai promemoria del calendario («Già fatta», «Lascia stare», «È un appuntamento», già trasformato…)
//    stavano solo nel browser: un altro dispositivo non le vedeva e ricreava la cosa. Ora stanno nel database
//    (tabella cal_scelte) e ogni dispositivo le legge PRIMA di guardare il calendario.
// 2) Un promemoria spuntato come fatto nell'app non diventa più una cosa da fare.
// 3) Quando l'app torna in primo piano (o torna la rete) rilegge cose e piano: una scheda rimasta aperta
//    non mostra più come aperte le cose chiuse altrove. Il piano e le spunte degli appuntamenti arrivano anche in diretta.
// ══════════════════════════════════════════════════════════════
const V41 = { TABELLA: 'cal_scelte', noti: new Set(), ok: null, ultimo: Date.now(), MIN_MS: 20000 };
async function v41LeggiScelte() {
  try {
    const { data, error } = await db.from(V41.TABELLA).select('chiave,scelta');
    if (error) { V41.ok = false; return; }
    V41.ok = true;
    const qui = leggiJson(LS5.CICLI_CAL, {});
    (data || []).forEach(r => { V41.noti.add(r.chiave); qui[r.chiave] = r.scelta; });   // vale quello deciso (anche altrove)
    scriviJson(LS5.CICLI_CAL, qui);
  } catch (e) { V41.ok = false; console.warn('[v41] scelte:', e.message); }
}
async function v41SpingiScelte() {
  if (!V41.ok) return;
  const nuove = Object.entries(leggiJson(LS5.CICLI_CAL, {})).filter(([k, v]) => v && !V41.noti.has(k));
  if (!nuove.length) return;
  try {
    const { error } = await db.from(V41.TABELLA).upsert(nuove.map(([chiave, scelta]) => ({ chiave, scelta: String(scelta) })), { onConflict: 'chiave' });
    if (error) throw error;
    nuove.forEach(([k]) => V41.noti.add(k));
  } catch (e) { console.warn('[v41] scelte non salvate:', e.message); }
}
{
  const _cercaV41 = cercaCicliInCalendario;
  let inCorso = null;
  cercaCicliInCalendario = function () {
    if (inCorso) return inCorso;   // mai due giri insieme: creerebbero due volte la stessa cosa
    inCorso = (async () => { try { await v41LeggiScelte(); await _cercaV41.apply(this, arguments); await v41SpingiScelte(); } finally { inCorso = null; } })();
    return inCorso;
  };
  const _sceltaV41 = sceltaCalCiclo;
  sceltaCalCiclo = function () { const r = _sceltaV41.apply(this, arguments); v41SpingiScelte(); return r; };
}
// rilettura quando l'app torna davanti
async function v41Rinfresca(perche) {
  if (document.visibilityState !== 'visible' || Date.now() - V41.ultimo < V41.MIN_MS) return;
  if (document.querySelector('.modal-overlay.open') || (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))) return;   // non mentre scrivi
  V41.ultimo = Date.now();
  try { await loadAll(); await loadBattlePlan(); caricaEventiFatti().catch(() => {}); render(); } catch (e) { console.warn('[v41] rilettura (' + perche + '):', e.message); }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') v41Rinfresca('primo piano'); else V41.ultimo = Math.min(V41.ultimo, Date.now() - V41.MIN_MS); });
window.addEventListener('focus', () => v41Rinfresca('finestra'));
window.addEventListener('online', () => { V41.ultimo = 0; v41Rinfresca('rete'); });
try {
  db.channel('v41-altro')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'eventi_fatti' }, () => caricaEventiFatti().catch(() => {}))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cal_scelte' }, () => v41LeggiScelte())
    .subscribe();
} catch (e) { console.warn('[v41] diretta:', e.message); }

// ══════════════════════════════════════════════════════════════
