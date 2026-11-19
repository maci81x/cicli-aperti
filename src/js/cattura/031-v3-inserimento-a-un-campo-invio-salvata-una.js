// v3 · INSERIMENTO A UN CAMPO («+»): Invio = salvata, una riga = una cosa
// ══════════════════════════════════════════════════════════════
const Riconoscimento = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let _ascolto = null;
ui.rapido = { subito: false, oggi: false, persona: null, con: false };

function apriRapido() {
  ui.rapido = { subito: false, oggi: false, persona: null, con: false };
  $('rapido-testo').value = '';
  $('rapido-mic').hidden = !micDaMostrare();
  disegnaRapido();
  $('rapidoOverlay').classList.add('open');
  setTimeout(() => $('rapido-testo').focus(), 150);
}
function disegnaRapido() {
  const r = ui.rapido, p = personaDi(r.persona);
  const chip = (act, testo, on, icona) => `<button type="button" class="chip" data-act="${act}" aria-pressed="${on}">${icona ? `<i class="ti ${icona}"></i>` : ''}${testo}</button>`;
  $('rapido-chips').innerHTML = chip('rapido-subito', 'Subito', r.subito, 'ti-flame') + chip('rapido-oggi', 'Oggi', r.oggi, 'ti-sun')
    + chip('rapido-con', p ? `Con ${escHtml(p.nome)}` : 'Con…', !!p || r.con, 'ti-user');
  const cusc = r.cusc ? state.bpItems.find(i => i.id === r.cusc) : null;
  if (cusc) $('rapido-chips').innerHTML += chip('rapido-cusc', `Nel cuscinetto delle ${bpOra(cusc) || CUSC.META}`, true, 'ti-lifebuoy');
  const box = $('rapido-persone');
  box.hidden = !r.con;
  box.innerHTML = state.persone.length
    ? state.persone.map(x => `<button type="button" class="chip" data-act="rapido-persona" data-p="${x.id}" aria-pressed="${String(r.persona) === String(x.id)}">${escHtml(x.nome)}</button>`).join('')
    : '<p class="t-label muted">Nessuna persona: aggiungile in Impostazioni.</p>';
}

function rigaNuova(title, r, ctx) {
  const oggi = todayISO();
  const p = personaDi(r.persona);
  // 24/10 · senza giorno resta senza data: scheduled_date solo se la cosa va in Oggi (o in un giorno preciso)
  const giorno = r.oggi ? oggi : (r.data || null);
  return { title, note: null, cat: ctx === 'personale' ? 'salute' : 'management', due_date: null, week: state.week, year: state.year,
    q: r.subito ? 1 : 2, ctx, persone_menzionate: p ? [p.nome] : [], done: false, da_plaud: false, scheduled_date: giorno, scheduled_time: null,
    macro_area: null, execution_status: 'planned', sync_status: 'pending', settimana_anno: isoWeekStr(new Date(oggi)) };
}
async function salvaRapido() {
  const righe = ($('rapido-testo').value || '').split(/\r?\n/).map(t => t.trim()).filter(Boolean);
  if (!righe.length) { $('rapido-testo').focus(); return; }
  fermaDettatura();
  if (await aggiungiRighe(righe, { ...ui.rapido })) closeModal('rapidoOverlay');
}
// Una riga = una cosa. Restituisce le cose salvate (o null se il salvataggio non riesce).
async function aggiungiRighe(righe, r) {
  const ctx = state.ctx;
  try {
    const salvate = [];
    for (const t of righe) salvate.push(await upsertCiclo(rigaNuova(t, r, ctx)));
    const nuove = salvate.filter(Boolean);
    state.cicli = [...nuove, ...state.cicli.filter(c => !nuove.some(n => n.id === c.id))];
    if (r.oggi) for (const c of nuove) await pianificaInData(c, new Date(), null);
    render();
    if (r.cusc && nuove[0]) { await riempiCuscinetto(r.cusc, nuove[0].id); return nuove; }   // urgenza arrivata: va nel cuscinetto
    nuove.forEach(c => {
      if (ctx === 'lavoro' && !areaDi(c)) autoCategoria(c.title, '').then(area => area && patchCiclo(c.id, { macro_area: area })).catch(() => {});   // solo se la categoria non ha un'area
    });
    const dove = `${r.oggi ? 'Oggi' : 'Tutto'} · ${r.subito ? 'Subito' : 'Importante'}`;
    if (nuove.length === 1) showToast(`Aggiunta a ${dove}`, 'success', { annulla: () => apriDettaglio(nuove[0].id), etichetta: 'Dettagli' });
    else showToast(`${nuove.length} cose aggiunte a ${dove}`, 'success');
    return nuove;
  } catch (e) { showToast('Errore: ' + e.message, 'error'); return null; }
}

// Dettatura (Web Speech API, it-IT): il testo finisce nel campo, dopo quello già scritto.
// 24/10 · iPhone: la dettatura del browser va e viene (nell'app sulla Home spesso manca o dà «service-not-allowed»).
// Su iPhone: continuous = false e si riascolta da capo finché non passano 3 secondi senza parlare o tocchi di nuovo il microfono.
// Se non c'è o non va: il campo prende il cursore e sotto compare, una volta, «Usa il microfono della tastiera dell'iPhone».
const DETTATURA = { SILENZIO_MS: 3000, PAUSA_RIAVVIO_MS: 80, AIUTO_MS: 10000,
  BLOCCANTI: ['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported', 'bad-grammar'] };
const IOS_DETTATURA = /iP(hone|ad|od)/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const micDaMostrare = () => !!Riconoscimento || IOS_DETTATURA;
ui.dettaAiutoVisto = {};
ui.dettaSpenta = false;   // su iPhone, dopo «not-allowed»/«service-not-allowed»: in questa sessione si va diretti alla tastiera
function testoAiutoDettatura(errore) {
  if (IOS_DETTATURA) return 'Usa il microfono della tastiera dell\'iPhone (in basso a destra)';
  if (errore === 'not-allowed' || errore === 'service-not-allowed') return 'Il browser non dà il permesso del microfono: consentilo nelle impostazioni del sito, oppure scrivi.';
  if (errore === 'audio-capture') return 'Non trovo un microfono: controlla che sia collegato, oppure scrivi.';
  if (errore === 'network') return 'La dettatura ha bisogno di internet: controlla la connessione, oppure scrivi.';
  return 'La dettatura non è disponibile qui: scrivi nel campo.';
}
// Il suggerimento sotto il campo: uno solo, una volta per campo in questa sessione; il campo prende il cursore
function aiutoDettatura(campo, errore) {
  if (!campo) return;
  try { campo.focus(); } catch (_) {}
  const chiave = campo.id || 'campo';
  if (ui.dettaAiutoVisto[chiave]) return;
  ui.dettaAiutoVisto[chiave] = true;
  const id = chiave + '-aiuto';
  let p = document.getElementById(id);
  if (!p) {
    p = document.createElement('p');
    p.id = id;
    p.className = 'detta-aiuto';
    p.setAttribute('role', 'status');
    const contenitore = campo.closest('.cattura') || campo.parentNode;
    if (contenitore === campo.parentNode) campo.insertAdjacentElement('afterend', p); else contenitore.appendChild(p);
  }
  p.innerHTML = `<i class="ti ti-microphone" aria-hidden="true"></i>${escHtml(testoAiutoDettatura(errore))}`;
  p.hidden = false;
  const togli = () => { p.hidden = true; campo.removeEventListener('input', togli); };
  campo.addEventListener('input', togli);
  setTimeout(togli, DETTATURA.AIUTO_MS);
}
function dettatura(campoId, micId) {
  const campo = $(campoId || 'rapido-testo'), mic = $(micId || 'rapido-mic');
  if (_ascolto) { fermaDettatura(); return; }
  if (!Riconoscimento || (IOS_DETTATURA && ui.dettaSpenta)) { aiutoDettatura(campo, 'non-supportato'); return; }
  let base = campo.value.trim() ? campo.value.replace(/\s*$/, ' ') : '';
  let fermato = false, finito = false, errore = null, rec = null, silenzio = null, ultimaVoce = Date.now();
  const finisci = () => {
    if (finito) return;
    finito = true;
    clearTimeout(silenzio);
    if (_ascolto === controllo) _ascolto = null;
    mic.setAttribute('aria-pressed', 'false');
    mic.classList.remove('ascolta');
  };
  const attendi = () => { clearTimeout(silenzio); silenzio = setTimeout(() => { fermato = true; try { rec && rec.stop(); } catch (_) {} }, DETTATURA.SILENZIO_MS); };
  const avvia = () => {
    rec = new Riconoscimento();
    rec.lang = 'it-IT';
    rec.interimResults = true;
    rec.continuous = !IOS_DETTATURA;   // computer: si ferma con il tasto o dopo SILENZIO_MS senza parlare; iPhone: un pezzo alla volta
    rec.onresult = e => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      campo.value = v28UnisciDettatura(base, t);
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      ultimaVoce = Date.now();
      attendi();
    };
    rec.onerror = e => {
      const tipo = (e && e.error) || 'sconosciuto';
      if (tipo === 'aborted' || tipo === 'no-speech') return;   // fermata o silenzio: niente avvisi
      errore = tipo;
      fermato = true;
      console.warn('[Dettatura] errore:', tipo);
      if (IOS_DETTATURA && (tipo === 'not-allowed' || tipo === 'service-not-allowed')) ui.dettaSpenta = true;
      aiutoDettatura(campo, tipo);
    };
    rec.onend = () => {
      // iPhone: la sessione finisce a ogni pausa; si riparte finché non ci sono 3 secondi di silenzio
      if (IOS_DETTATURA && !fermato && !errore && Date.now() - ultimaVoce < DETTATURA.SILENZIO_MS) {
        base = campo.value.trim() ? campo.value.replace(/\s*$/, ' ') : '';
        setTimeout(() => {
          if (fermato) { finisci(); return; }
          try { avvia(); } catch (err) { console.warn('[Dettatura] riavvio:', err.message); finisci(); }
        }, DETTATURA.PAUSA_RIAVVIO_MS);
        return;
      }
      finisci();
    };
    rec.start();
  };
  const controllo = { stop() { fermato = true; clearTimeout(silenzio); try { rec && rec.stop(); } catch (_) {} if (!rec) finisci(); } };
  try { avvia(); attendi(); }
  catch (e) { console.warn('[Dettatura] avvio:', e.message); finisci(); aiutoDettatura(campo, 'avvio'); return; }
  _ascolto = controllo;
  mic.setAttribute('aria-pressed', 'true');
  mic.classList.add('ascolta');
}
function fermaDettatura() { if (_ascolto) { try { _ascolto.stop(); } catch (_) {} } }

$('rapido-testo').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); salvaRapido(); }
});

// ══════════════════════════════════════════════════════════════
