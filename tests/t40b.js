// v40.2 · Giorno: larghezza contenuta, riquadro che scorre da solo
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = new Date('2026-11-10T09:00:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 46, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const cicli = [];
for (let i = 0; i < 12; i++) cicli.push(base('s' + i, `Subito numero ${i} con un titolo abbastanza lungo da andare a capo nella colonna`, { q: 1 }));
for (let i = 0; i < 25; i++) cicli.push(base('i' + i, `Importante ${i}`, {}));
for (let i = 0; i < 6; i++) cicli.push(base('g' + i, `Già oggi ${i}`, { pianificato_data: '2026-11-11' }));
(async () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 2000, height: 850 }]) {
    const { browser, page, logs } = await apriApp({ viewport: vp, ora: '2026-11-10T09:00:00+01:00', seed: { cicli }, attesa: 3500 });
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'giorno'; ui.giorno = 2; vai('pianifica'); });
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => { const v = $('view').getBoundingClientRect(), s = document.querySelector('.v40-scroll'), l = document.querySelector('.v26-g-lato').getBoundingClientRect();
      return { viewW: Math.round(v.width), scrollH: s.clientHeight, contenuto: s.scrollHeight, latoBottom: Math.round(l.bottom), vh: innerHeight, righe: document.querySelectorAll('.v40-riga').length }; });
    a(m.viewW <= 1240 && m.righe === 37 && m.contenuto > m.scrollH && m.latoBottom <= m.vh, `${vp.width}: misure ` + JSON.stringify(m));
    const box = await page.$('.v40-scroll'); const bb = await box.boundingBox();
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    const prima = await page.evaluate(() => ({ s: document.querySelector('.v40-scroll').scrollTop, w: document.scrollingElement.scrollTop, v: $('view').scrollTop, m: (document.querySelector('main') || {}).scrollTop }));
    for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(20); }
    await page.waitForTimeout(300);
    const dopo = await page.evaluate(() => ({ s: document.querySelector('.v40-scroll').scrollTop, w: document.scrollingElement.scrollTop, v: $('view').scrollTop, m: (document.querySelector('main') || {}).scrollTop }));
    a(dopo.s > prima.s && dopo.w === prima.w && dopo.v === prima.v && dopo.m === prima.m, `${vp.width}: scorre solo l'elenco ` + JSON.stringify({ prima, dopo }));
    await page.evaluate(() => { document.querySelector('.v40-scroll').scrollTop = 0; });
    await page.screenshot({ path: (process.env.OUT || '/tmp') + `/v40b_${vp.width}.png` });
    { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
    await browser.close();
  }
})();
