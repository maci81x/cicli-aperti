// ══════════════════════════════════════════════════════════════
// API KEY MODAL
// ══════════════════════════════════════════════════════════════
function openApiKeyModal() {
  const inp = document.getElementById('claude-key-input');
  if (inp) inp.value = localStorage.getItem(LS.CLAUDE_KEY) || '';
  document.getElementById('apikeyOverlay').classList.add('open');
}

function saveApiKey() {
  const key = (document.getElementById('claude-key-input')?.value || '').trim();
  if (!key.startsWith('sk-ant-')) { showToast('Chiave non valida (deve iniziare con sk-ant-)', 'warn'); return; }
  localStorage.setItem(LS.CLAUDE_KEY, key);
  closeModal('apikeyOverlay');
  showToast('Chiave Claude salvata ✓', 'success');
  setTimeout(openPlaudModal, 300);
}

