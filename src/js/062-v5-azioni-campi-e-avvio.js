// v5 · AZIONI, CAMPI E AVVIO
// ══════════════════════════════════════════════════════════════
// Un cuscinetto toccato a mano non si sposta più da solo.
const _bpwCambiaCuscV4 = bpwCambiaCusc;
bpwCambiaCusc = (k, patch) => _bpwCambiaCuscV4(k, { ...patch, auto: false });
// Dopo l'invio, «Il piano è pronto» mostra la data.
const _inviaPianoV4 = inviaPiano;
inviaPiano = async function () { await _inviaPianoV4(); if ($('prontoOverlay').classList.contains('open')) disegnaPronto(); };

Object.assign(AZIONI, {
  'rev-indietro': () => {
    if (ui.rev.passo === 2 && revAperti().length) { ui.rev.passo = 1; disegnaReview(); }
    else if (ui.rev.passo >= 1) { ui.rev.passo = 0; disegnaReview(); }
    else closeModal('bpRevOverlay');
  },
  'rev-avanti': () => {
    if (ui.rev.passo === 0) applicaRiporta();
    else if (ui.rev.passo === 1 && revAperti().length) { ui.rev.passo = 2; disegnaReview(); }
    else bpChiudiSettimana();
  },
  riporta: el => { const s = new Set(ui.rev.riportate), k = el.dataset.item; s.has(k) ? s.delete(k) : s.add(k); ui.rev = { ...ui.rev, riportate: s }; disegnaReview(); },
  'banner-stampa': () => vaiSettimanaE(settProssima(), bpStampaPdf),
  'coach-invia': () => inviaPianoCoach(),
  'banner-q2-chiudi': () => { lsScrivi(LS5.BANNER_Q2, oggiLocale()); render(); },
  'banner-cicli-chiudi': () => { lsScrivi(LS5.BANNER_CICLI, oggiLocale()); render(); },
  'pronto-stampa': () => bpStampaPdf(),
  'pronto-invia': () => apriInvia(),
  'pronto-chiudi': () => closeModal('prontoOverlay'),
  'proteggi-motivo': el => { ui.proteggi = { ...ui.proteggi, motivo: ui.proteggi && ui.proteggi.motivo === el.dataset.v ? null : el.dataset.v }; disegnaProteggi(); },
  'proteggi-sposta': () => rispondiProteggi(true),
  'proteggi-lascia': () => rispondiProteggi(false),
  'q-tornata': (el, id) => azioneTornata(id),
  'subito-crea': () => creaDaSubito(),
  'subito-salta': () => { ui.subito = null; closeModal('subitoOverlay'); },
  svuota: () => apriSvuota(),
  'svuota-ok': () => salvaSvuota(),
  'svuota-scorri': el => { const t = $('svuota-track'); if (t) t.scrollBy({ left: parseInt(el.dataset.dir, 10) * t.clientWidth, behavior: 'smooth' }); },
  'svuota-spacchetta': (el, id) => { closeModal('svuotaOverlay'); azioneScomponi(id); },
  'calc-apri': () => apriCalCicli(),
  'calc-tutto': el => portaInTutto(el.dataset.k, false),
  'calc-togli': el => { const v = (ui.calCicli || []).find(x => x.k === el.dataset.k); if (!v) return;
    apriConferma({ titolo: 'Lo tolgo dal calendario?', testo: `«${v.e.titoloOrig}»${v.e.serie ? ', con tutte le sue ripetizioni,' : ''} sparisce da Google Calendar e diventa una cosa da fare.`, ok: 'Sì, toglilo', no: 'Annulla', onOk: () => portaInTutto(el.dataset.k, true) }); },
  'calc-app': el => sceltaCalCiclo(el.dataset.k, 'app'),
  'q2-apri': () => apriEsercizioQ2(),
  'q2-scelta': el => { const s = new Set(ui.q2.scelte), i = parseInt(el.dataset.i, 10); s.has(i) ? s.delete(i) : s.add(i); ui.q2 = { ...ui.q2, scelte: s }; disegnaQ2(); },
  'q2-agenda-si': el => q2DaAgenda(el.dataset.k, true),
  'q2-agenda-no': el => q2DaAgenda(el.dataset.k, false),
  'q2-piu': el => { const i = parseInt(el.dataset.i, 10), id = 'a' + (++_q2N); ui.q2 = { ...ui.q2, attivita: [...ui.q2.attivita, { id, voce: i, titolo: '', data: null, momento: 'giornata' }] }; disegnaQ2(); setTimeout(() => { const c = document.querySelector(`[data-act="q2-testo"][data-id="${id}"]`); if (c) c.focus(); }, 50); },
  'q2-togli': el => { ui.q2 = { ...ui.q2, attivita: ui.q2.attivita.filter(a => a.id !== el.dataset.id) }; disegnaQ2(); },
  'q2-momento': el => { ui.q2 = { ...ui.q2, attivita: ui.q2.attivita.map(a => a.id === el.dataset.id ? { ...a, momento: el.dataset.v } : a) }; disegnaQ2(); },
  'q2-apri-giorni': el => { ui.q2 = { ...ui.q2, attiva: ui.q2.attiva === el.dataset.id ? null : el.dataset.id }; disegnaQ2(); },
  'q2-giorno': el => {
    const lista = ui.q2.attivita.map(a => a.id === el.dataset.id ? { ...a, data: el.dataset.data } : a);
    const prossima = lista.find(a => !a.data);   // passa da sola alla prossima senza giorno
    ui.q2 = { ...ui.q2, attivita: lista, attiva: prossima ? prossima.id : null };
    disegnaQ2();
  },
  'q2-ok': () => avantiQ2(),
  'q2-indietro': () => { if (!ui.q2 || ui.q2.passo === 1) { closeModal('q2Overlay'); return; } ui.q2 = { ...ui.q2, passo: ui.q2.passo - 1 }; disegnaQ2(); },
  'area-cat': el => apriSpostaCategoria(el.dataset.k),
  'area-sposta': el => spostaCategoria(ui.areaCat, el.dataset.v),
  'area-aggiungi': () => aggiungiArea(),
  formato: el => { lsScrivi(LS5.FORMATO, el.dataset.v === 'a4' ? null : el.dataset.v); render(); },
  proteggi: el => { lsScrivi(LS5.PROTEGGI, el.dataset.v === 'conferma' ? null : el.dataset.v); render(); },
  'prom-bp': async el => { el.disabled = true; const id = await sincronizzaPromemoria('bp', true); el.disabled = false; render(); showToast(id ? 'Promemoria del Business Plan aggiornato su Google Calendar' : 'Non riesco a scrivere su Google Calendar', id ? 'success' : 'error'); }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-act="piano-durata"]')) { lsScrivi(LS5.PIANO_DURATA, t.value); }
  if (t.matches('[data-act="piano-giorno"], [data-act="piano-ora"], [data-act="piano-durata"]')) {
    // 22/10 · niente aggiornamento automatico: il promemoria su Calendar si aggiorna col suo tasto
    if (isGcalTokenValid() && (leggiJson(LS5.PROM, {}).bp || {}).id) showToast('Per spostare anche il promemoria su Google Calendar tocca «Prepara il Business Plan» in Promemoria su Google Calendar', 'info');
    return;
  }
  if (t.matches('[data-act="set-cc"]')) { const v = t.value.trim(); if (!v || EMAIL_OK.test(v)) { lsScrivi(LS5.CC, v); showToast(v ? 'In copia: ' + v : 'Nessuno in copia', 'success'); } else showToast('Questa email non sembra giusta', 'warn'); return; }
  if (t.matches('[data-act="set-cal"]')) {
    const v = t.value.trim();
    lsScrivi(LS5.CAL_SCRITTURA, v && v !== GCAL_CAL_PREFERITO ? v : null);
    ui.calVerificato = false;
    ensureGcalCalendar().then(() => { render(); showToast(gcal.calendarId === calScelto() ? 'Calendario di scrittura salvato' : 'Non trovo quel calendario: uso Lavoro', gcal.calendarId === calScelto() ? 'success' : 'warn'); });
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('[data-act="riporta-nuove"]')) { ui.rev = { ...ui.rev, nuoveTesto: t.value }; return; }
  if (t.matches('[data-act="svuota-testo"]')) {
    const i = parseInt(t.dataset.i, 10), testi = [...ui.svuota.testi];
    testi[i] = t.value;
    ui.svuota = { ...ui.svuota, testi };
    aggiornaColonnaSvuota(i);
    return;
  }
  if (t.matches('[data-act="q2-testo"]')) {
    ui.q2 = { ...ui.q2, attivita: ui.q2.attivita.map(a => a.id === t.dataset.id ? { ...a, titolo: t.value } : a) };
    const avv = $('q2-avv-' + t.dataset.id);
    if (avv) avv.hidden = !(t.value.trim() && eCategoria(t.value));
    aggiornaQ2Ok();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'subito-testo' && !e.isComposing) { e.preventDefault(); creaDaSubito(); }
  if (e.key === 'Enter' && e.target.id === 'area-nuova' && !e.isComposing) { e.preventDefault(); aggiungiArea(); }
});

// Dopo il collegamento a Google Calendar: calendario di scrittura, promemoria, appuntamenti che sembrano cicli
const _handleGcalTokenV2 = _handleGcalToken;
_handleGcalToken = async function (resp) {
  ui.calVerificato = false;
  await _handleGcalTokenV2(resp);
  if (!isGcalTokenValid()) return;
  avvioCalendarV5();
};
let _avvioCalFatto = false;
async function avvioCalendarV5() {
  if (!isGcalTokenValid()) return;
  await ensureGcalCalendar();
  const n = settProssima();
  caricaEventi(n.week, n.year);   // per il banner del coach (incontro lunedì) e il wizard della settimana dopo
  if (_avvioCalFatto) return;
  _avvioCalFatto = true;
  // 22/10 · i promemoria su Calendar non si creano né si aggiornano più da soli all'avvio:
  // solo dal tasto in Impostazioni e dalla casella dell'esercizio Q2
  cercaCicliInCalendario().catch(e => console.warn('[GCal] cicli nel calendario:', e.message));
}
function avvioV5() {
  // il coach: il destinatario predefinito è cambiato; l'indirizzo generale va in copia
  if (!lsLeggi(LS5.COACH_V5)) {
    if ((lsLeggi(LS4.COACH) || '').trim().toLowerCase() === CC_PREDEFINITO) lsScrivi(LS4.COACH, null);
    lsScrivi(LS5.COACH_V5, '1');
  }
  rilevaColonneV5();
  setTimeout(avvioCalendarV5, 2800);   // dopo che initGcal ha ripreso il token
}

// ══════════════════════════════════════════════════════════════
