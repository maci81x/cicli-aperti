// v40 · Pianifica › Giorno: Subito e Importanti da mettere in giornata
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = new Date('2026-11-10T09:00:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 46, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [
  base('s1', 'Chiamare Arillo', { q: 1 }),
  base('s2', 'Pagare F24 Franci', { q: 2, due_date: '2026-11-16', ctx: 'personale' }),
  base('i1', 'Preventivo Rosseti', { q: 2 }),
  base('p1', 'Già pianificata mercoledì', { q: 1, pianificato_data: '2026-11-11' }),
  base('d1', 'Delega a Nicco', { q: 3 }),
  base('f1', 'Fatta', { q: 1, done: true }),
] };
(async () => {
  for (const vp of [{ viewport: { width: 1440, height: 900 } }, { mobile: true }]) {
    const { browser, page, logs } = await apriApp({ ...vp, ora: '2026-11-10T09:00:00+01:00', seed, attesa: 3500 });
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'giorno'; ui.giorno = 2; vai('pianifica'); });
    await page.waitForTimeout(500);
    let r = await page.evaluate(() => { const b = document.querySelector('.v40-dametti'); if (!b) return null;
      return { gr: [...b.querySelectorAll('.v40-gr-h span:first-child')].map(x => x.innerText), t: [...b.querySelectorAll('.v40-apri .t')].map(x => x.innerText) }; });
    const tag = vp.mobile ? 'telefono' : 'computer';
    a(r, tag + ': box presente');
    a(r && r.t.join('|') === 'Pagare F24 Franci|Chiamare Arillo|Preventivo Rosseti' && r.gr.join('|').toUpperCase() === 'SUBITO|IMPORTANTI', tag + ': voci ' + JSON.stringify(r));
    await page.screenshot({ path: (process.env.OUT || '/tmp') + `/v40_${tag}.png`, fullPage: true });
    if (!vp.mobile) {
      await page.click('.v40-metti[data-id="i1"]'); await page.waitForTimeout(1200);
      r = await page.evaluate(() => ({ data: ciclo('i1').pianificato_data, box: [...document.querySelectorAll('.v40-apri .t')].map(x => x.innerText), giorno: [...document.querySelectorAll('.v26-g-main .item-title')].map(x => x.innerText) }));
      a(r.data === '2026-11-11' && !r.box.includes('Preventivo Rosseti') && r.giorno.some(t => /Rosseti/.test(t)), 'metti in giornata ' + JSON.stringify(r));
      await page.evaluate(() => { ui.giorno = 0; render(); }); await page.waitForTimeout(300);
      a(await page.evaluate(() => !document.querySelector('.v40-dametti')), 'giorno passato: niente box');
    }
    { const e = errori(logs); a(!e.length, tag + ' console ' + JSON.stringify(e.slice(0, 3))); }
    await browser.close();
  }
})();
