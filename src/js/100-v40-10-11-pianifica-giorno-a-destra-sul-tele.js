// v40 · 10/11 — Pianifica › Giorno: a destra (sul telefono sotto la giornata) le Subito e le Importanti
// ancora da mettere in un giorno, per pianificare la giornata senza tornare alla Settimana.
// Fonte: le cose senza giorno né piano (con o senza scadenza), quelle «In settimana, senza giorno»
// e le rimaste indietro. Il «+» la mette in questo giorno (come trascinarla sulla colonna del giorno).
// ══════════════════════════════════════════════════════════════
function v40Candidate() {
  const visti = new Set(), out = [];
  const add = (c, da) => { if (!c || visti.has(c.id) || !isAttivo(c) || isGiornaliero(c) || !vedi(c.ctx)) return;
    const q = computeEffectiveQ(c); if (q !== 1 && q !== 2) return; visti.add(c.id); out.push({ c, q, da }); };
  try { rimasteVisibili().forEach(({ item, plan }) => { const d = carryData(item, plan); add(ciclo(item.ciclo_id), d ? 'rimasta da ' + d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }) : 'rimasta indietro'); }); } catch (_) {}
  righeGiorno('settimana').filter(r => !r.fatto).forEach(r => add(r.c, 'in settimana'));
  senzaGiornoNePiano().forEach(c => add(c, ''));
  const ord = (a, b) => a.q - b.q || String(a.c.due_date || '9999').localeCompare(String(b.c.due_date || '9999')) || String(a.c.created_at || '').localeCompare(String(b.c.created_at || ''));
  return out.sort(ord);
}
function v40Box(d) {
  if (giornoPassato(d) || opzRighe(d).solaLettura) return '';
  const lista = v40Candidate();
  const gruppo = (q, nome) => {
    const v = lista.filter(x => x.q === q); if (!v.length) return '';
    const vis = v;
    const righe = vis.map(({ c, da }) => {
      const meta = [c.due_date ? scadenzaHtml(c) : '', da ? `<span class="${da.startsWith('rimasta') ? 'tardi' : ''}">${v26Esc(da)}</span>` : ''].filter(Boolean).join('');
      return `<div class="v40-riga q${q}" draggable="true" data-id="${c.id}"><button type="button" class="v40-apri" data-act="v40-apri" data-id="${c.id}"><span class="t">${v26Esc(c.title)}</span>${meta ? `<span class="m">${meta}</span>` : ''}</button>`
        + `<button type="button" class="v40-metti" data-act="v40-metti" data-id="${c.id}" aria-label="Metti in questo giorno: ${v26Esc(c.title)}" data-tip="Metti in questo giorno"><i class="ti ti-calendar-plus" aria-hidden="true"></i></button></div>`;
    }).join('');
    return `<div class="v40-gr"><div class="v40-gr-h q${q}"><span>${nome}</span><span class="mono">${v.length}</span></div>${righe}</div>`;
  };
  const corpo = gruppo(1, 'Subito') + gruppo(2, 'Importanti');
  return `<section class="v40-dametti" aria-label="Subito e Importanti da mettere in un giorno">
    <header><b>Da mettere in giornata</b><small>senza giorno</small></header>
    ${corpo ? `<div class="v40-scroll">${corpo}</div>` : '<p class="v40-vuoto">Nessuna Subito o Importante senza giorno.</p>'}</section>`;
}
AZIONI['v40-metti'] = el => { const g = GIORNI[Math.max(0, Math.min(6, ui.giorno || 0))]; bordoSposta(el.dataset.id, g.key); };
AZIONI['v40-apri'] = el => apriDettaglio(el.dataset.id);
AZIONI['v40-tutte'] = el => { ui.v40Tutte = ui.v40Tutte || {}; ui.v40Tutte[el.dataset.v] = !ui.v40Tutte[el.dataset.v]; render(); };
{
  const _vgV40 = v26VistaGiorno;
  v26VistaGiorno = function () {
    const h = _vgV40.apply(this, arguments);
    try {
      const box = v40Box(dataDelGiorno(Math.max(0, Math.min(6, ui.giorno || 0))));
      if (!box) return h;
      const k = h.indexOf('<section class="v26-insett">') >= 0 ? '<section class="v26-insett">' : '<button type="button" class="riga-link v26-g-altre"';
      return h.includes(k) ? h.replace(k, box + k) : h;
    } catch (e) { console.warn('[v40] Giorno:', e.message); return h; }
  };
}

