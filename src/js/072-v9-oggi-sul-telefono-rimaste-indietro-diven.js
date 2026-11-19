// v9 · OGGI SUL TELEFONO: «Rimaste indietro» diventa una riga «N indietro · Sistema»
// che apre il riordino delle rimaste, una alla volta (le scelte sono quelle del blocco di prima).
// ══════════════════════════════════════════════════════════════
const schermoStretto = () => window.innerWidth < 768;
const OGGI_TEL = { SUBITO: 2 };
ui.subitoTutte = false;
AZIONI['subito-tutte'] = () => { ui.subitoTutte = true; render(); };
const _bloccoRimasteV9 = bloccoRimaste;
bloccoRimaste = function () {
  if (ui.tab !== 'oggi' || !schermoStretto()) return _bloccoRimasteV9();
  const n = rimasteVisibili().length;
  if (!n || carryNascosto()) return '';
  return `<div class="group rimaste-riga"><button type="button" class="riga-link" data-act="rimaste-sistema"><i class="ti ti-clock-exclamation"></i><span><b class="mono">${n}</b> indietro · <b>Sistema</b></span><span></span><i class="ti ti-chevron-right"></i></button></div>`;
};
function apriRiordinaRimaste() {
  ui.rio = { rimaste: true, ids: rimasteVisibili().map(r => r.item.id), i: 0, conta: {}, saltate: [], scelta: null, giorni: false };
  $('riordinaOverlay').classList.add('open');
  rimasteAvanti(0);
}
const recRimasta = itemId => rimasteVisibili().find(r => r.item.id === itemId) || null;
function rimasteAvanti(passo) {
  const r = ui.rio;
  r.i += passo;
  while (r.i < r.ids.length && !recRimasta(r.ids[r.i])) r.i++;
  r.giorni = false;
  disegnaRiordina();
}
const _rioSalvaV9 = rioSalva;
rioSalva = function () { if (ui.rio && ui.rio.rimaste) return; _rioSalvaV9(); };   // il giro delle rimaste non si riprende
const _disegnaRiordinaV9 = disegnaRiordina;
disegnaRiordina = function () {
  const r = ui.rio;
  if (!r || !r.rimaste) return _disegnaRiordinaV9();
  const tot = r.ids.length, corpo = $('rio-corpo');
  const testa = `<div class="rio-testa"><button type="button" class="btn btn-ghost btn-sm" data-act="rio-chiudi"><i class="ti ti-x"></i>Chiudi</button>
    <h2 id="rio-titolo">Rimaste indietro</h2><span class="mono rio-conto" aria-live="polite">${Math.min(r.i + 1, tot)} / ${tot}</span></div>
    <div class="bar" role="progressbar" aria-label="Sistemate" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${r.i}"><i style="width:${tot ? Math.round(r.i / tot * 100) : 100}%"></i></div>`;
  const rec = r.i < tot ? recRimasta(r.ids[r.i]) : null;
  if (!rec) {
    const fatte = Object.values(r.conta).reduce((t, n) => t + n, 0);
    corpo.innerHTML = testa + `<div class="rio-fine">${vuoto('ti-circle-check', fatte ? `Sistemate ${fatte}` : 'Niente di rimasto indietro', 'Le trovi al loro posto, in Oggi e in Pianifica.', '<div class="rio-fine-tasti"><button type="button" class="btn btn-primary btn-sm" data-act="rio-chiudi">Chiudi</button></div>')}</div>`;
    return;
  }
  const { item, plan } = rec, c = ciclo(item.ciclo_id), d = carryData(item, plan), q = computeEffectiveQ(c);
  const era = d ? `era ${d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' })}` : `era nella settimana del ${fmtCorta(getWeekStart(plan.settimana, plan.anno))}`;
  const cur = bpSettimanaCorrente();
  const tasto = (v, ico, l, s, extra) => `<button type="button" class="rio-tasto t-q${q}" data-act="rim-sposta" data-v="${v}"${extra || ''}><i class="ti ${ico}"></i><b>${l}</b>${s ? `<small>${s}</small>` : ''}</button>`;
  const giorni = r.giorni ? `<div class="gchips rim-giorni" role="group" aria-label="Giorno di questa settimana">${GIORNI.map((g, idx) => {
      const dd = bpDataGiorno(cur.week, cur.year, idx);
      return `<button type="button" class="gchip" data-act="rim-sposta" data-v="giorno" data-g="${idx}" aria-label="${g.label} ${dd.getDate()}"${giornoPassato(dd) ? ' disabled' : ''}>${g.label.slice(0, 1)}</button>`;
    }).join('')}</div>` : '';
  corpo.innerHTML = testa + `<article class="rio-carta p-q${q}">
      <p class="rio-meta"><span class="ritardo">${era}</span><span>${TIPI[q].label}</span></p>
      <h3 class="rio-cosa">${escHtml(c.title)}</h3>
      ${c.note ? `<p class="rio-nota">${escHtml(c.note)}</p>` : ''}
    </article>
    <div class="rio-tasti">${tasto('oggi', 'ti-sun', 'Oggi')}${tasto('domani', 'ti-arrow-right', 'Domani')}${tasto('scegli', 'ti-calendar', 'Scegli giorno', 'questa settimana', ` aria-expanded="${r.giorni}"`)}${tasto('prossima', 'ti-calendar-week', 'Prossima settimana')}</div>
    ${giorni}
    <div class="rio-altro"><button type="button" class="btn btn-secondary btn-sm" data-act="rim-fatta"><i class="ti ti-check"></i>È fatta</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="rim-sposta" data-v="lascia"><i class="ti ti-wind"></i>Lascia stare</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="rim-salta">Salta<i class="ti ti-arrow-right"></i></button></div>
    ${tot - r.i > 1 ? `<div class="rio-altro"><button type="button" class="btn btn-ghost btn-sm" data-act="rim-tutte"><i class="ti ti-sun"></i>Porta tutte le ${tot - r.i} a oggi</button></div>` : ''}`;
};
async function rimastaSposta(v, idx) {
  const r = ui.rio, id = r.ids[r.i];
  if (v === 'scegli') { r.giorni = !r.giorni; disegnaRiordina(); return; }
  await azioneCarry(id, v === 'prossima' ? 'prossima' : v, idx);
  if (!ui.rio) return;
  if (!recRimasta(id)) { ui.rio.conta = { ...ui.rio.conta, [v]: (ui.rio.conta[v] || 0) + 1 }; rimasteAvanti(1); }
  else disegnaRiordina();   // non spostata (errore): resta qui
}
async function rimastaFatta() {
  const r = ui.rio, rec = recRimasta(r.ids[r.i]);
  if (!rec) return;
  await azioneFatto(rec.item.ciclo_id);
  if (!ui.rio) return;
  ui.rio.conta = { ...ui.rio.conta, fatta: (ui.rio.conta.fatta || 0) + 1 };
  rimasteAvanti(1);
}
AZIONI['rimaste-sistema'] = () => apriRiordinaRimaste();
AZIONI['rim-sposta'] = el => rimastaSposta(el.dataset.v, parseInt(el.dataset.g, 10));
AZIONI['rim-fatta'] = () => rimastaFatta();
AZIONI['rim-salta'] = () => rimasteAvanti(1);
AZIONI['rim-tutte'] = async () => { await carryTutteAOggi(); if (ui.rio) { ui.rio.i = ui.rio.ids.length; disegnaRiordina(); } };

// ══════════════════════════════════════════════════════════════
