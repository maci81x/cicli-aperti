// ══════════════════════════════════════════════════════════════
// 24/10 · «COPIA ERRORI» in Altro → Impostazioni (gli errori li raccoglie lo script in testa alla pagina)
// ══════════════════════════════════════════════════════════════
const ERRORI_LS = 'cicli_errori';
function erroriSalvati() { try { const l = JSON.parse(localStorage.getItem(ERRORI_LS) || '[]'); return Array.isArray(l) ? l : []; } catch (_) { return []; } }
function testoErrori() {
  const l = erroriSalvati();
  if (!l.length) return 'Nessun errore registrato.';
  return l.map(e => [e.t, e.tipo, e.msg, e.dove, e.schermo].filter(Boolean).join(' · ')).join('\n') + '\n' + (l[l.length - 1].ua || '');
}
ui.erroriTesto = false;
function sezioneErrori() {
  const n = erroriSalvati().length;
  return `<p class="list-head"><span>Problemi</span><span class="mono">${n}</span></p>
    <div class="group"><button type="button" class="riga-link" data-act="errori-copia"><i class="ti ti-bug"></i><span>Copia errori<small>${n ? plurale(n, 'errore registrato', 'errori registrati') + ' su questo dispositivo' : 'Nessun errore registrato'}</small></span><span></span><i class="ti ti-copy"></i></button>
    ${ui.erroriTesto ? `<div class="riga-link" style="grid-template-columns:minmax(0,1fr)"><textarea class="input" id="errori-testo" rows="8" readonly aria-label="Errori registrati" style="min-height:160px;font-size:12px;line-height:16px">${escHtml(testoErrori())}</textarea></div>` : ''}</div>`;
}
AZIONI['errori-copia'] = async () => {
  const t = testoErrori();
  try {
    await navigator.clipboard.writeText(t);
    showToast(erroriSalvati().length ? 'Errori copiati: incollali in un messaggio' : 'Nessun errore da copiare', 'success');
  } catch (_) {
    ui.erroriTesto = true;
    render();
    setTimeout(() => { const ta = $('errori-testo'); if (ta) { ta.focus(); ta.select(); } }, 50);
    showToast('Selezionali nel riquadro e copia', 'info');
  }
};
const _vistaImpostazioniErr = vistaImpostazioni;
vistaImpostazioni = function () { return _vistaImpostazioniErr.apply(this, arguments) + sezioneErrori(); };

// ══════════════════════════════════════════════════════════════
// 25/10 · I 18 PRINCIPI (Ruggeri) NELL'APP
// A · Mete e «dire no» (12, 16, 5) · B · Tempo per il futuro 25–30% (1, 6, 7, 17)
// C · Fallo subito e specifico (4, 2) · D · Sera, deleghe, demotivazione (3, 9, 10, 11)
// Tabelle nuove (additive): mete, non_doppioni; colonna cicli.meta_id. Se mancano, le funzioni si spengono.
// ══════════════════════════════════════════════════════════════
const PRINC = {
  METE_MIN: 7, METE_MAX: 10, METE_FERMA_GG: 28,
  FUTURO_MIN: 25, FUTURO_MAX: 30, GIORNI_LAV: 5,
  BREVE_MIN: 5, TIMER_MS: 5 * 60 * 1000,
  SERA_DA: '18:30', DOMANI_ORA: '18:45', DOMANI_FINE: '18:50',
  DELEGHE_GG: 60, DELEGHE_PERSONA: 3, DELEGHE_COSA: 2, DELEGHE_OK_GG: 30,
  SPINTA_NON_FATTE: 0.4, SPINTA_RINVIATE: 3,
  LS: { METE_CARD: 'mete_card_sett', METE_CHIUDI: 'mete_chiudi_chiesto', NON_DOPP_MIGR: 'non_doppioni_migrati', SPEC_OK: 'specifiche_ok',
    SERA: 'sera_piano_fatto', DELEGHE_OK: 'deleghe_ok' }
};
state.mete = null;          // null = non lette (o tabella assente)
state.meteOk = undefined;   // tabella mete
state.metaColOk = undefined; // colonna cicli.meta_id
state.nonDopp = new Set();
state.nonDoppOk = undefined;

async function rilevaPrincipi() {
  const prova = async (tabella, colonne) => { try { const { error } = await db.from(tabella).select(colonne).limit(1); return !error; } catch (_) { return false; } };
  [state.meteOk, state.metaColOk] = await Promise.all([prova('mete', 'id,testo,area,entro,ordine,raggiunta'), prova('cicli', 'id,meta_id')]);
  if (state.meteOk) await caricaMete();
  await caricaNonDoppioni();
  render();
}
async function caricaMete() {
  try {
    const { data, error } = await db.from('mete').select('*').order('ordine', { ascending: true });
    if (error) throw error;
    state.mete = ordinaMete(data || []);
  } catch (e) { console.warn('[Mete] lettura:', e.message); state.meteOk = false; state.mete = null; }
}
const ordinaMete = l => l.slice().sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
const meteTutte = () => state.meteOk && Array.isArray(state.mete) ? state.mete : [];
const meteAperte = () => meteTutte().filter(m => !m.raggiunta);
const metaPerId = id => id ? meteTutte().find(m => String(m.id) === String(id)) || null : null;
const metaDi = c => c && state.metaColOk ? metaPerId(c.meta_id) : null;
const corta = (t, n) => { const s = String(t || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

// ─── «Non sono doppioni»: tabella non_doppioni, localStorage come riserva ───
async function caricaNonDoppioni() {
  try {
    const { data, error } = await db.from('non_doppioni').select('chiave');
    if (error) throw error;
    state.nonDoppOk = true;
    state.nonDopp = new Set((data || []).map(r => r.chiave).filter(Boolean));
  } catch (e) { state.nonDoppOk = false; console.warn('[Doppioni] tabella non_doppioni:', e.message); return; }
  // una volta: le scelte già fatte su questo dispositivo vanno nella tabella
  if (lsLeggi(PRINC.LS.NON_DOPP_MIGR) !== '1') {
    const locali = leggiJson(DOPP.LS_NO, []).filter(k => k && !state.nonDopp.has(k));
    try {
      if (locali.length) {
        const { error } = await db.from('non_doppioni').upsert(locali.map(chiave => ({ chiave })), { onConflict: 'chiave' });
        if (error) throw error;
        locali.forEach(k => state.nonDopp.add(k));
      }
      lsScrivi(PRINC.LS.NON_DOPP_MIGR, '1');
    } catch (e) { console.warn('[Doppioni] migrazione:', e.message); }
  }
  scriviJson(DOPP.LS_NO, unici([...leggiJson(DOPP.LS_NO, []), ...state.nonDopp]));   // la copia locale resta allineata
}
function gruppiAperti() {
  const no = new Set([...doppioniNo(), ...state.nonDopp]);
  return gruppiDoppioni(coseAperteDopp(), nomiNoti()).filter(g => !no.has(g.chiave));
}
AZIONI['dopp-no'] = async el => {
  const k = el.dataset.k;
  scriviJson(DOPP.LS_NO, unici([...doppioniNo(), k]));
  state.nonDopp = new Set([...state.nonDopp, k]);
  render();
  if (state.nonDoppOk) {
    try { const { error } = await db.from('non_doppioni').upsert({ chiave: k }, { onConflict: 'chiave' }); if (error) throw error; }
    catch (e) { console.warn('[Doppioni] salvataggio:', e.message); }
  }
  showToast('Non te li propongo più', 'info', { annulla: async () => {
    scriviJson(DOPP.LS_NO, doppioniNo().filter(x => x !== k));
    const s = new Set(state.nonDopp); s.delete(k); state.nonDopp = s;
    if (state.nonDoppOk) { try { await db.from('non_doppioni').delete().eq('chiave', k); } catch (e) { console.warn('[Doppioni] annulla:', e.message); } }
    render();
  } });
};

