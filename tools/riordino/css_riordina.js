// Fase E: riordino del CSS di src/css/ senza cambiare l'aspetto (vedi docs/egm/fase-e/design_draft.md).
// Uso (dalla radice, dopo node build.js):
//   node tools/riordino/css_riordina.js tavolozza [--prova]
//   node tools/riordino/css_riordina.js unisci [--solo <file>] [--escludi <selettore>]… [--prova]
//   node tools/riordino/css_riordina.js importanti [--escludi <selettore>]… [--prova]
// Scrive i file di src/css/ (con --prova solo il riepilogo) e la sezione del modo in docs/egm/fase-e/casi.md.
const fs = require('fs'), path = require('path');
const R = process.cwd();
const postcss = require(path.join(R, 'tools/mappa/node_modules/postcss'));
const sp = require(path.join(R, 'tools/mappa/node_modules/postcss-selector-parser'));
const argv = process.argv.slice(2);
const MODO = argv[0], PROVA = argv.includes('--prova');
const SOLO = argv.includes('--solo') ? argv[argv.indexOf('--solo') + 1] : null;
const ESCLUDI = new Set(argv.flatMap((a, i) => (a === '--escludi' ? [argv[i + 1].replace(/\s+/g, ' ').trim()] : [])));
const norm = s => s.replace(/\s+/g, ' ').trim();

// ── i fogli nell'ordine della cascata: tabler (link esterno, prima) e poi i file di ordine.txt
const ordine = fs.readFileSync('src/ordine.txt', 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const fileCss = ordine.filter(f => f.startsWith('css/'));
const TABLER = path.join(R, 'tests/node_modules/@tabler/icons-webfont/dist/tabler-icons.min.css');
const fogli = [{ f: '(tabler)', root: postcss.parse(fs.readFileSync(TABLER, 'utf8')), esterno: true },
  ...fileCss.map(f => ({ f, root: postcss.parse(fs.readFileSync(path.join('src', f), 'utf8')) }))];

// ── specificità
const piu = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const PSEUDO_EL = new Set([':before', ':after', ':first-line', ':first-letter']);
function specSel(sel) {   // sel: nodo selector di postcss-selector-parser
  let s = [0, 0, 0];
  sel.each(n => {
    if (n.type === 'id') s = piu(s, [1, 0, 0]);
    else if (n.type === 'class' || n.type === 'attribute') s = piu(s, [0, 1, 0]);
    else if (n.type === 'tag') s = piu(s, [0, 0, 1]);
    else if (n.type === 'pseudo') {
      const v = n.value.toLowerCase();
      if (v.startsWith('::') || PSEUDO_EL.has(v)) s = piu(s, [0, 0, 1]);
      else if (v === ':where') { /* 0 */ }
      else if ([':not', ':is', ':has', ':matches', ':-webkit-any'].includes(v)) s = piu(s, n.nodes.map(specSel).reduce((m, x) => (cmp(x, m) > 0 ? x : m), [0, 0, 0]));
      else s = piu(s, [0, 1, 0]);
    }
  });
  return s;
}
const specDi = selettore => { const out = []; sp(r => r.each(sel => out.push(specSel(sel)))).processSync(selettore); return out; };

// ── famiglie di proprietà (prudenti: raggruppano più del necessario)
function famiglia(p) {
  p = p.toLowerCase().replace(/^-webkit-|^-moz-/, '');
  if (p.startsWith('--')) return p;
  if (p === 'all') return '*';
  if (p === 'line-height') return 'font';
  if (['top', 'right', 'bottom', 'left'].includes(p)) return 'inset';
  if (['gap', 'row-gap', 'column-gap'].includes(p)) return 'grid';
  if (/^(align|justify|place)-/.test(p)) return 'place';
  if (/^(min-|max-)?width$/.test(p)) return 'width';
  if (/^(min-|max-)?height$/.test(p)) return 'height';
  if (/^(min-|max-)?(inline|block)-size$/.test(p)) return 'size-logica';
  const t = p.split('-')[0];
  if (['margin', 'padding', 'border', 'outline', 'background', 'font', 'text', 'flex', 'grid', 'inset', 'transition', 'animation', 'overflow', 'list', 'columns', 'column', 'mask', 'scroll', 'inline', 'block'].includes(t)) return t === 'column' ? 'columns' : t;
  return p;
}
const interferiscono = (a, b) => a === '*' || b === '*' || a === b;

// ── tutte le regole e dichiarazioni in ordine di cascata (si ricostruisce dopo ogni modifica)
let regole = [], tutte = [];   // regola: { foglio, rule, ctx, sels, specs, decls:[{ d, p, fam, imp, ord, reg }] }
const animate = new Set();
function costruisci() {
  let pos = 0; regole = [];
  for (const fo of fogli) {
    fo.root.walk(n => {
      if (n.type === 'atrule' && /keyframes$/i.test(n.name)) { n.walkDecls(d => animate.add(famiglia(d.prop))); return; }
      if (n.type !== 'rule') return;
      for (let p = n.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return;
      const ctx = []; for (let p = n.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule') ctx.unshift('@' + p.name + ' ' + norm(p.params));
      let specs; try { specs = specDi(n.selector); } catch (e) { specs = [[9, 9, 9]]; }
      const reg = { foglio: fo, rule: n, ctx: ctx.join(' | '), sels: n.selectors.map(norm), specs, decls: [] };
      n.each(d => { if (d.type === 'decl') reg.decls.push({ d, p: d.prop, fam: famiglia(d.prop), imp: !!d.important, ord: pos++, reg }); });
      regole.push(reg);
    });
  }
  tutte = regole.flatMap(r => r.decls);
}
costruisci();

// stili in linea: proprietà scritte da JavaScript o nei template
function famiglieInLinea() {
  const fam = new Set(); let tutto = false;
  const testi = [];
  const giro = d => { for (const x of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, x.name); if (x.isDirectory()) giro(p); else if (/\.(js|html)$/.test(x.name)) testi.push(fs.readFileSync(p, 'utf8')); } };
  giro('src/js'); ['src/corpo.html', 'src/testa.html', 'src/coda.html'].forEach(f => testi.push(fs.readFileSync(f, 'utf8')));
  const kebab = s => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  for (const t of testi) {
    for (const m of t.matchAll(/\.style\.([a-zA-Z]+)\s*=/g)) fam.add(famiglia(kebab(m[1])));
    for (const m of t.matchAll(/\.style\.setProperty\(\s*['"`]([^'"`]+)/g)) fam.add(famiglia(m[1]));
    if (/\.style\.cssText|setAttribute\(\s*['"]style/.test(t)) tutto = true;
    for (const m of t.matchAll(/style=\\?["']([^"']*)\\?["']/g)) {
      const v = m[1];
      if (v.includes('${') && !/^[^$]*(\$\{[^}]*\}[^$]*)*$/.test(v)) tutto = true;
      const pezzi = v.split(';').map(x => x.trim()).filter(Boolean);
      for (const x of pezzi) { const k = x.split(':')[0].trim(); if (/^[a-z-]+$/.test(k)) fam.add(famiglia(k)); else tutto = true; }
    }
  }
  return { fam, tutto };
}

// ── scrittura e riepilogo
const CASI = path.join(R, 'docs/egm/fase-e/casi.md');
function scriviCasi(titolo, righe) {
  let t = fs.existsSync(CASI) ? fs.readFileSync(CASI, 'utf8') : '# Fase E — casi non risolti dagli script\n\nGenerato da `tools/riordino/css_riordina.js`: per ogni modo, cosa resta e perché.\n';
  const inizio = `\n## ${titolo}\n`;
  const i = t.indexOf(inizio);
  if (i >= 0) { const j = t.indexOf('\n## ', i + 1); t = t.slice(0, i) + (j >= 0 ? t.slice(j) : ''); }
  t = t.replace(/\n*$/, '\n') + inizio + '\n' + righe.join('\n') + '\n';
  if (!PROVA) fs.writeFileSync(CASI, t);
}
function salvaFogli(toccati) {
  if (PROVA) return;
  for (const fo of toccati) {
    // regole rimaste vuote (solo commenti o niente) e @media vuote spariscono
    fo.root.walkRules(r => { if (!r.nodes.some(n => n.type === 'decl')) { const prima = r.prev(); if (prima && prima.type === 'comment' && !/\n\s*\n/.test(r.raws.before || '')) prima.remove(); r.remove(); } });
    fo.root.walkAtRules(a => { if (/media/i.test(a.name) && !a.nodes.some(n => n.type !== 'comment')) a.remove(); });
    fs.writeFileSync(path.join('src', fo.f), fo.root.toString());
  }
}
const dove = r => `${r.foglio.f}:${r.rule.source.start.line}`;

// ══ tavolozza ════════════════════════════════════════════════════════════════
function tavolozza() {
  // regola della radice: ogni selettore è un solo composto di html, :root, [data-theme], [data-contrast], :not(...) di questi
  const radice = sel => { let ok = true; sp(r => r.each(s => { s.each(n => { if (n.type === 'combinator') ok = false; else if (n.type === 'tag') ok = ok && n.value === 'html'; else if (n.type === 'pseudo') ok = ok && (n.value === ':root' || (n.value === ':not' && n.nodes.every(x => x.nodes.every(y => y.type === 'attribute' && /^data-(theme|contrast)$/.test(y.attribute))))); else if (n.type === 'attribute') ok = ok && /^data-(theme|contrast)$/.test(n.attribute); else ok = false; }); })).processSync(sel); return ok; };
  const reg = regole.filter(r => !r.foglio.esterno && r.decls.some(d => d.p.startsWith('--')) && r.rule.selectors.every(radice));
  const fuori = regole.filter(r => !r.foglio.esterno && !reg.includes(r) && r.decls.some(d => d.p.startsWith('--')));
  // vale nello stato? (selettore e contesto)
  const valeSel = (sel, st) => { let ok = true; sp(r => r.each(s => s.each(n => {
    const attr = a => a.attribute === 'data-theme' ? st.tema === a.value : a.attribute === 'data-contrast' ? (st.alto && a.value === 'alto') : false;
    if (n.type === 'attribute') ok = ok && attr(n);
    else if (n.type === 'pseudo' && n.value === ':not') ok = ok && !n.nodes.some(x => x.nodes.every(y => attr(y)));
  }))).processSync(sel); return ok; };
  const valeCtx = (ctx, st) => !ctx || ctx.split(' | ').every(c => { const m = c.match(/^@media \(prefers-color-scheme: (dark|light)\)$/); if (!m) throw new Error('contesto non gestito per la tavolozza: ' + c); return st.schema === m[1]; });
  const STATI = []; for (const tema of ['light', 'dark']) for (const alto of [false, true]) for (const schema of ['light', 'dark']) STATI.push({ tema, alto, schema });
  const nomi = []; for (const r of reg) for (const d of r.decls) if (d.p.startsWith('--') && !nomi.includes(d.p)) nomi.push(d.p);
  const vince = st => { const m = new Map(); for (const r of reg) { const specs = r.rule.selectors.map((s, i) => valeSel(s, st) ? r.specs[i] : null).filter(Boolean); if (!specs.length || !valeCtx(r.ctx, st)) continue; const sp0 = specs.reduce((a, b) => (cmp(b, a) > 0 ? b : a)); for (const d of r.decls) { if (!d.p.startsWith('--')) continue; const c = m.get(d.p); const k = [d.imp ? 1 : 0, ...sp0, d.ord]; if (!c || k.some((x, i) => x !== c.k[i]) && (() => { for (let i = 0; i < k.length; i++) if (k[i] !== c.k[i]) return k[i] > c.k[i]; return false; })()) m.set(d.p, { k, v: d.d.value, imp: d.imp, r, d }); } } return m; };
  const V = {}; for (const st of STATI) V[`${st.tema}-${st.alto ? 'alto' : 'no'}-${st.schema}`] = vince(st);
  const testo = x => (x ? x.v + (x.imp ? ' !important' : '') : null);
  // il tema del sistema non deve contare (data-theme è sempre impostato)
  for (const tema of ['light', 'dark']) for (const alto of ['no', 'alto']) for (const n of nomi) if (testo(V[`${tema}-${alto}-light`].get(n)) !== testo(V[`${tema}-${alto}-dark`].get(n))) throw new Error(`${n}: cambia col tema del sistema (${tema}, ${alto})`);
  const S = k => V[k + '-light'];
  const usate = new Set([...Object.values(V)].flatMap(m => [...m.values()].map(x => x.r)));
  const B0 = new Map(), B1 = new Map(), B2 = new Map(), B3 = new Map();
  for (const n of nomi) {
    const l = testo(S('light-no').get(n)), d = testo(S('dark-no').get(n)), la = testo(S('light-alto').get(n)), da = testo(S('dark-alto').get(n));
    if (l !== null) B0.set(n, l);
    if (d === null && l !== null) throw new Error(`${n}: definita nel chiaro ma non nello scuro`);
    if (d !== null && d !== l) B1.set(n, d);
    if (la === null && l !== null) throw new Error(`${n}: sparisce col contrasto`);
    if (la !== null && la !== l) B2.set(n, la);
    const gen = B2.has(n) ? B2.get(n) : B1.has(n) ? B1.get(n) : B0.get(n) ?? null;
    if (da === null && gen !== null) throw new Error(`${n}: sparisce con scuro + contrasto`);
    if (da !== null && da !== gen) B3.set(n, da);
  }
  const blocco = (sel, m, nota) => m.size ? `/* ${nota} */\n${sel} {\n${[...m].map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n` : '';
  const file = `/* ══════════════════════════════════════════════════════════════
   Tavolozza: tutte le variabili della radice in un posto solo (fase E del riordino, 23/11).
   Generata da tools/riordino/css_riordina.js tavolozza dai testi che vincevano in ogni stato
   (tema chiaro/scuro × contrasto alto); prima erano sparse in ${reg.length} regole di ${new Set(reg.map(r => r.foglio.f)).size} file (v1, v3, v9, v26, v30, v43, v44.1, v50).
   Per cambiare un colore si modifica qui. data-theme è sempre impostato su <html> dallo script in testa.
   ══════════════════════════════════════════════════════════════ */
${blocco(':root', B0, 'tema chiaro (e base di tutti gli stati)')}${blocco(':root[data-theme="dark"]', B1, 'tema scuro: solo quello che cambia')}${blocco(':root[data-contrast="alto"]', B2, 'contrasto alto (tema chiaro; vale anche nello scuro se non ridefinito sotto)')}${blocco(':root[data-theme="dark"][data-contrast="alto"]', B3, 'tema scuro + contrasto alto')}`;
  // togli le dichiarazioni --x dalle regole della radice
  const toccati = new Set(); let tolte = 0;
  for (const r of reg) for (const d of r.decls) if (d.p.startsWith('--')) { d.d.remove(); tolte++; toccati.add(r.foglio); }
  const mai = reg.filter(r => !usate.has(r));
  console.log(`tavolozza: ${nomi.length} variabili da ${reg.length} regole (${tolte} dichiarazioni); blocchi: chiaro ${B0.size}, scuro ${B1.size}, contrasto ${B2.size}, scuro+contrasto ${B3.size}; regole che non vincevano mai: ${mai.map(dove).join(', ') || 'nessuna'}`);
  if (fuori.length) console.log(`variabili locali lasciate dove sono: ${fuori.map(r => r.sels.join(',') + ' (' + dove(r) + ')').join('; ')}`);
  if (!PROVA) {
    fs.writeFileSync('src/css/core/000-tavolozza.css', file);
    const o = fs.readFileSync('src/ordine.txt', 'utf8');
    if (!o.includes('css/core/000-tavolozza.css')) fs.writeFileSync('src/ordine.txt', o.replace(/^css\//m, 'css/core/000-tavolozza.css\ncss/'));
  } else console.log(file);
  salvaFogli(toccati);
}

// ══ unisci ═══════════════════════════════════════════════════════════════════
function unisci() {
  const fatti = [], bloccati = new Map(), traFile = new Map();
  const blocca = (d, specs, da, a) => {   // la dichiarazione d (selettore con specs) passa tra le posizioni da e a: chi la blocca?
    for (const x of tutte) {
      if (x.ord <= da || x.ord >= a || x.reg === d.reg) continue;
      if (x.imp !== d.imp || !interferiscono(x.fam, d.fam)) continue;
      if (x.reg.specs.some(s => specs.some(t => cmp(s, t) === 0))) return x;
    }
    return null;
  };
  const sposta = (da, a, inTesta) => {
    const nodi = da.rule.nodes.slice();
    const prima = da.rule.prev(); const commento = prima && prima.type === 'comment' && !/\n\s*\n/.test(da.rule.raws.before || '') ? prima : null;
    if (inTesta) { const primo = a.rule.first; for (const n of nodi) { n.remove(); a.rule.insertBefore(primo, n); } }
    else for (const n of nodi) { n.remove(); a.rule.append(n); }
    if (commento) { commento.remove(); (inTesta ? a.rule.prepend.bind(a.rule) : a.rule.insertBefore.bind(a.rule, nodi[0]))(commento); }
    da.rule.remove();
  };
  // un'unione alla volta, poi si ricostruisce il modello
  for (;;) {
    let fatto = false;
    for (const fo of fogli) {
      if (fo.esterno || (SOLO && !fo.f.includes(SOLO))) continue;
      const gruppi = new Map();
      for (const r of regole) if (r.foglio === fo && r.decls.length) { const k = r.ctx + ' :: ' + r.sels.join(', '); (gruppi.get(k) || gruppi.set(k, []).get(k)).push(r); }
      for (const [k, gr] of gruppi) {
        if (gr.length < 2 || gr[0].sels.some(s => ESCLUDI.has(s))) continue;
        for (let i = 0; i + 1 < gr.length; i++) {
          const a = gr[i], b = gr[i + 1], chiave = `${k}|${a.rule.source.start.line}|${b.rule.source.start.line}`;
          if (bloccati.has(chiave)) continue;
          let x = null; for (const d of a.decls) { x = blocca(d, a.specs, d.ord, b.decls[0].ord); if (x) break; }
          if (!x) { sposta(a, b, true); fatti.push(`${k.split(' :: ')[1]} (${fo.f}:${a.rule.source.start.line} → ${b.rule.source.start.line})`); fatto = true; break; }
          let y = null; for (const d of b.decls) { y = blocca(d, b.specs, a.decls[a.decls.length - 1].ord, d.ord); if (y) break; }
          if (!y) { sposta(b, a, false); fatti.push(`${k.split(' :: ')[1]} (${fo.f}:${b.rule.source.start.line} → ${a.rule.source.start.line})`); fatto = true; break; }
          bloccati.set(chiave, `- \`${k.split(' :: ')[1]}\`${a.ctx ? ' in `' + a.ctx + '`' : ''} (${fo.f}, righe ${a.rule.source.start.line} e ${b.rule.source.start.line}): in mezzo \`${x.reg.sels.join(', ').slice(0, 90)}\` { ${x.p} } (${dove(x.reg)})${y !== x ? ` e \`${y.reg.sels.join(', ').slice(0, 90)}\` { ${y.p} } (${dove(y.reg)})` : ''}`);
        }
        if (fatto) break;
      }
      if (fatto) break;
    }
    if (!fatto) break;
    costruisci();
  }
  // selettori ripetuti tra file diversi (non si uniscono)
  const perSel = new Map(); for (const r of regole) if (!r.foglio.esterno) for (const s of r.sels) { const k = (r.ctx ? r.ctx + ' :: ' : '') + s; const f = perSel.get(k) || new Set(); f.add(r.foglio.f.replace(/^css\//, '')); perSel.set(k, f); }
  for (const [k, f] of perSel) if (f.size > 1) traFile.set(k, [...f]);
  console.log(`unisci: ${fatti.length} unioni, ${bloccati.size} coppie bloccate, ${traFile.size} selettori ripetuti tra file (non toccati)`);
  if (PROVA) fatti.forEach(x => console.log('  ' + x));
  scriviCasi('Selettori ripetuti nello stesso file che restano separati', bloccati.size ? [...bloccati.values()] : ['nessuno']);
  scriviCasi('Selettori ripetuti tra file diversi (rinviati: unirli sposterebbe regole tra file)', [...traFile].map(([k, f]) => `- \`${k}\`: ${f.join(', ')}`));
  salvaFogli(new Set(fogli.filter(f => !f.esterno && (!SOLO || f.f.includes(SOLO)))));
}

// ══ importanti ═══════════════════════════════════════════════════════════════
function importanti() {
  const { fam: inLinea, tutto } = famiglieInLinea();
  const restano = [], tolti = [], coperte = [];
  // dichiarazioni che non valgono mai: coperte da `html:root S` (stessi elementi, specificità maggiore)
  const perCtxSel = new Map(); for (const r of regole) if (!r.foglio.esterno) for (const s of r.sels) { const k = r.ctx + ' :: ' + s; (perCtxSel.get(k) || perCtxSel.set(k, []).get(k)).push(r); }
  for (const r of regole) {
    if (r.foglio.esterno || r.sels.length !== 1 || ESCLUDI.has(r.sels[0])) continue;
    const s = r.sels[0]; if (/^(html|:root)\b/.test(s) || /:root/.test(s)) continue;
    const alti = perCtxSel.get(r.ctx + ' :: html:root ' + s) || [];
    for (const d of r.decls.slice()) {
      const o = alti.flatMap(x => x.decls).find(x => x.p === d.p && (x.imp || !d.imp));
      if (o) { coperte.push(`\`${s}\` { ${d.p} } (${dove(r)}) coperta da \`html:root ${s}\` (${dove(o.reg)})`); d.d.remove(); r.decls.splice(r.decls.indexOf(d), 1); tutte.splice(tutte.indexOf(d), 1); }
    }
  }
  for (const d of tutte) {
    if (!d.imp || d.reg.foglio.esterno) continue;
    const r = d.reg, s0 = r.sels.join(', ');
    const motivo = (() => {
      if (r.sels.some(s => ESCLUDI.has(s))) return 'escluso a mano';
      if (/@media print|prefers-reduced-motion/.test(r.ctx)) return 'stampa o riduci movimento';
      if (r.sels.some(s => s === '*' || /^\*|\s\*|\[hidden\]/.test(s))) return 'selettore universale o [hidden]';
      if (d.p.startsWith('--')) return 'variabile';
      if (tutto || inLinea.has(d.fam) || inLinea.has('*')) return 'proprietà scritta in linea da JavaScript o nei template';
      if (animate.has(d.fam)) return 'proprietà animata da un @keyframes';
      for (const o of tutte) {
        if (o === d || !interferiscono(o.fam, d.fam)) continue;
        for (const so of o.reg.specs) for (const sd of r.specs) {
          const c = cmp(so, sd);
          if (!o.imp && (c > 0 || (c === 0 && o.ord > d.ord))) return `batterebbe \`${o.reg.sels.join(', ').slice(0, 80)}\` { ${o.p} } (${dove(o.reg)})`;
          if (o.imp && (c < 0 || (c === 0 && o.ord < d.ord))) return `vincerebbe \`${o.reg.sels.join(', ').slice(0, 80)}\` { ${o.p} !important } (${dove(o.reg)})`;
        }
      }
      return null;
    })();
    if (motivo) restano.push(`- \`${s0.slice(0, 100)}\` { ${d.p} } (${dove(r)}): ${motivo}`);
    else { tolti.push(`${s0} { ${d.p} } (${dove(r)})`); d.d.important = false; d.d.raws.important = undefined; }
  }
  console.log(`importanti: ${coperte.length} dichiarazioni coperte tolte, ${tolti.length} !important tolti, ${restano.length} restano`);
  if (PROVA) { coperte.forEach(x => console.log('  coperta: ' + x)); tolti.forEach(x => console.log('  tolto: ' + x)); }
  scriviCasi('!important che restano', restano.length ? restano : ['nessuno']);
  salvaFogli(new Set(fogli.filter(f => !f.esterno)));
}

({ tavolozza, unisci, importanti }[MODO] || (() => { console.error('modo: tavolozza | unisci | importanti'); process.exit(2); }))();
