// v4 · CUSCINETTI: nel wizard, Riempi, Urgenza arrivata
// ══════════════════════════════════════════════════════════════
let _cuscN = 0;
function bpwAggiungiCusc(giorno, quando, silenzioso) {
  _bpwCusc.set('n' + (++_cuscN), { id: null, giorno, ora: quando === 'fine' ? CUSC.FINE : CUSC.META, durata: CUSC.DURATA });
  if (!silenzioso) bpwRenderStep2();
}
function bpwCambiaCusc(k, patch) {
  const v = _bpwCusc.get(k);
  if (!v) return;
  _bpwCusc.set(k, { ...v, ...patch });
  bpwRenderStep2();
}
async function bpwSalvaCuscinetti(planId, ordineBase) {
  let n = ordineBase;
  for (const v of _bpwCusc.values()) {
    const campiCusc = { giorno: v.giorno, fascia: fasciaDi(null, v.ora), ora_prevista: v.ora, durata_prevista: v.durata };
    const { error } = v.id
      ? await db.from('battle_plan_items').update(campiCusc).eq('id', v.id)
      : await db.from('battle_plan_items').insert({ ...campiCusc, battle_plan_id: planId, ciclo_id: null, tipo_slot: 'cuscinetto', completato: false, ordine: n++ });
    if (error) throw error;
  }
}

// La settimana di riferimento per il 130 %: l'ultima prima di quella del wizard già finita (o chiusa) con un piano.
async function bpwCaricaRiferimento(week, year) {
  if (!state.bpTableOk) return;
  try {
    const inizio = getWeekStart(week, year), cur = bpSettimanaCorrente(), oggiSett = getWeekStart(cur.week, cur.year);
    const { data, error } = await db.from('battle_plan').select(`id,settimana,anno,stato,${state.statsColOk ? 'pianificate,completate,percentuale,' : ''}battle_plan_items(ciclo_id,completato)`)
      .order('anno', { ascending: false }).order('settimana', { ascending: false }).limit(20);
    if (error) throw error;
    let rif = null;
    for (const p of data || []) {
      const d = getWeekStart(p.settimana, p.anno);
      if (d >= inizio || (p.stato !== 'chiuso' && d >= oggiSett)) continue;
      const items = (p.battle_plan_items || []).filter(i => { const c = ciclo(i.ciclo_id); return !!c; });
      const st = items.length ? bpStats(items) : p.pianificate ? { tot: p.pianificate, done: p.completate || 0, pct: p.percentuale || 0 } : null;
      if (!st || !st.tot) continue;
      const dopo = bpSettimanaSuccessiva(p.settimana, p.anno);
      rif = { etichetta: dopo.week === week && dopo.year === year ? 'La settimana scorsa' : `Nella settimana ${p.settimana}`, fatte: st.done, tot: st.tot, pct: st.pct };
      break;
    }
    if (_bpwWeek !== week || _bpwYear !== year) return;
    _bpwRif = rif || { tot: 0 };
    if (_bpwStep <= 2) bpwRenderSummary();
  } catch (e) { console.warn('[Wizard] settimana di riferimento:', e.message); }
}

// Riempi: 3 cose che stanno nel tempo del cuscinetto. Prima le Subito, poi le Importanti senza data, poi le rapide.
function candidatiRiempi(item) {
  const min = bpDurata(item);
  const giaOggi = new Set(righeGiorno(item.giorno).map(r => r.c.id));
  const base = state.cicli.filter(c => isAttivo(c) && !isGiornaliero(c) && !haPassiAperti(c)
    && !giaOggi.has(c.id) && (c.durata_minuti || BP_DURATA_DEFAULT) <= min);
  const ordinate = [
    ...base.filter(c => computeEffectiveQ(c) === 1).sort((a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999'))),
    ...base.filter(c => computeEffectiveQ(c) === 2 && !haPianificazione(c)),
    ...base.filter(c => eRapida(c, null))
  ];
  return [...new Set(ordinate)].slice(0, 3);
}
function apriRiempi(itemId) {
  const item = state.bpItems.find(i => i.id === itemId);
  if (!item) return;
  ui.riempi = itemId;
  const ora = bpOra(item) || CUSC.META;
  $('riempi-sub').innerHTML = `Cuscinetto delle <span class="mono">${ora}</span> · <span class="mono">${fmtTempo(bpDurata(item))}</span>`;
  const lista = candidatiRiempi(item);
  $('riempi-lista').innerHTML = lista.length ? lista.map(c => {
    const q = computeEffectiveQ(c);
    return `<button type="button" class="riga-link" data-act="riempi-scegli" data-id="${c.id}"><i class="ti ${TIPI[q].icon}"></i>
      <span>${escHtml(c.title)}<small>${TIPI[q].label} · ${formatDurata(c.durata_minuti || BP_DURATA_DEFAULT)}${c.durata_minuti ? '' : ' (stimata)'}</small></span><span></span><i class="ti ti-chevron-right"></i></button>`;
  }).join('') : `<div class="col-vuota">Niente che stia in ${fmtTempo(bpDurata(item))}. Tienilo libero: arriverà qualcosa.</div>`;
  $('riempiOverlay').classList.add('open');
}
// La cosa entra nel piano al posto del cuscinetto (stessa riga: ciclo_id = la cosa). Se era già nel piano, la vecchia riga va via.
async function riempiCuscinetto(itemId, cicloId) {
  const item = state.bpItems.find(i => i.id === itemId), c = ciclo(cicloId);
  if (!item || !c) return;
  const vecchia = state.bpItems.find(i => i.ciclo_id === cicloId && i.battle_plan_id === item.battle_plan_id) || null;
  const idx = GIORNI.findIndex(g => g.key === item.giorno);
  const w = { week: state.week, year: state.year };
  const prima = campi(c, ['giorno_settimana', 'fascia_oraria', 'pianificato_data', 'parcheggiato', 'parcheggiato_at']);
  const ovPrima = state.agendaOverrides.find(o => o.ciclo_id === cicloId && o.settimana === w.week && o.anno === w.year) || null;
  try {
    if (vecchia) { const { error } = await db.from('battle_plan_items').delete().eq('id', vecchia.id); if (error) throw error; }
    const { error } = await db.from('battle_plan_items').update({ ciclo_id: cicloId }).eq('id', itemId);
    if (error) throw error;
    state.bpItems = state.bpItems.filter(i => !vecchia || i.id !== vecchia.id).map(i => i.id === itemId ? { ...i, ciclo_id: cicloId } : i);
    if (idx >= 0 && ripetizioneDi(c) === 'nessuna') await pianificaInData(c, dataDelGiorno(idx), item.fascia || fasciaDi(null, bpOra(item)));
    closeModal('riempiOverlay');
    render();
    aggiornaBlocco(cicloId);
    showToast(`Nel cuscinetto delle ${bpOra(item)}: ${c.title}`, 'success', { annulla: async () => {
      await db.from('battle_plan_items').update({ ciclo_id: null }).eq('id', itemId);
      if (vecchia) await db.from('battle_plan_items').insert(vecchia);
      if (ripetizioneDi(c) === 'nessuna') {
        await patchCiclo(cicloId, prima);
        if (ovPrima) await upsertOverride(cicloId, w, ovPrima.giorno_settimana, ovPrima.fascia_oraria); else await togliOverride(cicloId, w);
      }
      await loadBattlePlan();
    } });
  } catch (e) { showToast('Non riesco a riempire il cuscinetto: ' + e.message, 'error'); await loadBattlePlan(); render(); }
}
// Urgenza arrivata: il «+» con Subito acceso e il cuscinetto già scelto. La cosa nuova lo riempie.
function apriUrgenza(itemId) {
  apriRapido();
  ui.rapido = { ...ui.rapido, subito: true, cusc: itemId };
  disegnaRapido();
}

// ══════════════════════════════════════════════════════════════
