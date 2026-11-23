// Fase D: confronta i testi di template literal e stringhe tra due versioni di index.html (un appiattimento non deve cambiarne nessuno).
// Uso (dalla radice): node tools/riordino/testi.js <rev> [<rev>|WORK]   es. node tools/riordino/testi.js HEAD WORK → «testi diversi: 0»
const cp = require('child_process'), path = require('path');
const R = process.cwd();
const acorn = require(path.join(R, 'tools/mappa/node_modules/acorn')), walk = require(path.join(R, 'tools/mappa/node_modules/acorn-walk'));
const prendi = rev => { const h = rev === 'WORK' ? require('fs').readFileSync('index.html', 'utf8') : cp.execSync(`git show ${rev}:index.html`, { maxBuffer: 1e8 }).toString(); const s = h.slice(h.lastIndexOf('\n<script>\n') + 10, h.lastIndexOf('\n</script>')); const m = new Map(); walk.full(acorn.parse(s, { ecmaVersion: 'latest' }), n => { const k = n.type === 'TemplateElement' ? 'T:' + n.value.raw : n.type === 'Literal' && typeof n.value === 'string' ? 'S:' + n.value : null; if (k) m.set(k, (m.get(k) || 0) + 1); }); return m; };
const [a, b] = [prendi(process.argv[2]), prendi(process.argv[3] || "WORK")];
let diff = 0; for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; if (x !== y) { diff++; if (diff <= 40) console.log(`${x}→${y}`, JSON.stringify(k.slice(0, 140))); } }
console.log('testi diversi:', diff);
