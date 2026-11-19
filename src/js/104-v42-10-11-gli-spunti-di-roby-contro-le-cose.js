// v42 · 10/11 — gli spunti di Roby contro le cose già chiuse che ricompaiono
// · (2) un promemoria del calendario passato senza risposta NON diventa più da solo una cosa: resta una domanda
//   («L'hai fatta?» · Già fatta / Mettila tra le cose da fare / Lascia stare) nel banner di Oggi e in «Chiudi la giornata».
// · (3) quando chiudi una cosa nata da un promemoria del calendario, l'app toglie anche l'evento dal calendario
//   (solo se è tuo, senza invitati e non è una serie; resta 30 giorni nel Cestino di Google Calendar).
// · (4) in «Chiudi la giornata»: le cose aperte molto simili a una chiusa negli ultimi 7 giorni («È già fatta?»).
// · (5) in alto «Aggiornato alle hh:mm»: arancione se i dati hanno più di 5 minuti; tocca per rileggere.
// ══════════════════════════════════════════════════════════════
const V42 = { letto: Date.now(), VECCHIO_MS: 5 * 60000, GIORNI_DOPP: 7 };
// (2) il banner di Oggi dice la cosa giusta quando ci sono promemoria passati
{
  const _bannerV42 = bannerCicliCal;
  bannerCicliCal = function () {
    const h = _bannerV42.apply(this, arguments);
    const pass = (ui.calCicli || []).filter(x => x.passata).length;
    if (!h || !pass) return h;
    return h.replace(/<b>[^<]*un ciclo aperto<\/b>/, `<b>${pass === 1 ? '1 promemoria passato: l\'hai fatto?' : pass + ' promemoria passati: li hai fatti?'}</b>`);
  };
}
// (3) chiusa → via anche dal calendario
async function v42TogliPromemoria(c) {
  const m = String(c.note || '').match(/\[cal:([^\]]+)\]/);
  if (!m || !isGcalTokenValid()) return;
  const k = m[1], calId = /calendario Privato/.test(c.note) ? 'maci81x@gmail.com' : 'r.macinai@sisoluzioniimpresa.it';
  try {
    const ev = await gcalFetchUtente(`/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(k)}`, 'GET');
    if (!ev || ev.status === 'cancelled' || ev.recurringEventId || (ev.recurrence || []).length) return;
    if (!(ev.organizer && (ev.organizer.self || MIE_EMAIL.has(ev.organizer.email)))) return;
    if ((ev.attendees || []).some(a => !a.self && !MIE_EMAIL.has(a.email))) return;   // mai con invitati (avviserebbe tutti)
    await gcalFetchUtente(`/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(k)}?sendUpdates=none`, 'DELETE');
    ui.eventi = Object.fromEntries(Object.entries(ui.eventi || {}).map(([w, l]) => [w, Array.isArray(l) ? l.filter(x => x.id !== k) : l]));
    if (typeof salvaCacheEventi === 'function') { try { salvaCacheEventi(); } catch (_) {} }
    showToast('Tolta anche dal calendario (resta 30 giorni nel Cestino di Google Calendar)', 'info');
    render();
  } catch (e) { if (!(typeof nonEsiste === 'function' && nonEsiste(e))) console.warn('[v42] calendario:', e.message); }
}
{
  const _flipV42 = flipDone;
  flipDone = async function (id, currentDone) {
    const r = await _flipV42.apply(this, arguments);
    if (!currentDone) { const c = ciclo(id); if (c && /\[cal:/.test(c.note || '')) v42TogliPromemoria(c); }
    return r;
  };
}
// (4) «È già fatta?»: aperte molto simili a una chiusa negli ultimi 7 giorni
function v42GiaFatte() {
  const limite = toISODate(piuGiorni(new Date(), -V42.GIORNI_DOPP));
  const chiuse = state.cicli.filter(c => c.done && !c.parent_id && !c.eliminato_at && giornoIso(c.chiuso_at || c.updated_at) >= limite);
  if (!chiuse.length) return [];
  const no = new Set([...doppioniNo(), ...(state.nonDopp || [])]);
  return state.cicli.filter(c => !c.done && !c.parent_id && !c.eliminato_at && !isGiornaliero(c) && ripetizioneDi(c) === 'nessuna')
    .map(c => { const b = migliore(c.title, chiuse.filter(x => x.id !== c.id), ['uguale', 'molto'], x => x.title); return b ? { c, chiusa: b.x, k: 'gia-fatta:' + c.id + ':' + b.x.id } : null; })
    .filter(x => x && !no.has(x.k));
}
{
  const _chiudiV42 = v26DisegnaChiudi;
  v26DisegnaChiudi = function () {
    _chiudiV42.apply(this, arguments);
    const box = $('v26cg-corpo'), l = v42GiaFatte();
    if (!box || !l.length) return;
    const gg = d => d ? new Date(d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'numeric' }) : '';
    box.insertAdjacentHTML('beforeend', `<p class="list-head"><span>4 · Già fatte?</span><span class="mono">${l.length}</span></p>
      <p class="t-caption muted">Sono ancora aperte, ma assomigliano molto a cose che hai chiuso negli ultimi 7 giorni.</p>
      ${l.map(({ c, chiusa, k }) => `<div class="v42-dopp"><p><b>${escHtml(c.title)}</b></p><p><small>chiusa ${gg(chiusa.chiuso_at || chiusa.updated_at)}: «${escHtml(chiusa.title)}»</small></p>
        <div class="chips chips-wrap"><button type="button" class="chip" data-act="v42-gia-fatta" data-id="${c.id}"><i class="ti ti-check"></i>È già fatta</button><button type="button" class="chip" data-act="dopp-no" data-k="${esc(k)}">Sono diverse</button></div></div>`).join('')}`);
  };
}
AZIONI['v42-gia-fatta'] = async el => { await azioneFatto(el.dataset.id); v26CgDopo(); };
{ const _dnV42 = AZIONI['dopp-no']; AZIONI['dopp-no'] = async el => { await _dnV42(el); v26CgDopo(); }; }
// (5) «Aggiornato alle…»
{
  const _loadV42 = loadAll;
  loadAll = async function () { const r = await _loadV42.apply(this, arguments); V42.letto = Date.now(); v42Etichetta(); return r; };
}
function v42Etichetta() {
  let b = document.querySelector('.top .v42-agg');
  const top = document.querySelector('.top');
  if (!top) return;
  if (!b) {
    b = document.createElement('button'); b.type = 'button'; b.className = 'v42-agg'; b.dataset.act = 'v42-rileggi';
    const dove = top.querySelector('.v39-cerca') || top.querySelector('.v32-ctx-btn') || top.querySelector('.top-ctx');
    if (dove) dove.before(b); else top.appendChild(b);
  }
  const min = Math.floor((Date.now() - V42.letto) / 60000), vecchio = Date.now() - V42.letto > V42.VECCHIO_MS;
  const hm = new Date(V42.letto).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  b.classList.toggle('vecchio', vecchio);
  b.innerHTML = vecchio ? `<i class="ti ti-refresh" aria-hidden="true"></i>Dati di ${min} min fa · aggiorna` : `<i class="ti ti-cloud-check" aria-hidden="true"></i>Aggiornato alle ${hm}`;
  b.setAttribute('aria-label', vecchio ? `Dati di ${min} minuti fa: tocca per aggiornare` : `Dati aggiornati alle ${hm}: tocca per rileggere`);
}
AZIONI['v42-rileggi'] = async () => { V41.ultimo = 0; showToast('Rileggo i dati…', 'info'); await v41Rinfresca('a mano'); };
setInterval(() => { if (document.visibilityState === 'visible') v42Etichetta(); }, 30000);
v42Etichetta();

// ══════════════════════════════════════════════════════════════
