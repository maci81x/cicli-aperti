// v50 · 19/11 — sfondo salvia; in Oggi ogni cosa è una scheda a sé (Subito / Importante / Delega si distinguono);
// «Da controllare» anche sul telefono; Delega da Smaltisci torna a Smaltisci
// ══════════════════════════════════════════════════════════════
// vistaOggi: catena appiattita nella fase D del riordino (base + 15 strati); i passi girano nell'ordine di prima.
//   passo 0 · oggi/012-v2-oggi.js
//   passo 1 · core/073-03-24-10-iphone-la-vista-non-resta-scivolat.js
//   passo 2 · oggi/073-08-d-la-sera-per-domani-principio-3-deleghe.js — in Oggi: sopra «Da controllare» (o tra i banner); in Tutto → Persone: sotto il nome
//   passo 3 · smaltisci/075-v11-togliere-25-10.js
//   passo 4 · cattura/076-v12-26-10-cosa-hai-in-testa-che-non-perde-ni.js
//   passo 5 · stampa/085-v21-30-10-la-settimana-da-oggi-e-la-giornata.js — Oggi: la stampante accanto al titolo
//   passo 6 · posta/087-v23-31-10-oggi-da-rispondere-n-le-cose-arriv.js
//   passo 7 · oggi/089-v25-2-11-il-menu-segue-il-ritmo-strada-a-l-a.js
//   passo 8 · pianifica/093-v29-3-11-il-tempo-per-preparare-gli-appuntam.js
//   passo 9 · oggi/095-v31-04-11-carta-di-precisione-fase-1-e-via-l.js
//   passo 10 · oggi/096-v32-05-11-il-telefono-piu-spazio-meno-scorre.js
//   passo 11 · oggi/097-v33-05-11-il-computer-usare-tutta-la-larghez.js
//   passo 12 · oggi/105-v43-17-11-sul-computer-tre-colonne-coach-e-s.js
//   passo 13 · smaltisci/112-v49-19-11-approvate-le-bozze-della-sezione-1.js — Oggi: sotto «Oggi: N cose da chiudere», il bottone per smaltire le rimaste indietro
//   passo 14 · smaltisci/112-v49-19-11-approvate-le-bozze-della-sezione-1.js
//   passo 15 · oggi/113-v50-19-11-sfondo-salvia-in-oggi-ogni-cosa-e.js — Oggi sul telefono: un solo riquadro «Da controllare» sotto le cose da chiudere
// Forma in sequenza: ogni passo riceve in `ris` il risultato del passo prima (era la chiamata alla versione precedente).
function vistaOggi() {
  // ── passo 0 · oggi/012-v2-oggi.js
  let ris = (() => {
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
  })();
  // ── passo 1 · core/073-03-24-10-iphone-la-vista-non-resta-scivolat.js
  ris = (() => {
    const h = ris; const n = notaEventiVecchi(); return n ? h.replace('</h1></div>', '</h1>' + n + '</div>') : h;
  })();
  // ── passo 2 · oggi/073-08-d-la-sera-per-domani-principio-3-deleghe.js
  // in Oggi: sopra «Da controllare» (o tra i banner); in Tutto → Persone: sotto il nome
  ris = (() => {
    const h = ris;
    const segno = '<p class="list-head"><span><i class="ti ti-user-check lh-ico"></i>Da controllare';
    const card = h.includes(segno) ? cardDeleghe() : '';
    return card ? h.replace(segno, card + segno) : h;
  })();
  // ── passo 3 · smaltisci/075-v11-togliere-25-10.js
  ris = (() => {
    const h = ris;
    const lista = figlieDelGiorno(new Date());
    if (!lista.length) return h;
    const blocco = `<p class="list-head"><span><i class="ti ti-heart lh-ico"></i>Le figlie</span><span class="mono">non contano come tuoi</span></p><div class="group">${lista.map(rigaFiglie).join('')}</div>`;
    const prima = ['<p class="list-head"><span><i class="ti ti-bolt lh-ico">', '<p class="list-head"><span><i class="ti ti-user-check lh-ico">'].map(s => h.indexOf(s)).filter(i => i >= 0).sort((a, b) => a - b)[0];
    return prima >= 0 ? h.slice(0, prima) + blocco + h.slice(prima) : h + blocco;
  })();
  // ── passo 4 · cattura/076-v12-26-10-cosa-hai-in-testa-che-non-perde-ni.js
  ris = (() => {
    const h = ris;
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
      if (n) {
        const tot = parseInt(n.textContent, 10), conta = tot === passati ? `${passati === 1 ? '1 finito' : `tutti e ${passati} finiti`}` : `${escHtml(n.textContent)}${n.textContent ? ' · ' : ''}${passati} finiti`; // v54: se sono finiti tutti, basta dirlo una volta
        n.innerHTML = `<span>${conta}</span><button type="button" class="v12-mostra" data-act="v12-passati">${ui.v12Passati ? 'Nascondi' : 'Mostra'}</button>`;
      }
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
  })();
  // ── passo 5 · stampa/085-v21-30-10-la-settimana-da-oggi-e-la-giornata.js
  // Oggi: la stampante accanto al titolo
  ris = (() => {
    const h = ris;
    const t = v21Tpl(h), vh = t.content.querySelector('.vh');
    if (!vh) return h;
    const btn = v21BtnStampa(giornoIdxDi(oggiData()), ' data-oggi="1"').replace('data-tip="Stampa la giornata"', 'data-tip="Stampa la giornata di oggi"').replace('v21-stampa"', 'v21-stampa v21-stampa-oggi"');
    v21InTesta(vh, btn);
    return t.innerHTML;
  })();
  // ── passo 6 · posta/087-v23-31-10-oggi-da-rispondere-n-le-cose-arriv.js
  ris = (() => {
    let h = ris;
    try {
      const b = v23Blocco();
      if (b) {   // subito sotto la testata «Oggi», prima di tutto il resto (anche dentro la cornice v12)
        const tpl = document.createElement('template');
        tpl.innerHTML = h;
        const vh = tpl.content.querySelector('.vh');
        if (vh) { vh.insertAdjacentHTML('afterend', b); const box = document.createElement('div'); box.appendChild(tpl.content); h = box.innerHTML; }
        else h = b + h;
      }
    } catch (e) { console.warn('[v23] Da rispondere:', e.message); }
    return h;
  })();
  // ── passo 7 · oggi/089-v25-2-11-il-menu-segue-il-ritmo-strada-a-l-a.js
  ris = (() => {
    let h = ris;
    try {
      if (modoSemplice()) return h;
      const b = v25RitmoCard();
      if (!b) return h;
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const vh = tpl.content.querySelector('.vh');
      if (vh) { vh.insertAdjacentHTML('afterend', b); const box = document.createElement('div'); box.appendChild(tpl.content); h = box.innerHTML; }
    } catch (e) { console.warn('[v25] ritmo:', e.message); }
    return h;
  })();
  // ── passo 8 · pianifica/093-v29-3-11-il-tempo-per-preparare-gli-appuntam.js
  ris = (() => {
    let h = ris;
    try {
      const b = v29Blocco();
      if (b) {
        const tpl = document.createElement('template');
        tpl.innerHTML = h;
        const vh = tpl.content.querySelector('.vh');
        if (vh) { vh.insertAdjacentHTML('afterend', b); const box = document.createElement('div'); box.appendChild(tpl.content); h = box.innerHTML; }
        else h = b + h;
      }
      v29ControllaPresto();
    } catch (err) { console.warn('[v29] riquadro:', err.message); }
    return h;
  })();
  // ── passo 9 · oggi/095-v31-04-11-carta-di-precisione-fase-1-e-via-l.js
  ris = (() => {
    let h = ris;
    try {
      if (modoSemplice()) return h;
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, vh = f.querySelector('.vh');
      const pezzi = ['.v31-adesso', '.v31-giornata', '.v31-ob'].map(s => f.querySelector(s)).filter(Boolean);
      if (vh && pezzi.length) { let dopo = vh; pezzi.forEach(p => { dopo.after(p); dopo = p; }); }
      const box = document.createElement('div'); box.appendChild(f); h = box.innerHTML;
    } catch (e) { console.warn('[v31] oggi:', e.message); }
    return h;
  })();
  // ── passo 10 · oggi/096-v32-05-11-il-telefono-piu-spazio-meno-scorre.js
  ris = (() => {
    let h = ris;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, g = f.querySelector('.v31-giornata'), ob = f.querySelector('.v31-ob');
      if (g && ob && g.nextElementSibling === ob) { const c = document.createElement('div'); c.className = 'v32-coppia'; g.before(c); c.append(g, ob); }
      // routine: quelle del calendario già passate stanno in una riga chiusa
      const acc = f.querySelector('.acc-head[data-k="routine"]');
      const corpo = acc && acc.parentElement.querySelector('.acc-body');
      const nm = v31Ora(), finiti = new Set(routineDelGiorno(oggiData()).filter(e => e.ora && minDi(e.fine || e.ora) <= nm).map(e => String(e.id)));
      const passate = corpo ? [...corpo.querySelectorAll(':scope > .evt-riga[data-evt-id]')].filter(x => finiti.has(x.dataset.evtId)) : [];
      if (passate.length) {
        const d = document.createElement('details'); d.className = 'v32-passate';
        d.innerHTML = `<summary><i class="ti ti-chevron-right" aria-hidden="true"></i>Già passate · <span class="mono">${passate.length}</span></summary>`;
        passate[0].before(d); passate.forEach(p => d.appendChild(p));
      }
      // «Prima di tutto»: sul telefono il conto delle Subito va nell'intestazione (il riquadro interno non c'è più)
      const rosso = f.querySelector('.v12-prima .v12-card.v12-rosso .v12-testa p'), testa = f.querySelector('.v12-prima .v12-head .mono');
      if (rosso && testa) testa.innerHTML = `<span class="v32-tel-n">${escHtml(rosso.textContent.trim())}</span><span class="v32-pc-n">${testa.innerHTML}</span>`;
      const box = document.createElement('div'); box.appendChild(f); h = box.innerHTML;
    } catch (e) { console.warn('[v32] oggi:', e.message); }
    return h;
  })();
  // ── passo 11 · oggi/097-v33-05-11-il-computer-usare-tutta-la-larghez.js
  ris = (() => {
    let h = ris;
    if (!v33Largo()) return h;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, radice = f.querySelector('.v12-oggi') || f;
      const qui = sel => [...radice.querySelectorAll(':scope > ' + sel + ', :scope > .v32-coppia > ' + sel)];
      const sx = [], dx = [];
      ['.vh', '.v31-adesso', '.v31-giornata'].forEach(s => sx.push(...qui(s)));
      const gio = radice.querySelector(':scope > .group.giornata');
      if (gio) { const t = gio.previousElementSibling; if (t && t.classList.contains('list-head')) sx.push(t); sx.push(gio); }
      ['.v23-posta', '.v31-ob'].forEach(s => dx.push(...qui(s)));
      const routine = radice.querySelector(':scope > .group .acc-head[data-k="routine"]');
      const tempo = radice.querySelector(':scope > .v12-tempo');
      const grid = document.createElement('div'); grid.className = 'v33-tre';
      const col = c => { const d = document.createElement('div'); d.className = 'v33-col ' + c; return d; };
      const cs = col('v33-sx'), cc = col('v33-centro'), cd = col('v33-dx');
      sx.forEach(x => cs.appendChild(x));
      dx.forEach(x => cd.appendChild(x));
      cd.insertAdjacentHTML('beforeend', v33InSettimana());
      if (routine) cd.appendChild(routine.closest('.group'));
      if (tempo) cd.appendChild(tempo);
      [...radice.children].forEach(x => { if (x.classList.contains('v32-coppia') && !x.children.length) x.remove(); else cc.appendChild(x); });
      grid.append(cs, cc, cd);
      radice.appendChild(grid);
      const box = document.createElement('div'); box.appendChild(f); h = box.innerHTML;
    } catch (e) { console.warn('[v33] oggi:', e.message); }
    return h;
  })();
  // ── passo 12 · oggi/105-v43-17-11-sul-computer-tre-colonne-coach-e-s.js
  ris = (() => {
    let h = ris;
    if (!/v33-tre/.test(h)) return h;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, sx = f.querySelector('.v33-sx'), gr = f.querySelector('.v33-centro .v12-griglia');
      if (!sx || !gr) return h;
      const altre = [...gr.children].filter(x => x.classList.contains('v12-card') && !x.classList.contains('v12-rosso'));
      if (!altre.length) return h;
      const box = document.createElement('section');
      box.className = 'v43-metodo'; box.setAttribute('aria-label', 'Il metodo: da fare');
      box.innerHTML = `<p class="list-head"><span>Il metodo · da fare</span><span class="mono">${altre.length}</span></p>`;
      altre.forEach(x => box.appendChild(x));
      sx.appendChild(box);
      gr.classList.add('v43-sola');
      const head = f.querySelector('.v33-centro .v12-head');
      if (head && !gr.children.length) head.remove();
      else if (head) head.remove();   // il titolo lo dà già la scheda «Oggi: N cose da chiudere»
      const d = document.createElement('div'); d.appendChild(f); h = d.innerHTML;
    } catch (e) { console.warn('[v43] oggi:', e.message); }
    return h;
  })();
  // ── passo 13 · smaltisci/112-v49-19-11-approvate-le-bozze-della-sezione-1.js
  // Oggi: sotto «Oggi: N cose da chiudere», il bottone per smaltire le rimaste indietro
  ris = (() => {
    let h = ris;
    try {
      const n = v49Lista().length;
      if (!n) return h;
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const card = tpl.content.querySelector('.v12-card.v12-rosso');
      const b = `<button type="button" class="v49-oggi" data-act="v49-apri"><i class="ti ti-player-track-next" aria-hidden="true"></i><span>Smaltisci ${n === 1 ? 'la rimasta indietro' : `le ${n} rimaste indietro`}</span><i class="ti ti-chevron-right" aria-hidden="true"></i></button>`;
      if (card) card.insertAdjacentHTML('beforeend', b);
      else { const g = tpl.content.querySelector('.v33-centro') || tpl.content.querySelector('.v12-oggi') || tpl.content; g.insertAdjacentHTML('afterbegin', b); }
      const d = document.createElement('div'); d.appendChild(tpl.content); h = d.innerHTML;
    } catch (e) { console.warn('[v49] oggi smaltisci:', e.message); }
    return h;
  })();
  // ── passo 14 · smaltisci/112-v49-19-11-approvate-le-bozze-della-sezione-1.js
  ris = (() => {
    let h = ris;
    if (!/v33-tre/.test(h)) return h;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, tre = f.querySelector('.v33-tre'), dx = f.querySelector('.v33-dx');
      if (!tre || !dx) return h;
      const righe = [];
      const testo = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
      // già compatti: restano come sono (si aprono da soli)
      tre.querySelectorAll('.v31-ob, .v23-posta').forEach(el => { el.classList.add('v49-diretto'); righe.push(el.outerHTML); el.remove(); });
      const blocchi = [...tre.querySelectorAll('.v29-prep, .banner-piano, .v43-metodo .v12-card')];
      blocchi.forEach(el => {
        const tEl = el.querySelector('.v29-t, b, h3, strong') || el.querySelector('p');
        const t = testo(tEl) || 'Da guardare';
        const sEl = [...el.querySelectorAll('.v29-s, .t-caption, p, small')].find(x => x !== tEl && !x.contains(tEl) && testo(x) && testo(x) !== t);
        const sub = sEl ? testo(sEl) : '';
        const ico = (el.querySelector('i.ti') || {}).className || 'ti ti-point';
        const k = v49Chiave(t);
        righe.push(`<details class="v49-r" data-v49="${esc(k)}"${ui.v49Aperti.has(k) ? ' open' : ''}><summary><i class="${esc(ico)}" aria-hidden="true"></i><span class="v49-r-t"><b>${escHtml(corta(t, 60))}</b>${sub ? `<small>${escHtml(corta(sub, 70))}</small>` : ''}</span><i class="ti ti-chevron-down v49-r-v" aria-hidden="true"></i></summary><div class="v49-r-corpo">${el.outerHTML}</div></details>`);
        el.remove();
      });
      const metodo = tre.querySelector('.v43-metodo');
      if (metodo && !metodo.querySelector('.v12-card')) metodo.remove();
      if (righe.length) dx.insertAdjacentHTML('afterbegin', `<section class="v49-ctl" aria-label="Da controllare"><p class="v49-ctl-h"><span>Da controllare</span><span class="mono">${righe.length}</span></p>${righe.join('')}</section>`);
      const d = document.createElement('div'); d.appendChild(f); h = d.innerHTML;
    } catch (e) { console.warn('[v49] da controllare:', e.message); }
    return h;
  })();
  // ── passo 15 · oggi/113-v50-19-11-sfondo-salvia-in-oggi-ogni-cosa-e.js
  // Oggi sul telefono: un solo riquadro «Da controllare» sotto le cose da chiudere
  ris = (() => {
    let h = ris;
    if (/v33-tre/.test(h) || /v49-ctl/.test(h)) return h;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, radice = f.querySelector('.v12-oggi') || f;
      const testo = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
      const righe = [];
      radice.querySelectorAll('.v23-posta').forEach(el => { el.classList.add('v49-diretto'); righe.push(el.outerHTML); el.remove(); });
      const blocchi = [...radice.querySelectorAll('.v29-prep, .banner-piano, .v12-griglia > .v12-card:not(.v12-rosso)')];
      blocchi.forEach(el => {
        const tEl = el.querySelector('.v29-t, b, h3, strong') || el.querySelector('p');
        const t = testo(tEl) || 'Da guardare';
        const sEl = [...el.querySelectorAll('.v29-s, .t-caption, p, small')].find(x => x !== tEl && !x.contains(tEl) && testo(x) && testo(x) !== t);
        const ico = (el.querySelector('i.ti') || {}).className || 'ti ti-point';
        const k = v49Chiave(t);
        righe.push(`<details class="v49-r" data-v49="${esc(k)}"${ui.v49Aperti.has(k) ? ' open' : ''}><summary><i class="${esc(ico)}" aria-hidden="true"></i><span class="v49-r-t"><b>${escHtml(corta(t, 60))}</b>${sEl ? `<small>${escHtml(corta(testo(sEl), 70))}</small>` : ''}</span><i class="ti ti-chevron-down v49-r-v" aria-hidden="true"></i></summary><div class="v49-r-corpo">${el.outerHTML}</div></details>`);
        el.remove();
      });
      if (!righe.length) return h;
      const box = `<section class="v49-ctl v50-tel" aria-label="Da controllare"><p class="v49-ctl-h"><span>Da controllare</span><span class="mono">${righe.length}</span></p>${righe.join('')}</section>`;
      const rosso = radice.querySelector('.v12-card.v12-rosso');
      const dopo = rosso ? (rosso.closest('.v12-griglia') || rosso) : null;
      if (dopo) dopo.insertAdjacentHTML('afterend', box); else radice.insertAdjacentHTML('beforeend', box);
      const d = document.createElement('div'); d.appendChild(f); h = d.innerHTML;
    } catch (e) { console.warn('[v50] da controllare telefono:', e.message); }
    return h;
  })();
  return ris;
}
// una riga aperta non ripete il titolo: il titolo della scheda interna si nasconde (resta per i lettori di schermo)
// Smaltisci: Delega apre il suo foglio e, chiuso quello, si torna a Smaltisci
{
  const _listaV50 = v49Lista;
  v49Lista = () => _listaV50().filter(c => !(ui.v49 && ui.v49.gestite && ui.v49.gestite.has(c.id)));
  const _faiV50 = v49Fai;
  v49Fai = async function (tipo, iso) {
    if (tipo !== 'delega') return _faiV50.apply(this, arguments);
    const s = ui.v49, c = s && v49Lista()[s.idx];
    if (!c) return;
    s.riprendi = { id: c.id, prima: { q: c.q, delega_persona_id: c.delega_persona_id || null, delega_controllo: c.delega_controllo || null, persone_menzionate: [...(c.persone_menzionate || [])] } };
    closeModal('v49Overlay');
    apriDelega(c.id);
    if (!$('delegaOverlay') || !$('delegaOverlay').classList.contains('open')) v50Riprendi();
  };
  AZIONI['v49-delega'] = () => v49Fai('delega');
}
function v50Riprendi() {
  const s = ui.v49, r = s && s.riprendi;
  if (!r) return;
  s.riprendi = null;
  s.gestite = s.gestite || new Set();
  const c = ciclo(r.id);
  if (c && c.delega_persona_id && c.delega_persona_id !== r.prima.delega_persona_id) {
    s.gestite.add(r.id); s.fatte++; s.storia.push({ tipo: 'delega', id: r.id, prima: r.prima });
  }
  v49Disegna();
  $('v49Overlay').classList.add('open');
}
{
  const o = $('delegaOverlay');
  if (o) new MutationObserver(() => { if (!o.classList.contains('open') && ui.v49 && ui.v49.riprendi) setTimeout(v50Riprendi, 50); }).observe(o, { attributes: true, attributeFilter: ['class'] });
  const _annV50 = v49Annulla;
  v49Annulla = async function () {
    const s = ui.v49, u = s && s.storia[s.storia.length - 1];
    if (!u || u.tipo !== 'delega') return _annV50.apply(this, arguments);
    s.storia.pop();
    try { await patchCiclo(u.id, u.prima); s.gestite.delete(u.id); s.fatte = Math.max(0, s.fatte - 1); const i = v49Lista().findIndex(x => x.id === u.id); if (i >= 0) s.idx = i; render(); }
    catch (e) { showToast('Non riesco ad annullare: ' + e.message, 'error'); }
    v49Disegna();
  };
  AZIONI['v49-annulla'] = () => v49Annulla();
}
// Smaltisci: Esc chiude, e il fuoco resta dentro la finestra (tastiera)
document.addEventListener('keydown', e => {
  const o = $('v49Overlay');
  if (!o || !o.classList.contains('open')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeModal('v49Overlay'); return; }
  if (e.key !== 'Tab') return;
  const f = [...o.querySelectorAll('button:not([disabled]), [tabindex="0"]')].filter(x => x.offsetParent);
  if (!f.length) return;
  const primo = f[0], ultimo = f[f.length - 1];
  if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
  else if (!o.contains(document.activeElement)) { e.preventDefault(); primo.focus(); }
});
