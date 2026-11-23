// Fase D: appiattisce la catena di una funzione (base `function f` + strati `const _x = f; f = function () { … _x() … }`)
// in UNA funzione, scritta subito dopo l'istruzione di livello alto che contiene l'ultimo strato (stesso file di src/).
// Due forme, scelte da sole:
// - sequenza: se in ogni strato la prima istruzione È la chiamata alla versione precedente (`_x.apply(this, arguments)`,
//   `_x(...arguments)` o `_x(<parametri>)`, eventualmente con `await`, come espressione, valore di `const/let` o `return`)
//   e l'alias non compare altrove nello strato: base e strati diventano frecce eseguite una dopo l'altra, ognuna riceve
//   in un accumulatore il risultato della precedente;
// - annidata: altrimenti ogni strato resta una funzione interna (passo0 = base, passo1, …) che chiama la precedente per nome.
// Si ferma (uscita 1) se: base non unica, uno strato non sta a livello alto o in un blocco `{ }` di livello alto, uno strato
// non usa esattamente un alias, un alias è letto fuori dalla catena, un nome scelto copre un nome usato dagli strati.
// Toglie base, strati, alias, i commenti attaccati sopra (copiati nella funzione) e i blocchi `{ }` rimasti vuoti.
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
const fileDi = n => files.find(f => tagS + n.start >= f.da && tagS + n.start < f.a).f;
const dove = n => `${fileDi(n)} (riga ${L(n)} di index.html)`;
// solo livello alto o blocchi { } di livello alto: niente if, funzioni, cicli in mezzo
const aLivelloAlto = n => { for (let t = genitore.get(n); t && t.type !== 'Program'; t = genitore.get(t)) if (t.type !== 'BlockStatement' || (genitore.get(t) && genitore.get(t).type !== 'Program' && genitore.get(t).type !== 'BlockStatement')) return false; return true; };

// base: dichiarazione function di livello alto
const basi = ast.body.filter(s => s.type === 'FunctionDeclaration' && s.id.name === NOME);
if (basi.length !== 1) errore(`attesa 1 dichiarazione function di livello alto, trovate ${basi.length}`);
const base = basi[0];
// alias: const _x = NOME   (ovunque); strati: NOME = function… / NOME = (function (orig) { return function… })(NOME)
const alias = []; const strati = [];
walk.fullAncestor(ast, n => {
  if (n.type === 'VariableDeclaration' && n.declarations.length === 1 && n.declarations[0].init && n.declarations[0].init.type === 'Identifier' && n.declarations[0].init.name === NOME) alias.push({ nome: n.declarations[0].id.name, stmt: n });
  if (n.type === 'ExpressionStatement' && n.expression.type === 'AssignmentExpression' && n.expression.operator === '=' && n.expression.left.type === 'Identifier' && n.expression.left.name === NOME) strati.push({ stmt: n });
});
strati.sort((a, b) => a.stmt.start - b.stmt.start);
if (!strati.length) errore('nessuno strato');
for (const x of [...strati, ...alias]) if (!aLivelloAlto(x.stmt)) errore(`${dove(x.stmt)}: non sta a livello alto né in un blocco { } di livello alto (diventerebbe incondizionato)`);
const usiDi = (nome, dentro) => { const u = []; walk.full(dentro || ast, x => { if (x.type === 'Identifier' && x.name === nome) u.push(x); }); return u; };
const usaThisArgs = n => { let si = false; walk.full(n, x => { if (x.type === 'ThisExpression' || (x.type === 'Identifier' && x.name === 'arguments')) si = true; }); return si; };
const senzaAwait = e => (e && e.type === 'AwaitExpression' ? e.argument : e);

function commentoSopra(n) {
  const righe = []; let p = src.lastIndexOf('\n', n.start - 1);
  while (p > 0) { const q = src.lastIndexOf('\n', p - 1); const riga = src.slice(q + 1, p); if (/^\s*\/\//.test(riga) && !/^\s*\/\/\s*[═─]{3}/.test(riga)) { righe.unshift(riga.trim()); p = q; } else break; }
  return { testo: righe.join('\n'), da: p + 1 };   // da: inizio della prima riga di commento (posizione in src)
}

// ogni strato: funzione, nome con cui chiama la versione precedente, prima istruzione
const passi = [];
for (const s of strati) {
  const r = s.stmt.expression.right;
  let fn, prec, aliasStmt = null;
  if (/Function/.test(r.type)) {
    fn = r;
    const visti = alias.filter(a => a.stmt.start < s.stmt.start && usiDi(a.nome, fn).length);
    if (visti.length !== 1) errore(`strato in ${dove(s.stmt)}: usa ${visti.length} alias`);
    prec = visti[0].nome; aliasStmt = visti[0].stmt;
  } else if (r.type === 'CallExpression' && r.callee.type === 'FunctionExpression' && r.arguments.length === 1 && r.arguments[0].name === NOME && r.callee.params.length === 1) {
    const corpo = r.callee.body.body;
    if (corpo.length !== 1 || corpo[0].type !== 'ReturnStatement' || !/Function/.test(corpo[0].argument.type)) errore(`IIFE in ${dove(s.stmt)}: attesa solo «return function…»`);
    fn = corpo[0].argument; prec = r.callee.params[0].name;
    if (usiDi(prec, fn.body).length === 0) errore(`IIFE in ${dove(s.stmt)}: non chiama la versione precedente`);
  } else errore(`strato in ${dove(s.stmt)}: forma non gestita (${r.type})`);
  if (fn.type === 'ArrowFunctionExpression' && fn.body.type !== 'BlockStatement') errore(`strato in ${dove(s.stmt)}: freccia senza blocco`);
  const corpo = fn.body.body;
  const usi = usiDi(prec, fn.body);
  if (!corpo.length) errore(`strato in ${dove(s.stmt)}: corpo vuoto`);
  const prima = corpo[0];
  // la chiamata alla versione precedente, e deve essere ESATTAMENTE la prima istruzione (non dentro ?:, ||, frecce …)
  const eChiamata = x => x && x.type === 'CallExpression' && (
    (x.callee.type === 'MemberExpression' && x.callee.object.name === prec && x.callee.property.name === 'apply' && x.arguments.length === 2 && x.arguments[0].type === 'ThisExpression' && x.arguments[1].name === 'arguments') ||
    (x.callee.type === 'Identifier' && x.callee.name === prec && x.arguments.length === 1 && x.arguments[0].type === 'SpreadElement' && x.arguments[0].argument.name === 'arguments') ||
    (x.callee.type === 'Identifier' && x.callee.name === prec && x.arguments.length === fn.params.length && x.arguments.every((a, i) => fn.params[i].type === 'Identifier' && a.type === 'Identifier' && a.name === fn.params[i].name)));
  const candidata = prima.type === 'ExpressionStatement' ? senzaAwait(prima.expression)
    : prima.type === 'VariableDeclaration' && prima.declarations.length === 1 ? senzaAwait(prima.declarations[0].init)
    : prima.type === 'ReturnStatement' ? senzaAwait(prima.argument) : null;
  const chiamata = eChiamata(candidata) ? candidata : null;
  const perNome = !!chiamata && chiamata.callee.type === 'Identifier' && chiamata.arguments[0] && chiamata.arguments[0].type !== 'SpreadElement';
  passi.push({ s, fn, prec, aliasStmt, chiamata, prima, perNome, usi, inSequenza: !!chiamata && usi.length === 1 });
}
// `_x(a, b)`: in sequenza il passo prima riceverebbe `this` e tutti gli `arguments` della funzione finale; va bene solo se non li usa
passi.forEach((p, k) => { if (p.inSequenza && p.perNome && usaThisArgs(k === 0 ? base.body : passi[k - 1].fn.body)) p.inSequenza = false; });
// gli alias devono essere usati solo dentro gli strati della catena
for (const a of alias) { const u = usiDi(a.nome).filter(x => !passi.some(p => x.start >= p.fn.start && x.end <= p.fn.end) && !(x.start >= a.stmt.start && x.end <= a.stmt.end)); if (u.length) errore(`alias ${a.nome} usato fuori dalla catena (riga ${u[0].loc.start.line + righePrima})`); }

// cosa si toglie: base, strati, alias (con il commento attaccato sopra) e i blocchi { } di livello alto che restano vuoti
const togliNodi = [base, ...passi.map(p => p.s.stmt), ...alias.map(a => a.stmt)];
const blocchiVuoti = new Set();
for (const n of togliNodi) { const rd = radiceDi(n); if (rd !== n && rd.type === 'BlockStatement' && rd.body.every(x => togliNodi.includes(x))) blocchiVuoti.add(rd); }
const commentiDentro = b => { const fuori = b.body.map(x => [commentoSopra(x).da, x.end]); return src.slice(b.start + 1, b.end - 1).split('\n').map((l, i, arr) => ({ l, at: b.start + 1 + arr.slice(0, i).join('\n').length + (i ? 1 : 0) })).filter(x => /^\s*\/\//.test(x.l) && !fuori.some(([a, z]) => x.at >= a && x.at < z)).map(x => x.l.trim()); };
// commento di un passo: sopra il blocco (se sparisce), sopra l'alias, sopra lo strato, righe sciolte del blocco che sparisce
const unici = xs => [...new Set(xs.flatMap(x => (x ? x.split('\n') : [])))];
passi.forEach(p => {
  const rs = radiceDi(p.s.stmt), ra = p.aliasStmt ? radiceDi(p.aliasStmt) : null;
  const pezzi = [];
  for (const rd of [ra, rs]) if (rd && blocchiVuoti.has(rd)) pezzi.push(commentoSopra(rd).testo);
  if (p.aliasStmt) pezzi.push(commentoSopra(p.aliasStmt).testo);
  pezzi.push(commentoSopra(p.s.stmt).testo);
  for (const rd of [ra, rs]) if (rd && blocchiVuoti.has(rd)) pezzi.push(commentiDentro(rd).join('\n'));
  p.commento = unici(pezzi);
});
const commBase = commentoSopra(base).testo;

// testo della funzione finale
if (base.generator) errore('generatore non gestito');
const parBase = base.params.map(testo).join(', ');
const rientra = (t, n) => t.split('\n').map(l => (l.length ? ' '.repeat(n) + l : l)).join('\n');
// rientro: si rimette davanti alla prima riga la colonna in cui comincia nel file, poi si toglie il rientro minimo
const colonna = n => { const i = src.lastIndexOf('\n', n.start - 1) + 1; const pre = src.slice(i, n.start); return /^[ \t]*$/.test(pre) ? pre : ''; };
const allinea = t => { const righe = t.split('\n'); const m = Math.min(...righe.filter(l => l.trim()).map(l => l.match(/^ */)[0].length)); return righe.map(l => l.slice(Math.min(m, l.match(/^ */)[0].length))).join('\n'); };
const etichetta = (k, f) => `passo ${k} · ${f.replace(/^js\//, '')}`;
const nomiUsati = new Set(); [base, ...passi.map(p => p.fn)].forEach(f => walk.full(f, x => { if (x.type === 'Identifier') nomiUsati.add(x.name); }));
const sequenza = passi.every(p => p.inSequenza);
const out = [];
out.push(`// ${NOME}: catena appiattita nella fase D del riordino (base + ${passi.length} strati); i passi girano nell'ordine di prima.`);
out.push(`//   ${etichetta(0, fileDi(base))}${commBase ? ' — ' + commBase.split('\n')[0].replace(/^\/\/\s*/, '').slice(0, 90) : ''}`);
passi.forEach((p, k) => out.push(`//   ${etichetta(k + 1, fileDi(p.s.stmt))}${p.commento.length ? ' — ' + p.commento[0].replace(/^\/\/\s*/, '').slice(0, 90) : ''}`));
const intestaPasso = (k, f, comm) => [`  // ── ${etichetta(k, f)}`, ...comm.map(l => '  ' + l)].join('\n');
if (sequenza) {
  const ACC = ['r', 'ris', 'risultato', 'prec', 'valore', 'esito'].find(n => !nomiUsati.has(n));
  if (!ACC) errore('nessun nome libero per il risultato dei passi');
  const qualcheAsync = base.async || passi.some(p => p.fn.async);
  out.push(`// Forma in sequenza: ogni passo riceve in \`${ACC}\` il risultato del passo prima (era la chiamata alla versione precedente).`);
  out.push(`function ${NOME}(${parBase}) {${qualcheAsync ? '   // restituisce quello che restituiva lo strato più esterno (una promessa)' : ''}`);
  const corpoBase = allinea(testo(base.body).slice(1, -1).replace(/^[ \t]*\n/, '').replace(/\n\s*$/, ''));
  out.push(intestaPasso(0, fileDi(base), commBase ? commBase.split('\n') : []));
  out.push(`  let ${ACC} = (${base.async ? 'async ' : ''}(${parBase}) => {\n${rientra(corpoBase, 4)}\n  })(${parBase ? '...arguments' : ''});`);
  passi.forEach((p, k) => {
    const parP = p.fn.params.map(testo).join(', ');
    const corpo = colonna(p.prima) + src.slice(p.prima.start, p.chiamata.start) + ACC + src.slice(p.chiamata.end, p.fn.body.end - 1).replace(/\s*$/, '');
    out.push(intestaPasso(k + 1, fileDi(p.s.stmt), p.commento));
    out.push(`  ${ACC} = (${p.fn.async ? 'async ' : ''}(${parP}) => {\n${rientra(allinea(corpo), 4)}\n  })(${parP ? '...arguments' : ''});`);
  });
  out.push(`  return ${ACC};`);
} else {
  for (let k = 0; k <= passi.length; k++) if (nomiUsati.has('passo' + k)) errore(`il nome passo${k} è già usato da un pezzo della catena`);
  const ultimo = passi[passi.length - 1].fn;
  out.push(`// Forma annidata: alcuni strati fanno qualcosa prima di chiamare la versione precedente, quindi ogni strato resta una`);
  out.push(`// funzione interna che chiama la precedente per nome (passo0 = base); si legge dal fondo: l'ultimo passo chiama il penultimo…`);
  out.push(`function ${NOME}(${ultimo.params.map(testo).join(', ')}) {`);
  out.push(intestaPasso(0, fileDi(base), commBase ? commBase.split('\n') : []));
  const tb = testo(base); const intest = tb.slice(0, tb.indexOf('(')).replace(new RegExp('\\s' + NOME + '\\s*$'), ' ');
  out.push(`  const passo0 = ${rientra(allinea(colonna(base) + intest.trim() + ' ' + tb.slice(tb.indexOf('('))).replace(/^\s*/, ''), 2).trimStart()};`);
  passi.forEach((p, k) => {
    let t = testo(p.fn); const off0 = p.fn.start;
    for (const u of [...p.usi].sort((x, y) => y.start - x.start)) t = t.slice(0, u.start - off0) + 'passo' + k + t.slice(u.end - off0);
    out.push(intestaPasso(k + 1, fileDi(p.s.stmt), p.commento));
    // la prima riga parte a metà (dopo «f = »): rientro calcolato sulle righe dopo la prima
    const righe = t.split('\n'); const resto = righe.slice(1); const m = resto.filter(l => l.trim()).length ? Math.min(...resto.filter(l => l.trim()).map(l => l.match(/^ */)[0].length)) : 0;
    const tt = [righe[0], ...resto.map(l => l.slice(Math.min(m, l.match(/^ */)[0].length)))].join('\n');
    out.push(`  const passo${k + 1} = ${rientra(tt, 2).trimStart()};`);
  });
  out.push(`  return passo${passi.length}.apply(this, arguments);`);
}
out.push('}');
const finale = out.join('\n') + '\n';

// modifiche (posizioni in html): togli nodi e blocchi vuoti con i commenti attaccati sopra; inserisci la finale dopo la radice dell'ultimo strato
const modifiche = [];
const togliIntervallo = (n, conCommento) => {
  let a = tagS + (conCommento ? commentoSopra(n).da : n.start), b = tagS + n.end;
  const iniz = html.lastIndexOf('\n', a - 1) + 1, fineR = html.indexOf('\n', b);
  if (/^[ \t]*$/.test(html.slice(iniz, a)) && /^[ \t;]*$/.test(html.slice(b, fineR))) { a = iniz; b = fineR + 1; }
  modifiche.push({ a, b, testo: '' });
};
for (const n of togliNodi) if (!blocchiVuoti.has(radiceDi(n)) || radiceDi(n) === n) togliIntervallo(n, true);
for (const b of blocchiVuoti) togliIntervallo(b, true);
const ultima = radiceDi(passi[passi.length - 1].s.stmt);
const dopo = html.indexOf('\n', tagS + ultima.end) + 1;
modifiche.push({ a: dopo, b: dopo, testo: finale });
modifiche.sort((x, y) => x.a - y.a || (x.testo ? 1 : -1));
for (let i = 1; i < modifiche.length; i++) if (modifiche[i].a < modifiche[i - 1].b) errore('modifiche sovrapposte');
const riepilogo = `${NOME}: base + ${passi.length} strati → 1 funzione (forma ${sequenza ? 'sequenza' : 'annidata'}) in ${files.find(f => dopo >= f.da && dopo <= f.a).f}; tolti ${alias.length} alias e ${blocchiVuoti.size} blocchi vuoti`;
if (OPZ === '--prova') { console.error(riepilogo); console.log(finale); process.exit(0); }
const perFile = new Map();
for (const x of modifiche) { const f = files.find(f => x.a >= f.da && x.a <= f.a && (x.b <= f.a)); if (!f) errore('modifica a cavallo di due file'); (perFile.get(f) || perFile.set(f, []).get(f)).push(x); }
for (const [f, xs] of perFile) { let t = f.t; for (const x of xs.sort((p, q) => q.a - p.a || (p.testo ? -1 : 1))) t = t.slice(0, x.a - f.da) + x.testo + t.slice(x.b - f.da); fs.writeFileSync(path.join(R, 'src', f.f), t); }
console.log(`${riepilogo}; ${perFile.size} file toccati`);
