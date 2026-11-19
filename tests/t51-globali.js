// Riordino · rete di sicurezza 1: i nomi globali dopo l'avvio devono restare quelli del riferimento (v50).
// Nomi = proprietà aggiunte a window + dichiarazioni di livello alto dello script (function/const/let/var/class
// a colonna 0, che con let/const non finiscono su window), ciascuno con il suo typeof.
// AGGIORNA=1 node t51-globali.js → riscrive il riferimento (solo quando togliere o aggiungere un nome è voluto).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const RIF = path.join(__dirname, 'riferimento', 'globali.json');
const ORA = '2026-11-19T08:30:00+01:00';

function nomiDichiarati() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const inizio = html.lastIndexOf('\n<script>\n'), fine = html.lastIndexOf('\n</script>');
  const re = /^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/;
  const nomi = new Set();
  for (const riga of html.slice(inizio, fine).split('\n')) { const m = riga.match(re); if (m) nomi.add(m[1] || m[2]); }
  return [...nomi];
}

(async () => {
  const vuoto = await chromium.launch();
  const base = await (await vuoto.newPage()).evaluate(() => Object.getOwnPropertyNames(window));
  await vuoto.close();

  const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, seed: {}, attesa: 3000 });
  const attuale = await page.evaluate(([base, dichiarati]) => {
    const tipo = n => { try { return new Function(`return typeof ${n}`)(); } catch (e) { return 'tdz'; } };
    const nomi = new Set([...Object.getOwnPropertyNames(window).filter(n => !base.includes(n)), ...dichiarati]);
    return [...nomi].sort().map(n => `${n}: ${tipo(n)}`);
  }, [base, nomiDichiarati()]);
  await browser.close();

  if (process.env.AGGIORNA === '1' || !fs.existsSync(RIF)) {
    fs.mkdirSync(path.dirname(RIF), { recursive: true });
    fs.writeFileSync(RIF, JSON.stringify(attuale, null, 1) + '\n');
    console.log(`riferimento scritto: ${attuale.length} nomi`);
  }
  const rif = JSON.parse(fs.readFileSync(RIF, 'utf8'));
  const tolti = rif.filter(x => !attuale.includes(x)), aggiunti = attuale.filter(x => !rif.includes(x));
  a(!tolti.length, `nessun nome globale tolto o cambiato di tipo (${tolti.length}): ${tolti.slice(0, 20).join(', ')}`);
  a(!aggiunti.length, `nessun nome globale nuovo (${aggiunti.length}): ${aggiunti.slice(0, 20).join(', ')}`);
  console.log(`nomi globali: ${attuale.length} (riferimento ${rif.length})`);
  { const e = errori(logs); a(!e.length, 'console pulita ' + JSON.stringify(e.slice(0, 3))); }
})().catch(e => { console.log('FAIL errore', e.message); process.exitCode = 1; });
