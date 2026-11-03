const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = '2026-11-03T08:00:00+01:00';
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', macro_area: 'Vendite', done: false, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
(async () => {
  const { browser, page, logs } = await apriApp({ viewport: { width: 1280, height: 900 }, ora, seed: { cicli: [base('s1', 'Chiamare Korab', { q: 1 })] }, localStorage: { cicli_theme: 'dark' }, attesa: 2500 });
  const t = await page.evaluate(async () => { window.open = () => ({}); await v26Stampa([new Date(2026, 10, 8)]); return window.__v26UltimaStampa.doc.output(); });
  a(t.includes('scegli qui sotto') && t.includes('Da pianificare') && t.includes('Chiamare Korab'), 'giorno vuoto con Subito da pianificare: la lista c\'è');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; ui.tab = 'pianifica'; ui.pian = 'giorno'; ui.giorno = 1; render(); }); await page.waitForTimeout(400);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v26_scuro.png' });
  const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 2)));
  await browser.close();
})();
