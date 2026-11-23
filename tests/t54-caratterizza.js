// Riordino · rete di sicurezza 3 (caratterizzazione, prima della fase D): fissa quello che fanno oggi
// - l'anteprima del «+» mentre si scrive (#rapido-anteprima, computer) e del campo «Cosa hai in testa?» (#cattura-anteprima, telefono);
// - le righe che il campo «Cosa hai in testa?» salva (campi stabili, senza id né orari).
// Copre disegnaAnteprima, disegnaAnteprimaCattura e salvaCattura, che t52 non vede.
// AGGIORNA=1 node t54-caratterizza.js → riscrive il riferimento (solo per un cambiamento voluto).
const fs = require('fs'), path = require('path');
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const RIF = path.join(__dirname, 'riferimento', 'caratterizza.json');
const ORA = '2026-11-19T08:30:00+01:00';
const ora = new Date(ORA).toISOString();
const seed = {
  persone: [{ id: 'pn', nome: 'Nicco', ctx: 'lavoro' }],
  cicli: [{ id: 'k1', title: 'Report soci', q: 1, ctx: 'lavoro', cat: 'management', macro_area: 'Vendite', done: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [] }]
};
const TESTO_RAPIDO = 'Chiamare il commercialista domani alle 10\nSpesa:\n- latte\n- pane\nSubito: mandare il preventivo a Rossi\nNicco deve sistemare il contratto entro venerdì';
const TESTO_CATTURA = 'Prenotare la sala riunioni lunedì alle 15';
const CAMPI = ['title', 'q', 'ctx', 'cat', 'macro_area', 'pianificato_data', 'scheduled_date', 'scheduled_time', 'durata_minuti', 'delega_persona_id', 'delega_controllo', 'done', 'parcheggiato'];
const stabile = c => Object.fromEntries(CAMPI.map(k => [k, c[k] === undefined ? null : c[k]]).concat([['passo', !!c.parent_id]]));

(async () => {
  const attuale = {};
  // computer: «+» e la sua anteprima
  let { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, seed, attesa: 3000 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); apriRapido(); }); await page.waitForTimeout(400);
  await page.fill('#rapido-testo', TESTO_RAPIDO); await page.waitForTimeout(600);
  attuale.rapido = await page.evaluate(() => ({ hidden: $('rapido-anteprima').hidden, html: $('rapido-anteprima').innerHTML }));
  { const e = errori(logs); a(!e.length, 'computer: console pulita ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  // telefono: campo «Cosa hai in testa?», anteprima e salvataggio
  let db;
  ({ browser, page, logs, db } = await apriApp({ mobile: true, ora: ORA, seed, attesa: 3000 }));
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); $('main').scrollTop = 0; }); await page.waitForTimeout(400);
  await page.click('.v32-piu'); await page.waitForTimeout(300);
  await page.fill('#cattura-testo', TESTO_CATTURA); await page.waitForTimeout(600);
  attuale.cattura = await page.evaluate(() => ({ hidden: $('cattura-anteprima').hidden, html: $('cattura-anteprima').innerHTML }));
  const prima = new Set(db.tabelle.cicli.map(c => c.id));
  await page.press('#cattura-testo', 'Enter'); await page.waitForTimeout(1500);
  attuale.salvate = db.tabelle.cicli.filter(c => !prima.has(c.id)).map(stabile).sort((x, y) => String(x.title).localeCompare(String(y.title)));
  attuale.dopo = await page.evaluate(() => ({ campo: $('cattura-testo').value, aperto: document.body.classList.contains('v32-cat') }));
  { const e = errori(logs); a(!e.length, 'telefono: console pulita ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();

  if (process.env.AGGIORNA === '1' || !fs.existsSync(RIF)) { fs.mkdirSync(path.dirname(RIF), { recursive: true }); fs.writeFileSync(RIF, JSON.stringify(attuale, null, 1) + '\n'); console.log('riferimento scritto'); }
  const rif = JSON.parse(fs.readFileSync(RIF, 'utf8'));
  for (const k of ['rapido', 'cattura', 'salvate', 'dopo']) {
    const x = JSON.stringify(rif[k]), y = JSON.stringify(attuale[k]);
    a(x === y, `${k} uguale al riferimento` + (x === y ? '' : `: atteso ${x.slice(0, 300)} … ottenuto ${y.slice(0, 300)}`));
  }
  a(attuale.salvate.length >= 1 && attuale.rapido.html.length > 100 && attuale.cattura.html.length > 50, `controllo che la prova misuri qualcosa: ${attuale.salvate.length} salvate, anteprime ${attuale.rapido.html.length}/${attuale.cattura.html.length} caratteri`);
})().catch(e => { console.log('FAIL errore', e.message); process.exitCode = 1; });
