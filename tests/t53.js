// v51 · una cosa chiusa sparisce dagli elenchi dei giorni e dai fogli da stampare (resta il conteggio «fatte»)
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-23T09:00:00+01:00';
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  { id: 'cb', status: 'confirmed', summary: 'Call cazzabubbolo', start: { dateTime: '2026-11-23T08:05:00+01:00' }, end: { dateTime: '2026-11-23T08:20:00+01:00' }, organizer: io, creator: io }
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 48, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [
  base('fatta', 'Arillo – audit Equalitas', { done: true, execution_status: 'done', chiuso_at: ora, pianificato_data: '2026-11-23' }),
  base('aperta', 'Villoresi – lista contatti clienti', { q: 2, pianificato_data: '2026-11-23' }),
  base('mar', 'Preventivo Cellese', { q: 2, pianificato_data: '2026-11-24' }),
  base('sett', 'Chiamare il notaio', { q: 2 })] };
const O = process.env.OUT || '/tmp';
const nelGiorno = () => ({
  board: [...document.querySelectorAll('.bzona[data-zona="lunedi"] .item')].map(x => x.dataset.id),
  fatteTesta: (document.querySelector('.bcol:not(.bcol-dp):not(.bcol-sett) .bcol-h') || {}).innerText || '',
  fatteTip: (document.querySelector('.bcol:not(.bcol-dp):not(.bcol-sett) .bcol-h .v51-fatte') || {}).ariaLabel || '',
  capo: [...document.querySelectorAll('.bcol:not(.bcol-dp):not(.bcol-sett) .bcol-h')].slice(0, 3).map(h => Math.round(h.getBoundingClientRect().height))
});
(async () => {
  let { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, events, seed, attesa: 4500 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(900);
  let r = await page.evaluate(nelGiorno);
  a(r.board.includes('aperta') && !r.board.includes('fatta'), 'settimana: la chiusa non è nella colonna ' + JSON.stringify(r.board));
  a(r.fatteTip === '1 fatta' && r.capo[0] === r.capo[1], 'settimana: in testa alla colonna il conteggio, su una riga · ' + JSON.stringify([r.fatteTip, r.capo, r.fatteTesta.replace(/\n/g, ' ')]));
  await page.screenshot({ path: O + '/v51_settimana.png' });
  // vista Giorno
  r = await page.evaluate(() => { ui.giorno = 0; ui.pian = 'giorno'; render(); return null; }); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ ids: [...document.querySelectorAll('.v26-g-main .item')].map(x => x.dataset.id), testa: (document.querySelector('.v26-g-nav') || {}).innerText || '' }));
  a(r.ids.includes('aperta') && !r.ids.includes('fatta'), 'giorno: la chiusa non c\'è ' + JSON.stringify(r.ids));
  a(/1 fatta/.test(r.testa), 'giorno: conteggio «1 fatta» · ' + r.testa.replace(/\n/g, ' '));
  await page.screenshot({ path: O + '/v51_giorno.png' });
  // foglio del giorno (v26) e foglio della settimana (v21): i dati che finiscono nel PDF
  r = await page.evaluate(() => {
    const d = v26DatiGiorno(0);
    const tit = x => x.tipo === 'cosa' ? x.r.c.id : 'evt:' + x.e.id;
    const pdfSett = [...GIORNI.map(g => g.key)].flatMap(k => righePdfGiorno(righeDaFare(k), dataDelGiorno(GIORNI.findIndex(g => g.key === k)))).filter(x => x.tipo === 'cosa').map(x => x.r.c.id);
    return { fissi: d.fissi.map(tit), cose: d.cose.map(tit), inSett: d.inSett.map(x => x.r ? x.r.c.id : x.c.id), pdfSett };
  });
  a(!r.fissi.includes('fatta') && !r.cose.includes('fatta'), 'foglio del giorno: niente chiuse ' + JSON.stringify(r));
  a(r.cose.includes('aperta') || r.fissi.includes('aperta'), 'foglio del giorno: le aperte ci sono ' + JSON.stringify(r));
  a(!r.pdfSett.includes('fatta') && r.pdfSett.includes('aperta'), 'foglio della settimana: niente chiuse ' + JSON.stringify(r.pdfSett));
  // spuntare una cosa la fa sparire subito dal giorno
  await page.evaluate(() => { ui.pian = 'settimana'; render(); }); await page.waitForTimeout(600);
  await page.evaluate(() => { const cb = document.querySelector('.bzona[data-zona="lunedi"] .item[data-id="aperta"] input[type=checkbox]'); cb.click(); }); await page.waitForTimeout(1600);
  r = await page.evaluate(nelGiorno);
  a(!r.board.includes('aperta') && r.fatteTip === '2 fatte', 'spuntata: sparisce subito, il conteggio sale a 2 · ' + JSON.stringify(r));
  // «Annulla» la rimette
  await page.evaluate(() => { const b = [...document.querySelectorAll('#toast-container .toast-action')].filter(x => x.textContent === 'Annulla').pop(); if (b) b.click(); }); await page.waitForTimeout(1600);
  r = await page.evaluate(nelGiorno);
  a(r.board.includes('aperta'), 'Annulla: torna nella colonna ' + JSON.stringify(r.board));
  { const e = errori(logs); a(!e.length, 'computer console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  ({ browser, page, logs } = await apriApp({ mobile: true, ora: ORA, events, seed, attesa: 4500 }));
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'giorno'; ui.giorno = 0; vai('pianifica'); }); await page.waitForTimeout(900);
  r = await page.evaluate(() => [...document.querySelectorAll('#view .item')].map(x => x.dataset.id));
  a(!r.includes('fatta'), 'telefono, giorno: niente chiuse ' + JSON.stringify(r));
  await page.screenshot({ path: O + '/v51_giorno_tel.png', fullPage: true });
  { const e = errori(logs); a(!e.length, 'telefono console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
