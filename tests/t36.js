// v36 · «Cosa porti a casa oggi?»: promemoria senza limite di 3, tutte spuntate, la stellina e il conto in Oggi
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = new Date('2026-11-06T08:30:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 45, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const titoli = ['Gestire Agristart', 'Preventivo Biondi Santi - messaggio/mail Nicco', 'Preventivo Cellese + conferma Rid', 'Sollecitare SOCI per invio loro KPI', 'Stampare elenco degli insoluti suddivisi per agenti'];
const seed = {
  cicli: titoli.map((t, i) => base('c' + i, t, {})),
  battle_plan: [{ id: 'bp1', settimana: 45, anno: 2026, stato: 'bozza', creato_at: ora, obiettivi: [] }],
  battle_plan_items: titoli.map((t, i) => ({ id: 'i' + i, battle_plan_id: 'bp1', ciclo_id: 'c' + i, giorno: 'venerdi', fascia: null, ora_prevista: null, durata_prevista: 30, completato: false, ordine: i, in_focus: false, tipo_slot: 'cosa' }))
};
(async () => {
  const { browser, page, logs, db } = await apriApp({ mobile: true, ora: '2026-11-06T08:30:00+01:00', seed, attesa: 4000 });
  let r = await page.evaluate(() => ({ open: $('focusOverlay').classList.contains('open'), sub: $('focus-sub').textContent, sel: [...document.querySelectorAll('#focus-lista input')].map(i => i.checked), dis: [...document.querySelectorAll('#focus-lista input')].filter(i => i.disabled).length }));
  a(r.open, 'il promemoria si apre al mattino');
  a(r.sel.length === 5 && r.sel.every(Boolean) && r.dis === 0, 'tutte e 5 spuntate, nessuna bloccata ' + JSON.stringify(r));
  a(/5 di 5/.test(r.sub) && !/fino a 3/.test(r.sub), 'niente limite di 3: ' + r.sub);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v36_promemoria.png' });
  // tolgo la spunta a due
  await page.click('#focus-lista input[data-item="i3"]'); await page.click('#focus-lista input[data-item="i4"]'); await page.waitForTimeout(150);
  r = await page.evaluate(() => $('focus-sub').textContent);
  a(/3 di 5/.test(r), 'tolte due: ' + r);
  await page.click('#focusOverlay [data-act="focus-conferma"]'); await page.waitForTimeout(800);
  const flag = db.tabelle.battle_plan_items.filter(i => i.in_focus).map(i => i.id).sort().join();
  a(flag === 'i0,i1,i2', 'salvate le 3 spuntate ' + flag);
  r = await page.evaluate(() => ({ stelle: [...document.querySelectorAll('#view .stella')].map(b => b.getAttribute('aria-pressed')), sotto: (document.querySelector('#view .v12-rosso .v12-testa p') || {}).textContent }));
  a(r.stelle.filter(x => x === 'true').length === 3 && r.stelle.filter(x => x === 'false').length === 2, 'stelline in Oggi: 3 accese, 2 spente ' + JSON.stringify(r.stelle));
  a(/porti a casa 3 · 0 fatte/.test(r.sotto || ''), 'il conto in Oggi: ' + r.sotto);
  // la stellina rimette una cosa tra quelle di oggi, anche oltre 3
  await page.evaluate(() => azioneStella('c3')); await page.waitForTimeout(600);
  a(db.tabelle.battle_plan_items.filter(i => i.in_focus).length === 4, 'con la stellina se ne aggiunge una quarta');
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
