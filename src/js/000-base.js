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

// ══════════════════════════════════════════════════════════════
// INIT SUPABASE
// ══════════════════════════════════════════════════════════════
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════
let state = {
  ctx:              localStorage.getItem(LS.CTX)  || 'lavoro',
  week:             parseInt(localStorage.getItem(LS.WEEK)) || getWeekNumber(new Date()),
  year:             new Date().getFullYear(),
  view:             localStorage.getItem(LS.VIEW) || 'matrix',
  filter_cat:       localStorage.getItem(LS.CAT_FILTER) || null,
  filter_persona:   null,
  cicli:            [],
  persone:          [],
  categorie:        [],
  loading:          true,
  searchQuery:      '',
  personaDetailId:  null,
  agendaSub:        localStorage.getItem(LS.AGENDA_SUB) || 'pianificati',
  agendaOverrides:  [],
  agendaTableOk:    true,
  agendaColsOk:     true,
  parcheggioColsOk: true,
  pianificaColsOk:  true,
  ritualiColsOk:    true,
  ritualiTableOk:   true,
  ritualiCompletati: [],
  parcheggioQuery:  '',
  bp:               null,   // battle_plan della settimana selezionata
  bpItems:          [],     // battle_plan_items del bp corrente
  bpTableOk:        true
};

// ══════════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════════
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getWeekStart(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const iso = new Date(simple);
  const dow = simple.getDay();
  if (dow <= 4) iso.setDate(simple.getDate() - simple.getDay() + 1);
  else iso.setDate(simple.getDate() + 8 - simple.getDay());
  return iso;
}

function formatWeekLabel(week, year) {
  const start = getWeekStart(week, year);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const fmt = d => `${d.getDate()}/${d.getMonth()+1}`;
  return `Sett. ${week} — ${fmt(start)}–${fmt(end)}`;
}

function getEscalation(c) {
  if (!c.due_date) return null;
  const days = Math.ceil((new Date(c.due_date) - new Date()) / 86400000);
  if (days <= 14) return 'crit';
  if (days <= 30) return 'warn';
  return null;
}

function getDaysLeft(due_date) {
  if (!due_date) return null;
  return Math.ceil((new Date(due_date) - new Date()) / 86400000);
}

function formatDaysLeft(n) {
  if (n < 0) return `scaduta da ${Math.abs(n)} giorni`;
  if (n === 0) return 'Oggi';
  if (n === 1) return 'Domani';
  return `tra ${n} giorni`;
}

function computeEffectiveQ(c) {
  const esc = getEscalation(c);
  if (!esc) return c.q;
  if (c.q === 2 && (esc === 'crit' || esc === 'warn')) return 1;
  if (c.q === 4 && esc === 'crit') return 3;
  return c.q;
}

// Risolve l'etichetta di una categoria: builtin, custom_<id> dalla tabella
// categorie, o fallback leggibile. Non deve MAI restituire uno slug tecnico.
// Un ciclo è "attivo" se non chiuso e non parcheggiato.
// I parcheggiati restano nel DB ma spariscono dalle viste di pianificazione.
function isParcheggiato(c) { return !!(c && c.parcheggiato); }
function isAttivo(c)       { return !c.done && !isParcheggiato(c); }

function catNome(cat) {
  if (!cat) return '';
  if (CAT_LABELS[cat]) return CAT_LABELS[cat];
  const m = /^custom_(.+)$/.exec(cat);
  if (m) {
    const found = (state.categorie || []).find(c => String(c.id) === m[1]);
    if (found && found.nome) return found.nome;
    return 'Senza categoria';
  }
  return cat;
}

function catIcona(cat) {
  if (!cat) return CAT_FALLBACK_EMOJI;
  if (CAT_EMOJIS[cat]) return CAT_EMOJIS[cat];
  const m = /^custom_(.+)$/.exec(cat);
  if (m) {
    const found = (state.categorie || []).find(c => String(c.id) === m[1]);
    if (found && found.emoji && found.emoji.trim()) return found.emoji;
  }
  return CAT_FALLBACK_EMOJI;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ══════════════════════════════════════════════════════════════
// SUPABASE CRUD
// ══════════════════════════════════════════════════════════════
async function loadAll() {
  state.loading = true;
  if (state.view === 'matrix') renderSkeleton();

  try {
    const [r1, r2] = await Promise.all([
      db.from('cicli').select('*').order('created_at', { ascending: false }),
      db.from('persone').select('*').order('nome')
    ]);
    if (r1.error) throw r1.error;
    if (r2.error) throw r2.error;
    // v11 · le cose eliminate dall'app (eliminato_at) restano nel database ma non si vedono
    const tutte = r1.data || [];
    state.eliminatoColOk = tutte.length ? Object.prototype.hasOwnProperty.call(tutte[0], 'eliminato_at') : !!state.eliminatoColOk;
    state.eliminati = new Set(tutte.filter(c => c.eliminato_at).map(c => c.id));
    state.cicli   = tutte.filter(c => !c.eliminato_at);
    state.persone = r2.data || [];
  } catch (e) {
    showToast('Errore Supabase: ' + e.message, 'error');
  }

  try {
    const { data, error } = await db.from('categorie').select('*').order('ordine');
    if (!error) state.categorie = data || [];
  } catch (_) { state.categorie = []; }

  await reloadWeekData();

  state.loading = false;
  render();
}

// Dati che dipendono dalla settimana selezionata (override agenda + battle plan).
async function reloadWeekData() {
  await loadAgendaOverrides();
  await loadBattlePlan();
}

// Carica gli override agenda della SOLA settimana selezionata.
// Gli override valgono per una singola settimana: cambiando settimana si ricarica.
async function loadAgendaOverrides() {
  // Le colonne giorno_settimana/fascia_oraria potrebbero non essere ancora
  // migrate: rilevalo per non inviarle nei payload e rompere il salvataggio.
  try {
    const { error } = await db.from('cicli').select('id,giorno_settimana,fascia_oraria').limit(1);
    state.agendaColsOk = !error;
    if (error) console.warn('[Agenda] colonne cicli non migrate:', error.message);
  } catch (_) { state.agendaColsOk = false; }

  try {
    const { error } = await db.from('cicli').select('id,parcheggiato,parcheggiato_at').limit(1);
    state.parcheggioColsOk = !error;
    if (error) console.warn('[Parcheggio] colonne cicli non migrate:', error.message);
  } catch (_) { state.parcheggioColsOk = false; }

  try {
    const { error } = await db.from('cicli').select('id,pianificato_data,pianificato_ripetizione').limit(1);
    state.pianificaColsOk = !error;
    if (error) console.warn('[Pianifica] colonne cicli non migrate:', error.message);
  } catch (_) { state.pianificaColsOk = false; }

  try {
    const { error } = await db.from('cicli').select('id,ora_inizio,durata_minuti').limit(1);
    state.ritualiColsOk = !error;
    if (error) console.warn('[Rituali] colonne cicli non migrate:', error.message);
  } catch (_) { state.ritualiColsOk = false; }

  await loadRitualiCompletati();

  try {
    const { data, error } = await db.from('agenda_override')
      .select('*')
      .eq('settimana', state.week)
      .eq('anno', state.year);
    if (error) throw error;
    state.agendaOverrides = data || [];
    state.agendaTableOk   = true;
  } catch (e) {
    state.agendaOverrides = [];
    if (state.agendaTableOk) {
      state.agendaTableOk = false;
      console.warn('[Agenda] override non disponibili:', e.message);
    }
  }
}

async function upsertCiclo(data) {
  const now = new Date().toISOString();
  if (data.id) {
    const { data: rows, error } = await db.from('cicli')
      .update({ ...data, updated_at: now }).eq('id', data.id).select();
    if (error) throw error;
    return (rows && rows[0]) || { ...data };
  }
  // 22/10 · una cosa nuova prende l'area dalla sua categoria (se non ne ha già una scelta)
  const area = data.macro_area || (typeof areaDaCategoria === 'function' ? areaDaCategoria(data.cat) : null) || null;
  const { data: rows, error } = await db.from('cicli')
    .insert({ ...data, macro_area: area, created_at: now, updated_at: now }).select();
  if (error) throw error;
  return (rows && rows[0]) || null;
}

async function removeCiclo(id) {
  const { error } = await db.from('cicli').delete().eq('id', id);
  if (error) throw error;
}

async function flipDone(id, currentDone) {
  const newDone  = !currentDone;
  const newStatus = newDone ? 'done' : 'planned';
  const ora = new Date().toISOString();
  // 22/10 · chiuso_at sempre: si scrive alla chiusura (anche passi e ricorrenti, che passano tutti da qui), si toglie se si riapre
  const chiuso_at = newDone ? ora : null;
  const { error } = await db.from('cicli')
    .update({ done: newDone, execution_status: newStatus, sync_status: 'pending', updated_at: ora, chiuso_at })
    .eq('id', id);
  if (error) throw error;
  state.cicli = state.cicli.map(c => c.id === id ? { ...c, done: newDone, execution_status: newStatus, chiuso_at } : c);
  // Sync to Google Calendar in background
  const ciclo = state.cicli.find(c => c.id === id);
  if (ciclo) syncCicloToGcal({ ...ciclo, done: newDone, execution_status: newStatus }).catch(() => {});
}

// ══════════════════════════════════════════════════════════════
// REALTIME
// ══════════════════════════════════════════════════════════════
db.channel('cicli-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'cicli' },     () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'persone' },   () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'categorie' }, () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'agenda_override' }, () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'rituali_completati' }, () => loadAll())
  .subscribe(status => {
    if (status === 'SUBSCRIBED') console.log('[Realtime] connesso');
  });

// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════

function switchCtx(ctx) {
  state.ctx = ctx;
  state.filter_cat = null;
  state.filter_persona = null;
  localStorage.setItem(LS.CTX, ctx);
  localStorage.setItem(LS.CAT_FILTER, '');
  render();
}


function filterByCat(cat) {
  state.filter_cat = cat || null;
  state.filter_persona = null;
  localStorage.setItem(LS.CAT_FILTER, cat || '');
  render();
}

function filterByPersona(nome) {
  state.filter_persona = state.filter_persona === nome ? null : nome;
  render();
}

// ══════════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════════




function applyFilters(cicli) {
  let result = cicli;
  if (state.filter_cat)     result = result.filter(c => c.cat === state.filter_cat);
  if (state.filter_persona) result = result.filter(c => (c.persone_menzionate || []).includes(state.filter_persona));
  return result;
}





function personColor(p) {
  if (p && p.colore) return p.colore;
  const colors = ['#3d7fff','#a855f7','#ec4899','#22c55e','#f59e0b','#14b8a6','#6366f1','#ef4444','#f97316','#0ea5e9'];
  const nome = (p && p.nome) ? p.nome : (p || '');
  let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function cicliForPersona(nome) {
  return state.cicli.filter(c => isAttivo(c) && (c.persone_menzionate || []).includes(nome));
}







// ══════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════
let _searchDebounce = null;





// ══════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// CARD BUILDER
// ══════════════════════════════════════════════════════════════




// ══════════════════════════════════════════════════════════════
// CATEGORIE CUSTOM
// ══════════════════════════════════════════════════════════════
const CAT_EMOJIS_LIST = ['','','','','','','','','','','','','','','','','','','','','','','','','','','','','',''];
let _catFormCtx = 'lavoro';
let _catFormEmoji = '';
let _catEditId = null;





async function deleteCat(id) {
  if (!confirm('Eliminare questa categoria?')) return;
  try {
    const { error } = await db.from('categorie').delete().eq('id', id);
    if (error) throw error;
    showToast('Categoria eliminata', 'info');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}


// ══════════════════════════════════════════════════════════════
// PERSONA CHIPS IN MODAL
// ══════════════════════════════════════════════════════════════
let _modalPersone = [];  // array of {id, nome, colore}

function initPersonaChips(persone_menzionate) {
  _modalPersone = [];
  (persone_menzionate || []).forEach(nome => {
    const p = state.persone.find(x => x.nome === nome);
    _modalPersone.push(p ? { id: p.id, nome: p.nome, colore: personColor(p) } : { id: null, nome, colore: personColor({nome}) });
  });
  renderPersonaChips();
}

function renderPersonaChips() {
  const box = document.getElementById('personaChipsBox');
  const input = document.getElementById('personaChipInput');
  if (!box || !input) return;
  const chips = _modalPersone.map(p => {
    const col = p.colore || '#3d7fff';
    return `<span class="pchip" style="background:${col}22;color:${col}">
      <span class="pchip-av" style="background:${col};color:white">${escHtml((p.nome||'').charAt(0).toUpperCase())}</span>
      ${escHtml(p.nome)}
      <span class="pchip-rm" onclick="removePersonaChip('${escHtml(p.nome)}')">✕</span>
    </span>`;
  }).join('');
  // Rebuild box preserving input
  const existing = box.querySelectorAll('.pchip');
  existing.forEach(el => el.remove());
  box.insertAdjacentHTML('afterbegin', chips);
}

function removePersonaChip(nome) {
  _modalPersone = _modalPersone.filter(p => p.nome !== nome);
  renderPersonaChips();
}

function onPersonaChipInput(val) {
  const dd = document.getElementById('personaDd');
  if (!val.trim()) { if (dd) dd.style.display = 'none'; return; }
  const q = val.toLowerCase();
  const already = _modalPersone.map(p => p.nome);
  const matches = state.persone.filter(p => p.nome.toLowerCase().includes(q) && !already.includes(p.nome));
  const showCreate = !state.persone.some(p => p.nome.toLowerCase() === q);
  if (!dd) return;
  if (!matches.length && !showCreate) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = matches.slice(0,6).map(p => {
    const col = personColor(p);
    return `<div class="persona-dd-item" onclick="selectPersonaFromDd('${escHtml(p.nome)}')">
      <div class="persona-dd-av" style="background:${col};color:white">${escHtml(p.nome.charAt(0).toUpperCase())}</div>
      <span>${escHtml(p.nome)}</span>${p.ruolo ? `<span style="font-size:10px;color:var(--text-dim)">${escHtml(p.ruolo)}</span>` : ''}
    </div>`;
  }).join('') + (showCreate ? `<div class="persona-dd-item persona-dd-create" onclick="createAndSelectPersona('${escHtml(val.trim())}')">+ Crea "${escHtml(val.trim())}"</div>` : '');
}

function selectPersonaFromDd(nome) {
  const p = state.persone.find(x => x.nome === nome);
  if (!_modalPersone.some(x => x.nome === nome)) {
    _modalPersone.push(p ? { id: p.id, nome: p.nome, colore: personColor(p) } : { id: null, nome, colore: personColor({nome}) });
    renderPersonaChips();
  }
  const inp = document.getElementById('personaChipInput');
  if (inp) { inp.value = ''; }
  const dd = document.getElementById('personaDd');
  if (dd) dd.style.display = 'none';
}

async function createAndSelectPersona(nome) {
  try {
    const colore = personColor({nome});
    const { data, error } = await db.from('persone').insert({ nome, colore, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    state.persone.push(data);
    selectPersonaFromDd(nome);
    showToast(`Persona aggiunta: ${nome}`, 'success');
  } catch (e) {
    selectPersonaFromDd(nome);
  }
}

function onPersonaChipKey(e) {
  if (e.key === 'Backspace' && !e.target.value && _modalPersone.length) {
    _modalPersone = _modalPersone.slice(0, -1);
    renderPersonaChips();
  }
  if (e.key === 'Escape') {
    const dd = document.getElementById('personaDd');
    if (dd) dd.style.display = 'none';
  }
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.persona-chips-wrap')) {
    const dd = document.getElementById('personaDd');
    if (dd) dd.style.display = 'none';
  }
});

// ══════════════════════════════════════════════════════════════
// MODAL NUOVO/MODIFICA CICLO
// ══════════════════════════════════════════════════════════════
let editingId  = null;
let selectedQ  = 2;
let modalCtx   = 'lavoro';

function openModal(defaultQ, editId) {
  editingId = editId || null;
  selectedQ = defaultQ || 2;
  modalCtx  = state.ctx;

  const overlay = document.getElementById('modalOverlay');
  const title   = document.getElementById('modalTitle');
  const btnDel  = document.getElementById('btn-delete');
  const btnSave = document.getElementById('btn-save');
  btnSave.textContent = 'Salva';
  btnSave.disabled = false;

  let desideredCat = null;

  if (editId) {
    const c = state.cicli.find(x => x.id === editId);
    if (!c) return;
    title.textContent = 'MODIFICA CICLO';
    document.getElementById('f-title').value          = c.title || '';
    document.getElementById('f-note').value           = c.note  || '';
    desideredCat = c.cat || null;
    document.getElementById('f-date').value           = c.due_date || '';
    document.getElementById('f-week').value           = c.week  || state.week;
    document.getElementById('f-scheduled-date').value = c.scheduled_date || todayISO();
    document.getElementById('f-scheduled-time').value = c.scheduled_time || '';
    document.getElementById('f-macro-area').value     = c.macro_area || '';
    document.getElementById('f-giorno-settimana').value = c.giorno_settimana || '';
    document.getElementById('f-fascia-oraria').value    = c.fascia_oraria || '';
    selectedQ = c.q || 2;
    modalCtx  = c.ctx || state.ctx;
    btnDel.style.display = 'block';
    initPersonaChips(c.persone_menzionate || []);
  } else {
    title.textContent = 'NUOVO CICLO APERTO';
    document.getElementById('f-title').value          = '';
    document.getElementById('f-note').value           = '';
    desideredCat = state.ctx === 'personale' ? 'salute' : 'management';
    document.getElementById('f-date').value           = '';
    document.getElementById('f-week').value           = state.week;
    document.getElementById('f-scheduled-date').value = todayISO();
    document.getElementById('f-scheduled-time').value = '';
    document.getElementById('f-macro-area').value     = '';
    document.getElementById('f-giorno-settimana').value = '';
    document.getElementById('f-fascia-oraria').value    = '';
    btnDel.style.display = 'none';
    initPersonaChips([]);
  }

  const agendaRow = document.getElementById('agenda-fields-row');
  const agendaHint = document.getElementById('agenda-fields-hint');
  if (agendaRow)  agendaRow.style.display  = state.agendaColsOk ? '' : 'none';
  if (agendaHint) agendaHint.style.display = state.agendaColsOk ? '' : 'none';

  setModalCtx(modalCtx, true);
  // riapplica la categoria del ciclo dopo aver costruito le opzioni
  document.getElementById('f-cat').value = catOptionEsiste(desideredCat)
    ? desideredCat
    : (modalCtx === 'personale' ? 'salute' : 'management');
  selectQ(selectedQ);
  // On mobile, collapse "Più opzioni" by default; on desktop always open
  if (window.innerWidth <= 768) closeMoreOpts();
  else openMoreOpts();
  overlay.classList.add('open');
  if (!editId) setTimeout(() => document.getElementById('f-title').focus(), 200);   // sul dettaglio niente tastiera che salta su
}

function closeModal(overlayId) {
  const id = overlayId || 'modalOverlay';
  document.getElementById(id).classList.remove('open');
  if (id === 'modalOverlay') editingId = null;
}

function closeModalOnBg(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

// Ripopola #f-cat includendo le categorie custom (custom_<id>) nel gruppo del
// contesto giusto. Senza questo, aprire un ciclo con categoria custom perde il valore.
// Ricostruisce #f-cat con TUTTE le categorie del contesto:
// prima le builtin, poi le custom da Supabase ordinate per `ordine`.
// I value sono quelli realmente salvati in cicli.cat: 'management', 'vendite', 'custom_5'...
function renderCatOptions(ctx) {
  const sel = document.getElementById('f-cat');
  if (!sel) return;
  sel.innerHTML = '';

  const mk = (value, testo) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = testo;
    return o;
  };

  const gBuiltin = document.createElement('optgroup');
  gBuiltin.label = ctx === 'personale' ? 'Personale' : 'Lavoro';
  (CAT_BUILTIN[ctx] || CAT_BUILTIN.lavoro).forEach(k =>
    gBuiltin.appendChild(mk(k, (CAT_EMOJIS[k] || CAT_FALLBACK_EMOJI) + ' ' + (CAT_LABELS[k] || k))));
  sel.appendChild(gBuiltin);

  const custom = (state.categorie || [])
    .filter(c => c.ctx === ctx)
    .sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0));
  if (custom.length) {
    const gCustom = document.createElement('optgroup');
    gCustom.label = 'Personalizzate';
    custom.forEach(c =>
      gCustom.appendChild(mk('custom_' + c.id, (c.emoji || CAT_FALLBACK_EMOJI) + ' ' + c.nome)));
    sel.appendChild(gCustom);
  }
}

function catOptionEsiste(value) {
  const sel = document.getElementById('f-cat');
  return !!sel && [...sel.options].some(o => o.value === value);
}

// keepCat: true quando si sta solo ripristinando lo stato di un ciclo esistente,
// così il cambio di contesto non sovrascrive la categoria già impostata.
// keepCat: true da openModal (sta ripristinando un ciclo). Senza il flag (click
// su Lavoro/Personale) la scelta precedente viene mantenuta solo se esiste ancora
// nel nuovo contesto, altrimenti si ricade sul default.
function setModalCtx(ctx, keepCat) {
  modalCtx = ctx;
  const sel = document.getElementById('f-cat');
  const precedente = sel ? sel.value : null;

  document.getElementById('cpk-lavoro').classList.toggle('selected', ctx === 'lavoro');
  document.getElementById('cpk-personale').classList.toggle('selected', ctx === 'personale');
  renderCatOptions(ctx);

  if (!keepCat) {
    sel.value = catOptionEsiste(precedente)
      ? precedente
      : (ctx === 'personale' ? 'salute' : 'management');
  }
  document.getElementById('btn-save').className = 'btn-save' + (ctx === 'personale' ? ' personale' : '');
}

function selectQ(q) {
  selectedQ = q;
  document.querySelectorAll('.q-pick-btn').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.q) === q);
  });
  // I Q2 spariscono se non vengono piazzati in agenda: banner informativo, non bloccante
  const nudge = document.getElementById('q2-nudge');
  if (nudge) nudge.classList.toggle('show', q === 2);
}

async function saveCiclo() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { showToast('Inserisci un titolo', 'warn'); return; }

  const scheduledDate = document.getElementById('f-scheduled-date').value || todayISO();
  if (!scheduledDate) { showToast('La data pianificata è obbligatoria', 'warn'); return; }

  const persone_menzionate = _modalPersone.map(p => p.nome).filter(Boolean);
  const macroArea = document.getElementById('f-macro-area').value || null;

  const data = {
    title,
    note:             document.getElementById('f-note').value.trim() || null,
    cat:              document.getElementById('f-cat').value,
    due_date:         document.getElementById('f-date').value || null,
    week:             parseInt(document.getElementById('f-week').value) || state.week,
    year:             state.year,
    q:                selectedQ,
    ctx:              modalCtx,
    persone_menzionate,
    done:             false,
    da_plaud:         false,
    scheduled_date:   scheduledDate,
    scheduled_time:   document.getElementById('f-scheduled-time').value || null,
    macro_area:       macroArea,
    execution_status: 'planned',
    sync_status:      'pending',
    settimana_anno:   isoWeekStr(new Date(scheduledDate))
  };

  if (state.agendaColsOk) {
    data.giorno_settimana = document.getElementById('f-giorno-settimana').value || null;
    data.fascia_oraria    = document.getElementById('f-fascia-oraria').value || null;
  }

  if (editingId) {
    const existing = state.cicli.find(c => c.id === editingId);
    data.id            = editingId;
    data.done          = existing?.done       || false;
    data.da_plaud      = existing?.da_plaud   || false;
    data.execution_status = existing?.execution_status || 'planned';
    data.google_event_id  = existing?.google_event_id || null;
  }

  const btn = document.getElementById('btn-save');
  btn.textContent = 'Salvataggio...';
  btn.disabled = true;

  try {
    const eraModifica = !!editingId;
    const saved = await upsertCiclo(data);
    closeModal('modalOverlay');   // azzera editingId: leggilo prima
    showToast(eraModifica ? 'Salvata' : 'Aggiunta', 'success');
    // stato locale immutabile: il realtime arriverà, ma il chiamante può servire subito l'id
    if (saved && saved.id) {
      state.cicli = [saved, ...state.cicli.filter(c => c.id !== saved.id)];
    }
    // Sync to Google Calendar in background
    syncCicloToGcal({ ...data }).catch(() => {});
    return saved;
  } catch (e) {
    showToast('Errore: ' + e.message, 'error');
    btn.textContent = 'Salva';
    btn.disabled = false;
    return null;
  }
}

async function deleteCurrent() {
  if (!editingId) return;
  if (!confirm('Eliminare questo ciclo? Operazione irreversibile.')) return;
  try {
    await removeCiclo(editingId);
    closeModal('modalOverlay');
    showToast('Eliminata', 'info');
  } catch (e) {
    showToast('Errore eliminazione: ' + e.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// PLAUD IMPORT (3 step)
// ══════════════════════════════════════════════════════════════
let plaudStep      = 1;

function openPlaudModal() {
  plaudStep = 1;
  setPlaudStep(1);
  const ta = document.getElementById('plaud-transcript');
  if (ta) ta.value = '';
  document.getElementById('plaudOverlay').classList.add('open');
}

function closePlaudModal() {
  document.getElementById('plaudOverlay').classList.remove('open');
}

function setPlaudStep(n) {
  plaudStep = n;
  const labels = { 1:'Incolla trascrizione', 2:'Analisi in corso...', 3:'Conferma importazione' };
  const labelEl = document.getElementById('plaud-step-label');
  if (labelEl) labelEl.textContent = labels[n] || '';
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById('plaud-step-' + i);
    if (step) step.style.display = i === n ? 'block' : 'none';
    const dot  = document.getElementById('plaud-dot-' + i);
    if (dot) dot.className = 'step-dot' + (i < n ? ' done' : i === n ? ' active' : '');
  }
}

// ══════════════════════════════════════════════════════════════
// API KEY MODAL
// ══════════════════════════════════════════════════════════════
function openApiKeyModal() {
  const inp = document.getElementById('claude-key-input');
  if (inp) inp.value = localStorage.getItem(LS.CLAUDE_KEY) || '';
  document.getElementById('apikeyOverlay').classList.add('open');
}

function saveApiKey() {
  const key = (document.getElementById('claude-key-input')?.value || '').trim();
  if (!key.startsWith('sk-ant-')) { showToast('Chiave non valida (deve iniziare con sk-ant-)', 'warn'); return; }
  localStorage.setItem(LS.CLAUDE_KEY, key);
  closeModal('apikeyOverlay');
  showToast('Chiave Claude salvata ✓', 'success');
  setTimeout(openPlaudModal, 300);
}

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════
// DARK / LIGHT THEME
// ══════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════
// TOOLTIP
// ══════════════════════════════════════════════════════════════
let _tipTimer = null;
const _tip = () => document.getElementById('tooltip');

// Solo con un mouse vero: su telefono (hover: none) o dopo un tocco il tooltip non compare,
// e si chiude da solo se l'elemento sparisce (cambio vista), al tocco altrove, scorrendo o con un tasto.
const _hoverVero = () => !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
let _ultimoPuntatore = 'mouse', _tipAncora = null, _tipControllo = null;
function nascondiTip() {
  clearTimeout(_tipTimer); clearInterval(_tipControllo); _tipControllo = null; _tipAncora = null;
  const tip = _tip(); if (tip) tip.classList.remove('visible');
}
document.addEventListener('pointerdown', e => { _ultimoPuntatore = e.pointerType || 'mouse'; nascondiTip(); }, true);
document.addEventListener('touchstart', () => { _ultimoPuntatore = 'touch'; nascondiTip(); }, { capture: true, passive: true });
document.addEventListener('keydown', nascondiTip, true);
document.addEventListener('scroll', nascondiTip, { capture: true, passive: true });
window.addEventListener('resize', nascondiTip);
window.addEventListener('blur', nascondiTip);

document.addEventListener('mouseover', e => {
  const el = e.target.closest('[data-tip]');
  if (!el) return;
  clearTimeout(_tipTimer);
  if (!_hoverVero() || _ultimoPuntatore !== 'mouse') return;
  _tipTimer = setTimeout(() => {
    const tip = _tip(); if (!tip || !el.isConnected || !el.matches(':hover')) return;
    tip.textContent = el.dataset.tip;
    tip.classList.add('visible');
    positionTooltip(tip, el);
    _tipAncora = el;
    clearInterval(_tipControllo);
    _tipControllo = setInterval(() => { if (!_tipAncora || !_tipAncora.isConnected || !_tipAncora.matches(':hover')) nascondiTip(); }, 300);
  }, 400);
});

document.addEventListener('mouseout', e => {
  const el = e.target.closest('[data-tip]');
  if (!el) return;
  nascondiTip();
});

function positionTooltip(tip, anchor) {
  const r = anchor.getBoundingClientRect();
  const tw = 240, th = 60;
  let left = r.right + 10;
  let top  = r.top + (r.height - th) / 2;
  if (left + tw > window.innerWidth - 8)  left = r.left - tw - 10;
  if (left < 8) left = 8;
  if (top < 8)  top  = 8;
  if (top + th > window.innerHeight - 8)  top = window.innerHeight - th - 8;
  tip.style.left = left + 'px';
  tip.style.top  = top  + 'px';
}

// ══════════════════════════════════════════════════════════════
// GUIDA
// ══════════════════════════════════════════════════════════════
const GUIDA_SECTIONS = [
  {
    icon: '',
    title: 'Cos\'è CICLI APERTI',
    content: `
      <p>Un <strong>ciclo aperto</strong> è qualsiasi cosa incompiuta che tiene occupata la tua mente: una promessa fatta, un'email da rispondere, una decisione in sospeso, un progetto avviato ma non concluso.</p>
      <p>Secondo la metodologia <strong>OSM</strong>, ogni ciclo aperto consuma energia mentale — anche quando non ci stai pensando consciamente. Raccoglierli in un unico sistema libera la mente e permette di agire con chiarezza.</p>
      <p>L'obiettivo non è avere zero cicli, ma avere <strong>cicli consapevoli</strong>: sai cosa hai aperto, quando lo chiudi e perché.</p>
    `
  },
  {
    icon: '',
    title: 'La Matrice di Eisenhower',
    content: `
      <p>Ogni ciclo va collocato in uno dei 4 quadranti in base a <strong>urgenza</strong> e <strong>priorità</strong>:</p>
      <div class="guida-q-grid">
        <span class="guida-q-badge q1">Q1 </span><span><strong>Crisi — FA SUBITO.</strong> Urgente e prioritario: clienti in attesa, scadenze oggi, emergenze.</span>
        <span class="guida-q-badge q2">Q2 </span><span><strong>Qualità — PIANIFICA.</strong> Prioritario ma non urgente: strategia, formazione, relazioni importanti. È il quadrante della crescita.</span>
        <span class="guida-q-badge q3">Q3 </span><span><strong>Inganno — DELEGA.</strong> Urgente ma non prioritario: interruzioni, alcune riunioni, compiti di altri.</span>
        <span class="guida-q-badge q4">Q4 </span><span><strong>Spreco — ELIMINA.</strong> Né urgente né prioritario. Valuta se vale davvero la pena tenerlo aperto.</span>
      </div>
    `
  },
  {
    icon: '',
    title: 'Escalation automatica',
    content: `
      <p>L'app monitora le scadenze e riclassifica i cicli automaticamente:</p>
      <ul>
        <li>Un ciclo in <strong>Q2</strong> con scadenza entro <strong>30 giorni</strong> → passa a Q1 (diventa urgente)</li>
        <li>Un ciclo in <strong>Q4</strong> con scadenza entro <strong>14 giorni</strong> → passa a Q3 (diventa urgente)</li>
      </ul>
      <p>Visivamente: la barra laterale arancione segnala <em>"presto"</em> (30gg), quella rossa <em>"critico"</em> (14gg). All'apertura dell'app ricevi un avviso se ci sono cicli auto-escalati.</p>
    `
  },
  {
    icon: '',
    title: 'Navigazione settimanale',
    content: `
      <p>I cicli sono organizzati per <strong>settimana di riferimento</strong>. Usa le frecce <span class="guida-kbd">←</span> <span class="guida-kbd">→</span> nell'header (o da tastiera) per navigare tra le settimane.</p>
      <p>La settimana di un ciclo indica <em>quando intendi occupartene</em>, non necessariamente la sua scadenza. Puoi spostare un ciclo a una settimana futura modificandolo.</p>
      <p>La vista <strong>Storico</strong> raccoglie tutte le settimane passate e i cicli completati.</p>
    `
  },
  {
    icon: '',
    title: 'Con chi — rubrica persone',
    content: `
      <p>Ogni ciclo può avere una o più <strong>persone coinvolte</strong>. Aggiungile nel campo "Persone coinvolte" del modale, separate da virgola.</p>
      <p>La vista <strong>Persone</strong> raggruppa tutti i cicli aperti per persona — utilissima prima di una riunione: vedi in un colpo d'occhio tutto ciò di cui parlare con un collaboratore.</p>
      <p>L'import da Plaud estrae automaticamente i nomi delle persone menzionate nella registrazione.</p>
    `
  },
  {
    icon: '',
    title: 'Log note progressive',
    content: `
      <p>Il campo <strong>Note / Dettagli</strong> di ogni ciclo è il posto giusto per tenere un log progressivo degli aggiornamenti.</p>
      <p>Esempio:</p>
      <ul>
        <li><em>2024-03-10: chiamato Mario, in attesa di preventivo</em></li>
        <li><em>2024-03-15: preventivo ricevuto, da approvare</em></li>
        <li><em>2024-03-18: approvato, inviato a ufficio acquisti</em></li>
      </ul>
      <p>In questo modo il ciclo diventa anche un <strong>diario delle azioni</strong> e puoi recuperare il contesto anche dopo settimane.</p>
    `
  },
  {
    icon: '',
    title: 'Import da Plaud',
    content: `
      <p>Plaud è un dispositivo che trascrive le riunioni. Con questo import puoi trasformare una trascrizione in cicli aperti in 3 clic:</p>
      <ul>
        <li><strong>1.</strong> Premi <span class="guida-kbd"> Plaud</span> in header o <span class="guida-kbd">Cmd+P</span></li>
        <li><strong>2.</strong> Incolla il testo della trascrizione</li>
        <li><strong>3.</strong> Claude (AI) estrae automaticamente tutti gli impegni, promesse e task</li>
        <li><strong>4.</strong> Rivedi l'elenco, modifica le scadenze, deseleziona quelli da non importare</li>
        <li><strong>5.</strong> Premi "Importa selezionati"</li>
      </ul>
      <p>Richiede una <strong>Claude API Key</strong> (gratuita per uso personale limitato). Configurala premendo  in header.</p>
    `
  },
  {
    icon: '',
    title: 'Storico',
    content: `
      <p>Lo <strong>Storico</strong> raccoglie tutti i cicli completati (spunta verde) e i cicli di settimane passate, organizzati per settimana.</p>
      <p>Puoi <strong>riaprire</strong> un ciclo completato cliccando sulla spunta verde — tornerà nella settimana corrente come ciclo attivo.</p>
      <p>Lo storico è utile per i <strong>check-in settimanali</strong>: guarda cos'hai chiuso la settimana scorsa e cosa è rimasto in sospeso.</p>
    `
  },
  {
    icon: '',
    title: 'Scorciatoie tastiera',
    content: `
      <ul>
        <li><span class="guida-kbd">Cmd+K</span> / <span class="guida-kbd">Ctrl+K</span> — Nuovo ciclo</li>
        <li><span class="guida-kbd">Cmd+F</span> / <span class="guida-kbd">Ctrl+F</span> — Ricerca globale</li>
        <li><span class="guida-kbd">Cmd+P</span> / <span class="guida-kbd">Ctrl+P</span> — Import Plaud</li>
        <li><span class="guida-kbd">←</span> / <span class="guida-kbd">→</span> — Settimana precedente / successiva</li>
        <li><span class="guida-kbd">Escape</span> — Chiudi modale aperto</li>
        <li><span class="guida-kbd">Enter</span> — Salva ciclo (quando il modale è aperto)</li>
      </ul>
    `
  }
];



// ══════════════════════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  const anyOpen = document.querySelector('.modal-overlay.open');
  if (e.key === 'Escape' && anyOpen) { anyOpen.classList.remove('open'); return; }
  if (anyOpen) return;
  if (e.target.closest && e.target.closest('input, textarea, select')) { if (!(e.metaKey || e.ctrlKey)) return; }
  if (e.key === 'ArrowLeft'  && ui.tab === 'pianifica') { e.preventDefault(); changeWeek(-1); }
  if (e.key === 'ArrowRight' && ui.tab === 'pianifica') { e.preventDefault(); changeWeek(1); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); apriRapido(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); openPlaudModal(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); focusRicerca(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('modalOverlay')?.classList.contains('open')) {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') { e.preventDefault(); salvaDalFoglio(); }
  }
});

// ══════════════════════════════════════════════════════════════
// AVVIO
// ══════════════════════════════════════════════════════════════
// (avvio spostato in fondo: vedi AVVIO della nuova interfaccia)

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

// ══════════════════════════════════════════════════════════════
// DATE UTILS
// ══════════════════════════════════════════════════════════════
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoWeekStr(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

function addDays(isoDate, n) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayName(isoDate) {
  return new Date(isoDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' });
}

function monthName(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

// ══════════════════════════════════════════════════════════════
// MACRO AREA HELPERS
// ══════════════════════════════════════════════════════════════
function getMaCssClass(area) {
  if (!area) return '';
  const k = area.replace('&','').replace(' ','').replace('Da Delegare','Delegare').replace('R&D','RD').replace('R/D','RD');
  return 'ma-' + k;
}

function getMaColor(area) { return MACRO_AREA_COLORS[area] || '#64748b'; }
function getMaEmoji(area) { return MACRO_AREA_EMOJIS[area] || ''; }

// ══════════════════════════════════════════════════════════════
// AUTO-CATEGORIZZAZIONE CLAUDE
// ══════════════════════════════════════════════════════════════
async function autoCategoria(title, note) {
  if (!title || !claudeDisponibile()) return null;
  const prompt = `Classifica questa attività SSI (consulenza sicurezza sul lavoro) in UNA delle aree: ${nomiAree().join(', ')}. Rispondi SOLO con il nome esatto, nient'altro. Titolo: ${title}. Note: ${note || ''}`;
  const area = (await chiediClaude('area', prompt)).trim();
  return nomiAree().includes(area) ? area : null;
}

// Hook auto-cat al blur del titolo nel modal
document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('f-title');
  if (!titleInput) return;
  titleInput.addEventListener('blur', async () => {
    const title = titleInput.value.trim();
    const current = document.getElementById('f-macro-area')?.value;
    if (!title || current || areaDaCategoria(document.getElementById('f-cat')?.value)) return;   // l'area viene dalla categoria
    const spin = document.getElementById('auto-cat-spin');
    const hint = document.getElementById('auto-cat-hint');
    if (spin) spin.classList.add('active');
    if (hint) hint.textContent = 'cerco l\'area...';
    try {
      const area = await autoCategoria(title, document.getElementById('f-note')?.value || '');
      if (area) {
        const sel = document.getElementById('f-macro-area');
        if (sel && !sel.value) { sel.value = area; }
        if (hint) hint.textContent = `suggerita: ${area}`;
      } else {
        if (hint) hint.textContent = 'scegli tu';
      }
    } catch (_) {
      if (hint) hint.textContent = 'scegli tu';
    }
    if (spin) spin.classList.remove('active');
  });
});

// ══════════════════════════════════════════════════════════════
// GOOGLE CALENDAR — OAUTH + SYNC
// ══════════════════════════════════════════════════════════════
function isGcalTokenValid() {
  return gcal.token && gcal.expiresAt > (Date.now() + 60000);
}

function initGcal() {
  // Carica token da DB se non in localStorage (si chiama solo dopo il login: user_tokens è visibile solo all'utente collegato)
  if (localStorage.getItem('gcal_da_salvare') && isGcalTokenValid()) saveGcalTokenToDB();
  loadGcalTokenFromDB();
  updateGcalButton();
  // (22/10) niente più nuovi tentativi automatici di sincronizzazione: vedi GCAL_SYNC_AUTOMATICO
  // Init GIS quando è disponibile
  _tryInitGis();
}

function _tryInitGis() {
  if (typeof google !== 'undefined' && google.accounts) {
    gcal.client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GCAL_SCOPE,
      login_hint: GCAL_USER_EMAIL,
      callback: r => _handleGcalToken(r),           // sempre l'ultima versione (le parti dopo la avvolgono)
      error_callback: r => _erroreGcalPopup(r)
    });
    avviaRinnovoGcal();
  } else {
    setTimeout(_tryInitGis, 800);
  }
}

async function _handleGcalToken(resp) {
  const silenzioso = gcal.rinnovo === 'silenzioso';
  gcal.rinnovo = null;
  if (resp.error && silenzioso) { rinnovoGcalFallito(resp.error); return; }
  if (resp.error) { showToast(resp.error === 'access_denied' ? 'Google non ha dato il permesso: riprova e accetta l\'accesso al calendario.' : 'Errore Google: ' + resp.error, 'error'); return; }
  gcal.scope = resp.scope || GCAL_SCOPE;
  localStorage.setItem('gcal_scope', gcal.scope);
  if (!haScopeEventi() && !silenzioso) showToast('Google non ha dato il permesso di modificare gli eventi: ricollega e lascia spuntato «Vedere, modificare… i calendari».', 'warn');
  gcal.token     = resp.access_token;
  gcal.expiresAt = Date.now() + (resp.expires_in * 1000);
  gcal.email     = GCAL_USER_EMAIL;
  gcal.rinnovoFallito = false;
  localStorage.setItem('gcal_token',   gcal.token);
  localStorage.setItem('gcal_expires', gcal.expiresAt);
  localStorage.setItem('gcal_email',   gcal.email);
  await saveGcalTokenToDB();
  updateGcalButton();
  await ensureGcalCalendar();
  if (silenzioso) { if ($('gcalOverlay').classList.contains('open')) openGcalModal(); return; }
  showToast('Google Calendar connesso ✓', 'success');
  closeModal('gcalOverlay');
}

// ── Rinnovo silenzioso del token (dura un'ora) ──
// Ogni 50 minuti, quando la scheda torna in primo piano e all'avvio: richiesta con prompt vuoto, senza finestre da compilare.
// Se il browser blocca la finestra perché non c'è stato un tocco, si riprova (sempre in silenzio) al primo tocco.
// «Ricollega» compare solo se anche quello fallisce.
const GCAL_RINNOVO = { OGNI_MS: 50 * 60 * 1000, ANTICIPO_MS: 10 * 60 * 1000 };
let _gcalRinnovoTimer = null, _gcalRinnovoAvviato = false, _gcalAttesaTocco = false;
const gcalInScadenza = () => !gcal.token || gcal.expiresAt - Date.now() < GCAL_RINNOVO.ANTICIPO_MS;
function rinnovaGcalSilenzioso(perche) {
  if (!gcal.client || !gcalEraCollegato() || gcal.rinnovo) return false;
  gcal.rinnovo = 'silenzioso';
  setTimeout(() => { if (gcal.rinnovo === 'silenzioso') gcal.rinnovo = null; }, 60000);   // Google non ha risposto: si riprova al prossimo giro
  try { gcal.client.requestAccessToken({ prompt: '', login_hint: GCAL_USER_EMAIL }); }
  catch (e) { gcal.rinnovo = null; rinnovoGcalFallito(e.message || 'errore'); return false; }
  console.info('[GCal] rinnovo silenzioso:', perche);
  return true;
}
function rinnovoGcalFallito(motivo) {
  gcal.rinnovo = null;
  if (isGcalTokenValid()) return;   // il token di prima vale ancora: si riprova al prossimo giro
  gcal.rinnovoFallito = true;
  console.info('[GCal] rinnovo silenzioso non riuscito:', motivo);
  updateGcalButton();
  if (typeof render === 'function' && _appAvviata) render();
  if ($('gcalOverlay').classList.contains('open')) openGcalModal();
}
function _erroreGcalPopup(err) {
  const silenzioso = gcal.rinnovo === 'silenzioso';
  gcal.rinnovo = null;
  const tipo = (err && err.type) || 'unknown';
  if (!silenzioso) { if (tipo === 'popup_failed_to_open') showToast('Il browser ha bloccato la finestra di Google: consenti i popup per questo sito e riprova.', 'warn'); return; }
  // senza un tocco il browser blocca la finestra: si riprova al primo tocco, una volta
  if (tipo === 'popup_failed_to_open' && !_gcalAttesaTocco) { _gcalAttesaTocco = true; return; }
  rinnovoGcalFallito(tipo);
}
document.addEventListener('click', () => {
  if (!_gcalAttesaTocco) return;
  _gcalAttesaTocco = false;
  if (gcalInScadenza()) rinnovaGcalSilenzioso('al tocco');
}, true);
function avviaRinnovoGcal() {
  if (_gcalRinnovoAvviato) return;
  _gcalRinnovoAvviato = true;
  _gcalRinnovoTimer = setInterval(() => rinnovaGcalSilenzioso('ogni 50 minuti'), GCAL_RINNOVO.OGNI_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && gcalInScadenza() && !gcal.rinnovoFallito) rinnovaGcalSilenzioso('scheda in primo piano');
  });
  if (gcalEraCollegato() && gcalInScadenza()) rinnovaGcalSilenzioso('avvio');
}
// scaduto davvero (rinnovo silenzioso fallito): solo allora si chiede di ricollegare
const gcalDaRicollegare = () => !isGcalTokenValid() && gcalEraCollegato() && !!gcal.rinnovoFallito;

function connectGoogleCalendar() {
  if (gcal.client) {
    gcal.rinnovo = null;
    gcal.client.requestAccessToken(gcalEraCollegato() ? { prompt: '' } : {});
  } else {
    // Fallback: redirect implicit flow
    const params = new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      redirect_uri:  APP_URL,
      response_type: 'token',
      scope:         GCAL_SCOPE,
      state:         'gcal_connect'
    });
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  }
}

function checkImplicitCallback() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  const p = new URLSearchParams(hash);
  if (p.get('state') !== 'gcal_connect') return;
  const token = p.get('access_token');
  if (!token) return;
  gcal.token     = token;
  gcal.expiresAt = Date.now() + parseInt(p.get('expires_in') || '3600') * 1000;
  gcal.email     = GCAL_USER_EMAIL;
  localStorage.setItem('gcal_token',   gcal.token);
  localStorage.setItem('gcal_expires', gcal.expiresAt);
  localStorage.setItem('gcal_email',   gcal.email);
  gcal.scope = p.get('scope') || GCAL_SCOPE;
  localStorage.setItem('gcal_scope', gcal.scope);
  history.replaceState(null, '', window.location.pathname);
  // prima del login il database non accetta scritture: si salva dopo, da initGcal
  if (typeof _appAvviata === 'undefined' || !_appAvviata) { localStorage.setItem('gcal_da_salvare', '1'); return; }
  saveGcalTokenToDB().then(() => {
    updateGcalButton();
    ensureGcalCalendar().then(() => showToast('Google Calendar connesso ✓', 'success'));
  });
}
checkImplicitCallback();

async function loadGcalTokenFromDB() {
  try {
    const { data, error } = await db.from('user_tokens').select('*').eq('user_email', GCAL_USER_EMAIL).maybeSingle();
    if (error) { console.warn('[GCal] lettura token:', error.message); return; }
    if (!data) return;
    if (!gcal.token && data.google_access_token) {
      gcal.token      = data.google_access_token;
      gcal.expiresAt  = new Date(data.expires_at).getTime();
      gcal.calendarId = data.google_calendar_id;
      gcal.email      = data.user_email;
      localStorage.setItem('gcal_token',   gcal.token);
      localStorage.setItem('gcal_expires', gcal.expiresAt);
      localStorage.setItem('gcal_cal_id',  gcal.calendarId || '');
      localStorage.setItem('gcal_email',   gcal.email);
      updateGcalButton();
    }
  } catch (_) {}
}

async function saveGcalTokenToDB() {
  try {
    const { error } = await db.from('user_tokens').upsert({
      user_email:           GCAL_USER_EMAIL,
      google_access_token:  gcal.token,
      google_refresh_token: null,
      google_calendar_id:   gcal.calendarId,
      expires_at:           new Date(gcal.expiresAt).toISOString()
    }, { onConflict: 'user_email' });
    if (error) throw error;
    localStorage.removeItem('gcal_da_salvare');
  } catch (e) { console.warn('[GCal] salvataggio token:', e.message); localStorage.setItem('gcal_da_salvare', '1'); }
}

async function ensureGcalCalendar() {
  if (!isGcalTokenValid()) return;
  if (gcal.calendarId) return;
  try {
    // Cerca calendario esistente
    const listRes = await gcalFetch('/users/me/calendarList', 'GET');
    const existing = listRes?.items?.find(c => c.summary === GCAL_CAL_NAME);
    if (existing) {
      gcal.calendarId = existing.id;
    } else {
      const created = await gcalFetch('/calendars', 'POST', { summary: GCAL_CAL_NAME, timeZone: 'Europe/Rome' });
      gcal.calendarId = created.id;
    }
    localStorage.setItem('gcal_cal_id', gcal.calendarId);
    await saveGcalTokenToDB();
  } catch (e) {
    console.warn('[GCal] ensureCalendar:', e.message);
  }
}

async function gcalFetch(path, method, body) {
  if (!isGcalTokenValid()) { rinnovaGcalSilenzioso('richiesta a token scaduto'); return null; }
  const base = 'https://www.googleapis.com/calendar/v3';
  const res = await fetch(base + path, {
    method,
    headers: {
      'Authorization': 'Bearer ' + gcal.token,
      'Content-Type':  'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'HTTP ' + res.status);
  }
  return res.status === 204 ? null : res.json();
}

function buildGcalEvent(ciclo) {
  const date   = ciclo.scheduled_date || todayISO();
  const time   = ciclo.scheduled_time;
  const area   = ciclo.macro_area ? `[${ciclo.macro_area}] ` : '';
  const done   = ciclo.done ? '[DONE] ' : '';
  const title  = done + area + (ciclo.title || '');
  const people = (ciclo.persone_menzionate || []).join(', ');
  const link   = `${APP_URL}#ciclo=${ciclo.id}`;
  const desc   = [ciclo.note, people ? 'Persone: ' + people : '', link].filter(Boolean).join('\n\n');

  const startDT = time ? { dateTime: `${date}T${time}:00`, timeZone: 'Europe/Rome' } : { date };
  let endDT;
  if (time) {
    const [h, m] = time.split(':').map(Number);
    const endH   = String(h + 1).padStart(2, '0');
    endDT = { dateTime: `${date}T${endH}:${String(m).padStart(2,'0')}:00`, timeZone: 'Europe/Rome' };
  } else {
    endDT = { date };
  }

  return { summary: title, description: desc, start: startDT, end: endDT };
}

// 22/10 · niente più scrittura automatica su Google Calendar: scrivono solo «Blocca in agenda» e
// «Metti il piano su Calendar». Questa sincronizzazione creava eventi di giornata (anche «[DONE] …») e li
// cancellava alla chiusura: ora non fa niente. Gli eventi già creati restano dove sono (elenco in privata/STATO.md).
const GCAL_SYNC_AUTOMATICO = false;
async function syncCicloToGcal(ciclo) {
  if (!GCAL_SYNC_AUTOMATICO) return;
  if (!isGcalTokenValid() || !gcal.calendarId) return;
  if (!ciclo.scheduled_date) return;

  const calPath = `/calendars/${encodeURIComponent(gcal.calendarId)}/events`;
  try {
    let eventId = ciclo.google_event_id;

    if (ciclo.done && eventId) {
      // Marca [DONE] nel titolo e poi elimina
      const ev = buildGcalEvent(ciclo);
      await gcalFetch(`${calPath}/${eventId}`, 'PATCH', { summary: ev.summary });
      await gcalFetch(`${calPath}/${eventId}`, 'DELETE');
      await db.from('cicli').update({ google_event_id: null, sync_status: 'synced' }).eq('id', ciclo.id);
      return;
    }

    if (eventId) {
      await gcalFetch(`${calPath}/${eventId}`, 'PATCH', buildGcalEvent(ciclo));
    } else {
      const created = await gcalFetch(calPath, 'POST', buildGcalEvent(ciclo));
      eventId = created?.id;
      if (eventId) {
        await db.from('cicli').update({ google_event_id: eventId, sync_status: 'synced', updated_at: new Date().toISOString() }).eq('id', ciclo.id);
        return;
      }
    }
    await db.from('cicli').update({ sync_status: 'synced', updated_at: new Date().toISOString() }).eq('id', ciclo.id);
  } catch (e) {
    console.warn('[GCal] sync error:', e.message);
    if (ciclo.id) {
      await db.from('cicli').update({ sync_status: 'failed', updated_at: new Date().toISOString() }).eq('id', ciclo.id).catch(() => {});
    }
  }
}

async function retryFailedSyncs() {
  if (!isGcalTokenValid()) return;
  const failed = state.cicli.filter(c => c.sync_status === 'failed' && !c.done);
  for (const c of failed.slice(0, 5)) {
    await syncCicloToGcal(c);
    await new Promise(r => setTimeout(r, 300));
  }
}



function disconnectGcal() {
  gcal.token = null; gcal.calendarId = null; gcal.email = null; gcal.expiresAt = 0;
  ['gcal_token','gcal_expires','gcal_cal_id','gcal_email','gcal_scope'].forEach(k => localStorage.removeItem(k));
  db.from('user_tokens').delete().eq('user_email', GCAL_USER_EMAIL).then(() => {});
  updateGcalButton();
  closeModal('gcalOverlay');
  showToast('Google Calendar disconnesso', 'info');
}

async function batchSyncAll() {
  const toSync = state.cicli.filter(c => !c.done && c.scheduled_date);
  showToast(`Sincronizzo ${toSync.length} cose...`, 'info');
  let ok = 0;
  for (const c of toSync) {
    await syncCicloToGcal(c).then(() => ok++).catch(() => {});
    await new Promise(r => setTimeout(r, 200));
  }
  showToast(`${ok}/${toSync.length} cose sincronizzate`, 'success');
  closeModal('gcalOverlay');
}

// ══════════════════════════════════════════════════════════════
// VISTA OGGI
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// VISTA SETTIMANA (mobile cards per giorno)
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// VISTA MESE
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// VISTA AREE — Griglia 9 macro aree per settimana
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// MOBILE CARD CON SWIPE
// ══════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════
// MODAL POSTICIPA
// ══════════════════════════════════════════════════════════════
function openPostponeModal(cicloId) {
  _postponeId = cicloId;
  const ciclo = state.cicli.find(c => c.id === cicloId);
  const baseDate = ciclo?.scheduled_date || todayISO();
  // Pre-fill date input
  const customInput = document.getElementById('postpone-custom-date');
  if (customInput) customInput.value = addDays(baseDate, 1);
  document.getElementById('postponeOverlay').classList.add('open');
}

async function doPostpone(days) {
  if (!_postponeId) return;
  const ciclo = state.cicli.find(c => c.id === _postponeId);
  if (!ciclo) return;
  const newDate = addDays(ciclo.scheduled_date || todayISO(), days);
  await _applyPostpone(ciclo, newDate);
}

async function doPostponeCustom() {
  if (!_postponeId) return;
  const ciclo    = state.cicli.find(c => c.id === _postponeId);
  const newDate  = document.getElementById('postpone-custom-date')?.value;
  if (!ciclo || !newDate) return;
  await _applyPostpone(ciclo, newDate);
}

async function _applyPostpone(ciclo, newDate) {
  try {
    const now = new Date().toISOString();
    await db.from('cicli').update({
      scheduled_date: newDate,
      execution_status: 'postponed',
      sync_status: 'pending',
      settimana_anno: isoWeekStr(new Date(newDate)),
      updated_at: now
    }).eq('id', ciclo.id);
    closeModal('postponeOverlay');
    showToast(`Spostato al ${newDate} ✓`, 'success');
    syncCicloToGcal({ ...ciclo, scheduled_date: newDate, execution_status: 'postponed' }).catch(() => {});
  } catch (e) {
    showToast('Errore: ' + e.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// PULL TO REFRESH
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// BATCH MIGRAZIONE MACRO AREE SU CICLI ESISTENTI
// ══════════════════════════════════════════════════════════════
async function batchMigrateAree() {
  if (!claudeDisponibile()) { showToast('Serve la chiave di Claude: Altro, Impostazioni', 'warn'); return; }

  const toMigrate = state.cicli.filter(c => !areaDi(c) && c.ctx === 'lavoro').slice(0, 50);   // v5: chi ha l'area dalla categoria resta così
  if (!toMigrate.length) { showToast('Tutte le cose hanno già un\'area', 'info'); return; }

  showToast(`Assegno l\'area a ${toMigrate.length} cose...`, 'info');
  let done = 0;

  for (const c of toMigrate) {
    const area = await autoCategoria(c.title, c.note).catch(() => null);
    if (area) {
      await db.from('cicli').update({ macro_area: area, updated_at: new Date().toISOString() }).eq('id', c.id).catch(() => {});
      done++;
    }
    await new Promise(r => setTimeout(r, 200)); // rate limit
  }

  await loadAll();
  showToast(`${done}/${toMigrate.length} cose con un\'area`, 'success');
}

// ══════════════════════════════════════════════════════════════
// DRAWER MOBILE
// ══════════════════════════════════════════════════════════════



// ══════════════════════════════════════════════════════════════
// MODAL PIÙ OPZIONI TOGGLE
// ══════════════════════════════════════════════════════════════



// ══════════════════════════════════════════════════════════════
// COMPACT CARD (mobile redesign v2)
// ══════════════════════════════════════════════════════════════
let _expandedCardId = null;



// ══════════════════════════════════════════════════════════════
// MATRIX MOBILE 2×2 COMPACT
// ══════════════════════════════════════════════════════════════
const Q_META = {
  1: { label: 'Q1 — Crisi',    subtitle: 'Urgente + Prioritario',  cls: 'mcb-q1' },
  2: { label: 'Q2 — Qualità',  subtitle: 'Prioritario, non urg.',  cls: 'mcb-q2' },
  3: { label: 'Q3 — Inganno',  subtitle: 'Urgente, non prior.',    cls: 'mcb-q3' },
  4: { label: 'Q4 — Spreco',   subtitle: 'Non urg., non prior.',   cls: 'mcb-q4' },
};
let _expandedQBox = null;


// ══════════════════════════════════════════════════════════════
// VISTA AGENDA SETTIMANALE
// ══════════════════════════════════════════════════════════════
let _agendaDragId  = null;   // ciclo in trascinamento


// Data del giorno `idx` (0=lunedì) nella settimana selezionata
function agendaDayDate(idx) {
  const start = getWeekStart(state.week, state.year);
  const d = new Date(start);
  d.setDate(start.getDate() + idx);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}


// Override attivo per un ciclo nella settimana corrente (o null)
function agendaOverrideFor(cicloId) {
  return state.agendaOverrides.find(o =>
    o.ciclo_id === cicloId && o.settimana === state.week && o.anno === state.year
  ) || null;
}

// Posizione effettiva del ciclo: override della settimana, altrimenti valore del ciclo
// Settimana ISO (numero + anno-settimana) di una data.
function isoWeekParts(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);          // giovedì della settimana
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { week, year: date.getUTCFullYear() };
}

function parseISODate(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function addMesi(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const giorno = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  // clamp per mesi più corti (es. 31 gen + 1 mese -> 28/29 feb)
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(giorno, ultimo));
  return d;
}

const RIPETIZIONE_MESI = { mensile: 1, trimestrale: 3, annuale: 12 };

// Il ciclo, per la sua pianificato_data + ripetizione, ricade nella settimana (week, year)?
function ricadeInSettimana(c, week, year) {
  const base = parseISODate(c.pianificato_data);
  if (!base) return false;

  const rip = ripetizioneDi(c);
  const baseW = isoWeekParts(base);

  if (rip === 'nessuna') return baseW.week === week && baseW.year === year;

  const target = getWeekStart(week, year);
  const baseWeekStart = getWeekStart(baseW.week, baseW.year);
  if (target < baseWeekStart) return false;               // prima della prima occorrenza

  if (rip === 'settimanale') return true;                 // ogni settimana da lì in poi

  const passo = RIPETIZIONE_MESI[rip];
  if (!passo) return false;
  const fineSettimana = new Date(target); fineSettimana.setDate(target.getDate() + 6);
  for (let n = 0; n < 400; n++) {
    const occ = addMesi(base, n * passo);
    if (occ > fineSettimana) return false;
    const w = isoWeekParts(occ);
    if (w.week === week && w.year === year) return true;
  }
  return false;
}

// Posizione del ciclo nella settimana (week, year), in ordine di priorità:
//   1. agenda_override specifico per quella settimana
//   2. pianificato_data (+ ripetizione) che ricade in quella settimana
//   3. giorno_settimana permanente senza pianificato_data -> sempre presente
function agendaSlotForWeek(c, week, year) {
  const ov = state.agendaOverrides.find(o =>
    o.ciclo_id === c.id && o.settimana === week && o.anno === year);
  if (ov) return { giorno: ov.giorno_settimana, fascia: ov.fascia_oraria, overridden: true };

  if (c.pianificato_data) {
    if (ricadeInSettimana(c, week, year)) {
      const base = parseISODate(c.pianificato_data);
      return {
        giorno: c.giorno_settimana || GIORNI[(base.getDay() + 6) % 7].key,
        fascia: c.fascia_oraria || null,
        overridden: false
      };
    }
    return { giorno: null, fascia: null, overridden: false };
  }

  return { giorno: c.giorno_settimana, fascia: c.fascia_oraria || null, overridden: false };
}

function agendaSlotFor(c) {
  return agendaSlotForWeek(c, state.week, state.year);
}

// Un ciclo è "da pianificare" solo se non ha nessun aggancio temporale.
function haPianificazione(c) {
  if (isGiornaliero(c)) return true;
  if (c.pianificato_data) return true;
  if (c.giorno_settimana) return true;
  return !!agendaOverrideFor(c.id);
}

// Cicli aperti del contesto corrente, con i filtri di sidebar applicati
function agendaBaseCicli() {
  return applyFilters(state.cicli.filter(c => vedi(c.ctx) && isAttivo(c)));
}

// I rituali giornalieri hanno un blocco dedicato: escludili dalla griglia
// settimanale, altrimenti comparirebbero 7 volte.
function agendaPianificati()   { return agendaBaseCicli().filter(c => !isGiornaliero(c) && agendaSlotFor(c).giorno); }
function agendaDaPianificare() { return agendaBaseCicli().filter(c => !haPianificazione(c)); }

// «Da sistemare»: una sola definizione per la colonna Da pianificare, Da piazzare, Riordina e la card del coach.
// Aperta (non fatta, non parcheggiata), senza giorno, senza data (né scadenza né data pianificata), fuori dal piano della settimana.
// Non conta le routine di ogni giorno né le cose divise in passi (contano i passi).
const ETICHETTA_CTX = { lavoro: 'Lavoro', personale: 'Personale', tutti: 'Tutti' };
const etichettaCtx = ctx => ETICHETTA_CTX[ctx || ctxVista()] || ETICHETTA_CTX.tutti;
function senzaGiornoNePiano(ctx) {
  const k = ctx || ctxVista();
  const nelPiano = new Set((state.bpItems || []).map(i => i.ciclo_id).filter(Boolean));
  return state.cicli.filter(c => (k === 'tutti' || c.ctx === k) && isAttivo(c) && !isGiornaliero(c) && !haPassiAperti(c)
    && !c.giorno_settimana && !c.pianificato_data && !agendaOverrideFor(c.id) && !nelPiano.has(c.id));
}
const daSistemare = ctx => senzaGiornoNePiano(ctx).filter(c => !c.due_date);
// quelle con una scadenza ma senza giorno: non sono da sistemare, restano a portata in Pianifica
const conScadenzaSenzaGiorno = ctx => senzaGiornoNePiano(ctx).filter(c => c.due_date).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
const perTipoEData = (a, b) => computeEffectiveQ(a) - computeEffectiveQ(b) || String(a.created_at || '').localeCompare(String(b.created_at || ''));


// ── SOTTO-VISTA: PIANIFICATI (griglia 7 giorni × fasce) ──

// ── CARD COMPATTA DELL'AGENDA ──


// ── DRAG & DROP ──
function attachDropZone(slot, giorno, fascia) {
  slot.addEventListener('dragover', e => {
    if (!_agendaDragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    slot.classList.add('drag-over');
  });
  slot.addEventListener('dragleave', e => {
    if (slot.contains(e.relatedTarget)) return;
    slot.classList.remove('drag-over');
  });
  slot.addEventListener('drop', async e => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    let id = _agendaDragId;
    try { id = e.dataTransfer.getData('text/plain') || id; } catch (_) {}
    if (!id) return;
    _agendaDragId = null;
    await moveCicloInAgenda(id, giorno, fascia);
  });
}

// Crea/aggiorna l'override — vale SOLO per la settimana corrente
async function moveCicloInAgenda(cicloId, giorno, fascia) {
  const ciclo = state.cicli.find(c => c.id === cicloId);
  if (!ciclo) return;
  const prev = agendaSlotFor(ciclo);
  if (prev.giorno === giorno && prev.fascia === fascia) return;

  const payload = {
    ciclo_id:         cicloId,
    settimana:        state.week,
    anno:             state.year,
    giorno_settimana: giorno,
    fascia_oraria:    fascia
  };

  try {
    const { data, error } = await db.from('agenda_override')
      .upsert(payload, { onConflict: 'ciclo_id,settimana,anno' })
      .select();
    if (error) throw error;

    // stato immutabile: rimpiazza l'override esistente
    const saved = (data && data[0]) || payload;
    state.agendaOverrides = [
      ...state.agendaOverrides.filter(o => !(o.ciclo_id === cicloId && o.settimana === state.week && o.anno === state.year)),
      saved
    ];
    renderAgenda();
    showToast(`Spostato a ${GIORNI_MAP[giorno].label} ${FASCE_MAP[fascia].label.toLowerCase()} per ${bpwFrase(state.week, state.year).nome}`, 'success');
  } catch (err) {
    showToast('Errore spostamento: ' + err.message, 'error');
  }
}

// ── CARD GRANDE (usata da "Da pianificare" e "Parcheggio") ──


// ── SOTTO-VISTA: DA PIANIFICARE ──

// ── VISTA PARCHEGGIO ──

// ── AZIONI PARCHEGGIO ──
async function parcheggiaCiclo(cicloId) {
  if (!state.parcheggioColsOk) { showToast('Migration parcheggio non applicata', 'error'); return; }
  const now = new Date().toISOString();
  try {
    const { error } = await db.from('cicli')
      .update({ parcheggiato: true, parcheggiato_at: now, updated_at: now })
      .eq('id', cicloId);
    if (error) throw error;
    state.cicli = state.cicli.map(c =>
      c.id === cicloId ? { ...c, parcheggiato: true, parcheggiato_at: now } : c);
      render();
    showToast('Messo in parcheggio ', 'success');
  } catch (err) { showToast('Errore: ' + err.message, 'error'); }
}

async function riattivaCiclo(cicloId) {
  const now = new Date().toISOString();
  try {
    const { error } = await db.from('cicli')
      .update({ parcheggiato: false, parcheggiato_at: null, updated_at: now })
      .eq('id', cicloId);
    if (error) throw error;
    state.cicli = state.cicli.map(c =>
      c.id === cicloId ? { ...c, parcheggiato: false, parcheggiato_at: null } : c);
      render();
    showToast('Ciclo riattivato ', 'success');
  } catch (err) { showToast('Errore: ' + err.message, 'error'); }
}



// ══════════════════════════════════════════════════════════════
// MINI-MODALE PIANIFICA CICLO
// ══════════════════════════════════════════════════════════════
let _pfCicloId = null;
let _pfQuando  = 'questa';
let _pfRip     = 'nessuna';

function openPianificaModal(cicloId) {
  const c = state.cicli.find(x => x.id === cicloId);
  if (!c) return;
  if (!state.agendaColsOk) { showToast('Migration agenda non applicata', 'error'); return; }

  _pfCicloId = cicloId;
  _pfQuando  = 'questa';
  _pfRip     = ripetizioneDi(c);

  document.getElementById('pf-ciclo-title').textContent = c.title || '';
  document.getElementById('pf-giorno').value = c.giorno_settimana || 'lunedi';
  document.getElementById('pf-fascia').value = c.fascia_oraria    || 'mattina';

  const dateInput = document.getElementById('pf-data-specifica');
  dateInput.value = c.pianificato_data || '';
  dateInput.style.display = 'none';

  // ora e durata
  const oraEl = document.getElementById('f-ora-inizio');
  oraEl.value = (c.ora_inizio || '').slice(0,5);
  const durSel = document.getElementById('f-durata');
  const durCus = document.getElementById('f-durata-custom');
  const preset = ['15','30','45','60','90','120','180'];
  if (c.durata_minuti && preset.includes(String(c.durata_minuti))) {
    durSel.value = String(c.durata_minuti); durCus.value = ''; durCus.style.display = 'none';
  } else if (c.durata_minuti) {
    durSel.value = 'custom'; durCus.value = c.durata_minuti; durCus.style.display = '';
  } else {
    durSel.value = ''; durCus.value = ''; durCus.style.display = 'none';
  }
  pfMostraErrore('');

  // Senza la migration rituali il valore 'giornaliera' violerebbe il CHECK:
  // disabilita l'opzione e i campi ora/durata.
  const optGiorn = document.querySelector('#pianificaOverlay .pf-opt[data-rip="giornaliera"]');
  if (optGiorn) {
    optGiorn.style.display = state.ritualiColsOk ? '' : 'none';
    optGiorn.disabled = !state.ritualiColsOk;
  }
  const odField = document.getElementById('pf-oradurata-field');
  if (odField) odField.classList.toggle('pf-hidden', !state.ritualiColsOk);
  if (!state.ritualiColsOk && _pfRip === 'giornaliera') _pfRip = 'nessuna';

  pfSelectQuando('questa');
  pfSelectRip(state.pianificaColsOk ? _pfRip : 'nessuna');
  const ripField = document.querySelector('#pianificaOverlay .pf-opt[data-rip]')?.closest('.pf-field');
  if (ripField) ripField.style.display = state.pianificaColsOk ? '' : 'none';

  const overlay = document.getElementById('pianificaOverlay');
  overlay.classList.toggle('personale-ctx', state.ctx === 'personale');
  document.getElementById('pf-save').className = 'pf-btn-save' + (state.ctx === 'personale' ? ' personale' : '');
  const btn = document.getElementById('pf-save');
  btn.disabled = false;
  btn.textContent = 'Pianifica';
  overlay.classList.add('open');
}

function closePianificaModal() {
  document.getElementById('pianificaOverlay').classList.remove('open');
  _pfCicloId = null;
}

function pfSelectQuando(key) {
  _pfQuando = key;
  document.querySelectorAll('#pianificaOverlay .pf-opt[data-quando]').forEach(b =>
    b.classList.toggle('selected', b.dataset.quando === key));
  const dateInput = document.getElementById('pf-data-specifica');
  dateInput.style.display = key === 'specifica' ? '' : 'none';
  if (key === 'specifica' && !dateInput.value) dateInput.value = todayISO();
}

function pfSelectRip(key) {
  _pfRip = key;
  document.querySelectorAll('#pianificaOverlay .pf-opt[data-rip]').forEach(b =>
    b.classList.toggle('selected', b.dataset.rip === key));

  // Un rituale giornaliero non ha un singolo giorno: l'ora esatta è più precisa.
  const gf = document.getElementById('pf-giornofascia-field');
  if (gf) gf.classList.toggle('pf-hidden', key === 'giornaliera');
  const hint = document.getElementById('pf-oradurata-hint');
  if (hint) hint.textContent = key === 'giornaliera'
    ? 'serve l\'ora'
    : '';
  pfMostraErrore('');
}

function pfMostraErrore(msg) {
  const el = document.getElementById('pf-error');
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? '' : 'none';
}

// Durata scelta in minuti, o null
function pfDurataMinuti() {
  const v = document.getElementById('f-durata').value;
  if (!v) return null;
  if (v === 'custom') {
    const n = parseInt(document.getElementById('f-durata-custom').value, 10);
    return Number.isFinite(n) ? Math.min(480, Math.max(5, n)) : null;
  }
  return parseInt(v, 10);
}

// toggle input "Personalizzata"
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'f-durata') {
    const cus = document.getElementById('f-durata-custom');
    cus.style.display = e.target.value === 'custom' ? '' : 'none';
    if (e.target.value === 'custom') cus.focus();
  }
});

// Data base secondo la scelta "QUANDO"
function pfDataBase() {
  const oggi = new Date();
  if (_pfQuando === 'questa')   return getWeekStart(state.week, state.year);
  if (_pfQuando === 'prossima') { const d = getWeekStart(state.week, state.year); d.setDate(d.getDate() + 7); return d; }
  if (_pfQuando === 'mese1')    return addMesi(oggi, 1);
  if (_pfQuando === 'mese3')    return addMesi(oggi, 3);
  if (_pfQuando === 'specifica') return parseISODate(document.getElementById('pf-data-specifica').value) || oggi;
  return oggi;
}

// Sposta la data al giorno della settimana scelto, restando nella stessa settimana ISO
function pfAggiustaAlGiorno(base, giornoKey) {
  const idx = GIORNI.findIndex(g => g.key === giornoKey);
  const w = isoWeekParts(base);
  const lunedi = getWeekStart(w.week, w.year);
  const d = new Date(lunedi);
  d.setDate(lunedi.getDate() + (idx < 0 ? 0 : idx));
  return d;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function confermaPianificazione() {
  const cicloId = _pfCicloId;
  const c = state.cicli.find(x => x.id === cicloId);
  if (!c) return;

  const giorno = document.getElementById('pf-giorno').value;
  const fascia = document.getElementById('pf-fascia').value;

  if (_pfQuando === 'specifica' && !document.getElementById('pf-data-specifica').value) {
    showToast('Scegli una data', 'warn'); return;
  }

  const oraInizio = document.getElementById('f-ora-inizio').value || null;
  let durata = pfDurataMinuti();

  // Validazione rituale quotidiano
  if (_pfRip === 'giornaliera') {
    if (!state.ritualiColsOk) { showToast('Migration rituali non applicata', 'error'); return; }
    if (!oraInizio) {
      pfMostraErrore('Per una routine di ogni giorno serve l\'ora');
      document.getElementById('f-ora-inizio').focus();
      return;
    }
    if (!durata) durata = 30;   // default
  }
  pfMostraErrore('');

  const data = pfAggiustaAlGiorno(pfDataBase(), giorno);
  const dataISO = toISODate(data);
  const w = isoWeekParts(data);
  const wasParked = isParcheggiato(c);

  const btn = document.getElementById('pf-save');
  btn.disabled = true;
  btn.textContent = 'Salvataggio...';

  const giornaliera = _pfRip === 'giornaliera';

  const patch = {
    // un rituale quotidiano non ha un singolo giorno né una fascia
    giorno_settimana: giornaliera ? null : giorno,
    fascia_oraria:    giornaliera ? null : fascia,
    updated_at:       new Date().toISOString()
  };
  if (state.pianificaColsOk) {
    patch.pianificato_data        = giornaliera ? todayISO() : dataISO;
    patch.pianificato_ripetizione = RIP_DB(_pfRip);
  }
  if (state.ritualiColsOk) {
    patch.ora_inizio    = oraInizio;
    patch.durata_minuti = durata;
  }
  // ricorrenza: campo storico usato dalla logica di ripetizione alla chiusura
  patch.ricorrenza = _pfRip;
  if (wasParked && state.parcheggioColsOk) { patch.parcheggiato = false; patch.parcheggiato_at = null; }

  try {
    const { error } = await db.from('cicli').update(patch).eq('id', cicloId);
    if (error) throw error;

    // override per la settimana della data calcolata
    let savedOv = null;
    if (state.agendaTableOk && !giornaliera) {
      const ovPayload = {
        ciclo_id: cicloId, settimana: w.week, anno: w.year,
        giorno_settimana: giorno, fascia_oraria: fascia
      };
      const { data: ovData, error: ovErr } = await db.from('agenda_override')
        .upsert(ovPayload, { onConflict: 'ciclo_id,settimana,anno' }).select();
      if (ovErr) throw ovErr;
      savedOv = (ovData && ovData[0]) || ovPayload;
    }

    // aggiornamento immutabile dello stato locale
    state.cicli = state.cicli.map(x => x.id === cicloId
      ? { ...x, giorno_settimana: patch.giorno_settimana, fascia_oraria: patch.fascia_oraria,
          ricorrenza: _pfRip,
          ...(state.ritualiColsOk ? { ora_inizio: oraInizio, durata_minuti: durata } : {}),
          ...(state.pianificaColsOk
                ? { pianificato_data: patch.pianificato_data, pianificato_ripetizione: RIP_DB(_pfRip) }
                : {}),
          ...(wasParked ? { parcheggiato: false, parcheggiato_at: null } : {}) }
      : x);

    if (savedOv && w.week === state.week && w.year === state.year) {
      state.agendaOverrides = [
        ...state.agendaOverrides.filter(o =>
          !(o.ciclo_id === cicloId && o.settimana === w.week && o.anno === w.year)),
        savedOv
      ];
    }

    closePianificaModal();
    render();
    if (giornaliera) {
      showToast(`Routine di ogni giorno alle ${oraInizio} · ${formatDurata(durata)}`, 'success');
    } else {
      const g = GIORNI_MAP[giorno].label;
      const f = FASCE_MAP[fascia].label.toLowerCase();
      const dd = `${String(data.getDate()).padStart(2,'0')}/${String(data.getMonth()+1).padStart(2,'0')}`;
      showToast(`Pianificato per ${g} ${dd} ${f}`, 'success');
    }
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Pianifica';
  }
}

// delega dei click sui pulsanti-opzione del modale
document.addEventListener('click', e => {
  const opt = e.target.closest('#pianificaOverlay .pf-opt');
  if (!opt) return;
  if (opt.dataset.quando) pfSelectQuando(opt.dataset.quando);
  else if (opt.dataset.rip) pfSelectRip(opt.dataset.rip);
});

// ══════════════════════════════════════════════════════════════
// RITUALI QUOTIDIANI
// ══════════════════════════════════════════════════════════════
function isGiornaliero(c) {
  return !!c && c.pianificato_ripetizione === 'giornaliera';
}

function formatDurata(min) {
  if (!min) return '';
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}` : (h === 1 ? '1 ora' : `${h} ore`);
}

function formatOra(t) {
  return (t || '').slice(0, 5);
}

// Rituali del contesto corrente, ordinati per ora_inizio
function ritualiQuotidiani() {
  return state.cicli
    .filter(c => vedi(c.ctx) && isAttivo(c) && isGiornaliero(c))
    .sort((a, b) => formatOra(a.ora_inizio).localeCompare(formatOra(b.ora_inizio)));
}

function rituraleFattoOggi(cicloId) {
  const oggi = todayISO();
  return state.ritualiCompletati.some(r => r.ciclo_id === cicloId && r.data_completamento === oggi);
}

async function loadRitualiCompletati() {
  try {
    const { data, error } = await db.from('rituali_completati')
      .select('*').eq('data_completamento', todayISO());
    if (error) throw error;
    state.ritualiCompletati = data || [];
    state.ritualiTableOk = true;
  } catch (e) {
    state.ritualiCompletati = [];
    if (state.ritualiTableOk) {
      state.ritualiTableOk = false;
      console.warn('[Rituali] tabella non disponibile:', e.message);
    }
  }
}

// Spunta/despunta il rituale per OGGI: non chiude il ciclo, domani riappare.
async function toggleRitualeOggi(cicloId) {
  if (!state.ritualiTableOk) { showToast('Migration rituali non applicata', 'error'); return; }
  const oggi = todayISO();
  const gia  = rituraleFattoOggi(cicloId);
  try {
    if (gia) {
      const { error } = await db.from('rituali_completati')
        .delete().eq('ciclo_id', cicloId).eq('data_completamento', oggi);
      if (error) throw error;
      state.ritualiCompletati = state.ritualiCompletati
        .filter(r => !(r.ciclo_id === cicloId && r.data_completamento === oggi));
      showToast('Riaperta per oggi', 'info');
    } else {
      const { data, error } = await db.from('rituali_completati')
        .insert({ ciclo_id: cicloId, data_completamento: oggi }).select();
      if (error) throw error;
      state.ritualiCompletati = [...state.ritualiCompletati,
        (data && data[0]) || { ciclo_id: cicloId, data_completamento: oggi }];
      showToast('Fatto per oggi ✓', 'success');
    }
    renderAgenda();
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
  }
}



// ══════════════════════════════════════════════════════════════
// BATTLE PLAN — PIANO DI BATTAGLIA SETTIMANALE
// ══════════════════════════════════════════════════════════════
// Un battle_plan è la fotografia di una settimana: quali cicli aperti
// vengono presi in carico, in che giorno e con quale durata prevista.
// I cicli restano la fonte di verità; battle_plan_items è solo il piano.

const BP_DURATA_DEFAULT   = 30;      // minuti, quando il ciclo non ne ha una
const BP_OBIETTIVO_PCT    = 80;      // completamento atteso
const BP_SOVRACCARICO_MIN = 40 * 60; // oltre 40h di pianificato: warning

const BP_STATI = {
  bozza:  { emoji: '', label: 'Bozza'  },
  attivo: { emoji: '', label: 'Attivo' },
  chiuso: { emoji: '', label: 'Chiuso' }
};

// 7 giorni + la colonna "senza giorno specifico"
const BP_ZONE = [
  ...GIORNI.map(g => ({ key: g.key, short: g.short, label: g.label })),
  { key: 'settimana', short: 'SETT.', label: 'Settimana' }
];
const BP_ZONE_MAP = Object.fromEntries(BP_ZONE.map(z => [z.key, z]));

const _bpAutoAperti = new Set();   // week-year per cui il wizard è già stato proposto
const _bpAccAperti  = new Set();   // giorni espansi manualmente (accordion mobile)

// ── CARICAMENTO ──────────────────────────────────────────────
async function loadBattlePlan() {
  try {
    const { data, error } = await db.from('battle_plan')
      .select('*').eq('settimana', state.week).eq('anno', state.year).maybeSingle();
    if (error) throw error;
    state.bp        = data || null;
    state.bpTableOk = true;
  } catch (e) {
    state.bp      = null;
    state.bpItems = [];
    if (state.bpTableOk) {
      state.bpTableOk = false;
      console.warn('[BattlePlan] tabella non disponibile:', e.message);
    }
    return;
  }

  if (!state.bp) { state.bpItems = []; return; }
  try {
    const { data, error } = await db.from('battle_plan_items')
      .select('*').eq('battle_plan_id', state.bp.id).order('ordine');
    if (error) throw error;
    state.bpItems = data || [];
  } catch (e) {
    state.bpItems = [];
    console.warn('[BattlePlan] items non disponibili:', e.message);
  }
}

// Piano + items di una settimana qualsiasi (usato dal wizard sulla settimana futura)
async function bpFetchPlan(week, year) {
  const { data: plan, error } = await db.from('battle_plan')
    .select('*').eq('settimana', week).eq('anno', year).maybeSingle();
  if (error) throw error;
  if (!plan) return { plan: null, items: [] };
  const { data: items, error: e2 } = await db.from('battle_plan_items')
    .select('*').eq('battle_plan_id', plan.id).order('ordine');
  if (e2) throw e2;
  return { plan, items: items || [] };
}

// ── HELPER ───────────────────────────────────────────────────
function bpCiclo(item)        { return state.cicli.find(c => c.id === item.ciclo_id) || null; }
function bpItemsValidi()      { return state.bpItems.filter(i => bpCiclo(i)); }
function bpDurata(item)       { return item.durata_prevista || BP_DURATA_DEFAULT; }
function bpOra(item)          { return item.ora_prevista ? String(item.ora_prevista).slice(0, 5) : null; }

function bpFormatMin(min) {
  if (!min) return '0min';
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function bpStats(items) {
  const tot  = items.length;
  const done = items.filter(i => i.completato).length;
  return { tot, done, pct: tot ? Math.round(done / tot * 100) : 0 };
}

function bpPctClass(pct) { return pct >= 80 ? 'ok' : (pct >= 50 ? 'mid' : 'low'); }

// Un ciclo ricorrente non si chiude quando lo spunti nel piano: torna la settimana dopo.
function bpEricorrente(c) {
  if (!c) return false;
  if (isGiornaliero(c)) return true;
  return ripetizioneDi(c) !== 'nessuna';
}

function bpSottotitolo(week, year) {
  const start = getWeekStart(week, year);
  const end   = new Date(start); end.setDate(start.getDate() + 6);
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  return `Settimana ${String(week).padStart(2,'0')} · ${fmt(start)} – ${fmt(end)} · ${year}`;
}

function bpDataGiorno(week, year, idx) {
  const d = new Date(getWeekStart(week, year));
  d.setDate(d.getDate() + idx);
  return d;
}

// Settimana ISO successiva a (week, year)
function bpSettimanaSuccessiva(week, year) {
  const d = new Date(getWeekStart(week, year));
  d.setDate(d.getDate() + 7);
  return isoWeekParts(d);
}

function bpSettimanaCorrente() { return isoWeekParts(new Date()); }

// La settimana selezionata è passata? (piani passati sono in sola lettura)
function bpSettimanaPassata() {
  const oggi = getWeekStart(bpSettimanaCorrente().week, bpSettimanaCorrente().year);
  return getWeekStart(state.week, state.year) < oggi;
}

function bpSolaLettura() {
  return !!state.bp && (state.bp.stato === 'chiuso' || bpSettimanaPassata());
}

// ── VISTA BATTLE PLAN ────────────────────────────────────────




// ── GRIGLIA 7 GIORNI + COLONNA SETTIMANA ─────────────────────


// ── COMPLETAMENTO DAL PIANO ──────────────────────────────────
// Spuntare un item chiude anche il ciclo se è "una volta sola".
// I ricorrenti (settimanale/mensile/trimestrale/giornaliera) restano aperti:
// la loro ricomparsa è già gestita da ricadeInSettimana().
async function toggleBpItem(itemId) {
  const item = state.bpItems.find(i => i.id === itemId);
  if (!item) return;
  const nuovo = !item.completato;
  const quando = nuovo ? new Date().toISOString() : null;

  try {
    const { error } = await db.from('battle_plan_items')
      .update({ completato: nuovo, completato_at: quando }).eq('id', itemId);
    if (error) throw error;

    state.bpItems = state.bpItems.map(i =>
      i.id === itemId ? { ...i, completato: nuovo, completato_at: quando } : i);

    const c = bpCiclo(item);
    if (c && !bpEricorrente(c) && !!c.done !== nuovo) {
      await flipDone(c.id, c.done);
      state.cicli = state.cicli.map(x => x.id === c.id
        ? { ...x, done: nuovo, execution_status: nuovo ? 'done' : 'planned' } : x);
    }

    renderBattlePlan();
    const st = bpStats(bpItemsValidi());
    showToast(nuovo ? `Completato ✓ (${st.done}/${st.tot})` : `Riaperto (${st.done}/${st.tot})`,
      nuovo ? 'success' : 'info');
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
  }
}

// ── WIZARD: STEP 1 SELEZIONE + STEP 2 ASSEGNAZIONE ───────────
let _bpwStep  = 1;
let _bpwWeek  = null;
let _bpwYear  = null;
let _bpwPlan  = null;
let _bpwSel   = new Map();   // ciclo_id → { giorno, fascia, ora, durata, completato, completato_at, inAgenda }
let _bpwQuery = '';
let _bpwCat   = '';
let _bpwDragId = null;
let _bpwNelPiano = new Set();   // cicli già nel piano quando il wizard si è aperto (modalità modifica)
let _bpwCusc = new Map();       // cuscinetti vuoti: chiave (id della riga o 'n1', 'n2'…) → { id, giorno, ora, durata }
let _bpwRif = null;             // settimana di riferimento per il 130%: { etichetta, fatte, tot, pct } (null = non ancora letta)

// Modalità modifica: la settimana ha già un piano attivo o in bozza
function bpwModifica() { return !!_bpwPlan && _bpwPlan.stato !== 'chiuso'; }

// «questa settimana» / «la prossima settimana» / «la settimana del 26/10»
function bpwFrase(week, year) {
  const cur = bpSettimanaCorrente(), next = bpSettimanaSuccessiva(cur.week, cur.year);
  if (week === cur.week && year === cur.year) return { nome: 'questa settimana', di: 'di questa settimana' };
  if (week === next.week && year === next.year) return { nome: 'la prossima settimana', di: 'della prossima settimana' };
  const d = getWeekStart(week, year);
  const dm = `${d.getDate()}/${d.getMonth() + 1}`;
  return { nome: `la settimana del ${dm}`, di: `della settimana del ${dm}` };
}

// ‹ Settimana 42 · 12/10–18/10 ›  — non si torna prima della settimana corrente
function bpwDisegnaSettimana() {
  const da = getWeekStart(_bpwWeek, _bpwYear), a = new Date(da); a.setDate(da.getDate() + 6);
  const dm = d => `${d.getDate()}/${d.getMonth() + 1}`;
  const cur = bpSettimanaCorrente();
  const primaDiOggi = getWeekStart(_bpwWeek, _bpwYear) <= getWeekStart(cur.week, cur.year);
  document.getElementById('bpw-sub').innerHTML = `<span class="bpw-sett">
    <button type="button" class="btn btn-icon" data-act="bpw-sett" data-dir="-1" aria-label="Settimana precedente"${primaDiOggi ? ' disabled' : ''}><i class="ti ti-chevron-left"></i></button>
    <span>Settimana <span class="mono">${_bpwWeek}</span> · <span class="mono">${dm(da)}–${dm(a)}</span></span>
    <button type="button" class="btn btn-icon" data-act="bpw-sett" data-dir="1" aria-label="Settimana successiva"><i class="ti ti-chevron-right"></i></button></span>`;
}

// Armadio: cicli aperti del contesto, esclusi i rituali quotidiani
function bpwCandidati() {
  return state.cicli
    .filter(c => isAttivo(c) && !isGiornaliero(c) && !haPassiAperti(c))   // si pianificano i passi, non la cosa intera
    .sort((a, b) => {
      const qa = computeEffectiveQ(a), qb = computeEffectiveQ(b);
      if (qa !== qb) return qa - qb;
      return String(a.created_at || '').localeCompare(String(b.created_at || ''));
    });
}

function bpwDefaultDurata(c) { return (c && c.durata_minuti) || BP_DURATA_DEFAULT; }
function bpwDefaultOra(c) {
  const o = (c && (c.ora_inizio || c.scheduled_time)) || null;
  return o ? String(o).slice(0, 5) : null;
}

async function openBpWizard(week, year, preselIds) {
  if (!state.bpTableOk) { showToast('Il piano della settimana non è disponibile: migration non applicata', 'error'); return; }

  _bpwWeek = week; _bpwYear = year;
  _bpwQuery = ''; _bpwCat = ''; _bpwStep = 1;
  _bpwSel = new Map();
  _bpwNelPiano = new Set();
  _bpwCusc = new Map();
  _bpwRif = null;

  try {
    const { plan, items } = await bpFetchPlan(week, year);
    _bpwPlan = plan;
    if (bpwModifica()) items.forEach(i => { if (i.ciclo_id) _bpwNelPiano.add(i.ciclo_id); });
    items.forEach(i => {
      if (!i.ciclo_id && i.tipo_slot === 'cuscinetto') {   // cuscinetto ancora vuoto
        _bpwCusc.set(i.id, { id: i.id, giorno: i.giorno, ora: i.ora_prevista ? String(i.ora_prevista).slice(0, 5) : CUSC.META, durata: i.durata_prevista || CUSC.DURATA });
        return;
      }
      if (!state.cicli.find(c => c.id === i.ciclo_id)) return;
      _bpwSel.set(i.ciclo_id, {
        giorno: i.giorno || null, fascia: i.fascia || null,
        ora: i.ora_prevista ? String(i.ora_prevista).slice(0, 5) : null,
        durata: i.durata_prevista || BP_DURATA_DEFAULT,
        completato: !!i.completato, completato_at: i.completato_at || null,
        tipo_slot: i.tipo_slot || 'cosa'
      });
    });
    // piano nuovo (o in bozza) senza cuscinetti: due al giorno nei giorni lavorativi, se l'impostazione è accesa
    const nuovo = !plan || plan.stato === 'bozza';
    if (nuovo && state.cuscColOk && cuscAutomatici() && !items.some(i => i.tipo_slot === 'cuscinetto')) {
      GIORNI.slice(0, 5).forEach(g => { bpwAggiungiCusc(g.key, 'meta', true); bpwAggiungiCusc(g.key, 'fine', true); });
    }
  } catch (e) {
    showToast('Errore lettura piano: ' + e.message, 'error');
    return;
  }

  // Pre-selezione: cicli già pianificati in agenda per questa settimana
  bpwCandidati().forEach(c => {
    if (_bpwSel.has(c.id)) return;
    const slot = agendaSlotForWeek(c, week, year);
    if (!slot.giorno) return;
    _bpwSel.set(c.id, {
      giorno: slot.giorno, fascia: slot.fascia || null,
      ora: bpwDefaultOra(c), durata: bpwDefaultDurata(c), inAgenda: true
    });
  });

  // Cicli rinviati dalla review della settimana precedente
  (preselIds || []).forEach(id => {
    if (_bpwSel.has(id)) return;
    const c = state.cicli.find(x => x.id === id);
    if (!c) return;
    _bpwSel.set(id, { giorno: null, fascia: null, ora: bpwDefaultOra(c), durata: bpwDefaultDurata(c) });
  });

  bpwDisegnaSettimana();
  bpwCaricaRiferimento(week, year);
  const overlay = document.getElementById('bpWizOverlay');
  overlay.classList.toggle('personale-ctx', state.ctx === 'personale');
  bpwRenderCatFilter();
  bpwGoStep(1);
  overlay.classList.add('open');
}

function closeBpWizard() {
  document.getElementById('bpWizOverlay').classList.remove('open');
}

function bpwGoStep(n) {
  _bpwStep = n;
  // l'ordine del metodo i-Time: 1. le Q2 della settimana · 2. i cicli aperti realistici in 7 giorni · 3. distribuisci nei giorni
  document.getElementById('bpw-step1').style.display = n <= 2 ? '' : 'none';
  document.getElementById('bpw-step2').style.display = n === 3 ? '' : 'none';
  document.getElementById('bpw-s1').classList.toggle('on', n >= 1);
  document.getElementById('bpw-s2').classList.toggle('on', n >= 2);
  document.getElementById('bpw-s3').classList.toggle('on', n >= 3);

  const isP = state.ctx === 'personale';
  document.getElementById('bpw-title').textContent = n === 1 ? 'Le tue Q2 della settimana'
    : n === 2 ? 'Cicli aperti realistici in 7 giorni' : 'Distribuisci nei giorni';

  const next = document.getElementById('bpw-next');
  next.textContent = n < 3 ? 'Avanti' : bpwModifica() ? 'Salva il piano' : 'Attiva il piano';
  next.className = 'bp-btn primary' + (isP ? ' personale' : '');
  next.disabled = false;
  document.getElementById('bpw-back').textContent = n === 1 ? 'Annulla' : 'Indietro';

  if (n <= 2) { bpwRenderStep1(); $('bpw-list').scrollTop = 0; } else bpwRenderStep2();
}

function bpwBack() { if (_bpwStep > 1) bpwGoStep(_bpwStep - 1); else closeBpWizard(); }

async function bpwNext() {
  if (_bpwStep < 3) {
    if (_bpwStep === 2 && !_bpwSel.size) { showToast('Scegli almeno una cosa', 'warn'); return; }
    bpwGoStep(_bpwStep + 1);
    return;
  }
  await bpAttiva();
}

// ── STEP 1 ───────────────────────────────────────────────────
function bpwRenderCatFilter() {
  const sel = document.getElementById('bpw-cat');
  if (!sel) return;
  const usate = [...new Set(bpwCandidati().map(c => c.cat).filter(Boolean))];
  sel.innerHTML = '<option value="">Tutte le categorie</option>' +
    usate.map(k => `<option value="${escHtml(k)}">${escHtml(catNome(k))}</option>`).join('');
  sel.value = _bpwCat;
}

function bpwSetQuery(v) { _bpwQuery = (v || '').toLowerCase().trim(); bpwRenderStep1(); }
function bpwSetCat(v)   { _bpwCat = v || ''; bpwRenderStep1(); }

function bpwToggle(cicloId) {
  if (_bpwSel.has(cicloId)) {
    _bpwSel.delete(cicloId);
  } else {
    const c = state.cicli.find(x => x.id === cicloId);
    const slot = c ? agendaSlotForWeek(c, _bpwWeek, _bpwYear) : { giorno: null, fascia: null };
    _bpwSel.set(cicloId, {
      giorno: slot.giorno || null, fascia: slot.fascia || null,
      ora: bpwDefaultOra(c), durata: bpwDefaultDurata(c)
    });
  }
  bpwRenderStep1();
}

function bpwRenderStep1() {
  const list = document.getElementById('bpw-list');
  if (!list) return;
  list.innerHTML = '';

  const filtra = arr => arr
    .filter(c => !_bpwCat || c.cat === _bpwCat)
    .filter(c => !_bpwQuery ||
      (c.title || '').toLowerCase().includes(_bpwQuery) ||
      (c.note  || '').toLowerCase().includes(_bpwQuery));

  // passo 1: solo le Importanti (Q2) · passo 2: tutto il resto
  const q2 = _bpwStep === 1;
  const inPasso = c => (computeEffectiveQ(c) === 2) === q2;
  // in modifica: quello che è già nel piano sta in cima, anche se nel frattempo è stato tolto la spunta
  const nelPiano = filtra([..._bpwNelPiano]
    .map(id => state.cicli.find(c => c.id === id))
    .filter(c => c && inPasso(c)));
  const cicli = filtra(bpwCandidati().filter(c => !_bpwNelPiano.has(c.id) && inPasso(c)));

  const intro = document.createElement('p');
  intro.className = 'bpw-intro';
  intro.textContent = q2 ? 'Prima le attività importanti: quelle già in agenda sono inderogabili e sono già scelte.'
    : 'Ora i cicli aperti che è realistico chiudere nei prossimi 7 giorni. Il resto aspetta in Tutto.';
  list.appendChild(intro);
  if (!cicli.length && !nelPiano.length) {
    const e = document.createElement('div');
    e.className = 'bp-col-empty';
    e.textContent = q2 ? 'Nessuna Importante aperta: aggiungile da Tutto o con l\'esercizio Q2.' : 'Nessuna cosa aperta con questi filtri.';
    list.appendChild(e);
  }

  const inAgenda = c => !!c.inderogabile || !!c.calendar_event_id || !!agendaSlotForWeek(c, _bpwWeek, _bpwYear).giorno;
  const gruppi = [
    { etichetta: '<span class="tag">Già nel piano</span>', cicli: nelPiano },
    ...(q2 ? [{ etichetta: '<span class="tag tag-q2"><i class="ti ti-lock"></i>In agenda o bloccate</span>', cicli: cicli.filter(inAgenda) },
              { etichetta: '<span class="tag tag-q2"><i class="ti ti-target"></i>Altre Importanti</span>', cicli: cicli.filter(c => !inAgenda(c)) }]
      : [1, 3, 4].map(q => ({ etichetta: tagTipo(q), cicli: cicli.filter(c => computeEffectiveQ(c) === q) })))
  ];
  gruppi.forEach(g => {
    if (!g.cicli.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'bp-qgroup';
    const hd = document.createElement('div');
    hd.className = 'bp-qgroup-hd';
    hd.innerHTML = `${g.etichetta}<span style="color:var(--text-dim)">${g.cicli.length}</span>`;
    wrap.appendChild(hd);
    g.cicli.forEach(c => wrap.appendChild(bpwRigaScelta(c)));
    list.appendChild(wrap);
  });

  bpwRenderSummary();
}

function bpwRigaScelta(c) {
  const sel = _bpwSel.get(c.id);
  const row = document.createElement('label');
  row.className = 'bp-pick' + (sel ? ' sel' : '');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!sel;
  cb.onchange = () => bpwToggle(c.id);
  row.appendChild(cb);

  const main = document.createElement('div');
  main.className = 'bp-pick-main';
  const t = document.createElement('div');
  t.className = 'bp-pick-title';
  t.textContent = c.title || '';
  main.appendChild(t);

  const meta = document.createElement('div');
  meta.className = 'bp-pick-meta';
  const chip = (txt, cls) => { const s = document.createElement('span'); s.className = 'bp-chip' + (cls || ''); s.textContent = txt; meta.appendChild(s); };
  if (sel && sel.giorno && _bpwNelPiano.has(c.id)) chip(sel.giorno === 'settimana' ? 'in settimana' : GIORNI_MAP[sel.giorno].label.toLowerCase());
  if (c.parent_id && ciclo(c.parent_id)) chip(`passo di «${ciclo(c.parent_id).title}»`);
  if (c.cat) chip(catNome(c.cat));
  if (!c.parent_id && !passiDi(c.id).length && (c.durata_minuti || 0) >= PASSI.GROSSA) chip('grossa: scomponila in passi');
  const persone = (c.persone_menzionate || []).filter(Boolean);
  if (persone.length) chip(persone.slice(0, 2).join(', ') + (persone.length > 2 ? ` +${persone.length-2}` : ''));
  if (c.due_date) chip(formatDaysLeft(getDaysLeft(c.due_date)));
  if (sel && sel.inAgenda) chip('già in agenda');
  if (c.inderogabile) chip('inderogabile');
  main.appendChild(meta);
  row.appendChild(main);
  return row;
}

// «Hai scelto»: quante cose e quante ore, e il confronto con l'ultima settimana chiusa.
// Il metodo: pianificane il 130 % di quello che pensi di fare, ne chiuderai circa l'80 %.
function bpwRenderSummary() {
  const box = document.getElementById('bpw-summary');
  if (!box) return;
  const n      = _bpwSel.size;
  const minuti = [..._bpwSel.values()].reduce((s, v) => s + (v.durata || BP_DURATA_DEFAULT), 0);
  const cusc   = [..._bpwCusc.values()];
  const app    = bpwMinutiAppuntamenti();
  const rif    = _bpwRif && _bpwRif.tot ? _bpwRif : null;
  const ancora = rif && n < rif.tot * PIANO.ANCORA;

  box.innerHTML = `
    <div class="bp-sum-h">${bpwModifica() ? 'Nel piano' : 'Hai scelto'}</div>
    <div class="bp-sum-pian">Pianificato: <b class="mono">${n}</b> ${n === 1 ? 'cosa' : 'cose'} / <b class="mono">${fmtTempo(minuti)}</b></div>
    ${cusc.length ? `<div class="bp-sum-row"><span>Cuscinetti</span><strong>${cusc.length} · ${fmtTempo(cusc.reduce((s, v) => s + v.durata, 0))}</strong></div>` : ''}
    ${app ? `<div class="bp-sum-row"><span>Appuntamenti in calendario</span><strong>${fmtTempo(app)}</strong></div>` : ''}
    <div class="bp-sum-row"><span>Traguardo: farne</span><strong>${Math.ceil(n * BP_OBIETTIVO_PCT / 100)}</strong></div>
    <div class="bp-sum-rif">
      ${rif ? `<p>${rif.etichetta} ne hai chiuse <b class="mono">${rif.fatte}</b> su <b class="mono">${rif.tot}</b> (<span class="mono">${rif.pct}%</span>).</p>` : ''}
      <p>Pianificane circa il 30% in più di quante pensi di fare.</p>
      ${ancora ? `<p class="bp-sum-ancora"><i class="ti ti-plus"></i>Puoi aggiungerne ancora</p>` : ''}
    </div>`;
}

// ── STEP 2: ASSEGNAZIONE AI GIORNI (drag & drop + tap) ───────
function bpwRenderStep2() {
  const pool = document.getElementById('bpw-pool');
  const days = document.getElementById('bpw-days');
  if (!pool || !days) return;
  pool.innerHTML = '';
  days.innerHTML = '';

  const daAssegnare = [..._bpwSel.entries()].filter(([, v]) => !v.giorno);
  document.getElementById('bpw-pool-hd').textContent =
    `Senza giorno: ${daAssegnare.length}`;

  if (!daAssegnare.length) {
    const e = document.createElement('div');
    e.className = 'bp-col-empty';
    e.textContent = 'Ogni cosa ha il suo giorno';
    pool.appendChild(e);
  } else {
    daAssegnare.forEach(([id, v]) => pool.appendChild(bpwMiniCard(id, v, null)));
  }

  BP_ZONE.forEach((z, idx) => {
    const isWeekCol = z.key === 'settimana';
    const date  = isWeekCol ? null : bpDataGiorno(_bpwWeek, _bpwYear, idx);
    const lista = [..._bpwSel.entries()].filter(([, v]) => v.giorno === z.key);
    const min   = lista.reduce((s, [, v]) => s + (v.durata || BP_DURATA_DEFAULT), 0);

    const zone = document.createElement('div');
    zone.className = 'bp-drop';
    zone.dataset.zona = z.key;

    const hd = document.createElement('div');
    hd.className = 'bp-drop-hd';
    hd.innerHTML = isWeekCol
      ? `<span>IN SETTIMANA</span><span class="bp-drop-tot">${lista.length ? bpFormatMin(min) : '—'}</span>`
      : `<span>${z.short} ${date.getDate()}/${date.getMonth()+1}</span><span class="bp-drop-tot">${lista.length ? bpFormatMin(min) : '—'}</span>`;
    zone.appendChild(hd);

    const body = document.createElement('div');
    body.className = 'bp-drop-body';
    if (!lista.length) {
      const e = document.createElement('div');
      e.className = 'bp-col-empty';
      e.textContent = '—';
      body.appendChild(e);
    } else {
      lista
        .sort((a, b) => (a[1].ora || '99:99').localeCompare(b[1].ora || '99:99'))
        .forEach(([id, v]) => body.appendChild(bpwMiniCard(id, v, z.key)));
    }
    zone.appendChild(body);

    bpwAttachDrop(zone, z.key);
    days.appendChild(zone);
  });
}

function bpwMiniCard(cicloId, v, zonaKey) {
  const c = state.cicli.find(x => x.id === cicloId);
  const q = c ? computeEffectiveQ(c) : 2;

  const el = document.createElement('div');
  el.className = 'bp-mini q' + q;
  el.draggable = true;
  el.dataset.id = cicloId;
  el.dataset.tip = 'Trascina in un giorno, oppure tocca per scegliere giorno e momento';

  const x = document.createElement('span');
  x.className = 'bp-mini-x';
  x.textContent = '✕';
  x.setAttribute('aria-label', 'Togli dal piano');
  x.onclick = e => { e.stopPropagation(); _bpwSel.delete(cicloId); bpwRenderStep2(); };
  el.appendChild(x);

  const t = document.createElement('span');
  t.textContent = c ? (c.title || '') : '(ciclo eliminato)';
  el.appendChild(t);

  const meta = document.createElement('div');
  meta.className = 'bp-mini-meta';
  const parti = [];
  if (v.ora) parti.push(v.ora);
  if (v.fascia && FASCE_MAP[v.fascia]) parti.push(FASCE_MAP[v.fascia].label.toLowerCase());
  parti.push(bpFormatMin(v.durata || BP_DURATA_DEFAULT));
  meta.textContent = parti.join(' · ');
  el.appendChild(meta);

  el.onclick = () => bpSlotOpen(cicloId, zonaKey || v.giorno || 'lunedi');
  el.addEventListener('dragstart', e => {
    _bpwDragId = cicloId;
    el.classList.add('dragging');
    try { e.dataTransfer.setData('text/plain', cicloId); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
  });
  el.addEventListener('dragend', () => {
    _bpwDragId = null;
    el.classList.remove('dragging');
    document.querySelectorAll('.bp-drop.drag-over').forEach(z => z.classList.remove('drag-over'));
  });
  return el;
}

function bpwAttachDrop(zone, zonaKey) {
  zone.addEventListener('dragover', e => {
    if (!_bpwDragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', e => {
    if (zone.contains(e.relatedTarget)) return;
    zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    let id = _bpwDragId;
    try { id = e.dataTransfer.getData('text/plain') || id; } catch (_) {}
    _bpwDragId = null;
    if (!id || !_bpwSel.has(id)) return;
    const v = _bpwSel.get(id);
    // Fascia e durata già note (o colonna "settimana"): assegna diretto, senza chiedere
    if (zonaKey === 'settimana' || (v.fascia && v.durata)) {
      _bpwSel.set(id, { ...v, giorno: zonaKey, fascia: zonaKey === 'settimana' ? null : v.fascia });
      bpwRenderStep2();
    } else {
      bpSlotOpen(id, zonaKey);
    }
  });
}

// ── MINI PANNELLO: giorno / fascia / ora / durata ────────────
let _bpsCicloId = null;
let _bpsFascia  = 'mattina';

function bpSlotOpen(cicloId, giornoKey) {
  const v = _bpwSel.get(cicloId);
  if (!v) return;
  const c = state.cicli.find(x => x.id === cicloId);
  _bpsCicloId = cicloId;
  _bpsFascia  = v.fascia || 'mattina';

  document.getElementById('bps-sub').textContent = c ? (c.title || '') : '';

  const gsel = document.getElementById('bps-giorno');
  gsel.innerHTML = BP_ZONE.map(z =>
    `<option value="${z.key}">${z.key === 'settimana' ? 'In settimana, senza giorno' : z.label}</option>`).join('');
  gsel.value = giornoKey || v.giorno || 'lunedi';

  const fasce = document.getElementById('bps-fasce');
  fasce.innerHTML = '';
  FASCE.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bp-slot-opt' + (f.key === _bpsFascia ? ' sel' : '');
    b.textContent = f.label;
    b.onclick = () => {
      _bpsFascia = f.key;
      [...fasce.children].forEach(x => x.classList.toggle('sel', x === b));
    };
    fasce.appendChild(b);
  });

  document.getElementById('bps-ora').value = v.ora || '';
  const dsel = document.getElementById('bps-durata');
  const dur  = String(v.durata || bpwDefaultDurata(c));
  dsel.value = [...dsel.options].some(o => o.value === dur) ? dur : String(BP_DURATA_DEFAULT);

  const panel = document.getElementById('bpSlotPanel');
  panel.classList.toggle('personale-ctx', state.ctx === 'personale');
  panel.classList.add('open');
}

function bpSlotClose() {
  document.getElementById('bpSlotPanel').classList.remove('open');
  _bpsCicloId = null;
}

function bpSlotConfirm() {
  const id = _bpsCicloId;
  if (!id || !_bpwSel.has(id)) { bpSlotClose(); return; }
  const giorno = document.getElementById('bps-giorno').value;
  const ora    = document.getElementById('bps-ora').value || null;
  const durata = parseInt(document.getElementById('bps-durata').value, 10) || BP_DURATA_DEFAULT;

  _bpwSel.set(id, {
    ..._bpwSel.get(id),
    giorno,
    fascia: giorno === 'settimana' ? null : _bpsFascia,
    ora, durata
  });
  bpSlotClose();
  bpwRenderStep2();
}

document.getElementById('bpSlotPanel').addEventListener('click', e => {
  if (e.target.id === 'bpSlotPanel') bpSlotClose();
});

// ── STEP 3: ATTIVAZIONE ──────────────────────────────────────
async function bpAttiva() {
  const btn = document.getElementById('bpw-next');
  btn.disabled = true;
  btn.textContent = 'Un attimo...';

  try {
    const { data: planRows, error } = await db.from('battle_plan')
      .upsert({ settimana: _bpwWeek, anno: _bpwYear, stato: 'attivo' }, { onConflict: 'settimana,anno' })
      .select();
    if (error) throw error;
    const plan = (planRows && planRows[0]) || _bpwPlan;
    if (!plan) throw new Error('Piano non creato');

    // rimuovi gli item non più selezionati
    const { data: esistenti, error: e1 } = await db.from('battle_plan_items')
      .select('id,ciclo_id').eq('battle_plan_id', plan.id);
    if (e1) throw e1;
    // via le cose tolte e i cuscinetti vuoti tolti (le righe senza cosa restano solo se sono ancora nel wizard)
    const daEliminare = (esistenti || []).filter(i => i.ciclo_id ? !_bpwSel.has(i.ciclo_id) : !_bpwCusc.has(i.id)).map(i => i.id);
    if (daEliminare.length) {
      const { error: e2 } = await db.from('battle_plan_items').delete().in('id', daEliminare);
      if (e2) throw e2;
    }

    const rows = [..._bpwSel.entries()].map(([cicloId, v], idx) => ({
      battle_plan_id:  plan.id,
      ciclo_id:        cicloId,
      giorno:          v.giorno || 'settimana',
      fascia:          v.giorno === 'settimana' || !v.giorno ? null : (v.fascia || null),
      ora_prevista:    v.ora || null,
      durata_prevista: v.durata || BP_DURATA_DEFAULT,
      completato:      !!v.completato,
      completato_at:   v.completato_at || null,
      ordine:          idx,
      ...(state.cuscColOk ? { tipo_slot: v.tipo_slot || 'cosa' } : {})
    }));
    if (rows.length) {
      const { error: e3 } = await db.from('battle_plan_items')
        .upsert(rows, { onConflict: 'battle_plan_id,ciclo_id' });
      if (e3) throw e3;
    }
    if (state.cuscColOk) await bpwSalvaCuscinetti(plan.id, rows.length);
    const suCalendar = !!(document.getElementById('bpw-cal') || {}).checked;
    if (document.getElementById('bpw-cal')) lsScrivi(LS4.BPW_CAL, suCalendar ? '1' : null);

    const n = rows.length;
    const modifica = bpwModifica();
    closeBpWizard();

    // porta la vista sulla settimana appena pianificata
    if (state.week !== _bpwWeek || state.year !== _bpwYear) {
      state.week = _bpwWeek; state.year = _bpwYear;
      localStorage.setItem(LS.WEEK, state.week);
      await reloadWeekData();
    } else {
      await loadBattlePlan();
    }
    ui.pian = 'settimana';
    vai('pianifica');
    caricaRimaste();
    ui.pianoProssima = null;
    showToast(modifica ? `Piano aggiornato: ${n} cose` : `Piano della settimana pronto: ${n} cose`, 'success');
    // gli eventi già bloccati seguono il nuovo giorno/ora; con la spunta si creano anche quelli che mancano
    if (suCalendar) setTimeout(() => mettiPianoSuCalendar(), 600); else allineaBlocchi();
  } catch (err) {
    showToast('Errore attivazione: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = bpwModifica() ? 'Salva il piano' : 'Attiva il piano';
  }
}

// ── REVIEW: CHIUSURA SETTIMANA ───────────────────────────────
let _bpRevScelte = new Map();   // item_id → 'sposta' | 'armadio' | 'chiudi'

const BP_REV_OPZIONI = [
  { key: 'sposta',  label: ' Prossima settimana' },
  { key: 'armadio', label: ' Rimetti nell\'armadio' },
  { key: 'chiudi',  label: ' Chiudi comunque' }
];



// ── Q2: SPINTA VERSO L'AGENDA ────────────────────────────────
// Banner informativo sotto il quadrant picker: i Q2 non urgenti spariscono
// se non vengono piazzati in agenda. Non blocca il salvataggio.
async function q2PianificaOra() {
  if (editingId) {
    const id = editingId;
    closeModal('modalOverlay');
    openPianificaModal(id);
    return;
  }
  const titolo = document.getElementById('f-title').value.trim();
  if (!titolo) { showToast('Inserisci prima un titolo', 'warn'); return; }
  const saved = await saveCiclo();
  if (saved && saved.id) setTimeout(() => openPianificaModal(saved.id), 150);
}

// ── EXPORT PDF A4 ────────────────────────────────────────────
// jsPDF usa i font standard PDF (WinAnsi): niente emoji, vanno rimosse
// altrimenti escono caratteri sporchi.
function pdfTxt(s) {
  return String(s || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}


// ── REALTIME BATTLE PLAN (canale separato: se la tabella non è in
//    publication non arrivano eventi, ma il resto dell'app non si rompe) ──
try {
  db.channel('bp-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_plan' },
        () => loadBattlePlan().then(() => { if (state.view === 'bp') renderBattlePlan(); }))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_plan_items' },
        () => loadBattlePlan().then(() => { if (state.view === 'bp') renderBattlePlan(); }))
    .subscribe();
} catch (e) { console.warn('[BattlePlan] realtime non attivo:', e.message); }


// ╔════════════════════════════════════════════════════════════╗
