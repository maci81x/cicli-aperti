// Banco di prova di Cicli Aperti: l'app vera (index.html del repo) con Supabase e Google Calendar finti, tutto in memoria.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const NM = process.env.NM || path.join(__dirname, 'node_modules');
const APP = path.join(__dirname, '..', 'index.html');
const SB = 'https://qujxbvootvollmziaqrd.supabase.co';
const EMAIL = 'maci81x@gmail.com';
const leggi = p => fs.readFileSync(p);
const LIBS = {
  supa: leggi(path.join(NM, '@supabase/supabase-js/dist/umd/supabase.js')),
  jspdf: leggi(path.join(NM, 'jspdf/dist/jspdf.umd.min.js')),
  tabler: leggi(path.join(NM, '@tabler/icons-webfont/dist/tabler-icons.min.css')),
};
const clone = x => JSON.parse(JSON.stringify(x));

// --- PostgREST in miniatura ---
function valore(v) { if (v === 'null') return null; if (v === 'true') return true; if (v === 'false') return false; return v; }
function confronta(riga, col, op, v) {
  const x = riga[col];
  switch (op) {
    case 'eq': return String(x) === String(valore(v)) || x === valore(v);
    case 'neq': return String(x) !== String(valore(v));
    case 'is': return v === 'null' ? x == null : v === 'true' ? x === true : v === 'false' ? x === false : true;
    case 'gt': return x != null && x > v; case 'gte': return x != null && x >= v;
    case 'lt': return x != null && x < v; case 'lte': return x != null && x <= v;
    case 'in': { const l = v.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/^"|"$/g, '')); return l.includes(String(x)); }
    case 'cs': { const l = v.replace(/^\{|\}$/g, '').split(',').filter(Boolean); return Array.isArray(x) && l.every(e => x.includes(e)); }
    case 'like': case 'ilike': { const rx = new RegExp('^' + v.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/%/g, '.*') + '$', op === 'ilike' ? 'i' : ''); return rx.test(String(x ?? '')); }
    default: return true;
  }
}
function filtra(righe, params) {
  let out = righe;
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
    if (k === 'or') continue;
    const m = v.match(/^(not\.)?(eq|neq|is|gt|gte|lt|lte|in|cs|like|ilike)\.(.*)$/s);
    if (!m) continue;
    out = out.filter(r => { const ok = confronta(r, k, m[2], m[3]); return m[1] ? !ok : ok; });
  }
  const ord = params.get('order');
  if (ord) {
    const parti = ord.split(',').map(p => { const [c, d, n] = p.split('.'); return { c, desc: d === 'desc', n }; });
    out = [...out].sort((a, b) => { for (const p of parti) { const x = a[p.c], y = b[p.c]; if (x === y) continue; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : -1) * (p.desc ? -1 : 1); } return 0; });
  }
  const off = +(params.get('offset') || 0), lim = params.get('limit');
  if (off || lim) out = out.slice(off, lim ? off + +lim : undefined);
  return out;
}
let _id = 1;
const nuovoId = () => '00000000-0000-4000-8000-' + String(_id++).padStart(12, '0');

function makeDb(seed) {
  const t = clone(seed || {});
  const writes = [];
  async function handle(route) {
    const req = route.request(), u = new URL(req.url()), meth = req.method();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': 'content-range', 'content-type': 'application/json' };
    if (meth === 'OPTIONS') return route.fulfill({ status: 200, headers, body: '' });
    if (u.pathname.startsWith('/auth/v1/')) {
      const user = { id: 'u-roby', email: EMAIL, aud: 'authenticated', role: 'authenticated' };
      if (/\/user$/.test(u.pathname)) return route.fulfill({ status: 200, headers, body: JSON.stringify(user) });
      return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: 'tok', refresh_token: 'r', token_type: 'bearer', expires_in: 360000, expires_at: Math.floor(Date.now() / 1000) + 360000, user }) });
    }
    if (u.pathname.startsWith('/functions/')) return route.fulfill({ status: 500, headers, body: JSON.stringify({ error: 'finta: niente Claude nei test' }) });
    if (u.pathname.startsWith('/storage/')) return route.fulfill({ status: 200, headers, body: '[]' });
    const m = u.pathname.match(/^\/rest\/v1\/(rpc\/)?([\w]+)/);
    if (!m) return route.fulfill({ status: 404, headers, body: '{}' });
    if (m[1]) return route.fulfill({ status: 200, headers, body: 'null' });
    const tab = m[2]; t[tab] = t[tab] || [];
    const p = u.searchParams, pref = req.headers()['prefer'] || '', single = /vnd\.pgrst\.object/.test(req.headers()['accept'] || '');
    let corpo = null; try { corpo = req.postData() ? JSON.parse(req.postData()) : null; } catch (_) {}
    let righe;
    if (meth === 'GET' || meth === 'HEAD') {
      righe = filtra(t[tab], p);
      if (/count=exact/.test(pref)) headers['content-range'] = `0-${Math.max(0, righe.length - 1)}/${righe.length}`;
    } else if (meth === 'POST') {
      const lista = (Array.isArray(corpo) ? corpo : [corpo]).map(r => ({ id: nuovoId(), created_at: new Date().toISOString(), ...r }));
      const key = p.get('on_conflict');
      righe = lista.map(r => {
        const k = key || 'id';
        const i = /merge-duplicates/.test(pref) || key ? t[tab].findIndex(x => x[k] === r[k]) : -1;
        if (i >= 0) { t[tab][i] = { ...t[tab][i], ...r }; return t[tab][i]; }
        t[tab].push(r); return r;
      });
      writes.push({ tab, meth, body: corpo });
    } else if (meth === 'PATCH') {
      righe = filtra(t[tab], p); righe.forEach(r => Object.assign(r, corpo)); writes.push({ tab, meth, body: corpo, n: righe.length });
    } else if (meth === 'DELETE') {
      righe = filtra(t[tab], p); t[tab] = t[tab].filter(r => !righe.includes(r)); writes.push({ tab, meth, n: righe.length });
    }
    if (meth !== 'GET' && !/return=representation/.test(pref)) return route.fulfill({ status: meth === 'POST' ? 201 : 204, headers, body: '' });
    const sel = p.get('select');
    let out = righe;
    if (sel && sel !== '*' && !sel.includes('(')) { const cols = sel.split(','); out = righe.map(r => Object.fromEntries(cols.map(c => [c, r[c] ?? null]))); }
    if (single) return out.length ? route.fulfill({ status: 200, headers, body: JSON.stringify(out[0]) }) : route.fulfill({ status: 406, headers, body: JSON.stringify({ code: 'PGRST116', message: 'no rows' }) });
    return route.fulfill({ status: 200, headers, body: JSON.stringify(out) });
  }
  return { tabelle: t, writes, handle };
}

// --- Google Calendar finto ---
function makeCal(events) {
  const state = { events: clone(events || { 'r.macinai@sisoluzioniimpresa.it': [], 'maci81x@gmail.com': [] }), writes: [] };
  async function handle(route) {
    const req = route.request(), u = new URL(req.url()), meth = req.method();
    const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (/calendarList/.test(u.pathname)) return route.fulfill({ status: 200, headers, body: JSON.stringify({ items: [{ id: 'r.macinai@sisoluzioniimpresa.it', summary: 'Lavoro', accessRole: 'owner' }, { id: 'maci81x@gmail.com', summary: 'Privato', accessRole: 'owner', primary: true }] }) });
    const m = u.pathname.match(/\/calendars\/([^/]+)\/events(?:\/([^/]+))?/);
    if (!m) return route.fulfill({ status: 200, headers, body: '{}' });
    const cal = decodeURIComponent(m[1]) === 'primary' ? 'maci81x@gmail.com' : decodeURIComponent(m[1]), id = m[2] && decodeURIComponent(m[2]);
    const lista = state.events[cal] = state.events[cal] || [];
    let corpo = null; try { corpo = req.postData() ? JSON.parse(req.postData()) : null; } catch (_) {}
    if (meth !== 'GET') state.writes.push({ method: meth, url: u.pathname, body: corpo });
    if (meth === 'GET' && !id) {
      const a = u.searchParams.get('timeMin'), b = u.searchParams.get('timeMax');
      const ini = e => new Date(e.start.dateTime || e.start.date + 'T00:00:00');
      const items = lista.filter(e => (!a || ini(e) < new Date(b)) && (!b || new Date(e.end.dateTime || e.end.date + 'T00:00:00') > new Date(a)));
      return route.fulfill({ status: 200, headers, body: JSON.stringify({ items }) });
    }
    const i = lista.findIndex(e => e.id === id);
    if (meth === 'GET') return i >= 0 ? route.fulfill({ status: 200, headers, body: JSON.stringify(lista[i]) }) : route.fulfill({ status: 404, headers, body: '{}' });
    if (meth === 'PATCH' || meth === 'PUT') { if (i >= 0) Object.assign(lista[i], corpo); return route.fulfill({ status: 200, headers, body: JSON.stringify(lista[i] || corpo) }); }
    if (meth === 'DELETE') { if (i >= 0) lista.splice(i, 1); return route.fulfill({ status: 204, headers, body: '' }); }
    if (meth === 'POST') { const ev = { id: 'nuovo' + Date.now(), status: 'confirmed', organizer: { self: true }, ...corpo }; lista.push(ev); return route.fulfill({ status: 200, headers, body: JSON.stringify(ev) }); }
    return route.fulfill({ status: 200, headers, body: '{}' });
  }
  return { state, handle };
}

const SEED_BASE = { cicli: [], persone: [], categorie: [], battle_plan: [], battle_plan_items: [], eventi_fatti: [], cal_scelte: [], eventi_nascosti: [], eventi_tipo: [], macro_aree: [], mete: [], non_doppioni: [], user_tokens: [] };

async function apriApp(opts = {}) {
  const browser = await chromium.launch();
  const ctxOpts = opts.mobile ? { ...devices['iPhone 13'] } : { viewport: opts.viewport || { width: 1280, height: 900 } };
  if (opts.oraFinta) ctxOpts.timezoneId = 'Europe/Rome'; else ctxOpts.timezoneId = 'Europe/Rome';
  const context = await browser.newContext(ctxOpts);
  const db = makeDb({ ...SEED_BASE, ...(opts.seed || {}) });
  const cal = makeCal(opts.events);
  const logs = [];
  const sessione = { access_token: 'tok', refresh_token: 'r', token_type: 'bearer', expires_in: 360000, expires_at: Math.floor(Date.now() / 1000) + 360000, user: { id: 'u-roby', email: EMAIL, aud: 'authenticated', role: 'authenticated' } };
  await context.addInitScript(([s, conCal, ls]) => {
    try {
      if (!sessionStorage.getItem('__init')) {
        localStorage.setItem('sb-qujxbvootvollmziaqrd-auth-token', JSON.stringify(s));
        localStorage.setItem('cicli_onboarded', '1');
        if (conCal) { localStorage.setItem('gcal_token', 'gtok'); localStorage.setItem('gcal_expires', String(Date.now() + 3e11)); localStorage.setItem('gcal_scope', 'https://www.googleapis.com/auth/calendar'); localStorage.setItem('gcal_email', 'r.macinai@sisoluzioniimpresa.it'); }
        for (const [k, v] of Object.entries(ls || {})) localStorage.setItem(k, v);
        sessionStorage.setItem('__init', '1');
      }
    } catch (_) {}
    if (window.__oraFinta) {}
  }, [sessione, !!opts.events, opts.localStorage || {}]);
  if (opts.ora) {
    await context.addInitScript(t => {
      const Vero = Date, base = new Vero(t).getTime(), avvio = Vero.now();
      class Finta extends Vero { constructor(...a) { if (a.length) super(...a); else super(base + (Vero.now() - avvio)); } static now() { return base + (Vero.now() - avvio); } }
      window.Date = Finta;
    }, opts.ora);
  }
  await context.route(/^https?:\/\/(?!cicli\.test)/, r => r.fulfill({ status: 404, body: '' }));   // per ultimo: tutto il resto della rete è spento
  await context.route('http://cicli.test/**', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(APP) }));
  await context.route(/cdn\.jsdelivr\.net\/npm\/@supabase/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: LIBS.supa }));
  await context.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: LIBS.jspdf }));
  await context.route(/tabler-icons\.min\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: LIBS.tabler }));
  await context.route(/icons-webfont@[\d.]+\/dist\/fonts\/(.+)$/, r => { const f = r.request().url().match(/fonts\/([^?#]+)/)[1]; const p = path.join(NM, '@tabler/icons-webfont/dist/fonts', f); return fs.existsSync(p) ? r.fulfill({ status: 200, body: fs.readFileSync(p) }) : r.fulfill({ status: 404, body: '' }); });
  await context.route(/accounts\.google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/, r => r.fulfill({ status: 200, contentType: /\.css|css2/.test(r.request().url()) ? 'text/css' : 'application/javascript', body: '' }));
  await context.route(/supabase\.co\/realtime/, r => r.abort());
  await context.route(/supabase\.co/, db.handle);
  await context.route(/googleapis\.com\/calendar/, cal.handle);
  await context.route(/googleapis\.com\/oauth2|www\.googleapis\.com\/userinfo/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ email: 'r.macinai@sisoluzioniimpresa.it', scope: 'https://www.googleapis.com/auth/calendar', expires_in: 3600 }) }));
  const page = await context.newPage();
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => logs.push('Uncaught: ' + e.message));
  page.on('requestfailed', q => logs.push('reqfail: ' + q.url().slice(0, 90)));
  await page.goto('http://cicli.test/index.html', { waitUntil: 'domcontentloaded' });
  try { await page.waitForFunction(() => typeof state !== 'undefined' && state.utente, null, { timeout: 15000 }); } catch (e) { console.log('NON PARTE', JSON.stringify(logs.slice(0, 8)), await page.evaluate(() => ({ acc: document.getElementById('accesso') && !document.getElementById('accesso').hidden, txt: document.body.innerText.slice(0, 200), ls: Object.keys(localStorage) }))); throw e; }
  await page.waitForTimeout(opts.attesa || 1500);
  return { browser, context, page, logs, db, cal };
}
const errori = logs => logs.filter(l => /error|Uncaught|TypeError/i.test(l) && !/404|finta|Failed to load resource|ERR_|net::|WebSocket/.test(l));
const assertDi = () => { const s = { ok: 0, fail: 0 }; const a = (c, m) => { if (!c) { s.fail++; console.log('FAIL', m); process.exitCode = 1; } else { s.ok++; console.log('ok  ', m); } }; a.stato = s; return a; };
module.exports = { apriApp, errori, assertDi };
