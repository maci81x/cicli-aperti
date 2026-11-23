// v33 · 05/11 — il computer: usare tutta la larghezza (approvato sul canvas, sezione 14)
// · Oggi (da 1280 px): tre colonne. Sinistra: Adesso, la giornata, gli appuntamenti.
//   Centro: Prima di tutto e il resto delle cose. Destra: Da rispondere, obiettivi,
//   «In settimana, senza giorno», routine, Quando hai tempo.
// · Pianifica: la testa su una riga, gli obiettivi in una riga sottile; i giorni senza
//   niente con l'ora (solo spazi liberi o cose di tutto il giorno) più stretti.
// · Tutte (Lista): i gruppi su due colonne (Subito a sinistra, Importante a destra…).
// ══════════════════════════════════════════════════════════════
const V33 = { LARGO: 1280 };
const v33Largo = () => window.innerWidth >= V33.LARGO && !modoSemplice();
function v33InSettimana() {
  try {
    if (!eSettimanaCorrente()) return '';
    const r = righeGiorno('settimana').filter(x => !x.fatto);
    if (!r.length) return '';
    return `<section class="v33-insett"><p class="list-head"><span>In settimana, senza giorno</span><span class="mono">${r.length}</span></p><div class="group">${r.map(x => riga(x, { data: toISODate(oggiData()) })).join('')}</div></section>`;
  } catch (e) { console.warn('[v33] in settimana:', e.message); return ''; }
}

// Pianifica e Tutte: si sistemano dopo il disegno
function v33DopoDisegno() {
  const view = $('view');
  if (!view || window.innerWidth < 768 || modoSemplice()) return;
  // Pianifica: i giorni vuoti più stretti
  const cols = view.querySelector('.cols.board');
  if (cols) {
    const sezioni = [...cols.children].filter(x => x.classList.contains('bcol'));
    const giorni = sezioni.filter(x => !x.classList.contains('bcol-dp') && !x.classList.contains('bcol-sett'));
    if (giorni.length) {
      const pieno = s => !!s.querySelector('.item') || [...s.querySelectorAll('.evt-riga')].some(e => /\d{2}:\d{2}/.test(e.textContent) && !e.closest('.spazio-riga, .cusc-riga'));
      const tpl = giorni.map(s => pieno(s) ? 'minmax(148px, 1fr)' : 'minmax(160px, .7fr)').join(' ');
      cols.style.gridTemplateColumns = `250px 190px ${tpl}`;
    }
  }
  // Pianifica: Settimana · Giorno · Mese scendono accanto agli obiettivi, così la testa sta su una riga
  const testa = view.querySelector('.v26-testa'), seg = testa && testa.querySelector('.vh-board > .seg'), ob = testa && testa.querySelector(':scope > .v26-obiettivi');
  if (v33Largo() && testa && seg && ob && !testa.querySelector('.v33-riga2')) { const r2 = document.createElement('div'); r2.className = 'v33-riga2'; ob.before(r2); r2.append(ob, seg); }
  // Tutte, Lista: due colonne, ogni gruppo nella colonna più corta
  if (ui.tab === 'tutto' && ui.tutto === 'lista' && v33Largo() && !view.querySelector('.v33-due')) {
    const coppie = [...view.querySelectorAll('p.list-head')].filter(t => t.nextElementSibling && t.nextElementSibling.classList.contains('group') && !t.closest('.v33-due'));
    if (coppie.length >= 2) {
      const due = document.createElement('div'); due.className = 'v33-due';
      const a = document.createElement('div'), b = document.createElement('div'); let na = 0, nb = 0;
      coppie[0].before(due); due.append(a, b);
      coppie.forEach(t => { const g = t.nextElementSibling, n = g.querySelectorAll('.item').length || 1; const dove = na <= nb ? a : b; dove.append(t, g); if (dove === a) na += n; else nb += n; });
    }
  }
}
const _disegnaV33 = disegna;
disegna = function () {
  const r = _disegnaV33.apply(this, arguments);
  try { v33DopoDisegno(); } catch (e) { console.warn('[v33] dopo:', e.message); }
  return r;
};
let _v33Era = v33Largo();
window.addEventListener('resize', () => { const ora = v33Largo(); if (ora !== _v33Era) { _v33Era = ora; render(); } });

// ══════════════════════════════════════════════════════════════
