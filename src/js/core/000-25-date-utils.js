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

