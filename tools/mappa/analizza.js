// Analizza index.html: funzioni avvolte a strati (const _x = fn; fn = …), selettori CSS ripetuti, !important, funzioni e classi mai usate.
// Uso (da tools/mappa, dopo «npm i»): node analizza.js ../../index.html > report.json   → poi genera_mappa.js
const fs = require('fs');
const acorn = require('acorn');
const walk = require('acorn-walk');
const postcss = require('postcss');

const html = fs.readFileSync(process.argv[2], 'utf8');
const lines = html.split('\n');

// --- individua i blocchi <script> inline e <style> ---
function blocchi(tagOpen, tagClose) {
  const out = [];
  lines.forEach((l, i) => {
    if (l.trim() === tagOpen) out.push({ start: i + 2 });
    if (l.trim() === tagClose && out.length && !out[out.length - 1].end) out[out.length - 1].end = i;
  });
  return out.map(b => ({ ...b, text: lines.slice(b.start - 1, b.end).join('\n') }));
}
const scripts = blocchi('<script>', '</script>');
const styles = blocchi('<style>', '</style>');
const mainJs = scripts.reduce((a, b) => (b.text.length > a.text.length ? b : a));
const css = styles[0];
const off = mainJs.start - 1;
const jsLines = mainJs.text.split('\n');

// --- marcatori di versione (commenti a colonna 0) ---
const VER_JS = /^\/\/ (?:[-─═]+ )?.*?\bv(\d+(?:\.\d+)?)\b/;
const marcatori = [];
jsLines.forEach((l, i) => {
  if (/^\/\/ ║ PARTE 1/.test(l)) marcatori.push({ line: i + 1 + off, v: '1' });
  const m = l.match(/^\/\/ v(\d+(?:\.\d+)?)\b/) || l.match(/^\/\/ --- .*\(v(\d+(?:\.\d+)?)\)/);
  if (m) marcatori.push({ line: i + 1 + off, v: m[1], titolo: l.replace(/^\/\/\s*/, '').slice(0, 110) });
});
const versioneDi = line => {
  let cur = { v: '1', titolo: 'PARTE 1 — logica legacy' };
  for (const m of marcatori) if (m.line <= line) cur = m; else break;
  return cur;
};

// commento subito sopra una riga (fino a 3 righe di //)
function commentoSopra(line) {
  const out = [];
  for (let i = line - off - 2; i >= 0 && out.length < 3; i--) {
    const t = jsLines[i].trim();
    if (t.startsWith('//')) out.unshift(t.replace(/^\/\/\s*/, ''));
    else if (t === '') { if (out.length) break; } else break;
  }
  return out.join(' ').slice(0, 220);
}


// primo commento // dentro il corpo del nuovo strato
function commentoDentro(node) {
  const t = jsLines.slice(node.loc.start.line - 1, Math.min(node.loc.end.line, node.loc.start.line + 40));
  const c = t.map(x => x.trim()).find(x => x.startsWith('//'));
  return c ? c.replace(/^\/\/\s*/, '').slice(0, 220) : '';
}
// commento più vicino nelle 25 righe sopra (anche separato da codice), senza superare un marcatore di versione
function commentoVicino(line) {
  for (let i = line - off - 2; i >= Math.max(0, line - off - 26); i--) {
    const t = jsLines[i];
    if (/^\/\/ v\d/.test(t)) return '';
    if (/^\s*\/\/\s*\S/.test(t) && !/^\s*\/\/\s*[-─═║╔╚]+\s*$/.test(t)) return t.trim().replace(/^\/\/\s*/, '').slice(0, 220);
  }
  return '';
}

const ast = acorn.parse(mainJs.text, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true });
const L = n => n.loc.start.line + off;

// --- funzioni top-level ---
const funzioni = {};
for (const s of ast.body) {
  if (s.type === 'FunctionDeclaration') (funzioni[s.id.name] ||= []).push(L(s));
  if (s.type === 'VariableDeclaration') for (const d of s.declarations)
    if (d.id.type === 'Identifier' && d.init && /Function/.test(d.init.type)) (funzioni[d.id.name] ||= []).push(L(d));
}

// --- alias (const _x = fn) e riassegnazioni (fn = …, window.fn = …) ovunque ---
const alias = {};      // nomeAlias -> {target, line}
const riassegna = [];  // {target, line, node, viaWindow}
walk.full(ast, n => {
  if (n.type === 'VariableDeclarator' && n.init && n.id.type === 'Identifier') {
    let t = n.init;
    if (t.type === 'MemberExpression' && t.object.name === 'window' && !t.computed) t = t.property;
    if (t.type === 'Identifier' && funzioni[t.name]) alias[n.id.name] = { target: t.name, line: L(n) };
  }
  if (n.type === 'AssignmentExpression' && n.operator === '=') {
    let left = n.left, viaWindow = false;
    if (left.type === 'MemberExpression' && left.object.name === 'window' && !left.computed) { left = left.property; viaWindow = true; }
    if (left.type === 'Identifier' && funzioni[left.name] && (/Function/.test(n.right.type) || n.right.type === 'CallExpression'))
      riassegna.push({ target: left.name, line: L(n), node: n.right, viaWindow });
  }
});

function identificatoriUsati(node) {
  const s = new Set();
  walk.full(node, n => { if (n.type === 'Identifier') s.add(n.name); });
  return s;
}

const catene = {};
for (const r of riassegna) {
  const usa = identificatoriUsati(r.node);
  const chiama = Object.entries(alias).filter(([a, v]) => v.target === r.target && usa.has(a) && v.line <= r.line).map(([a]) => a);
  const ver = versioneDi(r.line);
  (catene[r.target] ||= []).push({
    line: r.line, v: ver.v, sezione: ver.titolo || '',
    tipo: chiama.length ? 'avvolge (chiama ' + chiama.join(', ') + ')'
      : (r.node.type === 'CallExpression' && r.node.arguments.some(a => a.type === 'Identifier' && a.name === r.target))
        ? 'avvolge (' + (r.node.callee.type === 'Identifier' ? 'decoratore ' + r.node.callee.name + '()' : 'IIFE con orig') + ')'
        : 'sostituisce (non richiama la versione precedente)',
    nota: commentoSopra(r.line) || chiama.map(a => commentoSopra(alias[a].line)).find(Boolean) || commentoDentro(r.node) || commentoVicino(r.line) || '',
    usaFunzioni: [...usa].filter(x => funzioni[x] && x !== r.target).slice(0, 8),
    usaId: [...new Set(mainJs.text.split('\n').slice(r.node.loc.start.line - 1, r.node.loc.end.line).join('\n').match(/\$\(['"][\w-]+['"]\)/g) || [])].map(x => x.slice(3, -2)).slice(0, 6),
    righe: r.node.loc.end.line - r.node.loc.start.line + 1,
  });
}
const cateneMulti = Object.fromEntries(Object.entries(catene)
  .map(([k, v]) => [k, { definita: funzioni[k], versioneBase: versioneDi(funzioni[k][0]).v, strati: v.sort((a, b) => a.line - b.line) }])
  .sort((a, b) => b[1].strati.length - a[1].strati.length));

// --- uso dei nomi: JS (escludendo la dichiarazione stessa), HTML, stringhe ---
const riferimenti = {};
walk.fullAncestor(ast, (n, anc) => {
  if (n.type !== 'Identifier') return;
  const p = anc[anc.length - 2];
  if (p && p.type === 'FunctionDeclaration' && p.id === n) return;
  if (p && p.type === 'VariableDeclarator' && p.id === n) return;
  if (p && p.type === 'AssignmentExpression' && p.left === n) return;
  if (p && p.type === 'MemberExpression' && p.property === n && !p.computed && p.object.name !== 'window') return;
  if (p && p.type === 'Property' && p.key === n && !p.shorthand) return;
  riferimenti[n.name] = (riferimenti[n.name] || 0) + 1;
});
const testoNonJs = lines.slice(0, mainJs.start - 1).join('\n') + '\n' + lines.slice(mainJs.end).join('\n');
const stringheJs = [];
walk.full(ast, n => {
  if (n.type === 'Literal' && typeof n.value === 'string') stringheJs.push(n.value);
  if (n.type === 'TemplateElement') stringheJs.push(n.value.raw);
});
const tuttoStringhe = testoNonJs + '\n' + stringheJs.join('\n');

const morte = [];
for (const [nome, defs] of Object.entries(funzioni)) {
  const rifJs = riferimenti[nome] || 0;
  const reHtml = new RegExp('\\b' + nome.replace(/\$/g, '\\$') + '\\b');
  const inStringhe = reHtml.test(tuttoStringhe);
  // un alias `const _x = nome` conta come riferimento ma non come chiamata: escludilo
  const soloAlias = Object.values(alias).filter(a => a.target === nome).length;
  const rifReali = rifJs - soloAlias;
  if (rifReali <= 0 && !inStringhe) morte.push({ nome, line: defs[0], v: versioneDi(defs[0]).v, alias: soloAlias, ridefinita: (catene[nome] || []).length });
}
// definizioni duplicate (function f dichiarata due volte: vince l'ultima)
const doppie = Object.entries(funzioni).filter(([, d]) => d.length > 1).map(([nome, d]) => ({ nome, righe: d }));

// --- CSS ---
const VER_CSS = /\bv(\d+(?:\.\d+)?)\b/;
const cssLines = css.text.split('\n');
const cssMarker = [];
cssLines.forEach((l, i) => { const m = l.match(/^\/\*.*?\bv(\d+(?:\.\d+)?)\b/); if (m) cssMarker.push({ line: i + css.start, v: m[1] }); });
const cssVer = line => { let v = '1'; for (const m of cssMarker) if (m.line <= line) v = m.v; else break; return v; };
const root = postcss.parse(css.text);
const perSelettore = {};
let important = 0; const importantPerVer = {};
root.walkRules(r => {
  const line = r.source.start.line + css.start - 1;
  const media = [];
  for (let p = r.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule') media.unshift('@' + p.name + ' ' + p.params);
  const props = []; let imp = 0;
  r.walkDecls(d => { props.push(d.prop); if (d.important) imp++; });
  important += imp; if (imp) importantPerVer[cssVer(line)] = (importantPerVer[cssVer(line)] || 0) + imp;
  for (const sel of r.selectors) {
    const k = (media.join(' ') + ' ' + sel.replace(/\s+/g, ' ')).trim();
    (perSelettore[k] ||= []).push({ line, v: cssVer(line), props, imp });
  }
});
const cssRipetuti = Object.entries(perSelettore).filter(([, v]) => v.length > 1)
  .map(([sel, v]) => {
    const conteggio = {}; v.forEach(x => x.props.forEach(p => conteggio[p] = (conteggio[p] || 0) + 1));
    return { sel, volte: v.length, versioni: v.map(x => 'v' + x.v + '@' + x.line), proprietaSovrascritte: Object.keys(conteggio).filter(p => conteggio[p] > 1), important: v.reduce((a, x) => a + x.imp, 0) };
  })
  .sort((a, b) => b.volte - a.volte);

// classi e id del CSS mai nominati altrove (HTML, JS, stringhe)
const tuttoJs = mainJs.text + '\n' + testoNonJs;
const classiCss = new Set(), idCss = new Set();
root.walkRules(r => {
  for (const m of r.selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) classiCss.add(m[1]);
  for (const m of r.selector.matchAll(/#([A-Za-z_][\w-]*)/g)) idCss.add(m[1]);
});
const htmlSenzaCss = lines.slice(0, css.start - 1).join('\n') + lines.slice(css.end).join('\n');
const presente = nome => new RegExp('(^|[^\\w-])' + nome.replace(/[-]/g, '\\-') + '($|[^\\w-])').test(htmlSenzaCss);
// prefissi composti dinamicamente (es. 'q-' + n): se compare «nome-» spezzato, lo segnalo come dubbio
const prefissiDinamici = new Set([...htmlSenzaCss.matchAll(/([A-Za-z][\w-]+)\$\{/g)].map(m => m[1]).concat([...htmlSenzaCss.matchAll(/['"]([A-Za-z][\w-]*-)['"]\s*\+/g)].map(m => m[1])));
const classiMorte = [...classiCss].filter(c => !presente(c)).map(c => {
  const dubbio = [...prefissiDinamici].find(p => p.length >= 2 && c.startsWith(p)) || false;
  const righe = []; root.walkRules(r => { if (new RegExp('\\.' + c.replace(/-/g, '\\-') + '(?![\\w-])').test(r.selector)) righe.push(r.source.start.line + css.start - 1); });
  return { classe: c, dubbio, righe };
});
const idMorti = [...idCss].filter(c => !presente(c)).map(c => {
  const righe = []; root.walkRules(r => { if (new RegExp('#' + c + '(?![\\w-])').test(r.selector)) righe.push(r.source.start.line + css.start - 1); });
  return { id: c, righe };
});

console.log(JSON.stringify({
  blocchi: { scripts: scripts.map(s => [s.start, s.end]), styles: styles.map(s => [s.start, s.end]) },
  marcatori, nFunzioni: Object.keys(funzioni).length, nAlias: Object.keys(alias).length, nRiassegnazioni: riassegna.length,
  cateneMulti, doppie, morte, css: { regole: Object.keys(perSelettore).length, important, importantPerVer, ripetuti: cssRipetuti, classiMorte, idMorti },
}, null, 1));
