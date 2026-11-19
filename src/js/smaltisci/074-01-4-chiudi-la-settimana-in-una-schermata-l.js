// v10 · SNELLA (25/10): meno tocchi, stesse funzioni
// 1. Aggiungi in un tocco: Invio salva, un'etichetta per riga al massimo, niente secondo toast
// 2. I doppioni non bloccano: si salva, poi una card con «Uniscile» / «Sono diverse» per 8 secondi
// 3. Lavoro o Personale lo capisce l'app (indovinaContesto) e impara dalle correzioni
// 4. Chiudi la settimana in una schermata · 5. Prepara la settimana in due passi
// Le versioni di prima restano raggiungibili: «Riporta il foglio», «Più scelte», «Modalità dettagliata».
// ══════════════════════════════════════════════════════════════
const SN = { DOPP_MS: 8000, SICURO: 3, SEGNALE: 2, SUBITO_GG: 10, CORR_LS: 'ctx_correzioni', CAL_LS: 'bpsn_cal',
  NOMI_CTX: { lavoro: 'Lavoro', personale: 'Personale' }, ICO_CTX: { lavoro: 'ti-briefcase', personale: 'ti-home' } };
const MESI_SN = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const altroCtx = c => c === 'personale' ? 'lavoro' : 'personale';
const nomeCtx = c => SN.NOMI_CTX[c] || 'Lavoro';

// ─── 3 · indovinaContesto(testo) → { ctx, motivo, sicuro } ───
// Segnali con un peso (+ = Personale, − = Lavoro): calendario di origine, persone note, parole delle cose
// che hai già (impara da sole quando sposti una cosa), correzioni fatte toccando l'etichetta e, solo dove
// l'app non ha ancora imparato niente, una lista fissa di parole. Quello che hai già scritto vince sulla lista:
// una parola che usi soprattutto in un contesto porta lì; una che usi in tutti e due (es. un progetto tenuto
// sia in Lavoro sia in Personale) non decide niente e toglie il «sicuro». Sotto la soglia: il contesto in vista.
const CTX_P = 'personale', CTX_L = 'lavoro';
const CTX_PAROLE = [
  // famiglia e persone di casa
  [/\bsamira\b|\bsami\b/, CTX_P, 4, 'Samira'], [/\bfrancesca\b|\bfranci\b/, CTX_P, 4, 'Francesca'], [/\btia\b/, CTX_P, 3, 'Tia'],
  [/\bfigli[ae]?\b|\bbimb[ei]\b/, CTX_P, 3], [/\bmamma\b|\bpapa\b|\bnonn[aio]\b|\bsuocer[ao]\b|\bgenitori\b|\bmiei genitori\b/, CTX_P, 3],
  [/\bfamiglia\b|\bfamiliar\w*\b|\bcoppia\b|\bsogni\b/, CTX_P, 2],
  // crescita personale
  [/\bmeditazion\w*\b|\bkundalini\b|\bipnosi\b|\bintrospettiv\w*\b/, CTX_P, 5], [/\bdesideri\b|\bmete\b/, CTX_P, 4], [/\bscrittura\b|\blibro\b/, CTX_P, 3], [/\bcapitolo\b/, CTX_P, 2],
  // scuola, sport, salute
  [/\bscuola\b|\bpagella\b|\bprofessor\w*\b|\bmaestr[ae]\b|\bcompiti\b|\bgita\b/, CTX_P, 3], [/\bverifica\b|\binterrogazion\w*\b/, CTX_P, 2],
  [/\bpallavolo\b|\bcalcetto\b|\bnuoto\b|\bpartita\b/, CTX_P, 3], [/\bdentista\b|\bpediatra\b|\bortopedico\b|\boculista\b|\bveterinari[oa]\b/, CTX_P, 3], [/\bortodonzi\w*\b|\bodontoiatric\w*\b|\bginocchi[oa]?\b/, CTX_P, 4],
  [/\bvisita\b/, CTX_P, 2], [/\bmedico\b/, CTX_P, 2], [/\bpalestra\b/, CTX_P, 5], [/\bems\b|\bintegrator\w*\b|\ballenament\w*\b|\bbilancia\b/, CTX_P, 3],
  // casa, soldi di casa, svago
  [/\bcasa\b|\bcondominio\b|\bmutuo\b/, CTX_P, 2], [/\bspesa\b|\bsupermercato\b|\borto\b/, CTX_P, 3], [/\bbollett\w*\b|\bamex\b|\bconto addebito\b|\baddebito\b|\btasse da pagare\b/, CTX_P, 3],
  [/\bamazon\b/, CTX_P, 3], [/\bbonifico\b/, CTX_P, 3], [/\bcentro commerciale\b/, CTX_P, 6, 'centro commerciale'], [/\bnaruto\b|\bboruto\b/, CTX_P, 4],
  [/\bvan\b|\bvacanz\w*\b|\bferie\b|\bviaggio\b/, CTX_P, 3], [/\bregal[oi]\b|\bcompleann\w*\b|\bcresima\b|\bcatechismo\b|\bcomunione\b/, CTX_P, 2],
  [/\bcane\b|\bcrocchette\b/, CTX_P, 3], [/\btagliando\b|\bgomme\b|\bbollo auto\b|\bparrucchiere\b|\bbarbiere\b/, CTX_P, 3],
  [/\bcripto\w*\b|\bbinance\b|\bcoinbase\b|\bdichiarazione dei redditi\b|\b730\b/, CTX_P, 3],
  // associazioni e progetti personali (Yoga Tribe no: Roby la tiene in tutti e due i contesti)
  [/\brione shanghai\b|\bil dragone\b|\boltre le mura\b|\bking kendzee\b|\bkendzee\b|\bkeyloo\b|\binterrogai\b/, CTX_P, 4],
  [/\bshanghai\b|\bdragone\b|\brione\b/, CTX_P, 3], [/\ba\.?n\.?i\.?m\.?a\.?(?=\s|$)|\banima\b/, CTX_P, 3, 'A.N.I.M.A.'],
  // lavoro
  [/\bssi\b|\bsi soluzioni\b|\bsoluzioni impresa\b/, CTX_L, 4, 'SSI'], [/\bclient[ei]\b/, CTX_L, 3], [/\bpreventiv[oi]\b|\bofferta\b|\bofferte\b/, CTX_L, 3],
  [/\bagent[ei]\b|\bprovvigion\w*\b|\bcapi? area\b|\bmansionario\b|\bcommercial[ei]\b/, CTX_L, 3], [/\bdvr\b|\brspp\b|\bhaccp\b|\btdp\b/, CTX_L, 4],
  [/\bsopralluog\w*\b|\bverbal[ei]\b|\bantincendio\b|\bcantier[ei]\b|\binail\b|\basl\b/, CTX_L, 3], [/\bcors[oi]\b|\bformazion\w*\b|\btecnic[oi]\b/, CTX_L, 2],
  [/\binsolut\w*\b|\bincass\w*\b|\bfattur\w*\b|\blistino\b|\bvendit\w*\b/, CTX_L, 3], [/\bsecurmars\b|\bcrm\b|\bodoo\b|\bpromarsis\b/, CTX_L, 4],
  [/\bs\.?r\.?l(?:s)?\b|\bs\.?p\.?a\b|\bsnc\b|\bsas\b/, CTX_L, 4, 'srl'], [/\bmedico competente\b|\bsorveglianza sanitaria\b/, CTX_L, 6], [/\bvisite mediche\b|\bdipendent[ei]\b|\blavorator[ei]\b/, CTX_L, 3],
  [/\bazienda\b|\baziende\b|\bufficio\b|\bfornitor[ei]\b|\breport\b|\bbando\b|\bcontratt[oi]\b|\bsicurezza\b|\bprivacy\b/, CTX_L, 2]
];
// nomi e parole che non dicono niente (Marco e Francesco: soci e familiari; il commercialista: per tutti e due)
const CTX_AMBIGUE = new Set('marco francesco commercialista riunione mail email telefonata chiamare chiamata sentire fare preparare mandare scrivere leadership app'.split(' '));
const CTX_IMP = { MISTO: 0.15, SUPPORTO_VETO: 2 };   // parola «mista»: almeno il 15% nell'altro contesto
// progetti che Roby tiene sia in Lavoro sia in Personale: mai «sicuro», qualunque cosa dicano le altre parole
const CTX_MISTI = /\byoga\b|\btribe\b/;
function testoCtx(t) { return togliAccenti(String(t || '')).toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim(); }
function paroleCtx(t) { return testoCtx(t).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !/^\d+$/.test(w) && !DOPP_VUOTE.has(w) && !CTX_AMBIGUE.has(w)); }
// le parole con la maiuscola non in testa (nomi, clienti, progetti), già pulite
function nomiCtx(t) { return String(t || '').split(/\s[-–—+:]\s|[.:;(]\s*/).flatMap(seg => seg.trim().split(/\s+/).slice(1)).filter(w => /^[A-ZÀ-Ý]/.test(w)).flatMap(w => paroleCtx(w)); }   // non la prima parola di ogni pezzo («… - Mettere»)
// «Mia» è anche un possessivo: vale solo come nome (maiuscola non in testa, o «per mia» in fondo)
function segnaleMia(testo) {
  const t = String(testo || '').trim(), resto = t.replace(/^\S+\s*/, '');
  if (/(?:^|[^\p{L}])Mia(?![\p{L}])/u.test(resto)) return true;
  return /\b(?:per|con|a|e|da)\s+mia(?:\s+(?:a|al|alla|allo|ai|e|da|dal|dalla|in|per|domani|oggi)\b|\s*[.,;!?]?\s*$)/i.test(testoCtx(t));
}
// parole delle cose che hai: quante volte stanno in Lavoro e in Personale (si rifà quando cambia qualcosa)
let _ctxImp = { chiave: '', conta: new Map(), persone: new Map() };
function imparatoCtx() {
  const cicli = (state.cicli || []).filter(c => c.ctx === CTX_P || c.ctx === CTX_L), np = cicli.filter(c => c.ctx === CTX_P).length;
  const chiave = `${cicli.length}:${np}:${cicli.reduce((s, c) => s + String(c.title || '').length * (c.ctx === CTX_P ? 3 : 1), 0)}:${(state.persone || []).length}`;
  if (_ctxImp.chiave === chiave) return _ctxImp;
  const conta = new Map();
  cicli.forEach(c => {
    const nomi = new Set(nomiCtx(c.title)), minuscole = new Set(String(c.title || '').split(/\s+/).filter(w => /^[a-zà-ÿ]/.test(w)).flatMap(w => paroleCtx(w)));
    new Set(paroleCtx(c.title)).forEach(w => { const x = conta.get(w) || { p: 0, l: 0, nome: false, minuscola: false }; x[c.ctx === CTX_P ? 'p' : 'l']++; if (nomi.has(w)) x.nome = true; if (minuscole.has(w)) x.minuscola = true; conta.set(w, x); });
  });
  // le persone: il contesto prevalente delle cose che le nominano
  const persone = new Map();
  (state.persone || []).forEach(p => {
    const nome = testoCtx(p.nome).split(' ')[0];
    if (!nome || nome.length < 3 || CTX_AMBIGUE.has(nome)) return;
    const re = new RegExp(`\\b${nome}\\b`);
    const cose = cicli.filter(c => (c.persone_menzionate || []).includes(p.nome) || re.test(testoCtx(c.title)));
    const n = cose.length, pp = cose.filter(c => c.ctx === CTX_P).length;
    if (n < 2) return;
    const quota = pp / n;
    if (quota >= 0.75 || quota <= 0.25) persone.set(nome, { ctx: quota >= 0.75 ? CTX_P : CTX_L, peso: n >= 3 ? 3 : 2, nome: p.nome });
  });
  _ctxImp = { chiave, conta, persone };
  return _ctxImp;
}
const correzioniCtx = () => leggiJson(SN.CORR_LS, {});
// «Se sbaglio, tocca l'etichetta: la prossima volta me lo ricordo»
function imparaCtx(titolo, ctx) {
  const corr = correzioniCtx();
  paroleCtx(titolo).filter(w => !eVerbo(w)).forEach(w => { const x = corr[w] || { p: 0, l: 0 }; x[ctx === CTX_P ? 'p' : 'l']++; corr[w] = x; });
  scriviJson(SN.CORR_LS, corr);
}
const mistaCtx = x => !!x && x.p >= 1 && x.l >= 1 && Math.min(x.p, x.l) / (x.p + x.l) >= CTX_IMP.MISTO;
// quanto pesa una parola imparata: 1 volta = poco, 3+ volte = quanto una parola chiave; i verbi la metà
function pesoImparato(x, w) {
  const n = x.p + x.l, peso = n === 1 ? 1 : n === 2 ? 2.5 : Math.min(4, 3 + (n - 3) * 0.25);
  return (eVerbo(w) ? peso / 2 : peso) * (x.p > x.l ? 1 : -1);
}
function indovinaContesto(testo, opz = {}) {
  const base = opz.ctx || state.ctx || CTX_L;
  const t = testoCtx(testo), contributi = [];
  let veto = CTX_MISTI.test(t);
  const metti = (ctx, peso, etichetta) => contributi.push({ v: ctx === CTX_P ? peso : -peso, etichetta });
  if (opz.cal === 'privato') metti(CTX_P, 6, 'calendario Privato');
  else if (opz.cal === 'lavoro') metti(CTX_L, 6, 'calendario Lavoro');
  const imp = imparatoCtx(), corr = correzioniCtx(), parole = unici(paroleCtx(testo));
  // 1. quello che hai già scritto: correzioni, persone, parole imparate
  const decise = new Map();   // parola → 'misto' | ctx
  const daTe = new Set();     // v28 · parole decise da te (correzioni) o da una persona: queste battono la lista
  parole.forEach(w => {
    const c = corr[w];
    if (c && c.p !== c.l) { metti(c.p > c.l ? CTX_P : CTX_L, 3, w); decise.set(w, c.p > c.l ? CTX_P : CTX_L); daTe.add(w); return; }
    const p = imp.persone.get(w);
    if (p) { metti(p.ctx, p.peso, p.nome); decise.set(w, p.ctx); daTe.add(w); return; }
    const x = imp.conta.get(w);
    if (!x) return;
    if (mistaCtx(x)) { decise.set(w, 'misto'); if (x.nome && !x.minuscola && x.p + x.l >= CTX_IMP.SUPPORTO_VETO) veto = true; return; }   // un nome o progetto usato in tutti e due: niente «sicuro»
    decise.set(w, x.p > x.l ? CTX_P : CTX_L);
    contributi.push({ v: pesoImparato(x, w), etichetta: w, appreso: true, w });
  });
  // 2. la lista fissa, solo dove l'app non sa già com'è (se dice lo stesso, vale il peso più alto)
  const segnali = [...(segnaleMia(testo) ? [[null, CTX_P, 4, 'Mia', 'mia']] : []),
    ...CTX_PAROLE.map(([re, ctx, peso, et]) => { const m = re.exec(t); return m ? [m, ctx, peso, et || m[0], m[0]] : null; }).filter(Boolean)];
  const coperte = new Set();   // parole già dentro una frase della lista («centro commerciale»)
  segnali.forEach(([, ctx, peso, et, trovato]) => {
    const ws = trovato.split(/[^a-z0-9]+/).filter(Boolean), dette = ws.map(w => decise.get(w)).filter(Boolean);
    if (ws.every(w => coperte.has(w))) return;
    if (ws.length > 1) {   // una frase intera dice più delle sue parole prese una a una, a meno che tu non l'abbia già usata
      const re = new RegExp(`\\b${ws.join('\\W+')}\\b`), gia = (state.cicli || []).filter(c => (c.ctx === CTX_P || c.ctx === CTX_L) && re.test(testoCtx(c.title)));
      const gp = gia.filter(c => c.ctx === CTX_P).length, x = { p: gp, l: gia.length - gp };
      if (mistaCtx(x)) { veto = true; return; }
      if (gia.length && (x.p > x.l ? CTX_P : CTX_L) !== ctx) { ws.forEach(w => coperte.add(w)); return; }   // la usi nell'altro contesto: valgono le parole imparate
      ws.forEach(w => coperte.add(w));
      for (let k = contributi.length - 1; k >= 0; k--) if (contributi[k].appreso && ws.includes(contributi[k].w)) contributi.splice(k, 1);
      metti(ctx, peso, et);
      return;
    }
    if (ws.some(w => daTe.has(w) && decise.get(w) !== ctx)) return;   // l'hai corretta tu: vince la tua scelta
    if (dette.some(d => d === 'misto')) return;
    if (dette.some(d => d !== ctx)) {   // v28 · imparata solo dalle cose salvate (spesso indovinate in automatico): vince la lista
      for (let k = contributi.length - 1; k >= 0; k--) if (contributi[k].appreso && ws.includes(contributi[k].w)) contributi.splice(k, 1);
      metti(ctx, peso, et);
      return;
    }
    if (dette.length) {   // stesso verso: si tiene il più forte, non si somma
      const ap = contributi.find(c => c.appreso && ws.includes(c.w));
      if (ap && Math.abs(ap.v) >= peso) return;
      if (ap) { ap.v = ctx === CTX_P ? peso : -peso; ap.etichetta = et; return; }
    }
    metti(ctx, peso, et);
  });
  const s = contributi.reduce((x, c) => x + c.v, 0), forza = Math.abs(s);
  if (forza < SN.SEGNALE) return { ctx: base, motivo: '', sicuro: false, segnale: false, punti: s, parole: [], misto: veto };
  const ctx = s > 0 ? CTX_P : CTX_L, sicuro = forza >= SN.SICURO && !veto;
  const quali = unici(contributi.filter(c => Math.sign(c.v) === Math.sign(s)).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).map(c => c.etichetta)).slice(0, 2);
  // un segnale debole (o un progetto che tieni in tutti e due i contesti) non sposta niente
  return { ctx: sicuro || ctx === base ? ctx : base, motivo: quali.length ? `riconosciuta da ${quali.map(p => `«${p}»`).join(', ')}` : '', sicuro, segnale: true, punti: s, parole: quali, indovinato: ctx, misto: veto };
}

// ─── Le voci: il contesto per riga (indovinato o toccato) ───
const _vociDaRigheSn = vociDaRighe;
vociDaRighe = function (righe, r) {
  const mod = (r && r.ctxMod) || {};
  return _vociDaRigheSn(righe, r).map(v => {
    const g = indovinaContesto(v.title || v.testo, { ctx: state.ctx });
    const toccato = mod[v.testo];
    return { ...v, ctx: toccato || g.ctx, ctxGuess: g, ctxToccato: !!toccato && toccato !== g.ctx };
  });
};

// ─── 1 · L'anteprima: per riga al massimo contesto, quando, e UN segnale (doppione > generica > 5 min) ───
const ID_CAMPO = { rapido: 'rapido-testo', cattura: 'cattura-testo' };
ui.cattura = { subito: false, oggi: false, mod: {}, ctxMod: {} };
const rCattura = () => ({ subito: !!ui.cattura.subito, oggi: !!ui.cattura.oggi, persona: null, mod: ui.cattura.mod || {}, ctxMod: ui.cattura.ctxMod || {}, noAvviso: ui.catturaNoAvviso ? null : [] });
const statoDi = dove => dove === 'cattura' ? rCattura() : ui.rapido;
const righeDi10 = dove => dove === 'cattura' ? righeCattura() : righeCampo($('rapido-testo').value);
const vociDi = dove => vociDaRighe(righeDi10(dove), statoDi(dove));
function quandoVoce(v, dove) {
  if (v.q === 3 && v.delega) return `${v.delega.nome}${v.delega.id ? '' : ' (nuova)'} · controlli ${v.data ? fmtGiornoCorto(v.data) : 'tra ' + FRASE.CONTROLLO_GIORNI + ' giorni'}`;
  if (!v.data) return '';
  const avvisa = v.avvisa && !(dove === 'cattura' && ui.catturaNoAvviso);
  return `${fmtGiornoCorto(v.data)}${v.ora ? ' · ' + v.ora : v.fascia ? ' · ' + v.fascia : ''}${v.controllaGiorno ? ' (controlla il giorno)' : ''}${avvisa ? ' · ti avviso' : ''}`;
}
function doppioneForte(v) { const m = trovaDoppione(v.title); return m && forte(m.livello) && m.tipo !== 'parente' ? m : null; }
function segnaleVoce(v, i, dove) {
  const m = trovaDoppione(v.title);
  if (m && forte(m.livello) && m.tipo !== 'parente') {
    const quando = m.tipo === 'aperta' ? `dal ${fmtGgMm(giornoIso(m.c.created_at))}` : m.tipo === 'fatta' ? `fatta il ${fmtGgMm(giornoIso(m.c.chiuso_at || m.c.updated_at))}` : giornoEvento(m.e);
    return `<span class="sn-segnale" data-tip="${esc(testoDopp(m))}"><i class="ti ti-copy" aria-hidden="true"></i>c'è già · ${escHtml(quando)}</span>`;
  }
  if (v.vaga) return '<span class="sn-segnale"><i class="ti ti-help-circle" aria-hidden="true"></i>Con chi? Quanto?</span>';
  if (v.breve && v.q !== 3) return `<button type="button" class="sn-chip sn-falla" data-act="sn-falla" data-dove="${dove}" data-i="${i}"><i class="ti ti-player-play"></i>Falla ora</button>`;
  if (m && m.tipo === 'parente') return `<span class="sn-vedi"><i class="ti ti-link" aria-hidden="true"></i>Vedi anche: ${escHtml(corta(m.c.title, 40))}</span>`;
  return '';
}
function htmlVoceSn(v, i, dove, sola) {
  const g = v.ctxGuess || {};
  const motivo = !v.ctxToccato && v.ctx !== state.ctx && g.sicuro && g.parole && g.parole.length ? g.parole : null;   // il perché solo se cambia contesto
  const ctxEt = `${nomeCtx(v.ctx)}${motivo && !sola ? ` · ${escHtml(motivo[0])}` : ''}`;
  const quando = quandoVoce(v, dove);
  const passi = (v.passi || []).length ? `<span class="sn-passi">${frasePassi(v.passi.length)}</span>` : '';
  const aperta = dove === 'rapido' && ui.rapido.aperta === i;
  return `<div class="sn-voce" data-i="${i}" data-dove="${dove}">
    <div class="sn-tit"><button type="button" class="sn-tipo q${v.q}" data-act="sn-tipo" data-dove="${dove}" data-i="${i}" aria-label="Tipo: ${TIPI[v.q].label}. Tocca per cambiare" data-tip="${TIPI[v.q].label} · tocca per cambiare"><span aria-hidden="true"></span></button>
      <span class="sn-titolo">${escHtml(v.title)}</span>${passi}</div>
    <div class="sn-chips">
      <span class="v28-ctx" role="group" aria-label="Lavoro o personale">${[CTX_L, CTX_P].map(k => `<button type="button" class="sn-chip sn-ctx v28-ctx-b" data-ctx="${k}" data-to="${k}" data-act="sn-ctx" data-dove="${dove}" data-i="${i}" aria-pressed="${v.ctx === k}"><i class="ti ${SN.ICO_CTX[k]}" aria-hidden="true"></i>${v.ctx === k ? ctxEt : nomeCtx(k)}</button>`).join('')}</span>
      ${motivo && sola ? `<span class="sn-motivo">${escHtml(g.motivo)}</span>` : ''}
      <button type="button" class="sn-chip sn-quando${quando ? '' : ' vuoto'}" data-act="sn-quando" data-dove="${dove}" data-i="${i}" aria-expanded="${aperta}"${quando ? '' : ' aria-label="Scegli quando, il tipo e altro"'}><i class="ti ${v.q === 3 ? 'ti-user-share' : quando ? 'ti-calendar-event' : 'ti-calendar-plus'}" aria-hidden="true"></i>${quando ? escHtml(quando) : 'quando?'}</button>
      ${segnaleVoce(v, i, dove)}
    </div>
    ${aperta ? editorVoce(v, i) + spuntaAvviso(v, `data-avvisa="${i}"`) + (v.q !== 3 ? `<div class="rap-breve"><button type="button" class="chip" data-act="rap-cinque" data-i="${i}" aria-pressed="${!!v.cinque}"><i class="ti ti-clock-bolt"></i>5 min</button></div>` : '') : ''}</div>`;
}
function notaCtx(voci, corta) {
  const fuori = voci.filter(v => v.ctx !== state.ctx && (v.ctxToccato || (v.ctxGuess && v.ctxGuess.sicuro)));   // solo con un segnale sicuro (o se l'hai cambiato tu)
  if (!fuori.length) return '';
  const dove = nomeCtx(fuori[0].ctx);
  if (corta) return `<p class="sn-nota-ctx" role="status"><i class="ti ti-info-circle" aria-hidden="true"></i><span>Sei in ${nomeCtx(state.ctx)}: ${voci.length === 1 ? 'la metto' : fuori.length + ' le metto'} in <b>${dove}</b>. Se sbaglio, tocca l'etichetta.</span></p>`;
  const cosa = voci.length === 1 ? 'questa la metto' : fuori.length === voci.length ? 'queste le metto' : `${fuori.length === 1 ? 'una di queste la metto' : fuori.length + ' di queste le metto'}`;
  return `<p class="sn-nota-ctx" role="status"><i class="ti ti-info-circle" aria-hidden="true"></i><span>Sei in <b>${nomeCtx(state.ctx)}</b>: ${cosa} in <b>${dove}</b>. Se sbaglio, tocca l'etichetta: la prossima volta me lo ricordo.</span></p>`;
}
function etichettaSalva(voci) {
  if (!voci.length) return '<i class="ti ti-corner-down-left"></i>Invio';
  if (voci.length === 1) return voci[0].ctx !== state.ctx ? `Salva in ${nomeCtx(voci[0].ctx)}` : 'Salva';
  return `Salva ${voci.length} cose`;
}
disegnaAnteprima = function () {
  const box = $('rapido-anteprima');
  if (!box || !ui.rapido) return;
  const voci = vociDi('rapido');
  box.hidden = !voci.length;
  box.innerHTML = voci.length ? voci.map((v, i) => htmlVoceSn(v, i, 'rapido', voci.length === 1)).join('') + notaCtx(voci) : '';
  const tasto = document.querySelector('#rapidoOverlay [data-act="rapido-salva"]');
  if (tasto) tasto.innerHTML = etichettaSalva(voci);
  const nota = document.querySelector('#rapidoOverlay .rapido-nota');
  if (nota) nota.textContent = voci.length ? 'Tocca un\'etichetta per cambiarla. Niente da confermare: Invio salva tutto.' : 'Una riga, una cosa. Prova: «ricordami venerdì alle 10 di chiamare Rossi».';
};
disegnaAnteprimaCattura = function () {
  const box = $('cattura-anteprima');
  if (!box) return;
  const voci = vociDi('cattura');
  box.hidden = !voci.length;
  if (!voci.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="sn-voci">${voci.slice(0, 2).map((v, i) => htmlVoceSn(v, i, 'cattura', voci.length === 1)).join('')}${voci.length > 2 ? `<span class="t-caption muted">+ altre ${voci.length - 2}</span>` : ''}${notaCtx(voci, true)}</div>
    <button type="button" class="btn btn-icon sn-apri" data-act="cattura-modifica" aria-label="Apri nel foglio per modificare" data-tip="Apri nel foglio"><i class="ti ti-arrows-maximize"></i></button>`;
};
// le correzioni: tipo, contesto (per riga, finché il testo resta uguale)
function correggiSn(dove, i, valori) {
  const v = vociDi(dove)[i];
  if (!v) return;
  const voce = { title: v.title, data: v.data, ora: v.ora, q: v.q, delega: v.delega, controllaGiorno: !!v.controllaGiorno, ...valori };
  if (dove === 'rapido') ui.rapido = { ...ui.rapido, mod: { ...(ui.rapido.mod || {}), [i]: { testo: v.testo, valori: voce } } };
  else ui.cattura = { ...ui.cattura, mod: { ...ui.cattura.mod, [i]: { testo: v.testo, valori: voce } } };
}
const ridisegnaSn = dove => dove === 'cattura' ? disegnaAnteprimaCattura() : disegnaAnteprima();
const CICLO_TIPO = { 2: 1, 1: 3, 3: 2, 4: 2 };   // Importante → Subito → Delega → Importante
Object.assign(AZIONI, {
  'sn-ctx': el => {
    const dove = el.dataset.dove, i = +el.dataset.i, v = vociDi(dove)[i];
    if (!v) return;
    if (el.dataset.to && el.dataset.to === v.ctx) return;   // v28 · già scelto
    const st = statoDi(dove), nuovo = altroCtx(v.ctx), mod = { ...(st.ctxMod || {}), [v.testo]: nuovo };
    if (dove === 'cattura') ui.cattura = { ...ui.cattura, ctxMod: mod }; else ui.rapido = { ...ui.rapido, ctxMod: mod };
    ridisegnaSn(dove);
  },
  'sn-tipo': el => {
    const dove = el.dataset.dove, i = +el.dataset.i, v = vociDi(dove)[i];
    if (!v) return;
    const q = CICLO_TIPO[v.q] || 2;
    correggiSn(dove, i, { q, delega: q === 3 ? v.delega || null : null });
    ridisegnaSn(dove);
  },
  'sn-quando': el => {
    const dove = el.dataset.dove, i = +el.dataset.i;
    if (dove === 'rapido') { ui.rapido = { ...ui.rapido, aperta: ui.rapido.aperta === i ? null : i }; disegnaAnteprima(); return; }
    // il campo del telefono: si apre il foglio con il testo e l'editor di quella riga
    const t = $('cattura-testo').value, c = ui.cattura;
    fermaDettatura();
    $('cattura-testo').value = ''; allungaCattura();
    ui.cattura = { subito: false, oggi: false, mod: {}, ctxMod: {} };
    disegnaAnteprimaCattura(); aggiornaChipsCattura();
    apriRapidoCon(t);
    ui.rapido = { ...ui.rapido, subito: c.subito, oggi: c.oggi, mod: c.mod, ctxMod: c.ctxMod, aperta: i };
    disegnaRapido();
  },
  'sn-falla': el => {
    const dove = el.dataset.dove, i = +el.dataset.i;
    if (dove === 'rapido') { AZIONI['rap-fallaora'](el); return; }
    const v = vociDi('cattura')[i];
    if (!v) return;
    fermaDettatura();
    const righe = $('cattura-testo').value.split(/\r?\n/), k = righe.findIndex(x => x.trim() === v.testo);
    if (k >= 0) righe.splice(k, 1);
    $('cattura-testo').value = righe.join('\n').trim();
    allungaCattura(); disegnaAnteprimaCattura();
    avviaFallaOra({ voce: { ...v, cinque: true }, r: {} });
  }
});
// il titolo corretto nell'editor si vede subito nella riga
document.addEventListener('input', e => {
  const t = e.target, ed = t.closest && t.closest('#rapido-anteprima .rap-edit');
  if (!ed || t.dataset.campo !== 'title') return;
  const s = document.querySelector(`#rapido-anteprima .sn-voce[data-i="${ed.dataset.i}"] .sn-titolo`);
  if (s) s.textContent = t.value;
});
// «Ci vogliono pochi minuti? Falla ora» dopo il salvataggio: non più (resta il chip nella riga)
offriFallaOraDopo = function () {};
// apre il foglio: contesto per riga azzerato; i doppioni guardano anche gli appuntamenti già letti
const _apriRapidoSn = apriRapido;
apriRapido = function () { _apriRapidoSn.apply(this, arguments); ui.rapido = { ...ui.rapido, ctxMod: {} }; disegnaAnteprima(); caricaEventiDopp().catch(() => {}); };

// ─── Il campo del telefono: Subito / Oggi quando ha il cursore; Invio salva con le stesse etichette ───
$('cattura-anteprima').insertAdjacentHTML('afterend', `<div class="sn-ca-chips" id="cattura-chips" role="group" aria-label="Opzioni" hidden>
  <button type="button" class="chip" data-act="sn-ca-subito" aria-pressed="false"><i class="ti ti-flame"></i>Subito</button>
  <button type="button" class="chip" data-act="sn-ca-oggi" aria-pressed="false"><i class="ti ti-sun"></i>Oggi</button></div>`);
function aggiornaChipsCattura() {
  const box = $('cattura-chips');
  if (!box) return;
  box.querySelector('[data-act="sn-ca-subito"]').setAttribute('aria-pressed', String(!!ui.cattura.subito));
  box.querySelector('[data-act="sn-ca-oggi"]').setAttribute('aria-pressed', String(!!ui.cattura.oggi));
}
AZIONI['sn-ca-subito'] = () => { ui.cattura = { ...ui.cattura, subito: !ui.cattura.subito }; aggiornaChipsCattura(); disegnaAnteprimaCattura(); };
AZIONI['sn-ca-oggi'] = () => { ui.cattura = { ...ui.cattura, oggi: !ui.cattura.oggi }; aggiornaChipsCattura(); disegnaAnteprimaCattura(); };
// i tasti del campo non tolgono il cursore (iPhone: altrimenti la riga dei chip sparisce sotto il dito)
$('cattura').addEventListener('pointerdown', e => { if (e.target.closest('button') && !e.target.closest('.cattura-add')) e.preventDefault(); });
$('cattura').addEventListener('focusin', () => { $('cattura-chips').hidden = false; });
$('cattura').addEventListener('focusout', () => setTimeout(() => {
  const dentro = $('cattura').contains(document.activeElement);
  if (!dentro && !ui.cattura.subito && !ui.cattura.oggi) $('cattura-chips').hidden = true;
}, 150));
salvaCattura = async function () {
  const righe = righeCattura();
  if (!righe.length) { apriRapido(); return; }
  fermaDettatura();
  const campo = $('cattura-testo'), r = rCattura();
  campo.disabled = true;
  ui._catturaNoAvviso = ui.catturaNoAvviso;
  let nuove = null;
  try { nuove = await aggiungiFrasi(vociDaRighe(righe, r), r); }
  finally { ui._catturaNoAvviso = false; ui.catturaNoAvviso = false; campo.disabled = false; }
  if (nuove) { campo.value = ''; allungaCattura(); ui.cattura = { subito: false, oggi: false, mod: {}, ctxMod: {} }; aggiornaChipsCattura(); disegnaAnteprimaCattura(); }
  campo.focus();
};

// ─── Salvare: subito, ognuna nel suo contesto; poi i doppioni e «Vai a Personale» ───
const _showToastSn = showToast;
showToast = function (msg, type, opz) {
  if (ui._snZitto && type === 'success') return;   // il messaggio lo dà il salvataggio v10
  return _showToastSn.apply(this, arguments);
};
// Esegue fn (che legge state.ctx prima di qualsiasi await) con il contesto ctx, poi rimette quello in vista.
function conContesto(ctx, fn) {
  const vista = state.ctx;
  state.ctx = ctx;
  let p;
  try { p = fn(); } finally { state.ctx = vista; }
  return p;
}
aggiungiFrasi = async function (voci, r) {
  if (r && r.cusc) return _aggiungiFrasiDopp(voci, r);   // urgenza arrivata: nel cuscinetto com'è
  const vista = state.ctx, fatte = [], tutte = [];
  const doppi = voci.map(doppioneForte);   // prima di salvare: la nuova non deve trovare se stessa
  ui._snZitto = true;
  try {
    for (let k = 0; k < voci.length; k++) {
      const v = voci[k], ctx = v.ctx || vista;
      const nuove = await conContesto(ctx, () => _aggiungiFrasiDopp([v], r));   // salta il foglio «C'è già?»: non blocca più
      if (!nuove) { if (!tutte.length) return null; break; }
      tutte.push(...nuove);
      const c = nuove.find(n => !n.parent_id) || nuove[0];
      if (c) fatte.push({ v, c, m: doppi[k] });
      if (v.ctxToccato) imparaCtx(v.title, ctx);
    }
  } finally { ui._snZitto = false; }
  render();
  dopoIlSalvataggio(fatte, vista);
  return tutte;
};
function dopoIlSalvataggio(fatte, vista) {
  if (!fatte.length) return;
  const fuori = fatte.filter(x => x.c.ctx && x.c.ctx !== vista);
  const vai = fuori.length ? { etichetta: `Vai a ${nomeCtx(fuori[0].c.ctx)}`, annulla: () => { switchCtx(fuori[0].c.ctx); lampeggia(fuori[0].c.id); } } : null;
  fatte.filter(x => !x.c.ctx || x.c.ctx === vista).forEach(x => lampeggia(x.c.id));
  const doppi = fatte.filter(x => x.m);
  if (doppi.length) { cardDoppioni(doppi, vai); return; }
  const conPassi = v => (v.passi || []).length ? ` · con ${plurale(v.passi.length, 'passo', 'passi')}` : '';
  if (fatte.length === 1) {
    const { v, c } = fatte[0];
    if (vai) showToast(`In ${nomeCtx(c.ctx)}: ${v.title}`, 'success', vai);
    else showToast(`Aggiunta: ${sintesiVoce(v)}${conPassi(v)}`, 'success', { annulla: () => apriDettaglio(c.id), etichetta: 'Dettagli' });
  } else showToast(`${fatte.length} cose aggiunte${fuori.length ? `, ${fuori.length} in ${nomeCtx(fuori[0].c.ctx)}` : ''}`, 'success', vai || undefined);
}

// ─── 2 · La card dei doppioni: «Salvata. C'era già…» · Uniscile / Sono diverse · 8 secondi ───
ui.snDopp = null;
function testoCardDopp(m) {
  if (m.tipo === 'aperta') return `C'era già «${escHtml(m.c.title)}», aperta dal ${fmtGgMm(giornoIso(m.c.created_at))}.`;
  if (m.tipo === 'fatta') return `L'avevi già fatta il ${fmtGgMm(giornoIso(m.c.chiuso_at || m.c.updated_at))}: «${escHtml(m.c.title)}».`;
  return `In agenda c'è già «${escHtml(m.e.titoloOrig || m.e.titolo)}», ${escHtml(giornoEvento(m.e))}.`;
}
function chiudiCardDopp() {
  const d = ui.snDopp;
  ui.snDopp = null;
  if (d) clearTimeout(d.timer);
  const el = $('snDopp');
  if (el) el.remove();
}
function cardDoppioni(doppi, vai) {
  chiudiCardDopp();
  const box = $('toast-container');
  if (!box) return;
  const uno = doppi.length === 1, tipo = doppi[0].m.tipo;
  const unisci = uno && tipo === 'evento' ? 'Collegala' : uno && tipo === 'fatta' ? 'Riaprila' : 'Uniscile';
  const testo = uno ? `<b>Salvata.</b> ${testoCardDopp(doppi[0].m)}`
    : `<b>Salvate.</b> ${doppi.length} c'erano già:<ul>${doppi.map(x => `<li>${testoCardDopp(x.m)}</li>`).join('')}</ul>`;
  const el = document.createElement('div');
  el.id = 'snDopp';
  el.className = 'sn-dopp';
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="sn-dopp-testo"><i class="ti ti-check" aria-hidden="true"></i><div>${testo}</div></div>
    <div class="sn-dopp-tasti"><button type="button" class="sn-dopp-si" data-act="sn-unisci">${unisci}</button><button type="button" class="sn-dopp-no" data-act="sn-diverse">Sono diverse</button>${vai ? `<button type="button" class="sn-dopp-no" data-act="sn-vai">${escHtml(vai.etichetta)}</button>` : ''}</div>
    <div class="sn-dopp-tempo" aria-hidden="true"><i style="animation-duration:${SN.DOPP_MS}ms"></i></div>`;
  [...box.children].forEach(x => x.remove());
  box.appendChild(el);
  ui.snDopp = { doppi, vai, timer: setTimeout(chiudiCardDopp, SN.DOPP_MS) };
}
// l'unione di Altro → Doppioni, per un elenco qualsiasi: tiene `tieniId`, chiude le altre come «unita a…»
async function unisciInsieme(cose, tieniId) {
  const tieni = ciclo(tieniId), altre = cose.map(c => ciclo(c.id)).filter(c => c && c.id !== tieniId && !c.done);
  if (!tieni || !altre.length) return null;
  const ids = altre.map(c => c.id);
  const passi = state.cicli.filter(p => ids.includes(p.parent_id));
  const prima = [tieni, ...altre, ...passi].map(c => ({ id: c.id, campi: campi(c, campiUnione()) }));
  let assegnazioni = [];
  const conDelega = altre.find(c => c.delega_persona_id);
  await patchCiclo(tieni.id, { note: [tieni.note, ...altre.map(notaUnione)].filter(Boolean).join('\n\n'),
    persone_menzionate: unici([...(tieni.persone_menzionate || []), ...altre.flatMap(c => c.persone_menzionate || [])]),
    ...(state.delegaColsOk && !tieni.delega_persona_id && conDelega ? { delega_persona_id: conDelega.delega_persona_id, delega_controllo: conDelega.delega_controllo } : {}) });
  for (const p of passi) await patchCiclo(p.id, { parent_id: tieni.id });
  const { data: ass } = await db.from('assegnazioni').select('id,ciclo_id').in('ciclo_id', ids);
  assegnazioni = ass || [];
  if (assegnazioni.length) await db.from('assegnazioni').update({ ciclo_id: tieni.id }).in('id', assegnazioni.map(a => a.id));
  const ora = new Date().toISOString();
  for (const c of altre) await patchCiclo(c.id, { done: true, chiuso_at: ora, execution_status: 'done', note: `Unita a «${tieni.title}»${c.note ? '\n\n' + c.note : ''}` });
  return { tieni, prima, assegnazioni };
}
unisciGruppo = async function (k) {
  const g = gruppiAperti().find(x => x.chiave === k);
  if (!g) return;
  const tieniId = g.cose.some(c => c.id === ui.doppTieni[k]) ? ui.doppTieni[k] : g.cose[0].id;
  try {
    const r = await unisciInsieme(g.cose, tieniId);
    if (!r) return;
    render();
    showToast(`Unite in «${r.tieni.title}»`, 'success', { annulla: () => annullaUnione(r.prima, r.assegnazioni) });
  } catch (err) { showToast('Unione interrotta: ' + err.message, 'error'); render(); }
};
async function collegaAEvento(c, e) {
  const ora = e.ora || null;
  await patchCiclo(c.id, { scheduled_date: e.giorno, scheduled_time: ora, ...(ui.calEventColOk !== false ? { calendar_event_id: 'ext:' + e.id } : {}),
    ...(state.ritualiColsOk && ora && e.minuti ? { durata_minuti: e.minuti } : {}) });
  await pianificaInData(ciclo(c.id) || c, parseISODate(e.giorno), fasciaDaOra(ora));
}
async function nonDoppioni(chiavi) {
  scriviJson(DOPP.LS_NO, unici([...doppioniNo(), ...chiavi]));
  state.nonDopp = new Set([...state.nonDopp, ...chiavi]);
  if (!state.nonDoppOk || !chiavi.length) return;
  try { const { error } = await db.from('non_doppioni').upsert(chiavi.map(chiave => ({ chiave })), { onConflict: 'chiave' }); if (error) throw error; }
  catch (e) { console.warn('[Doppioni] salvataggio:', e.message); }
}
Object.assign(AZIONI, {
  'sn-unisci': async () => {
    const d = ui.snDopp;
    if (!d) return;
    chiudiCardDopp();
    const annulli = [];
    let unite = 0, collegate = 0, riaperte = 0;
    try {
      for (const { c, m } of d.doppi) {
        if (m.tipo === 'evento') { await collegaAEvento(c, m.e); collegate++; continue; }
        if (m.tipo === 'fatta') { await flipDone(m.c.id, true); riaperte++; }
        const r = await unisciInsieme([m.c, c], m.c.id);
        if (r) { annulli.push(r); unite++; }
      }
    } catch (err) { showToast('Non riesco: ' + err.message, 'error'); render(); return; }
    render();
    d.doppi.forEach(x => lampeggia(x.m.c ? x.m.c.id : x.c.id));
    const msg = d.doppi.length === 1 ? (collegate ? 'Collegata all\'appuntamento' : riaperte ? `Riaperta «${d.doppi[0].m.c.title}», con la nota della nuova` : `Unite in «${d.doppi[0].m.c.title}»`)
      : [unite && plurale(unite, 'unita', 'unite'), collegate && plurale(collegate, 'collegata', 'collegate')].filter(Boolean).join(' · ');
    showToast(msg, 'success', annulli.length ? { annulla: async () => { for (const r of annulli.reverse()) await annullaUnione(r.prima, r.assegnazioni); } } : undefined);
  },
  'sn-diverse': async () => {
    const d = ui.snDopp;
    if (!d) return;
    chiudiCardDopp();
    await nonDoppioni(d.doppi.filter(x => x.m.c).map(x => [x.m.c.id, x.c.id].sort().join('|')));
    showToast(d.doppi.length === 1 ? 'Va bene: le tengo tutte e due' : 'Va bene: le tengo tutte', 'info');
  },
  'sn-vai': () => { const d = ui.snDopp; chiudiCardDopp(); if (d && d.vai) d.vai.annulla(); }
});

// ─── 3 · Il contesto anche nelle altre strade: righe, foglio riportato, Plaud (per riga) ───
// aggiungiRighe legge state.ctx subito: ogni gruppo di righe con il suo contesto
const _aggiungiRigheSn = aggiungiRighe;
aggiungiRighe = async function (righe, r) {
  const vista = state.ctx, gruppi = new Map();
  righe.forEach(t => { const c = indovinaContesto(t, { ctx: vista }).ctx; gruppi.set(c, [...(gruppi.get(c) || []), t]); });
  if (gruppi.size === 1 && gruppi.has(vista)) return _aggiungiRigheSn(righe, r);
  const tutte = [];
  for (const [ctx, lista] of gruppi) {
    const nuove = await conContesto(ctx, () => _aggiungiRigheSn(lista, r));
    if (!nuove) return tutte.length ? tutte : null;
    tutte.push(...nuove);
  }
  return tutte;
};
// rigaNuova: titoli con un contesto già scelto (Plaud) o da indovinare (foglio riportato)
const _rigaNuovaSn = rigaNuova;
rigaNuova = function (title, r, ctx) {
  const m = ui._ctxTitoli;
  if (m && m.has(title)) return _rigaNuovaSn(title, r, m.get(title));
  if (ui._ctxAuto) return _rigaNuovaSn(title, r, indovinaContesto(title, { ctx }).ctx);
  return _rigaNuovaSn(title, r, ctx);
};
const _applicaRiportaSn = applicaRiporta;
applicaRiporta = async function () {
  ui._ctxAuto = true;
  try { return await _applicaRiportaSn.apply(this, arguments); } finally { ui._ctxAuto = false; }
};
// Plaud: la madre prende il contesto della riunione; ogni passo il suo (si cambia con l'etichetta)
const ctxPlaud = c => c.ctx || (g => g.sicuro ? g.ctx : null)(indovinaContesto(c.title, { ctx: ctxMadrePlaud() })) || ctxMadrePlaud();
function ctxMadrePlaud() {
  const p = ui.plaud;
  if (!p) return state.ctx;
  return p.ctxMadre || indovinaContesto([p.madre, ...(p.con || []), ...p.cose.filter(c => c.scelta).map(c => c.title)].join(' · '), { ctx: state.ctx }).ctx;
}
const _voceAnteprimaPlaudSn = voceAnteprimaPlaud;
voceAnteprimaPlaud = function (c) {
  const h = _voceAnteprimaPlaudSn(c), ctx = ctxPlaud(c);
  return h.replace('<div class="plaud-item-meta">', `<div class="plaud-item-meta"><button type="button" class="sn-chip sn-ctx" data-ctx="${ctx}" data-act="sn-pl-ctx" aria-label="${nomeCtx(ctx)}: tocca per cambiare"><i class="ti ${SN.ICO_CTX[ctx]}" aria-hidden="true"></i>${nomeCtx(ctx)}</button>`);
};
AZIONI['sn-pl-ctx'] = el => { const box = el.closest('.plaud-item[data-i]'); if (!box) return; const c = ui.plaud.cose.find(x => x.i === +box.dataset.i); if (c) cambiaVocePlaud(c.i, 'ctx', altroCtx(ctxPlaud(c))); };
const _importaRiunioneSn = importaRiunione;
importaRiunione = async function () {
  const p = ui.plaud;
  if (!p) return _importaRiunioneSn.apply(this, arguments);
  const madre = ctxMadrePlaud();
  ui._ctxTitoli = new Map(p.cose.filter(c => c.scelta).map(c => [c.title, ctxPlaud(c)]));
  try { return await conContesto(madre, () => _importaRiunioneSn.apply(this, arguments)); }
  finally { ui._ctxTitoli = null; }
};

// ══════════════════════════════════════════════════════════════
// 4 · CHIUDI LA SETTIMANA IN UNA SCHERMATA
// Le fatte le sa già l'app; le rimaste vanno alla prossima (Scegli data · Lascia stare); un solo
// «Cosa ti ha frenato?» per la settimana, salvato nei motivi come prima (conteggi e spinta).
// ══════════════════════════════════════════════════════════════
const FRENI = [
  { k: 'urgenze', l: 'Urgenze di altri', spinta: 'urgenze' }, { k: 'troppe', l: 'Troppe cose' },
  { k: 'stanchezza', l: 'Stanchezza', spinta: 'stanchezza' }, { k: 'persona', l: 'Una persona', spinta: 'persona' }, { k: 'altro', l: 'Altro…', spinta: 'altro' }];
// i motivi nuovi stanno anche nel passo dettagliato (prima di «Altro…»)
REV_MOTIVI.splice(REV_MOTIVI.findIndex(m => m.k === 'altro'), 0,
  { k: 'troppe', l: 'Troppe cose', frase: 'troppe cose insieme' }, { k: 'stanchezza', l: 'Stanchezza', frase: 'la stanchezza' }, { k: 'persona', l: 'Una persona', frase: 'una persona' });
const SCELTE_SN = [{ k: 'prossima', l: 'Prossima' }, { k: 'data', l: 'Scegli data' }, { k: 'lascia', l: 'Lascia stare' }];
const _openBpReviewSn = openBpReview;
openBpReview = function () {
  const r = _openBpReviewSn.apply(this, arguments);
  if (!state.bp || !ui.rev) return r;
  ui.rev = { ...ui.rev, snella: true, passo: 'snella', freni: new Set(), freniTesto: '' };
  disegnaReview();
  return r;
};
const _disegnaReviewSn = disegnaReview;
disegnaReview = function () {
  const r = ui.rev;
  if (r && r.snella && r.passo === 1) r.passo = 'snella';   // dopo «Riporta il foglio» (o una data mancante) si torna qui
  $('bprev-back').hidden = !!(r && r.passo === 'snella');
  if (r && r.passo === 'snella') return disegnaChiudiSnella();
  return _disegnaReviewSn.apply(this, arguments);
};
function anelloFatte(done, tot) {
  const R = 21, giro = 2 * Math.PI * R, pieno = tot ? done / tot : 0;
  return `<svg class="sn-anello" width="52" height="52" viewBox="0 0 52 52" role="img" aria-label="${done} su ${tot} fatte"><circle cx="26" cy="26" r="${R}" class="tr"/><circle cx="26" cy="26" r="${R}" class="ar" stroke-dasharray="${(giro * pieno).toFixed(1)} ${giro.toFixed(1)}" transform="rotate(-90 26 26)"/></svg>`;
}
function barraFuturo(q, sotto) {
  const sc = FUTURO_SCALA, st = statoFuturo(q.pct);
  return `<div class="sn-futuro" data-stato="${st}"><div class="sn-futuro-testa"><span><i class="ti ti-seeding" aria-hidden="true"></i>${sotto ? 'Tempo per il futuro' : 'Futuro'}</span><b class="mono">${q.pct}%</b></div>
    <div class="sn-futuro-bar" role="img" aria-label="${q.pct}% del tempo sulle Importanti, obiettivo 25–30%"><i style="width:${Math.min(100, q.pct / sc * 100)}%"></i><s style="left:${PRINC.FUTURO_MIN / sc * 100}%;width:${(PRINC.FUTURO_MAX - PRINC.FUTURO_MIN) / sc * 100}%"></s></div>
    <div class="sn-futuro-nota">${sotto || 'obiettivo 25–30%'}</div></div>`;
}
const quadratino = q => `<span class="sn-q q${q}" aria-hidden="true"></span>`;
function disegnaChiudiSnella() {
  const r = ui.rev, st = statRevConEventi(), aperti = revAperti();
  $('bprev-title').textContent = 'Com\'è andata';
  const tutteProssima = aperti.every(i => (r.scelte.get(i.id) || 'prossima') === 'prossima');
  const riga = i => {
    const c = bpCiclo(i), s = r.scelte.get(i.id) || 'prossima';
    return `<div class="sn-rimasta"><div class="sn-rim-tit">${quadratino(computeEffectiveQ(c))}<span>${escHtml(c.title)}</span></div>
      <div class="sn-seg" role="group" aria-label="Quando la rifai: ${esc(c.title)}">${SCELTE_SN.map(x => `<button type="button" data-act="rev-scelta" data-item="${i.id}" data-v="${x.k}" aria-pressed="${s === x.k}">${x.l}</button>`).join('')}</div>
      ${s === 'data' ? `<input type="date" class="input sn-data" data-act="rev-data" data-item="${i.id}" value="${r.date.get(i.id) || ''}" min="${oggiLocale()}" aria-label="Data per ${esc(c.title)}">` : ''}</div>`;
  };
  $('bprev-body').innerHTML = `<div class="sn-chiudi-testa">
      <div class="sn-fatte">${anelloFatte(st.done, st.tot)}<div><b class="mono">${st.done}/${st.tot}</b><span>fatte, lo so già</span></div></div>
      ${barraFuturo(quotaSettimana())}</div>
    ${aperti.length ? `<div class="sn-sez"><h4>${aperti.length === 1 ? 'L\'unica rimasta' : `Le ${aperti.length} rimaste`}</h4>${tutteProssima ? '<span>già sulla prossima settimana</span>' : ''}</div>
      <div class="sn-rimaste">${aperti.map(riga).join('')}</div>` : '<p class="sn-tutto"><i class="ti ti-confetti" aria-hidden="true"></i>Hai fatto tutto quello che avevi scelto.</p>'}
    <div class="sn-sez"><h4>Cosa ti ha frenato?</h4><span>facoltativo, una per tutta la settimana</span></div>
    <div class="chips chips-wrap sn-freni" role="group" aria-label="Cosa ti ha frenato">${FRENI.map(f => `<button type="button" class="chip" data-act="sn-freno" data-v="${f.k}" aria-pressed="${r.freni.has(f.k)}">${f.l}</button>`).join('')}</div>
    ${r.freni.has('altro') ? `<input type="text" class="input sn-freno-testo" id="sn-freno-testo" maxlength="120" value="${esc(r.freniTesto || '')}" placeholder="Cosa è successo? (facoltativo)" aria-label="Cosa ti ha frenato">` : ''}
    <details class="sn-nota"${state.bp.note ? ' open' : ''}><summary><i class="ti ti-chevron-right" aria-hidden="true"></i>Una nota per te</summary>
      <textarea class="input textarea" id="bprev-note" placeholder="Cosa ha funzionato, cosa cambieresti">${escHtml(state.bp.note || '')}</textarea></details>
    <p class="sn-link">Hai segnato qualcosa sul foglio di carta? <button type="button" class="link" data-act="sn-riporta">Riportalo</button> · <button type="button" class="link" data-act="sn-rev-dettagli">Più scelte</button></p>`;
  $('bprev-ok').textContent = 'Chiudi e prepara la prossima';
  $('bprev-ok').disabled = false;
}
function applicaFreni() {
  const r = ui.rev;
  if (!r || !r.freni || !r.freni.size) return;
  const scelti = FRENI.filter(f => r.freni.has(f.k)), testo = (r.freniTesto || '').trim();
  const motivo = scelti[0].k;
  revAperti().forEach(i => {
    if (r.motivi.has(i.id)) return;
    r.motivi.set(i.id, motivo);
    if (motivo === 'altro' && testo) r.altro.set(i.id, testo);
  });
  if (!r.spinta) r.spinta = { scelte: new Set(), testo: '' };
  scelti.filter(f => f.spinta).forEach(f => r.spinta.scelte.add(f.spinta));
  if (r.freni.has('altro') && testo) r.spinta.testo = testo;
}
const _revIndietroSn = AZIONI['rev-indietro'], _revAvantiSn = AZIONI['rev-avanti'];
Object.assign(AZIONI, {
  'rev-indietro': (...a) => {
    const r = ui.rev;
    if (r && r.snella && r.passo === 0) { r.passo = 'snella'; disegnaReview(); return; }
    if (r && r.passo === 'snella') { closeModal('bpRevOverlay'); return; }
    return _revIndietroSn(...a);
  },
  'rev-avanti': (...a) => {
    if (ui.rev && ui.rev.passo === 'snella') { applicaFreni(); return bpChiudiSettimana(); }
    return _revAvantiSn(...a);
  },
  'sn-freno': el => { const s = ui.rev.freni, k = el.dataset.v; s.has(k) ? s.delete(k) : s.add(k); const nota = $('bprev-note') && $('bprev-note').value; disegnaReview(); if ($('bprev-note') && nota != null) $('bprev-note').value = nota; if (k === 'altro' && s.has(k) && $('sn-freno-testo')) $('sn-freno-testo').focus(); },
  'sn-riporta': () => { ui.rev.passo = 0; disegnaReview(); },
  'sn-rev-dettagli': () => { ui.rev = { ...ui.rev, snella: false, passo: revAperti().length ? 1 : 2 }; disegnaReview(); }
});
document.addEventListener('input', e => { if (e.target.id === 'sn-freno-testo' && ui.rev) ui.rev.freniTesto = e.target.value; });
// «Scegli data»: il calendario si apre da solo
const _revSceltaSn = AZIONI['rev-scelta'];
AZIONI['rev-scelta'] = (el, ...a) => {
  const nota = $('bprev-note') ? $('bprev-note').value : null;
  _revSceltaSn(el, ...a);
  if (nota != null && $('bprev-note')) $('bprev-note').value = nota;
  if (el.dataset.v !== 'data') return;
  const d = document.querySelector(`#bprev-body input[data-act="rev-data"][data-item="${el.dataset.item}"]`);
  if (d) { d.focus(); try { d.showPicker && d.showPicker(); } catch (_) {} }
};

