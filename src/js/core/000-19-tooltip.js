// ══════════════════════════════════════════════════════════════
// TOOLTIP
// ══════════════════════════════════════════════════════════════
let _tipTimer = null;
const _tip = () => document.getElementById('tooltip');

// Solo con un mouse vero: su telefono (hover: none) o dopo un tocco il tooltip non compare,
// e si chiude da solo se l'elemento sparisce (cambio vista), al tocco altrove, scorrendo o con un tasto.
const _hoverVero = () => !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
let _ultimoPuntatore = 'mouse', _tipAncora = null, _tipControllo = null;
function nascondiTip() {
  clearTimeout(_tipTimer); clearInterval(_tipControllo); _tipControllo = null; _tipAncora = null;
  const tip = _tip(); if (tip) tip.classList.remove('visible');
}
document.addEventListener('pointerdown', e => { _ultimoPuntatore = e.pointerType || 'mouse'; nascondiTip(); }, true);
document.addEventListener('touchstart', () => { _ultimoPuntatore = 'touch'; nascondiTip(); }, { capture: true, passive: true });
document.addEventListener('keydown', nascondiTip, true);
document.addEventListener('scroll', nascondiTip, { capture: true, passive: true });
window.addEventListener('resize', nascondiTip);
window.addEventListener('blur', nascondiTip);

document.addEventListener('mouseover', e => {
  const el = e.target.closest('[data-tip]');
  if (!el) return;
  clearTimeout(_tipTimer);
  if (!_hoverVero() || _ultimoPuntatore !== 'mouse') return;
  _tipTimer = setTimeout(() => {
    const tip = _tip(); if (!tip || !el.isConnected || !el.matches(':hover')) return;
    tip.textContent = el.dataset.tip;
    tip.classList.add('visible');
    positionTooltip(tip, el);
    _tipAncora = el;
    clearInterval(_tipControllo);
    _tipControllo = setInterval(() => { if (!_tipAncora || !_tipAncora.isConnected || !_tipAncora.matches(':hover')) nascondiTip(); }, 300);
  }, 400);
});

document.addEventListener('mouseout', e => {
  const el = e.target.closest('[data-tip]');
  if (!el) return;
  nascondiTip();
});

function positionTooltip(tip, anchor) {
  const r = anchor.getBoundingClientRect();
  const tw = 240, th = 60;
  let left = r.right + 10;
  let top  = r.top + (r.height - th) / 2;
  if (left + tw > window.innerWidth - 8)  left = r.left - tw - 10;
  if (left < 8) left = 8;
  if (top < 8)  top  = 8;
  if (top + th > window.innerHeight - 8)  top = window.innerHeight - th - 8;
  tip.style.left = left + 'px';
  tip.style.top  = top  + 'px';
}

