// v45 · 17/11 — «se ho messo una Subito in un giorno e non l'ho chiusa, deve tornare nell'elenco»
// · Oggi: le Subito con il giorno passato e non fatte stanno nella lista «Oggi: N cose da chiudere»
//   (non più nascoste in «rimaste indietro»), con scritto da che giorno.
// · Pianifica › Da pianificare e il riquadro «Da mettere in giornata» della vista Giorno: in cima
//   le Subito rimaste indietro, pronte da trascinare in un giorno nuovo.
// ══════════════════════════════════════════════════════════════
function v45SubitoIndietro() {
  const oggi = oggiLocale();
  return state.cicli.filter(c => vedi(c.ctx) && !c.done && !isParcheggiato(c) && !c.parent_id && !isGiornaliero(c)
    && c.pianificato_data && c.pianificato_data < oggi && computeEffectiveQ(c) === 1 && ripetizioneDi(c) === 'nessuna')
    .sort((a, b) => a.pianificato_data.localeCompare(b.pianificato_data));
}
const v45Da = c => 'rimasta da ' + parseISODate(c.pianificato_data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'numeric' });
{
  const _listaV45 = htmlDaPianificareLista;
  htmlDaPianificareLista = function () {
    const h = _listaV45.apply(this, arguments);
    const q = (ui.dp.q || '').trim().toLowerCase();
    const l = v45SubitoIndietro().filter(c => (!q || String(c.title || '').toLowerCase().includes(q)) && (!ui.dp.tipo || ui.dp.tipo === 1));
    if (!l.length) return h;
    const righe = l.map(c => riga({ c, fatto: false }, { trascina: true, data: oggiLocale() })).join('');
    return `<div class="fascia-h v45-h">Subito rimaste indietro · ${l.length}</div>${righe}${/col-vuota/.test(h) ? '' : '<div class="fascia-h">Da pianificare</div>' + h}`;
  };
  const _candV45 = v40Candidate;
  v40Candidate = function () {
    const out = _candV45.apply(this, arguments), visti = new Set(out.map(x => x.c.id));
    const lista = typeof v47Indietro === 'function' ? v47Indietro() : v45SubitoIndietro();   // v47: tutte le rimaste indietro, Subito e Importanti
    const extra = lista.filter(c => !visti.has(c.id) && [1, 2].includes(computeEffectiveQ(c))).map(c => ({ c, q: computeEffectiveQ(c), da: c.pianificato_data ? v45Da(c) : 'rimasta indietro' }));
    return [...extra, ...out];
  };
}
// riga: catena appiattita nella fase D del riordino (base + 6 strati); i passi girano nell'ordine di prima.
//   passo 0 · core/005-v2-disegno.js — Una riga: spunta, titolo, tipo + un dato, ora. Azioni rapide con lo swipe (telefono) o «··
//   passo 1 · altro/073-05-a-le-mie-mete-principio-12-abbi-chiara-l.js
//   passo 2 · altro/077-v13-27-10-una-lista-sola-lavoro-e-personale.js
//   passo 3 · posta/083-v19-29-10-dalla-posta-di-lavoro.js
//   passo 4 · pianifica/090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js — la riga di una cosa: classe per il rosso
//   passo 5 · calendario/094-v30-4-11-i-promemoria-del-calendario-non-inv.js
//   passo 6 · pianifica/107-v45-17-11-se-ho-messo-una-subito-in-un-giorn.js
// Forma in sequenza: ogni passo riceve in `ris` il risultato del passo prima (era la chiamata alla versione precedente).
function riga(r, opz) {
  // ── passo 0 · core/005-v2-disegno.js
  // Una riga: spunta, titolo, tipo + un dato, ora. Azioni rapide con lo swipe (telefono) o «···» (desktop).
  let ris = ((r, opz) => {
    const o = opz && opz.solaLettura ? { ...opz, senzaAzioni: true } : (opz || {});
    const c = r.c;
    const q = computeEffectiveQ(c);
    const fatto = !!r.fatto;
    const inRitardo = !fatto && !!c.due_date && getDaysLeft(c.due_date) < 0;
    // modalità semplice: dei tipi resta solo «Subito», come icona
    const meta = !modoSemplice() ? [tagTipo(q)] : q === 1 ? [`<span class="tag tag-q1" aria-label="Subito"><i class="ti ti-flame"></i></span>`] : [];
    const delega = c.q === 3 && !fatto ? delegaTesto(c) : '';
    const passi = !o.routine && !o.nelDettaglio ? infoPassi(c, fatto) : '';
    if (o.passato && !fatto) meta.unshift('<span class="ritardo">in ritardo</span>');   // giorno passato, non fatta
    else if (delega) meta.push(`<span>${escHtml(delega)}</span>`);
    else if (r.item && r.item.tipo_slot === 'cuscinetto' && !fatto) meta.push('<span class="hint-quando"><i class="ti ti-lifebuoy"></i>nel cuscinetto</span>');
    else if (passi) meta.push(passi);
    else if (o.routine) { meta.length = 0; meta.push(`<i class="ti ti-repeat" style="font-size:14px"></i><span>ogni giorno${r.durata ? ' · ' + formatDurata(r.durata) : ''}</span>`); }
    else if (!fatto && q === 2 && !haPianificazione(c) && o.suggerisci) meta.push(`<span class="hint-quando"><i class="ti ti-calendar-plus"></i>Scegli quando</span>`);
    else if (c.due_date && !fatto) meta.push(scadenzaHtml(c));
    else if (o.extra) meta.push(`<span>${escHtml(o.extra)}</span>`);
    else if (ripetizioneDi(c) !== 'nessuna') meta.push(`<span><i class="ti ti-repeat" style="font-size:12px"></i> ${RIP_LABELS[ripetizioneDi(c)].toLowerCase()}</span>`);
    else if ((c.persone_menzionate || []).length) meta.push(`<span>${escHtml(c.persone_menzionate[0])}</span>`);
    if (bloccoEsterno(c) && !o.routine) meta.push(TAG_DAL_CAL);   // collegata a un appuntamento rimasto sul calendario
    const sep = '<span class="sep">·</span>';
    const titolo = (o.evidenzia ? evidenzia(c.title, o.evidenzia) : escHtml(c.title)) + (!fatto && !o.routine && eRapida(c, r.item) ? RAPIDA_CHIP : '');
    const stella = o.stellaDi ? o.stellaDi(r) : null;   // 'on' | 'off' | null (righe fuori dal piano)
    const btnStella = stella ? `<button type="button" class="btn btn-icon stella" data-act="stella" aria-pressed="${stella === 'on'}" aria-label="${stella === 'on' ? 'Oggi non la porto a casa' : 'Oggi la porto a casa'}" data-tip="${stella === 'on' ? 'Oggi non la porto a casa' : 'Oggi la porto a casa'}"><i class="ti ${stella === 'on' ? 'ti-star-filled' : 'ti-star'}"></i></button>` : '';
    const data = o.data ? ` data-data="${o.data}"` : '';
    const azioni = o.senzaAzioni ? '' : `<div class="swipe-actions" aria-hidden="true">
      <button type="button" class="a-fatto" data-act="q-fatto" tabindex="-1"><i class="ti ti-check"></i>Fatto</button>
      <button type="button" data-act="q-domani" tabindex="-1"><i class="ti ti-arrow-right"></i>Domani</button>
      <button type="button" data-act="q-quando" tabindex="-1"><i class="ti ti-calendar-event"></i>Quando</button>
      ${c.q === 3 ? '<button type="button" data-act="q-tornata" tabindex="-1"><i class="ti ti-arrow-back-up"></i>Tornata</button>' : '<button type="button" data-act="q-delega" tabindex="-1"><i class="ti ti-user-share"></i>Delega</button>'}
      <button type="button" data-act="q-scomponi" tabindex="-1"><i class="ti ti-list-tree"></i>Scomponi</button>
      <button type="button" data-act="q-blocca" tabindex="-1"><i class="ti ${c.calendar_event_id ? 'ti-calendar-x' : 'ti-calendar-plus'}"></i>${c.calendar_event_id ? 'Sblocca' : 'Blocca'}</button>
      <button type="button" class="a-lascia" data-act="q-lascia" tabindex="-1"><i class="ti ti-wind"></i>Lascia</button>
    </div>`;
    // 22/10 · l'icona «si ripete» sempre visibile nella riga (le routine di ogni giorno lo dicono già nel testo)
    const ripete = !o.routine && ripetizioneDi(c) !== 'nessuna' && !isGiornaliero(c)
      ? `<i class="ti ti-repeat blocco-ico" role="img" aria-label="Si ripete: ${RIP_LABELS[ripetizioneDi(c)].toLowerCase()}" data-tip="Si ripete: ${RIP_LABELS[ripetizioneDi(c)].toLowerCase()}"></i>` : '';
    const blocco = fatto ? '' : c.inderogabile && state.inderoColOk ? '<i class="ti ti-lock blocco-ico" role="img" aria-label="Importante bloccata in agenda: inderogabile" data-tip="Importante bloccata in agenda: non si sposta"></i>'
      : c.calendar_event_id && !bloccoEsterno(c) ? '<i class="ti ti-calendar-check blocco-ico" role="img" aria-label="Bloccata in agenda" data-tip="Bloccata in agenda su Google Calendar"></i>' : '';
    return `<div class="item p-q${q}${fatto ? ' is-done' : ''}${inRitardo ? ' is-late' : ''}" data-id="${c.id}"${data}${o.trascina ? ' draggable="true"' : ''}>
    ${azioni}
    <div class="item-row">
      <label class="check"><input type="checkbox" data-act="spunta"${fatto ? ' checked' : ''}${o.solaLettura ? ' disabled' : ''} aria-label="Fatta: ${esc(c.title)}"><span class="check-box">${SVG_SPUNTA}</span></label>
      <button type="button" class="item-main" data-act="apri"><span class="item-title">${titolo}</span><span class="item-meta">${meta.join(sep)}</span></button>
      <span class="item-side">${ripete}${blocco}${r.ora ? `<span class="mono">${r.ora}</span>` : (o.lato || '')}${btnStella}${o.senzaAzioni ? '' : `<button type="button" class="btn btn-icon" data-act="menu" aria-label="Azioni per ${esc(c.title)}"><i class="ti ti-dots"></i></button>`}</span>
    </div>
  </div>`;
  })(...arguments);
  // ── passo 1 · altro/073-05-a-le-mie-mete-principio-12-abbi-chiara-l.js
  ris = ((r, opz) => {
    const h = ris;
    const m = r && r.c && metaDi(r.c);
    if (!m) return h;
    const tag = `<span class="meta-tag" data-tip="Serve a: ${esc(m.testo)}"><i class="ti ti-flag" aria-hidden="true"></i><span><span class="sr-only">Meta: </span>${escHtml(corta(m.testo, 28))}</span></span>`;
    return h.replace(/(<span class="item-meta">)([\s\S]*?)(<\/span><\/button>)/, (x, a, dentro, b) => a + dentro + (dentro.trim() ? '<span class="sep">·</span>' : '') + tag + b);
  })(...arguments);
  // ── passo 2 · altro/077-v13-27-10-una-lista-sola-lavoro-e-personale.js
  ris = ((r, opz) => {
    const h = ris;
    if (!r || !r.c || r.c.ctx !== 'personale' || state.filtro === 'personale' && filtroQui()) return h;
    return h.replace(/(<span class="item-meta">)([\s\S]*?)(<\/span><\/button>)/, (x, a, dentro, b) => a + dentro + (dentro.trim() ? '<span class="sep">·</span>' : '') + TAG_PERS + b);
  })(...arguments);
  // ── passo 3 · posta/083-v19-29-10-dalla-posta-di-lavoro.js
  ris = ((r, opz) => {
    const h = ris;
    if (!r || !r.c || !daPosta(r.c)) return h;
    return h.replace(/(<span class="item-meta">)([\s\S]*?)(<\/span><\/button>)/, (x, a, dentro, b) => a + tagPosta(r.c) + (dentro.trim() ? '<span class="sep">·</span>' : '') + dentro + b);
  })(...arguments);
  // ── passo 4 · pianifica/090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js
  // la riga di una cosa: classe per il rosso
  ris = ((r, o) => {
    const h = ris;
    try { if (r && r.c && !r.fatto && v26CosaFissa(r.c)) return h.replace(/^(\s*<div class="item )/, '$1v26-fisso '); } catch (_) {}
    return h;
  })(...arguments);
  // ── passo 5 · calendario/094-v30-4-11-i-promemoria-del-calendario-non-inv.js
  ris = ((r, opz) => {
    const h = ris;
    try {
      if (!r || !r.c || !r.c.da_rivedere || r.fatto || r.c.done) return h;
      return h.replace(/<span class="item-meta">/, '<span class="item-meta"><span class="tag-v30" title="Promemoria passato del calendario: è ancora da fare?"><i class="ti ti-calendar-question" aria-hidden="true"></i>da rivedere</span>');
    } catch (_) { return h; }
  })(...arguments);
  // ── passo 6 · pianifica/107-v45-17-11-se-ho-messo-una-subito-in-un-giorn.js
  ris = ((r, opz) => {
    let h = ris;
    const c = r && r.c;
    const indietro = c && !r.fatto && !c.done && c.pianificato_data && c.pianificato_data < oggiLocale() && ripetizioneDi(c) === 'nessuna' && !isGiornaliero(c);   // v47: tutte, non solo le Subito
    if (indietro && opz && opz.passato && opz.data === c.pianificato_data)   // v46: nel suo giorno passato resta solo una traccia
      h = h.replace(/class="item /, 'class="item v46-traccia ').replace(/<span class="ritardo">in ritardo<\/span>/, '<span class="ritardo">ora in Da pianificare</span>');
    else if (indietro && !/rimasta da/.test(h))
      h = h.replace(/(<span class="item-meta"[^>]*>)/, `$1<span class="ritardo">${v45Da(c)}</span><span class="sep">·</span>`);
    return h;
  })(...arguments);
  return ris;
}

// ══════════════════════════════════════════════════════════════
