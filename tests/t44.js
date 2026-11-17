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
  await page.mouse.move(700, 600);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(80); }
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => { const b = document.querySelector('#v44-testa'); return { su: b.classList.contains('su'), giorni: [...b.querySelectorAll('.v44-g')].map(x => x.textContent.trim().slice(0, 6)), top: b.getBoundingClientRect().top }; });
  a(r.su && r.giorni.length >= 5, 'scorrendo: barra con i giorni ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v44_barra.png' });
  // trascina una cosa in fondo al martedì sul giovedì della barra
  const sel = '.item[data-id="m13"][draggable="true"]';
  await page.$eval(sel, el => el.scrollIntoView({ block: 'end' })); await page.waitForTimeout(300);
  const vis = await page.evaluate(() => { v44Aggiorna(); return document.querySelector('#v44-testa').classList.contains('su'); });
  a(vis, 'con la cosa in fondo in vista la barra c\'è');
  await page.dragAndDrop(sel, '#v44-testa [data-v44-zona="giovedi"]');
  await page.waitForTimeout(1200);
  a(await page.evaluate(() => ciclo('m13').pianificato_data === '2026-11-19'), 'trascinata sul giovedì della barra');
  // la freccia della barra cambia settimana
  await page.evaluate(() => { window.scrollTo(0, 2000); document.querySelectorAll('*').forEach(e => { if (e.scrollHeight > e.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop = 2000; }); }); await page.waitForTimeout(400);
  const su2 = await page.evaluate(() => { v44Aggiorna(); return document.querySelector('#v44-testa').classList.contains('su'); });
  if (su2) { await page.click('#v44-testa [data-dir="1"]'); await page.waitForTimeout(1200); a(await page.evaluate(() => state.week === 48), 'freccia della barra: settimana 48'); }
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
