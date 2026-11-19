// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════

function switchCtx(ctx) {
  state.ctx = ctx;
  state.filter_cat = null;
  state.filter_persona = null;
  localStorage.setItem(LS.CTX, ctx);
  localStorage.setItem(LS.CAT_FILTER, '');
  render();
}


function filterByCat(cat) {
  state.filter_cat = cat || null;
  state.filter_persona = null;
  localStorage.setItem(LS.CAT_FILTER, cat || '');
  render();
}

function filterByPersona(nome) {
  state.filter_persona = state.filter_persona === nome ? null : nome;
  render();
}

