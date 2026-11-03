// v26 · rosso «Non si sposta», obiettivi, Pianifica → Giorno, stampa un foglio per giorno, ritmo, Chiudi la giornata, Togli persone/aree
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-03T18:40:00+01:00';   // martedì sera, settimana 45
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  { id: 'e1', status: 'confirmed', summary: '11 - Allineamento Organigramma', start: { dateTime: T('03', '11:00') }, end: { dateTime: T('03', '12:45') }, organizer: io, creator: io, attendees: [{ email: 'francesco@sisoluzioniimpresa.it' }, { ...io, organizer: true }], hangoutLink: 'https://meet.google.com/x' },
  { id: 'e2', status: 'confirmed', summary: 'Prove su Odoo', start: { dateTime: T('03', '16:30') }, end: { dateTime: T('03', '17:30') }, organizer: io, creator: io },
  { id: 'e3', status: 'confirmed', summary: 'Sentire Elisabetta per rifissare', start: { date: '2026-11-03' }, end: { date: '2026-11-04' }, organizer: io, creator: io },
  { id: 'e4', status: 'confirmed', summary: 'Riunione soci', start: { dateTime: T('04', '09:00') }, end: { dateTime: T('04', '11:30') }, organizer: io, creator: io, recurringEventId: 'soci', attendees: [{ email: 'marco@sisoluzioniimpresa.it' }, { ...io, organizer: true }] }
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', macro_area: 'Vendite', done: false, da_plaud: false, ricorrente: false, ricorrenza: 'nessuna', week: 45, year: 2026, settimana_anno: '2026-W45', created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const aree = ['Management', 'Vendite', 'Produzione', 'Formazione'].map((nome, i) => ({ id: 'a' + i, nome, ordine: i + 1, categorie: [] }));
const seed = {
  cicli: [
    base('c1', 'ASP Siena – giudizi di idoneità', { q: 1, pianificato_data: '2026-11-03', note: 'Samu deve spiegare perché non partono' }),
    base('c2', 'PAN – confermare a Lucia il 10/11', { pianificato_data: '2026-11-03', inderogabile: true }),
    base('c3', 'Fare mansionario DV', { pianificato_data: '2026-11-03', note: 'riga uno della nota\nriga due' }),
    base('c4', 'Preventivo Rossi', { pianificato_data: '2026-11-04', macro_area: 'Formazione' }),
    base('c5', 'Delegata a Samu', { q: 3, delega_persona_id: 'p1' })
  ],
  persone: [{ id: 'p1', nome: 'Samuele' }, { id: 'p2', nome: 'Giovanna' }],
  macro_aree: aree,
  obiettivi_settimana: [{ settimana_anno: '2026-W45', voci: [{ testo: 'Vendere 20.000 €', fatto: false }, { testo: '10 clienti nuovi', fatto: true }] }]
};
(async () => {
  // ---------- computer ----------
  let { browser, page, logs, db, cal } = await apriApp({ viewport: { width: 1440, height: 1000 }, seed, events, ora: ORA, attesa: 3000 });
  await page.evaluate(() => { ui.tab = 'pianifica'; ui.sub = null; ui.pian = 'settimana'; render(); }); await page.waitForTimeout(500);
  let r = await page.evaluate(() => ({
    v: VERSIONE_APP,
    seg: [...document.querySelectorAll('#view [data-act="pian"]')].map(b => b.dataset.v),
    ob: (document.querySelector('#view .v26-testa .v26-obiettivi') || {}).innerText || '',
    pdfAct: !!document.querySelector('#view [data-act="v26-stampa-scegli"]'),
    col: (() => { const z = [...document.querySelectorAll('#view .board section.bcol')].find(s => /Mar/.test(s.getAttribute('aria-label') || '')); if (!z) return null; return [...z.querySelectorAll('.bzona > *')].map(x => x.classList.contains('fascia-h') ? '#' + x.textContent.trim() : (x.classList.contains('v26-fisso') ? '!' : '') + ((x.querySelector('.item-title') || {}).textContent || '').trim().slice(0, 18)); })()
  }));
  a(/^2026-11-03 v2[6-9]/.test(r.v), 'versione ' + r.v);
  a(r.seg.join() === 'settimana,giorno,mese', 'Settimana · Giorno · Mese ' + r.seg.join());
  a(/Obiettivi della settimana/.test(r.ob) && /Vendere 20\.000/.test(r.ob) && /1\/2/.test(r.ob), 'obiettivi in alto: ' + r.ob.replace(/\n/g, ' | '));
  a(r.pdfAct, 'la stampante della settimana sceglie i giorni');
  a(r.col && r.col[0] === '#Non si sposta' && r.col.filter(x => x.startsWith('!')).length === 2 && r.col.includes('#Si può spostare'), 'martedì: in cima Non si sposta ' + JSON.stringify(r.col));
  // obiettivo spuntato
  await page.click('#view .v26-testa .v26-ob-voce[data-i="0"]'); await page.waitForTimeout(400);
  a(db.tabelle.obiettivi_settimana[0].voci[0].fatto === true, 'spunta obiettivo salvata');
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v26_settimana.png' });
  // un appuntamento: Non si sposta
  await page.evaluate(() => apriFoglioEvento('e4')); await page.waitForTimeout(300);
  await page.click('#evt-corpo [data-act="v26-evt-fisso"]'); await page.waitForTimeout(500);
  r = await page.evaluate(() => ({ fissi: [...state.evtFissi], riga: (document.querySelector('#view .evt-riga.v26-fisso') || {}).innerText || '' }));
  a(r.fissi.includes('serie:soci') && db.tabelle.eventi_fissi.some(x => x.chiave === 'serie:soci') && /non si sposta/.test(r.riga), 'appuntamento ricorrente: non si sposta (tutta la serie) ' + JSON.stringify(r.fissi));
  await page.evaluate(() => document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')));
  // spostarlo chiede conferma
  await page.evaluate(() => apriSpostaEvento('e4', '2026-11-05')); await page.waitForTimeout(300);
  r = await page.evaluate(() => ({ open: $('proteggiOverlay').classList.contains('open'), t: $('proteggi-titolo').textContent }));
  a(r.open && /non si sposta/i.test(r.t), 'spostare un appuntamento rosso chiede conferma: ' + r.t);
  await page.click('[data-act="proteggi-lascia"]'); await page.waitForTimeout(300);
  a(await page.evaluate(() => !$('sevtOverlay') || !$('sevtOverlay').classList.contains('open')), '«Lasciala»: resta dov\'era');
  // menu ⋯ di una cosa: Non si sposta
  await page.evaluate(() => { const b = [...document.querySelectorAll('#view .item[data-id="c3"] [data-act="menu"]')][0]; b.click(); }); await page.waitForTimeout(200);
  a(await page.evaluate(() => !!document.querySelector('#rigaMenu [data-act="v26-fisso"]')), 'menu ⋯: voce «Non si sposta»');
  await page.click('#rigaMenu [data-act="v26-fisso"]'); await page.waitForTimeout(500);
  a(db.tabelle.cicli.find(c => c.id === 'c3').inderogabile === true, 'cosa segnata «Non si sposta» (inderogabile)');
  // vista Giorno
  await page.evaluate(() => { ui.pian = 'giorno'; ui.giorno = 1; render(); }); await page.waitForTimeout(400);
  r = await page.evaluate(() => ({ t: (document.querySelector('#view .v26-g-frecce b') || {}).textContent, largo: $('view').classList.contains('largo'), heads: [...document.querySelectorAll('#view .v26-g-main .list-head')].map(x => x.innerText.replace(/\s+/g, ' ')), stampa: !!document.querySelector('#view [data-act="v26-stampa-giorni"]'), ob: !!document.querySelector('#view .v26-g-lato .v26-obiettivi') }));
  a(/Martedì 3 novembre/.test(r.t) && r.largo && /Non si sposta 3/.test(r.heads[0]) && /si può spostare/.test(r.heads[1] || '') && r.stampa && r.ob, 'vista Giorno: ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v26_giorno.png' });
  await page.click('#view [data-act="v26-giorno-sposta"][data-v="1"]'); await page.waitForTimeout(300);
  a(await page.evaluate(() => /Mercoledì 4/.test(document.querySelector('#view .v26-g-frecce b').textContent)), 'freccia: giorno dopo');
  // stampa: scelta e PDF
  await page.evaluate(() => { window.open = () => ({}); ui.pian = 'settimana'; render(); }); await page.waitForTimeout(300);
  await page.click('#view [data-act="v26-stampa-scegli"]'); await page.waitForTimeout(300);
  r = await page.evaluate(() => [...document.querySelectorAll('#v26st-scelte .riga-link')].map(b => b.innerText.replace(/\s+/g, ' ')));
  a(r.length === 5 && /Solo martedì 3/.test(r[0]) && /Da oggi a domenica 6 fogli/.test(r[1]) && /riepilogo/.test(r[4]), 'scelte di stampa: ' + JSON.stringify(r));
  await page.click('#v26st-scelte [data-v="da-oggi"]'); await page.click('[data-act="v26-stampa-ok"]'); await page.waitForTimeout(1500);
  r = await page.evaluate(() => { const s = window.__v26UltimaStampa; const t = s.doc.output(); return { nome: s.nome, giorni: s.giorni, pagine: s.pagine, vuoti: s.vuoti, has: ['Obiettivi della settimana', 'Vendere 20.000', 'Non si sposta', 'ASP Siena', 'PAN', 'Allineamento Organigramma', 'in giornata', 'Sentire Elisabetta', 'Da fare', 'Arrivate oggi', 'Note', 'foglio 1 di 6', 'foglio 6 di 6', 'Nessuna attivit', 'riga uno della nota'].filter(x => t.includes(x)), tuttoG: t.includes('tutto il g') }; });
  a(r.giorni === 6 && r.pagine === 6, 'da oggi a domenica: 6 fogli, uno per giorno ' + JSON.stringify({ g: r.giorni, p: r.pagine }));
  a(['Obiettivi della settimana', 'Vendere 20.000', 'Non si sposta', 'ASP Siena', 'Allineamento Organigramma', 'in giornata', 'Sentire Elisabetta', 'Da fare', 'Arrivate oggi', 'Note', 'foglio 1 di 6', 'foglio 6 di 6', 'Nessuna attivit', 'riga uno della nota'].every(x => r.has.includes(x)) && !r.tuttoG, 'contenuto del foglio ' + JSON.stringify(r.has));
  // il PDF in immagine per controllarlo a occhio
  const b64 = await page.evaluate(() => window.__v26UltimaStampa.doc.output('datauristring').split(',')[1]);
  require('fs').writeFileSync((process.env.OUT || '/tmp') + '/v26_fogli.pdf', Buffer.from(b64, 'base64'));
  // mail a Leo con gli obiettivi
  r = await page.evaluate(() => testoInvio({ cose: 3, minuti: 90, cuscinetti: 0, appuntamenti: 2 }));
  a(/Obiettivi della settimana:\n- Vendere 20\.000 € \(fatto\)\n- 10 clienti nuovi \(fatto\)/.test(r), 'mail a Leo con gli obiettivi');
  // Oggi: ritmo in una riga, sera = Chiudi la giornata
  await page.evaluate(() => { ui.tab = 'oggi'; render(); }); await page.waitForTimeout(300);
  r = await page.evaluate(() => { const s = document.querySelector('#view .v26-ritmo'); return s && { t: s.innerText.replace(/\s+/g, ' '), aperto: s.classList.contains('aperto'), btn: (s.querySelector('.btn-primary') || {}).dataset.act }; });
  a(r && !r.aperto && /Sera: 2 minuti/.test(r.t) && r.btn === 'v26-chiudi-giornata' && !/Spunta quello/.test(r.t), 'ritmo chiuso in una riga, sera → Chiudi la giornata ' + JSON.stringify(r));
  await page.click('#view .v26-ritmo-testa'); await page.waitForTimeout(200);
  a(await page.evaluate(() => /Spunta quello/.test(document.querySelector('#view .v26-ritmo').innerText)), 'tocco: si apre la spiegazione');
  await page.click('#view .v26-ritmo .btn-primary'); await page.waitForTimeout(500);
  r = await page.evaluate(() => ({ open: $('v26cgOverlay').classList.contains('open'), voci: [...document.querySelectorAll('#v26cg-corpo .v26-cg-voce')].map(v => (v.classList.contains('rosso') ? '!' : '') + v.querySelector('.v26-cg-tit').textContent.slice(0, 12)) }));
  a(r.open && r.voci.length === 3 && r.voci[0].startsWith('!'), 'Chiudi la giornata: le cose di oggi, rosse prima ' + JSON.stringify(r.voci));
  await page.click('#v26cg-corpo [data-act="v26-cg-fatta"][data-id="c1"]'); await page.waitForTimeout(800);
  a(db.tabelle.cicli.find(c => c.id === 'c1').done === true, 'spunta: fatta');
  a(await page.evaluate(() => $('subitoOverlay').classList.contains('open') && $('v26cgOverlay').classList.contains('open')), 'Subito fatta: la domanda «cosa l\'ha generata» si apre sopra, Chiudi la giornata resta sotto');
  await page.evaluate(() => closeModal('subitoOverlay')); await page.waitForTimeout(200);
  await page.click('#v26cg-corpo [data-act="v26-cg-domani"][data-id="c2"]'); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ pro: $('proteggiOverlay').classList.contains('open'), pd: (ciclo('c2') || {}).pianificato_data }));
  a(r.pro, 'Domani su una cosa «non si sposta» chiede conferma');
  await page.click('[data-act="proteggi-sposta"]'); await page.waitForTimeout(800);
  a(db.tabelle.cicli.find(c => c.id === 'c2').pianificato_data === '2026-11-04', 'Sposta comunque: domani ' + db.tabelle.cicli.find(c => c.id === 'c2').pianificato_data);
  await page.evaluate(() => document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')));
  // Impostazioni: interruttore ritmo, Togli persone/aree, niente «Assegna con Claude»
  await page.evaluate(() => { ui.tab = 'altro'; ui.sub = 'impostazioni'; render(); }); await page.waitForTimeout(400);
  r = await page.evaluate(() => ({ claude: !!document.querySelector('#view [data-act="aree-assegna"]'), pers: document.querySelectorAll('#view [data-act="v26-persona-togli"]').length, aree: document.querySelectorAll('#view [data-act="v26-area-togli"]').length, sw: !!document.querySelector('#view [data-act="v26-ritmo-onoff"]') }));
  a(!r.claude && r.pers === 2 && r.aree === 4 && r.sw, 'Impostazioni: ' + JSON.stringify(r));
  await page.click('#view [data-act="v26-persona-togli"][data-id="p1"]'); await page.waitForTimeout(200);
  r = await page.evaluate(() => ({ t: $('v26sc-titolo').textContent, testo: $('v26sc-testo').textContent, sc: [...document.querySelectorAll('#v26sc-scelte .chip')].map(c => c.textContent) }));
  a(/Togli Samuele/.test(r.t) && /1 cosa delegata ancora aperta: a chi la passo/.test(r.testo) && r.sc.includes('Giovanna'), 'Togli persona: chiede a chi passare le deleghe ' + JSON.stringify(r));
  await page.click('#v26sc-scelte [data-v="p2"]'); await page.click('[data-act="v26-sc-ok"]'); await page.waitForTimeout(800);
  a(!db.tabelle.persone.some(p => p.id === 'p1') && db.tabelle.cicli.find(c => c.id === 'c5').delega_persona_id === 'p2', 'persona tolta, delega passata a Giovanna');
  await page.click('#view [data-act="v26-area-togli"][data-id="a3"]'); await page.waitForTimeout(200);
  r = await page.evaluate(() => $('v26sc-testo').textContent);
  a(/c'è 1 cosa aperta: dove la sposto/.test(r), 'Togli area: ' + r);
  await page.click('#v26sc-scelte [data-v="Vendite"]'); await page.click('[data-act="v26-sc-ok"]'); await page.waitForTimeout(800);
  a(!db.tabelle.macro_aree.some(x => x.id === 'a3') && db.tabelle.cicli.find(c => c.id === 'c4').macro_area === 'Vendite', 'area tolta, cosa spostata in Vendite');
  await page.click('#view [data-act="v26-ritmo-onoff"]'); await page.waitForTimeout(300);
  await page.evaluate(() => { ui.tab = 'oggi'; ui.sub = null; render(); }); await page.waitForTimeout(300);
  a(await page.evaluate(() => !document.querySelector('#view .v26-ritmo')), 'ritmo spento da Impostazioni');
  let e = errori(logs); a(!e.length, 'pc console pulita ' + JSON.stringify(e.slice(0, 3)));
  await browser.close();

  // ---------- telefono, mattina ----------
  ({ browser, page, logs, db } = await apriApp({ mobile: true, seed, events, ora: '2026-11-03T07:30:00+01:00', attesa: 3000 }));
  r = await page.evaluate(() => { const s = document.querySelector('#view .v26-ritmo'); return s && s.innerText.replace(/\s+/g, ' '); });
  a(/Prima di iniziare · 10 minuti/.test(r) && /Stampa il foglio di oggi/.test(r), 'mattina: «Prima di iniziare · 10 minuti» ' + r);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v26_oggi_tel.png' });
  await page.evaluate(() => { ui.tab = 'pianifica'; ui.sub = null; ui.pian = 'settimana'; render(); }); await page.waitForTimeout(400);
  r = await page.evaluate(() => ({ ob: !!document.querySelector('#view .v26-obiettivi'), seg: [...document.querySelectorAll('#view [data-act="pian"]')].map(b => b.dataset.v), x: document.documentElement.scrollWidth <= window.innerWidth }));
  a(r.ob && r.seg.includes('giorno') && r.x, 'telefono Settimana: obiettivi, Giorno, niente scroll orizzontale ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v26_settimana_tel.png', fullPage: true });
  await page.evaluate(() => { ui.pian = 'giorno'; ui.giorno = 1; render(); }); await page.waitForTimeout(400);
  r = await page.evaluate(() => ({ x: document.documentElement.scrollWidth <= window.innerWidth, h: [...document.querySelectorAll('#view .list-head')].map(x => x.innerText.replace(/\s+/g, ' ')).slice(0, 3) }));
  a(r.x && /Non si sposta/.test(r.h[0]), 'telefono Giorno ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v26_giorno_tel.png', fullPage: true });
  // Prepara la settimana prossima: prima gli obiettivi
  await page.evaluate(() => apriWizard(46, 2026)); await page.waitForTimeout(400);
  r = await page.evaluate(() => ({ open: $('v26obOverlay').classList.contains('open'), sotto: $('v26ob-sotto').textContent, ok: $('v26ob-ok').textContent }));
  a(r.open && /Settimana 46/.test(r.sotto) && /Avanti/.test(r.ok), 'Prepara: primo passo gli obiettivi ' + JSON.stringify(r));
  await page.fill('#v26ob-campi input[data-i="0"]', 'Chiudere 3 preventivi');
  await page.click('[data-act="v26-ob-ok"]'); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ wiz: !!document.querySelector('.modal-overlay.open'), ob: v26ObDi(46, 2026) }));
  a(db.tabelle.obiettivi_settimana.some(x => x.settimana_anno === '2026-W46' && x.voci[0].testo === 'Chiudere 3 preventivi') && r.wiz, 'obiettivi salvati, poi si apre la scelta delle cose');
  e = errori(logs); a(!e.length, 'tel console pulita ' + JSON.stringify(e.slice(0, 3)));
  await browser.close();
  console.log(`\n${a.stato.ok} ok · ${a.stato.fail} fail`);
})();
