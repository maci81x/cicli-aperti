// ══════════════════════════════════════════════════════════════
// C · FALLO SUBITO (principio 4) E SPECIFICO (principio 2)
// ══════════════════════════════════════════════════════════════
const RE_BREVE = /(?:\b(?:ci\s+vogliono|ci\s+vuole|bastano|basta|in)\s+)?\b(?:5|cinque|2|due|3|tre)\s*min(?:uti|uto)?\b\.?|\bal\s+volo\b/gi;
const togliBreve = t => { const s = String(t || '').replace(RE_BREVE, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').replace(/^[\s,;:.\-–—]+|[\s,;:\-–—]+$/g, '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : String(t || ''); };
const detto = (re, t) => { re.lastIndex = 0; const ok = re.test(t); re.lastIndex = 0; return ok; };

// ─── Troppo generica? 1–2 parole senza un verbo, senza chi (persona, azienda) e senza quanto (numero, €) ───
const VERBI_FORME = new Set(('chiama chiedi scrivi manda invia compra paga prenota fai porta ritira prepara leggi controlla verifica senti organizza rispondi vai ordina aggiorna rinnova disdici ' +
  'telefona cerca trova finisci inizia completa chiudi apri consegna spedisci prova ricorda parla incontra vedi sistema fissa passa saluta ringrazia sollecita').split(' '));
// finiscono come un infinito ma non sono verbi
const NON_VERBI = new Set(('carattere potere piacere dovere cellulare solare regolare familiare popolare particolare militare scolare collare altare affare mare lunare polare singolare ' +
  'salutare molare sire').split(' '));
// cose di lavoro che con un nome bastano a dire cosa fare («Preventivo Rosseti», «Mail Raia»)
const OGGETTI_LAVORO = new Set(('preventivo preventivi offerta offerte fattura fatture mail email contratto contratti ordine ordini report riunione incontro appuntamento chiamata telefonata ' +
  'pagamento bonifico sollecito verbale documento documenti corso visita sopralluogo call proposta relazione consegna bolletta polizza ricevuta pratica certificato modulo dvr colloquio ' +
  'presentazione demo meeting checkup check rinnovo scadenza nota messaggio whatsapp').split(' '));
const eVerbo = w => VERBI_FORME.has(w) || (!NON_VERBI.has(w) && !/iere$/.test(w) && /^[a-z]{3,}(?:are|ere|ire|arre|orre|urre)(?:lo|la|li|le|gli|ne|ci|si|mi|ti|vi)?$/.test(w));
function troppoGenericaTitolo(titolo, opz = {}) {
  const t = String(titolo || '').replace(/\[[^\]]*\]/g, ' ').replace(/^\s*\d{1,2}(?:[.:]\d{2})?\s*[-–—]\s*/, '').trim();
  if (!t || /[:]\s*$/.test(t)) return false;
  if (/[\d€$%]/.test(t)) return false;   // un numero o un importo: c'è il «quanto»
  const grezze = t.split(/[\s/+,;()«»"]+/).filter(Boolean);
  if (grezze.length > 2) return false;
  const tuttoMaiuscolo = !/[a-zà-ÿ]/.test(t);
  const nomi = nomiNoti();
  const parole = grezze.map((raw, j) => {
    const w = parolaPulita(raw);
    const lettere = togliAccenti(raw).replace(/[^A-Za-z]/g, '');
    const nome = !!w && !OGGETTI_LAVORO.has(w) && !DOPP_COMUNI.has(w) && (
      (!tuttoMaiuscolo && lettere.length >= 2 && lettere === lettere.toUpperCase()) ||   // sigla: ASM, DV
      (!tuttoMaiuscolo && j > 0 && /^[A-ZÀ-Ý]/.test(raw)) ||                           // maiuscola non all'inizio
      /^(?:srl|spa|snc|sas|srls)$/.test(w) || nomi.has(w));
    return { w, nome };
  }).filter(x => x.w);
  if (!parole.length) return true;
  if (parole.some(x => eVerbo(x.w))) return false;
  const chi = parole.some(x => x.nome) || !!opz.persona;
  const cosa = parole.some(x => OGGETTI_LAVORO.has(x.w) || DOPP_COMUNI.has(x.w)) || (parole.length === 2 && parole.some(x => !x.nome) && opz.persona);
  return !(chi && cosa);
}
function troppoGenerica(c) {
  if (!c || c.done || c.parent_id || isGiornaliero(c)) return false;
  if (state.cicli.some(p => p.parent_id === c.id && !p.done)) return false;   // ha già i suoi passi
  return troppoGenericaTitolo(c.title, { persona: (c.persone_menzionate || []).length > 0 || !!c.delega_persona_id });
}
const specificheOk = () => new Set(leggiJson(PRINC.LS.SPEC_OK, []));
function daRendereSpecifiche() {
  const ok = specificheOk();
  return state.cicli.filter(c => vedi(c.ctx) && isAttivo(c) && !ok.has(String(c.id)) && troppoGenerica(c))
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}
function vistaSpecifiche() {
  const l = daRendereSpecifiche();
  let h = `${indietro('altro', 'Altro')}<div class="vh"><div><h1>Da rendere specifiche</h1></div></div>
    <p class="t-label muted mete-intro">Scritte in una o due parole non dicono cosa fare. Aggiungi cosa, con chi e quanto, oppure spacchettale in passi.</p>`;
  if (!l.length) return h + vuoto('ti-checks', 'Sono tutte chiare', `In ${etichettaCtx()} ogni cosa aperta dice cosa fare.`);
  return h + `<div class="group">${l.map(c => `<div class="spec-riga" data-id="${c.id}"><button type="button" class="item-main" data-act="apri" data-id="${c.id}" style="padding:0"><span class="item-title">${escHtml(c.title)}</span><span class="item-meta">${tagTipo(computeEffectiveQ(c))}<span class="sep">·</span><span>dal ${fmtGgMm(giornoIso(c.created_at))}</span></span></button>
    <div class="tasti"><button type="button" class="btn btn-secondary btn-sm" data-act="q-scomponi" data-id="${c.id}"><i class="ti ti-list-tree"></i>Spacchettala</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="spec-riscrivi" data-id="${c.id}"><i class="ti ti-pencil"></i>Riscrivila</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="spec-ok" data-id="${c.id}">Va bene così</button></div></div>`).join('')}</div>`;
}
Object.assign(AZIONI, {
  'spec-riscrivi': (el, id) => { apriDettaglio(id); setTimeout(() => { const t = $('f-title'); if (t) { t.focus(); t.select(); } }, 120); },
  'spec-ok': (el, id) => { scriviJson(PRINC.LS.SPEC_OK, unici([...specificheOk(), String(id)])); render(); showToast('Non te la propongo più', 'info', { annulla: () => { scriviJson(PRINC.LS.SPEC_OK, [...specificheOk()].filter(x => x !== String(id))); render(); } }); }
});

// ─── Le voci del campo: «5 minuti», «al volo», «subito» o il chip «5 min» → breve; titolo generico → avviso ───
const _vociDaRighePr = vociDaRighe;
vociDaRighe = function (righe, r) {
  const cinque = (r && r.cinque) || [];
  return _vociDaRighePr(righe, r).map(v => {
    const parlato = detto(RE_BREVE, v.testo);
    const title = detto(RE_BREVE, v.title) ? togliBreve(v.title) : v.title;
    const cinqueMin = parlato || cinque.includes(v.testo);
    const breve = v.q !== 3 && (cinqueMin || /\bsubito\b/i.test(v.testo));
    return { ...v, title, cinque: cinqueMin && v.q !== 3, breve, vaga: !(v.passi || []).length && troppoGenericaTitolo(title, { persona: !!v.delega || !!(r && r.persona) }) };
  });
};
// la durata di 5 minuti la rende una Rapida (≤ 15 min, come prima)
const _rigaDaVocePr = rigaDaVoce;
rigaDaVoce = async function (v, r, ctx) {
  const riga = await _rigaDaVocePr.apply(this, arguments);
  return v && v.cinque && state.ritualiColsOk ? { ...riga, durata_minuti: PRINC.BREVE_MIN } : riga;
};
const _disegnaAnteprimaPr = disegnaAnteprima;
disegnaAnteprima = function () {
  _disegnaAnteprimaPr();
  const box = $('rapido-anteprima');
  if (!box || box.hidden) return;
  const voci = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido);
  box.querySelectorAll('.rap-voce[data-i]').forEach(el => {
    const i = +el.dataset.i, v = voci[i];
    if (!v) return;
    const sintesi = el.querySelector('.rap-sintesi');
    if (!sintesi) return;
    let extra = '';
    if (v.vaga) extra += `<p class="rap-vaga"><i class="ti ti-help-circle" aria-hidden="true"></i><span>Troppo generica: cosa devi fare, con chi, quanto?</span></p>`;
    if (v.q !== 3) extra += `<div class="rap-breve"><button type="button" class="chip" data-act="rap-cinque" data-i="${i}" aria-pressed="${!!v.cinque}"><i class="ti ti-clock-bolt"></i>5 min</button>
      ${v.breve ? `<button type="button" class="btn btn-secondary btn-sm" data-act="rap-fallaora" data-i="${i}"><i class="ti ti-player-play"></i>Falla ora</button><span class="t-caption muted">Ci vogliono pochi minuti? Falla adesso.</span>` : ''}</div>`;
    sintesi.insertAdjacentHTML('afterend', extra);
  });
};
const _disegnaAnteprimaCatturaPr = disegnaAnteprimaCattura;
disegnaAnteprimaCattura = function () {
  _disegnaAnteprimaCatturaPr();
  const box = $('cattura-anteprima');
  if (!box || box.hidden) return;
  const voci = vociDaRighe(righeCattura(), {});
  const spans = box.querySelectorAll('.ca-voci > span[class^="p-q"]');
  spans.forEach((el, i) => { if (voci[i] && voci[i].vaga) el.insertAdjacentHTML('beforeend', ' <span class="ca-vaga">· troppo generica: cosa, con chi, quanto?</span>'); });
  if (voci.length === 1 && voci[0].breve) {
    const mod = box.querySelector('[data-act="cattura-modifica"]');
    const b = '<button type="button" class="btn btn-secondary btn-sm ca-falla" data-act="ca-fallaora"><i class="ti ti-player-play"></i>Falla ora</button>';
    if (mod) mod.insertAdjacentHTML('beforebegin', b); else box.insertAdjacentHTML('beforeend', b);
  }
};
AZIONI['rap-cinque'] = el => {
  const v = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido)[+el.dataset.i];
  if (!v) return;
  const l = (ui.rapido.cinque || []).filter(x => x !== v.testo);
  ui.rapido = { ...ui.rapido, cinque: el.getAttribute('aria-pressed') === 'true' ? l : [...l, v.testo] };
  disegnaAnteprima();
};
AZIONI['rap-fallaora'] = el => {
  const v = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido)[+el.dataset.i];
  if (!v) return;
  const r = { ...ui.rapido };
  // tolta dal campo: le altre righe restano da salvare
  const righe = $('rapido-testo').value.split(/\r?\n/);
  const k = righe.findIndex(x => x.trim() === v.testo);
  if (k >= 0) righe.splice(k, 1);
  $('rapido-testo').value = righe.join('\n').trim();
  if (!$('rapido-testo').value) { fermaDettatura(); closeModal('rapidoOverlay'); } else disegnaAnteprima();
  avviaFallaOra({ voce: { ...v, cinque: true }, r });
};
AZIONI['ca-fallaora'] = () => {
  const v = vociDaRighe(righeCattura(), {})[0];
  if (!v) return;
  fermaDettatura();
  $('cattura-testo').value = '';
  allungaCattura();
  disegnaAnteprimaCattura();
  avviaFallaOra({ voce: { ...v, cinque: true }, r: {} });
};
// dopo un salvataggio normale di una cosa breve: «Falla ora» nel messaggio
const _salvaRapidoPr = salvaRapido;
salvaRapido = async function () {
  const voci = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido);
  const idsPrima = new Set(state.cicli.map(c => c.id));
  const r = await _salvaRapidoPr.apply(this, arguments);
  offriFallaOraDopo(voci, idsPrima);
  return r;
};
const _salvaCatturaPr = salvaCattura;
salvaCattura = async function () {
  const voci = vociDaRighe(righeCattura(), {});
  const idsPrima = new Set(state.cicli.map(c => c.id));
  const r = await _salvaCatturaPr.apply(this, arguments);
  offriFallaOraDopo(voci, idsPrima);
  return r;
};
function offriFallaOraDopo(voci, idsPrima) {
  if (voci.length !== 1 || !voci[0].breve || ui.fallaOra) return;
  const c = state.cicli.find(x => !idsPrima.has(x.id) && !x.parent_id && x.title === voci[0].title);
  if (!c) return;
  setTimeout(() => showToast('Ci vogliono pochi minuti?', 'info', { annulla: () => avviaFallaOra({ id: c.id, voce: voci[0] }), etichetta: 'Falla ora' }), 250);
}

// ─── Il timer di 5 minuti ───
document.body.insertAdjacentHTML('beforeend', `<div class="falla-ora" id="fallaOra" role="region" aria-label="Falla ora" hidden></div>`);
ui.fallaOra = null;
let _fallaTimer = null;
function avviaFallaOra(o) {
  if (ui.fallaOra) { showToast('Finisci prima quella che stai facendo', 'warn'); return; }
  ui.fallaOra = { ...o, fine: Date.now() + PRINC.TIMER_MS };
  disegnaFallaOra();
  clearInterval(_fallaTimer);
  _fallaTimer = setInterval(disegnaFallaOra, 1000);
}
const FO_R = 25, FO_GIRO = 2 * Math.PI * FO_R;
function disegnaFallaOra() {
  const box = $('fallaOra'), f = ui.fallaOra;
  if (!f) { box.hidden = true; box.innerHTML = ''; clearInterval(_fallaTimer); return; }
  const resto = Math.max(0, f.fine - Date.now()), m = Math.floor(resto / 60000), s = Math.floor(resto % 60000 / 1000);
  const titolo = f.id ? (ciclo(f.id) || {}).title || f.voce.title : f.voce.title;
  const tempo = `${m}:${String(s).padStart(2, '0')}`;
  const off = (FO_GIRO * (1 - resto / PRINC.TIMER_MS)).toFixed(1);
  const et = resto ? '<i class="ti ti-player-play" aria-hidden="true"></i>Falla ora · 5 minuti' : '<i class="ti ti-clock-check" aria-hidden="true"></i>Tempo finito: com\'è andata?';
  box.classList.toggle('finito', !resto);
  if (box.dataset.titolo === titolo && box.querySelector('.fo-tempo')) {
    box.querySelector('.fo-tempo').textContent = tempo;
    box.querySelector('.fo-anello .ar').setAttribute('stroke-dashoffset', off);
    const e = box.querySelector('.fo-et'); if (!resto && !e.dataset.finito) { e.innerHTML = et; e.dataset.finito = '1'; }
    return;
  }
  box.dataset.titolo = titolo;
  box.innerHTML = `<div class="fo-anello"><svg viewBox="0 0 56 56" aria-hidden="true"><circle class="tr" cx="28" cy="28" r="${FO_R}"/><circle class="ar" cx="28" cy="28" r="${FO_R}" stroke-dasharray="${FO_GIRO.toFixed(1)}" stroke-dashoffset="${off}"/></svg><span class="fo-tempo" role="timer" aria-label="Tempo che resta">${tempo}</span></div>
    <div class="fo-txt"><span class="fo-et">${et}</span><b class="fo-tit">${escHtml(titolo)}</b></div>
    <div class="fo-tasti"><button type="button" class="btn btn-primary btn-sm" data-act="fo-fatta"><i class="ti ti-check"></i>Fatta</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="fo-salva"><i class="ti ti-bookmark"></i>Non finita: salvala</button></div>`;
  box.hidden = false;
}
function chiudiFallaOra() { ui.fallaOra = null; delete $('fallaOra').dataset.titolo; disegnaFallaOra(); }
async function salvaVoceFalla(f) {
  const nuove = await aggiungiFrasi([f.voce], f.r || {});
  return nuove && nuove.find(c => !c.parent_id) || null;
}
AZIONI['fo-fatta'] = async () => {
  const f = ui.fallaOra;
  if (!f) return;
  chiudiFallaOra();
  try {
    if (f.id) { await azioneFatto(f.id); return; }
    const c = await salvaVoceFalla(f);
    if (!c) return;
    await azioneFatto(c.id);
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
};
AZIONI['fo-salva'] = async () => {
  const f = ui.fallaOra;
  if (!f) return;
  chiudiFallaOra();
  if (f.id) { showToast('Resta tra le cose da fare: la ritrovi tra le Rapide', 'info'); return; }
  await salvaVoceFalla(f);
};

