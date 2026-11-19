// v31 · 04/11 — «Carta di precisione» (fase 1) e via la scheda del coach
// · «Per il coach» non c'è più né in Oggi né in Pianifica: mandare il piano a Leo è una cosa
//   ricorrente come le altre (venerdì pomeriggio). Il bottone «Invia al coach» resta.
// · Oggi si apre col riquadro «Adesso»: cosa c'è ora e fino a quando, il conto alla rovescia,
//   cosa viene dopo e il primo spazio libero; sotto, «Adesso tocca a…» (mattina, sera).
//   Poi la giornata dalle 8 alle 18 (pieno/libero) e gli obiettivi della settimana.
// · Menu: Settimana → Pianifica, Cicli → Tutte.
// ══════════════════════════════════════════════════════════════
cardCoach = () => '';
v22RigaCoach = () => '';

const V31 = { DALLE: 8 * 60, ALLE: 18 * 60, BUCO_MIN: 15 };
const v31Hm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const v31Conto = m => m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : `${m}'`;
const v31Durata = m => m >= 60 ? (m % 60 ? `${Math.floor(m / 60)}h ${m % 60}'` : `${m / 60}h`) : `${m}'`;
const v31Ora = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };

// gli impegni di un giorno: appuntamenti con l'ora + cose in programma a un'ora precisa (non fatte)
function v31Impegni(d) {
  const lista = eventiDelGiorno(d).filter(e => e.ora && !eGiornata(e)).map(e => {
    const a = minDi(e.ora), b = e.fine && minDi(e.fine) > a ? minDi(e.fine) : a + (e.minuti || 60);
    return { a, b, t: e.titolo || '(senza titolo)' };
  });
  righeGiornoData(d).forEach(r => {
    if (!r.ora || r.fatto || !r.c) return;
    const a = minDi(r.ora);
    if (lista.some(x => x.a === a)) return;   // già nel calendario (la cosa pianificata ha il suo evento)
    lista.push({ a, b: a + (r.durata || BP_DURATA_DEFAULT), t: r.c.title });
  });
  return lista.sort((p, q) => p.a - q.a || q.b - p.b);
}
// minuti occupati dalle 8 alle 18 (le sovrapposizioni contano una volta)
function v31Pieni(imp) {
  const tagli = imp.map(x => [Math.max(x.a, V31.DALLE), Math.min(x.b, V31.ALLE)]).filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
  const uniti = [];
  tagli.forEach(([a, b]) => { const u = uniti[uniti.length - 1]; if (u && a <= u[1]) u[1] = Math.max(u[1], b); else uniti.push([a, b]); });
  return uniti;
}
function v31PrimoBuco(uniti, da) {
  let t = Math.max(da, V31.DALLE);
  for (const [a, b] of uniti) {
    if (b <= t) continue;
    if (a - t >= V31.BUCO_MIN) return [t, a];
    t = Math.max(t, b);
  }
  return V31.ALLE - t >= V31.BUCO_MIN ? [t, V31.ALLE] : null;
}

function v31Ritmo() {
  if (!v26RitmoAcceso()) return '';
  const m = v25Momento();
  if (!m || sessionStorage.getItem(V25.RITMO_CHIUSO) === m.k + toISODate(new Date())) return '';
  const btn = m.act === 'v21-stampa-oggi' ? `<button type="button" class="btn" data-act="v21-stampa-giorno" data-i="${giornoIdxDi(oggiData())}" data-oggi="1"><i class="ti ti-printer"></i>${escHtml(m.btn)}</button>`
    : m.act === 'tab-tutto' ? `<button type="button" class="btn" data-tab="tutto">${escHtml(m.btn)}</button>`
    : m.act ? `<button type="button" class="btn" data-act="${m.act}">${escHtml(m.btn)}</button>` : '';
  return `<div class="v31-ad-ritmo"><span><b>${escHtml(m.t)}</b>${escHtml(m.s || '')}</span>${btn}<button type="button" class="btn btn-icon" data-act="v25-ritmo-chiudi" data-k="${m.k}" aria-label="Chiudi per oggi"><i class="ti ti-x"></i></button></div>`;
}

function v31Adesso() {
  const d = oggiData(), nm = v31Ora(), imp = v31Impegni(d), uniti = v31Pieni(imp);
  const ora = imp.filter(x => x.a <= nm && nm < x.b).sort((p, q) => q.a - p.a)[0];
  const dopo = imp.find(x => x.a > nm && x !== ora);
  let k, t, conto = '', perc = null, poi = '';
  if (ora) {
    k = `Adesso · fino alle ${v31Hm(ora.b)}`;
    t = ora.t;
    conto = `${v31Conto(ora.b - nm)}<small>MANCANO</small>`;
    perc = Math.max(2, Math.min(100, Math.round((nm - ora.a) / Math.max(1, ora.b - ora.a) * 100)));
    const buco = v31PrimoBuco(uniti, ora.b);
    const pezzi = [];
    if (dopo) pezzi.push([dopo.a, `poi <b>${v31Hm(dopo.a)} ${escHtml(dopo.t)}</b>`]);
    if (buco) pezzi.push([buco[0], `libero <b>${v31Hm(buco[0])}–${v31Hm(buco[1])}</b>`]);
    poi = pezzi.sort((p, q) => p[0] - q[0]).map(x => x[1]).join(' · ').replace(/^./, c => c.toUpperCase());   // in ordine di ora
  } else if (dopo && dopo.a < 24 * 60) {
    k = 'Adesso · tempo libero';
    t = `Libero fino alle ${v31Hm(dopo.a)}`;
    conto = `${v31Conto(dopo.a - nm)}<small>MANCANO</small>`;
    poi = `Poi <b>${v31Hm(dopo.a)} ${escHtml(dopo.t)}</b>`;
  } else {
    k = 'Adesso';
    t = nm < V31.ALLE ? 'Niente appuntamenti per il resto della giornata' : 'La giornata di lavoro è finita';
  }
  return `<section class="v31-adesso" aria-label="Adesso">
    <div class="v31-ad-testa"><div><p class="v31-ad-k">${escHtml(k)}</p><p class="v31-ad-t">${escHtml(t)}</p></div>${conto ? `<span class="v31-ad-c">${conto}</span>` : ''}</div>
    ${perc !== null ? `<div class="v31-tacche" role="img" aria-label="Passato il ${perc}%"><span style="width:${perc}%"></span></div>` : ''}
    ${poi ? `<p class="v31-ad-poi">${poi}</p>` : ''}
    ${v31Ritmo()}</section>`;
}

function v31Giornata() {
  const d = oggiData(), g = d.getDay();
  if (g === 0 || g === 6) return '';
  const uniti = v31Pieni(v31Impegni(d)), tot = V31.ALLE - V31.DALLE;
  const pieni = uniti.reduce((s, [a, b]) => s + b - a, 0), nm = v31Ora();
  const pc = m => ((m - V31.DALLE) / tot * 100).toFixed(2);
  const barre = uniti.map(([a, b]) => `<i style="left:${pc(a)}%;width:${((b - a) / tot * 100).toFixed(2)}%"></i>`).join('');
  const segno = nm > V31.DALLE && nm < V31.ALLE ? `<u style="left:${pc(nm)}%"></u>` : '';
  return `<section class="v31-giornata" aria-label="La giornata dalle 8 alle 18">
    <div class="v31-g-h"><span>La giornata</span><span class="mono">impegni ${pieni ? v31Durata(pieni) : '0'} · <b>libere ${v31Durata(tot - pieni)}</b></span></div>
    <div class="v31-g-barra" aria-hidden="true">${barre}${segno}</div>
    <div class="v31-g-assi" aria-hidden="true"><span>8</span><span>10</span><span>12</span><span>14</span><span>16</span><span>18</span></div></section>`;
}

function v31Obiettivi() {
  if (!state.obiettiviDb && state.obiettiviDb !== undefined) return '';
  const c = bpSettimanaCorrente(), voci = v26ObDi(c.week, c.year), fatti = voci.filter(v => v.fatto).length;
  const corrente = eSettimanaCorrente();
  const act = !voci.length && corrente ? 'data-act="v26-ob-modifica"' : 'data-tab="pianifica"';
  const sotto = voci.length ? `${fatti} di ${voci.length} fatti` : 'ancora da scrivere · bastano 2 minuti';
  return `<button type="button" class="v31-ob" ${act}><i class="ti ti-target-arrow" aria-hidden="true"></i><span><b>Obiettivi della settimana</b>${sotto}</span><i class="ti ti-chevron-right" aria-hidden="true"></i></button>`;
}

// «Adesso» prende il posto del vecchio riquadro «Adesso tocca a…» e ne porta dentro il suggerimento
v25RitmoCard = function () { return v31Adesso() + v31Giornata() + v31Obiettivi(); };
const _vistaOggiV31 = vistaOggi;
vistaOggi = function () {
  let h = _vistaOggiV31.apply(this, arguments);
  try {
    if (modoSemplice()) return h;
    const tpl = document.createElement('template'); tpl.innerHTML = h;
    const f = tpl.content, vh = f.querySelector('.vh');
    const pezzi = ['.v31-adesso', '.v31-giornata', '.v31-ob'].map(s => f.querySelector(s)).filter(Boolean);
    if (vh && pezzi.length) { let dopo = vh; pezzi.forEach(p => { dopo.after(p); dopo = p; }); }
    const box = document.createElement('div'); box.appendChild(f); h = box.innerHTML;
  } catch (e) { console.warn('[v31] oggi:', e.message); }
  return h;
};
// ogni minuto: si aggiornano solo «Adesso» e la giornata (niente ridisegno completo)
setInterval(() => {
  try {
    if (ui.tab !== 'oggi' || document.hidden) return;
    const a = document.querySelector('.v31-adesso'), g = document.querySelector('.v31-giornata');
    if (a && !a.contains(document.activeElement)) a.outerHTML = v31Adesso();
    if (g) g.outerHTML = v31Giornata() || '<span hidden></span>';
  } catch (e) { console.warn('[v31] minuto:', e.message); }
}, 60000);


// ══════════════════════════════════════════════════════════════
