// v52 · i passi si riconoscono anche nei fogli stampati e in testa al dettaglio
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-23T09:00:00+01:00';
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 48, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [
  base('madre', 'Stampare elenco clienti degli agenti', {}),
  base('marco', 'Marco', { parent_id: 'madre', pianificato_data: '2026-11-23' }),
  base('mario', 'Mario', { parent_id: 'madre', pianificato_data: '2026-11-23' }),
  base('sola', 'Fare estrapolazione dei servizi', { pianificato_data: '2026-11-23' })] };
(async () => {
  const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, events: {}, seed, attesa: 4500 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(800);
  const r = await page.evaluate(async () => {
    const giorno = (await v26Stampa([new Date(2026, 10, 23)], { soloDoc: true })).doc.output();
    const sett = creaPdfSettimana({ giorno: 0 }).doc.output();
    const conta = (s, t) => s.split(t).length - 1;
    return { gPasso: conta(giorno, 'Passo di'), gMadre: conta(giorno, 'Stampare elenco clienti'), sPasso: conta(sett, 'Passo di'), sMadre: conta(sett, 'Stampare elenco clienti') };
  });
  a(r.gPasso >= 2 && r.gMadre >= 2, 'foglio del giorno: Marco e Mario dicono di cosa sono passo ' + JSON.stringify(r));
  a(r.sPasso >= 2 && r.sMadre >= 2, 'foglio della settimana: idem ' + JSON.stringify(r));
  await page.evaluate(() => apriDettaglio('marco')); await page.waitForTimeout(500);
  const d = await page.evaluate(() => { const m = document.getElementById('v52-madre'); const t = document.getElementById('f-title'); return m && { testo: m.innerText.replace(/\s+/g, ' '), prima: m.nextElementSibling === t, vis: m.getBoundingClientRect().height > 0 }; });
  a(d && /Passo di Stampare elenco clienti degli agenti/.test(d.testo) && d.prima && d.vis, 'dettaglio: in testa «Passo di …» ' + JSON.stringify(d));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v52_dettaglio.png' });
  await page.click('#v52-madre'); await page.waitForTimeout(500);
  const t = await page.evaluate(() => ({ titolo: document.getElementById('f-title').value, madre: !!document.getElementById('v52-madre') }));
  a(t.titolo === 'Stampare elenco clienti degli agenti' && !t.madre, 'tocco: apre la cosa intera, senza intestazione ' + JSON.stringify(t));
  await page.evaluate(() => { closeModal('modalOverlay'); apriDettaglio('sola'); }); await page.waitForTimeout(400);
  a(await page.evaluate(() => !document.getElementById('v52-madre')), 'una cosa che non è un passo: niente intestazione');
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
