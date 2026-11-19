// ══════════════════════════════════════════════════════════════
// ACCESSO · Supabase Auth con codice personale (password), un solo utente.
// L'email è fissa e non si vede. La protezione vera sono le policy RLS
// (auth.jwt() ->> 'email'): questo serve solo a non far partire l'app senza sessione.
// ══════════════════════════════════════════════════════════════
const EMAIL_AMMESSA = 'maci81x@gmail.com';
const ACCESSO = { MAX_ERRORI: 5, BLOCCO_MS: 60 * 1000, LS_ERRORI: 'accesso_errori', LS_BLOCCO: 'accesso_blocco_fino' };
let _appAvviata = false;
let _accessoTimer = null;
const urlRitorno = () => location.origin + location.pathname;
const emailDi = s => ((s && s.user && s.user.email) || '').trim().toLowerCase();
const sessioneAmmessa = s => !!(s && s.access_token) && emailDi(s) === EMAIL_AMMESSA;
const erroriDiFila = () => parseInt(lsLeggi(ACCESSO.LS_ERRORI) || '0', 10) || 0;
const bloccatoFino = () => parseInt(lsLeggi(ACCESSO.LS_BLOCCO) || '0', 10) || 0;

function statoAccesso(testo, errore) {
  const el = $('accesso-stato');
  el.textContent = testo || '';
  el.classList.toggle('errore', !!errore);
}
function abilitaAccesso(si) {
  $('accesso-codice').disabled = !si;
  $('accesso-entra').disabled = !si;
}
// Dopo 5 codici sbagliati di fila il campo resta spento per un minuto (anche se ricarichi la pagina).
function controllaBlocco() {
  clearInterval(_accessoTimer);
  const resto = bloccatoFino() - Date.now();
  if (resto <= 0) {
    if (bloccatoFino()) { lsScrivi(ACCESSO.LS_BLOCCO, null); lsScrivi(ACCESSO.LS_ERRORI, null); statoAccesso(''); }
    abilitaAccesso(true);
    return false;
  }
  abilitaAccesso(false);
  const scrivi = () => {
    const sec = Math.ceil((bloccatoFino() - Date.now()) / 1000);
    if (sec <= 0) { controllaBlocco(); $('accesso-codice').focus(); return; }
    statoAccesso(`Troppi codici sbagliati di fila: riprova tra ${sec} ${sec === 1 ? 'secondo' : 'secondi'}.`, true);
  };
  scrivi();
  _accessoTimer = setInterval(scrivi, 1000);
  return true;
}
function mostraAccesso(msg, errore) {
  $('accesso').hidden = false;
  $('accesso-utente').value = EMAIL_AMMESSA;   // per il gestore delle password, non si vede
  statoAccesso(msg, errore);
  if (!controllaBlocco()) setTimeout(() => $('accesso-codice').focus(), 50);
}
function mostraCodice() {
  const campo = $('accesso-codice'), btn = document.querySelector('[data-act="accesso-occhio"]');
  const visibile = campo.type === 'password';
  campo.type = visibile ? 'text' : 'password';
  btn.setAttribute('aria-pressed', String(visibile));
  btn.setAttribute('aria-label', visibile ? 'Nascondi il codice' : 'Mostra il codice');
  btn.innerHTML = `<i class="ti ${visibile ? 'ti-eye-off' : 'ti-eye'}"></i>`;
  campo.focus();
}
const codiceSbagliato = e => !!e && (e.code === 'invalid_credentials' || /invalid login credentials/i.test(e.message || ''));
async function entra(ev) {
  ev.preventDefault();
  if (controllaBlocco()) return;
  const codice = $('accesso-codice').value;
  if (!codice) { statoAccesso('Scrivi il tuo codice.', true); $('accesso-codice').focus(); return; }
  abilitaAccesso(false);
  statoAccesso('Controllo il codice…');
  try {
    const { error } = await db.auth.signInWithPassword({ email: EMAIL_AMMESSA, password: codice });
    if (error) throw error;
    lsScrivi(ACCESSO.LS_ERRORI, null);
    statoAccesso('');
    // l'app parte da onAuthStateChange (SIGNED_IN)
  } catch (e) {
    console.warn('[Accesso]', e.code || e.status || '', e.message);
    abilitaAccesso(true);
    $('accesso-codice').select();
    if (!codiceSbagliato(e)) {
      const tanti = e.status === 429 || /rate|too many/i.test(e.message || '');
      return statoAccesso(tanti ? 'Troppi tentativi: aspetta qualche minuto e riprova.' : 'Non riesco a collegarmi. Controlla la connessione e riprova.', true);
    }
    const n = erroriDiFila() + 1;
    lsScrivi(ACCESSO.LS_ERRORI, String(n));
    if (n >= ACCESSO.MAX_ERRORI) { lsScrivi(ACCESSO.LS_BLOCCO, String(Date.now() + ACCESSO.BLOCCO_MS)); controllaBlocco(); return; }
    statoAccesso('Codice sbagliato', true);
  }
}
function chiediEsci() {
  apriConferma({ titolo: 'Esci da Cicli Aperti?', testo: 'Per rientrare ti servirà il tuo codice.', ok: 'Esci', no: 'Resta', onOk: esci });
}
async function esci() {
  try { await db.auth.signOut(); } catch (e) { console.warn('[Accesso] uscita:', e.message); }
  location.replace(urlRitorno());
}

(async function accesso() {
  applyTheme();
  $('accesso-form').addEventListener('submit', entra);
  db.auth.onAuthStateChange((evento, sessione) => {
    // niente chiamate a Supabase dentro questa funzione: si rimanda con setTimeout
    if (sessione && sessione.access_token) db.realtime.setAuth(sessione.access_token);
    if (evento === 'SIGNED_OUT' && _appAvviata) { setTimeout(() => location.replace(urlRitorno()), 0); return; }
    if (sessioneAmmessa(sessione) && !_appAvviata) setTimeout(() => avviaApp(sessione), 0);
  });
  const { data, error } = await db.auth.getSession();
  if (error) console.warn('[Accesso] sessione:', error.message);
  const s = data && data.session;
  if (sessioneAmmessa(s)) return avviaApp(s);
  if (s) { await db.auth.signOut(); return mostraAccesso('Questo utente non può entrare.', true); }
  mostraAccesso();
})();

function avviaApp(sessione) {
  if (_appAvviata) return;
  _appAvviata = true;
  clearInterval(_accessoTimer);
  $('accesso').hidden = true;
  state.utente = emailDi(sessione);
  const corrente = bpSettimanaCorrente();
  state.week = corrente.week; state.year = corrente.year;      // si apre sempre sulla settimana di oggi
  ui.giorno = giornoIdxDi(oggiData());
  ui.tab = 'oggi';   // Oggi è la schermata di apertura
  render();
  if (!localStorage.getItem(LS2.ONB)) onbApri();
  applicaAspetto();
  loadAll().then(() => {
    rilevaColonneV3().then(() => setTimeout(controllaMattino, 600));
    rilevaColonneV4();
    avvioV5();
    initGcal();
    db.from('cicli').select('id,calendar_event_id').limit(1).then(({ error }) => { ui.calEventColOk = !error; });
    setTimeout(riconciliaCalendar, 2500);   // dopo che initGcal ha ripreso il token
    initPullToRefresh();
    caricaEventi(state.week, state.year);
    caricaRimaste();
    const salite = state.cicli.filter(c => !c.done && computeEffectiveQ(c) !== c.q);
    // 22/10 · al massimo una volta al giorno (localStorage avviso_salite = YYYY-MM-DD)
    if (salite.length && lsLeggi('avviso_salite') !== oggiLocale()) {
      lsScrivi('avviso_salite', oggiLocale());
      setTimeout(() => showToast(`${plurale(salite.length, 'cosa è salita', 'cose sono salite')} di priorità per la scadenza`, 'warn'), 1200);
    }
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', () => render());
}

