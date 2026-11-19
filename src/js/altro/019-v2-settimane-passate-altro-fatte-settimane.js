// v2 · SETTIMANE PASSATE (Altro → Fatte → Settimane)
// ══════════════════════════════════════════════════════════════
ui.fatte = 'cose';      // cose | settimane
ui.settimane = null;    // piani passati, letti quando si apre il tab

async function caricaSettimane() {
  ui.settimane = 'carico';
  try {
    const { data, error } = await db.from('battle_plan').select(`id,settimana,anno,stato,note,${state.statsColOk ? 'pianificate,completate,percentuale,' : ''}battle_plan_items(ciclo_id,completato)`)
      .order('anno', { ascending: false }).order('settimana', { ascending: false });
    if (error) throw error;
    const cur = bpSettimanaCorrente(), inizio = getWeekStart(cur.week, cur.year);
    ui.settimane = (data || []).filter(p => p.stato === 'chiuso' || getWeekStart(p.settimana, p.anno) < inizio).map(p => {
      const items = (p.battle_plan_items || []).filter(i => { const c = ciclo(i.ciclo_id); return !!c; });
      // senza righe (cose eliminate dopo) restano i numeri salvati alla chiusura
      if (!items.length && p.pianificate) return { ...p, tot: p.pianificate, done: p.completate || 0, pct: p.percentuale || 0 };
      return { ...p, ...bpStats(items) };
    });
  } catch (e) {
    ui.settimane = [];
    showToast('Non riesco a leggere le settimane: ' + e.message, 'error');
  }
  render();
}

// Settimane passate: in alto il trend, poi le barre delle ultime 8 settimane (% fatte), poi la tabella.
function fatteSettimane() {
  if (ui.settimane === null) { caricaSettimane(); return '<div class="skel"></div>'.repeat(3); }
  if (ui.settimane === 'carico') return '<div class="skel"></div>'.repeat(3);
  const lista = ui.settimane.filter(p => p.tot);
  if (!lista.length) return vuoto('ti-calendar-week', 'Nessuna settimana passata', 'Quando una settimana con un piano finisce, la ritrovi qui con quante cose hai fatto.');
  const [ultima, prima] = lista;
  const delta = prima ? ultima.pct - prima.pct : null;
  const trend = delta === null ? '' : `<p class="trend"><i class="ti ${delta > 0 ? 'ti-trending-up' : delta < 0 ? 'ti-trending-down' : 'ti-minus'}" aria-hidden="true"></i>Trend: <b class="mono">${delta > 0 ? '+' : ''}${delta}%</b> rispetto alla settimana scorsa</p>`;
  const righe = lista.map(p => {
    const da = getWeekStart(p.settimana, p.anno), a = new Date(da); a.setDate(da.getDate() + 6);
    return `<tr><td><button type="button" class="tab-link" data-act="vai-sett" data-w="${p.settimana}" data-y="${p.anno}">Settimana ${p.settimana}<small>${fmtCorta(da)} – ${fmtCorta(a)}${p.stato === 'chiuso' ? ' · chiusa' : ''}</small></button></td>
      <td class="mono">${p.tot}</td><td class="mono">${p.done}</td><td class="mono">${p.pct}%</td></tr>`;
  }).join('');
  return `${trend}${graficoSettimane(lista.slice(0, SETT.BARRE).reverse())}
    <div class="group"><table class="tab-sett"><thead><tr><th scope="col">Settimana</th><th scope="col">Pianificate</th><th scope="col">Fatte</th><th scope="col">%</th></tr></thead><tbody>${righe}</tbody></table></div>`;
}

// Barre alte al massimo 60px, una per settimana, dalla più vecchia alla più recente. La linea tratteggiata è l'80 %.
function graficoSettimane(lista) {
  const H = SETT.ALTEZZA, W = 100 / lista.length;
  const barre = lista.map((p, i) => {
    const h = Math.max(2, Math.round(p.pct / 100 * H));
    return `<g><title>Settimana ${p.settimana}: ${p.done} su ${p.tot} (${p.pct}%)</title>
      <rect x="${i * W + 1}%" y="0" width="${W - 2}%" height="${H}" fill="transparent" data-tip="Settimana ${p.settimana}: ${p.done} su ${p.tot} · ${p.pct}%"></rect>
      <svg x="${i * W}%" width="${W}%" height="${H}" overflow="visible"><g class="barra${i === lista.length - 1 ? ' ultima' : ''}"><rect x="50%" y="${H - h}" width="${SETT.BARRA}" height="${h}" rx="4" transform="translate(-${SETT.BARRA / 2} 0)"></rect>
        <rect x="50%" y="${H - Math.min(h, 4)}" width="${SETT.BARRA}" height="${Math.min(h, 4)}" transform="translate(-${SETT.BARRA / 2} 0)"></rect></g></svg></g>`;
  }).join('');
  const assi = lista.map((p, i) => `<span style="left:${i * W + W / 2}%">${p.settimana}</span>`).join('');
  const ultima = lista[lista.length - 1];
  return `<figure class="grafico-sett" aria-label="Percentuale di cose fatte nelle ultime ${lista.length} settimane">
    <div class="gs-area"><svg width="100%" height="${H}" aria-hidden="true">
      <line class="obiettivo" x1="0" x2="100%" y1="${H - H * BP_OBIETTIVO_PCT / 100}" y2="${H - H * BP_OBIETTIVO_PCT / 100}"></line>${barre}</svg>
      <span class="gs-80" style="top:${H - H * BP_OBIETTIVO_PCT / 100 - 8}px">80%</span></div>
    <div class="gs-assi" aria-hidden="true">${assi}</div>
    <figcaption class="t-caption muted">% di cose fatte, settimana per settimana · l'ultima: <b class="mono">${ultima.pct}%</b></figcaption></figure>`;
}

function vaiASettimana(week, year) {
  state.week = week; state.year = year;
  localStorage.setItem(LS.WEEK, state.week);
  ui.giorno = 0;
  vai('pianifica', { pian: 'settimana' });
  reloadWeekData().then(() => { caricaEventi(state.week, state.year); render(); });
}

// ══════════════════════════════════════════════════════════════
