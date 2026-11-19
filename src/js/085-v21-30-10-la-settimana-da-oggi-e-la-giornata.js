// v21 · 30/10 · LA SETTIMANA DA OGGI E LA GIORNATA STAMPATA
// 1. Pianifica → Settimana (questa settimana): i giorni da oggi a domenica. I giorni passati stanno in una riga
//    «Lun 26 – Gio 29 · 6 fatte · 2 rimaste indietro» che li riapre. Il piano della settimana non cambia.
// 2. Stampa del singolo giorno (icona stampante in Oggi e su ogni giorno di Pianifica): agenda ora per ora,
//    le cose del giorno senza ora, in fondo «Da pianificare» (Subito e rimaste indietro) e righe per gli appunti.
//    Se nel giorno non c'è niente, lo dice nel foglio e con un avviso.
// ══════════════════════════════════════════════════════════════
ui.v21Passati = false;
function v21Da() { return eSettimanaCorrente() && !ui.v21Passati ? giornoIdxDi(oggiData()) : 0; }
function v21RigaPassati() {
  if (!eSettimanaCorrente()) return '';
  const o = giornoIdxDi(oggiData());
  if (o <= 0) return '';
  const g = i => `${GIORNI[i].label.slice(0, 3)} ${dataDelGiorno(i).getDate()}`;
  const righe = GIORNI.slice(0, o).flatMap(x => righeGiorno(x.key));
  const fatte = righe.filter(r => r.fatto).length, rimaste = righe.length - fatte;
  const conti = righe.length ? `${plurale(fatte, 'fatta', 'fatte')} · ${rimaste} rimast${rimaste === 1 ? 'a' : 'e'} indietro` : 'niente in programma';
  return `<button type="button" class="v21-passati" data-act="v21-passati" aria-expanded="${ui.v21Passati}"><i class="ti ti-chevron-${ui.v21Passati ? 'up' : 'down'}" aria-hidden="true"></i><span>${o > 1 ? `${g(0)} – ${g(o - 1)}` : g(0)} · ${conti}</span><b>${ui.v21Passati ? 'Nascondi i giorni passati' : 'Mostra i giorni passati'}</b></button>`;
}
AZIONI['v21-passati'] = () => {
  ui.v21Passati = !ui.v21Passati;
  if (!ui.v21Passati && eSettimanaCorrente() && ui.giorno < giornoIdxDi(oggiData())) ui.giorno = giornoIdxDi(oggiData());
  render();
};
function v21BtnStampa(idx, extra = '') {
  const d = dataDelGiorno(idx);
  return `<button type="button" class="btn btn-icon v21-stampa" data-act="v21-stampa-giorno" data-i="${idx}"${extra} aria-label="Stampa ${GIORNI[idx].label.toLowerCase()} ${d.getDate()}" data-tip="Stampa la giornata"><i class="ti ti-printer"></i></button>`;
}
// mette il bottone a destra nell'intestazione, insieme a quello che c'è già dopo il primo elemento
function v21InTesta(testa, btnHtml) {
  if (!testa) return;
  const dx = document.createElement('span');
  dx.className = 'v21-hdx';
  [...testa.children].slice(1).forEach(x => dx.appendChild(x));
  dx.insertAdjacentHTML('beforeend', btnHtml);
  testa.appendChild(dx);
}
function v21Tpl(html) { const t = document.createElement('template'); t.innerHTML = html; return t; }

// board (≥ 1100 px)
const _giorniVisibiliV21 = giorniVisibili;
giorniVisibili = function () {
  if (!eSettimanaCorrente()) return _giorniVisibiliV21.apply(this, arguments);
  const da = v21Da();
  return GIORNI.map((g, idx) => ({ g, idx })).filter(({ idx }) => idx >= da);
};
const _colonnaGiornoV21 = colonnaGiorno;
colonnaGiorno = function (gg, idx) {
  const t = v21Tpl(_colonnaGiornoV21.apply(this, arguments));
  v21InTesta(t.content.querySelector('.bcol-h'), v21BtnStampa(idx));
  return t.innerHTML;
};
const _pianLargoV21 = pianLargo;
pianLargo = function () {
  let h = _pianLargoV21.apply(this, arguments);
  if (!eSettimanaCorrente()) return h;
  h = h.replace(/<button type="button" class="btn btn-ghost btn-sm" data-act="weekend">[^<]*<\/button>/, '');
  return h.replace('<div class="board-scorri">', v21RigaPassati() + '<div class="board-scorri">');
};

// colonne (768–1100 px)
const _pianSettimanaColonneV21 = pianSettimanaColonne;
pianSettimanaColonne = function (eOggi) {
  const corrente = eSettimanaCorrente(), w = ui.weekend;
  if (corrente) ui.weekend = true;
  let h;
  try { h = _pianSettimanaColonneV21.apply(this, arguments); } finally { ui.weekend = w; }
  const t = v21Tpl(h), cols = t.content.querySelector('.cols');
  if (!cols) return h;
  const da = corrente ? v21Da() : 0;
  [...cols.children].forEach((col, i) => { if (i < da) col.remove(); else v21InTesta(col.querySelector('.col-h'), v21BtnStampa(i)); });
  if (corrente) {
    const n = 7 - da;
    cols.classList.remove('sette');
    cols.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    const tools = t.content.querySelector('.tools-row');
    if (tools) { const riga = v21RigaPassati(); if (riga) tools.outerHTML = riga; else tools.remove(); }
  }
  return t.innerHTML;
};

// telefono: i giorni da oggi in poi nella fila in alto
const _pianSettimanaV21 = pianSettimana;
pianSettimana = function () {
  const da = v21Da();
  if (window.innerWidth < 768 && ui.giorno < da) ui.giorno = da;
  const h = _pianSettimanaV21.apply(this, arguments);
  const t = v21Tpl(h), days = t.content.querySelector('.days');
  if (!days) return h;
  days.querySelectorAll('.day').forEach(b => { if (+b.dataset.i < da) b.remove(); });
  if (da) days.style.gridTemplateColumns = `repeat(${7 - da}, 1fr)`;
  const riga = v21RigaPassati();
  if (riga) days.insertAdjacentHTML('beforebegin', riga);
  const testa = days.nextElementSibling;
  if (testa && testa.classList.contains('list-head')) v21InTesta(testa, v21BtnStampa(ui.giorno));
  return t.innerHTML;
};

// Oggi: la stampante accanto al titolo
const _vistaOggiV21 = vistaOggi;
vistaOggi = function () {
  const h = _vistaOggiV21.apply(this, arguments);
  const t = v21Tpl(h), vh = t.content.querySelector('.vh');
  if (!vh) return h;
  const btn = v21BtnStampa(giornoIdxDi(oggiData()), ' data-oggi="1"').replace('data-tip="Stampa la giornata"', 'data-tip="Stampa la giornata di oggi"').replace('v21-stampa"', 'v21-stampa v21-stampa-oggi"');
  v21InTesta(vh, btn);
  return t.innerHTML;
};

// «Da pianificare» del foglio del giorno: prima le rimaste indietro, poi le Subito non ancora messe in un giorno
function daPianificarePdf(z) {
  const nelGiorno = new Set(z.voci.filter(v => v.tipo === 'cosa').map(v => v.r.c.id));
  const pianificate = new Set([...GIORNI.map(g => g.key), 'settimana'].flatMap(k => righeGiorno(k).map(r => r.c.id)));
  const visti = new Set(nelGiorno), out = [];
  const metti = c => { if (!c || visti.has(c.id) || c.done) return; visti.add(c.id); out.push({ tipo: 'cosa', r: { c, fatto: false, ora: '' } }); };
  // rimaste indietro come in Oggi: dal piano delle settimane scorse e quelle con la data passata
  try { rimasteVisibili().forEach(({ item }) => metti(ciclo(item.ciclo_id))); cicliIndietro().sciolte.forEach(metti); } catch (_) {}
  state.cicli.filter(c => vedi(c.ctx) && isAttivo(c) && !c.parent_id && !isGiornaliero(c) && !c.pianificato_data && computeEffectiveQ(c) === 1 && !pianificate.has(c.id))
    .sort((a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999')))
    .forEach(metti);
  return out.slice(0, 12);
}
function v21GiornoVuoto(idx) {
  return !righeGiorno(GIORNI[idx].key).length && !eventiDelGiorno(dataDelGiorno(idx)).length;
}
async function stampaGiorno(idx, daOggi) {
  if (daOggi && !eSettimanaCorrente()) {
    const c = bpSettimanaCorrente();
    state.week = c.week; state.year = c.year;
    try { localStorage.setItem(LS.WEEK, state.week); } catch (_) {}
    await reloadWeekData();
    try { await caricaEventi(state.week, state.year); } catch (_) {}
    render();
    idx = giornoIdxDi(oggiData());
  }
  const pdf = creaPdfSettimana({ giorno: idx });
  if (!pdf) return;
  const { doc, nome } = pdf, vuoto = v21GiornoVuoto(idx);
  const msg = vuoto ? 'Nessuna attività pianificata per questo giorno: nel foglio trovi le cose da pianificare' : 'Giornata pronta per la stampa';
  try {
    const url = URL.createObjectURL(doc.output('blob'));
    const win = window.open(url, '_blank');
    if (!win) doc.save(nome);
    showToast(win ? msg : (vuoto ? msg : 'PDF della giornata scaricato'), vuoto ? 'warn' : 'success');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { doc.save(nome); showToast(vuoto ? msg : 'PDF della giornata scaricato', vuoto ? 'warn' : 'info'); }
  window.__v21UltimaGiornata = { nome, vuoto, pagine: doc.getNumberOfPages() };
}
AZIONI['v21-stampa-giorno'] = el => { stampaGiorno(parseInt(el.dataset.i, 10), el.dataset.oggi === '1'); };

// ══════════════════════════════════════════════════════════════
