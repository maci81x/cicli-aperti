// ══════════════════════════════════════════════════════════════
// CATEGORIE CUSTOM
// ══════════════════════════════════════════════════════════════
const CAT_EMOJIS_LIST = ['','','','','','','','','','','','','','','','','','','','','','','','','','','','','',''];
let _catFormCtx = 'lavoro';
let _catFormEmoji = '';
let _catEditId = null;





async function deleteCat(id) {
  if (!confirm('Eliminare questa categoria?')) return;
  try {
    const { error } = await db.from('categorie').delete().eq('id', id);
    if (error) throw error;
    showToast('Categoria eliminata', 'info');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}


