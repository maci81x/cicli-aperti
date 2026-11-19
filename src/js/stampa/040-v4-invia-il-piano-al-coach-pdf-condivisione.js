// v4 · INVIA IL PIANO AL COACH (PDF: condivisione su telefono, email altrove)
// ══════════════════════════════════════════════════════════════
function testoInvio(rp) {
  const da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(da.getDate() + 6);
  const righe = [`- ${plurale(rp.cose, 'cosa', 'cose')}, ${fmtTempo(rp.minuti)} previste`];
  if (rp.cuscinetti) righe.push(`- ${plurale(rp.cuscinetti, 'cuscinetto', 'cuscinetti')} per gli imprevisti (${fmtTempo(rp.minutiCusc)})`);
  if (rp.appuntamenti) righe.push(`- ${plurale(rp.appuntamenti, 'appuntamento', 'appuntamenti')} già in calendario`);
  return `Ciao,\n\necco il piano della settimana ${state.week} (${fmtCorta(da)} – ${fmtCorta(a)}).\n\n${righe.join('\n')}\n\nPDF in allegato.\n\n${nomeUtente()}`;
}
function apriInvia() {
  const pdf = creaPdfSettimana();
  if (!pdf) return;
  ui.invio = { ...pdf, week: state.week, year: state.year };
  const rp = pdf.riepilogo, da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(da.getDate() + 6);
  $('invia-sub').textContent = `Settimana ${state.week} · ${fmtCorta(da)} – ${fmtCorta(a)}`;
  $('invia-riepilogo').innerHTML = `<div class="bp-sum-pian">Pianificato: <b class="mono">${rp.cose}</b> ${rp.cose === 1 ? 'cosa' : 'cose'} / <b class="mono">${fmtTempo(rp.minuti)}</b></div>
    <div class="bp-sum-row"><span>Cuscinetti</span><strong>${rp.cuscinetti ? `${rp.cuscinetti} · ${fmtTempo(rp.minutiCusc)}` : '—'}</strong></div>
    <div class="bp-sum-row"><span>Appuntamenti in calendario</span><strong>${rp.appuntamenti || '—'}</strong></div>
    <div class="bp-sum-row"><span>Oggetto</span><strong class="invia-ogg">Piano settimana ${state.week} — ${escHtml(nomeUtente())}</strong></div>
    <div class="bp-sum-row"><span>In copia</span><strong class="invia-ogg">${escHtml(emailCC() || '—')}</strong></div>`;
  $('invia-email').value = emailCoach();
  const condividi = eTelefono() && !!navigator.canShare;
  $('invia-nota').textContent = condividi ? 'Si apre la condivisione del telefono con il PDF: scegli Mail o un\'altra app.' : 'Scarico il PDF e apro l\'email già scritta: allega il PDF prima di inviare.';
  $('invia-ok').innerHTML = `<i class="ti ti-send"></i>${condividi ? 'Condividi il PDF' : 'Scarica il PDF e scrivi l\'email'}`;
  $('invia-errore').hidden = true;
  $('inviaOverlay').classList.add('open');
}
async function inviaPiano() {
  const inv = ui.invio;
  if (!inv) return;
  const email = $('invia-email').value.trim();
  const errore = msg => { const e = $('invia-errore'); e.textContent = msg; e.hidden = false; };
  if (email && !EMAIL_OK.test(email)) { errore('Questa email non sembra giusta'); $('invia-email').focus(); return; }
  if (email) lsScrivi(LS4.COACH, email);
  const oggetto = `Piano settimana ${inv.week} — ${nomeUtente()}`, corpo = testoInvio(inv.riepilogo);
  const fatto = msg => { segnaInviato(inv.week, inv.year); closeModal('inviaOverlay'); render(); showToast(msg, 'success'); };
  let file = null;
  try { file = new File([inv.doc.output('blob')], inv.nome, { type: 'application/pdf' }); } catch (_) { file = null; }
  if (file && eTelefono() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: oggetto, text: corpo }); fatto('Piano condiviso'); return; }
    catch (e) { if (e && e.name === 'AbortError') return; console.warn('[Invia] condivisione:', e && e.message); }
  }
  if (!email) { errore('Scrivi l\'email del coach'); $('invia-email').focus(); return; }
  inv.doc.save(inv.nome);
  apriEmail(`mailto:${email}?subject=${encodeURIComponent(oggetto)}${emailCC() ? '&cc=' + encodeURIComponent(emailCC()) : ''}&body=${encodeURIComponent(corpo)}`);
  fatto('PDF scaricato: allegalo all\'email');
}
function apriEmail(url) { window.location.href = url; }
// Dal banner del venerdì: porta Pianifica sulla settimana dopo e apre l'invio.
async function inviaPianoProssima() {
  const cur = bpSettimanaCorrente(), n = bpSettimanaSuccessiva(cur.week, cur.year);
  state.week = n.week; state.year = n.year;
  localStorage.setItem(LS.WEEK, state.week);
  ui.giorno = 0;
  await reloadWeekData();
  await caricaEventi(state.week, state.year);
  vai('pianifica', { pian: 'settimana' });
  setTimeout(apriInvia, 200);
}

// ══════════════════════════════════════════════════════════════
