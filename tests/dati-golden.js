// Dati, ora fissa e viste del golden master (t52): li riusa anche tools/riordino/stili.js (fase E).
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
module.exports = { ORA, events, seed, cosa, chiudiFogli, VISTE };
