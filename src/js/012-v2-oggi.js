// v2 · OGGI
// ══════════════════════════════════════════════════════════════
function vistaOggi() {
  const oggi = oggiData();
  const gk = giornoKeyDi(oggi), iso = toISODate(oggi);
  const semplice = modoSemplice();
  const righe = eSettimanaCorrente() ? righeGiorno(gk) : [];
  const routine = semplice ? [] : ritualiQuotidiani().map(c => ({ c, fatto: rituraleFattoOggi(c.id), ora: formatOra(c.ora_inizio), durata: c.durata_minuti }));
  const evSpunta = appuntamentiSpuntabili(oggi);   // v9: anche gli appuntamenti con orario si spuntano
  const tot = righe.length + routine.length + evSpunta.length;
  const fatte = righe.filter(r => r.fatto).length + routine.filter(r => r.fatto).length + evSpunta.filter(eventoFatto).length;

  // le tue 3, poi le rapide, poi il resto (chiuso) — le righe non si ripetono tra le sezioni
  const focusIds = focusDiOggi(righe);
  const rapide = rapideDiOggi(righe, focusIds);
  const controllo = daControllare();
  const inVista = new Set([...righe, ...rapide].map(r => r.c.id).concat(controllo.map(c => c.id)));
  const scadenza = state.cicli.filter(c => vedi(c.ctx) && isAttivo(c) && !inVista.has(c.id) && getEscalation(c) === 'crit')
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
  const eventi = eventiDelGiorno(oggi);
  const opz = { data: iso, stellaDi: r => r.item && state.focusColOk ? (focusIds.has(r.c.id) ? 'on' : 'off') : null };

  const impostazioni = semplice ? `<button type="button" class="btn btn-icon" data-act="sub" data-tab="altro" data-sub="impostazioni" aria-label="Impostazioni"><i class="ti ti-settings"></i></button>` : '';
  let h = `<div class="vh"><div><p>${fmtGiornoLungo(oggi)}</p><h1>Oggi${btnAiuto('oggi')}</h1></div>${impostazioni}</div>`;
  // v9 · sul telefono il primo schermo è: data e progresso, Subito, le prime righe della giornata, il campo
  const stretto = window.innerWidth < 768;
  const banner = bannerPiano() + bannerQ2() + bannerCicliCal();
  if (!stretto) h += banner;
  h += bloccoRimaste();
  if (tot) h += `<div class="progress"><div class="bar" role="progressbar" aria-label="Fatte oggi" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${fatte}"><i style="width:${Math.round(fatte / tot * 100)}%"></i></div><span><b class="mono">${fatte}</b> / <b class="mono">${tot}</b> fatte</span></div>`;

  // v6 · 1. SUBITO in cima (quelle con un'ora stanno nella giornata, al loro posto)
  const subito = righe.filter(r => computeEffectiveQ(r.c) === 1 && !r.ora);
  if (subito.length) {
    const nf = subito.filter(r => r.fatto).length;
    const corte = stretto && !ui.subitoTutte && subito.length > OGGI_TEL.SUBITO;   // sul telefono le prime 2, poi «Altre N»
    const viste = corte ? subito.slice(0, OGGI_TEL.SUBITO) : subito;
    const altreSubito = corte ? `<button type="button" class="riga-link subito-altre" data-act="subito-tutte"><i class="ti ti-chevron-down"></i><span>Altre ${subito.length - viste.length} Subito</span><span></span><span></span></button>` : '';
    h += `<p class="list-head lh-subito"><span><i class="ti ti-flame lh-ico"></i>Subito</span><span class="mono">${nf}/${subito.length}</span></p><div class="group${corte ? ' subito-corte' : ''}">${viste.map(r => riga(r, opz)).join('')}${altreSubito}</div>`;
  }
  // 2. La giornata ora per ora: appuntamenti (viola), cuscinetti, cose con ora; sotto quelle senza ora (le tue 3 per prime)
  const altre = righe.filter(r => !subito.includes(r));
  const { conOra, senzaOra } = sequenzaGiorno(altre, oggi);
  const senza = [...senzaOra].sort((a, b) => (focusIds.has(b.c.id) ? 1 : 0) - (focusIds.has(a.c.id) ? 1 : 0) || (a.fatto ? 1 : 0) - (b.fatto ? 1 : 0));
  if (conOra.length || senza.length) {
    h += `<p class="list-head"><span>La giornata</span><span class="mono">${eventi.length ? plurale(eventi.length, 'appuntamento', 'appuntamenti') : ''}</span></p>`;
    if (conOra.length) h += `<div class="group giornata">${conOra.map(x => x.tipo === 'evento' ? rigaEvento(x.e) : x.tipo === 'cuscinetto' ? rigaCuscinetto(x.item, { azioni: !semplice }) : riga(x.r, opz)).join('')}</div>`;
    if (senza.length) h += `${conOra.length ? '<p class="list-head"><span>Senza ora</span></p>' : ''}<div class="group">${senza.map(r => riga(r, opz)).join('')}</div>`;
  }
  if (stretto) h += banner;
  const inGiorno = new Set(righe.map(r => r.c.id));
  const rapideFuori = rapide.filter(r => !inGiorno.has(r.c.id));
  if (rapideFuori.length) {
    h += `<p class="list-head"><span><i class="ti ti-bolt lh-ico"></i>Ci vogliono 2 minuti? Falle ora.</span><span class="mono">Rapide (${rapideFuori.length})</span></p><div class="group">${rapideFuori.map(r => riga(r, opz)).join('')}</div>`;
  }
  // 3. Da controllare: le deleghe, con [Fatto]
  if (controllo.length) h += `<p class="list-head"><span><i class="ti ti-user-check lh-ico"></i>Da controllare</span><span class="mono">${controllo.length}</span></p><div class="group">${controllo.map(rigaControllo).join('')}</div>`;
  const routineCal = semplice ? [] : routineDelGiorno(oggi);   // la routine del mattino del calendario Privato
  if (routine.length || routineCal.length) {
    const nf = routine.filter(r => r.fatto).length, arco = arcoRoutine(routineCal);
    h += `<div class="group" style="margin-top:var(--sp-5)">${accordion('routine', 'Routine', routine.length ? `<span class="mono">${nf}/${routine.length}</span>` : `<span class="mono">${arco.da}–${arco.a}</span>`,
      routineCal.map(rigaEvento).join('') + routine.map(r => riga(r, { routine: true, senzaAzioni: true })).join(''))}</div>`;
  }
  if (!righe.length && tot && fatte === tot) h += `<div style="margin-top:var(--sp-5)">${vuoto('ti-confetti', 'Per oggi hai finito', 'Le routine sono fatte e non hai altro in programma.')}</div>`;

  if (!tot && !semplice) {
    h += vuoto('ti-calendar-week', 'Nessun piano per oggi', 'Scegli le cose che vuoi portare a casa questa settimana e dai a ognuna un giorno.',
      `<button type="button" class="btn btn-primary btn-sm" data-act="wizard">${etichettaWizard()}</button>`);
  }
  if (scadenza.length) {
    h += `<div class="group" style="margin-top:var(--sp-5)">${accordion('scadenza', 'In scadenza', `<span class="mono">${scadenza.length}</span>`,
      scadenza.map(c => riga({ c, fatto: false }, { data: iso })).join(''))}</div>`;
  }
  // modalità semplice: niente Pianifica, il piano si prepara da qui
  if (semplice) h += `<div style="margin-top:var(--sp-5)"><button type="button" class="btn btn-secondary btn-block" data-act="wizard"><i class="ti ti-calendar-week"></i>Pianifica la settimana</button></div>`;
  h += `<div class="oggi-coach">${cardCoach()}</div>`;   // sempre, anche senza Google Calendar
  h += fineGiornata(fatte, tot);
  return h;
}

// ══════════════════════════════════════════════════════════════
