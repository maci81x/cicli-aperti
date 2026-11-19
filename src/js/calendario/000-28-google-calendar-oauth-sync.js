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




function disconnectGcal() {
  gcal.token = null; gcal.calendarId = null; gcal.email = null; gcal.expiresAt = 0;
  ['gcal_token','gcal_expires','gcal_cal_id','gcal_email','gcal_scope'].forEach(k => localStorage.removeItem(k));
  db.from('user_tokens').delete().eq('user_email', GCAL_USER_EMAIL).then(() => {});
  updateGcalButton();
  closeModal('gcalOverlay');
  showToast('Google Calendar disconnesso', 'info');
}


