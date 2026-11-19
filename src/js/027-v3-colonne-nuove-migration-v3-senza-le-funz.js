// v3 · COLONNE NUOVE (migration v3): senza, le funzioni che ne dipendono si spengono
// ══════════════════════════════════════════════════════════════
async function rilevaColonneV3() {
  const prova = async (tabella, colonne) => {
    try { const { error } = await db.from(tabella).select(colonne).limit(1); return !error; } catch (_) { return false; }
  };
  [state.focusColOk, state.delegaColsOk] = await Promise.all([
    prova('battle_plan_items', 'id,in_focus'),
    prova('cicli', 'id,delega_persona_id,delega_controllo')
  ]);
  render();
}

const LS3 = { SEMPLICE: 'modo_semplice', TESTO: 'testo_scala', CONTRASTO: 'contrasto', FOCUS: 'focus_date',
  PIANO_GIORNO: 'piano_giorno', PIANO_ORA: 'piano_ora', PIANO_CHIUSO: 'banner_piano_chiuso' };
const lsLeggi = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const lsScrivi = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) {} };
function modoSemplice() { return lsLeggi(LS3.SEMPLICE) === '1'; }
const dataPiu = n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const fmtGgMm = iso => { const d = parseISODate(iso); return d ? `${d.getDate()}/${d.getMonth() + 1}` : ''; };

// ══════════════════════════════════════════════════════════════
