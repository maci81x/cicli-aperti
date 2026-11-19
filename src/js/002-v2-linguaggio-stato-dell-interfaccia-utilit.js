// v2 · LINGUAGGIO, STATO DELL'INTERFACCIA, UTILITÀ
// ══════════════════════════════════════════════════════════════
// Mappa del linguaggio (DESIGN_SYSTEM.md): il termine OSM resta nel suggerimento.
const TIPI = {
  1: { label: 'Subito',       icon: 'ti-flame',      aiuto: 'Va fatta oggi',  osm: 'Q1 · Crisi: urgente e importante' },
  2: { label: 'Importante',   icon: 'ti-target',     aiuto: 'Scegli quando',  osm: 'Q2 · Qualità: importante, non urgente' },
  3: { label: 'Delega',       icon: 'ti-user-share', aiuto: 'La fa un altro', osm: 'Q3 · Inganno: urgente, non importante' },
  4: { label: 'Lascia stare', icon: 'ti-wind',       aiuto: 'Può aspettare',  osm: 'Q4 · Spreco: né urgente né importante' }
};
const CAT_ICONE = {
  management: 'ti-briefcase', hr: 'ti-users', marketing: 'ti-speakerphone', vendite: 'ti-coin',
  amministrazione: 'ti-clipboard-text', produzione: 'ti-settings', rnd: 'ti-flask', 'da-delegare': 'ti-send',
  salute: 'ti-heartbeat', relazioni: 'ti-heart', finanze: 'ti-wallet', crescita: 'ti-book',
  hobbies: 'ti-ball-football', spiritualita: 'ti-moon', casa: 'ti-home', idee: 'ti-bulb'
};
const CAT_ICONE_SCELTA = ['ti-tag', 'ti-briefcase', 'ti-users', 'ti-coin', 'ti-clipboard-text', 'ti-home', 'ti-heart',
  'ti-heartbeat', 'ti-book', 'ti-bulb', 'ti-yoga', 'ti-building-store', 'ti-car', 'ti-plane', 'ti-school', 'ti-tools',
  'ti-chart-bar', 'ti-star'];
const RIP_PASSO = { settimanale: { giorni: 7 }, mensile: { mesi: 1 }, trimestrale: { mesi: 3 }, annuale: { mesi: 12 } };
const LS2 = { TAB: 'cicli_tab', ONB: 'cicli_onboarded', RAGGRUPPA: 'cicli_raggruppa' };
const TOAST_MS = 3200, TOAST_ANNULLA_MS = 5000, SWIPE_APRI = 56, SWIPE_FATTO = 96;
const FASCIA_ORE = { mattina: 13, pomeriggio: 18 };   // senza momento: lo si deduce dall'ora

const ui = {
  tab: 'oggi',                 // oggi | pianifica | tutto | altro
  pian: 'settimana',           // settimana | mese (l'agenda è dentro la settimana)
  tutto: 'lista',              // lista | matrice | persone
  sub: null,                   // sottopagina: attesa | fatte | guida | impostazioni
  giorno: 0,                   // giorno selezionato in Pianifica (0 = lunedì)
  weekend: false,
  meseOffset: 0,
  raggruppa: localStorage.getItem(LS2.RAGGRUPPA) || 'tipo',
  q: '',
  filtri: { cats: new Set(), tipi: new Set(), aree: new Set() },
  aperti: new Set(['routine']),  // accordion aperti
  muto: false,                 // true mentre una funzione della logica gira dietro un'azione v2
  eventi: {},                  // appuntamenti Google Calendar per settimana: { 'YYYY-Www': [...] }
  ovMese: null,                // override agenda di tutte le settimane (vista Mese)
  nuovoQuando: 'nessuna',
  cat: { id: null, icona: 'ti-tag', ctx: 'lavoro', poi: null },
  rip: { id: null, v: 'nessuna' },
  rev: { passo: 1, scelte: new Map(), date: new Map() }
};

const $ = id => document.getElementById(id);
const esc = s => escHtml(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const oggiData = () => new Date();
const oggiLocale = () => toISODate(new Date());
const giornoKeyDi = d => GIORNI[(d.getDay() + 6) % 7].key;
const giornoIdxDi = d => (d.getDay() + 6) % 7;
const settKey = (w, y) => `${y}-W${String(w).padStart(2, '0')}`;
const eSettimanaCorrente = () => { const c = bpSettimanaCorrente(); return c.week === state.week && c.year === state.year; };
const fmtGiorno = d => d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
const fmtGiornoLungo = d => d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtCorta = d => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace(/\./g, '');
const plurale = (n, uno, molti) => `${n} ${n === 1 ? uno : molti}`;
const ciclo = id => state.cicli.find(c => c.id === id) || null;

// Ripetizione effettiva. L'annuale vive in cicli.ricorrenza: il CHECK su
// pianificato_ripetizione ammette solo nessuna/giornaliera/settimanale/mensile/trimestrale.
function ripetizioneDi(c) {
  if (!c) return 'nessuna';
  if (c.ricorrenza === 'annuale') return 'annuale';
  return c.pianificato_ripetizione || 'nessuna';
}
function RIP_DB(rip) { return rip === 'annuale' ? 'nessuna' : rip; }

function catIconaTi(cat) {
  if (CAT_ICONE[cat]) return CAT_ICONE[cat];
  const m = /^custom_(.+)$/.exec(cat || '');
  if (m) {
    const found = (state.categorie || []).find(c => String(c.id) === m[1]);
    if (found && /^ti-[a-z0-9-]+$/.test(found.emoji || '')) return found.emoji;
  }
  return 'ti-tag';
}

function tagTipo(q) {
  const t = TIPI[q] || TIPI[2];
  return `<span class="tag tag-q${q}" data-tip="${esc(t.osm)}"><i class="ti ${t.icon}"></i>${t.label}</span>`;
}

function scadenzaHtml(c) {
  if (!c.due_date) return '';
  const n = getDaysLeft(c.due_date);
  const txt = n < 0 ? `scaduta da ${plurale(-n, 'giorno', 'giorni')}` : n === 0 ? 'scade oggi' : n === 1 ? 'scade domani' : `scade tra ${n} giorni`;
  return `<span class="scad${n <= 14 ? ' crit' : ''}">${txt}</span>`;
}

// ══════════════════════════════════════════════════════════════
