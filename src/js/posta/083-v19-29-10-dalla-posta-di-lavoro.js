// v19 · 29/10 · DALLA POSTA DI LAVORO
// Le cose create dal controllo della posta (r.macinai@) portano l'etichetta «Posta · Preventivo/Report/…»;
// nel dettaglio: che tipo è, l'ultima mail e i tasti per aprire le mail in Gmail.
// ══════════════════════════════════════════════════════════════
const POSTA_TIPI = {
  da_leggere: { l: 'Da leggere', i: 'ti-mail-opened' },
  da_fare: { l: 'Da fare', i: 'ti-mail-forward' },
  preventivo: { l: 'Preventivo', i: 'ti-file-invoice' },
  report: { l: 'Report', i: 'ti-report-analytics' },
  correggere_report: { l: 'Report da correggere', i: 'ti-pencil' }
};
const daPosta = c => !!(c && (c.fonte === 'posta' || (Array.isArray(c.posta_thread) && c.posta_thread.length)));
const linkMail = id => `https://mail.google.com/mail/?authuser=r.macinai%40sisoluzioniimpresa.it#all/${encodeURIComponent(id)}`;
const tagPosta = c => `<span class="tag-posta" title="Dalla posta di lavoro"><i class="ti ti-mail" aria-hidden="true"></i>${(POSTA_TIPI[c.posta_tipo] || {}).l || 'Posta'}</span>`;
const _apriDettaglioV19 = apriDettaglio;
apriDettaglio = function (id) {
  const r = _apriDettaglioV19.apply(this, arguments);
  const c = ciclo(id), vecchio = $('det-posta');
  if (vecchio) vecchio.remove();
  const nota = $('f-note');
  if (nota) nota.style.height = '';
  if (!c || !daPosta(c) || !nota) return r;
  const t = POSTA_TIPI[c.posta_tipo] || { l: 'Dalla posta', i: 'ti-mail' };
  const ids = (c.posta_thread || []).filter(Boolean);
  const quando = c.posta_ultima_at ? new Date(c.posta_ultima_at) : null;
  const dove = $('det-azioni') || (nota.previousElementSibling && nota.previousElementSibling.matches('label') ? nota.previousElementSibling : nota);
  const testo = String(c.note || '').replace(/^📧 Dalla posta di lavoro · /, '');
  dove.insertAdjacentHTML(dove.id === 'det-azioni' ? 'afterend' : 'beforebegin', `<div id="det-posta" class="det-box det-posta">
    <p class="det-posta-testa"><i class="ti ${t.i}" aria-hidden="true"></i><b>${c.fonte === 'posta' ? t.l : 'Aggiornata dalla posta'}</b>${quando ? `<span class="t-caption muted">ultima mail ${quando.getDate()}/${quando.getMonth() + 1} ${String(quando.getHours()).padStart(2, '0')}:${String(quando.getMinutes()).padStart(2, '0')}</span>` : ''}</p>
    <div class="det-posta-link">${ids.map((x, i) => `<a class="btn btn-secondary btn-sm" href="${esc(linkMail(x))}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i>${ids.length > 1 ? `Mail ${i + 1}` : 'Apri la mail'}</a>`).join('')}</div>
    <div class="det-posta-nota">${escHtml(testo)}</div>
    <p class="t-caption muted">Per correggerla: il campo Note più sotto.</p></div>`);
  setTimeout(() => { if (nota.offsetParent) nota.style.height = Math.min(520, Math.max(120, nota.scrollHeight + 4)) + 'px'; }, 0);
  return r;
};

// ══════════════════════════════════════════════════════════════
