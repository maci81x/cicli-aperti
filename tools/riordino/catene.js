// Fase D: per ogni strato di una catena, dove sta (file di src/, riga), se è dentro un blocco o una funzione,
// quali nomi locali (non globali) usa e quali alias legge. Serve a decidere come appiattire senza perdere variabili.
// Uso (dalla radice): node tools/riordino/catene.js . vistaOggi disegna …   (acorn da tools/mappa/node_modules)
const fs = require('fs'), path = require('path');
const [, , R0, ...NOMI] = process.argv; const R = path.resolve(R0);
const acorn = require(path.join(R, 'tools/mappa/node_modules/acorn'));
const walk = require(path.join(R, 'tools/mappa/node_modules/acorn-walk'));
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const ordine = fs.readFileSync(path.join(R, 'src/ordine.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const mappa = []; let r0 = 1;
for (const f of ordine) { const n = fs.readFileSync(path.join(R, 'src', f), 'utf8').split('\n').length - 1; mappa.push({ f, da: r0, a: r0 + n - 1 }); r0 += n; }
const dove = r => { const m = mappa.find(x => r >= x.da && r <= x.a); return m ? `${m.f}:${r - m.da + 1}` : '?'; };
const tagS = html.lastIndexOf('\n<script>\n') + 10, tagF = html.lastIndexOf('\n</script>');
const ast = acorn.parse(html.slice(tagS, tagF), { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const righePrima = html.slice(0, tagS).split('\n').length - 1;
const L = n => n.loc.start.line + righePrima;

// nomi dichiarati direttamente in un blocco/corpo di funzione (non annidati in funzioni interne)
function dichiaratiIn(nodo) {
  const nomi = new Set();
  const corpo = nodo.type === 'BlockStatement' || nodo.type === 'Program' ? nodo.body : [];
  for (const s of corpo) {
    if (s.type === 'FunctionDeclaration') nomi.add(s.id.name);
    if (s.type === 'VariableDeclaration') s.declarations.forEach(d => walk.full(d.id, x => { if (x.type === 'Identifier') nomi.add(x.name); }));
    if (s.type === 'ClassDeclaration') nomi.add(s.id.name);
  }
  return nomi;
}
const usati = n => { const s = new Set(); walk.full(n, x => { if (x.type === 'Identifier') s.add(x.name); }); return s; };

const risultato = {};
for (const nome of NOMI) {
  const pezzi = [];
  walk.fullAncestor(ast, (n, anc) => {
    const base = (n.type === 'FunctionDeclaration' && n.id.name === nome) || (n.type === 'VariableDeclarator' && n.id.name === nome && n.init && /Function/.test(n.init.type));
    const strato = n.type === 'AssignmentExpression' && n.operator === '=' && n.left.type === 'Identifier' && n.left.name === nome;
    if (!base && !strato) return;
    const fn = base ? (n.type === 'FunctionDeclaration' ? n : n.init) : n.right;
    // ambiti che racchiudono (esclusa la radice): blocchi e funzioni
    const locali = new Set();
    const contenitori = anc.slice(0, -1).filter(x => x.type === 'BlockStatement' && x !== fn.body);
    contenitori.forEach(b => dichiaratiIn(b).forEach(x => locali.add(x)));
    anc.slice(0, -1).filter(x => /Function/.test(x.type) && x !== fn).forEach(f => f.params.forEach(p => walk.full(p, x => { if (x.type === 'Identifier') locali.add(x.name); })));
    const u = usati(fn);
    const aliasLetti = [...u].filter(x => /^_/.test(x));
    pezzi.push({ tipo: base ? 'base' : 'strato', riga: L(n), src: dove(L(n)), righe: fn.loc.end.line - fn.loc.start.line + 1,
      dentro: contenitori.length ? `${contenitori.length} blocco/i` + (anc.some(x => /Function/.test(x.type) && x !== fn) ? ' + funzione' : '') : (anc.some(x => /Function/.test(x.type) && x !== fn) ? 'funzione' : 'radice'),
      nomiLocaliUsati: [...u].filter(x => locali.has(x) && x !== nome), aliasLetti,
      forma: fn.type + (n.type === 'AssignmentExpression' && n.right.type === 'CallExpression' ? ' (IIFE/decoratore)' : '') });
  });
  risultato[nome] = pezzi.sort((a, b) => a.riga - b.riga);
}
console.log(JSON.stringify(risultato, null, 1));
