// v28 · Lavoro | Personale: indovina meglio, scelta sempre visibile; dettatura pulita
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = '2026-11-03T08:30:00+01:00';
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', macro_area: 'Management', done: false, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
(async () => {
  // come i dati veri: tante cose di lavoro con «appuntamento», «settimana», e «cresima» finita in Lavoro per sbaglio
  const cicli = [
    ...[1, 2, 3, 4, 5].map(i => base('l' + i, `Fissare appuntamento con cliente ${i} questa settimana`)),
    base('x1', 'Rispondere a Carmela per la cresima', { done: true }), base('x2', 'Cresima: foto', { done: true }), base('x3', 'Cresima sala', { done: true }),
    base('p1', 'Palestra con Francesca', { ctx: 'personale', cat: 'salute', macro_area: 'Famiglia / cose personali' })
  ];
  const { browser, page, logs, db } = await apriApp({ mobile: true, ora, seed: { cicli }, attesa: 2500 });
  let r = await page.evaluate(() => ['Fissare appuntamento per farsi i capelli nella settimana prima della cresima', 'Comprare vestito cresima mia', 'Fissare appuntamento con il cliente Rossi', 'Preventivo antincendio Bertinga'].map(t => indovinaContesto(t, { ctx: 'lavoro' }).ctx));
  a(r.join() === 'personale,personale,lavoro,lavoro', 'contesti: ' + r.join());
  // dettatura
  r = await page.evaluate(() => [v28UnisciDettatura('Fissare appuntamento per farsi i capelli ', 'Nella settimana prima della cresima'), v28UnisciDettatura('Comprare ', 'Comprare vestito cresima Mia'), v28UnisciDettatura('', 'chiamare Rossi virgola poi Bianchi'), v28UnisciDettatura('Sentire ', 'Mia per la verifica'), v28UnisciDettatura('', 'scrivere a Lucia punto a capo chiamare Samuele')]);
  a(r[0] === 'Fissare appuntamento per farsi i capelli nella settimana prima della cresima', 'maiuscola a metà: ' + r[0]);
  a(r[1] === 'Comprare vestito cresima Mia', 'parola ripetuta: ' + r[1]);
  a(r[2] === 'chiamare Rossi, poi Bianchi', 'virgola: ' + r[2]);
  a(r[3] === 'Sentire Mia per la verifica', 'i nomi restano maiuscoli: ' + r[3]);
  a(r[4] === 'scrivere a Lucia\nchiamare Samuele', 'punto a capo = due cose: ' + JSON.stringify(r[4]));
  // anteprima: scelta Lavoro | Personale, già su Personale
  await page.evaluate(() => apriRapido()); await page.waitForTimeout(300);
  await page.fill('#rapido-testo', 'Fissare appuntamento per farsi i capelli prima della cresima'); await page.waitForTimeout(500);
  r = await page.evaluate(() => [...document.querySelectorAll('#rapido-anteprima .v28-ctx-b')].map(b => b.dataset.to + ':' + b.getAttribute('aria-pressed') + ':' + b.textContent.trim()));
  a(r.length === 2 && /^personale:true/.test(r[1]) && /^lavoro:false/.test(r[0]), 'anteprima Lavoro | Personale: ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v28_anteprima.png' });
  // tocco su Personale (già scelto) non cambia; su Lavoro sì; poi torno a Personale
  await page.click('#rapido-anteprima .v28-ctx-b[data-to="personale"]'); await page.waitForTimeout(200);
  a(await page.evaluate(() => document.querySelector('#rapido-anteprima .v28-ctx-b[data-to="personale"]').getAttribute('aria-pressed') === 'true'), 'tocco sul già scelto: resta');
  await page.click('#rapido-anteprima .v28-ctx-b[data-to="lavoro"]'); await page.waitForTimeout(200);
  a(await page.evaluate(() => document.querySelector('#rapido-anteprima .v28-ctx-b[data-to="lavoro"]').getAttribute('aria-pressed') === 'true'), 'tocco su Lavoro: cambia');
  await page.click('#rapido-anteprima .v28-ctx-b[data-to="personale"]'); await page.waitForTimeout(200);
  await page.click('[data-act="rapido-salva"]'); await page.waitForTimeout(1200);
  const nuova = db.tabelle.cicli.find(x => /capelli/.test(x.title));
  a(nuova && nuova.ctx === 'personale', 'salvata in Personale: ' + (nuova && nuova.ctx));
  // una tua correzione vince sulla lista
  r = await page.evaluate(() => { imparaCtx('Cresima sponsor', 'lavoro'); imparaCtx('Cresima sponsor', 'lavoro'); return indovinaContesto('Cresima sponsor evento', { ctx: 'personale' }).ctx; });
  a(r === 'lavoro', 'la correzione vince: ' + r);
  const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 2)));
  await browser.close();
})();
