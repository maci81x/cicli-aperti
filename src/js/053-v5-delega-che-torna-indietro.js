// v5 · DELEGA CHE TORNA INDIETRO
// ══════════════════════════════════════════════════════════════
async function azioneTornata(id) {
  const c = ciclo(id);
  if (!c) return;
  const p = state.delegaColsOk ? personaDi(c.delega_persona_id) : null;
  const prima = campi(c, ['q', ...(state.delegaColsOk ? ['delega_controllo'] : []), ...(state.ritorniColOk ? ['ritorni_delega'] : [])]);
  const patch = { q: 2, ...(state.delegaColsOk ? { delega_controllo: null } : {}), ...(state.ritorniColOk ? { ritorni_delega: (c.ritorni_delega || 0) + 1 } : {}) };
  try {
    await patchCiclo(id, patch);
    // nel piano della settimana: chi e cosa, per la chiusura
    if (state.statsColOk) aggiornaPianoCorrente(pl => { const m = pl.motivi || {}; return { motivi: { ...m, deleghe: [...(m.deleghe || []), { persona: p ? p.nome : null, titolo: c.title }] } }; }).catch(e => console.warn('[Delega] piano:', e.message));
    render();
    showToast(`È di nuovo tua: Importante${p ? ` · tornata da ${p.nome}` : ''}`, 'success', { annulla: () => patchCiclo(id, prima) });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
