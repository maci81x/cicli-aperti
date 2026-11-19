// v2 · PRIMA APERTURA
// ══════════════════════════════════════════════════════════════
function onbApri() { const o = $('onb'); o.hidden = false; $('onb-track').scrollLeft = 0; onbAggiorna(); }
function onbIndice() { const t = $('onb-track'); return Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); }
function onbAggiorna() {
  const i = onbIndice();
  [...$('onb-dots').children].forEach((d, k) => d.classList.toggle('on', k === i));
  $('onb-avanti').textContent = i >= ONB_ULTIMA ? 'Crea la tua prima cosa' : 'Avanti';
}
const ONB_ULTIMA = 3;   // l'ultima pagina chiede «semplice o completa?» (predefinita: completa)
function onbChiudi(crea) {
  localStorage.setItem(LS2.ONB, '1');
  $('onb').hidden = true;
  if (crea) impostaSemplice(ui.onbModo === 'semplice');   // «Salta» non cambia la versione
  vai('oggi');   // dopo l'introduzione si parte sempre da Oggi
  if (crea) setTimeout(() => apriRapido(), 150);
}
function onbAvanti() {
  const t = $('onb-track'), i = onbIndice();
  if (i >= ONB_ULTIMA) { onbChiudi(true); return; }
  t.scrollTo({ left: (i + 1) * t.clientWidth, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════════
