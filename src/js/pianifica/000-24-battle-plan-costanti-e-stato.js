// ══════════════════════════════════════════════════════════════
// BATTLE PLAN — COSTANTI E STATO
// ══════════════════════════════════════════════════════════════
const GOOGLE_CLIENT_ID = '257619503185-gqh4iv9f8rkq6uhe9ihlfb394pq1p681.apps.googleusercontent.com';
const GCAL_SCOPE       = 'https://www.googleapis.com/auth/calendar';
const GCAL_CAL_NAME    = 'Cicli Aperti — Battle Plan';
const APP_URL          = 'https://maci81x.github.io/cicli-aperti/';
const GCAL_USER_EMAIL  = 'r.macinai@sisoluzioniimpresa.it';

const MACRO_AREE_LIST = ['Management','Marketing','Vendite','Amministrazione','Produzione','HR','R&D','Personale','Da Delegare'];

const MACRO_AREA_COLORS = {
  'Management':'#7c3aed','Marketing':'#ec4899','Vendite':'#10b981',
  'Amministrazione':'#f59e0b','Produzione':'#3b82f6','HR':'#ef4444',
  'R&D':'#06b6d4','Personale':'#8b5cf6','Da Delegare':'#64748b'
};

const MACRO_AREA_EMOJIS = {
  'Management':'','Marketing':'','Vendite':'','Amministrazione':'',
  'Produzione':'','HR':'','R&D':'','Personale':'','Da Delegare':''
};

// gcal runtime state (not in app state to avoid Supabase realtime loops)
const gcal = {
  token:      localStorage.getItem('gcal_token') || null,
  calendarId: localStorage.getItem('gcal_cal_id') || null,
  email:      localStorage.getItem('gcal_email') || null,
  expiresAt:  parseInt(localStorage.getItem('gcal_expires') || '0'),
  scope:      localStorage.getItem('gcal_scope') || '',
  client:     null   // GIS token client
};
// Per spostare gli appuntamenti serve poter scrivere gli eventi: lo scope «calendar» (completo) o «calendar.events».
const GCAL_SCOPE_EVENTI = 'https://www.googleapis.com/auth/calendar.events';
function haScopeEventi() {
  const s = (gcal.scope || '').split(/\s+/);
  return !gcal.scope || s.includes(GCAL_SCOPE) || s.includes(GCAL_SCOPE_EVENTI);   // vuoto = token di prima, chiesto con «calendar»
}
const gcalEraCollegato = () => !!gcal.email;

let areesWeekOffset  = 0;
let settimanaOffset  = 0;
let meseOffset       = 0;
let _postponeId      = null;
let _autoCatTimer    = null;
let _syncRetryTimer  = null;

