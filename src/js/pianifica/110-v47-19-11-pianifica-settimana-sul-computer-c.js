// v47 · 19/11 — Pianifica › Settimana sul computer come il foglio di Leo (call del 18/11, scelto da Roby)
// · In alto e fissi mentre scorri: la testa (settimana, piano, coach), il giallo «In settimana · pensaci dopo»
//   accanto al blu «Obiettivi», poi le intestazioni dei giorni. Sotto tutti i giorni in vista (niente scorrimento di lato).
// · Le rimaste indietro (qualsiasi tipo: non fatte in un giorno passato) non sono più il blocco grande in cima:
//   stanno in testa a «Da pianificare» («Rimaste indietro · N», con «rimasta da mer 11»), con un bollino in alto che ci porta.
// ══════════════════════════════════════════════════════════════
function v47Indietro() {
  const oggi = oggiLocale(), visti = new Set(), out = [];
  const ok = c => c && vedi(c.ctx) && !c.done && !isParcheggiato(c) && !c.parent_id && !isGiornaliero(c) && ripetizioneDi(c) === 'nessuna';
  try { rimasteVisibili().forEach(({ item }) => { const c = ciclo(item.ciclo_id); if (ok(c) && !visti.has(c.id) && !(c.pianificato_data && c.pianificato_data >= oggi)) { visti.add(c.id); out.push(c); } }); } catch (_) {}
  state.cicli.forEach(c => { if (ok(c) && !visti.has(c.id) && c.pianificato_data && c.pianificato_data < oggi) { visti.add(c.id); out.push(c); } });
  return out.sort((a, b) => computeEffectiveQ(a) - computeEffectiveQ(b) || String(a.pianificato_data || '').localeCompare(String(b.pianificato_data || '')));
}
ui.v47Indietro = ui.v47Indietro !== false;
{
  // la colonna Da pianificare: in testa tutte le rimaste indietro (sostituisce il gruppo delle sole Subito della v45)
  const _listaV47 = htmlDaPianificareLista;
  htmlDaPianificareLista = function () {
    let h = _listaV47.apply(this, arguments);
    h = h.replace(/<div class="fascia-h v45-h">[\s\S]*?(?=<div class="fascia-h">Da pianificare<\/div>|$)/, '').replace(/^<div class="fascia-h">Da pianificare<\/div>/, '');
    const q = (ui.dp.q || '').trim().toLowerCase();
    const l = v47Indietro().filter(c => (!q || String(c.title || '').toLowerCase().includes(q)) && (!ui.dp.tipo || computeEffectiveQ(c) === ui.dp.tipo));
    if (!l.length) return h;
    const righe = l.map(c => riga({ c, fatto: false }, { trascina: true, data: oggiLocale() })).join('');
    return `<details class="v47-indietro" id="v47-indietro"${ui.v47Indietro ? ' open' : ''}><summary data-act="v47-ind-apri"><span>Rimaste indietro · ${l.length}</span><span class="t-caption">trascinale in un giorno</span></summary>${righe}</details>`
      + (/col-vuota/.test(h) ? '' : '<div class="fascia-h">Da pianificare</div>' + h);
  };
  AZIONI['v47-ind-apri'] = el => { setTimeout(() => { const d = el.closest('details'); ui.v47Indietro = !!(d && d.open); }, 0); };
  AZIONI['v47-vai-indietro'] = () => {
    ui.v47Indietro = true;
    const d = document.getElementById('v47-indietro'); if (!d) return;
    d.open = true;
    const l = document.getElementById('dp-lista'); if (l) l.scrollTop = 0;
    const m = document.getElementById('main'), top = d.getBoundingClientRect().top - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--v47-h')) || 0) - 60;
    if (m) m.scrollBy({ top, behavior: 'smooth' });
  };
  const _vpV47 = vistaPianifica;
  vistaPianifica = function () {
    let h = _vpV47.apply(this, arguments);
    if (ui.sub || ui.pian !== 'settimana' || !/cols board/.test(h) || window.innerWidth < 1024) return h;
    try {
      const t = document.createElement('template'); t.innerHTML = h; const f = t.content;
      f.querySelectorAll('section.carry, .rimaste-riga').forEach(x => x.remove());
      const testa = f.querySelector('.v26-testa'), sett = f.querySelector('.cols.board > .bcol-sett'), ob = f.querySelector('.v26-obiettivi');
      if (!testa || !sett) return h;
      const box = document.createElement('div'); box.className = 'v47-testa';
      testa.before(box); box.appendChild(testa);
      const alto = document.createElement('div'); alto.className = 'board v47-alto';
      const hs = sett.querySelector('.bcol-h span'); if (hs) hs.textContent = 'In settimana · pensaci dopo';
      alto.appendChild(sett);
      if (ob) alto.appendChild(ob);
      box.appendChild(alto);
      const r2 = testa.querySelector('.v33-riga2'), seg = testa.querySelector('.seg'), riga = testa.querySelector('.v22-testa');
      if (seg && riga) riga.appendChild(seg);
      if (r2 && !r2.children.length) r2.remove();
      const n = v47Indietro().length;
      const stat = testa.querySelector('.bt-stat');
      if (n && stat) stat.insertAdjacentHTML('afterend', `<button type="button" class="v47-pill" data-act="v47-vai-indietro"><i class="ti ti-clock-exclamation" aria-hidden="true"></i>${n} rimast${n === 1 ? 'a' : 'e'} indietro</button>`);
      const d = document.createElement('div'); d.appendChild(f); h = d.innerHTML;
    } catch (e) { console.warn('[v47] settimana:', e.message); }
    return h;
  };
  // la barra della v44 sul computer non serve più: la testa resta già in vista
  const _v44V47 = v44Aggiorna;
  v44Aggiorna = function () {
    if (window.innerWidth >= 1024 && document.querySelector('#view .v47-testa')) { V44.raf = 0; v44Barra().classList.remove('su'); return; }
    return _v44V47.apply(this, arguments);
  };
  let _rzV47 = 0;
  window.addEventListener('resize', () => { clearTimeout(_rzV47); _rzV47 = setTimeout(() => { if (ui.tab === 'pianifica') render(); }, 250); });
}
// ══════════════════════════════════════════════════════════════
