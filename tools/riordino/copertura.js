// Verifica che i pezzi di candidati.json non vengano eseguiti all'avvio (copertura V8, computer e telefono, 4 schede).
// Uso: cd tests && NM="$PWD/node_modules" node ../tools/riordino/copertura.js .. $TMPDIR/candidati.json
const fs = require('fs'), path = require('path');
const [, , R, CAND] = process.argv;
const pw = require(path.resolve(R, 'tests/node_modules/playwright'));
const coperture = [];
const lancia = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...x) => {
  const b = await lancia(...x); const nc = b.newContext.bind(b);
  b.newContext = async (...y) => { const c = await nc(...y); const np = c.newPage.bind(c);
    c.newPage = async () => { const p = await np(); await p.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true }); coperture.push(p); return p; };
    return c; };
  return b;
};
const { apriApp } = require(path.resolve(R, 'tests/harness'));
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const righe = html.split('\n');
const iS = righe.findIndex((l, i) => l === '<script>' && i > 3000);
const inizioScript = righe.slice(0, iS).join('\n').length + 1 + '<script>'.length; // offset nel file del testo dello script
const offRiga = r => righe.slice(0, r - 1).join('\n').length + (r > 1 ? 1 : 0) - inizioScript; // offset nello script dell'inizio della riga r
const c = JSON.parse(fs.readFileSync(CAND, 'utf8'));
const pezzi = [];
const intervallo = (s, etichetta) => { const [a, b] = s.split(' ')[0].split('-').map(Number); pezzi.push({ etichetta, a, b, da: offRiga(a), al: offRiga(b + 1) }); };
c.funzioniMorte.forEach(f => f.righe.forEach(s => intervallo(s, 'morta ' + f.nome)));
c.sostituzioni.forEach(s => { s.base.forEach(x => intervallo(x, 'base ' + s.funzione)); s.stratiPrima.forEach(x => intervallo(x, 'strato ' + s.funzione)); });
(async () => {
  const eseguiti = new Map();
  for (const opz of [{ viewport: { width: 1440, height: 900 } }, { mobile: true }]) {
    const { browser, page } = await apriApp({ ...opz, ora: '2026-11-19T08:30:00+01:00', seed: {}, attesa: 4000 });
    for (const v of ['oggi', 'pianifica', 'tutto', 'altro']) { await page.evaluate(t => { ui.tab = t; ui.sub = null; render(); }, v); await page.waitForTimeout(400); }
    const cov = await page.coverage.stopJSCoverage();
    const voce = cov.find(e => e.source && e.source.length > 1000000);
    if (!voce) throw new Error('script principale non trovato nella copertura');
    for (const fn of voce.functions) {
      const r = fn.ranges[0]; if (!r || !r.count) continue;
      for (const p of pezzi) if (r.startOffset >= p.da && r.startOffset < p.al) eseguiti.set(p.etichetta + ` (${p.a}-${p.b})`, (eseguiti.get(p.etichetta) || 0) + r.count);
    }
    await browser.close();
  }
  console.log(`pezzi controllati: ${pezzi.length}; eseguiti all'avvio e nelle 4 schede: ${eseguiti.size}`);
  for (const [k, v] of eseguiti) console.log('  ESEGUITO', k, '×' + v);
})().catch(e => { console.error(e); process.exit(1); });
