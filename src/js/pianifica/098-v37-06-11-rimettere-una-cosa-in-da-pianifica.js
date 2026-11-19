// v37 · 06/11 — rimettere una cosa in «Da pianificare»
// · Pianifica (computer): si trascina una cosa da un giorno (o da «In settimana») sulla colonna Da pianificare.
// · Ovunque: nel menu «···» della riga c'è «Rimetti in Da pianificare» (solo per le cose che hanno un giorno o sono nel piano).
// Cosa fa: toglie la riga dal piano della settimana, toglie la data e il giorno (anche il giorno fisso) e l'eccezione
// della settimana; se la cosa aveva un blocco messo dall'app in agenda, lo toglie. Con «Annulla» torna com'era.
// Le cose che si ripetono non si rimettono (si cambia la ripetizione dal dettaglio).
// ══════════════════════════════════════════════════════════════
function v37Pianificata(c) { return !!c && !c.done && (!!c.pianificato_data || !!c.giorno_settimana || !!agendaOverrideFor(c.id) || !!(state.bp && itemDelPiano(c.id))); }
async function v37RimettiDaPianificare(id) {
  const c = ciclo(id);
  if (!c) return;
  if (siRipete(c) || isGiornaliero(c)) { showToast('Si ripete: cambia la ripetizione dal dettaglio', 'info'); return; }
  const prima = campi(c, ['pianificato_data', 'giorno_settimana']);
  const item = state.bp ? itemDelPiano(id) : null;
  const w = { week: state.week, year: state.year };
  const avevaOv = !!agendaOverrideFor(id);
  try {
    if (item) {
      const { error } = await db.from('battle_plan_items').delete().eq('id', item.id);
      if (error) throw error;
      state.bpItems = state.bpItems.filter(i => i.id !== item.id);
    }
    const patch = {};
    if (c.pianificato_data) patch.pianificato_data = null;
    if (c.giorno_settimana) patch.giorno_settimana = null;
    if (Object.keys(patch).length) await patchCiclo(id, patch);
    if (avevaOv && state.agendaTableOk) await togliOverride(id, w);
    const blocco = !!c.calendar_event_id;
    if (blocco) { try { await togliBlocco(ciclo(id), true); } catch (e) { console.warn('[v37] blocco:', e.message); } }
    render();
    showToast(`Rimessa in Da pianificare${blocco ? ' · tolta anche dall\'agenda' : ''}`, 'success', { annulla: async () => {
      await patchCiclo(id, prima);
      if (item) { const { data } = await db.from('battle_plan_items').insert(item).select(); state.bpItems = [...state.bpItems, (data && data[0]) || item]; }
      if (avevaOv && item && item.giorno && item.giorno !== 'settimana') await upsertOverride(id, w, item.giorno, item.fascia || c.fascia_oraria || 'mattina');
      render();
    } });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}
AZIONI['q-dapiano'] = (el, id) => { chiudiMenu(); v37RimettiDaPianificare(id || el.dataset.id); };
const _apriMenuV37 = apriMenu;
apriMenu = function (btn, id, data) {
  _apriMenuV37.apply(this, arguments);
  try {
    const c = ciclo(id), m = $('rigaMenu');
    if (!v37Pianificata(c) || siRipete(c) || isGiornaliero(c)) return;
    const q = m.querySelector('[data-act="q-quando"]');
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.act = 'q-dapiano'; b.dataset.id = id;
    b.innerHTML = '<i class="ti ti-inbox"></i>Rimetti in Da pianificare';
    (q || m.lastElementChild).after(b);
    // il menu è cresciuto: se esce sotto, va sopra
    const r = btn.getBoundingClientRect(), mh = m.offsetHeight;
    m.style.top = (r.bottom + mh + 8 > window.innerHeight ? Math.max(8, r.top - mh - 4) : r.bottom + 4) + 'px';
  } catch (e) { console.warn('[v37] menu:', e.message); }
};
// trascinare sulla colonna Da pianificare (prima dei gestori della board, che la rifiutano)
window.addEventListener('dragover', e => {
  if (!_bDrag || _bDrag.tipo !== 'cosa') return;
  const z = zonaSotto(e.target);
  if (!z || z.dataset.zona !== 'dapiano') return;
  const it = document.querySelector(`.board .item[data-id="${_bDrag.id}"]`);
  if (it && it.closest('.bzona') && it.closest('.bzona').dataset.zona === 'dapiano') return;
  e.preventDefault(); e.stopImmediatePropagation();
  document.querySelectorAll('.bzona.drag-over').forEach(x => { if (x !== z) x.classList.remove('drag-over'); });
  z.classList.add('drag-over');
}, true);
window.addEventListener('drop', e => {
  if (!_bDrag || _bDrag.tipo !== 'cosa') return;
  const z = zonaSotto(e.target);
  if (!z || z.dataset.zona !== 'dapiano') return;
  const id = _bDrag.id, it = document.querySelector(`.board .item[data-id="${id}"]`);
  if (it && it.closest('.bzona') && it.closest('.bzona').dataset.zona === 'dapiano') return;
  e.preventDefault(); e.stopImmediatePropagation();
  _bDrag = null;
  rimandaRender(false);
  z.classList.remove('drag-over');
  v37RimettiDaPianificare(id);
}, true);

// ══════════════════════════════════════════════════════════════
