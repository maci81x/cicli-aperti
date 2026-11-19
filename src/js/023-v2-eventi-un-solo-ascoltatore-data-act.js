// v2 · EVENTI (un solo ascoltatore: data-act)
// ══════════════════════════════════════════════════════════════
const AZIONI = {
  nuovo: () => apriRapido(),
  ctx: el => switchCtx(el.dataset.ctx),
  tema: () => toggleTheme(),
  gcal: () => openGcalModal(),
  plaud: () => openPlaudModal(),
  apikey: () => openApiKeyModal(),
  wizard: () => apriWizard(),
  review: () => openBpReview(),
  pdf: () => bpStampaPdf(),
  filtri: () => apriFiltri(),
  acc: el => { const k = el.dataset.k; ui.aperti.has(k) ? ui.aperti.delete(k) : ui.aperti.add(k); render(); },
  sub: el => vai(el.dataset.tab, { sub: el.dataset.sub || null }),
  pian: el => { ui.pian = el.dataset.v; if (ui.pian === 'settimana' && eSettimanaCorrente()) ui.giorno = giornoIdxDi(oggiData()); render(); },
  tutto: el => { ui.tutto = el.dataset.v; render(); },
  sett: el => changeWeek(parseInt(el.dataset.dir, 10)),
  'sett-oggi': () => { ui.giorno = giornoIdxDi(oggiData()); const c = bpSettimanaCorrente(); state.week = c.week; state.year = c.year; changeWeek(0); },
  giorno: el => { ui.giorno = parseInt(el.dataset.i, 10); render(); },
  weekend: () => { ui.weekend = !ui.weekend; render(); },
  mese: el => { ui.meseOffset += parseInt(el.dataset.dir, 10); render(); },
  'mese-oggi': () => { ui.meseOffset = 0; render(); },
  'mese-giorno': el => vaiAData(parseISODate(el.dataset.data)),
  mq: el => { ui.filtri.tipi = new Set([el.dataset.q]); ui.tutto = 'lista'; render(); },
  filtro: el => { const s = ui.filtri[el.dataset.g], v = el.dataset.v; s.has(v) ? s.delete(v) : s.add(v); disegnaFiltri(); render(); },
  'filtri-azzera': () => { ui.filtri = { cats: new Set(), tipi: new Set(), aree: new Set() }; ui.q = ''; ['searchInput', 'searchInputM'].forEach(i => { if ($(i)) $(i).value = ''; }); if ($('filtriOverlay').classList.contains('open')) disegnaFiltri(); render(); },
  'cat-nuova': el => apriCategoria(null, el.dataset.poi || null),
  'cat-modifica': el => apriCategoria(parseInt(el.dataset.id, 10) || el.dataset.id),
  'cat-elimina': async el => { await deleteCat(parseInt(el.dataset.id, 10) || el.dataset.id); await loadAll(); },
  'cat-icona': el => { ui.cat.icona = el.dataset.v; disegnaIconeCategoria(); },
  'cat-salva': () => salvaCategoria(),
  'persona-aggiungi': () => aggiungiPersona(),
  'aree-assegna': () => batchMigrateAree(),
  'ripeti-salva': () => salvaRipeti(),
  apri: (el, id) => apriDettaglio(id),
  menu: (el, id, data) => apriMenu(el, id, data),
  riattiva: (el, id) => azioneRiattiva(id),
  'q-fatto': (el, id) => azioneFatto(id),
  'q-domani': (el, id, data) => azioneDomani(id, data),
  'q-quando': (el, id) => azioneQuando(id),
  'q-ripeti': (el, id) => apriRipeti(id),
  'q-lascia': (el, id) => azioneLascia(id),
  'd-fatto': () => daDettaglio(azioneFatto),
  'd-domani': () => daDettaglio(id => azioneDomani(id, oggiLocale())),
  'd-lascia': () => daDettaglio(azioneLascia),
  'd-quando': () => daDettaglio(azioneQuando),
  'd-ripeti': () => daDettaglio(apriRipeti),
  'd-riattiva': () => daDettaglio(azioneRiattiva),
  'd-elimina': () => daDettaglio(azioneElimina),
  'd-riapri': () => daDettaglio(async id => { await flipDone(id, true); state.cicli = state.cicli.map(x => x.id === id ? { ...x, done: false, execution_status: 'planned' } : x); render(); showToast('Riaperta: è di nuovo tra le cose aperte', 'success'); }),
  'rev-scelta': el => { ui.rev.scelte.set(el.dataset.item, el.dataset.v); disegnaReview(); },
  'rev-indietro': () => { if (ui.rev.passo === 2 && revAperti().length) { ui.rev.passo = 1; disegnaReview(); } else closeModal('bpRevOverlay'); },
  'rev-avanti': () => { if (ui.rev.passo === 1 && revAperti().length) { ui.rev.passo = 2; disegnaReview(); } else bpChiudiSettimana(); },
  'rev-gcal': async el => { el.disabled = true; await mettiPianoSuCalendar(); el.disabled = false; },
  'onb-salta': () => onbChiudi(false),
  'esci': () => chiediEsci(),
  'accesso-occhio': () => mostraCodice(),
  'onb-avanti': () => onbAvanti(),
  'onb-apri': () => onbApri(),
  aiuto: el => apriAiuto(el),
  'aiuto-guida': () => { chiudiAiuto(); vai('altro', { sub: 'guida' }); },
  'recon-fatta': el => reconRisposta(el.dataset.id, true),
  'recon-no': el => reconRisposta(el.dataset.id, false),
  'recon-tutte': () => reconTutte(),
  'recon-dopo': () => reconDopo(),
  'bpw-giorno': el => bpwImpostaGiorno(el.dataset.id, el.dataset.g),
  'bpw-ora': el => bpSlotOpen(el.dataset.id, (_bpwSel.get(el.dataset.id) || {}).giorno || 'lunedi'),
  'bpw-togli': el => { _bpwSel.delete(el.dataset.id); bpwRenderStep2(); },
  'det-giorno': el => impostaGiorno(editingId, el.dataset.g),
  'bpw-sett': el => bpwCambiaSettimana(parseInt(el.dataset.dir, 10)),
  'rapido-salva': () => salvaRapido(),
  'rapido-mic': () => dettatura(),
  'cattura-mic': () => dettatura('cattura-testo', 'cattura-mic'),
  'rapido-subito': () => { ui.rapido = { ...ui.rapido, subito: !ui.rapido.subito }; disegnaRapido(); },
  'rapido-oggi': () => { ui.rapido = { ...ui.rapido, oggi: !ui.rapido.oggi }; disegnaRapido(); },
  'rapido-con': () => { const r = ui.rapido; ui.rapido = r.persona || r.con ? { ...r, persona: null, con: false } : { ...r, con: true }; disegnaRapido(); },
  'rapido-persona': el => { const p = el.dataset.p; ui.rapido = { ...ui.rapido, persona: String(ui.rapido.persona) === p ? null : p, con: false }; disegnaRapido(); $('rapido-testo').focus(); },
  stella: (el, id) => azioneStella(id),
  'focus-conferma': () => confermaFocus(),
  'q-delega': (el, id) => apriDelega(id),
  'delega-persona': el => { ui.delega = { ...ui.delega, persona: el.dataset.p }; disegnaDelega(); },
  'delega-quando': el => { ui.delega = { ...ui.delega, quando: el.dataset.v }; disegnaDelega(); if (el.dataset.v === 'data') $('delega-data').focus(); },
  'delega-nuova': () => delegaNuovaPersona(),
  'delega-salva': () => salvaDelega(),
  'ctrl-fatto': (el, id) => azioneControllo(id, 'fatto'),
  'ctrl-rimanda': (el, id) => azioneControllo(id, 'rimanda'),
  'ctrl-riprendi': (el, id) => azioneControllo(id, 'riprendi'),
  'banner-piano': () => apriWizardProssima(),
  'banner-chiudi': () => { lsScrivi(LS3.PIANO_CHIUSO, oggiLocale()); render(); },
  semplice: () => impostaSemplice(!modoSemplice()),
  testo: el => { lsScrivi(LS3.TESTO, el.dataset.v === '100' ? null : el.dataset.v); applicaAspetto(); render(); },
  contrasto: () => { lsScrivi(LS3.CONTRASTO, lsLeggi(LS3.CONTRASTO) === 'alto' ? null : 'alto'); applicaAspetto(); render(); },
  carry: el => azioneCarry(el.dataset.item, el.dataset.v, parseInt(el.dataset.g, 10)),
  'carry-tutte': () => carryTutteAOggi(),
  'carry-chiudi': () => carryChiudiPerOggi(),
  fatte: el => { ui.fatte = el.dataset.v; if (ui.fatte === 'settimane') ui.settimane = null; render(); },
  'vai-sett': el => vaiASettimana(parseInt(el.dataset.w, 10), parseInt(el.dataset.y, 10)),
  // v4
  'q-scomponi': (el, id) => azioneScomponi(id),
  'q-blocca': (el, id) => azioneBlocca(id),
  'blocca-salva': () => salvaBlocca(),
  'cusc-urgenza': el => apriUrgenza(el.dataset.item),
  'cusc-riempi': el => apriRiempi(el.dataset.item),
  'riempi-scegli': (el, id) => riempiCuscinetto(ui.riempi, id),
  'rapido-cusc': () => { ui.rapido = { ...ui.rapido, cusc: null }; disegnaRapido(); },
  'bpw-cusc-add': el => bpwAggiungiCusc(el.dataset.g, el.dataset.v),
  'bpw-cusc-togli': el => { _bpwCusc.delete(el.dataset.k); bpwRenderStep2(); },
  'passo-aggiungi': () => aggiungiPasso(),
  'apri-madre': (el, id) => apriDettaglio(id),
  'conferma-ok': () => rispondiConferma(true),
  'conferma-no': () => rispondiConferma(false),
  invia: () => apriInvia(),
  'invia-ok': () => inviaPiano(),
  'banner-invia': () => inviaPianoProssima(),
  'rev-motivo': el => { const k = el.dataset.item; ui.rev.motivi.get(k) === el.dataset.v ? ui.rev.motivi.delete(k) : ui.rev.motivi.set(k, el.dataset.v); disegnaReview(); },
  'rev-sugg': el => aggiungiSuggerimento(parseInt(el.dataset.i, 10)),
  'cusc-auto': () => { lsScrivi(LS4.CUSC_AUTO, cuscAutomatici() ? '0' : null); render(); }
};
function daDettaglio(fn) { const id = editingId; if (!id) return; closeModal('modalOverlay'); fn(id); }

document.addEventListener('click', e => {
  if (!e.target.closest('#rigaMenu') && !e.target.closest('[data-act="menu"]')) chiudiMenu();
  if (!e.target.closest('#aiutoPop') && !e.target.closest('[data-act="aiuto"]')) $('aiutoPop').hidden = true;
  const tab = e.target.closest('[data-tab]:not([data-act])');
  if (tab) { vai(tab.dataset.tab); return; }
  const scelta = e.target.closest('[data-scelta] button');
  if (scelta) { impostaScelta(scelta.parentElement.dataset.scelta, scelta.dataset.v); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || el.tagName === 'INPUT' || el.tagName === 'SELECT') {
    if (!e.target.closest('.item.is-swiped')) chiudiSwipe();
    return;
  }
  const item = el.closest('.item');
  if (item && item._appenaTrascinato) return;                       // fine di uno swipe, non un tocco
  if (item && item.classList.contains('is-swiped') && el.dataset.act === 'apri') { chiudiSwipe(); return; }
  const id = el.dataset.id || (item && item.dataset.id) || null;
  const data = el.dataset.data || (item && item.dataset.data) || oggiLocale();
  const fn = AZIONI[el.dataset.act];
  if (!fn) return;
  if (el.closest('#rigaMenu')) chiudiMenu();
  if (el.dataset.act.startsWith('q-')) chiudiSwipe();
  fn(el, id, data);
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-act="spunta"]')) { const item = t.closest('.item'); if (item) azioneFatto(item.dataset.id); return; }
  if (t.matches('[data-act="carry-fatta"]')) { const item = t.closest('.item'); if (item) azioneFatto(item.dataset.id); return; }
  if (t.matches('[data-act="focus-scelta"]')) { const id = t.dataset.item; if (t.checked && ui.focusScelta.size < FOCUS_MAX) ui.focusScelta.add(id); else ui.focusScelta.delete(id); disegnaFocus(); return; }
  if (t.matches('[data-act="piano-giorno"]')) { lsScrivi(LS3.PIANO_GIORNO, t.value); lsScrivi(LS3.PIANO_CHIUSO, null); return; }
  if (t.matches('[data-act="piano-ora"]')) { if (t.value) lsScrivi(LS3.PIANO_ORA, t.value); lsScrivi(LS3.PIANO_CHIUSO, null); return; }
  if (t.id === 'delega-data') { ui.delega = { ...ui.delega, data: t.value }; return; }
  if (t.matches('[data-act="raggruppa"]')) { ui.raggruppa = t.value; localStorage.setItem(LS2.RAGGRUPPA, t.value); render(); return; }
  if (t.matches('[data-act="rev-data"]')) { ui.rev.date.set(t.dataset.item, t.value); return; }
  if (t.matches('[data-act="bpw-cusc-ora"]')) { if (t.value) bpwCambiaCusc(t.dataset.k, { ora: t.value }); return; }
  if (t.matches('[data-act="bpw-cusc-durata"]')) { bpwCambiaCusc(t.dataset.k, { durata: parseInt(t.value, 10) || CUSC.DURATA }); return; }
  if (t.matches('[data-act="set-coach"]')) { const v = t.value.trim(); if (!v || EMAIL_OK.test(v)) { lsScrivi(LS4.COACH, v || null); showToast(v ? 'Email del coach salvata' : 'Email del coach: torna quella predefinita', 'success'); } else showToast('Questa email non sembra giusta', 'warn'); return; }
  if (t.matches('[data-act="set-nome"]')) { lsScrivi(LS4.NOME, t.value.trim() || null); showToast('Nome salvato', 'success'); return; }
  if (t.id === 'f-cat' && t.value === '__nuova__') { t.selectedIndex = 0; apriCategoria(null, 'dettaglio'); }
});

document.addEventListener('input', e => {
  if (e.target.matches('[data-act="rev-altro"]')) { ui.rev.altro.set(e.target.dataset.item, e.target.value); return; }
  if (e.target.id !== 'searchInput' && e.target.id !== 'searchInputM') return;
  ui.q = e.target.value;
  const altro = $(e.target.id === 'searchInput' ? 'searchInputM' : 'searchInput');
  if (altro) altro.value = ui.q;
  if (ui.tab !== 'tutto' || ui.sub) { ui.tab = 'tutto'; ui.sub = null; }
  if (ui.q.trim() && ui.tutto !== 'lista') ui.tutto = 'lista';
  render();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'passo-nuovo' && !e.isComposing) { e.preventDefault(); e.stopImmediatePropagation(); aggiungiPasso(); return; }   // non è il salva del foglio
  if (e.key !== 'Escape') return;
  chiudiMenu();
  $('aiutoPop').hidden = true;
  if ($('bpSlotPanel').classList.contains('open')) { bpSlotClose(); e.stopImmediatePropagation(); }
}, true);

$('onb-track').addEventListener('scroll', () => requestAnimationFrame(onbAggiorna), { passive: true });

// Trascina giù per aggiornare (telefono)
function initPullToRefresh() {
  const main = $('main');
  let y0 = null, tirato = false;
  main.addEventListener('touchstart', e => { y0 = main.scrollTop <= 0 ? e.touches[0].clientY : null; tirato = false; }, { passive: true });
  main.addEventListener('touchmove', e => { if (y0 !== null && e.touches[0].clientY - y0 > 90) tirato = true; }, { passive: true });
  main.addEventListener('touchend', async () => {
    if (!tirato || _sw) { y0 = null; return; }
    y0 = null; tirato = false;
    await loadAll();
    caricaRimaste();
    showToast('Aggiornato', 'success');
  });
}

// ══════════════════════════════════════════════════════════════
