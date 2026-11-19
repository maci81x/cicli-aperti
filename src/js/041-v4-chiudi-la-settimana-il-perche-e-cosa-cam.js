// v4 · CHIUDI LA SETTIMANA: il perché, e cosa cambiare
// ══════════════════════════════════════════════════════════════
const REV_MOTIVI = [
  { k: 'urgenze',    l: 'Urgenze',                frase: 'le urgenze' },
  { k: 'telefonate', l: 'Telefonate',             frase: 'le telefonate' },
  { k: 'domande',    l: 'Domande arrivate a me',  frase: 'le domande arrivate a te' },
  { k: 'riunioni',   l: 'Riunioni saltate',       frase: 'le riunioni saltate' },
  { k: 'grossa',     l: 'Troppo grossa',          frase: 'cose troppo grosse' },
  { k: 'voglia',     l: 'Non avevo voglia',       frase: 'la voglia' },
  { k: 'altro',      l: 'Altro…',                 frase: 'altro' }
];
// { urgenze: 2, telefonate: 1, …, altro_note: ['…'] } — solo per le cose ancora aperte
function revMotiviConteggio() {
  const aperti = new Set(revAperti().map(i => i.id)), out = {};
  ui.rev.motivi.forEach((k, itemId) => { if (aperti.has(itemId)) out[k] = (out[k] || 0) + 1; });
  const note = [...ui.rev.altro].filter(([id]) => aperti.has(id) && ui.rev.motivi.get(id) === 'altro').map(([, t]) => t.trim()).filter(Boolean);
  if (note.length) out.altro_note = note;
  return out;
}
function revSuggerimenti() {
  const out = [], visti = new Set();
  revAperti().forEach(i => {
    const k = ui.rev.motivi.get(i.id), c = bpCiclo(i);
    if (!k || !c) return;
    const t = k === 'domande' ? `Scrivi la procedura o il manuale per «${c.title}»`
      : k === 'telefonate' ? 'Affianca una persona sulle chiamate'
      : k === 'grossa' ? `Scomponi «${c.title}» in passi`
      : k === 'riunioni' ? `Riprogramma «${c.title}»` : null;
    if (!t || visti.has(t)) return;
    visti.add(t);
    out.push({ t, ctx: c.ctx });
  });
  return out.slice(0, 6);
}
function revRallentato() {
  const cont = revMotiviConteggio();
  const voci = REV_MOTIVI.filter(m => cont[m.k]).sort((a, b) => cont[b.k] - cont[a.k]);
  if (!voci.length) return '';
  const elenco = voci.slice(0, 3).map(m => `${m.frase} (${cont[m.k]})`).join(', ');
  const sugg = revSuggerimenti();
  return `<div class="rev-perche"><p><b>Questa settimana ti hanno rallentato soprattutto:</b> ${escHtml(elenco)}.</p>
    ${sugg.length ? `<span class="rev-lbl">Per toglierle alla radice, una cosa Importante:</span>
    <div class="group rev-sugg">${sugg.map((s, i) => { const fatta = ui.rev.aggiunte.has(s.t); return `<div class="sugg-riga"><span><i class="ti ti-target" aria-hidden="true"></i>${escHtml(s.t)}</span>
      <button type="button" class="btn ${fatta ? 'btn-ghost' : 'btn-secondary'} btn-sm" data-act="rev-sugg" data-i="${i}"${fatta ? ' disabled' : ''}>${fatta ? '<i class="ti ti-check"></i>Aggiunta' : 'Aggiungi'}</button></div>`; }).join('')}</div>` : ''}</div>`;
}
async function aggiungiSuggerimento(i) {
  const s = revSuggerimenti()[i];
  if (!s || ui.rev.aggiunte.has(s.t)) return;
  try {
    const c = await upsertCiclo(rigaNuova(s.t, { subito: false }, s.ctx));   // Importante, senza data
    if (c) state.cicli = [c, ...state.cicli];
    ui.rev.aggiunte = new Set([...ui.rev.aggiunte, s.t]);
    disegnaReview();
    showToast('Aggiunta a Tutto · Importante', 'success', {});
  } catch (e) { showToast('Non aggiunta: ' + e.message, 'error', {}); }
}

// ══════════════════════════════════════════════════════════════
