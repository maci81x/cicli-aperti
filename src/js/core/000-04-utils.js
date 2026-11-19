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

