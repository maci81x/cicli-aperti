// v2 · LE RIGHE DI UN GIORNO (piano della settimana + agenda)
// ══════════════════════════════════════════════════════════════
function fasciaDi(fascia, ora) {
  if (fascia && FASCE_MAP[fascia]) return fascia;
  if (ora) { const h = parseInt(ora.slice(0, 2), 10); return h < FASCIA_ORE.mattina ? 'mattina' : h < FASCIA_ORE.pomeriggio ? 'pomeriggio' : 'sera'; }
  return 'mattina';
}
function oraDi(c) { return formatOra(c.ora_inizio || c.scheduled_time) || null; }
function itemDelPiano(cicloId) { return state.bpItems.find(i => i.ciclo_id === cicloId) || null; }

// Una cosa già chiusa resta in vista solo nel giorno in cui era in programma.
function fattaVisibile(c, slot) {
  if (!c.done) return true;
  if (slot.overridden) return true;
  // 22/10 · una copia già chiusa di una cosa che si ripete è «fatta» solo nella sua settimana, non in quelle dopo
  if (c.pianificato_data && ripetizioneDi(c) !== 'nessuna') { const w = isoWeekParts(parseISODate(c.pianificato_data)); return w.week === state.week && w.year === state.year; }
  if (c.pianificato_data) return true;
  const upd = c.updated_at ? new Date(c.updated_at) : null;
  if (!upd) return false;
  const w = isoWeekParts(upd);
  return w.week === state.week && w.year === state.year;
}

// Righe del giorno `gk` (o 'settimana' = senza giorno) nella settimana selezionata.
// Il piano della settimana vince; poi quello che l'agenda mette in quel giorno.
function righeGiorno(gk) {
  const out = new Map();
  if (state.bp) {
    bpItemsValidi().filter(i => i.giorno === gk).forEach(i => {
      const c = bpCiclo(i);
      if (!vedi(c.ctx) || isParcheggiato(c)) return;
      const ora = bpOra(i) || oraDi(c);
      out.set(c.id, { c, item: i, fascia: fasciaDi(i.fascia, ora), conFascia: !!(i.fascia || ora), haFascia: !!i.fascia, ora, durata: bpDurata(i), fatto: !!i.completato || !!c.done });
    });
  }
  if (gk !== 'settimana') {
    state.cicli.forEach(c => {
      if (!vedi(c.ctx) || isParcheggiato(c) || isGiornaliero(c) || out.has(c.id)) return;
      if (state.bp && itemDelPiano(c.id)) return;
      const slot = agendaSlotForWeek(c, state.week, state.year);
      if (slot.giorno !== gk || !fattaVisibile(c, slot)) return;
      const ora = oraDi(c);
      out.set(c.id, { c, item: null, fascia: fasciaDi(slot.fascia, ora), conFascia: !!(slot.fascia || ora), haFascia: !!slot.fascia, ora, durata: c.durata_minuti || null, fatto: !!c.done });
    });
  }
  const ordine = { mattina: 0, pomeriggio: 1, sera: 2 };
  return [...out.values()].sort((a, b) => (ordine[a.fascia] - ordine[b.fascia]) || (a.ora || '99').localeCompare(b.ora || '99') || String(a.c.title).localeCompare(String(b.c.title)));
}

// v51 · 23/11 · negli elenchi dei giorni e nei fogli da stampare le cose già chiuse non compaiono:
// restano solo nel conteggio «N fatte» in testa al giorno (Roby: «se è già flaggata come fatta, perché è ancora nell'elenco?»).
function righeDaFare(gk) { return righeGiorno(gk).filter(r => !r.fatto); }
function fatteDelGiorno(gk) { return righeGiorno(gk).filter(r => r.fatto).length; }
function etichettaFatte(n, breve) {
  if (!n) return '';
  const t = `${n} ${n === 1 ? 'fatta' : 'fatte'}`;
  return `<span class="v51-fatte" data-tip="${t}: chiuse in questo giorno" aria-label="${t}"><i class="ti ti-check" aria-hidden="true"></i>${breve ? `<span class="mono" aria-hidden="true">${n}</span>` : t}</span>`;
}

function dataDelGiorno(idx) { return bpDataGiorno(state.week, state.year, idx); }
const giornoPassato = d => toISODate(d) < oggiLocale();
// righe della settimana chiusa: si guardano, non si toccano
const opzRighe = d => ({ data: toISODate(d), passato: giornoPassato(d), solaLettura: !!state.bp && state.bp.stato === 'chiuso' });

// Le righe di un giorno, in un'unica sequenza per ora: appuntamenti di Google Calendar (sola lettura),
// cuscinetti e cose con un'ora. Sotto, le cose senza ora: per fascia se almeno una ne ha una, altrimenti in fila.
// `d` (data del giorno) aggiunge appuntamenti e cuscinetti; senza, solo le cose.
function htmlGiorno(righe, opz, d) {
  const { conOra, senzaOra } = sequenzaGiorno(righe, d);
  const sequenza = conOra.length ? `<div class="group">${conOra.map(x => x.tipo === 'evento' ? rigaEvento(x.e) : x.tipo === 'cuscinetto' ? rigaCuscinetto(x.item, opz) : riga(x.r, opz)).join('')}</div>` : '';
  if (!senzaOra.length) return sequenza;
  const titolo = conOra.length ? '<p class="list-head"><span>Senza ora</span></p>' : '';
  if (!senzaOra.some(r => r.haFascia)) return sequenza + titolo + `<div class="group">${senzaOra.map(r => riga(r, opz)).join('')}</div>`;
  return sequenza + htmlFasce(senzaOra, opz);
}

function htmlFasce(righe, opz) {
  return FASCE.map(f => {
    const rs = righe.filter(r => r.fascia === f.key);
    if (!rs.length) return '';
    return `<p class="list-head"><span>${f.label}</span></p><div class="group">${rs.map(r => riga(r, opz)).join('')}</div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════
