// ╔════════════════════════════════════════════════════════════╗
// ║ PARTE 1 — LOGICA (da index.legacy.html, comportamento       ║
// ║ invariato: dati, Supabase, agenda, piano, routine, Calendar)║
// ╚════════════════════════════════════════════════════════════╝
// ══════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://qujxbvootvollmziaqrd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1anhidm9vdHZvbGxtemlhcXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NzAyNjksImV4cCI6MjA5NjQ0NjI2OX0.WkUak4mQP-lwdaH-LIRV4unP6PljlcguiDXxjCkBEyE';

const LS = {
  CLAUDE_KEY: 'cicli_claude_key',
  CTX:        'cicli_ctx',
  VIEW:       'cicli_view',
  WEEK:       'cicli_week',
  CAT_FILTER: 'cicli_cat_filter',
  THEME:      'cicli_theme',
  AGENDA_SUB: 'cicli_agenda_sub'
};

const CAT_COLORS = {
  management:'cat-management', hr:'cat-hr', marketing:'cat-marketing',
  vendite:'cat-vendite', amministrazione:'cat-amministrazione',
  produzione:'cat-produzione', rnd:'cat-rnd', 'da-delegare':'cat-da-delegare',
  salute:'cat-salute', relazioni:'cat-relazioni', finanze:'cat-finanze',
  crescita:'cat-crescita', hobbies:'cat-hobbies', spiritualita:'cat-spiritualita',
  casa:'cat-casa', idee:'cat-idee'
};

const CAT_LABELS = {
  management:'Management', hr:'HR', marketing:'Marketing', vendite:'Vendite',
  amministrazione:'Amm.', produzione:'Produzione', rnd:'R&D', 'da-delegare':'Delega',
  salute:'Salute', relazioni:'Relazioni', finanze:'Finanze', crescita:'Crescita',
  hobbies:'Hobbies', spiritualita:'Spiritualità', casa:'Casa', idee:'Idee'
};

const CAT_EMOJIS = {
  management:'', hr:'', marketing:'', vendite:'',
  amministrazione:'', produzione:'', rnd:'', 'da-delegare':'',
  salute:'', relazioni:'', finanze:'', crescita:'',
  hobbies:'', spiritualita:'', casa:'', idee:''
};

// ── AGENDA SETTIMANALE ──
const GIORNI = [
  { key:'lunedi',    short:'LUN', label:'Lunedì' },
  { key:'martedi',   short:'MAR', label:'Martedì' },
  { key:'mercoledi', short:'MER', label:'Mercoledì' },
  { key:'giovedi',   short:'GIO', label:'Giovedì' },
  { key:'venerdi',   short:'VEN', label:'Venerdì' },
  { key:'sabato',    short:'SAB', label:'Sabato' },
  { key:'domenica',  short:'DOM', label:'Domenica' }
];

const FASCE = [
  { key:'mattina',    emoji:'', label:'Mattina' },
  { key:'pomeriggio', emoji:'', label:'Pomeriggio' },
  { key:'sera',       emoji:'', label:'Sera' }
];

const FASCIA_NULL = '__none__';   // pseudo-fascia "Non specificato"

const CAT_FALLBACK_EMOJI = '';

const RIP_LABELS = { giornaliera:'Giornaliera', settimanale:'Settimanale', mensile:'Mensile', trimestrale:'Trimestrale', annuale:'Annuale' };

// Categorie builtin per contesto (unica fonte: usate da sidebar e modale)
const CAT_BUILTIN = {
  lavoro:    ['management','hr','marketing','vendite','amministrazione','produzione','rnd','da-delegare','idee'],
  personale: ['salute','relazioni','finanze','crescita','hobbies','spiritualita','casa','idee']
};

const GIORNI_MAP = Object.fromEntries(GIORNI.map(g => [g.key, g]));
const FASCE_MAP  = Object.fromEntries(FASCE.map(f => [f.key, f]));

