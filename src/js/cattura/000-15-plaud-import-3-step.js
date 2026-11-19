// ══════════════════════════════════════════════════════════════
// PLAUD IMPORT (3 step)
// ══════════════════════════════════════════════════════════════
let plaudStep      = 1;

function openPlaudModal() {
  plaudStep = 1;
  setPlaudStep(1);
  const ta = document.getElementById('plaud-transcript');
  if (ta) ta.value = '';
  document.getElementById('plaudOverlay').classList.add('open');
}

function closePlaudModal() {
  document.getElementById('plaudOverlay').classList.remove('open');
}

function setPlaudStep(n) {
  plaudStep = n;
  const labels = { 1:'Incolla trascrizione', 2:'Analisi in corso...', 3:'Conferma importazione' };
  const labelEl = document.getElementById('plaud-step-label');
  if (labelEl) labelEl.textContent = labels[n] || '';
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById('plaud-step-' + i);
    if (step) step.style.display = i === n ? 'block' : 'none';
    const dot  = document.getElementById('plaud-dot-' + i);
    if (dot) dot.className = 'step-dot' + (i < n ? ' done' : i === n ? ' active' : '');
  }
}

