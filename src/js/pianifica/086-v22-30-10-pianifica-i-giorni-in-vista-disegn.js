// v22 · 30/10 · PIANIFICA: I GIORNI IN VISTA (disegni «6» e «7» del canvas «versione snella»)
// Computer (board): la testata del piano diventa una riga sola accanto al titolo (stampa = icona, legenda in fondo);
//   «Per il coach» e i giorni passati sono due righe sottili affiancate, il coach si apre al tocco.
// Telefono: Settimana/Mese accanto al titolo, i giorni subito sotto la settimana, i passati come primo tasto della fila;
//   piano (con Futuro) e coach in due righe sottili sotto il giorno.
// ══════════════════════════════════════════════════════════════
ui.v22Coach = false;
AZIONI['v22-coach'] = () => { ui.v22Coach = !ui.v22Coach; render(); };
function v22RigaCoach() {
  try { caricaCoach(); } catch (_) {}
  const voci = vociCoach(), mancano = voci.filter(v => !v.ok).length, e = coachEvento();
  const d = e ? new Date(e.inizioMs) : null;
  const quando = d ? `${d.toLocaleDateString('it-IT', { weekday: 'short' })} ${d.getDate()}/${d.getMonth() + 1}, <span class="mono">${e.ora}</span>` : 'incontro da fissare';
  const stato = mancano ? `mancano ${mancano} su ${voci.length}` : 'tutto pronto';
  return `<button type="button" class="v22-riga v22-coach${mancano ? '' : ' ok'}" data-act="v22-coach" aria-expanded="${ui.v22Coach}"><span class="v22-punto" aria-hidden="true"></span><span class="v22-testo"><b>Per il coach</b> · ${quando} · <span class="v22-stato">${stato}</span></span><span class="v22-apri">${ui.v22Coach ? 'Chiudi' : 'Apri'}<i class="ti ti-chevron-${ui.v22Coach ? 'up' : 'down'}" aria-hidden="true"></i></span></button>`;
}
// il coach: riga sottile al posto della card (la card resta sotto se aperta)
function v22Coach(f, dopo) {
  const card = f.querySelector('section.coach-card');
  if (!card) return null;
  const righe = document.createElement('div');
  righe.className = 'v22-righe';
  righe.innerHTML = v22RigaCoach();
  if (dopo) dopo.after(righe); else card.before(righe);
  if (ui.v22Coach) righe.after(card); else card.remove();
  return righe;
}
function v22Board(h) {
  const t = v21Tpl(h), f = t.content;
  const vh = f.querySelector('.vh-board'), testa = f.querySelector('.board-testa');
  if (vh && testa) {
    const riga = document.createElement('div');
    riga.className = 'v22-testa';
    const nav = testa.querySelector('.bt-nav'), stat = testa.querySelector('.bt-stat'), az = testa.querySelector('.bt-azioni'), leg = testa.querySelector('.legenda');
    if (nav) { const sp = nav.querySelector('span.mono'); if (sp) sp.insertAdjacentHTML('beforebegin', `<b class="v22-sett">Settimana <span class="mono">${state.week}</span> ·</b>`); riga.appendChild(nav); }
    if (stat) riga.appendChild(stat);
    if (az) {
      const pdf = az.querySelector('[data-act="pdf"]');
      if (pdf) { pdf.innerHTML = '<i class="ti ti-printer"></i>'; pdf.classList.remove('btn-sm'); pdf.classList.add('btn-icon', 'v22-pdf'); pdf.setAttribute('aria-label', 'Stampa il foglio della settimana'); pdf.setAttribute('data-tip', 'Stampa il foglio della settimana'); }
      // senza piano il bottone principale è «Prepara la settimana»; con il piano resta «Invia al coach»
      const piano = az.querySelector('[data-act="wizard"]'), invia = az.querySelector('[data-act="invia"]');
      if (!state.bp && piano && invia) { piano.classList.replace('btn-secondary', 'btn-primary'); invia.classList.replace('btn-primary', 'btn-secondary'); az.appendChild(piano); }
      riga.appendChild(az);
    }
    const seg = vh.querySelector('.seg');
    vh.insertBefore(riga, seg);
    testa.remove();
    const piede = f.querySelector('.board-piede');
    if (leg && piede) piede.appendChild(leg); else if (leg) leg.remove();
  }
  const righe = v22Coach(f);
  const pass = f.querySelector('.v21-passati');
  if (righe && pass) righe.appendChild(pass);
  else if (pass) { const r = document.createElement('div'); r.className = 'v22-righe'; pass.before(r); r.appendChild(pass); }
  return t.innerHTML;
}
function v22RigaPiano(futuro) {
  if (!state.bp) {
    if (bpSettimanaPassata()) return '';
    return `<div class="v22-riga v22-piano"><span class="v22-testo"><b>Nessun piano</b></span>${futuro}<button type="button" class="btn btn-primary btn-sm" data-act="wizard">Prepara</button></div>`;
  }
  const items = bpItemsValidi().filter(i => vedi(bpCiclo(i).ctx)), st = bpStats(items);
  const titolo = state.bp.stato === 'chiuso' ? 'Settimana chiusa' : state.bp.stato === 'bozza' ? 'Piano in bozza' : 'Piano';
  return `<div class="v22-riga v22-piano"><span class="v22-testo"><b>${titolo}</b> · <span class="mono">${st.done}/${st.tot}</span> fatte</span>${futuro}${bpSolaLettura() ? '' : '<button type="button" class="btn btn-secondary btn-sm" data-act="wizard">Modifica</button>'}</div>`;
}
function v22Telefono(h) {
  const t = v21Tpl(h), f = t.content;
  const vh = [...f.children].find(x => x.classList.contains('vh')), seg = [...f.children].find(x => x.classList.contains('seg'));
  if (vh && seg && vh.firstElementChild) { seg.classList.add('v22-seg'); vh.classList.add('v22-vh'); vh.firstElementChild.after(seg); }
  const wn = f.querySelector('.weeknav');
  if (wn) wn.classList.add('v22-weeknav');
  const days = f.querySelector('.days');
  if (!days) return t.innerHTML;
  // i giorni passati: primo tasto della fila
  const o = giornoIdxDi(oggiData());
  if (eSettimanaCorrente() && o > 0 && !ui.v21Passati) {
    const riga = f.querySelector('.v21-passati');
    if (riga) riga.remove();
    const righe = GIORNI.slice(0, o).flatMap(x => righeGiorno(x.key));
    const fatte = righe.filter(r => r.fatto).length, rimaste = righe.length - fatte;
    const nome = i => GIORNI[i].label.slice(0, 3);
    const quali = o > 1 ? `${nome(0)}–${nome(o - 1)}` : nome(0);
    const sotto = rimaste ? `${rimaste} indietro` : fatte ? `${fatte} ${fatte === 1 ? 'fatta' : 'fatte'}` : 'vuoti';
    days.insertAdjacentHTML('afterbegin', `<button type="button" class="day v22-passati${rimaste ? ' indietro' : ''}" data-act="v21-passati" aria-label="Giorni passati, da ${GIORNI[0].label.toLowerCase()} a ${GIORNI[o - 1].label.toLowerCase()}: ${plurale(fatte, 'fatta', 'fatte')}, ${rimaste} rimast${rimaste === 1 ? 'a' : 'e'} indietro. Mostrali"><span>${quali}</span><small>${sotto}</small></button>`);
    days.style.gridTemplateColumns = `1.35fr repeat(${7 - o}, 1fr)`;
  }
  // piano e coach: sotto il giorno
  const giorno = days.parentElement;
  const fr = f.querySelector('.futuro-riga'), futuro = fr ? fr.innerHTML : '';
  if (fr) fr.remove();
  const card = f.querySelector('.piano-card');
  if (card) card.remove();
  const piano = v22RigaPiano(futuro);
  let dopo = giorno;
  if (piano) { giorno.insertAdjacentHTML('afterend', `<div class="v22-righe v22-righe-tel">${piano}</div>`); dopo = giorno.nextElementSibling; }
  const coach = f.querySelector('section.coach-card');
  if (coach && dopo && dopo.classList.contains('v22-righe-tel')) {
    dopo.insertAdjacentHTML('beforeend', v22RigaCoach());
    if (ui.v22Coach) dopo.after(coach); else coach.remove();
  } else v22Coach(f, dopo);
  return t.innerHTML;
}
const _vistaPianificaV22 = vistaPianifica;
vistaPianifica = function () {
  const h = _vistaPianificaV22.apply(this, arguments);
  if (ui.pian === 'mese' || ui.sub) return h;
  try {
    if (boardAttiva()) return v22Board(h);
    if (window.innerWidth < 768) return v22Telefono(h);
  } catch (e) { console.warn('[v22] Pianifica:', e.message); }
  return h;
};

// ══════════════════════════════════════════════════════════════
