// v48 · 19/11 · PIÙ PRATICA: «Annulla» anche sugli spostamenti, giorni con un tocco (ore libere), PDF nei colori nuovi
// ══════════════════════════════════════════════════════════════
const V48 = { GIORNI: 8, PIENO_MIN: 30 };
// (1) fotografia di una cosa prima di spostarla, per poterla rimettere com'era
function v48Foto(id, w) {
  const c = ciclo(id);
  if (!c) return null;
  w = w || { week: state.week, year: state.year };
  const chiavi = [...(state.agendaColsOk ? ['giorno_settimana', 'fascia_oraria'] : []), ...(state.pianificaColsOk ? ['pianificato_data'] : []),
    ...(state.parcheggioColsOk ? ['parcheggiato', 'parcheggiato_at'] : [])];
  const stessa = w.week === state.week && w.year === state.year;
  const ov = (state.agendaOverrides || []).find(o => o.ciclo_id === id && o.settimana === w.week && o.anno === w.year) || null;
  const item = stessa && state.bp ? (state.bpItems || []).find(i => i.battle_plan_id === state.bp.id && i.ciclo_id === id) || null : null;
  return { id, w, campi: campi(c, chiavi), ov: ov ? { ...ov } : null, stessa, bpId: stessa && state.bp ? state.bp.id : null, item: item ? { id: item.id, giorno: item.giorno, fascia: item.fascia } : null };
}
async function v48Rimetti(f) {
  if (!f) return;
  if (Object.keys(f.campi).length) await patchCiclo(f.id, f.campi);
  if (state.agendaTableOk) {
    if (f.ov) await upsertOverride(f.id, f.w, f.ov.giorno_settimana, f.ov.fascia_oraria);
    else await togliOverride(f.id, f.w);
  }
  if (f.bpId) {
    const ora = (state.bpItems || []).find(i => i.battle_plan_id === f.bpId && i.ciclo_id === f.id);
    if (f.item && ora) {
      const { error } = await db.from('battle_plan_items').update({ giorno: f.item.giorno, fascia: f.item.fascia }).eq('id', ora.id);
      if (error) throw error;
      state.bpItems = state.bpItems.map(i => i.id === ora.id ? { ...i, giorno: f.item.giorno, fascia: f.item.fascia } : i);
    } else if (!f.item && ora) {                                      // non era nel piano: la riga aggiunta si toglie
      const { error } = await db.from('battle_plan_items').delete().eq('id', ora.id);
      if (error) throw error;
      state.bpItems = state.bpItems.filter(i => i.id !== ora.id);
    }
  }
  try { aggiornaBlocco(f.id); } catch (_) {}
  render();
}
// i messaggi verdi senza «Annulla» degli spostamenti si tacciono: il messaggio con «Annulla» lo dà v48
ui.v48Zitto = 0;
{
  const _st = showToast;
  showToast = function (msg, type, opz) {
    if (ui.v48Zitto && type === 'success' && !opz) return;
    return _st.apply(this, arguments);
  };
}
{
  const _bsV48 = bordoSposta;
  bordoSposta = async function (id, zona) {
    const c = ciclo(id);
    if (!c || zona === 'dapiano' || siRipete(c)) return _bsV48.apply(this, arguments);   // le ricorrenti chiedono «solo questa o tutte»
    const f = v48Foto(id);
    if (zona === 'settimana' && state.pianificaColsOk && c.pianificato_data) { try { await patchCiclo(id, { pianificato_data: null }); } catch (_) {} }
    let r;
    ui.v48Zitto++;
    try { r = await _bsV48.apply(this, arguments); } finally { ui.v48Zitto--; }
    const d = ciclo(id), item = state.bp ? (state.bpItems || []).find(i => i.battle_plan_id === state.bp.id && i.ciclo_id === id) : null;
    const mosso = d && f && (d.pianificato_data !== f.campi.pianificato_data || (item ? item.giorno : null) !== (f.item ? f.item.giorno : null));
    if (mosso) {
      const dove = zona === 'settimana' ? 'In settimana, senza giorno' : `Spostata a ${GIORNI_MAP[zona] ? GIORNI_MAP[zona].label.toLowerCase() : zona}`;
      showToast(`${dove}: ${corta(c.title, 40)}`, 'success', { annulla: () => v48Rimetti(f) });
    }
    return r;
  };
}
// (2) «Quando»: i prossimi giorni con un tocco, con le ore libere tolti gli appuntamenti
function v48Libere(d) {
  const g = d.getDay();
  if (g === 0 || g === 6) return { t: 'weekend', weekend: true };
  const w = isoWeekParts(d), tok = typeof isGcalTokenValid === 'function' && isGcalTokenValid();
  if (!ui.eventi[settKey(w.week, w.year)] && !tok) return { t: '' };   // v49 · senza accesso a Google valgono gli appuntamenti già in memoria
  if (!ui.eventi[settKey(w.week, w.year)]) { caricaEventi(w.week, w.year).then(() => v48Giorni()).catch(() => {}); return { t: '…' }; }
  let da = V31.DALLE;
  if (toISODate(d) === toISODate(oggiData())) da = Math.max(da, v31Ora());
  if (da >= V31.ALLE) return { t: 'finita', pieno: true };
  const lib = spaziLiberi(occupatiEventi(d), da, V31.ALLE).reduce((s, [x, y]) => s + y - x, 0);
  return lib < V48.PIENO_MIN ? { t: 'pieno', pieno: true } : { t: (lib < 60 ? lib + "'" : Math.floor(lib / 60) + 'h' + (lib % 60 ? String(lib % 60).padStart(2, '0') : '')) };
}
function v48Giorni() {
  const box = $('v48-giorni'), c = _pfCicloId ? ciclo(_pfCicloId) : null;
  if (!box) return;
  if (!c || siRipete(c) || isGiornaliero(c)) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  const oggi = oggiData(), oggiIso = toISODate(oggi);
  const cose = iso => state.cicli.filter(x => !x.done && !x.eliminato_at && !x.parent_id && x.pianificato_data === iso).length;
  const giorni = Array.from({ length: V48.GIORNI }, (_, i) => piuGiorni(oggi, i));
  box.innerHTML = `<span class="field-label">Mettila in un giorno <small>· sotto la data, le ore libere tolti gli appuntamenti</small></span>
    <div class="v48-giorni">${giorni.map((d, i) => {
      const iso = toISODate(d), l = v48Libere(d), n = cose(iso), su = c.pianificato_data === iso;
      const nome = i === 0 ? 'Oggi' : i === 1 ? 'Domani' : d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');
      return `<button type="button" class="v48-g${l.pieno ? ' pieno' : ''}${l.weekend ? ' we' : ''}${su ? ' su' : ''}" data-act="v48-giorno" data-iso="${iso}"${su ? ' aria-current="date"' : ''}
        aria-label="${escHtml(fmtGiorno(d))}${l.t ? ', ' + escHtml(l.t) : ''}${n ? ', ' + plurale(n, 'cosa', 'cose') : ''}">
        <span class="v48-n">${escHtml(nome)}</span><b>${d.getDate()}</b><span class="v48-l mono">${escHtml(l.t || ' ')}</span><span class="v48-c">${n ? plurale(n, 'cosa', 'cose') : ' '}</span></button>`;
    }).join('')}</div>`;
  void oggiIso;
}
{
  const campo = document.querySelector('#pianificaOverlay .pf-field');
  if (campo && !$('v48-giorni')) campo.insertAdjacentHTML('beforebegin', '<div class="pf-field" id="v48-giorni" hidden></div>');
  const _openPfV48 = openPianificaModal;
  openPianificaModal = function () { const r = _openPfV48.apply(this, arguments); v48Giorni(); return r; };
}
async function v48MettiIn(id, iso) {
  const c = ciclo(id), d = parseISODate(iso);
  if (!c || !d) return;
  closePianificaModal();
  const w = isoWeekParts(d);
  if (w.week === state.week && w.year === state.year) return bordoSposta(id, giornoKeyDi(d));   // con il piano e «Annulla»
  const f = v48Foto(id, w);
  try {
    await pianificaInData(c, d, null);
    render();
    try { aggiornaBlocco(id); } catch (_) {}
    showToast(`Spostata a ${fmtGiorno(d)}: ${corta(c.title, 40)}`, 'success', { annulla: () => v48Rimetti(f) });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}
AZIONI['v48-giorno'] = el => v48MettiIn(_pfCicloId, el.dataset.iso);
// ══════════════════════════════════════════════════════════════
