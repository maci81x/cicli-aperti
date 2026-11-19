// v8 · «RICORDAMI» A VOCE: la frase diventa titolo, giorno, ora, tipo e delega (in locale, senza AI)
// ══════════════════════════════════════════════════════════════
const FRASE = {
  GIORNI: ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'],
  MESI: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  NUMERI: { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, quindici: 15, venti: 20, trenta: 30 },
  MINUTI: { mezza: 30, mezzo: 30, 'un quarto': 15, quarto: 15, 'tre quarti': 45 },
  POMERIGGIO_FINO: 6,        // senza «mattina/pomeriggio/sera»: dall'1 alle 6 = pomeriggio, dalle 7 alle 12 = mattina
  CONTROLLO_GIORNI: 2,       // una delega senza data si controlla tra 2 giorni (come il foglio Delega)
  PAROLE_NON_NOMI: ['mia', 'mio', 'lui', 'lei', 'tutti', 'qualcuno', 'loro', 'chi', 'me', 'te'],
  // dopo «il 26» queste parole lasciano il numero una data; un'altra parola (un nome di cosa: «il 2 pacchi») no
  DOPO_DATA: ['a', 'ad', 'al', 'alle', 'all', 'ore', 'e', 'ed', 'o', 'entro', 'per', 'di', 'del', 'della', 'da', 'dalle', 'con', 'che', 'ma', 'poi', 'devo', 'dobbiamo', 'bisogna', 'ricordami',
    'mattina', 'mattino', 'pomeriggio', 'sera', 'prossimo', 'prossima', 'mese', 'sì', 'si', 'no']
};
// Dopo il numero c'è «un nome di cosa» contato? («il 2 pacchi», «il 3 bottiglie»: è una quantità, non un giorno).
// Si guarda il plurale: finisce in -i, o in -e ma non come i singolari «riunione», «cliente», «fattore».
// Non sono cose: i nomi di persona (maiuscola), i verbi all'infinito, le parole di FRASE.DOPO_DATA, un'ora o una data tolta (¦).
const VERBO_INFINITO = /(?:are|ere|ire|arsi|ersi|irsi|urre|orre|arre)$/i;
const SINGOLARE_IN_E = /(?:ione|ore|ente|ante|ale|ile|ice|ese|ere|one)$/i;
const TOLTO = '¦';
function seguitoDaCosa(dopo) {
  const m = /^\s*([A-Za-zÀ-ÿ']+)/.exec(dopo || '');
  if (!m || /^[A-ZÀ-Ý]/.test(m[1])) return false;
  const w = senzaAccenti(m[1].replace(/'$/, ''));
  if (FRASE.DOPO_DATA.includes(w) || VERBO_INFINITO.test(w) || FRASE.GIORNI.includes(w)) return false;
  return /i$/.test(w) || (/e$/.test(w) && !SINGOLARE_IN_E.test(w));
}
const senzaAccenti = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const FINE_PAROLA = '(?![A-Za-z0-9À-ÿ])';   // \b non vede «ì» come lettera
const RE_GIORNO = '(luned[iìí]|marted[iìí]|mercoled[iìí]|gioved[iìí]|venerd[iìí]|sabato|domenica)';
const RE_PRIMA = '(?:\\b(?:entro|per|da|di)\\s+)?(?:\\b(?:il|lo|la|l\')\\s*)?';
const RE_NUM = '(\\d{1,2}|' + Object.keys(FRASE.NUMERI).join('|') + ')';
const numeroDa = t => /^\d+$/.test(t) ? parseInt(t, 10) : FRASE.NUMERI[senzaAccenti(t)] || null;
const piuGiorni = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const lunediDopo = d => piuGiorni(d, 7 - giornoIdxDi(d));
function dataValida(g, m, a, oggi) {
  const anno = a ? (a < 100 ? 2000 + a : a) : oggi.getFullYear();
  const d = new Date(anno, m - 1, g);
  if (d.getMonth() !== m - 1 || d.getDate() !== g) return null;
  if (!a && toISODate(d) < toISODate(oggi)) d.setFullYear(anno + 1);   // «il 5 gennaio» detto a ottobre = l'anno prossimo
  return d;
}
// «il 26» senza mese: questo mese se non è ancora passato, altrimenti il prossimo
function giornoDelMese(n, oggi) {
  if (n < 1 || n > 31) return null;
  const mese = n >= oggi.getDate() ? oggi.getMonth() : oggi.getMonth() + 1;
  const d = new Date(oggi.getFullYear(), mese, n);
  return d.getDate() === n ? d : null;
}
function oraDa(h, m, dopo) {
  let ore = parseInt(h, 10);
  const minuti = m == null ? 0 : /^\d+$/.test(m) ? parseInt(m, 10) : FRASE.MINUTI[m.toLowerCase()] || 0;
  const q = senzaAccenti(dopo);
  if (/pomeriggio|sera|notte/.test(q) && ore < 12) ore += 12;
  else if (!q && ore >= 1 && ore <= FRASE.POMERIGGIO_FINO) ore += 12;
  if (ore > 23 || minuti > 59) return null;
  return `${String(ore).padStart(2, '0')}:${String(minuti).padStart(2, '0')}`;
}
function trovaPersona(nome) {
  const n = senzaAccenti(nome);
  if (!n) return null;
  const ps = state.persone || [];
  return ps.find(p => senzaAccenti(p.nome) === n)
    || ps.find(p => senzaAccenti(p.nome).split(/\s+/).includes(n))
    || null;
}

// Restituisce { title, data: 'YYYY-MM-DD' | null, ora: 'HH:MM' | null, q: 1 | 2 | 3, delega: { id, nome } | null }.
// `oggi` serve alle prove e alle riunioni: le date relative partono da lì.
function interpretaFrase(testo, oggi = new Date()) {
  const base = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  let resto = ` ${String(testo || '').replace(/\s+/g, ' ').trim()} `;
  let data = null, ora = null, q = 2, delega = null, giornoDetto = null;
  // «pomeriggio», «sera», «stasera» detti altrove nella frase valgono per l'ora («domani pomeriggio alle 4» = 16:00)
  const momento = /\b(?:pomeriggio|sera|stasera|stanotte)\b/i.test(testo || '') ? 'pomeriggio' : /\b(?:mattina|mattino|stamattina|stamani|domattina)\b/i.test(testo || '') ? 'mattina' : '';
  // toglie dal testo la prima corrispondenza accettata da `fn` (se `fn` scarta la prima, prova le successive:
  // in «comprare il 2 pacchi il 27» la data è «il 27»)
  const togli = (re, fn) => {
    const g = new RegExp(re, 'gi');
    for (let m = g.exec(resto); m; m = g.exec(resto)) {
      if (fn(m) !== false) { resto = resto.slice(0, m.index) + ` ${TOLTO} ` + resto.slice(m.index + m[0].length); return true; }
      if (!m[0].length) g.lastIndex++;
    }
    return false;
  };
  togli('\\b(?:ricordami|ricordarmi|ricorda(?:ti)?|promemoria)\\b\\s*:?', () => {});
  togli('\\b(?:subito|urgente(?:mente)?|con urgenza)\\b', () => { q = 1; });
  // l'ora prima delle date: «alle 15.30» non è il 15 marzo
  togli("\\b(?:alle|ore|per le|verso le|dalle)\\s+(?:ore\\s+)?(\\d{1,2})(?:[:.](\\d{2}))?(?:\\s+e\\s+(mezza|mezzo|un quarto|tre quarti|\\d{1,2}))?(?:\\s+(di mattina|del mattino|di pomeriggio|del pomeriggio|di sera|della sera))?\\b",
    m => { const o = oraDa(m[1], m[2] != null ? m[2] : m[3], m[4] || momento); if (!o) return false; ora = o; })
    || togli("\\ball'una(?:\\s+e\\s+(mezza|un quarto|tre quarti))?\\b", m => { ora = oraDa('13', m[1], 'pomeriggio'); })
    || togli('\\b(\\d{1,2}):(\\d{2})\\b', m => { const o = oraDa(m[1], m[2], 'mattina'); if (!o) return false; ora = o; });
  const metti = d => { if (!data && d) data = toISODate(d); return !!d; };
  // giorno della settimana con la data: «lunedì 26», «venerdì 30 ottobre», «giovedì 29/10». Vale la data;
  // se il giorno non torna («lunedì 27» quando il 27 è martedì) il riepilogo dice «controlla il giorno»
  togli(RE_PRIMA + RE_GIORNO + '\\s+(\\d{1,2})(?:°)?(?:(?:[/\\-](\\d{1,2})(?:[/\\-](\\d{2,4}))?)|(?:\\s+(' + FRASE.MESI.join('|') + ')(?:\\s+(\\d{4}))?))?(?![\\d:.])', m => {
    const n = +m[2], mese = m[3] ? +m[3] : m[5] ? FRASE.MESI.indexOf(m[5].toLowerCase()) + 1 : null, anno = m[4] ? +m[4] : m[6] ? +m[6] : null;
    if (!mese && seguitoDaCosa(resto.slice(m.index + m[0].length))) return false;   // «venerdì 2 pacchi»: il 2 non è il giorno
    const d = mese ? dataValida(n, mese, anno, base) : giornoDelMese(n, base);
    if (!d) return false;
    giornoDetto = FRASE.GIORNI.indexOf(senzaAccenti(m[1]));
    return metti(d);
  });
  togli(RE_PRIMA + '(\\d{1,2})(?:°)?\\s+(' + FRASE.MESI.join('|') + ')(?:\\s+(\\d{4}))?\\b', m => metti(dataValida(+m[1], FRASE.MESI.indexOf(m[2].toLowerCase()) + 1, m[3] ? +m[3] : null, base)));
  togli(RE_PRIMA + '\\b(\\d{1,2})[/\\-](\\d{1,2})(?:[/\\-](\\d{2,4}))?\\b', m => metti(dataValida(+m[1], +m[2], m[3] ? +m[3] : null, base)));
  togli(RE_PRIMA + '\\b(?:settimana\\s+prossima|prossima\\s+settimana)\\b', () => metti(lunediDopo(base)));
  togli(RE_PRIMA + '\\bdopodomani\\b', () => metti(piuGiorni(base, 2)));
  togli(RE_PRIMA + '\\b(?:domani(?:\\s+(?:mattina|pomeriggio|sera))?|domattina)\\b', () => metti(piuGiorni(base, 1)));
  togli(RE_PRIMA + '\\b(?:oggi(?:\\s+pomeriggio)?|stasera|stamattina|stamani)\\b', () => metti(base));
  togli('\\b(?:tra|fra)\\s+' + RE_NUM + '\\s+(giorni|giorno|settimane|settimana|mesi|mese)\\b', m => {
    const n = numeroDa(m[1]);
    if (!n) return false;
    const u = senzaAccenti(m[2]);
    if (u.startsWith('mes')) { const d = new Date(base); d.setMonth(d.getMonth() + n); return metti(d); }
    return metti(piuGiorni(base, u.startsWith('settiman') ? n * 7 : n));
  });
  // «il 26», «entro il 3», «per il 5», «dal 3»: il giorno del mese, ma non «il 2 pacchi»
  togli('(?:\\b(?:entro|per|da)\\s+)?\\b(?:il|l\'|dal|dall\')\\s*(\\d{1,2})(?:°)?(?![\\d/:.\\-])', m => {
    if (seguitoDaCosa(resto.slice(m.index + m[0].length))) return false;
    return metti(giornoDelMese(+m[1], base));
  });
  // «lunedì» e «il prossimo lunedì» = il primo lunedì dopo oggi; «lunedì prossimo» = il lunedì della settimana dopo
  togli(RE_PRIMA + '(?:prossim[oa]\\s+)?' + RE_GIORNO + '(?:\\s+(prossim[oa]))?' + FINE_PAROLA, m => {
    const idx = FRASE.GIORNI.indexOf(senzaAccenti(m[1]));
    if (m[2]) return metti(piuGiorni(lunediDopo(base), idx)) || true;
    const avanti = (idx - giornoIdxDi(base) + 7) % 7 || 7;
    return metti(piuGiorni(base, avanti)) || true;
  });
  // delega: «chiedi a Raia …», «delega a Simone …» (persona nota, o un nome con la maiuscola: diventa una persona nuova)
  const md = new RegExp("\\b(?:chiedi|chiedere|chiedo|delega|delegare|deleghi|fai fare|far fare)\\s+(?:a|ad)\\s+([A-Za-zÀ-ÿ']+)(?:\\s+([A-Za-zÀ-ÿ']+))?", 'i').exec(resto);
  if (md) {
    const due = md[2] ? trovaPersona(`${md[1]} ${md[2]}`) : null;
    const p = due || trovaPersona(md[1]);
    const nuova = !p && /^[A-ZÀ-Ý]/.test(md[1]) && !FRASE.PAROLE_NON_NOMI.includes(senzaAccenti(md[1]));
    if (p || nuova) {
      delega = p ? { id: p.id, nome: p.nome } : { id: null, nome: md[1] };
      const lungo = due || !md[2] ? md[0].length : md[0].length - md[2].length;   // la seconda parola resta nel titolo
      resto = resto.slice(0, md.index) + ' ' + resto.slice(md.index + lungo);
    }
  }
  // il resto è il titolo
  let t = resto.split(TOLTO).join(' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  const testa = /^(?:di|che|devo|dovrei|bisogna|da|e|,|:|-)\s+/i;
  for (let i = 0; i < 4 && testa.test(t + ' '); i++) t = (t + ' ').replace(testa, '').trim();
  if (delega) t = t.replace(/^(?:il|lo|la|i|gli|le|l')\s*(?=\S)/i, '');
  t = t.replace(/^[\s,;:.\-–—]+|[\s,;:\-–—]+$/g, '').replace(/\s+(?:entro|per|alle|e|di)$/i, '').trim();
  if (!t) t = String(testo || '').trim();
  const title = t.charAt(0).toUpperCase() + t.slice(1);
  const controllaGiorno = giornoDetto != null && giornoDetto >= 0 && !!data && giornoIdxDi(parseISODate(data)) !== giornoDetto;
  return { title, data, ora, q: delega ? 3 : q, delega, controllaGiorno };
}

// «ven 23/10»
const fmtGiornoCorto = iso => { const d = parseISODate(iso); return d ? `${['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'][d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : ''; };
const escAttr = s => escHtml(s).replace(/"/g, '&quot;');
function sintesiVoce(v) {
  const quando = v.data ? `${fmtGiornoCorto(v.data)}${v.ora ? ' ' + v.ora : v.fascia ? ' · ' + v.fascia : ''}` : v.ora ? `oggi ${v.ora}` : 'Tutto, senza data';
  if (v.q === 3 && v.delega) return [v.title, `Delega a ${v.delega.nome}${v.delega.id ? '' : ' (nuova persona)'}`, `controlli ${v.data ? fmtGiornoCorto(v.data) + (v.controllaGiorno ? ' (controlla il giorno)' : '') : 'tra ' + FRASE.CONTROLLO_GIORNI + ' giorni'}`].join(' · ');
  return [v.title, quando + (v.controllaGiorno ? ' (controlla il giorno)' : ''), TIPI[v.q].label].join(' · ');
}
