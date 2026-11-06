// v38 · riepilogo della settimana (foglio per Leo): obiettivi in alto a destra
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = new Date('2026-11-06T17:00:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 46, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = {
  cicli: [base('c1', 'Pianificare uscite con Cristiano', {}), base('c2', 'Preventivo Cellese + conferma Rid', {})],
  battle_plan: [{ id: 'bp1', settimana: 46, anno: 2026, stato: 'bozza', creato_at: ora, obiettivi: [] }],
  battle_plan_items: [{ id: 'i1', battle_plan_id: 'bp1', ciclo_id: 'c1', giorno: 'settimana', fascia: null, ora_prevista: null, durata_prevista: 30, completato: false, ordine: 0, in_focus: false, tipo_slot: 'cosa' },
    { id: 'i2', battle_plan_id: 'bp1', ciclo_id: 'c2', giorno: 'lunedi', fascia: 'mattina', ora_prevista: null, durata_prevista: 30, completato: false, ordine: 1, in_focus: false, tipo_slot: 'cosa' }],
  obiettivi_settimana: [{ settimana_anno: '2026-W46', voci: [{ testo: 'Vendere 20.000 €', fatto: false }, { testo: '10 clienti nuovi', fatto: true }] }]
};
(async () => {
  const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: '2026-11-06T17:00:00+01:00', seed, localStorage: { focus_date: '2026-11-06' }, attesa: 4000 });
  await page.evaluate(async () => { state.week = 46; state.year = 2026; await reloadWeekData(); }); await page.waitForTimeout(800);
  const r = await page.evaluate(() => { const x = creaPdfSettimana(); const t = x.doc.output(); window.__p = x.doc; return { pag: x.doc.getNumberOfPages(), ob: t.includes('Obiettivi della settimana'), v1: t.includes('Vendere 20.000'), v2: t.includes('10 clienti nuovi'), app: (t.match(/APPUNTI/g) || []).length }; });
  a(r.ob && r.v1 && r.v2, 'obiettivi nel riepilogo ' + JSON.stringify(r));
  a(r.app === 2, 'Appunti scende sotto il riquadro (la scritta di prima resta coperta) ' + r.app);
  const b64 = await page.evaluate(() => window.__p.output('datauristring').split(',')[1]);
  require('fs').writeFileSync((process.env.OUT || '/tmp') + '/v38_riepilogo.pdf', Buffer.from(b64, 'base64'));
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
