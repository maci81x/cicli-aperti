// Valori calcolati di tutte le variabili --x sulla radice negli 8 stati della radice (fase E).
// Uso: node tools/riordino/variabili.js . $TMPDIR/var_prima.json; dopo la modifica di nuovo in var_dopo.json e confronto con diff (playwright da tests/node_modules)
const fs = require('fs'), path = require('path');
const [, , R, OUTF] = process.argv;
const { chromium } = require(path.resolve(R, 'tests/node_modules/playwright'));
const url = 'file://' + path.resolve(R, 'index.html');
// 8 stati: data-theme è sempre impostato dallo script in testa (light | dark) × contrasto alto sì/no × tema del sistema
const STATI = [];
for (const tema of ['light', 'dark']) for (const alto of [false, true]) for (const schema of ['light', 'dark'])
  STATI.push({ nome: `${tema === 'dark' ? 'scuro' : 'chiaro'}${alto ? '-alto' : ''}-sistema-${schema === 'dark' ? 'scuro' : 'chiaro'}`, tema, alto, schema });
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const s of STATI) {
    const ctx = await b.newContext({ colorScheme: s.schema });
    const p = await ctx.newPage();
    await p.route(/^https?:/, r => r.abort()); // niente rete: interessa solo il CSS
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    out[s.nome] = await p.evaluate(s => {
      const h = document.documentElement;
      if (s.tema) h.setAttribute('data-theme', s.tema); else h.removeAttribute('data-theme');
      if (s.alto) h.setAttribute('data-contrast', 'alto'); else h.removeAttribute('data-contrast');
      const nomi = new Set();
      for (const sh of document.styleSheets) { let rr; try { rr = sh.cssRules; } catch (e) { continue; }
        const visita = l => { for (const r of l) { if (r.style) for (const n of r.style) if (n.startsWith('--')) nomi.add(n); if (r.cssRules) visita(r.cssRules); } }; visita(rr); }
      const cs = getComputedStyle(h);
      return Object.fromEntries([...nomi].sort().map(n => [n, cs.getPropertyValue(n).trim()]));
    }, s);
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(OUTF, JSON.stringify(out, null, 1));
  console.log(Object.entries(out).map(([k, v]) => `${k}: ${Object.keys(v).length} variabili`).join(' · '));
})();
