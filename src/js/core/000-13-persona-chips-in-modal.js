// ══════════════════════════════════════════════════════════════
// PERSONA CHIPS IN MODAL
// ══════════════════════════════════════════════════════════════
let _modalPersone = [];  // array of {id, nome, colore}

function initPersonaChips(persone_menzionate) {
  _modalPersone = [];
  (persone_menzionate || []).forEach(nome => {
    const p = state.persone.find(x => x.nome === nome);
    _modalPersone.push(p ? { id: p.id, nome: p.nome, colore: personColor(p) } : { id: null, nome, colore: personColor({nome}) });
  });
  renderPersonaChips();
}

function renderPersonaChips() {
  const box = document.getElementById('personaChipsBox');
  const input = document.getElementById('personaChipInput');
  if (!box || !input) return;
  const chips = _modalPersone.map(p => {
    const col = p.colore || '#3d7fff';
    return `<span class="pchip" style="background:${col}22;color:${col}">
      <span class="pchip-av" style="background:${col};color:white">${escHtml((p.nome||'').charAt(0).toUpperCase())}</span>
      ${escHtml(p.nome)}
      <span class="pchip-rm" onclick="removePersonaChip('${escHtml(p.nome)}')">✕</span>
    </span>`;
  }).join('');
  // Rebuild box preserving input
  const existing = box.querySelectorAll('.pchip');
  existing.forEach(el => el.remove());
  box.insertAdjacentHTML('afterbegin', chips);
}

function removePersonaChip(nome) {
  _modalPersone = _modalPersone.filter(p => p.nome !== nome);
  renderPersonaChips();
}

function onPersonaChipInput(val) {
  const dd = document.getElementById('personaDd');
  if (!val.trim()) { if (dd) dd.style.display = 'none'; return; }
  const q = val.toLowerCase();
  const already = _modalPersone.map(p => p.nome);
  const matches = state.persone.filter(p => p.nome.toLowerCase().includes(q) && !already.includes(p.nome));
  const showCreate = !state.persone.some(p => p.nome.toLowerCase() === q);
  if (!dd) return;
  if (!matches.length && !showCreate) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = matches.slice(0,6).map(p => {
    const col = personColor(p);
    return `<div class="persona-dd-item" onclick="selectPersonaFromDd('${escHtml(p.nome)}')">
      <div class="persona-dd-av" style="background:${col};color:white">${escHtml(p.nome.charAt(0).toUpperCase())}</div>
      <span>${escHtml(p.nome)}</span>${p.ruolo ? `<span style="font-size:10px;color:var(--text-dim)">${escHtml(p.ruolo)}</span>` : ''}
    </div>`;
  }).join('') + (showCreate ? `<div class="persona-dd-item persona-dd-create" onclick="createAndSelectPersona('${escHtml(val.trim())}')">+ Crea "${escHtml(val.trim())}"</div>` : '');
}

function selectPersonaFromDd(nome) {
  const p = state.persone.find(x => x.nome === nome);
  if (!_modalPersone.some(x => x.nome === nome)) {
    _modalPersone.push(p ? { id: p.id, nome: p.nome, colore: personColor(p) } : { id: null, nome, colore: personColor({nome}) });
    renderPersonaChips();
  }
  const inp = document.getElementById('personaChipInput');
  if (inp) { inp.value = ''; }
  const dd = document.getElementById('personaDd');
  if (dd) dd.style.display = 'none';
}

async function createAndSelectPersona(nome) {
  try {
    const colore = personColor({nome});
    const { data, error } = await db.from('persone').insert({ nome, colore, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    state.persone.push(data);
    selectPersonaFromDd(nome);
    showToast(`Persona aggiunta: ${nome}`, 'success');
  } catch (e) {
    selectPersonaFromDd(nome);
  }
}

function onPersonaChipKey(e) {
  if (e.key === 'Backspace' && !e.target.value && _modalPersone.length) {
    _modalPersone = _modalPersone.slice(0, -1);
    renderPersonaChips();
  }
  if (e.key === 'Escape') {
    const dd = document.getElementById('personaDd');
    if (dd) dd.style.display = 'none';
  }
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.persona-chips-wrap')) {
    const dd = document.getElementById('personaDd');
    if (dd) dd.style.display = 'none';
  }
});

