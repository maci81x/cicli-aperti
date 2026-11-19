// v3 · FINE GIORNATA (dopo le 18): «Oggi N su M» · bella giornata · giorni di fila
// ══════════════════════════════════════════════════════════════
const FINE = { ORA: 18, SOGLIA: .8, SETTIMANE: 9 };
ui.serie = null;   // { giorno, n }
function fineGiornata(fatte, tot) {
  if (!tot || new Date().getHours() < FINE.ORA) return '';
  const bella = fatte / tot >= FINE.SOGLIA;
  if (bella && (!ui.serie || ui.serie.giorno !== oggiLocale())) caricaSerie();
  const serie = bella && ui.serie && ui.serie.n >= 2 ? ` · <b class="mono">${ui.serie.n}</b> giorni di fila` : '';
  return `<p class="fine-giornata">Oggi <b class="mono">${fatte}</b> su <b class="mono">${tot}</b>${bella ? ' · Bella giornata.' : ''}${serie}</p>`;
}
// Giorni consecutivi con almeno l'80 % del piano fatto (completato_at entro quel giorno).
// I giorni senza niente in programma non interrompono la serie.
async function caricaSerie() {
  const giorno = oggiLocale();
  ui.serie = { giorno, n: 0 };
  try {
    const cur = bpSettimanaCorrente(), inizio = getWeekStart(cur.week, cur.year);
    const limite = new Date(inizio); limite.setDate(limite.getDate() - 7 * FINE.SETTIMANE);
    const { data, error } = await db.from('battle_plan').select('settimana,anno,battle_plan_items(ciclo_id,giorno,completato,completato_at)');
    if (error) throw error;
    const perGiorno = new Map();
    (data || []).filter(p => getWeekStart(p.settimana, p.anno) >= limite).forEach(p => (p.battle_plan_items || []).forEach(i => {
      const idx = GIORNI.findIndex(g => g.key === i.giorno), c = ciclo(i.ciclo_id);
      if (idx < 0 || !c ) return;
      const iso = toISODate(bpDataGiorno(p.settimana, p.anno, idx));
      const v = perGiorno.get(iso) || { tot: 0, fatte: 0 };
      const fatta = i.completato && i.completato_at && toISODate(new Date(i.completato_at)) <= iso;
      perGiorno.set(iso, { tot: v.tot + 1, fatte: v.fatte + (fatta ? 1 : 0) });
    }));
    let n = 0;
    for (let k = 0; k < FINE.SETTIMANE * 7; k++) {
      const v = perGiorno.get(toISODate(dataPiu(-k)));
      if (!v || !v.tot) continue;
      if (v.fatte / v.tot < FINE.SOGLIA) break;
      n++;
    }
    ui.serie = { giorno, n };
    render();
  } catch (e) { console.warn('[Fine giornata] serie:', e.message); }
}

// ══════════════════════════════════════════════════════════════
