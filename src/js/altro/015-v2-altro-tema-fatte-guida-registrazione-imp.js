// v2 · ALTRO: tema, Fatte, Guida, registrazione, Impostazioni
// ══════════════════════════════════════════════════════════════
function vistaAltro() {
  const scuro = temaCorrente() === 'dark';
  const fatte = state.cicli.filter(c => c.done).length;
  return `<div class="vh"><div><h1>Altro</h1></div></div>
    <div class="group">
      <button type="button" class="riga-link" data-act="tema" role="switch" aria-checked="${scuro}"><i class="ti ${scuro ? 'ti-moon' : 'ti-sun'}"></i><span>Tema scuro</span><span></span><span class="switch"></span></button>
      <button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="fatte"><i class="ti ti-circle-check"></i><span>Fatte</span><small class="mono">${fatte}</small><i class="ti ti-chevron-right"></i></button>
      <button type="button" class="riga-link" data-act="q2-apri"><i class="ti ti-target"></i><span>Esercizio Q2 · prossimi 3 mesi<small>${state.ultimoQ2 ? 'ultimo il ' + fmtGgMm(state.ultimoQ2) : 'mai fatto'}</small></span><span></span><i class="ti ti-chevron-right"></i></button>
      <button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="guida"><i class="ti ti-book"></i><span>Guida</span><span></span><i class="ti ti-chevron-right"></i></button>
      <button type="button" class="riga-link" data-act="plaud" data-tip="Import Plaud (Cmd+P)"><i class="ti ti-microphone"></i><span>Importa da una registrazione</span><span></span><i class="ti ti-chevron-right"></i></button>
      <button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="impostazioni"><i class="ti ti-settings"></i><span>Impostazioni</span><span></span><i class="ti ti-chevron-right"></i></button>
    </div>
    <div class="group" style="margin-top:var(--sp-5)">
      <button type="button" class="riga-link" data-act="esci"><i class="ti ti-logout"></i><span>Esci${state.utente ? `<small>${escHtml(state.utente)}</small>` : ''}</span><span></span><i class="ti ti-chevron-right"></i></button>
    </div>`;
}


const MAPPA_PAROLE = [['Subito', 'Q1 · Crisi'], ['Importante', 'Q2 · Qualità'], ['Delega', 'Q3 · Inganno'], ['Lascia stare', 'Q4 · Spreco'], ['Cose aperte', 'Cicli aperti'],
  ['Tutto', 'Armadio'], ['Piano della settimana', 'Business Plan settimanale'], ['Chiudi la settimana', 'Review'], ['Da piazzare', 'Da pianificare'], ['Un giorno', 'Parcheggio'], ['Routine', 'Rituali'], ['Fatte', 'Storico']];
function vistaGuida() {
  return `${indietro('altro', 'Altro')}<div class="vh"><div><h1>Guida</h1></div></div>
    <p class="list-head"><span>Come funziona in 1 minuto</span></p>
    <div class="group"><table class="mappa minuto">${['oggi', 'pianifica', 'tutto', 'attesa', 'fatte'].map(k => `<tr><td><b>${AIUTI[k].titolo}</b></td><td>${escHtml(AIUTI[k].testo[0])}</td></tr>`).join('')}</table>
      <button type="button" class="riga-link" data-act="onb-apri" style="border-top:1px solid var(--border)"><i class="ti ti-player-play"></i><span>Rivedi l'introduzione</span><span></span><i class="ti ti-chevron-right"></i></button></div>
    <p class="list-head"><span>Le parole dell'app e quelle del metodo</span></p>
    <div class="group"><table class="mappa">${MAPPA_PAROLE.map(([a, b]) => `<tr><td>${b}</td><td><b>${a}</b></td></tr>`).join('')}</table></div>
    <p class="list-head"><span>Il metodo i-Time</span></p>
    <div class="group">${GUIDA_ITIME.map((s, i) => accordion('itime' + i, escHtml(s.titolo), '', `<div class="guida-body">${s.testo}</div>`)).join('')}</div>
    <p class="list-head"><span>Il metodo nell'app</span></p>
    <div class="group">${GUIDA_SECTIONS.map((s, i) => accordion('guida' + i, escHtml(s.title), '', `<div class="guida-body">${s.content}</div>`)).join('')}</div>`;
}

function vistaImpostazioni() {
  const collegato = !!isGcalTokenValid();
  const cats = (state.categorie || []).slice().sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0));
  return `${modoSemplice() ? indietro('oggi', 'Oggi') : indietro('altro', 'Altro')}<div class="vh"><div><h1>Impostazioni</h1></div></div>
    ${sezioneAspetto()}
    ${sezionePiano()}
    ${sezioneItime()}
    <p class="list-head"><span>Google Calendar</span></p>
    <div class="group"><button type="button" class="riga-link" data-act="gcal"><i class="ti ti-calendar-event"></i><span>${collegato ? 'Collegato' : 'Connetti'}</span><small>${collegato ? escHtml(gcal.email || '') : 'appuntamenti in Oggi'}</small><i class="ti ti-chevron-right"></i></button></div>

    <p class="list-head"><span>Categorie</span></p>
    <div class="group">${cats.map(c => `<div class="riga-link" style="grid-template-columns:24px 1fr auto auto"><i class="ti ${catIconaTi('custom_' + c.id)}"></i><span>${escHtml(c.nome)}<small>${c.ctx === 'personale' ? 'Personale' : 'Lavoro'}</small></span>
        <button type="button" class="btn btn-icon" data-act="cat-modifica" data-id="${c.id}" aria-label="Modifica ${esc(c.nome)}"><i class="ti ti-pencil"></i></button>
        <button type="button" class="btn btn-icon" data-act="cat-elimina" data-id="${c.id}" aria-label="Elimina ${esc(c.nome)}"><i class="ti ti-trash"></i></button></div>`).join('')}
      <button type="button" class="riga-link" data-act="cat-nuova"><i class="ti ti-plus"></i><span>Nuova categoria</span><span></span><i class="ti ti-chevron-right"></i></button></div>

    <p class="list-head"><span>Persone</span><span class="mono">${state.persone.length}</span></p>
    <div class="group">${state.persone.map(p => `<div class="riga-link" style="grid-template-columns:24px 1fr auto"><span class="avatar">${escHtml((p.nome || '?').charAt(0).toUpperCase())}</span><span>${escHtml(p.nome)}${p.ruolo ? ` <small>· ${escHtml(p.ruolo)}</small>` : ''}</span><small class="mono">${cicliForPersona(p.nome).length}</small></div>`).join('')}
      <div class="riga-link" style="grid-template-columns:1fr auto;padding-block:var(--sp-2)"><input type="text" class="input" id="persona-nuova" placeholder="Nome della persona" aria-label="Nuova persona" style="min-height:44px"><button type="button" class="btn btn-secondary btn-sm" data-act="persona-aggiungi">Aggiungi</button></div></div>

    ${sezioneAree()}

    ${sezioneClaude()}`;
}

function openGcalModal() {
  const body = $('gcal-modal-body'), az = $('gcal-modal-actions');
  if (isGcalTokenValid()) {
    body.innerHTML = `<div class="gcal-stato"><b>Collegato come ${escHtml(gcal.email || GCAL_USER_EMAIL)}</b><span>Scrivo nel calendario: ${escHtml(nomeCalScrittura())}</span></div>
      <p class="t-label muted">Gli appuntamenti del giorno compaiono in Oggi. Su Google Calendar l'app scrive solo quando lo chiedi tu: «Blocca in agenda» su una cosa e «Metti il piano su Calendar».</p>`;
    az.innerHTML = `<button type="button" class="btn btn-ghost btn-danger btn-sm btn-block" onclick="disconnectGcal()">Scollega</button>`;
  } else {
    if (gcalEraCollegato() && !gcalDaRicollegare()) {
      // il token è scaduto ma il rinnovo silenzioso non ha ancora detto di no: si riprova ora (c'è stato un tocco)
      rinnovaGcalSilenzioso('apertura di Google Calendar');
      body.innerHTML = `<div class="gcal-stato"><b>Rinnovo il collegamento…</b><span>Google chiude l'accesso dopo un'ora: lo riapro da solo, non devi fare niente.</span></div>`;
      az.innerHTML = '';
      $('gcalOverlay').classList.add('open');
      return;
    }
    if (gcalEraCollegato()) {
      body.innerHTML = `<div class="gcal-stato"><b>Il collegamento è scaduto</b><span>Non sono riuscito a rinnovarlo da solo: ricollega con un tocco, non perdi niente.</span></div>`;
      az.innerHTML = `<button type="button" class="btn btn-primary btn-block" id="gcal-connetti" onclick="connectGoogleCalendar()"><i class="ti ti-refresh"></i>Ricollega</button>`;
      $('gcalOverlay').classList.add('open');
      return;
    }
    body.innerHTML = `<p class="t-label muted">Collega Google Calendar per vedere gli appuntamenti in Oggi e mettere in calendario le cose pianificate. Gli eventi dell'app (avvisi, blocchi, promemoria) vanno nel calendario Lavoro: non ne creo altri.</p>`;
    az.innerHTML = `<button type="button" class="btn btn-primary btn-block" id="gcal-connetti" onclick="connectGoogleCalendar()"><i class="ti ti-link"></i>Connetti</button>`;
  }
  $('gcalOverlay').classList.add('open');
}

async function aggiungiPersona() {
  const nome = ($('persona-nuova').value || '').trim();
  if (!nome) { showToast('Scrivi un nome', 'warn'); return; }
  try {
    const { data, error } = await db.from('persone').insert({ nome, colore: personColor({ nome }), created_at: new Date().toISOString() }).select();
    if (error) throw error;
    if (data && data[0]) state.persone = [...state.persone, data[0]].sort((a, b) => a.nome.localeCompare(b.nome));
    render();
    showToast('Persona aggiunta', 'success');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
