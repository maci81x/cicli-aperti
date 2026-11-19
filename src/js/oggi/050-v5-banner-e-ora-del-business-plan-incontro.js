// v5 · BANNER: è ora del Business Plan · incontro con il coach · esercizio Q2 · appuntamenti che sembrano cicli
// ══════════════════════════════════════════════════════════════
quandoPiano = function () {
  const g = parseInt(lsLeggi(LS3.PIANO_GIORNO), 10), o = lsLeggi(LS3.PIANO_ORA) || '';
  return { giorno: g >= 0 && g <= 6 ? g : 4, ora: /^\d{2}:\d{2}$/.test(o) ? o : '16:45' };   // predefinito venerdì 16:45
};
// Il prossimo incontro con il coach entro 48 ore (dagli appuntamenti già letti)
function prossimoCoach() {
  const ora = Date.now(), limite = ora + COACH_ORE * 3600e3;
  return Object.values(ui.eventi).flat().filter(e => e.coach && e.inizioMs > ora && e.inizioMs <= limite).sort((a, b) => a.inizioMs - b.inizioMs)[0] || null;
}
const chiudiBanner = `<button type="button" class="btn btn-icon" data-act="banner-chiudi" aria-label="Chiudi per oggi" data-tip="Chiudi per oggi"><i class="ti ti-x"></i></button>`;
function bannerCoach() {
  const e = prossimoCoach();
  if (!e) return '';
  const d = new Date(e.inizioMs), w = isoWeekParts(d);
  if (inviatoIl(w.week, w.year)) return '';
  ui.coachSett = w;
  return `<section class="banner-piano banner-coach" aria-label="Incontro con il coach"><i class="ti ti-user-check"></i>
    <div><b>Hai l'incontro con il coach ${fmtGiorno(d)} alle ${e.ora} — invia il piano</b><p class="t-caption muted">Piano della settimana ${w.week}${stampatoIl(w.week, w.year) ? ' · stampato il ' + stampatoIl(w.week, w.year) : ''}</p>
      <div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="coach-invia"><i class="ti ti-send"></i>Invia al coach</button></div></div>${chiudiBanner}</section>`;
}
bannerPiano = function () {
  if (lsLeggi(LS3.PIANO_CHIUSO) === oggiLocale()) return '';
  const coach = bannerCoach();
  if (coach) return coach;
  if (!inFinestraPiano(new Date())) return '';
  caricaPianoProssima();
  if (!ui.pianoProssima) return '';
  const cur = bpSettimanaCorrente(), n = bpSettimanaSuccessiva(cur.week, cur.year);
  if (inviatoIl(n.week, n.year) || stampatoIl(n.week, n.year)) return '';
  const esiste = ui.pianoProssima.esiste;
  return `<section class="banner-piano" aria-label="Business Plan"><i class="ti ti-calendar-plus"></i>
    <div><b>È ora del Business Plan</b><p class="t-caption muted">${esiste ? `Il piano della settimana ${n.week} c'è: stampalo e portalo con te, mandane una copia al coach.` : `Prepara il piano della settimana ${n.week}: poi lo stampi o lo mandi al coach.`}</p>
      <div class="banner-azioni"><button type="button" class="btn ${esiste ? 'btn-secondary' : 'btn-primary'} btn-sm" data-act="banner-piano">Prepara</button>
        <button type="button" class="btn ${esiste ? 'btn-primary' : 'btn-secondary'} btn-sm" data-act="banner-stampa"${esiste ? '' : ' disabled'}><i class="ti ti-printer"></i>Stampa il foglio</button>
        <button type="button" class="btn btn-secondary btn-sm" data-act="banner-invia"${esiste ? '' : ' disabled'}><i class="ti ti-send"></i>Invia al coach</button></div></div>${chiudiBanner}</section>`;
};
// Porta Pianifica sulla settimana (w) e poi stampa o invia
async function vaiSettimanaE(w, poi) {
  if (state.week !== w.week || state.year !== w.year) {
    state.week = w.week; state.year = w.year;
    localStorage.setItem(LS.WEEK, state.week);
    ui.giorno = 0;
    await reloadWeekData();
  }
  await caricaEventi(state.week, state.year);
  vai('pianifica', { pian: 'settimana' });
  setTimeout(poi, 200);
}
const settProssima = () => { const cur = bpSettimanaCorrente(); return bpSettimanaSuccessiva(cur.week, cur.year); };
inviaPianoProssima = () => vaiSettimanaE(settProssima(), apriInvia);
async function inviaPianoCoach() {
  const w = ui.coachSett || bpSettimanaCorrente();
  try { const { plan } = await bpFetchPlan(w.week, w.year); if (!plan) { apriWizard(w.week, w.year); return; } } catch (_) {}
  vaiSettimanaE(w, apriInvia);
}

state.ultimoQ2 = undefined;   // undefined = non ancora letto; null = mai fatto
async function caricaUltimoQ2() {
  if (!state.esQ2Ok) return;
  try {
    const { data, error } = await db.from('esercizi_q2').select('fatto_at').order('fatto_at', { ascending: false }).limit(1);
    if (error) throw error;
    state.ultimoQ2 = data && data[0] ? data[0].fatto_at : null;
  } catch (e) { console.warn('[Q2] ultimo esercizio:', e.message); }
}
function bannerQ2() {
  if (!state.esQ2Ok || state.ultimoQ2 === undefined || modoSemplice() || lsLeggi(LS5.BANNER_Q2) === oggiLocale()) return '';
  const giorni = state.ultimoQ2 ? Math.floor((Date.now() - new Date(state.ultimoQ2).getTime()) / 864e5) : null;
  if (giorni !== null && giorni < Q2.OGNI_GIORNI) return '';
  return `<section class="banner-piano" aria-label="Esercizio Q2"><i class="ti ti-target"></i>
    <div><b>Esercizio Q2 · prossimi 3 mesi</b><p class="t-caption muted">${giorni === null ? 'Non l\'hai ancora fatto.' : `L'ultimo è di ${giorni} giorni fa.`} Scegli le attività importanti e fissale in agenda: poi non si spostano.</p>
      <div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="q2-apri">Inizia</button></div></div>
    <button type="button" class="btn btn-icon" data-act="banner-q2-chiudi" aria-label="Chiudi per oggi" data-tip="Chiudi per oggi"><i class="ti ti-x"></i></button></section>`;
}
function bannerCicliCal() {
  const n = (ui.calCicli || []).length;
  if (!n || lsLeggi(LS5.BANNER_CICLI) === oggiLocale()) return '';
  return `<section class="banner-piano banner-leggero" aria-label="Appuntamenti che sembrano cicli"><i class="ti ti-arrows-exchange"></i>
    <div><b>${n === 1 ? 'Un appuntamento sembra' : `${n} appuntamenti sembrano`} un ciclo aperto</b><div class="banner-azioni"><button type="button" class="btn btn-secondary btn-sm" data-act="calc-apri">Guarda</button></div></div>
    <button type="button" class="btn btn-icon" data-act="banner-cicli-chiudi" aria-label="Chiudi per oggi" data-tip="Chiudi per oggi"><i class="ti ti-x"></i></button></section>`;
}

// ══════════════════════════════════════════════════════════════
