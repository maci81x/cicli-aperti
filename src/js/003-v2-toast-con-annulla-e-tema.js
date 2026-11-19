// v2 · TOAST (con «Annulla») E TEMA
// ══════════════════════════════════════════════════════════════
let _toastId = 0;
function showToast(msg, type, opz) {
  if (ui.muto && !opz) return;
  const box = $('toast-container');
  if (!box) return;
  const id = 'toast-' + (++_toastId);
  const el = document.createElement('div');
  el.id = id;
  el.className = 'toast' + (type ? ' ' + type : '');
  el.setAttribute('role', 'status');
  const icona = type === 'error' ? 'ti-alert-circle' : type === 'warn' ? 'ti-alert-triangle' : type === 'info' ? 'ti-info-circle' : 'ti-circle-check';
  el.innerHTML = `<i class="ti ${icona}"></i><span class="toast-text">${escHtml(String(msg).replace(/\s*✓\s*$/, '').trim())}</span>`;
  if (opz && opz.annulla) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast-action';
    b.textContent = opz.etichetta || 'Annulla';
    b.onclick = async () => {
      _dismissToast(id);
      try { await opz.annulla(); } catch (e) { showToast('Non riesco ad annullare: ' + e.message, 'error'); }
      render();
    };
    el.appendChild(b);
  }
  [...box.children].slice(0, -1).forEach(x => x.remove());   // al massimo due toast insieme
  box.appendChild(el);
  setTimeout(() => _dismissToast(id), opz && opz.annulla ? TOAST_ANNULLA_MS : TOAST_MS);
}
function _dismissToast(id) { const el = $(id); if (el) el.remove(); }

// Esegue una funzione della logica senza i suoi toast: il messaggio lo dà l'azione v2.
async function inSilenzio(fn) {
  ui.muto = true;
  try { return await fn(); } finally { ui.muto = false; }
}

function temaCorrente() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
function applyTheme() {
  const t = temaCorrente();
  const btn = $('themeBtn');
  if (btn) btn.innerHTML = `<i class="ti ${t === 'dark' ? 'ti-sun' : 'ti-moon'}"></i>`;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#12110E' : '#F4EFE4');
}
function toggleTheme() {
  const t = temaCorrente() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(LS.THEME, t);
  applyTheme();
  if (ui.tab === 'altro') render();
}

// ══════════════════════════════════════════════════════════════
