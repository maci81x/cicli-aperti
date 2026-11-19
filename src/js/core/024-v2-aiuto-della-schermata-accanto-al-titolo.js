// v2 · AIUTO DELLA SCHERMATA («?» accanto al titolo)
// ══════════════════════════════════════════════════════════════
const AIUTI = {
  oggi:      { titolo: 'Oggi',      testo: ['L\'unica schermata da guardare durante il giorno. Qui trovi la routine, il piano di oggi e gli appuntamenti. Spunta quello che fai. Quello che era in programma nei giorni scorsi e non hai fatto compare in cima, in Rimaste indietro: decidi tu quando rifarlo.'] },
  pianifica: { titolo: 'Pianifica', testo: ['Una volta a settimana prepari il piano: scegli cosa portare a casa e in che giorno. Con le frecce puoi preparare anche le settimane che vengono, e rivedere quelle passate. Da piazzare = cose che non hanno ancora un giorno. Chiudi la settimana = decidi cosa fare di ciò che non hai fatto.'] },
  settimana: { titolo: 'Settimana', base: 'pianifica', testo: ['Qui vedi un giorno alla volta: tocca un giorno per aprire quello che c\'è in programma. Se le cose hanno un momento o un\'ora, il giorno è diviso in mattina, pomeriggio e sera. Gli appuntamenti di Google Calendar e i cuscinetti stanno in mezzo alle cose, in ordine di ora. Su computer puoi trascinare una cosa in un altro giorno: vale solo per quella settimana. Accanto a ogni giorno vedi le ore in tutto: il piano si fa al 130 %, se ne chiude circa l\'80 %.'] },
  mese:      { titolo: 'Mese',      base: 'pianifica', testo: ['Un puntino per ogni cosa in programma, colorato per tipo. Tocca un giorno per aprirlo.'] },
  tutto:     { titolo: 'Tutto',     testo: ['Tutto è l\'elenco di tutte le cose da fare: ogni cosa aperta, di lavoro e personale, finisce qui. Cercala, filtrala, vedila per persona o nella matrice. In cima vedi quante sono e com\'erano 7 giorni fa: meno è meglio. «Svuota la testa» = una colonna per area, scrivi tutto e al resto pensi dopo.'] },
  matrice:   { titolo: 'Matrice',   testo: ['Le cose aperte divise per tipo: Subito (urgente e importante), Importante (a cui dare un giorno), Delega, Lascia stare.'] },
  persone:   { titolo: 'Persone',   testo: ['Prima di una riunione, apri la persona: vedi tutto quello che hai in sospeso con lei.'] },
  attesa:    { titolo: 'Un giorno', testo: ['Cose messe da parte di proposito: un giorno, forse. Non sparisce niente, ma non ti disturbano.'] },
  fatte:     { titolo: 'Fatte',     testo: ['Tutto quello che hai chiuso. Puoi riaprire una cosa se serve. In Settimane trovi i piani passati: tocca una settimana per rivederla.'] }
};
function btnAiuto(k) { return `<button type="button" class="aiuto-btn" data-act="aiuto" data-k="${k}" aria-label="A cosa serve questa schermata"><i class="ti ti-help-circle"></i></button>`; }
// Il «?» sta sul titolo della schermata: l'aiuto è quello della sotto-vista aperta in quel momento.
function chiaveAiuto(k) {
  if (k === 'pianifica') return ui.pian;
  if (k === 'tutto') return ui.tutto === 'lista' ? 'tutto' : ui.tutto;
  return k;
}
function apriAiuto(btn) {
  const a = AIUTI[chiaveAiuto(btn.dataset.k)] || AIUTI.oggi;
  const frasi = [...(a.base ? AIUTI[a.base].testo : []), ...a.testo];
  const corpo = frasi.map(t => `<p>${escHtml(t)}</p>`).join('');
  if (window.innerWidth < 768) {
    $('aiuto-titolo').textContent = a.titolo;
    $('aiuto-testo').innerHTML = corpo;
    $('aiutoOverlay').classList.add('open');
    return;
  }
  const pop = $('aiutoPop');
  if (!pop.hidden && pop.dataset.k === btn.dataset.k) { pop.hidden = true; return; }
  pop.dataset.k = btn.dataset.k;
  pop.innerHTML = `<h3 class="t-title">${a.titolo}</h3>${corpo}<button type="button" class="btn btn-ghost btn-sm" data-act="aiuto-guida"><i class="ti ti-book"></i>Guida completa</button>`;
  pop.hidden = false;
  const r = btn.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left)) + 'px';
  pop.style.top = (r.bottom + 6) + 'px';
}
function chiudiAiuto() { $('aiutoPop').hidden = true; $('aiutoOverlay').classList.remove('open'); }

// ══════════════════════════════════════════════════════════════
