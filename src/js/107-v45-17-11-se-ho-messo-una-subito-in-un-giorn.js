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
  const _rigaV45 = riga;
  riga = function (r, opz) {
    let h = _rigaV45.apply(this, arguments);
    const c = r && r.c;
    const indietro = c && !r.fatto && !c.done && c.pianificato_data && c.pianificato_data < oggiLocale() && ripetizioneDi(c) === 'nessuna' && !isGiornaliero(c);   // v47: tutte, non solo le Subito
    if (indietro && opz && opz.passato && opz.data === c.pianificato_data)   // v46: nel suo giorno passato resta solo una traccia
      h = h.replace(/class="item /, 'class="item v46-traccia ').replace(/<span class="ritardo">in ritardo<\/span>/, '<span class="ritardo">ora in Da pianificare</span>');
    else if (indietro && !/rimasta da/.test(h))
      h = h.replace(/(<span class="item-meta"[^>]*>)/, `$1<span class="ritardo">${v45Da(c)}</span><span class="sep">·</span>`);
    return h;
  };
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

// ══════════════════════════════════════════════════════════════
