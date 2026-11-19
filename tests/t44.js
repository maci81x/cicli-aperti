// v44 · Pianifica: barra con settimana e giorni che resta in alto scorrendo; trascinare sul giorno
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-17T10:00:00+01:00';
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const cicli = [base('x', 'Da spostare con il trascinamento', {})];
for (let i = 0; i < 14; i++) cicli.push(base('m' + i, `Cosa di martedì numero ${i} con un titolo lungo`, { pianificato_data: '2026-11-17' }));
(async () => {
  const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 760 }, ora: ORA, seed: { cicli }, attesa: 4000 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(700);
  a(await page.evaluate(() => !document.querySelector('#v44-testa.su')), 'in cima: niente barra');
  await page.evaluate(() => { document.getElementById('main').scrollTop = 1200; }); await page.waitForTimeout(400);
  const r = await page.evaluate(() => { v44Aggiorna(); const t = document.querySelector('.v47-testa').getBoundingClientRect(), g = document.querySelector('.cols.board > .bcol.oggi > .bcol-h').getBoundingClientRect();
    return { barra: document.querySelector('#v44-testa').classList.contains('su'), testaTop: Math.round(t.top), testaBottom: Math.round(t.bottom), giorno: Math.round(g.top) }; });
  a(!r.barra && r.testaTop < 100 && Math.abs(r.giorno - r.testaBottom) < 30, 'v47: scorrendo restano la testa e i giorni (la barra v44 non serve) ' + JSON.stringify(r));
  await page.click('.v47-testa [data-act="sett"][data-dir="1"]'); await page.waitForTimeout(1200);
  a(await page.evaluate(() => state.week === 48), 'freccia della testa fissa: settimana 48');
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
