// v46 · sul telefono, in Pianifica › Settimana: scorrendo resta in alto la settimana (‹ ›) con la fila dei giorni
function v46BarraTel(bar) {
  const days = document.querySelector('#view .days');
  if (!days || ui.sub || ui.pian !== 'settimana') { bar.classList.remove('su'); return; }
  const top = document.querySelector('.top'), tb = top ? top.getBoundingClientRect() : null;
  const pos = top ? getComputedStyle(top).position : 'static';
  const limite = tb && tb.bottom > 0 && pos !== 'static' && pos !== 'relative' ? tb.bottom : 0;
  if (days.getBoundingClientRect().bottom > limite + 4) { bar.classList.remove('su'); return; }
  const da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(a.getDate() + 6);
  bar.style.top = Math.round(limite) + 'px'; bar.style.left = '0px'; bar.style.width = '100%';
  bar.innerHTML = `<div class="v44-riga1" style="padding:6px 12px 2px"><button type="button" class="btn btn-icon" data-act="sett" data-dir="-1" aria-label="Settimana prima"><i class="ti ti-chevron-left"></i></button>
    <b style="flex:1;text-align:center">${eSettimanaCorrente() ? 'Questa settimana' : 'Settimana ' + state.week} <span class="mono" style="font-weight:500;font-size:12px">${fmtGgMm(toISODate(da))} – ${fmtGgMm(toISODate(a))}</span></b>
    <button type="button" class="btn btn-icon" data-act="sett" data-dir="1" aria-label="Settimana dopo"><i class="ti ti-chevron-right"></i></button></div>
    <div class="days v46-days" style="${days.getAttribute('style') || ''};padding:0 12px 6px">${days.innerHTML}</div>`;
  bar.classList.add('su'); bar.removeAttribute('aria-hidden');
}

// ══════════════════════════════════════════════════════════════
