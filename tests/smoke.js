const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
(async () => {
  for (const mobile of [false, true]) {
    const { browser, page, logs } = await apriApp({ mobile, seed: { cicli: [{ id: 'c1', title: 'Prova', q: 1, ctx: 'lavoro', done: false, macro_area: 'Vendite', created_at: new Date().toISOString() }] } });
    const r = await page.evaluate(() => ({ v: VERSIONE_APP, tab: ui.tab, n: state.cicli.length, h1: (document.querySelector('#view h1') || {}).textContent }));
    a(r.n === 1 && r.tab === 'oggi', (mobile ? 'tel ' : 'pc  ') + 'app aperta ' + JSON.stringify(r));
    for (const tab of ['pianifica', 'tutto', 'altro']) { await page.evaluate(t => { ui.tab = t; ui.sub = null; render(); }, tab); await page.waitForTimeout(300); }
    const e = errori(logs); a(!e.length, 'console pulita ' + JSON.stringify(e.slice(0, 4)));
    await page.screenshot({ path: `${process.env.OUT || '/tmp'}/smoke_${mobile ? 'tel' : 'pc'}.png` });
    await browser.close();
  }
})();
