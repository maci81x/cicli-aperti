// v39 · lente «Cerca» in alto sul telefono, in ogni pagina
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = new Date('2026-11-10T09:00:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 46, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [base('c1', 'Preventivo Rosseti'), base('c2', 'Gestire Agristart'), base('c3', 'Riunione con Giovanna')] };
(async () => {
  let { browser, page, logs } = await apriApp({ mobile: true, ora: '2026-11-10T09:00:00+01:00', seed, attesa: 3500 });
  for (const tab of ['oggi', 'pianifica', 'altro']) {
    await page.evaluate(t => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai(t); }, tab); await page.waitForTimeout(300);
    const r = await page.evaluate(() => { const b = document.querySelector('.top .v39-cerca'); if (!b) return null; const q = b.getBoundingClientRect(); return { vis: getComputedStyle(b).display !== 'none' && q.width > 0, dx: Math.round(window.innerWidth - q.right) }; });
    a(r && r.vis, `lente visibile in ${tab} ` + JSON.stringify(r));
  }
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v39_lente.png' });
  await page.click('.top .v39-cerca'); await page.waitForTimeout(400);
  let r = await page.evaluate(() => ({ tab: ui.tab, focus: document.activeElement && document.activeElement.id }));
  a(r.tab === 'tutto' && r.focus === 'searchInputM', 'tocco: Tutte con il campo pronto ' + JSON.stringify(r));
  await page.keyboard.type('Rosseti'); await page.waitForTimeout(500);
  r = await page.evaluate(() => [...document.querySelectorAll('#view .item .item-title')].map(x => x.innerText));
  a(r.length === 1 && /Rosseti/.test(r[0]), 'cerca: trovata ' + JSON.stringify(r));
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  ({ browser, page, logs } = await apriApp({ viewport: { width: 1280, height: 800 }, ora: '2026-11-10T09:00:00+01:00', seed, attesa: 3000 }));
  a(await page.evaluate(() => getComputedStyle(document.querySelector('.v39-cerca')).display === 'none' && getComputedStyle(document.querySelector('.top-search')).display !== 'none'), 'computer: niente lente, c\'è già il campo in alto');
  await browser.close();
})();
