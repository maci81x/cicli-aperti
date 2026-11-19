// v9 (22/10) · CLAUDE DAL SERVER
// Edge Function «claude» (segreto ANTHROPIC_API_KEY su Supabase). Finché il segreto
// non c'è si usa la chiave salvata in questo browser, e Impostazioni lo dice.
// ══════════════════════════════════════════════════════════════
const CLAUDE = {
  MODELLO: 'claude-haiku-5-5',
  FUNZIONE: SUPABASE_URL + '/functions/v1/claude',
  // uguali a quelli della funzione: servono solo per la chiave nel browser
  PARAMS: {
    riunione: { max_tokens: 16000, output_config: { effort: 'low' } },
    area: { max_tokens: 256, thinking: { type: 'disabled' }, output_config: { effort: 'low' } }
  },
  ERRORI: {
    utente: 'questo utente non può usare Claude',
    testo: 'il testo è vuoto o troppo lungo',
    rifiuto: 'Claude non ha risposto a questa richiesta',
    anthropic: 'Claude non risponde, riprova tra poco'
  }
};
state.claudeServer = null;   // null = non lo so ancora · true = il segreto c'è · false = manca

const chiaveBrowser = () => localStorage.getItem(LS.CLAUDE_KEY) || '';
// si può chiedere a Claude? (server pronto o da verificare, oppure una chiave nel browser)
const claudeDisponibile = () => state.claudeServer !== false || !!chiaveBrowser();

async function chiamaFunzioneClaude(corpo) {
  const { data } = await db.auth.getSession();
  const token = data && data.session && data.session.access_token;
  if (!token) throw new Error('non sei collegato');
  const res = await fetch(CLAUDE.FUNZIONE, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, apikey: SUPABASE_ANON, 'content-type': 'application/json' },
    body: JSON.stringify(corpo)
  });
  const dati = await res.json().catch(() => ({}));
  return { ok: res.ok, stato: res.status, dati };
}

async function controllaClaudeServer() {
  try {
    const r = await chiamaFunzioneClaude({ compito: 'stato' });
    state.claudeServer = r.ok ? !!r.dati.pronto : null;
  } catch (e) {
    console.warn('[Claude] stato del server:', e.message);
    state.claudeServer = null;
  }
  return state.claudeServer;
}

async function chiamaClaudeBrowser(compito, testo, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: CLAUDE.MODELLO, messages: [{ role: 'user', content: testo }], ...CLAUDE.PARAMS[compito] })
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err.error && err.error.message) || 'HTTP ' + res.status); }
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error(CLAUDE.ERRORI.rifiuto);
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
}

// compito = 'riunione' | 'area'; restituisce il testo della risposta
async function chiediClaude(compito, testo) {
  if (state.claudeServer !== false) {
    let r = null;
    try { r = await chiamaFunzioneClaude({ compito, testo }); }
    catch (e) { if (!chiaveBrowser()) throw e; console.warn('[Claude] server non raggiungibile, uso la chiave del browser:', e.message); }
    if (r && r.ok) { state.claudeServer = true; return r.dati.testo || ''; }
    if (r && !(r.stato === 503 && r.dati.errore === 'manca_segreto')) throw new Error(CLAUDE.ERRORI[r.dati.errore] || 'HTTP ' + r.stato);
    if (r) state.claudeServer = false;
  }
  const chiave = chiaveBrowser();
  if (!chiave) throw new Error('manca la chiave di Claude');
  return chiamaClaudeBrowser(compito, testo, chiave);
}

function sezioneClaude() {
  const browser = !!chiaveBrowser(), server = state.claudeServer;
  const stato = server === true ? 'sul server' : browser ? 'in questo browser' : 'non impostata';
  const avviso = server === false
    ? `<div class="avviso"><i class="ti ti-alert-triangle"></i><span>${browser ? 'La chiave di Claude è ancora salvata in questo browser.' : 'Claude è spento: manca la chiave.'} Mettila sul server: Supabase → Edge Functions → Secrets, nome <span class="mono">ANTHROPIC_API_KEY</span>. Poi riapri Impostazioni.</span></div>`
    : '';
  const togli = server === true && browser
    ? `<button type="button" class="riga-link" data-act="apikey-togli"><i class="ti ti-trash"></i><span>Togli la chiave da questo browser<small>non serve più: Claude usa quella del server</small></span><span></span><i class="ti ti-chevron-right"></i></button>`
    : '';
  return `<p class="list-head"><span>Claude</span></p>${avviso}
    <div class="group">${server === true ? `<div class="riga-link" style="grid-template-columns:24px 1fr auto"><i class="ti ti-server"></i><span>Chiave</span><small>sul server</small></div>`
      : `<button type="button" class="riga-link" data-act="apikey"><i class="ti ti-key"></i><span>Chiave API</span><small>${stato}</small><i class="ti ti-chevron-right"></i></button>`}${togli}</div>`;
}
AZIONI['apikey-togli'] = () => { localStorage.removeItem(LS.CLAUDE_KEY); showToast('Chiave tolta da questo browser', 'success'); render(); };

// ══════════════════════════════════════════════════════════════
