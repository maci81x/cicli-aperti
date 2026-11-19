// v45 · una Subito messa in un giorno passato e non chiusa torna nelle liste
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-17T10:00:00+01:00';
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [base('v', 'Chiamare il notaio', { pianificato_data: '2026-11-12' }), base('f', 'Subito futura', { pianificato_data: '2026-11-19' }), base('i', 'Importante vecchia', { q: 2, pianificato_data: '2026-11-12' }), base('d', 'Subito chiusa', { pianificato_data: '2026-11-12', done: true })] };
(async () => {
  const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, seed, attesa: 4000 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(600);
  let r = await page.evaluate(() => { const c = document.querySelector('.v12-rosso'); return { lista: c ? [...c.querySelectorAll('.v12-righe .item-title')].map(x => x.innerText.trim()) : [], meta: c && c.querySelector('.item[data-id="v"] .ritardo') ? c.querySelector('.item[data-id="v"] .ritardo').innerText : '' }; });
  a(r.lista.some(t => /notaio/.test(t)) && !r.lista.some(t => /futura|chiusa/.test(t)) && /rimasta da gio/.test(r.meta), 'Oggi: la Subito del 12/11 è nella lista ' + JSON.stringify(r));
  await page.evaluate(() => { ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(700);
  r = await page.evaluate(() => ({ sum: (document.querySelector('#dp-lista #v47-indietro summary') || {}).innerText, righe: [...document.querySelectorAll('#dp-lista #v47-indietro .item-title')].map(x => x.innerText.trim()) }));
  a(/Rimaste indietro · 2/.test(r.sum || '') && r.righe.some(t => /notaio/.test(t)) && r.righe.some(t => /Importante vecchia/.test(t)), 'v47: Da pianificare, in cima tutte le rimaste indietro ' + JSON.stringify(r));
  await page.evaluate(() => { ui.pian = 'giorno'; ui.giorno = 2; render(); }); await page.waitForTimeout(500);
  r = await page.evaluate(() => [...document.querySelectorAll('.v40-apri .t')].map(x => x.innerText));
  a(r.some(t => /notaio/.test(t)), 'Giorno: nel riquadro da mettere in giornata ' + JSON.stringify(r));
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
