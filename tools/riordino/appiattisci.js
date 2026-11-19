// Fase D: appiattisce la catena di una funzione in UNA funzione, scritta subito dopo l'istruzione di livello alto che
// contiene l'ultimo strato (stesso file di src/). La base e ogni strato diventano passi in sequenza: ogni passo riceve
// il risultato del precedente al posto della chiamata all'alias (`_x.apply(this, arguments)` → `r`).
// Si rifiuta se uno strato non ha la forma «prima istruzione = chiamata all'alias, alias usato solo lì».
// Uso (dalla radice, dopo node build.js): node tools/riordino/appiattisci.js . <funzione> [--prova]
const fs = require('fs'), path = require('path');
const [, , R0, NOME, OPZ] = process.argv; const R = path.resolve(R0);
const acorn = require(path.join(R, 'tools/mappa/node_modules/acorn'));
const walk = require(path.join(R, 'tools/mappa/node_modules/acorn-walk'));
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const ordine = fs.readFileSync(path.join(R, 'src/ordine.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const files = []; let pos = 0;
for (const f of ordine) { const t = fs.readFileSync(path.join(R, 'src', f), 'utf8'); files.push({ f, da: pos, a: pos + t.length, t }); pos += t.length; }
if (pos !== html.length) throw new Error('index.html non corrisponde a src/: lancia node build.js');
const tagS = html.lastIndexOf('\n<script>\n') + 10, tagF = html.lastIndexOf('\n</script>');
const src = html.slice(tagS, tagF);
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const righePrima = html.slice(0, tagS).split('\n').length - 1;
const L = n => n.loc.start.line + righePrima;
const testo = n => src.slice(n.start, n.end);
const genitore = new Map(); walk.fullAncestor(ast, (n, anc) => genitore.set(n, anc[anc.length - 2]));
const radiceDi = n => { let t = n; while (genitore.get(t) && genitore.get(t).type !== 'Program') t = genitore.get(t); return t; };
const errore = m => { throw new Error(`${NOME}: ${m}`); };

// base: dichiarazione function di livello alto
const basi = ast.body.filter(s => s.type === 'FunctionDeclaration' && s.id.name === NOME);
if (basi.length !== 1) errore(`attesa 1 dichiarazione function di livello alto, trovate ${basi.length}`);
const base = basi[0];
// alias: const _x = NOME   (ovunque); strati: NOME = function… / NOME = (function (orig) { return function… })(NOME)
const alias = []; const strati = [];
walk.fullAncestor(ast, (n, anc) => {
  if (n.type === 'VariableDeclaration' && n.declarations.length === 1 && n.declarations[0].init && n.declarations[0].init.type === 'Identifier' && n.declarations[0].init.name === NOME) alias.push({ nome: n.declarations[0].id.name, stmt: n });
  if (n.type === 'ExpressionStatement' && n.expression.type === 'AssignmentExpression' && n.expression.operator === '=' && n.expression.left.type === 'Identifier' && n.expression.left.name === NOME) strati.push({ stmt: n });
});
strati.sort((a, b) => a.stmt.start - b.stmt.start);
if (!strati.length) errore('nessuno strato');
const usiDi = (nome, dentro) => { const u = []; walk.full(dentro || ast, x => { if (x.type === 'Identifier' && x.name === nome) u.push(x); }); return u; };
const usaThisArgs = n => { let si = false; walk.full(n, x => { if (x.type === 'ThisExpression' || (x.type === 'Identifier' && x.name === 'arguments')) si = true; }); return si; };

// ogni strato: funzione, nome con cui chiama la versione precedente, prima istruzione
const passi = [];
for (const s of strati) {
  const r = s.stmt.expression.right;
  let fn, prec, extraIIFE = null;
  if (/Function/.test(r.type)) {
    fn = r;
    const visti = alias.filter(a => a.stmt.start < s.stmt.start && usiDi(a.nome, fn).length);
    if (visti.length !== 1) errore(`strato alla riga ${L(s.stmt)}: usa ${visti.length} alias`);
    prec = visti[0].nome;
  } else if (r.type === 'CallExpression' && r.callee.type === 'FunctionExpression' && r.arguments.length === 1 && r.arguments[0].name === NOME && r.callee.params.length === 1) {
    const corpo = r.callee.body.body;
    if (corpo.length !== 1 || corpo[0].type !== 'ReturnStatement' || !/Function/.test(corpo[0].argument.type)) errore(`IIFE alla riga ${L(s.stmt)}: attesa solo «return function…»`);
    fn = corpo[0].argument; prec = r.callee.params[0].name; extraIIFE = true;
  } else errore(`strato alla riga ${L(s.stmt)}: forma non gestita (${r.type})`);
  if (fn.type === 'ArrowFunctionExpression' && fn.body.type !== 'BlockStatement') errore(`strato alla riga ${L(s.stmt)}: freccia senza blocco`);
  const corpo = fn.body.body;
  const usi = usiDi(prec, fn.body);
  if (!corpo.length) errore(`strato alla riga ${L(s.stmt)}: corpo vuoto`);
  const prima = corpo[0];
  // la chiamata alla versione precedente: prec.apply(this, arguments) | prec(...arguments) | prec(<parametri nell'ordine>)
  let chiamata = null;
  walk.full(prima, x => { if (!chiamata && x.type === 'CallExpression' && ((x.callee.type === 'MemberExpression' && x.callee.object.name === prec && x.callee.property.name === 'apply' && x.arguments.length === 2 && x.arguments[0].type === 'ThisExpression' && x.arguments[1].name === 'arguments') || (x.callee.type === 'Identifier' && x.callee.name === prec && x.arguments.length === fn.params.length && x.arguments.every((a, i) => fn.params[i].type === 'Identifier' && a.type === 'Identifier' && a.name === fn.params[i].name)))) chiamata = x; });
  const inSequenza = !!chiamata && usi.length === 1 && (prima.type === 'ExpressionStatement' || prima.type === 'VariableDeclaration' || prima.type === 'ReturnStatement');
  const resto = corpo.slice(1);
  const restoTesto = resto.map(testo);
  // `this`/`arguments` fuori dalla chiamata: ammessi (la freccia li eredita dalla funzione finale, stessi valori)
  passi.push({ s, fn, prec, chiamata, prima, resto, extraIIFE, inSequenza, usi, commento: commentoSopra(s.stmt) || commentoSopra(radiceDi(s.stmt)) });
}
// gli alias devono essere usati solo dentro gli strati della catena
for (const a of alias) { const u = usiDi(a.nome).filter(x => !passi.some(p => x.start >= p.fn.start && x.end <= p.fn.end) && !(x.start >= a.stmt.start && x.end <= a.stmt.end)); if (u.length) errore(`alias ${a.nome} usato fuori dalla catena (riga ${u[0].loc.start.line + righePrima})`); }

function commentoSopra(n) {
  const righe = []; let p = src.lastIndexOf('\n', n.start - 1);
  while (p > 0) { const q = src.lastIndexOf('\n', p - 1); const riga = src.slice(q + 1, p); if (/^\s*\/\//.test(riga) && !/^\s*\/\/\s*[═─]{3}/.test(riga)) { righe.unshift(riga.trim()); p = q; } else break; }
  return righe.join('\n');
}

// testo della funzione finale
const asyncBase = base.async, gen = base.generator; if (gen) errore('generatore non gestito');
const parBase = base.params.map(testo).join(', ');
const rientra = (t, n) => t.split('\n').map(l => (l.length ? ' '.repeat(n) + l : l)).join('\n');
const tolgiRientro = (t, daPrima) => { const righe = t.split('\n'); const conta = daPrima ? righe : righe.slice(1); const m = Math.min(...conta.filter(l => l.trim()).map(l => l.match(/^ */)[0].length), 99); return righe.map((l, i) => (i === 0 && !daPrima ? l : l.slice(Math.min(m, l.match(/^ */)[0].length)))).join('\n'); };
let out = [];
const sequenza = passi.every(p => p.inSequenza);
const commentoPasso = p => (p.commento ? p.commento.split('\n').map(l => '  ' + l).join('\n') + '\n' : '') + `  // (era lo strato alla riga ${L(p.s.stmt)}: ${files.find(f => tagS + p.s.stmt.start >= f.da && tagS + p.s.stmt.start < f.a).f})`;
const commentoBase = `  // base (era alla riga ${L(base)}${commentoSopra(base) ? ' · ' + commentoSopra(base).split('\n')[0].replace(/^\/\/\s*/, '') : ''})`;
const nomiUsati = new Set(); [base, ...passi.map(p => p.fn)].forEach(f => walk.full(f, x => { if (x.type === 'Identifier') nomiUsati.add(x.name); }));
const ACC = ['r', 'ris', 'risultato', 'prec', 'valore', 'esito'].find(n => !nomiUsati.has(n));
if (!ACC) errore('nessun nome libero per il risultato dei passi');
if (sequenza) {
  out.push(`// ${NOME}: catena appiattita nella fase D del riordino (base + ${passi.length} strati, ordine di esecuzione invariato).`);
  out.push(`// Ogni passo riceve in \`${ACC}\` il risultato del passo prima (era la chiamata alla versione precedente).`);
  out.push(`function ${NOME}(${parBase}) {   // restituisce quello che restituiva lo strato più esterno (una promessa se era async)`);
  const corpoBase = tolgiRientro(testo(base.body).slice(1, -1).replace(/^\n/, '').replace(/\n\s*$/, ''), true);
  out.push(commentoBase);
  out.push(`  let ${ACC} = (${base.async ? 'async ' : ''}(${parBase}) => {\n${rientra(corpoBase, 4)}\n  })(...arguments);`);
  for (const p of passi) {
    const parP = p.fn.params.map(testo).join(', ');
    const primaTesto = src.slice(p.prima.start, p.chiamata.start) + ACC + src.slice(p.chiamata.end, p.prima.end);
    const corpo = [primaTesto, ...p.resto.map(testo)].join('\n');
    out.push(commentoPasso(p));
    out.push(`  ${ACC} = (${p.fn.async ? 'async ' : ''}(${parP}) => {\n${rientra(tolgiRientro(corpo), 4)}\n  })(...arguments);`);
  }
  out.push(`  return ${ACC};`);
} else {
  // forma annidata: ogni strato resta una funzione che chiama la precedente per nome (passo0 = base)
  const ultimo = passi[passi.length - 1].fn;
  out.push(`// ${NOME}: catena appiattita nella fase D del riordino (base + ${passi.length} strati, ordine di esecuzione invariato).`);
  out.push(`// Forma annidata: alcuni strati fanno qualcosa prima di chiamare la versione precedente, quindi ogni strato`);
  out.push(`// resta una funzione interna (passo0 = base, passo1, …) che chiama la precedente per nome.`);
  out.push(`function ${NOME}(${ultimo.params.map(testo).join(', ')}) {   // restituisce quello che restituisce lo strato più esterno`);
  out.push(commentoBase);
  const tb = testo(base); const intest = tb.slice(0, tb.indexOf('(')).replace(new RegExp('\\s' + NOME + '\\s*$'), ' ');
  out.push(`  const passo0 = ${rientra(tolgiRientro(intest.trim() + ' ' + tb.slice(tb.indexOf('('))), 2).trimStart()};`);
  passi.forEach((p, k) => {
    let t = testo(p.fn); const off0 = p.fn.start;
    for (const u of [...p.usi].sort((x, y) => y.start - x.start)) t = t.slice(0, u.start - off0) + 'passo' + k + t.slice(u.end - off0);
    out.push(commentoPasso(p));
    out.push(`  const passo${k + 1} = ${rientra(tolgiRientro(t), 2).trimStart()};`);
  });
  out.push(`  return passo${passi.length}.apply(this, arguments);`);
}
out.push('}');
const finale = out.join('\n') + '\n';

// modifiche: togli base, strati (con il loro commento sopra) e alias; inserisci la finale dopo la radice dell'ultimo strato
const togli = [base, ...passi.map(p => p.s.stmt), ...alias.map(a => a.stmt)];
const modifiche = [];
for (const n of togli) {
  let a = tagS + n.start, b = tagS + n.end;
  const iniz = html.lastIndexOf('\n', a - 1) + 1, fineR = html.indexOf('\n', b);
  if (/^[ \t]*$/.test(html.slice(iniz, a)) && /^[ \t;]*$/.test(html.slice(b, fineR))) { a = iniz; b = fineR + 1; }
  modifiche.push({ a, b, testo: '' });
}
const ultima = radiceDi(passi[passi.length - 1].s.stmt);
const dopo = html.indexOf('\n', tagS + ultima.end) + 1;
modifiche.push({ a: dopo, b: dopo, testo: finale });
modifiche.sort((x, y) => x.a - y.a || (x.testo ? 1 : -1));
for (let i = 1; i < modifiche.length; i++) if (modifiche[i].a < modifiche[i - 1].b) errore('modifiche sovrapposte');
if (OPZ === '--prova') { console.log(finale); process.exit(0); }
const perFile = new Map();
for (const x of modifiche) { const f = files.find(f => x.a >= f.da && x.a <= f.a && (x.b <= f.a)); if (!f) errore('modifica a cavallo di due file'); (perFile.get(f) || perFile.set(f, []).get(f)).push(x); }
for (const [f, xs] of perFile) { let t = f.t; for (const x of xs.sort((p, q) => q.a - p.a || (p.testo ? -1 : 1))) t = t.slice(0, x.a - f.da) + x.testo + t.slice(x.b - f.da); fs.writeFileSync(path.join(R, 'src', f.f), t); }
console.log(`${NOME}: base + ${passi.length} strati → 1 funzione in ${files.find(f => dopo >= f.da && dopo <= f.a).f}; tolti ${alias.length} alias; ${perFile.size} file toccati`);
