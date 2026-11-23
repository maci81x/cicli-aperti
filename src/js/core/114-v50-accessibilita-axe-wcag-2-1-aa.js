// v50 · accessibilità (axe, WCAG 2.1 AA)
{ // il suggerimento vuoto non si annuncia
  const t = $('tooltip');
  if (t) { const agg = () => { const on = t.classList.contains('visible') && t.textContent.trim(); if (on) { t.setAttribute('role', 'tooltip'); t.removeAttribute('aria-hidden'); } else { t.removeAttribute('role'); t.setAttribute('aria-hidden', 'true'); } }; agg(); new MutationObserver(agg).observe(t, { attributes: true, attributeFilter: ['class'], childList: true }); }
}
// appuntamenti: niente bottoni dentro un bottone; si apre dal titolo (Invio o clic), la spunta e il cestino restano bottoni
function v50Appuntamenti() {
  document.querySelectorAll('#view .evt-riga[role="button"]').forEach(r => {
    const t = r.querySelector('.item-title');
    if (!t) return;
    t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0');
    t.setAttribute('data-act', r.dataset.act || 'evt-apri');
    if (r.dataset.evt) t.setAttribute('data-evt', r.dataset.evt);
    if (r.dataset.evtId) t.setAttribute('data-evt-id', r.dataset.evtId);
    if (r.getAttribute('aria-label')) t.setAttribute('aria-label', r.getAttribute('aria-label'));
    r.removeAttribute('role'); r.removeAttribute('tabindex');
  });
}
// disegna: catena appiattita nella fase D del riordino (base + 13 strati); i passi girano nell'ordine di prima.
//   passo 0 · core/005-v2-disegno.js
//   passo 1 · pianifica/063-v6-colori-priorita-telefono-pianifica-a-col.js
//   passo 2 · altro/077-v13-27-10-una-lista-sola-lavoro-e-personale.js
//   passo 3 · oggi/089-v25-2-11-il-menu-segue-il-ritmo-strada-a-l-a.js
//   passo 4 · pianifica/090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js
//   passo 5 · oggi/096-v32-05-11-il-telefono-piu-spazio-meno-scorre.js
//   passo 6 · oggi/097-v33-05-11-il-computer-usare-tutta-la-larghez.js
//   passo 7 · pianifica/102-v40-2-la-vista-giorno-non-si-allarga-oltre-124.js — v40.2 · la vista Giorno non si allarga oltre 1240px
//   passo 8 · pianifica/106-v44-17-11-pianifica-sul-computer-scorrendo-i.js
//   passo 9 · core/108-v46-17-11-quando-spunto-una-casella-in-fondo.js
//   passo 10 · pianifica/110-v47-19-11-pianifica-settimana-sul-computer-c.js — dopo il disegno: giorni tutti in vista e altezza della testa per le intestazioni fisse
//   passo 11 · smaltisci/112-v49-19-11-approvate-le-bozze-della-sezione-1.js
//   passo 12 · oggi/113-v50-19-11-sfondo-salvia-in-oggi-ogni-cosa-e.js
//   passo 13 · core/114-v50-accessibilita-axe-wcag-2-1-aa.js
// Forma annidata: alcuni strati fanno qualcosa prima di chiamare la versione precedente, quindi ogni strato resta una
// funzione interna che chiama la precedente per nome (passo0 = base); si legge dal fondo: l'ultimo passo chiama il penultimo…
function disegna() {
  // ── passo 0 · core/005-v2-disegno.js
  const passo0 = function () {
    document.querySelectorAll('[data-tab]').forEach(b => {
      if (b.dataset.tab === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('ctx-lavoro').setAttribute('aria-pressed', String(state.ctx === 'lavoro'));
    $('ctx-personale').setAttribute('aria-pressed', String(state.ctx === 'personale'));
    updateGcalButton();
    applyTheme();

    const view = $('view');
    if (state.loading && !state.cicli.length) { renderSkeleton(); return; }
    const larga = ui.tab === 'pianifica' && !ui.sub && window.innerWidth >= 768;
    view.classList.toggle('wide', larga);

    // Tutto tiene fermo il campo di ricerca mentre si scrive: aggiorna solo l'elenco
    const vista = (modoSemplice() ? 'semplice:' : '') + (ui.sub ? ui.tab + ':' + ui.sub : ui.tab);
    if (ui.tab === 'tutto' && !ui.sub && view.dataset.vista === vista && $('tutto-corpo')) { aggiornaTutto(); return; }

    const aperto = document.querySelector('.item.is-swiped');
    const apertoId = aperto ? aperto.dataset.id : null;
    let html = '';
    if (ui.tab === 'oggi') html = vistaOggi();
    else if (ui.tab === 'pianifica') html = vistaPianifica();
    else if (ui.tab === 'tutto') html = ui.sub === 'attesa' ? vistaAttesa() : vistaTutto();
    else html = ui.sub === 'fatte' ? vistaFatte() : ui.sub === 'guida' ? vistaGuida() : ui.sub === 'impostazioni' ? vistaImpostazioni() : vistaAltro();
    view.dataset.vista = vista;
    view.innerHTML = html;
    if (ui.tab === 'tutto' && !ui.sub) aggiornaTutto();
    if (ui.tab === 'pianifica' && ui.pian === 'settimana' && window.innerWidth >= 768) agganciaAgenda();
    if (apertoId) { const el = view.querySelector(`.item[data-id="${apertoId}"]`); if (el && el.querySelector('.swipe-actions')) el.classList.add('is-swiped'); }
    if (editingId && $('modalOverlay').classList.contains('open')) disegnaPassi(ciclo(editingId));
  };
  // ── passo 1 · pianifica/063-v6-colori-priorita-telefono-pianifica-a-col.js
  const passo1 = function () {
    passo0();
    $('view').classList.toggle('largo', boardAttiva());
  };
  // ── passo 2 · altro/077-v13-27-10-una-lista-sola-lavoro-e-personale.js
  const passo2 = function () {
    const r = passo1.apply(this, arguments);
    [['ctx-tutto', 'tutto'], ['ctx-lavoro', 'lavoro'], ['ctx-personale', 'personale']].forEach(([id, v]) => { const b = $(id); if (b) b.setAttribute('aria-pressed', String(state.filtro === v)); });
    const seg = document.querySelector('.top-ctx');
    if (seg) {
      const qui = ['oggi', 'tutto'].includes(ui.tab);
      seg.style.visibility = qui ? '' : 'hidden';
      seg.setAttribute('aria-label', 'Mostra');
    }
    return r;
  };
  // ── passo 3 · oggi/089-v25-2-11-il-menu-segue-il-ritmo-strada-a-l-a.js
  const passo3 = function () {
    passo2.apply(this, arguments);
    if (v25ArmadioAttivo()) $('view').classList.add('largo');
  };
  // ── passo 4 · pianifica/090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js
  const passo4 = function () {
    passo3.apply(this, arguments);
    if (ui.tab === 'pianifica' && !ui.sub && ui.pian === 'giorno' && window.innerWidth >= 768) $('view').classList.add('largo');
  };
  // ── passo 5 · oggi/096-v32-05-11-il-telefono-piu-spazio-meno-scorre.js
  const passo5 = function () {
    const r = passo4.apply(this, arguments);
    try { v32AggiornaTesta(); const main = $('main'); document.body.classList.toggle('v32-giu', v32Tel() && !!main && main.scrollTop > 56); } catch (e) { console.warn('[v32] testa:', e.message); }
    return r;
  };
  // ── passo 6 · oggi/097-v33-05-11-il-computer-usare-tutta-la-larghez.js
  const passo6 = function () {
    const r = passo5.apply(this, arguments);
    try { v33DopoDisegno(); } catch (e) { console.warn('[v33] dopo:', e.message); }
    return r;
  };
  // ── passo 7 · pianifica/102-v40-2-la-vista-giorno-non-si-allarga-oltre-124.js
  // v40.2 · la vista Giorno non si allarga oltre 1240px
  const passo7 = function () { passo6.apply(this, arguments); const v = $('view'); if (v) v.classList.toggle('v40g', ui.tab === 'pianifica' && !ui.sub && ui.pian === 'giorno'); v40Altezza(); };
  // ── passo 8 · pianifica/106-v44-17-11-pianifica-sul-computer-scorrendo-i.js
  const passo8 = function () { passo7.apply(this, arguments); v44Chiedi(); };
  // ── passo 9 · core/108-v46-17-11-quando-spunto-una-casella-in-fondo.js
  const passo9 = function () {
    const a = v46Annota();
    const r = passo8.apply(this, arguments);
    if (a) { v46Rimetti(a); requestAnimationFrame(() => v46Rimetti(a)); }
    return r;
  };
  // ── passo 10 · pianifica/110-v47-19-11-pianifica-settimana-sul-computer-c.js
  // dopo il disegno: giorni tutti in vista e altezza della testa per le intestazioni fisse
  const passo10 = function () {
    passo9.apply(this, arguments);
    const view = $('view'), on = !!(view && view.querySelector('.v47-testa'));
    if (view) view.classList.toggle('v47-on', on);
    if (!on) return;
    const cols = view.querySelector('.cols.board');
    if (cols) {
      const sez = [...cols.children].filter(x => x.classList.contains('bcol'));
      const giorni = sez.filter(x => !x.classList.contains('bcol-dp'));
      const pieno = s => !!s.querySelector('.item') || [...s.querySelectorAll('.evt-riga')].some(e => /\d{2}:\d{2}/.test(e.textContent) && !e.closest('.spazio-riga, .cusc-riga'));
      cols.style.gridTemplateColumns = `minmax(200px, 240px) ${giorni.map(s => pieno(s) ? 'minmax(0, 1fr)' : 'minmax(0, .75fr)').join(' ')}`;
    }
    const alza = () => { const b = view.querySelector('.v47-testa'); if (b) document.documentElement.style.setProperty('--v47-h', Math.round(b.getBoundingClientRect().height) + 'px'); };
    alza(); requestAnimationFrame(alza);
  };
  // ── passo 11 · smaltisci/112-v49-19-11-approvate-le-bozze-della-sezione-1.js
  const passo11 = function () { const r = passo10.apply(this, arguments); try { v49Orari(); } catch (e) { console.warn('[v49] orari:', e.message); } return r; };
  // ── passo 12 · oggi/113-v50-19-11-sfondo-salvia-in-oggi-ogni-cosa-e.js
  const passo12 = function () {
    const r = passo11.apply(this, arguments);
    const v = $('view'); if (v) v.classList.toggle('v50-oggi', ui.tab === 'oggi');
    return r;
  };
  // ── passo 13 · core/114-v50-accessibilita-axe-wcag-2-1-aa.js
  const passo13 = function () { const r = passo12.apply(this, arguments); try { v50Appuntamenti(); } catch (e) { console.warn('[v50] appuntamenti:', e.message); } return r; };
  return passo13.apply(this, arguments);
}
