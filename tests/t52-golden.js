// Riordino · rete di sicurezza 2 (golden master): con dati e ora fissi, l'HTML delle viste e le schermate
// devono restare quelli del riferimento (v50).
// - HTML di #view: Oggi, Pianifica › Settimana, Pianifica › Giorno, Tutto › Lista, Tutto › Matrice, Un giorno, Altro;
//   Smaltisci = HTML del foglio #v49Overlay. Telefono e computer.
// - avvisi in console (warning/error) uguali al riferimento: uno strato chiuso in try/catch che si rompe lascia solo un avviso.
// - 16 schermate: Oggi, Pianifica (Settimana), Smaltisci, Tutto › Matrice × telefono/computer × chiaro/scuro, confronto pixel per pixel:
//   passa con al massimo lo 0,1% di pixel diversi; altrimenti salva l'immagine delle differenze in $OUT.
// Le schermate dipendono dalla macchina (caratteri di sistema, Chromium): il riferimento è di questo Mac.
// AGGIORNA=1 node t52-golden.js → riscrive i riferimenti (solo per un cambiamento voluto).
const fs = require('fs'), path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const DIR = path.join(__dirname, 'riferimento');
const OUT = process.env.OUT || '/tmp';
const AGGIORNA = process.env.AGGIORNA === '1';
const SOGLIA = 0.001;

const ORA = '2026-11-19T08:30:00+01:00';
const io = { email: 'io@esempio.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const evento = (id, summary, d, h1, h2, extra) => ({ id, status: 'confirmed', summary, start: { dateTime: T(d, h1) }, end: { dateTime: T(d, h2) }, organizer: io, creator: io, ...extra });
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  evento('co', 'Coach Leo', '19', '10:00', '11:00', { attendees: [{ email: 'coach@esempio.it' }, { ...io }] }),
  evento('ri', 'Riunione soci', '19', '15:00', '16:30'),
  evento('bp', 'Prepara il Business Plan', '20', '14:00', '16:00'),
  evento('pr', 'Preventivo cliente Rossi', '24', '09:00', '10:00', { attendees: [{ email: 'cliente@esempio.it' }, { ...io }] })
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const cosa = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', macro_area: 'Vendite', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = {
  persone: [{ id: 'pn', nome: 'Nicco', ctx: 'lavoro' }],
  cicli: [
    cosa('v', 'Chiamare il notaio', { pianificato_data: '2026-11-16' }),
    cosa('v2', 'Mandare i KPI ai soci', { q: 2, pianificato_data: '2026-11-17' }),
    cosa('w', 'Report soci', { pianificato_data: '2026-11-19' }),
    cosa('i', 'Piano formazione 2027', { q: 2, pianificato_data: '2026-11-19', scheduled_time: '11:30', durata_minuti: 60 }),
    cosa('d', 'Contratto fornitore', { q: 3, delega_persona_id: 'pn', delega_controllo: '2026-11-21' }),
    cosa('g', 'Rinnovo assicurazione', { q: 2, due_date: '2026-11-28' }),
    cosa('p', 'SSI – report amministrativo', { fonte: 'posta', posta_tipo: 'da_fare', due_date: '2026-11-20' }),
    cosa('x', 'Ordinare la cancelleria', { q: 4 }),
    cosa('u', 'Rifare il sito un giorno', { q: 4, parcheggiato: true, parcheggiato_at: ora }),
    cosa('f1', 'Chiamare il fornitore', { q: 2, pianificato_data: '2026-11-17', durata_minuti: 45, done: true, chiuso_at: '2026-11-17T11:00:00+01:00' }),
    cosa('f2', 'Rispondere a Nicco', { q: 1, pianificato_data: '2026-11-19', durata_minuti: 15, done: true, chiuso_at: '2026-11-19T08:10:00+01:00' })
  ],
  obiettivi_settimana: [{ settimana_anno: '2026-W47', voci: [{ testo: 'Chiudere il budget', fatto: false }, { testo: 'Due clienti nuovi', fatto: true }] }]
};

const chiudiFogli = () => document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
const VISTE = {
  oggi: async page => { await page.evaluate(() => vai('oggi')); },
  settimana: async page => { await page.evaluate(() => { ui.sub = null; ui.pian = 'settimana'; vai('pianifica'); }); },
  giorno: async page => { await page.evaluate(() => { ui.sub = null; ui.pian = 'giorno'; vai('pianifica'); }); },
  smaltisci: async page => { await page.evaluate(() => { vai('oggi'); v49Apri(); }); },
  lista: async page => { await page.evaluate(() => { ui.sub = null; vai('tutto', { tutto: 'lista' }); }); },
  matrice: async page => { await page.evaluate(() => { ui.sub = null; vai('tutto', { tutto: 'matrice' }); }); },
  ungiorno: async page => { await page.evaluate(() => { vai('tutto'); ui.sub = 'attesa'; render(); }); },
  altro: async page => { await page.evaluate(() => { ui.sub = null; vai('altro'); }); }
};
const htmlDi = (page, vista) => page.evaluate(v => {
  const el = v === 'smaltisci' ? document.getElementById('v49Overlay') : document.getElementById('view');
  return el ? el.innerHTML : '(manca)';
}, vista);

function confrontaHtml(nome, html) {
  const file = path.join(DIR, 'golden', nome + '.html');
  if (AGGIORNA || !fs.existsSync(file)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, html); }
  const rif = fs.readFileSync(file, 'utf8');
  if (rif === html) return a(true, `HTML ${nome} uguale (${html.length} caratteri)`);
  let i = 0; while (i < rif.length && rif[i] === html[i]) i++;
  fs.writeFileSync(path.join(OUT, `golden_${nome}.html`), html);
  a(false, `HTML ${nome} diverso dal riferimento al carattere ${i}: «…${rif.slice(Math.max(0, i - 60), i + 60)}…» → «…${html.slice(Math.max(0, i - 60), i + 60)}…» (nuovo in ${OUT}/golden_${nome}.html)`);
}

function confrontaSchermata(nome, buf) {
  const file = path.join(DIR, 'schermate', nome + '.png');
  if (AGGIORNA || !fs.existsSync(file)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); }
  const x = PNG.sync.read(fs.readFileSync(file)), y = PNG.sync.read(buf);
  if (x.width !== y.width || x.height !== y.height) return a(false, `schermata ${nome}: misure diverse ${x.width}×${x.height} → ${y.width}×${y.height}`);
  const diff = new PNG({ width: x.width, height: x.height });
  const n = pixelmatch(x.data, y.data, diff.data, x.width, x.height, { threshold: 0.1 });
  const quota = n / (x.width * x.height);
  if (quota > SOGLIA) { fs.writeFileSync(path.join(OUT, `diff_${nome}.png`), PNG.sync.write(diff)); fs.writeFileSync(path.join(OUT, `nuova_${nome}.png`), buf); }
  a(quota <= SOGLIA, `schermata ${nome}: ${(quota * 100).toFixed(3)}% di pixel diversi (${n})${quota > SOGLIA ? ` → ${OUT}/diff_${nome}.png` : ''}`);
}

// Avvisi in console (console.warn/error): molti strati sono chiusi in try/catch con console.warn, quindi un pezzo che
// si rompe darebbe solo un avviso nuovo. L'elenco (rumore di rete escluso) deve restare quello del riferimento.
const avvisiDi = logs => [...new Set(logs.filter(l => !/404|finta|Failed to load resource|ERR_|net::|WebSocket/.test(l)))].sort();
function confrontaAvvisi(nome, elenco) {
  const file = path.join(DIR, 'golden', 'avvisi_' + nome + '.json'), t = JSON.stringify(elenco, null, 1) + '\n';
  if (AGGIORNA || !fs.existsSync(file)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, t); }
  const rif = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nuovi = elenco.filter(x => !rif.includes(x)), spariti = rif.filter(x => !elenco.includes(x));
  a(!nuovi.length && !spariti.length, `${nome}: avvisi in console come nel riferimento (${elenco.length})` + (nuovi.length ? ' nuovi ' + JSON.stringify(nuovi.slice(0, 3)) : '') + (spariti.length ? ' spariti ' + JSON.stringify(spariti.slice(0, 3)) : ''));
}

async function dispositivo(nome, opzioni) {
  const { browser, page, logs } = await apriApp({ ...opzioni, ora: ORA, events, seed, attesa: 4500 });
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }' });
  for (const [vista, apri] of Object.entries(VISTE)) {
    await page.evaluate(chiudiFogli); await apri(page); await page.waitForTimeout(900);
    confrontaHtml(`${vista}_${nome}`, await htmlDi(page, vista));
  }
  for (const tema of ['chiaro', 'scuro']) {
    await page.evaluate(t => { document.documentElement.setAttribute('data-theme', t === 'scuro' ? 'dark' : 'light'); }, tema);
    for (const vista of ['oggi', 'settimana', 'smaltisci', 'matrice']) {
      await page.evaluate(chiudiFogli); await VISTE[vista](page); await page.waitForTimeout(900);
      await page.evaluate(() => { const m = document.getElementById('main'); if (m) m.scrollTop = 0; });
      confrontaSchermata(`${{ settimana: 'pianifica', matrice: 'tutto-matrice' }[vista] || vista}_${nome}_${tema}`, await page.screenshot({ animations: 'disabled', caret: 'hide' }));
    }
  }
  { const e = errori(logs); a(!e.length, `${nome}: console pulita ` + JSON.stringify(e.slice(0, 3))); }
  confrontaAvvisi(nome, avvisiDi(logs));
  await browser.close();
}

(async () => {
  await dispositivo('computer', { viewport: { width: 1440, height: 900 } });
  await dispositivo('telefono', { mobile: true });
  if (AGGIORNA) console.log('riferimenti riscritti in ' + DIR);
})().catch(e => { console.log('FAIL errore', e.message); process.exitCode = 1; });
