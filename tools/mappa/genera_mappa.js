// Scrive docs/MAPPA.md (catene di strati, CSS sovrascritto, codice morto) dal report.json di analizza.js.
// Uso: node genera_mappa.js report.json ../../docs/MAPPA.md $(git rev-parse --short HEAD)
const fs = require('fs');
const path = require('path');
const [, , reportPath, out, commit] = process.argv;
if (!reportPath || !out) { console.error('Uso: node genera_mappa.js report.json docs/MAPPA.md <commit>'); process.exit(2); }
const r = JSON.parse(fs.readFileSync(path.resolve(reportPath), 'utf8'));

const md = s => String(s || '').replace(/─{2,}\s*/g, '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const verificateDinamiche = new Set(['tag-q1', 'tag-q2', 'tag-q3', 'tag-q4', 'p-q1', 'p-q3', 'p-q4', 'chip-q1', 'chip-q2', 'chip-q3', 't-q1', 't-q2', 't-q3', 't-q4', 'v17-q1', 'v17-q2', 'v17-q3', 'v17-q4']);
const catene = Object.entries(r.cateneMulti);
const multi = catene.filter(([, v]) => v.strati.length >= 2);
const singole = catene.filter(([, v]) => v.strati.length === 1);
const nStrati = multi.reduce((a, [, v]) => a + v.strati.length, 0);
const sost = catene.flatMap(([k, v]) => v.strati.filter(s => s.tipo.startsWith('sostituisce')).map(s => ({ k, ...s, prima: v.strati.indexOf(s) })));

const cosa = s => {
  const parti = [];
  if (s.nota) parti.push(md(s.nota));
  else parti.push('_(nessun commento; sezione: ' + md(s.sezione || 'v' + s.v) + ')_');
  if (s.usaFunzioni && s.usaFunzioni.length) parti.push('usa: `' + s.usaFunzioni.slice(0, 5).join('`, `') + '`');
  return parti.join(' — ');
};
const tipoBreve = t => t.startsWith('sostituisce') ? '**sostituisce**' : t.replace('avvolge ', '');

let o = '';
o += `# MAPPA di index.html — strati, sovrascritture, codice morto\n\n`;
o += `> Generata il 19/11/2026 su \`index.html\` al commit \`${commit}\` (v50, 21.798 righe) con un'analisi statica (parser JavaScript *acorn* + parser CSS *postcss*), poi controllata a campione a mano.\n`;
o += `> I numeri di riga sono quelli di \`index.html\`. Se il file cambia, le righe scorrono: rigenerare la mappa (vedi in fondo).\n\n`;

o += `## In breve\n\n`;
o += `| | |\n|---|---|\n`;
o += `| Blocchi | \`<style>\` righe ${r.blocchi.styles[0].join('–')} · HTML righe 2638–3497 · \`<script>\` principale righe ${r.blocchi.scripts[1].join('–')} (più un piccolo \`<script>\` in testa, righe ${r.blocchi.scripts[0].join('–')}) |\n`;
o += `| Funzioni top-level | ${r.nFunzioni} |\n`;
o += `| Alias \`const _x = fn\` | ${r.nAlias} |\n`;
o += `| Riassegnazioni \`fn = …\` | ${r.nRiassegnazioni} su ${catene.length} funzioni |\n`;
o += `| Funzioni avvolte **2 o più volte** | **${multi.length}** (${nStrati} strati in tutto) |\n`;
o += `| Funzioni avvolte una volta sola | ${singole.length} |\n`;
o += `| Strati che **sostituiscono** senza richiamare il precedente | ${sost.length} (tutto ciò che sta sotto di loro non viene più eseguito) |\n`;
o += `| Regole CSS (selettore × media) | ${r.css.regole} |\n`;
o += `| Selettori definiti più volte nello stesso contesto | ${r.css.ripetuti.length} |\n`;
o += `| \`!important\` | ${r.css.important} (di cui ${(r.css.importantPerVer['49'] || 0) + (r.css.importantPerVer['50'] || 0)} in v49–v50) |\n`;
o += `| Funzioni mai chiamate | ${r.morte.length} |\n`;
o += `| Classi CSS senza elementi | ${r.css.classiMorte.filter(c => !verificateDinamiche.has(c.classe)).length} |\n\n`;

o += `**Legenda «tipo»**: *chiama \\_xV12* = lo strato richiama la versione precedente (avvolge davvero); *decoratore proteggi()* = \`fn = proteggi(fn)\`; *IIFE con orig* = \`fn = (function (orig) { … })(fn)\`; **sostituisce** = riscrive la funzione da capo: gli strati precedenti diventano codice morto.\n\n`;
o += `**Versione** = l'ultimo commento di sezione \`// vNN ·\` a colonna 0 prima della riga. Tra le righe 6485 e 11722 le sezioni v2–v5 sono mescolate (la «PARTE 2» è nata a blocchi), quindi l'ordine delle versioni lì non è monotòno.\n\n`;

o += `## 1. Funzioni avvolte più volte — la catena degli strati\n\n`;
o += `Ordine = ordine di esecuzione dello script: l'ultimo strato è quello che gira per primo quando la funzione viene chiamata, e dentro di sé chiama i precedenti.\n\n`;
o += `Indice: ${multi.map(([k, v]) => `[\`${k}\`](#${k.toLowerCase()}) (${v.strati.length})`).join(' · ')}\n\n`;
for (const [k, v] of multi) {
  o += `### ${k}\n\n`;
  o += `Definita a riga ${v.definita.join(', ')} (v${v.versioneBase}) · ${v.strati.length} strati\n\n`;
  o += `| # | Versione | Riga | Tipo | Cosa aggiunge |\n|---|---|---|---|---|\n`;
  o += `| 0 | v${v.versioneBase} | ${v.definita[0]} | base | definizione originale |\n`;
  v.strati.forEach((s, i) => { o += `| ${i + 1} | v${s.v} | ${s.line} | ${tipoBreve(s.tipo)} | ${cosa(s)} |\n`; });
  o += `\n`;
}

o += `## 2. Funzioni avvolte una volta sola\n\n`;
o += `| Funzione | Base | Strato | Tipo | Cosa aggiunge |\n|---|---|---|---|---|\n`;
for (const [k, v] of singole.sort((a, b) => a[1].strati[0].line - b[1].strati[0].line)) {
  const s = v.strati[0];
  o += `| \`${k}\` | v${v.versioneBase} · ${v.definita[0]} | v${s.v} · ${s.line} | ${tipoBreve(s.tipo)} | ${cosa(s)} |\n`;
}
o += `\n`;

o += `## 3. Strati che sostituiscono (codice morto dentro le catene)\n\n`;
o += `Quando uno strato riscrive la funzione senza richiamare l'alias precedente, la definizione base e gli strati prima di lui non girano più — a meno che qualcuno chiami direttamente un alias vecchio (\`_xBase(…)\`). Sono candidati sicuri da togliere nel riordino, dopo aver verificato gli alias.\n\n`;
o += `| Funzione | Strato che sostituisce | Strati resi morti sotto di lui |\n|---|---|---|\n`;
for (const s of sost.sort((a, b) => a.line - b.line)) o += `| \`${s.k}\` | v${s.v} · riga ${s.line} | base${s.prima ? ' + ' + s.prima + ' strat' + (s.prima === 1 ? 'o' : 'i') : ''} |\n`;
o += `\n`;

o += `## 4. CSS sovrascritto\n\n`;
o += `### 4.1 Le tavolozze (variabili \`--…\`)\n\n`;
o += `I colori sono stati ridefiniti a ogni cambio di stile: \`:root\` in v1 (67, 98), v9 (1360), v26 (1912); poi \`html:root\` / \`html[data-theme="light"]\` in **v30 (2031, 2256), v43 (2335), v44.1 (2424)** e la versione scura \`html:root[data-theme="dark"]\` in v30 (2057, 2257), v43 (2358), v44.1 (2431). Vince l'ultima (v44.1 «Roby»), ritoccata in v50 (2605, sfondo salvia). Le tre tavolozze precedenti sono interamente sovrascritte: nel riordino resta **un solo** blocco di token chiaro + uno scuro.\n\n`;
o += `### 4.2 Selettori definiti più volte\n\n`;
o += `Stesso selettore nello stesso contesto (\`@media\` compreso). «Proprietà sovrascritte» = dichiarate in più di una delle regole (le altre si sommano).\n\n`;
o += `| Selettore | Volte | Dove (versione@riga) | Proprietà sovrascritte | !important |\n|---|---|---|---|---|\n`;
for (const x of r.css.ripetuti.filter(x => !/^(html)?(:root|\[data-theme)|^html\[data-theme|^html:root(\[data-theme="dark"\])?$/.test(x.sel) || x.sel.includes(' ')))
  o += `| \`${md(x.sel)}\` | ${x.volte} | ${x.versioni.join(' ')} | ${x.proprietaSovrascritte.length > 8 ? x.proprietaSovrascritte.length + ' variabili' : md(x.proprietaSovrascritte.join(', ')) || '—'} | ${x.important || ''} |\n`;
o += `\n`;
o += `Molte più sovrascritture sono **indirette** (selettore diverso ma più specifico, es. \`html:root .board .evt-riga.v24-mio\` contro \`.board .evt-riga.v24-mio\`): l'analisi per selettore identico non le vede. Il prefisso \`html:root\` aggiunto da v43 in poi è proprio un trucco di specificità per vincere sulle regole vecchie.\n\n`;
o += `### 4.3 \`!important\` per versione\n\n`;
o += `| Versione | ${Object.keys(r.css.importantPerVer).map(v => 'v' + v).join(' | ')} | Totale |\n|---|${Object.keys(r.css.importantPerVer).map(() => '---').join('|')}|---|\n`;
o += `| N. | ${Object.values(r.css.importantPerVer).join(' | ')} | ${r.css.important} |\n\n`;
o += `Quasi due terzi stanno in v49–v50: sono gli strati che hanno dovuto battere la cascata accumulata. Elenco completo: \`grep -n '!important' index.html | awk -F: '$1<2636'\`.\n\n`;

o += `## 5. Codice morto\n\n`;
o += `### 5.1 Funzioni mai chiamate\n\n`;
o += `Nessun riferimento nel JavaScript (escluse dichiarazione e alias), nell'HTML, negli attributi \`onclick\`/\`data-act\` né in alcuna stringa o template. Verificato anche con \`grep\`: ogni nome compare solo nella propria dichiarazione.\n\n`;
o += `| Funzione | Riga | Versione | Nota |\n|---|---|---|---|\n`;
for (const m of r.morte) o += `| \`${m.nome}\` | ${m.line} | v${m.v} | ${m.alias ? 'avvolta ' + m.ridefinita + ' volta ma mai chiamata: muore tutta la catena' : m.v === '1' ? 'logica legacy rimasta dopo il redesign v2' : ''} |\n`;
o += `\n`;
o += `Non è contata la morte «a cascata» (funzioni chiamate solo da funzioni morte) né le ${sost.length} catene troncate della sezione 3: il codice realmente eliminabile è di più.\n\n`;
o += `### 5.2 Classi CSS senza elementi\n\n`;
o += `Classi presenti nel CSS ma mai scritte nell'HTML né in una stringa JS. Escluse le classi composte a runtime che ho verificato (\`p-q\${q}\`, \`t-q\${q}\`, \`chip-q\${q}\`, \`v17-q\${q}\`).\n\n`;
o += `| Classe | Righe CSS |\n|---|---|\n`;
for (const c of r.css.classiMorte.filter(c => !verificateDinamiche.has(c.classe))) o += `| \`.${c.classe}\` | ${[...new Set(c.righe)].join(', ')} |\n`;
o += `\n`;
o += `\`tag-q3\`/\`tag-q4\`: nel JS compaiono solo \`tag-q1\` e \`tag-q2\` scritti per intero. Nessun id CSS (\`#…\`) risulta orfano.\n\n`;

o += `## Come rigenerare\n\n`;
o += `Script in \`tools/mappa/\`: \`cd tools/mappa && npm i && node analizza.js ../../index.html > report.json && node genera_mappa.js report.json ../../docs/MAPPA.md $(git rev-parse --short HEAD)\`.\n\n`;
o += `**Limiti dell'analisi**: (1) chiamate costruite per nome (\`window[nome]()\`) non si vedono — controllate a campione, nessun caso trovato tra le funzioni «morte»; (2) «cosa aggiunge» viene dal commento più vicino allo strato, non da una lettura riga per riga; (3) le classi CSS dentro \`:not()\`/\`:has()\` contano come usate se compaiono altrove.\n`;

fs.writeFileSync(out, o);
console.log('scritto', out, o.split('\n').length, 'righe');
