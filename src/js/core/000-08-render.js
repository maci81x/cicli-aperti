// ══════════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════════









function personColor(p) {
  if (p && p.colore) return p.colore;
  const colors = ['#3d7fff','#a855f7','#ec4899','#22c55e','#f59e0b','#14b8a6','#6366f1','#ef4444','#f97316','#0ea5e9'];
  const nome = (p && p.nome) ? p.nome : (p || '');
  let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function cicliForPersona(nome) {
  return state.cicli.filter(c => isAttivo(c) && (c.persone_menzionate || []).includes(nome));
}







