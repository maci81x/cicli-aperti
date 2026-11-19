// Toglie da src/js/ i pezzi JS morti di candidati.json (modi: funzioni, strati, dichiara) o li marca con trappole (modo trappole).
// Uso (dalla radice, dopo node build.js): node tools/riordino/pezzi.js . $TMPDIR/candidati.json funzioni|strati|dichiara|trappole
//   funzioni : funzioni mai chiamate + catene mai chiamate (dichiarazione, strati, alias)
//   strati   : base e strati prima dello strato che sostituisce, con i loro alias (solo tagli)
//   dichiara : dopo «strati»: la prima assegnazione `f = function…` a colonna 0 diventa `function f(…)`; una freccia di una riga
//              diventa `function f(…) { return …; }`; negli altri casi si aggiunge `var f;` a livello alto subito prima
//   trappole : nessun taglio; in testa al corpo di ogni pezzo eseguibile mette console.error('[morto] …')
const fs = require('fs'), path = require('path');
const [, , R, CAND, MODO] = process.argv;
const acorn = require(path.resolve(R, 'tools/mappa/node_modules/acorn'));
const walk = require(path.resolve(R, 'tools/mappa/node_modules/acorn-walk'));
const ESCLUSE_BASI = new Set(['disegnaAnteprima', 'disegnaAnteprimaCattura']); // catturate da addEventListener prima della sostituzione
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const ordine = fs.readFileSync(path.join(R, 'src/ordine.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const files = []; let pos = 0;
for (const f of ordine) { const t = fs.readFileSync(path.join(R, 'src', f), 'utf8'); files.push({ f, da: pos, a: pos + t.length, t }); pos += t.length; }
if (pos !== html.length) throw new Error('index.html non corrisponde a src/: lancia node build.js');
const tagS = html.lastIndexOf('\n<script>\n') + '\n<script>\n'.length, tagF = html.lastIndexOf('\n</script>');
const ast = acorn.parse(html.slice(tagS, tagF), { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const righePrima = html.slice(0, tagS).split('\n').length - 1;
const L = n => n.loc.start.line + righePrima;
const c = JSON.parse(fs.readFileSync(CAND, 'utf8'));

const genitore = new Map();
walk.fullAncestor(ast, (n, anc) => { genitore.set(n, anc[anc.length - 2]); });
const istruzioni = []; walk.full(ast, n => { if (/Statement$|Declaration$/.test(n.type) && n.type !== 'BlockStatement') istruzioni.push(n); });
const eAssegnazioneA = (s, f) => s.type === 'ExpressionStatement' && s.expression.type === 'AssignmentExpression' && s.expression.operator === '=' && s.expression.left.type === 'Identifier' && s.expression.left.name === f;
const eDichiarazioneDi = (s, f) => (s.type === 'FunctionDeclaration' && s.id.name === f) || (s.type === 'VariableDeclaration' && s.declarations.length === 1 && s.declarations[0].id.name === f);
const eAlias = (s, nomi) => s.type === 'VariableDeclaration' && s.declarations.length === 1 && nomi.includes(s.declarations[0].id.name);

const togli = new Map();     // istruzione -> etichetta
const riscrivi = [];         // { a, b, testo, et } sostituzioni puntuali (offset nello script)
const esegue = [];           // pezzi eseguibili per le trappole: { nodo funzione, et }

function aggiungiStrato(s, et) {
  togli.set(s, et);
  const r = s.expression.right;
  if (r.type === 'CallExpression' && /Function/.test(r.callee.type)) { walk.full(r.callee.body, x => { if (/Function/.test(x.type)) esegue.push({ fn: x, et }); }); }
  else if (/Function/.test(r.type)) esegue.push({ fn: r, et });
  else walk.full(r, x => { if (/Function/.test(x.type)) esegue.push({ fn: x, et }); });
}

if (MODO === 'funzioni' || (MODO === 'trappole')) {
  const nomi = new Set(c.funzioniMorte.map(f => f.nome));
  for (const s of ast.body) if ([...nomi].some(n => eDichiarazioneDi(s, n))) { const n = s.id ? s.id.name : s.declarations[0].id.name; togli.set(s, 'funzione ' + n); esegue.push({ fn: s.type === 'FunctionDeclaration' ? s : s.declarations[0].init, et: 'funzione ' + n }); }
  for (const k of c.catenaMorta) {
    for (const s of istruzioni) {
      if (eDichiarazioneDi(s, k.nome) && genitore.get(s).type === 'Program') { togli.set(s, 'catena ' + k.nome); esegue.push({ fn: s.type === 'FunctionDeclaration' ? s : s.declarations[0].init, et: 'catena ' + k.nome }); }
      if (eAssegnazioneA(s, k.nome)) aggiungiStrato(s, 'catena ' + k.nome);
      if (eAlias(s, k.alias)) togli.set(s, 'alias ' + s.declarations[0].id.name);
    }
  }
}
if (MODO === 'strati' || MODO === 'trappole') {
  for (const x of c.sostituzioni) {
    const f = x.funzione, tieniBase = ESCLUSE_BASI.has(f);
    const righeBase = tieniBase ? [] : x.base.map(b => +b.split('-')[0]);
    const righeStrati = x.stratiPrima.map(b => +b.split('-')[0]);
    let nb = 0, ns = 0, na = 0;
    for (const s of istruzioni) {
      const r = L(s);
      if (righeBase.includes(r) && eDichiarazioneDi(s, f)) { togli.set(s, 'base ' + f); nb++; esegue.push({ fn: s.type === 'FunctionDeclaration' ? s : s.declarations[0].init, et: 'base ' + f }); }
      if (righeStrati.includes(r) && eAssegnazioneA(s, f)) { aggiungiStrato(s, 'strato ' + f); ns++; }
      if (eAlias(s, x.aliasPrima)) { togli.set(s, 'alias ' + s.declarations[0].id.name); na++; }
    }
    if (nb !== righeBase.length || ns !== righeStrati.length || na !== x.aliasPrima.length) throw new Error(`${f}: base ${nb}/${righeBase.length}, strati ${ns}/${righeStrati.length}, alias ${na}/${x.aliasPrima.length}`);
  }
}


// commit 2b: i nomi delle funzioni a cui il commit 2 ha tolto la base, assegnati senza dichiarazione
if (MODO === 'dichiara') {
  const nomi = new Set(c.sostituzioni.filter(x => !ESCLUSE_BASI.has(x.funzione)).map(x => x.funzione));
  const dichiarati = new Set();
  walk.full(ast, n => { if (n.type === 'FunctionDeclaration' && n.id) dichiarati.add(n.id.name); if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') dichiarati.add(n.id.name); });
  for (const f of nomi) {
    if (dichiarati.has(f)) continue;
    const prima = istruzioni.filter(s => eAssegnazioneA(s, f)).sort((x, y) => x.start - y.start)[0];
    if (!prima) throw new Error(f + ': nessuna assegnazione trovata');
    const r = prima.expression.right, top = genitore.get(prima).type === 'Program';
    const usaThis = n => { let si = false; walk.full(n, x => { if (x.type === 'ThisExpression' || (x.type === 'Identifier' && x.name === 'arguments')) si = true; }); return si; };
    if (top && r.type === 'FunctionExpression' && !r.id) {
      const intest = (r.async ? 'async ' : '') + 'function' + (r.generator ? '*' : '') + ' ' + f;
      const inizioParametri = html.slice(tagS + r.start, tagS + r.body.start).indexOf('(') + r.start;
      riscrivi.push({ a: prima.start, b: inizioParametri, testo: intest, et: 'dichiarazione ' + f });
      if (html[tagS + prima.end - 1] === ';') riscrivi.push({ a: prima.end - 1, b: prima.end, testo: '', et: 'puntoevirgola ' + f });
    } else if (top && r.type === 'ArrowFunctionExpression' && r.body.type !== 'BlockStatement' && !r.async && !usaThis(r.body)) {
      const par = r.params.map(p => html.slice(tagS + p.start, tagS + p.end)).join(', ');
      riscrivi.push({ a: prima.start, b: prima.end, testo: `function ${f}(${par}) { return ${html.slice(tagS + r.body.start, tagS + r.body.end)}; }`, et: 'dichiarazione ' + f });
    } else {
      // dentro un blocco o una funzione, o forma diversa: una dichiarazione var a livello alto, subito prima
      let t = prima; while (genitore.get(t).type !== 'Program') t = genitore.get(t);
      const iniz = html.lastIndexOf('\n', tagS + t.start - 1) + 1 - tagS;
      riscrivi.push({ a: iniz, b: iniz, testo: `var ${f}; // assegnata qui sotto (fase C: tolta la versione di partenza)\n`, et: 'var ' + f });
    }
  }
}

// blocchi { … } che restano vuoti
for (const s of [...togli.keys()]) {
  const g = genitore.get(s);
  if (g && g.type === 'BlockStatement' && genitore.get(g) && genitore.get(g).type === 'Program' && g.body.every(x => togli.has(x))) { g.body.forEach(x => togli.delete(x)); togli.set(g, 'blocco vuoto'); }
}

const modifiche = []; // offset assoluti in index.html
if (MODO === 'trappole') {
  const visti = new Set();
  for (const { fn, et } of esegue) {
    if (!fn || visti.has(fn)) continue; visti.add(fn);
    const id = JSON.stringify('[morto] ' + et + ' @' + L(fn));
    if (fn.body.type === 'BlockStatement') modifiche.push({ a: tagS + fn.body.start + 1, b: tagS + fn.body.start + 1, testo: ` console.error(${id});`, et });
    else modifiche.push({ a: tagS + fn.body.start, b: tagS + fn.body.end, testo: `(console.error(${id}), ${html.slice(tagS + fn.body.start, tagS + fn.body.end)})`, et });
  }
} else {
  for (const [n, et] of togli) {
    let a = tagS + n.start, b = tagS + n.end;
    const iniz = html.lastIndexOf('\n', a - 1) + 1, fineR = html.indexOf('\n', b);
    if (/^[ \t]*$/.test(html.slice(iniz, a)) && /^[ \t;]*$/.test(html.slice(b, fineR))) {
      a = iniz; b = fineR + 1;
      let su = a;
      while (true) { const p = html.lastIndexOf('\n', su - 2) + 1; const riga = html.slice(p, su - 1);
        if (su > tagS && /^\s*\/\/(?!\s*(v\d|═|║|╔|╚|-{3}|─{2}))/.test(riga)) su = p; else break; }
      a = su;
    }
    modifiche.push({ a, b, testo: '', et });
  }
  for (const x of riscrivi) modifiche.push({ a: tagS + x.a, b: tagS + x.b, testo: x.testo, et: x.et });
}
modifiche.sort((x, y) => x.a - y.a);
for (let i = 1; i < modifiche.length; i++) if (modifiche[i].a < modifiche[i - 1].b) throw new Error('modifiche sovrapposte: ' + modifiche[i].et + ' / ' + modifiche[i - 1].et);

const perFile = new Map();
for (const x of modifiche) {
  const f = files.find(f => x.a >= f.da && x.a < f.a);
  if (!f || x.b > f.a) throw new Error('modifica a cavallo di due file: ' + x.et);
  (perFile.get(f) || perFile.set(f, []).get(f)).push(x);
}
let righeTolte = 0;
for (const [f, xs] of perFile) {
  let t = f.t;
  for (const x of xs.sort((p, q) => q.a - p.a)) { righeTolte += (t.slice(x.a - f.da, x.b - f.da).match(/\n/g) || []).length - (x.testo.match(/\n/g) || []).length; t = t.slice(0, x.a - f.da) + x.testo + t.slice(x.b - f.da); }
  fs.writeFileSync(path.join(R, 'src', f.f), t);
}
const conta = {}; modifiche.forEach(m => { const k = m.et.split(' ')[0]; conta[k] = (conta[k] || 0) + 1; });
console.log(`${MODO}: ${modifiche.length} modifiche (${JSON.stringify(conta)}), ${righeTolte} righe in meno, ${perFile.size} file`);
