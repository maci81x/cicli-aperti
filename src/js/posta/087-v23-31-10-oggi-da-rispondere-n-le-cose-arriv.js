// v23 · 31/10 · OGGI: «DA RISPONDERE (N)» — le cose arrivate dalla posta che aspettano una tua risposta
// Stessa lista del promemoria «Da rispondere» che il giro della posta mette a calendario ogni mattina:
// cose aperte con fonte 'posta', tipo da_fare o preventivo e Subito (q1). Si chiude col tasto Fatta, come ovunque.
// ══════════════════════════════════════════════════════════════
function v23DaRispondere() {
  return state.cicli.filter(c => isAttivo(c) && vedi(c.ctx) && c.fonte === 'posta'
      && (c.posta_tipo === 'da_fare' || c.posta_tipo === 'preventivo') && computeEffectiveQ(c) === 1)
    .sort((a, b) => String(a.due_date || '9').localeCompare(String(b.due_date || '9')) || String(a.posta_ultima_at || '').localeCompare(String(b.posta_ultima_at || '')));
}
function v23Cliente(c) { return String(c.title || '').split(/\s[–:-]\s|:\s|\s\(/)[0].trim(); }
function v23Blocco() {
  const lista = v23DaRispondere();
  if (!lista.length) return '';
  const aperto = !!ui.v23Aperto;
  const iso = toISODate(oggiData());
  const scadute = lista.filter(c => c.due_date && getDaysLeft(c.due_date) < 0).length;
  const nomi = [...new Set(lista.map(v23Cliente))];
  const sotto = aperto ? '' : `<span class="v23-nomi">${escHtml(nomi.slice(0, 4).join(', '))}${nomi.length > 4 ? ` e altri ${nomi.length - 4}` : ''}</span>`;
  const righe = aperto ? `<div class="group v23-righe">${lista.map(c => riga({ c, fatto: false }, { data: iso })).join('')}</div>` : '';
  return `<section class="v23-posta${aperto ? ' aperto' : ''}" aria-label="Da rispondere">
    <button type="button" class="v23-h" data-act="v23-apri" aria-expanded="${aperto}">
      <i class="ti ti-mail-exclamation"></i>
      <span class="v23-t"><b>Da rispondere <span class="mono">(${lista.length})</span></b>${scadute ? `<span class="ritardo">${scadute === 1 ? '1 scaduta' : scadute + ' scadute'}</span>` : ''}${sotto}</span>
      <i class="ti ti-chevron-${aperto ? 'up' : 'down'}"></i>
    </button>${righe}</section>`;
}
AZIONI['v23-apri'] = () => { ui.v23Aperto = !ui.v23Aperto; render(); };

// ══════════════════════════════════════════════════════════════
