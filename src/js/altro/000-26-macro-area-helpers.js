// ══════════════════════════════════════════════════════════════
// MACRO AREA HELPERS
// ══════════════════════════════════════════════════════════════
function getMaCssClass(area) {
  if (!area) return '';
  const k = area.replace('&','').replace(' ','').replace('Da Delegare','Delegare').replace('R&D','RD').replace('R/D','RD');
  return 'ma-' + k;
}

function getMaColor(area) { return MACRO_AREA_COLORS[area] || '#64748b'; }
function getMaEmoji(area) { return MACRO_AREA_EMOJIS[area] || ''; }

