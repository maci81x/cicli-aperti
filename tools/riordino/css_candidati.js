// Candidati al codice morto CSS: selettori che richiedono una classe che nessun elemento ha, variabili --x della radice sempre coperte.
// Uso (dalla radice): node tools/riordino/css_candidati.js . > $TMPDIR/css.json   (postcss da tools/mappa/node_modules)
const fs = require('fs'), path = require('path');
const R = process.argv[2];
const postcss = require(path.resolve(R, 'tools/mappa/node_modules/postcss'));
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const righe = html.split('\n');
const iSt = righe.indexOf('<style>'), fSt = righe.indexOf('</style>');
const css = righe.slice(iSt + 1, fSt).join("\n"); const off = iSt + 2;
const root = postcss.parse(css);
const resto = righe.slice(0, iSt).join('\n') + righe.slice(fSt).join('\n');

// classi usate fuori dal CSS: nome intero, oppure prefisso di una classe composta con ${…} o con '…-' + …
const usata = c => new RegExp('(^|[^\\w-])' + c.replace(/-/g, '\\-') + '($|[^\\w-])').test(resto);
const prefissi = [...new Set([...resto.matchAll(/([A-Za-z][\w-]*)\$\{/g)].map(m => m[1]).concat([...resto.matchAll(/['"`]([A-Za-z][\w-]*-)['"`]\s*\+/g)].map(m => m[1])))];
// classi con un prefisso costruito dal codice: qualunque testo letterale davanti a ${…} o a ' + …
// (dopo la review: tag-q${q} copre tag-q3 e tag-q4). Morte verificate a mano nonostante un prefisso simile:
// toast-danger ('toast-' + n costruisce un id) e v25-sezione-chip ('v25-' + nome è una chiave).
const VERIFICATE_MORTE = new Set(['toast-danger', 'v25-sezione-chip']);
const dinamica = c => !VERIFICATE_MORTE.has(c) && prefissi.some(p => p.length >= 2 && c.startsWith(p));
const positivo = sel => sel.replace(/:(not|is|where|has|matches)\((?:[^()]|\([^()]*\))*\)/g, ''); // tolte le parti tra parentesi

const selettoriMorti = [], dubbi = [];
root.walkRules(r => {
  const media = []; for (let p = r.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule') media.unshift('@' + p.name + ' ' + p.params);
  if (media.some(m => /keyframes/.test(m))) return;
  const sels = r.selectors, morti = [];
  for (const s of sels) {
    const classi = [...positivo(s).matchAll(/\.([A-Za-z_][\w-]*)/g)].map(m => m[1]);
    const assenti = classi.filter(c => !usata(c));
    if (!assenti.length) { const neg = [...s.matchAll(/:not\(([^)]*)\)/g)].flatMap(m => [...m[1].matchAll(/\.([A-Za-z_][\w-]*)/g)].map(x => x[1])).filter(c => !usata(c)); if (neg.length) dubbi.push({ riga: r.source.start.line + off - 1, sel: s, motivo: 'classe assente dentro :not(): resta', classi: neg }); continue; }
    if (assenti.some(dinamica)) { dubbi.push({ riga: r.source.start.line + off - 1, sel: s, motivo: 'forse composta dal codice', classi: assenti }); continue; }
    morti.push({ sel: s, classi: assenti });
  }
  if (morti.length) selettoriMorti.push({ riga: r.source.start.line + off - 1, fine: r.source.end.line + off - 1, media: media.join(' '), tutti: morti.length === sels.length, morti });
});

// tavolozze: dichiarazioni di --variabili sulla radice coperte da una regola che vince sempre
const condizione = sel => {
  const s = sel.replace(/\s+/g, '');
  if (/^(:root|html|html:root)$/.test(s)) return { c: 'sempre', spec: s === 'html:root' ? [0, 1, 1] : s === ':root' ? [0, 1, 0] : [0, 0, 1] };
  let m = s.match(/^(html)?(:root)?\[data-theme="?(dark|light)"?\]$/); if (m) return { c: m[3], spec: [0, 1 + (m[2] ? 1 : 0), m[1] ? 1 : 0] };
  m = s.match(/^(html)?(:root)?\[data-contrast="?alto"?\]$/); if (m) return { c: 'alto', spec: [0, 1 + (m[2] ? 1 : 0), m[1] ? 1 : 0] };
  return null;
};
const vince = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return null; };
const regole = [];
root.walkRules(r => {
  const media = []; for (let p = r.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule') media.unshift('@' + p.name + ' ' + p.params);
  for (const sel of r.selectors) { const k = condizione(sel); if (!k) continue;
    r.walkDecls(d => { if (d.prop.startsWith('--')) regole.push({ riga: d.source.start.line + off - 1, sel, media: media.join(' '), ...k, prop: d.prop, imp: d.important, pos: d.source.start.offset, nSel: r.selectors.length }); }); }
});
const variabiliMorte = [];
const coperta = x => regole.find(y => y.pos !== x.pos && y.prop === x.prop && !x.imp && (y.media === x.media || y.media === '') &&
    (y.c === 'sempre' || y.c === x.c) && (vince(y.spec, x.spec) === true || (vince(y.spec, x.spec) === null && y.pos > x.pos)));
// una dichiarazione è morta solo se è coperta per OGNI selettore della sua regola
const perDichiarazione = {};
for (const x of regole) (perDichiarazione[x.pos] ||= []).push(x);
for (const gruppo of Object.values(perDichiarazione)) {
  if (gruppo.length !== gruppo[0].nSel) continue; // un selettore della regola non è sulla radice: resta
  const killer = gruppo.map(coperta);
  if (killer.every(Boolean)) variabiliMorte.push({ riga: gruppo[0].riga, sel: gruppo.map(g => g.sel).join(', '), media: gruppo[0].media, prop: gruppo[0].prop, copertaDa: killer.map(k => k.riga).join('/') });
}
const perRegola = {};
variabiliMorte.forEach(v => { (perRegola[v.sel + ' @' + (v.media || '-')] ||= []).push(v.riga); });
console.log(JSON.stringify({ selettoriMorti, dubbi, variabiliMorte: variabiliMorte.length, perRegola, dettaglio: variabiliMorte }, null, 1));
