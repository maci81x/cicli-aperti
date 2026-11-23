// Fase E: stile calcolato di ogni elemento in una serie di scenari, per controllare che un riordino del CSS non cambi l'aspetto.
// Uso (dalla radice):
//   node tools/riordino/stili.js . <uscita.json> [--solo <nome-scenario>]     → salva
//   node tools/riordino/stili.js --confronta <prima.json> <dopo.json>         → «differenze: N» (uscita 1 se N > 0)
// Dati, ora e viste: tests/dati-golden.js (gli stessi di t52). Chiave di un elemento: percorso di indici dei figli da <html>
// (l'HTML non cambia nella fase E). Si salvano tutte le proprietà di getComputedStyle, più ::before, ::after, ::placeholder,
// ::marker quando esistono. Transizioni e animazioni spente con un foglio aggiunto (uguale prima e dopo).
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);

if (argv[0] === '--confronta') {
  const [a, b] = [JSON.parse(fs.readFileSync(argv[1], 'utf8')), JSON.parse(fs.readFileSync(argv[2], 'utf8'))];
  let n = 0; const righe = [];
  for (const sc of new Set([...Object.keys(a.scenari), ...Object.keys(b.scenari)])) {
    const x = a.scenari[sc], y = b.scenari[sc];
    if (!x || !y) { n++; righe.push(`${sc}: scenario presente solo in uno dei due`); continue; }
    const px = a.liste[x.p], py = b.liste[y.p];
    const ex = x.el, ey = y.el;
    for (const k of new Set([...Object.keys(ex), ...Object.keys(ey)])) {
      if (!(k in ex) || !(k in ey)) { n++; righe.push(`${sc} ${k}: elemento presente solo in uno dei due`); continue; }
      const sx = a.stili[ex[k].s], sy = b.stili[ey[k].s];
      if (ex[k].t !== ey[k].t) { n++; righe.push(`${sc} ${k}: elemento diverso ${ex[k].t} → ${ey[k].t}`); continue; }
      if (sx === sy && px === py) continue;
      const vx = sx.split('\u0001'), vy = sy.split('\u0001');
      px.forEach((p, i) => { const j = py.indexOf(p); if (vx[i] !== vy[j]) { n++; if (righe.length < 200) righe.push(`${sc} ${k} <${ex[k].t}> ${p}: «${vx[i]}» → «${vy[j]}»`); } });
    }
  }
  righe.forEach(r => console.log(r));
  console.log(`differenze: ${n}`);
  process.exit(n ? 1 : 0);
}

const R = path.resolve(argv[0]), USCITA = argv[1], SOLO = argv[2] === '--solo' ? argv[3] : null;
process.env.NM = process.env.NM || path.join(R, 'tests/node_modules');
const { apriApp } = require(path.join(R, 'tests/harness'));
const { ORA, events, seed, cosa, chiudiFogli, VISTE } = require(path.join(R, 'tests/dati-golden'));
// un passo in più nel seme (per il dettaglio di un passo, v52), solo qui: t52 resta com'è
const semeStili = { ...seed, cicli: [...seed.cicli, cosa('ps', 'Chiamare il broker', { q: 2, parent_id: 'g', pianificato_data: '2026-11-19' })] };
const TESTO_RAPIDO = 'Chiamare il commercialista domani alle 10\nSpesa:\n- latte\n- pane\nSubito: mandare il preventivo a Rossi';

// azioni in più oltre alle viste di t52
const FOGLI = {
  dettaglio: async p => { await p.evaluate(() => { vai('oggi'); apriDettaglio('i'); }); },
  'dettaglio-passo': async p => { await p.evaluate(() => { vai('oggi'); apriDettaglio('ps'); }); },
  rapido: async p => { await p.evaluate(() => apriRapido()); await p.waitForTimeout(300); await p.fill('#rapido-testo', TESTO_RAPIDO); },
  quando: async p => { await p.evaluate(() => { vai('oggi'); azioneQuando('w'); }); }
};
// dispositivi: telefono, computer stretto (tra 768 e 1100), computer largo
const DISP = { telefono: { mobile: true }, medio: { viewport: { width: 900, height: 900 } }, computer: { viewport: { width: 1440, height: 900 } } };
const TUTTE = [...Object.keys(VISTE), ...Object.keys(FOGLI)];
const SCENARI = [];
for (const d of Object.keys(DISP)) for (const tema of ['light', 'dark']) SCENARI.push({ d, tema, viste: d === 'medio' ? ['oggi', 'settimana', 'giorno', 'lista', 'dettaglio'] : TUTTE });
for (const tema of ['light', 'dark']) SCENARI.push({ d: 'computer', tema, alto: true, viste: ['oggi', 'settimana', 'smaltisci', 'dettaglio'] }, { d: 'telefono', tema, alto: true, viste: ['oggi', 'settimana'] });
SCENARI.push({ d: 'computer', tema: 'light', sistema: 'dark', viste: ['oggi', 'settimana', 'dettaglio'] }, { d: 'computer', tema: 'dark', sistema: 'dark', viste: ['oggi', 'settimana', 'dettaglio'] });
SCENARI.push({ d: 'telefono', tema: 'light', scala: '125', viste: ['oggi', 'settimana'] });
SCENARI.push({ d: 'computer', tema: 'light', stampa: true, viste: ['oggi', 'settimana'] });

(async () => {
  const out = { liste: [], stili: [], scenari: {} }; const indice = new Map();
  for (const s of SCENARI) {
    const base = `${s.d}-${s.tema}${s.alto ? '-alto' : ''}${s.sistema ? '-sistema-' + s.sistema : ''}${s.scala ? '-testo' + s.scala : ''}${s.stampa ? '-stampa' : ''}`;
    if (SOLO && !SOLO.startsWith(base)) continue;
    const ls = { cicli_theme: s.tema, ...(s.alto ? { contrasto: 'alto' } : {}), ...(s.scala ? { testo_scala: s.scala } : {}) };
    const { browser, page } = await apriApp({ ...DISP[s.d], ora: ORA, events, seed: semeStili, attesa: 4500, localStorage: ls, colorScheme: s.sistema || 'light' });
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }' });
    if (s.stampa) await page.emulateMedia({ media: 'print' });
    for (const v of s.viste) {
      const nome = `${base}/${v}`;
      if (SOLO && SOLO !== base && SOLO !== nome) continue;
      await page.evaluate(chiudiFogli); await page.evaluate(() => { const r = document.getElementById('rapido-testo'); if (r) r.value = ''; });
      await (VISTE[v] || FOGLI[v])(page); await page.waitForTimeout(900);
      await page.evaluate(() => { const m = document.getElementById('main'); if (m) m.scrollTop = 0; window.scrollTo(0, 0); });
      const r = await page.evaluate(() => {
        const PSEUDO = ['::before', '::after', '::placeholder', '::marker'];
        const props = [...getComputedStyle(document.documentElement)].sort();
        const voci = [];
        const visita = (el, chiave) => {
          const cs = getComputedStyle(el);
          voci.push([chiave, el.tagName.toLowerCase(), props.map(p => cs.getPropertyValue(p)).join('\u0001')]);
          for (const ps of PSEUDO) {
            const c = getComputedStyle(el, ps);
            if (ps === '::before' || ps === '::after') { if (c.content === 'none' || c.content === 'normal') continue; }
            else if (ps === '::placeholder' && !('placeholder' in el && el.placeholder)) continue;
            else if (ps === '::marker' && cs.display !== 'list-item') continue;
            voci.push([chiave + ps, el.tagName.toLowerCase() + ps, props.map(p => c.getPropertyValue(p)).join('\u0001')]);
          }
          [...el.children].forEach((f, i) => visita(f, chiave + '/' + i));
        };
        visita(document.documentElement, 'html');
        return { props, voci };
      });
      let li = out.liste.findIndex(l => l.join() === r.props.join()); if (li < 0) { li = out.liste.length; out.liste.push(r.props); }
      const mappa = {};
      for (const [k, t, st] of r.voci) { let i = indice.get(st); if (i === undefined) { i = out.stili.length; out.stili.push(st); indice.set(st, i); } mappa[k] = { t, s: i }; }
      out.scenari[nome] = { p: li, el: mappa };
      process.stderr.write(`${nome}: ${r.voci.length} elementi\n`);
    }
    await browser.close();
  }
  fs.writeFileSync(USCITA, JSON.stringify(out));
  console.log(`scenari ${Object.keys(out.scenari).length}, stili diversi ${out.stili.length}, ${(fs.statSync(USCITA).size / 1e6).toFixed(1)} MB → ${USCITA}`);
})().catch(e => { console.error('errore', e.message); process.exit(2); });
