// v5 · il foglio nel formato del piano i-Time: in cima il riquadro giallo «Settimana (pensaci dopo)», poi un blocco
// per giorno (cose con quadratino, appuntamenti con cerchio e orario, cuscinetti con righe vuote, note in grigio),
// a destra le righe per gli appunti a penna, in fondo «Nuove cose emerse» e «Fatte __ / __». Leggibile in bianco e nero.
function creaPdfSettimana(opz = {}) {
  const unGiorno = opz.giorno != null;
  const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDFCtor) { showToast('Libreria PDF non caricata, riprova', 'error'); return null; }
  const giorni = GIORNI.map((g, idx) => {
    const d = dataDelGiorno(idx), voci = righePdfGiorno(righeDaFare(g.key), d), routine = arcoRoutine(routineDelGiorno(d));
    const pieno = idx < 5 && !cuscinettiDelGiorno(d).length && giornataPiena(d, occupatiPiano(g.key));
    // sabato e domenica solo se c'è una cosa, un cuscinetto o un appuntamento non ricorrente
    return { idx, titolo: `${g.label} ${d.getDate()}/${d.getMonth() + 1}`, voci: routine ? [{ tipo: 'routine', routine }, ...voci] : voci, pieno, weekend: idx > 4, haVoci: voci.some(v => v.tipo !== 'evento' || !v.e.serie) };
  }).filter(z => unGiorno ? z.idx === opz.giorno : (!z.weekend || z.haVoci));
  const inSett = unGiorno ? daPianificarePdf(giorni[0]) : righeDaFare('settimana').map(r => ({ tipo: 'cosa', r }));
  const cose = [...inSett, ...giorni.flatMap(z => z.voci.filter(v => v.tipo === 'cosa'))];
  if (!unGiorno && !cose.length && !giorni.some(z => z.haVoci)) { showToast('Niente da stampare in questa settimana', 'warn'); return null; }

  const formato = formatoFoglio(), s = formato === 'a5' ? .84 : 1;
  const prova = new jsPDFCtor({ unit: 'mm', format: formato, orientation: 'portrait' }), pagina = prova.internal.pageSize;
  const W = pagina.getWidth(), H = pagina.getHeight(), M = 12 * s;
  const COL_L = (W - 2 * M) * .64, COL_R_X = M + COL_L + 5 * s, COL_R_W = W - M - COL_R_X, LIMITE = H - M;
  const PDF_TESTO = { PICCOLO: 9, ORARIO_MAX: '00:00–00:00', STACCO: 3, RIGHE_TITOLO: 2, A_CAPO: .8, NOTA: .85 };
  // la colonna dell'ora è larga quanto l'orario più lungo (in grassetto, come gli appuntamenti) più uno stacco
  prova.setFont('helvetica', 'bold'); prova.setFontSize(PDF_TESTO.PICCOLO);
  const X_ORA = M + 6 * s, X_TIT = X_ORA + prova.getTextWidth(PDF_TESTO.ORARIO_MAX) + PDF_TESTO.STACCO * s, MIN_RIGHE = 2;
  const LARGO_TIT = COL_L - (X_TIT - M);
  const nota = v => v.tipo === 'cosa' && v.r.c.note ? pdfTxt(String(v.r.c.note).split(/\r?\n/).find(x => x.trim()) || '') : '';
  // il titolo di una voce: testo, font e larghezza disponibile (sulle cose a destra c'è il tipo)
  const tipoDi = v => { const q = computeEffectiveQ(v.r.c); return pdfTxt(TIPI[q].label + (v.r.c.inderogabile && q === 2 ? ' - fissa' : '') + (v.r.c.ctx === 'personale' ? ' · Personale' : '')); };
  const testoVoce = v => {
    if (v.tipo === 'cosa') return { testo: (computeEffectiveQ(v.r.c) === 1 ? '! ' : '') + pdfTxt(v.r.c.title), stile: computeEffectiveQ(v.r.c) === 1 ? 'bold' : 'normal', tipo: tipoDi(v) };
    if (v.tipo === 'evento') return { testo: pdfTxt(`${v.e.coach ? 'Coach: ' : v.e.prepCoach ? 'Preparazione coach: ' : ''}${v.e.titolo}${coseSovrapposte(v.e).length ? '  *' : ''}`), stile: 'normal' };
    if (v.tipo === 'routine') return { testo: 'Routine del mattino', stile: 'normal' };
    return { testo: 'Cuscinetto: cosa ci hai messo?', stile: 'normal' };
  };
  // titoli lunghi: a capo fino a due righe; i puntini solo se non basta neanche la seconda
  const lineeVoce = (d, v, corpo) => {
    const { testo, stile, tipo } = testoVoce(v);
    d.setFont('helvetica', 'normal'); d.setFontSize(PDF_TESTO.PICCOLO);
    const largo = LARGO_TIT - (tipo ? d.getTextWidth(tipo) + 3 : 0);
    d.setFont('helvetica', stile); d.setFontSize(corpo);
    const tutte = d.splitTextToSize(testo, largo);
    if (tutte.length <= PDF_TESTO.RIGHE_TITOLO) return tutte;
    let ultima = tutte.slice(PDF_TESTO.RIGHE_TITOLO - 1).join(' ');
    while (ultima.length > 4 && d.getTextWidth(ultima + '...') > largo) ultima = ultima.slice(0, -1);
    return [...tutte.slice(0, PDF_TESTO.RIGHE_TITOLO - 1), ultima.trimEnd() + '...'];
  };
  const pesoCon = linee => v => 1 + (linee(v).length - 1) * PDF_TESTO.A_CAPO + (nota(v) ? PDF_TESTO.NOTA : 0) + (v.tipo === 'cuscinetto' ? .7 : 0);
  const peso = pesoCon(v => lineeVoce(prova, v, 10.5));                      // per la stima: il corpo più grande
  const righeZona = (voci, p = peso) => Math.max(MIN_RIGHE, voci.reduce((t, v) => t + p(v), 0));
  const fissi = (30 + 12 + 10) * s;                                           // intestazione con legenda, riquadro giallo, piè di pagina
  const totRighe = righeZona(inSett) + giorni.reduce((t, z) => t + righeZona(z.voci) + 1.5 + (z.pieno ? .6 : 0), 0);
  const RIGA_MIN = 4.6;                                                       // con il corpo a 9 pt sotto non si legge
  const stima = Math.max(RIGA_MIN, Math.min(7.2 * s, (LIMITE - M - fissi) / totRighe));
  // v6 · colori del foglio = colori dell'app (tema chiaro); il fondo delle Subito è un po' più carico, sulla carta #FFF4F3 non si vede
  const PDF_COL = { 1: [217, 45, 32], 2: [37, 99, 235], 3: [161, 98, 7], 4: [122, 134, 130], evt: [91, 90, 142], evtInk: [85, 84, 138], subitoFondo: [253, 226, 223], giallo: [255, 244, 179] };   // v48 · Carta e salvia
  const nPiano = unGiorno ? giorni[0].voci.filter(v => v.tipo === 'cosa').length : cose.length;
  // tutto su un foglio quando si può: se esce su due pagine si rifà con le righe più strette, fino al minimo leggibile
  const costruisci = RIGA => {
    const doc = new jsPDFCtor({ unit: 'mm', format: formato, orientation: 'portrait' });
    const corpo = RIGA < 5.4 ? 9.5 : 10.5, piccolo = PDF_TESTO.PICCOLO;       // corpo ≥ 9 pt anche in A5
    const lineeDi = new Map([...inSett, ...giorni.flatMap(z => z.voci)].map(v => [v, lineeVoce(doc, v, corpo)]));
    const linee = v => lineeDi.get(v) || [testoVoce(v).testo];
    const peso = pesoCon(linee);
    let y = M;
    const spazio = h => { if (y + h > LIMITE) { doc.addPage(); y = M + 2; } };
    const colore = (rgb, fn) => { doc[fn](...rgb); };
    const punteggiata = (x, yy, w) => { doc.setDrawColor(150); doc.setLineDashPattern([.8, 1.1], 0); doc.line(x, yy, x + w, yy); doc.setLineDashPattern([], 0); doc.setDrawColor(0); };
    const taglia = (t, largo) => { let x = pdfTxt(t); const orig = x; while (x.length > 4 && doc.getTextWidth(x) > largo) x = x.slice(0, -2); return x === orig ? x : x.trimEnd() + '...'; };
    const quadratino = (fatto, tratteggiato, rgb) => {
      if (rgb) colore(rgb, 'setDrawColor'); else doc.setDrawColor(tratteggiato ? 120 : 40);
      doc.setLineWidth(rgb ? .5 : .3);
      if (tratteggiato) doc.setLineDashPattern([.7, .7], 0);
      doc.rect(M + .5, y - 3 * s, 3.2 * s, 3.2 * s);
      doc.setLineDashPattern([], 0);
      if (fatto) { doc.setLineWidth(.45); doc.line(M + 1.1, y - 1.5 * s, M + 1.9 * s, y - .6 * s); doc.line(M + 1.9 * s, y - .6 * s, M + 3.2 * s, y - 2.6 * s); }
      doc.setLineWidth(.2); doc.setDrawColor(0);
    };
    const cerchio = viola => { if (viola) colore(PDF_COL.evt, 'setDrawColor'); else doc.setDrawColor(90); doc.setLineWidth(viola ? .5 : .3); doc.circle(M + 2.1 * s, y - 1.4 * s, 1.6 * s); doc.setLineWidth(.2); doc.setDrawColor(0); };
    const orario = (da, a) => a ? `${da}–${a}` : da;
    const scriviTitolo = v => { linee(v).forEach((t, i) => { if (i) y += RIGA * PDF_TESTO.A_CAPO; doc.text(t, X_TIT, y); }); };

    const rigaCosa = v => {
      const r = v.r, q = computeEffectiveQ(r.c);
      const extra = (linee(v).length - 1) * RIGA * PDF_TESTO.A_CAPO;
      if (q === 1 && !r.fatto) { colore(PDF_COL.subitoFondo, 'setFillColor'); doc.rect(M - .5, y - RIGA * .72, COL_L + 1, RIGA - .4 + extra, 'F'); }   // fondo rosato; in bianco e nero c'è il «!»
      quadratino(r.fatto, false, PDF_COL[q]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(piccolo); doc.setTextColor(70);
      doc.text(r.ora || '', X_ORA, y);
      doc.setTextColor(100); doc.text(tipoDi(v), M + COL_L, y, { align: 'right' });
      punteggiata(COL_R_X, y, COL_R_W);
      doc.setFont('helvetica', q === 1 ? 'bold' : 'normal'); doc.setFontSize(corpo); doc.setTextColor(0);
      scriviTitolo(v);
      const n = nota(v);   // la prima riga della nota, in grigio più piccolo (come il foglio del coach)
      if (n) { y += RIGA * PDF_TESTO.NOTA; doc.setFont('helvetica', 'normal'); doc.setFontSize(piccolo); doc.setTextColor(110); doc.text(taglia(n, LARGO_TIT), X_TIT, y - .2); doc.setTextColor(0); }
    };
    const rigaGrigia = (marca, quando, v) => {
      if (marca === 'cerchio' || marca === 'viola') cerchio(marca === 'viola'); else quadratino(false, true);
      if (marca === 'viola') { doc.setFont('helvetica', 'bold'); doc.setFontSize(piccolo); colore(PDF_COL.evtInk, 'setTextColor'); }
      else { doc.setFont('helvetica', 'normal'); doc.setFontSize(piccolo); doc.setTextColor(80); }
      doc.text(quando, X_ORA, y);
      doc.setFont('helvetica', 'normal');
      punteggiata(COL_R_X, y, COL_R_W);
      doc.setFontSize(corpo); doc.setTextColor(60);
      scriviTitolo(v);
      doc.setTextColor(0);
    };
    const disegnaVoce = v => {
      spazio(RIGA * peso(v));
      if (v.tipo === 'evento') rigaGrigia('viola', v.e.ora ? orario(v.e.ora, v.e.fine) : 'tutto il g.', v);
      else if (v.tipo === 'routine') rigaGrigia('cerchio', orario(v.routine.da, v.routine.a), v);
      else if (v.tipo === 'cuscinetto') {
        const o = bpOra(v.item) || CUSC.META;
        rigaGrigia('tratteggio', orario(o, oraFine(o, bpDurata(v.item))), v);
        y += RIGA * .7; punteggiata(X_TIT, y, LARGO_TIT);
      } else rigaCosa(v);
      y += RIGA;
    };
    const righeVuote = n => { for (let i = 0; i < n; i++) { spazio(RIGA); punteggiata(X_TIT, y, COL_L - (X_TIT - M)); punteggiata(COL_R_X, y, COL_R_W); y += RIGA; } };

    // intestazione
    const da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(da.getDate() + 6);
    const dm = d => `${d.getDate()}/${d.getMonth() + 1}`;
    const titolo = pdfTxt(unGiorno ? `Giornata — ${nomeUtente()} — ${fmtGiornoLungo(dataDelGiorno(opz.giorno))} (settimana ${state.week})` : `Business Plan Settimanale — ${nomeUtente()} — Settimana ${state.week} (${dm(da)}–${dm(a)})`);
    doc.setFont('helvetica', 'bold');
    let ft = 15 * s;
    doc.setFontSize(ft);
    while (ft > 10 * s && doc.getTextWidth(titolo) > W - 2 * M) { ft -= .5; doc.setFontSize(ft); }
    doc.text(titolo, M, y + 6 * s);
    // da compilare a penna: Fatte ___ / N · Q2 spostate ___
    y += 13 * s;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(`Fatte ____ / ${nPiano}`, M, y);
    if (!unGiorno) doc.text('Q2 spostate ____', M + 52 * s, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90);
    doc.text('Lavoro e personale', W - M, y, { align: 'right' });
    // legenda
    y += 6 * s;
    let lx = M;
    const voceLeg = (disegna, testo) => { disegna(lx, y); doc.setTextColor(60); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(testo, lx + 5, y); lx += 5 + doc.getTextWidth(testo) + 5; };
    const qLeg = q => (x, yy) => { colore(PDF_COL[q], 'setDrawColor'); doc.setLineWidth(.5); if (q === 1) { colore(PDF_COL.subitoFondo, 'setFillColor'); doc.rect(x, yy - 3, 3.2, 3.2, 'FD'); } else doc.rect(x, yy - 3, 3.2, 3.2); doc.setLineWidth(.2); doc.setDrawColor(0); };
    voceLeg(qLeg(1), '! Subito'); voceLeg(qLeg(2), 'Importante'); voceLeg(qLeg(3), 'Delega'); voceLeg(qLeg(4), 'Lascia stare');
    voceLeg((x, yy) => { colore(PDF_COL.evt, 'setDrawColor'); doc.setLineWidth(.5); doc.circle(x + 1.6, yy - 1.4, 1.6); doc.setLineWidth(.2); doc.setDrawColor(0); }, 'Appuntamento');
    voceLeg((x, yy) => { doc.setDrawColor(120); doc.setLineDashPattern([.7, .7], 0); doc.rect(x, yy - 3, 3.2, 3.2); doc.setLineDashPattern([], 0); doc.setDrawColor(0); }, 'Cuscinetto');
    doc.setTextColor(0);
    y += 3.5 * s; doc.setLineWidth(.4); doc.line(M, y, W - M, y); doc.setLineWidth(.2);
    y += 5 * s;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(70); doc.text('APPUNTI · NUOVE COSE EMERSE', COL_R_X, y); doc.setTextColor(0);
    const v38ObY = y - 4 * s;   // v38 · qui, in alto a destra, va il riquadro degli obiettivi (disegnato alla fine, sopra le righe)
    y += 4.5 * s;

    // riquadro giallo: le cose senza giorno (nella giornata stampata va in fondo: «Da pianificare»)
    const boxGiallo = () => {
    const hBox = 8 * s + righeZona(inSett, peso) * RIGA + 1.5 * s;
    spazio(hBox);
    colore(PDF_COL.giallo, 'setFillColor'); doc.setDrawColor(190); doc.roundedRect(M - 2 * s, y - 4.5 * s, COL_L + 4 * s, hBox, 1.5, 1.5, 'FD'); doc.setDrawColor(0);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(Math.max(9.5, 10.5 * s)); doc.text(unGiorno ? 'Da pianificare (Subito e rimaste indietro)' : 'Settimana (pensaci dopo)', M, y);
    punteggiata(COL_R_X, y, COL_R_W);
    y += RIGA;
    inSett.forEach(disegnaVoce);
    if (inSett.length < MIN_RIGHE) righeVuote(MIN_RIGHE - inSett.length);
    y += 3.5 * s;
    };
    if (!unGiorno) boxGiallo();

    // un blocco per giorno
    giorni.forEach(z => {
      spazio(RIGA * (2 + Math.max(MIN_RIGHE, z.voci.reduce((t, v) => t + peso(v), 0))));   // un giorno non si spezza tra due pagine
      doc.setDrawColor(200); doc.line(M, y - 4.6 * s, M + COL_L, y - 4.6 * s); doc.setDrawColor(0);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(Math.max(9.5, 10.5 * s)); doc.text(pdfTxt(z.titolo), M, y);
      if (z.pieno) { doc.setFont('helvetica', 'italic'); doc.setFontSize(piccolo); doc.setTextColor(90); doc.text('giornata piena: nessun cuscinetto possibile', M + COL_L, y, { align: 'right' }); doc.setTextColor(0); }
      punteggiata(COL_R_X, y, COL_R_W);
      y += RIGA;
      z.voci.forEach(disegnaVoce);
      if (unGiorno && !z.voci.some(v => v.tipo === 'cosa' || v.tipo === 'evento')) {
        spazio(RIGA); doc.setFont('helvetica', 'bold'); doc.setFontSize(corpo); doc.setTextColor(180, 35, 24);
        doc.splitTextToSize(pdfTxt('Nessuna attività pianificata per questo giorno: scegli dal riquadro qui sotto.'), LARGO_TIT).forEach(t => { spazio(RIGA); doc.text(t, X_TIT, y); y += RIGA * .85; });
        doc.setTextColor(0); y += RIGA * .15;
      }
      const usate = z.voci.reduce((t, v) => t + peso(v), 0), minimo = unGiorno ? 10 : MIN_RIGHE;
      if (usate < minimo) righeVuote(Math.ceil(minimo - usate));
      y += RIGA * .5;
    });
    if (unGiorno) { y += 3 * s; boxGiallo(); }

    // le righe libere a destra continuano fino in fondo: lì vanno le cose nuove scritte a penna
    while (y + RIGA < LIMITE - 6) { punteggiata(COL_R_X, y, COL_R_W); y += RIGA; }
    // piè di pagina su ogni foglio: Stampato il … · Inviato a …
    const oggi = new Date(), inv = inviatoIl(state.week, state.year);
    // v38 · obiettivi della settimana in alto a destra (come nel foglio del giorno); «Appunti» scende sotto
    {
      doc.setPage(1);
      const obV = v26ObDi(state.week, state.year), rh = 6.6 * s, nRighe = Math.max(V26.MAX_OB, obV.length), bh = 9 * s + rh * nRighe;
      const bx = COL_R_X - 1.5 * s, bw = COL_R_W + 1.5 * s;
      doc.setFillColor(235, 241, 254); doc.setDrawColor(181, 192, 230); doc.setLineWidth(.3); doc.roundedRect(bx, v38ObY, bw, bh, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 58, 138);
      doc.text(pdfTxt('Obiettivi della settimana'), bx + 3, v38ObY + 5.6 * s);
      if (obV.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(`${obV.filter(v => v.fatto).length}/${obV.length}`, bx + bw - 3, v38ObY + 5.6 * s, { align: 'right' }); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(20, 20, 20);
      for (let i = 0; i < nRighe; i++) {
        const yy = v38ObY + 9 * s + rh * (i + 1) - 1.8, v = obV[i];
        doc.setDrawColor(181, 192, 230); doc.setLineWidth(.2); doc.line(bx + 3, yy + 1.5, bx + bw - 3, yy + 1.5);
        doc.setDrawColor(30, 58, 138); doc.rect(bx + 3, yy - 2.8, 2.8, 2.8);
        if (v) {
          if (v.fatto) { doc.setDrawColor(20, 20, 20); doc.line(bx + 3.5, yy - 1.4, bx + 4.4, yy - .4); doc.line(bx + 4.4, yy - .4, bx + 5.6, yy - 2.4); }
          doc.text(doc.splitTextToSize(pdfTxt(v.testo), bw - 11)[0], bx + 7.5, yy);
        }
      }
      const yl = v38ObY + bh + 5.5 * s;
      doc.setFillColor(255, 255, 255); doc.rect(bx, yl - 3.6 * s, bw, 5.2 * s, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(70); doc.text('APPUNTI · NUOVE COSE EMERSE', COL_R_X, yl); doc.setTextColor(0);
      doc.setDrawColor(0); doc.setLineWidth(.2);
    }
    const piede = pdfTxt(unGiorno ? `Stampato il ${oggi.getDate()}/${oggi.getMonth() + 1}/${oggi.getFullYear()} alle ${String(oggi.getHours()).padStart(2, '0')}:${String(oggi.getMinutes()).padStart(2, '0')}` : `Stampato il ${oggi.getDate()}/${oggi.getMonth() + 1}/${oggi.getFullYear()}  ·  Inviato a ${emailCoach()}${inv ? ' il ' + inv : ' ________'}`);
    for (let pg = 1; pg <= doc.getNumberOfPages(); pg++) {
      doc.setPage(pg);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90);
      doc.text(piede, M, H - M / 2);
      doc.text(`${pg} / ${doc.getNumberOfPages()}`, W - M, H - M / 2, { align: 'right' });
      doc.setTextColor(0);
    }
    return doc;
  };
  let RIGA = stima, doc = costruisci(RIGA);
  while (doc.getNumberOfPages() > 1 && RIGA > RIGA_MIN) { RIGA = Math.max(RIGA_MIN, RIGA - .25 * s); doc = costruisci(RIGA); }

  const cusc = state.bp ? state.bpItems.filter(i => i.tipo_slot === 'cuscinetto' && !i.ciclo_id) : [];
  const riepilogo = {
    cose: cose.length, minuti: cose.reduce((t, v) => t + (v.r.durata || BP_DURATA_DEFAULT), 0),
    cuscinetti: cusc.length, minutiCusc: cusc.reduce((t, i) => t + bpDurata(i), 0),
    appuntamenti: giorni.reduce((t, z) => t + z.voci.filter(v => v.tipo === 'evento').length, 0)
  };
  const nome = unGiorno ? `giornata-${toISODate(dataDelGiorno(opz.giorno))}${formato === 'a5' ? '-a5' : ''}.pdf` : `business-plan-${state.year}-W${String(state.week).padStart(2, '0')}${formato === 'a5' ? '-a5' : ''}.pdf`;
  if (!unGiorno) ui.ultimoPdf = { pagine: doc.getNumberOfPages(), nome, riepilogo, formato };
  return { doc, nome, riepilogo };
}

function bpStampaPdf() {
  const pdf = creaPdfSettimana();
  if (!pdf) return;
  const { doc, nome } = pdf;
  try {
    const url = URL.createObjectURL(doc.output('blob'));
    const win = window.open(url, '_blank');
    if (!win) { doc.save(nome); showToast('PDF scaricato', 'info'); } else showToast('PDF pronto per la stampa', 'success');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { doc.save(nome); showToast('PDF scaricato', 'info'); }
}

// ══════════════════════════════════════════════════════════════
