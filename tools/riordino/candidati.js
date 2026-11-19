// Candidati al codice morto JS (funzioni mai chiamate, catene mai chiamate, strati sostituiti) con le verifiche statiche.
// Uso (dalla radice): node tools/riordino/candidati.js . > $TMPDIR/candidati.json   (acorn da tools/mappa/node_modules)
const fs = require('fs'), path = require('path');
const R = process.argv[2];
const acorn = require(path.resolve(R, 'tools/mappa/node_modules/acorn'));
const walk = require(path.resolve(R, 'tools/mappa/node_modules/acorn-walk'));
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const righe = html.split('\n');

// mappa riga di index.html → file di src/ e riga
const ordine = fs.readFileSync(path.join(R, 'src/ordine.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const mappa = []; let r0 = 1;
for (const f of ordine) { const n = fs.readFileSync(path.join(R, 'src', f), 'utf8').split('\n').length - 1; mappa.push({ f, da: r0, a: r0 + n - 1 }); r0 += n; }
const dove = r => { const m = mappa.find(x => r >= x.da && r <= x.a); return m ? `${m.f}:${r - m.da + 1}` : '?'; };

const iS = righe.findIndex((l, i) => l === '<script>' && i > 3000), fS = righe.findIndex((l, i) => i > iS && l === '</script>');
const js = righe.slice(iS + 1, fS).join('\n'); const off = iS + 1;
const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const L = n => n.loc.start.line + off, LE = n => n.loc.end.line + off;

// dichiarazioni di livello alto
const decl = {};
for (const s of ast.body) {
  if (s.type === 'FunctionDeclaration') (decl[s.id.name] ||= []).push({ node: s, da: L(s), a: LE(s) });
  if (s.type === 'VariableDeclaration' && s.declarations.length === 1) { const d = s.declarations[0]; if (d.id.type === 'Identifier') (decl[d.id.name] ||= []).push({ node: s, da: L(s), a: LE(s), init: d.init }); }
}
// riferimenti a ogni identificatore (escluse le dichiarazioni), con «al caricamento» = fuori da ogni funzione
const rif = {};
walk.fullAncestor(ast, (n, anc) => {
  if (n.type !== 'Identifier') return;
  const p = anc[anc.length - 2];
  if (p && (p.type === 'FunctionDeclaration' || p.type === 'FunctionExpression') && p.id === n) return;
  if (p && p.type === 'VariableDeclarator' && p.id === n) return;
  if (p && p.type === 'MemberExpression' && p.property === n && !p.computed && !(p.object.type === 'Identifier' && p.object.name === 'window')) return;
  if (p && p.type === 'Property' && p.key === n && !p.shorthand) return;
  const inFunzione = anc.slice(0, -1).some(x => /Function/.test(x.type));
  const assegnato = p && p.type === 'AssignmentExpression' && p.left === n;
  (rif[n.name] ||= []).push({ r: L(n), caricamento: !inFunzione, assegnato, chiamata: p && p.type === 'CallExpression' && p.callee === n });
});
const fuoriJs = righe.slice(0, iS).join('\n') + righe.slice(fS).join('\n');
const stringhe = []; walk.full(ast, n => { if (n.type === 'Literal' && typeof n.value === 'string') stringhe.push(n.value); if (n.type === 'TemplateElement') stringhe.push(n.value.raw); });
const testoStr = fuoriJs + '\n' + stringhe.join('\n');
const inStringhe = nome => new RegExp('(^|[^\\w$])' + nome.replace(/\$/g, '\\$') + '($|[^\\w$])').test(testoStr);

// 1. funzioni mai chiamate (punto fisso: anche quelle usate solo da funzioni morte)
const funz = Object.keys(decl).filter(n => decl[n].some(d => d.node.type === 'FunctionDeclaration' || (d.init && /Function/.test(d.init.type))));
const dentro = (r, intervalli) => intervalli.some(([a, b]) => r >= a && r <= b);
let morte = new Set(), cambiato = true; const catenaMorta = [];
while (cambiato) {
  cambiato = false;
  const intervalli = [...morte].flatMap(n => decl[n].map(d => [d.da, d.a]));
  for (const n of funz) {
    if (morte.has(n)) continue;
    const vivi = (rif[n] || []).filter(x => !x.assegnato && !dentro(x.r, intervalli) && !dentro(x.r, decl[n].map(d => [d.da, d.a])));
    if (!vivi.length && !inStringhe(n)) { morte.add(n); cambiato = true; }
  }
}
// 1b. catene mai chiamate: gli unici riferimenti sono i propri alias (const _x = f) e le riassegnazioni f = …
const aliasDi = {}; walk.full(ast, n => { if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && n.init.type === 'Identifier') (aliasDi[n.init.name] ||= []).push({ alias: n.id.name, r: L(n) }); });
for (const n of funz) {
  if (morte.has(n)) continue;
  const al = aliasDi[n] || [];
  const righeAlias = al.map(a => a.r);
  const vivi = (rif[n] || []).filter(x => !x.assegnato && !righeAlias.includes(x.r) && !dentro(x.r, decl[n].map(d => [d.da, d.a])));
  if (vivi.length || inStringhe(n) || !al.length) continue;
  // gli alias devono essere usati solo dentro le riassegnazioni di n
  catenaMorta.push(n);
}
const funzioniMorte = [...morte].map(n => ({ nome: n, righe: decl[n].map(d => `${d.da}-${d.a}`), src: decl[n].map(d => dove(d.da)), assegnazioni: (rif[n] || []).filter(x => x.assegnato).map(x => x.r) }));

// 2. strati che sostituiscono: base + strati precedenti morti se nessuno li richiama
const alias = {}; // nomeAlias -> { target, riga }
for (const s of ast.body.concat(...[])) {}
walk.full(ast, n => {
  if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && n.init.type === 'Identifier' && funz.includes(n.init.name)) alias[n.id.name] = { target: n.init.name, r: L(n) };
});
const riass = []; // { target, r, nodo, chiamaPrecedente }
walk.fullAncestor(ast, (n, anc) => {
  if (n.type !== 'AssignmentExpression' || n.operator !== '=' || n.left.type !== 'Identifier' || !funz.includes(n.left.name)) return;
  if (!/Function|CallExpression/.test(n.right.type)) return;
  const usa = new Set(); walk.full(n.right, x => { if (x.type === 'Identifier') usa.add(x.name); });
  const chiama = Object.entries(alias).filter(([a, v]) => v.target === n.left.name && usa.has(a)).map(([a]) => a);
  const deco = n.right.type === 'CallExpression' && n.right.arguments.some(x => x.type === 'Identifier' && x.name === n.left.name);
  const stmt = [...anc].reverse().find(x => x.type === 'ExpressionStatement');
  riass.push({ target: n.left.name, r: L(n), da: L(stmt || n), a: LE(stmt || n), avvolge: chiama.length > 0 || deco, alias: chiama });
});
const sostituzioni = [];
for (const f of new Set(riass.map(x => x.target))) {
  const strati = riass.filter(x => x.target === f).sort((x, y) => x.r - y.r);
  const k = strati.map(x => x.avvolge).lastIndexOf(false);
  if (k < 0) continue;
  const sost = strati[k], prima = strati.slice(0, k);
  const aliasPrima = Object.entries(alias).filter(([a, v]) => v.target === f && v.r < sost.r).map(([a, v]) => ({ alias: a, r: v.r }));
  const pezzi = [...decl[f].map(d => [d.da, d.a]), ...prima.map(x => [x.da, x.a])];
  const aliasUsati = aliasPrima.filter(x => (rif[x.alias] || []).some(u => !dentro(u.r, pezzi) && u.r !== x.r));
  const caricamentoPrima = (rif[f] || []).filter(u => u.caricamento && !u.assegnato && u.r < sost.r);
  sostituzioni.push({ funzione: f, sostituitaA: sost.r, srcSost: dove(sost.r), base: decl[f].map(d => `${d.da}-${d.a} ${dove(d.da)}`), stratiPrima: prima.map(x => `${x.da}-${x.a} ${dove(x.da)}`), aliasPrima: aliasPrima.map(x => x.alias), aliasUsatiAltrove: aliasUsati.map(x => x.alias), usiAlCaricamentoPrima: caricamentoPrima.map(u => u.r) });
}
console.log(JSON.stringify({ funzioniMorte, catenaMorta: catenaMorta.map(n => ({ nome: n, alias: (aliasDi[n] || []).map(a => a.alias), righe: decl[n].map(d => `${d.da}-${d.a}`), src: decl[n].map(d => dove(d.da)) })), sostituzioni }, null, 1));
