// v44 · 17/11 — Pianifica sul computer: scorrendo in giù resta in alto una barra con la settimana (‹ ›)
// e i nomi dei giorni allineati alle colonne. Si può trascinare una cosa (o un appuntamento) sul nome
// del giorno nella barra per metterla lì, senza risalire.
// ══════════════════════════════════════════════════════════════
const V44 = { el: null, raf: 0 };
function v44Barra() {
  if (!V44.el) {
    V44.el = document.createElement('div'); V44.el.id = 'v44-testa'; V44.el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(V44.el);
  }
  return V44.el;
}
function v44Aggiorna() {
  V44.raf = 0;
  const bar = v44Barra();
  if (ui.tab === 'pianifica' && window.innerWidth < 768) { v46BarraTel(bar); return; }
  const scorri = document.querySelector('#view .board-scorri'), cols = scorri && scorri.querySelector('.cols.board');
  if (!cols || ui.tab !== 'pianifica' || window.innerWidth < 768) { bar.classList.remove('su'); return; }
  const top = document.querySelector('.top');
  const tb = top ? top.getBoundingClientRect() : null;
  const limite = tb && tb.bottom > 0 && getComputedStyle(top).position !== 'static' && getComputedStyle(top).position !== 'relative' ? tb.bottom : 0;
  const testa = cols.querySelector('.bcol-h');
  const rc = cols.getBoundingClientRect(), rs = scorri.getBoundingClientRect();
  const sotto = testa && testa.getBoundingClientRect().bottom < limite + 4 && rc.bottom > limite + 140;
  if (!sotto) { bar.classList.remove('su'); return; }
  const da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(a.getDate() + 6);
  const giorni = [...cols.children].filter(x => x.classList && x.classList.contains('bcol'));
  const etich = giorni.map(sez => {
    const z = sez.querySelector('.bzona'); if (!z) return '';
    const q = sez.getBoundingClientRect(), k = z.dataset.zona;
    const left = q.left - rs.left, w = q.width;
    if (left + w < 0 || left > rs.width) return '';
    const h = sez.querySelector('.bcol-h');
    const nome = h ? h.querySelector('span') ? h.querySelector('span').textContent.trim() : h.textContent.trim() : k;
    const tempo = h && h.children[1] ? h.children[1].textContent.trim() : '';
    return `<div class="v44-g${sez.classList.contains('oggi') ? ' oggi' : ''}" data-v44-zona="${esc(k)}" style="left:${Math.round(left)}px;width:${Math.round(w)}px">${escHtml(nome)}<span class="mono">${escHtml(tempo)}</span></div>`;
  }).join('');
  bar.style.top = Math.round(limite) + 'px';
  bar.style.left = Math.round(rs.left) + 'px';
  bar.style.width = Math.round(rs.width) + 'px';
  bar.innerHTML = `<div class="v44-riga1"><button type="button" class="btn btn-icon" data-act="sett" data-dir="-1" aria-label="Settimana prima"><i class="ti ti-chevron-left"></i></button>
    <b>Settimana ${state.week}</b><span class="mono">${fmtGgMm(toISODate(da))} – ${fmtGgMm(toISODate(a))}</span>
    <button type="button" class="btn btn-icon" data-act="sett" data-dir="1" aria-label="Settimana dopo"><i class="ti ti-chevron-right"></i></button>
    ${eSettimanaCorrente() ? '' : '<button type="button" class="btn btn-ghost btn-sm" data-act="sett-oggi">Torna a questa settimana</button>'}
    <span style="flex:1"></span><span class="t-caption muted" style="padding-right:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">trascina una cosa sul giorno per spostarla lì</span></div>
    <div class="v44-giorni">${etich}</div>`;
  bar.classList.add('su');
  bar.removeAttribute('aria-hidden');
}
const v44Chiedi = () => { if (!V44.raf) V44.raf = requestAnimationFrame(v44Aggiorna); };
document.addEventListener('scroll', v44Chiedi, true);
window.addEventListener('resize', v44Chiedi);
// i bottoni della barra passano dalle stesse azioni della pagina
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#v44-testa [data-act]');
  if (!b || !AZIONI[b.dataset.act]) return;
  e.preventDefault(); e.stopPropagation();
  const act = b.dataset.act;
  AZIONI[act](b, b.dataset.id, b.dataset, e);
  if (act === 'giorno' || act === 'v21-passati') setTimeout(() => { const d = document.querySelector('#view .days'); if (d) d.scrollIntoView({ block: 'start' }); }, 80);
  setTimeout(v44Chiedi, 400);
}, true);
// trascinare sul nome del giorno (window in cattura: prima del rilascio della lavagna, che azzera il trascinamento)
window.addEventListener('dragover', e => {
  const g = e.target.closest && e.target.closest('#v44-testa [data-v44-zona]');
  document.querySelectorAll('#v44-testa .v44-g.sopra').forEach(x => { if (x !== g) x.classList.remove('sopra'); });
  if (!g || typeof _bDrag === 'undefined' || !_bDrag) return;
  if (_bDrag.tipo === 'evento' && g.dataset.v44Zona === 'settimana') return;
  e.preventDefault(); g.classList.add('sopra');
}, true);
window.addEventListener('drop', e => {
  const g = e.target.closest && e.target.closest('#v44-testa [data-v44-zona]');
  if (!g || !_bDrag) return;
  e.preventDefault(); e.stopPropagation();
  const d = _bDrag, zona = g.dataset.v44Zona; _bDrag = null;
  g.classList.remove('sopra'); rimandaRender(false);
  if (zona === 'dapiano') { if (d.tipo === 'cosa' && typeof v37RimettiDaPianificare === 'function') v37RimettiDaPianificare(d.id); return; }
  if (d.tipo === 'evento') { if (zona !== 'settimana') apriSpostaEvento(d.id, toISODate(giornoDi(state.week, state.year, zona))); return; }
  bordoSposta(d.id, zona);
}, true);
// mentre si trascina la barra resta: si ricalcola con il mouse
document.addEventListener('drag', () => v44Chiedi());

// ══════════════════════════════════════════════════════════════
