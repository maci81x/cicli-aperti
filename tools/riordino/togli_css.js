// Toglie da src/css/ i selettori morti o le variabili coperte elencati da css_candidati.js (postcss: le parti non toccate restano uguali).
// Uso (dalla radice, dopo node build.js): node tools/riordino/togli_css.js . $TMPDIR/css.json selettori|variabili
const fs = require('fs'), path = require('path');
const [, , R, CJ, MODO] = process.argv;
const postcss = require(path.resolve(R, 'tools/mappa/node_modules/postcss'));
const c = JSON.parse(fs.readFileSync(CJ, 'utf8'));
const ordine = fs.readFileSync(path.join(R, 'src/ordine.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const mappa = []; let r0 = 1;
for (const f of ordine) { const n = fs.readFileSync(path.join(R, 'src', f), 'utf8').split('\n').length - 1; mappa.push({ f, da: r0, a: r0 + n - 1 }); r0 += n; }
const dove = r => { const m = mappa.find(x => r >= x.da && r <= x.a); return { f: m.f, r: r - m.da + 1 }; };
const norm = s => s.replace(/\s+/g, ' ').trim();

const lavori = new Map(); // file -> [{ riga, ... }]
if (MODO === 'selettori') for (const x of c.selettoriMorti) { const d = dove(x.riga); (lavori.get(d.f) || lavori.set(d.f, []).get(d.f)).push({ r: d.r, sel: x.morti.map(m => norm(m.sel)) }); }
else if (MODO === 'variabili') for (const x of c.dettaglio) { const d = dove(x.riga); (lavori.get(d.f) || lavori.set(d.f, []).get(d.f)).push({ r: d.r, prop: x.prop, sel: x.sel }); }
else throw new Error('modo: selettori | variabili');

let fatti = 0, regoleTolte = 0;
for (const [f, xs] of lavori) {
  const p = path.join(R, 'src', f), root = postcss.parse(fs.readFileSync(p, 'utf8'));
  for (const x of xs) {
    if (MODO === 'selettori') {
      let trovata = null; root.walkRules(r => { if (r.source.start.line === x.r && x.sel.every(s => r.selectors.map(norm).includes(s))) trovata = r; });
      if (!trovata) throw new Error(`${f}:${x.r} regola non trovata (${x.sel.join(' | ')})`);
      const restano = trovata.selectors.filter(s => !x.sel.includes(norm(s)));
      if (restano.length) trovata.selectors = restano; else { trovata.remove(); regoleTolte++; }
      fatti += x.sel.length;
    } else {
      let trovata = null; root.walkDecls(d => { if (d.source.start.line === x.r && d.prop === x.prop && norm(d.parent.selectors.join(', ')) === norm(x.sel)) trovata = d; });
      if (!trovata) throw new Error(`${f}:${x.r} dichiarazione non trovata (${x.prop} in ${x.sel})`);
      const regola = trovata.parent; trovata.remove(); fatti++;
      if (!regola.nodes.some(n => n.type === 'decl')) { regola.remove(); regoleTolte++; }
    }
  }
  let testo = root.toString();
  if (!testo.endsWith('\n')) testo += '\n';
  fs.writeFileSync(p, testo);
}
console.log(`${MODO}: tolti ${fatti} elementi, ${regoleTolte} regole rimaste vuote tolte, in ${lavori.size} file`);
