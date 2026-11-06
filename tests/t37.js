// v37 · rimettere una cosa in «Da pianificare»: trascinando sulla colonna e dal menu ···
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = new Date('2026-11-06T10:00:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 45, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = {
  cicli: [base('c1', 'Preventivo Cellese + conferma Rid', { pianificato_data: '2026-11-06' }), base('c2', 'Gestire Agristart', { pianificato_data: '2026-11-07' }), base('c3', 'Altra da pianificare', { q: 2 })],
  battle_plan: [{ id: 'bp1', settimana: 45, anno: 2026, stato: 'bozza', creato_at: ora, obiettivi: [] }],
  battle_plan_items: [
    { id: 'i1', battle_plan_id: 'bp1', ciclo_id: 'c1', giorno: 'venerdi', fascia: 'mattina', ora_prevista: null, durata_prevista: 30, completato: false, ordine: 0, in_focus: false, tipo_slot: 'cosa' },
    { id: 'i2', battle_plan_id: 'bp1', ciclo_id: 'c2', giorno: 'sabato', fascia: 'mattina', ora_prevista: null, durata_prevista: 30, completato: false, ordine: 1, in_focus: false, tipo_slot: 'cosa' }]
};
(async () => {
  const { browser, page, logs, db } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: '2026-11-06T10:00:00+01:00', seed, localStorage: { focus_date: '2026-11-06' }, attesa: 4000 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.tab = 'pianifica'; ui.pian = 'settimana'; render(); }); await page.waitForTimeout(600);
  const inDp = id => page.evaluate(id => !!document.querySelector(`#dp-lista .item[data-id="${id}"]`), id);
  a(!(await inDp('c1')) && !(await inDp('c2')), 'all\'inizio c1 e c2 sono nei giorni');
  // 1 · trascinando
  await page.dragAndDrop('.bzona[data-zona="venerdi"] .item[data-id="c1"]', '#dp-lista'); await page.waitForTimeout(1200);
  let c1 = db.tabelle.cicli.find(c => c.id === 'c1');
  a(!c1.pianificato_data && !db.tabelle.battle_plan_items.some(i => i.ciclo_id === 'c1'), 'trascinata: niente data, fuori dal piano ' + JSON.stringify([c1.pianificato_data, db.tabelle.battle_plan_items.map(i => i.ciclo_id)]));
  a(await inDp('c1'), 'c1 ora è in Da pianificare');
  // 2 · dal menu ···
  await page.click('.bzona[data-zona="sabato"] .item[data-id="c2"] [data-act="menu"], .bzona[data-zona="sabato"] .item[data-id="c2"] .item-menu'); await page.waitForTimeout(200);
  const voci = await page.evaluate(() => [...document.querySelectorAll('#rigaMenu button')].map(b => b.textContent.trim()));
  a(voci.includes('Rimetti in Da pianificare'), 'menu: c\'è la voce ' + JSON.stringify(voci));
  await page.click('#rigaMenu [data-act="q-dapiano"]'); await page.waitForTimeout(1200);
  const c2 = db.tabelle.cicli.find(c => c.id === 'c2');
  a(!c2.pianificato_data && !db.tabelle.battle_plan_items.some(i => i.ciclo_id === 'c2') && await inDp('c2'), 'dal menu: c2 in Da pianificare');
  // la cosa già in Da pianificare non ha la voce
  await page.click('#dp-lista .item[data-id="c3"] [data-act="menu"], #dp-lista .item[data-id="c3"] .item-menu'); await page.waitForTimeout(200);
  a(!(await page.evaluate(() => !!document.querySelector('#rigaMenu [data-act="q-dapiano"]'))), 'per una cosa già da pianificare la voce non c\'è');
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
