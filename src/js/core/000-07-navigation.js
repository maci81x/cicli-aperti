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




