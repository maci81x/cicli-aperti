// v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare
// · Invio nel foglio «Aggiungi» va a capo (prima salvava la prima riga e svuotava il campo); ⌘/Ctrl+Invio aggiunge
// · la bozza resta salvata in questo dispositivo finché non la aggiungi
// · 10 pensieri in una frase (anche dettati) diventano 10 cose; «unisci» rimette insieme due pezzi
// · Oggi: «Prima di tutto» in cima (in ritardo e Subito, piano della settimana, coach); i suggerimenti in una riga in fondo
// · inviato e stampato del piano salvati anche nel database (si vedono da tutti i dispositivi)
// ══════════════════════════════════════════════════════════════
const V12 = { BOZZA_RAPIDO: 'bozza_rapido', BOZZA_CATTURA: 'bozza_cattura', COACH_GIORNI: 7, MATTINA_FINO: 13, POMERIGGIO_FINO: 19, SERA_FINO: 23 };
const bozzaLeggi = k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } };
const bozzaScrivi = (k, v) => { try { if (v && v.trim()) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (_) { /* niente */ } };
const eMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

// --- 1. Invio va a capo; ⌘/Ctrl+Invio aggiunge (prima di ogni altro ascoltatore del campo) ---
document.addEventListener('keydown', e => {
  const t = e.target;
  if (!t || t.id !== 'rapido-testo' || e.key !== 'Enter' || e.isComposing) return;
  e.stopImmediatePropagation();
  if (e.metaKey || e.ctrlKey) { e.preventDefault(); salvaRapido(); }
}, true);
(function () {
  const t = $('rapido-testo');
  if (t) { t.setAttribute('enterkeyhint', 'enter'); t.rows = 4; }
  const nota = document.querySelector('#rapidoOverlay .rapido-nota');
  if (nota) nota.textContent = eTelefono()
    ? 'Scrivi o detta anche più cose insieme: le divido io. La bozza resta salvata.'
    : `Scrivi o detta anche più cose insieme: le divido io. Invio va a capo, ${eMac ? '⌘' : 'Ctrl'}+Invio aggiunge. La bozza resta salvata.`;
})();

// --- 2. La bozza ---
document.addEventListener('input', e => {
  const t = e.target;
  if (!t) return;
  if (t.id === 'rapido-testo') bozzaScrivi(V12.BOZZA_RAPIDO, t.value);
  else if (t.id === 'cattura-testo') bozzaScrivi(V12.BOZZA_CATTURA, t.value);
}, true);
const _apriRapidoV12 = apriRapido;
apriRapido = function () {
  const r = _apriRapidoV12.apply(this, arguments);
  const b = bozzaLeggi(V12.BOZZA_RAPIDO), t = $('rapido-testo');
  if (b && t && !t.value) { t.value = b; disegnaAnteprima(); }
  return r;
};
function apriRapidoCon(testo) { apriRapido(); $('rapido-testo').value = testo; bozzaScrivi(V12.BOZZA_RAPIDO, testo); disegnaAnteprima(); }
const _salvaRapidoV12 = salvaRapido;
salvaRapido = async function () {
  const r = await _salvaRapidoV12.apply(this, arguments);
  if (!$('rapidoOverlay').classList.contains('open') || !($('rapido-testo').value || '').trim()) { bozzaScrivi(V12.BOZZA_RAPIDO, ''); ui.v12Unite = new Set(); salvaUnite(); }
  return r;
};
const _salvaCatturaV12 = salvaCattura;
salvaCattura = async function () {
  const r = await _salvaCatturaV12.apply(this, arguments);
  if (!($('cattura-testo').value || '').trim()) bozzaScrivi(V12.BOZZA_CATTURA, '');
  return r;
};
AZIONI['cattura-modifica'] = () => { const t = $('cattura-testo').value; fermaDettatura(); $('cattura-testo').value = ''; bozzaScrivi(V12.BOZZA_CATTURA, ''); allungaCattura(); disegnaAnteprimaCattura(); apriRapidoCon(t); };
function ripristinaBozzaCattura() {
  const b = bozzaLeggi(V12.BOZZA_CATTURA), t = $('cattura-testo');
  if (!b || !t || t.value) return;
  t.value = b;
  allungaCattura();
  disegnaAnteprimaCattura();
}

// --- 3. Dieci pensieri in una riga → dieci cose ---
// Si taglia a «;», «.», «,», «poi», «e anche», «inoltre» SOLO se subito dopo comincia un verbo all'infinito
// («chiamare», «mandare», «ricordami di …») e il pezzo prima ha almeno 2 parole. Le righe con «: » restano intere (sono un elenco di passi).
const V12_NON_VERBI = new Set(['carattere', 'piacere', 'potere', 'dovere', 'mestiere', 'cantiere', 'quartiere', 'cavaliere', 'ingegnere', 'corriere', 'sere', 'mare',
  'chiare', 'care', 'rare', 'varie', 'gare', 'tare', 'fiere', 'schiere', 'bandiere', 'maniere', 'miniere', 'frontiere', 'preghiere', 'carriere', 'barriere', 'lettere',
  'camere', 'sfere', 'intere', 'sincere', 'vere', 'pere', 'cere', 'altre', 'dire', 'fare']);
const V12_RIEMPI = /^(?:(?:e|ed|poi|anche|inoltre|e poi|e anche|devo|dovrei|bisogna|ricordami di|ricordarmi di|ricordati di|ricorda di|da)\s+)+/i;
function iniziaConVerbo(s) {
  const resto = String(s || '').replace(V12_RIEMPI, '');
  const m = /^([a-zàèéìòù']+)/i.exec(resto);
  if (!m) return false;
  const p = m[1].toLowerCase();
  if (p === 'fare' || p === 'dire' || p === 'dare' || p === 'stare' || p === 'avere' || p === 'essere') return true;
  if (p.length < 5 || V12_NON_VERBI.has(p)) return false;
  return /(?:are|ere|ire)(?:si|mi|ti|ci|vi|lo|la|li|le|gli|ne|glielo|gliela)?$/.test(p);
}
const v12Chiave = (prima, dopo) => `${normTitolo(String(prima).slice(-30))}|${normTitolo(String(dopo).slice(0, 30))}`;
ui.v12Unite = new Set((() => { try { return JSON.parse(localStorage.getItem('bozza_unite') || '[]'); } catch (_) { return []; } })());
const salvaUnite = () => { try { if (ui.v12Unite.size) localStorage.setItem('bozza_unite', JSON.stringify([...ui.v12Unite])); else localStorage.removeItem('bozza_unite'); } catch (_) { /* niente */ } };
ui.v12Tagli = new Map();   // «pezzo prima»→«pezzo dopo» per i tagli fatti, per il tasto «unisci»
const pulisciPezzo = s => String(s || '').replace(V12_RIEMPI, m => (/ricord/i.test(m) ? m.replace(/^(?:(?:e|ed|poi|anche|inoltre|e poi|e anche)\s+)+/i, '') : '')).replace(/[\s,;.]+$/, '').trim();
function spezzaPensieri(riga) {
  const s = String(riga || '');
  if (!s.trim() || s.length < 30 || /:\s/.test(s) || /^\s*[-•*]/.test(s)) return [s];
  const re = /\s*(?:;|\.(?=\s)|,|\s(?:e\s+)?poi(?=\s)|\se\s+anche(?=\s)|\sinoltre(?=\s))\s*/gi;   // «A e B» resta una cosa sola (spesso sono due passi)
  const tagli = [];
  let m;
  while ((m = re.exec(s))) {
    const a = m.index, b = m.index + m[0].length;
    const dopo = s.slice(b), prima = s.slice(0, a);
    if (!iniziaConVerbo(dopo)) continue;
    const ultimo = tagli.length ? tagli[tagli.length - 1].b : 0;
    if (s.slice(ultimo, a).trim().split(/\s+/).length < 2) continue;
    if (ui.v12Unite.has(v12Chiave(prima, dopo))) continue;
    tagli.push({ a, b, k: v12Chiave(prima, dopo) });
  }
  if (!tagli.length) return [s];
  const pezzi = [];
  let da = 0;
  tagli.forEach(t => { pezzi.push({ testo: s.slice(da, t.a), k: t.k }); da = t.b; });
  pezzi.push({ testo: s.slice(da), k: null });
  const out = pezzi.map((p, i) => (i === 0 ? p.testo : maiuscola(pulisciPezzo(p.testo))).replace(/[\s,;.\-–—]+$/, '').trim()).filter(Boolean);
  for (let i = 1; i < out.length; i++) ui.v12Tagli.set(`${out[i - 1]}\u0000${out[i]}`, pezzi[i - 1].k);
  return out;
}
const _righeCampoV12 = righeCampo;
righeCampo = function (t) {
  const out = [];
  _righeCampoV12(t).forEach(r => out.push(...spezzaPensieri(r)));
  return out;
};
// stesso testo, stesso risultato: il riepilogo si ridisegna da più punti a ogni tasto
let _v12Voci = { k: null, v: null };
const _vociDaRigheV12 = vociDaRighe;
vociDaRighe = function (righe, r) {
  let k;
  try { const d = new Date(); k = JSON.stringify([righe, r, state.cicli.length, (state.persone || []).length, state.ctx, d.toDateString(), d.getHours(), d.getMinutes()]); }
  catch (_) { return _vociDaRigheV12(righe, r); }
  if (_v12Voci.k !== k) _v12Voci = { k, v: _vociDaRigheV12(righe, r) };
  return _v12Voci.v.map(v => ({ ...v }));
};
// «Bologna - Tavoli - - Riccardo»: tolta la data, niente trattini doppi
const _interpretaFraseV12 = interpretaFrase;
interpretaFrase = function () {
  const v = _interpretaFraseV12.apply(this, arguments);
  if (v && typeof v.title === 'string') v.title = v.title.replace(/\s+[-–—](?:\s+[-–—])+\s+/g, ' - ').replace(/(?:\s*[-–—,;])+\s*$/, '').trim() || v.title;
  return v;
};
// «unisci ↑» tra due pezzi della stessa frase
const _disegnaAnteprimaV12 = disegnaAnteprima;
disegnaAnteprima = function () {
  _disegnaAnteprimaV12.apply(this, arguments);
  const box = $('rapido-anteprima');
  const voci = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido);
  const btn = document.querySelector('#rapidoOverlay [data-act="rapido-salva"]');
  if (btn && voci.length > 1) btn.innerHTML = `<i class="ti ti-plus"></i>Aggiungi le ${voci.length} cose`;
  else if (btn && !voci.length) btn.innerHTML = '<i class="ti ti-plus"></i>Aggiungi';
  const nota = document.querySelector('#rapidoOverlay .rapido-nota');
  if (nota) nota.textContent = (voci.length ? 'Tocca un\'etichetta per cambiarla. ' : 'Scrivi o detta anche più cose insieme: le divido io. ')
    + (eTelefono() ? 'La bozza resta salvata.' : `Invio va a capo, ${eMac ? '⌘' : 'Ctrl'}+Invio aggiunge. La bozza resta salvata.`);
  if (!box || box.hidden) return;
  box.querySelectorAll('.rap-voce[data-i], .sn-voce[data-i]').forEach(el => {
    const i = +el.dataset.i;
    if (!i || !voci[i] || !voci[i - 1]) return;
    const k = ui.v12Tagli.get(`${voci[i - 1].testo}\u0000${voci[i].testo}`);
    if (!k || el.querySelector('.v12-unisci')) return;
    el.insertAdjacentHTML('afterbegin', `<button type="button" class="v12-unisci" data-act="v12-unisci" data-k="${esc(k)}" aria-label="Unisci con la riga sopra">unisci ↑</button>`);
  });
  if (voci.length > 1 && !box.querySelector('.v12-capito')) box.insertAdjacentHTML('afterbegin', `<p class="v12-capito"><b>Ho capito ${voci.length} cose</b><span>vanno insieme? tocca «unisci»</span></p>`);
};
AZIONI['v12-unisci'] = el => { ui.v12Unite.add(el.dataset.k); salvaUnite(); disegnaAnteprima(); };

// --- 4. Inviato e stampato anche nel database ---
state.bpInviiDb = {};
async function caricaInviiDb() {
  const { data, error } = await db.from('battle_plan').select('settimana,anno,inviato_at,stampato_at');
  if (error) return;   // colonne non ancora create: restano su questo dispositivo
  state.bpInviiDb = Object.fromEntries((data || []).map(p => [settKey(p.settimana, p.anno), { inviato: p.inviato_at ? toISODate(new Date(p.inviato_at)) : null, stampato: p.stampato_at ? toISODate(new Date(p.stampato_at)) : null }]));
  state.bpInviiDbOk = true;
  render();
}
const _inviatiV12 = inviati;
inviati = function () {
  const out = { ..._inviatiV12() };
  Object.entries(state.bpInviiDb || {}).forEach(([k, v]) => { if (v.inviato && !out[k]) out[k] = v.inviato; });
  return out;
};
const _stampatiV12 = stampati;
stampati = function () {
  const out = { ..._stampatiV12() };
  Object.entries(state.bpInviiDb || {}).forEach(([k, v]) => { if (v.stampato && !out[k]) out[k] = v.stampato; });
  return out;
};
async function segnaNelDb(week, year, campo) {
  if (!state.bpInviiDbOk) return;
  const k = settKey(week, year);
  state.bpInviiDb[k] = { ...(state.bpInviiDb[k] || {}), [campo === 'inviato_at' ? 'inviato' : 'stampato']: oggiLocale() };
  const { error } = await db.from('battle_plan').update({ [campo]: new Date().toISOString() }).eq('settimana', week).eq('anno', year);
  if (error) console.warn('[Piano] ' + campo + ' solo qui:', error.message);
}
const _segnaInviatoV12 = segnaInviato;
segnaInviato = function (week, year) { const r = _segnaInviatoV12.apply(this, arguments); segnaNelDb(week, year, 'inviato_at'); return r; };
const _segnaStampatoV12 = segnaStampato;
segnaStampato = function (week, year) { const r = _segnaStampatoV12.apply(this, arguments); segnaNelDb(week, year, 'stampato_at'); return r; };

// --- 5. Oggi: PRIMA DI TUTTO ---
// in ritardo: con l'ora, finita la sua durata; senza ora, finita la sua fascia
function inRitardoOggi(r, adesso = new Date()) {
  if (!r || r.fatto) return false;
  const min = adesso.getHours() * 60 + adesso.getMinutes();
  if (r.ora) return minDi(r.ora) + (r.durata || BP_DURATA_DEFAULT) <= min;
  if (!r.haFascia) return false;
  return { mattina: V12.MATTINA_FINO, pomeriggio: V12.POMERIGGIO_FINO, sera: V12.SERA_FINO }[r.fascia] * 60 <= min;
}
function cicliIndietro() {
  const oggi = oggiLocale();
  const daPiano = new Set(rimasteVisibili().map(x => x.item.ciclo_id));
  const sciolte = state.cicli.filter(c => vedi(c.ctx) && !c.done && !isParcheggiato(c) && !c.parent_id && !isGiornaliero(c)
    && c.pianificato_data && c.pianificato_data < oggi && !daPiano.has(c.id) && computeEffectiveQ(c) !== 1);   // v45: le Subito rimaste indietro stanno nella lista principale
  return { daPiano: daPiano.size, sciolte: sciolte.sort((a, b) => a.pianificato_data.localeCompare(b.pianificato_data)) };
}
function cardV12(cls, ico, titolo, sotto, corpo, aria) {
  return `<section class="v12-card ${cls}" aria-label="${esc(aria || titolo)}"><div class="v12-testa"><span class="v12-ico" aria-hidden="true"><i class="ti ${ico}"></i></span>
    <div><h3>${titolo}</h3>${sotto ? `<p>${sotto}</p>` : ''}</div></div>${corpo}</section>`;
}
function primaDiTutto() {
  const adesso = new Date(), iso = oggiLocale();
  const carte = [];
  // A · oggi: in ritardo e Subito
  const righe = righeGiornoData(adesso);
  const late = righe.filter(r => inRitardoOggi(r, adesso));
  const subito = righe.filter(r => !r.fatto && computeEffectiveQ(r.c) === 1 && !late.includes(r));
  // 28/10 · le Subito senza giorno: vanno fatte oggi anche se non hanno una data
  const nelGiorno = new Set(righe.map(r => r.c.id));
  state.cicli.filter(c => vedi(c.ctx) && !c.done && !isParcheggiato(c) && !c.parent_id && !isGiornaliero(c) && (!c.pianificato_data || c.pianificato_data < iso) && !nelGiorno.has(c.id) && computeEffectiveQ(c) === 1)
    .forEach(c => subito.push({ c, item: null, fascia: 'mattina', conFascia: false, haFascia: false, ora: oraDi(c), durata: c.durata_minuti || null, fatto: false }));
  const lista = [...late.filter(r => computeEffectiveQ(r.c) === 1), ...late.filter(r => computeEffectiveQ(r.c) !== 1), ...subito];
  const ind = cicliIndietro(), nInd = ind.daPiano + ind.sciolte.length;
  if (lista.length || nInd) {
    const tutteMattina = late.length && late.every(r => !r.ora && r.fascia === 'mattina');
    const titolo = lista.length
      ? (late.length && late.length === lista.length ? `${tutteMattina ? 'Stamattina' : 'Oggi'}: ${plurale(late.length, 'cosa non fatta', 'cose non fatte')}` : `Oggi: ${plurale(lista.length, 'cosa da chiudere', 'cose da chiudere')}`)
      : `${plurale(nInd, 'cosa rimasta', 'cose rimaste')} indietro`;
    // v36 · «Cosa porti a casa oggi?»: la stellina sulle righe del piano e il conto nella testa della scheda
    const segnateOggi = righe.filter(r => r.item && r.item.in_focus), focusIds = focusDiOggi(righe);
    const casa = state.focusColOk && segnateOggi.length ? `porti a casa ${segnateOggi.length} · ${segnateOggi.filter(r => r.fatto).length} fatte` : '';
    const sotto = lista.length ? [late.length ? `${late.length} in ritardo` : '', subito.length ? `${subito.length} Subito` : '', casa].filter(Boolean).join(' · ') : 'dai giorni scorsi: decidi quando le fai';
    const opz = { data: iso, stellaDi: r => r.item && state.focusColOk ? (focusIds.has(r.c.id) ? 'on' : 'off') : null };
    let corpo = lista.length ? `<div class="group v12-righe">${lista.map(r => riga(r, opz)).join('')}</div>` : '';
    if (nInd) {
      const vecchia = ind.sciolte[0] ? ` · la più vecchia dal ${fmtGgMm(ind.sciolte[0].pianificato_data)}` : '';
      const righeInd = ind.sciolte.map(c => riga({ c, item: null, fascia: 'mattina', conFascia: false, haFascia: false, ora: oraDi(c), durata: c.durata_minuti || null, fatto: false }, opz)).join('');
      corpo += `<details class="v12-indietro"${ui.v12Indietro ? ' open' : ''}><summary data-act="v12-indietro"><span>${lista.length ? 'E ' : ''}${nInd} rimaste indietro${vecchia}</span><i class="ti ti-chevron-down" aria-hidden="true"></i></summary>
        ${ind.daPiano ? `<button type="button" class="riga-link" data-act="rimaste-sistema"><i class="ti ti-clock-exclamation"></i><span><b class="mono">${ind.daPiano}</b> dal piano · <b>Sistema una alla volta</b></span><span></span><i class="ti ti-chevron-right"></i></button>` : ''}
        ${righeInd ? `<div class="group">${righeInd}</div>` : ''}</details>`;
    }
    carte.push({ k: 'oggi', html: cardV12('v12-rosso', 'ti-clock-exclamation', titolo, sotto, corpo, 'Cose di oggi da chiudere'), ids: lista.map(r => r.c.id) });
  }
  // B · la settimana senza piano (lunedì–venerdì), o la prossima da preparare (finestra del piano)
  const cur = bpSettimanaCorrente(), dow = adesso.getDay();
  const suQuesta = state.week === cur.week && state.year === cur.year;
  const senzaPiano = !state.bp || state.bp.stato === 'bozza' || !bpItemsValidi().length;
  if (suQuesta && dow >= 1 && dow <= 5 && senzaPiano && state.bp?.stato !== 'chiuso') {
    const restano = 6 - dow;
    carte.push({ k: 'piano', html: cardV12('v12-arancio', 'ti-calendar-plus', `Settimana ${cur.week} ${state.bp && state.bp.stato === 'bozza' ? 'con il piano in bozza' : 'senza Battle Plan'}`,
      `${restano === 1 ? 'Resta oggi' : `Restano ${restano} giorni`}. Ti propongo io le cose, tu togli e confermi: circa 5 minuti.`,
      `<button type="button" class="btn btn-primary btn-block" data-act="wizard">${state.bp && state.bp.stato === 'bozza' ? 'Finisci il piano' : 'Prepara la settimana'}</button>`, 'Piano della settimana') });
  } else if (inFinestraPiano(adesso) && ui.pianoProssima && !ui.pianoProssima.esiste && lsLeggi(LS3.PIANO_CHIUSO) !== iso) {
    const n = bpSettimanaSuccessiva(cur.week, cur.year);
    carte.push({ k: 'prossima', html: cardV12('v12-arancio', 'ti-calendar-plus', `Settimana ${n.week} da preparare`, 'Prima di lunedì: ti propongo io le cose, tu togli e confermi.',
      '<button type="button" class="btn btn-primary btn-block" data-act="banner-piano">Prepara la settimana prossima</button>', 'Piano della prossima settimana') });
  }
  // C · coach: cosa manca prima dell'incontro (entro 7 giorni); nelle ultime 48 ore passa in cima
  caricaCoach();
  const e = coachEvento();
  if (e && e.inizioMs > Date.now() && e.inizioMs - Date.now() <= V12.COACH_GIORNI * 864e5) {
    const voci = vociCoach(), aperte = voci.filter(v => !v.ok);
    if (aperte.length) {
      const urgente = e.inizioMs - Date.now() <= COACH_ORE * 3600e3;
      const li = voci.map(v => `<li class="${v.ok ? 'ok' : ''}"><span class="v12-pallino" aria-hidden="true"></span><div><b>${v.l}</b><span>${escHtml(v.d)}</span></div><span class="sr-only">${v.ok ? 'fatto' : 'da fare'}</span>${v.ok ? '' : v.az}</li>`).join('');
      carte.push({ k: 'coach', urgente, html: cardV12(`v12-viola${urgente ? ' v12-urgente' : ''}`, 'ti-user-check', `Coach · ${fmtGiorno(new Date(e.inizioMs))}, ${e.ora}`,
        `<b>${contoAllaRovescia(e.inizioMs)}</b> · da mandare prima dell'incontro: ${aperte.length === 1 ? 'manca 1' : `mancano ${aperte.length}`} su ${voci.length}`, `<ul class="v12-coach">${li}</ul>`, 'Incontro con il coach') });
    }
  }
  const c = carte.find(x => x.k === 'coach' && x.urgente);
  const ordinate = c ? [c, ...carte.filter(x => x !== c)] : carte;
  return { carte: ordinate, ids: (carte.find(x => x.k === 'oggi') || {}).ids || [], q2NelCoach: carte.some(x => x.k === 'coach') && vociCoach().some(v => v.k === 'q2' && !v.ok) };
}
// il pallino rosso nel titolo dei passati
const _rigaEventoV12 = rigaEvento;
rigaEvento = function (e) {
  const h = _rigaEventoV12.apply(this, arguments);
  const finito = e && e.giorno === oggiLocale() && !e.routine && (e.fine ? e.fineMs <= Date.now() : !e.tuttoIlGiorno && e.inizioMs + 3600e3 <= Date.now());
  return finito ? h.replace('class="evt-riga', 'class="evt-riga evt-passato') : h;
};
ui.v12Passati = false;
ui.v12Indietro = false;
AZIONI['v12-passati'] = () => { ui.v12Passati = !ui.v12Passati; render(); };
AZIONI['v12-indietro'] = (el, id, data, ev) => { setTimeout(() => { const d = el.closest('details'); ui.v12Indietro = !!(d && d.open); }, 0); };
AZIONI['v12-tempo'] = el => { setTimeout(() => { const d = el.closest('details'); ui.v12Tempo = !!(d && d.open); }, 0); };

const _vistaOggiV12 = vistaOggi;
vistaOggi = function () {
  const h = _vistaOggiV12.apply(this, arguments);
  if (ui.tab !== 'oggi' || modoSemplice()) return h;
  let p;
  try { p = primaDiTutto(); } catch (err) { console.warn('[Oggi] prima di tutto:', err.message); return h; }
  const tpl = document.createElement('template');
  tpl.innerHTML = h;
  const f = tpl.content;
  const coperti = new Set(p.carte.map(x => x.k));
  // i suggerimenti: fuori dalla cima, in «Quando hai tempo»
  const tempo = [];
  f.querySelectorAll('section.banner-piano:not(.delega-avviso)').forEach(s => {
    const lab = s.getAttribute('aria-label') || '';
    const doppio = (s.classList.contains('banner-coach') && coperti.has('coach')) || (/^Esercizio Q2$/.test(lab) && p.q2NelCoach) || (/^Piano della settimana$/.test(lab) && (coperti.has('piano') || coperti.has('prossima')));
    if (!doppio) tempo.push({ lab, html: s.outerHTML });
    s.remove();
  });
  // rimaste indietro e Subito: sono già nella prima carta
  if (coperti.has('oggi')) {
    f.querySelectorAll('.rimaste-riga, section.carry').forEach(x => x.remove());
    const lh = f.querySelector('.lh-subito');
    if (lh) { const g = lh.nextElementSibling; if (g && g.classList.contains('group')) g.remove(); lh.remove(); }
    p.ids.forEach(id => f.querySelectorAll(`.giornata .item[data-id="${CSS.escape(String(id))}"], .group:not(.v12-righe) > .item[data-id="${CSS.escape(String(id))}"]`).forEach(x => x.remove()));
    f.querySelectorAll('.group').forEach(g => { if (!g.children.length) { const prima = g.previousElementSibling; g.remove(); if (prima && prima.classList.contains('list-head') && /Senza ora/.test(prima.textContent)) prima.remove(); } });
  }
  if (coperti.has('coach')) f.querySelectorAll('.oggi-coach').forEach(x => x.remove());
  // la giornata: gli appuntamenti finiti si chiudono
  const passati = f.querySelectorAll('.giornata .evt-passato').length;
  const head = [...f.querySelectorAll('p.list-head')].find(x => /La giornata/.test(x.textContent));
  if (passati && head) {
    const n = head.querySelector('.mono');
    if (n) n.innerHTML = `${escHtml(n.textContent)}${n.textContent ? ' · ' : ''}${passati} finiti <button type="button" class="v12-mostra" data-act="v12-passati">${ui.v12Passati ? 'Nascondi' : 'Mostra'}</button>`;
  }
  // in cima
  const vh = f.querySelector('.vh');
  const blocco = document.createElement('div');
  blocco.className = 'v12-prima';
  blocco.innerHTML = p.carte.length
    ? `<p class="list-head v12-head"><span>Prima di tutto</span><span class="mono">${plurale(p.carte.length, 'cosa', 'cose')}</span></p><div class="v12-griglia">${p.carte.map(x => x.html).join('')}</div>`
    : `<p class="v12-libero"><i class="ti ti-circle-check" aria-hidden="true"></i>Niente in ritardo, il piano c'è, il coach è a posto.</p>`;
  if (vh) vh.after(blocco); else f.prepend(blocco);
  // in fondo: quando hai tempo
  if (tempo.length) {
    const d = document.createElement('details');
    d.className = 'v12-tempo';
    if (ui.v12Tempo) d.open = true;
    const nomi = tempo.map(x => x.lab).filter(Boolean).join(' · ');
    d.innerHTML = `<summary data-act="v12-tempo"><span><b>Quando hai tempo · ${tempo.length}</b><small>${escHtml(nomi)}</small></span><i class="ti ti-chevron-down" aria-hidden="true"></i></summary><div class="v12-tempo-corpo">${tempo.map(x => x.html).join('')}</div>`;
    const coach = f.querySelector('.oggi-coach');
    if (coach) coach.before(d); else f.append(d);
  }
  const box = document.createElement('div');
  box.appendChild(f);
  return `<div class="v12-oggi${ui.v12Passati ? ' mostra-passati' : ''}">${box.innerHTML}</div>`;
};

// all'avvio: la bozza del campo e gli invii nel database
const _avviaAppV12 = avviaApp;
avviaApp = function (sessione) {
  const prima = _appAvviata;
  _avviaAppV12(sessione);
  if (prima) return;
  setTimeout(ripristinaBozzaCattura, 300);
  caricaInviiDb().catch(err => console.warn('[Piano] invii:', err.message));
};

// ══════════════════════════════════════════════════════════════
