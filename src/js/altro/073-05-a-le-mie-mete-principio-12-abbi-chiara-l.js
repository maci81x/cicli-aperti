// ══════════════════════════════════════════════════════════════
// A · LE MIE METE (principio 12: abbi chiara la meta · 16: costruisci qualcosa · 5: impara a dire no)
// ══════════════════════════════════════════════════════════════
ui.metaEdit = null;
function cicliDiMeta(m) { return state.metaColOk ? state.cicli.filter(c => String(c.meta_id || '') === String(m.id)) : []; }
// l'ultima volta che qualcosa di questa meta era in programma o è stato fatto (ISO) — null se mai
function ultimaAttivitaMeta(m, extra) {
  const date = cicliDiMeta(m).flatMap(c => [c.pianificato_data, c.scheduled_date, c.done ? giornoIso(c.chiuso_at || c.updated_at) : null]).filter(Boolean);
  if (extra) date.push(...extra);
  return date.length ? date.sort().pop() : null;
}
// ferma = da 4 settimane niente (e la meta ha più di 4 settimane)
function metaFerma(m, extra) {
  if (m.raggiunta) return false;
  const limite = toISODate(piuGiorni(new Date(), -PRINC.METE_FERMA_GG));
  if (giornoIso(m.created_at || '') > limite) return false;
  const u = ultimaAttivitaMeta(m, extra);
  return !u || u < limite;
}
ui.meteRiordina = false;
const ICO_META = 'ti-flag';
function infoMeta(m) {
  const n = cicliDiMeta(m).filter(c => !c.done).length, fatte = cicliDiMeta(m).filter(c => c.done).length;
  const entro = m.entro ? `entro il ${fmtGgMm(m.entro)}/${String(m.entro).slice(0, 4)}` : '';
  const cose = state.metaColOk && !m.raggiunta ? (n || fatte ? plurale(n, 'cosa aperta', 'cose aperte') + (fatte ? `, ${fatte} fatte` : '') : 'nessuna cosa collegata') : '';
  const ferma = metaFerma(m) ? '<span class="ferma"><i class="ti ti-zzz" aria-hidden="true"></i>da 4 settimane niente in programma</span>' : '';
  return [m.area ? escHtml(m.area) : '', entro, cose, ferma].filter(Boolean);
}
function rigaMeta(m, i, gruppo) {
  const pos = gruppo.indexOf(m), info = infoMeta(m);
  const num = m.raggiunta ? '<i class="ti ti-check" aria-hidden="true"></i><span class="sr-only">Raggiunta</span>' : i + 1;
  if (ui.metaEdit === m.id) return `<div class="meta-riga in-modifica" data-meta="${esc(m.id)}"><span class="meta-n mono">${num}</span>${formMeta(m)}</div>`;
  const tasti = ui.meteRiordina && !m.raggiunta ? `<div class="meta-tasti">
      <button type="button" class="btn btn-icon" data-act="meta-su" data-id="${esc(m.id)}" aria-label="Sposta su: ${esc(m.testo)}"${pos === 0 ? ' disabled' : ''}><i class="ti ti-arrow-up"></i></button>
      <button type="button" class="btn btn-icon" data-act="meta-giu" data-id="${esc(m.id)}" aria-label="Sposta giù: ${esc(m.testo)}"${pos === gruppo.length - 1 ? ' disabled' : ''}><i class="ti ti-arrow-down"></i></button></div>` : '<span></span>';
  return `<div class="meta-riga${m.raggiunta ? ' raggiunta' : ''}" data-meta="${esc(m.id)}"><span class="meta-n mono">${num}</span>
    <button type="button" class="meta-corpo" data-act="meta-modifica" data-id="${esc(m.id)}" aria-label="Modifica la meta: ${esc(m.testo)}"><span class="meta-testo">${escHtml(m.testo)}</span>${info.length ? `<span class="meta-info">${info.join('<span class="sep" aria-hidden="true">·</span>')}</span>` : ''}</button>
    ${tasti}</div>`;
}
function formMeta(m) {
  const v = m || {}, aree = nomiAree();
  return `<div class="meta-form${m ? '' : ' meta-nuova'}"${m ? ' style="padding:0"' : ''}>
    <input type="text" class="input" id="${m ? 'meta-testo-mod' : 'meta-testo'}" maxlength="160" value="${esc(v.testo || '')}" placeholder="Fra 5 anni voglio… (es. SSI con 2.000 clienti)" aria-label="La meta">
    <div class="meta-form-riga">
      ${aree.length ? `<select class="input" id="${m ? 'meta-area-mod' : 'meta-area'}" aria-label="Area"><option value="">Area (facoltativa)</option>${aree.map(a => `<option${a === v.area ? ' selected' : ''}>${escHtml(a)}</option>`).join('')}</select>` : ''}
      <input type="date" lang="it" class="input" id="${m ? 'meta-entro-mod' : 'meta-entro'}" value="${v.entro || ''}" aria-label="Entro (facoltativo)" title="Entro (facoltativo)">
      ${m ? `<button type="button" class="btn btn-primary btn-sm" data-act="meta-salva" data-id="${esc(m.id)}">Salva</button>` : '<button type="button" class="btn btn-primary btn-sm" data-act="meta-aggiungi"><i class="ti ti-plus"></i>Aggiungi</button>'}
    </div>
    ${m ? `<div class="tools-row"><button type="button" class="btn btn-ghost btn-sm" data-act="meta-annulla">Annulla</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="meta-raggiunta" data-id="${esc(m.id)}" aria-pressed="${!!m.raggiunta}"><i class="ti ${m.raggiunta ? 'ti-arrow-back-up' : 'ti-flag-check'}"></i>${m.raggiunta ? 'Non ancora raggiunta' : 'Raggiunta'}</button>
      <button type="button" class="btn btn-ghost btn-danger btn-sm" data-act="meta-togli" data-id="${esc(m.id)}">Togli la meta</button></div>` : ''}
  </div>`;
}
function anelloMete(n) {
  const obj = n > PRINC.METE_MIN ? PRINC.METE_MAX : PRINC.METE_MIN, r = 27, giro = 2 * Math.PI * r, pieno = Math.min(1, n / obj);
  return `<div class="mete-anello" role="img" aria-label="${n} mete scritte su ${obj}"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="tr" cx="32" cy="32" r="${r}"/><circle class="ar" cx="32" cy="32" r="${r}" stroke-dasharray="${giro.toFixed(1)}" stroke-dashoffset="${(giro * (1 - pieno)).toFixed(1)}"${n ? '' : ' style="display:none"'}/></svg>
    <span aria-hidden="true"><b class="mono">${n}</b><small>di ${obj}</small></span></div>`;
}
function vistaMete() {
  const l0 = Array.isArray(state.mete) ? meteTutte() : [];
  const aperteL = l0.filter(m => !m.raggiunta), fatteL = l0.filter(m => m.raggiunta);
  const riordina = aperteL.length > 1 && state.meteOk ? `<button type="button" class="btn ${ui.meteRiordina ? 'btn-primary' : 'btn-secondary'} btn-sm" data-act="mete-riordina" aria-pressed="${ui.meteRiordina}"><i class="ti ${ui.meteRiordina ? 'ti-check' : 'ti-arrows-sort'}"></i>${ui.meteRiordina ? 'Fine' : 'Riordina'}</button>` : '';
  let h = `${indietro('altro', 'Altro')}<div class="vh mete-testa"><div><h1>Le mie mete</h1></div>${riordina}</div>
    <p class="t-label muted mete-intro">Cosa stai costruendo da qui a 5 anni? Scrivi 7–10 mete: ti aiutano a scegliere cosa conta e a dire di no al resto.</p>`;
  if (state.meteOk === false) return h + vuoto('ti-database-off', 'Le mete non sono disponibili', 'Manca la tabella delle mete nel database: le altre funzioni vanno lo stesso.');
  if (!Array.isArray(state.mete)) return h + '<div class="skel"></div>';
  const n = l0.length;
  const titolo = n < PRINC.METE_MIN ? (n ? `Ne mancano ${PRINC.METE_MIN - n} per arrivare a 7` : 'Comincia dalla prima') : n > PRINC.METE_MAX ? 'Sono tante: tieni le 10 che contano di più' : 'Hai le tue mete';
  const collegate = state.metaColOk ? state.cicli.filter(c => c.meta_id && !c.done && metaPerId(c.meta_id)).length : 0;
  const sotto = [plurale(n, 'meta scritta', 'mete scritte'), fatteL.length ? plurale(fatteL.length, 'raggiunta', 'raggiunte') : '', state.metaColOk && n ? plurale(collegate, 'cosa collegata', 'cose collegate') : ''].filter(Boolean).join(' · ');
  h += `<section class="mete-sommario" aria-label="Quante mete">${anelloMete(n)}<div class="mete-sommario-txt"><b>${titolo}</b><span>${sotto}</span></div></section>`;
  if (aperteL.length) h += `<p class="list-head"><span>In corso</span><span class="mono">${aperteL.length}</span></p><div class="group">${aperteL.map((m, i) => rigaMeta(m, i, aperteL)).join('')}</div>`;
  if (fatteL.length) h += `<p class="list-head"><span>Raggiunte</span><span class="mono">${fatteL.length}</span></p><div class="group">${fatteL.map((m, i) => rigaMeta(m, i, fatteL)).join('')}</div>`;
  h += `<p class="list-head"><span>${n ? 'Un\'altra meta' : 'La prima meta'}</span></p><div class="group">${formMeta(null)}</div>`;
  if (n && state.metaColOk) h += `<p class="t-caption muted mete-nota"><i class="ti ${ICO_META}" aria-hidden="true"></i><span>Tocca una meta per modificarla o segnarla raggiunta. Collega le cose alle mete dal dettaglio («Serve a quale meta?») o in Riordina.</span></p>`;
  return h;
}
async function aggiungiMeta() {
  const testo = ($('meta-testo').value || '').trim();
  if (!testo) { $('meta-testo').focus(); showToast('Scrivi la meta', 'warn'); return; }
  const riga = { testo: testo.slice(0, 160), area: ($('meta-area') || {}).value || null, entro: $('meta-entro').value || null, ordine: meteTutte().length };
  try {
    const { data, error } = await db.from('mete').insert(riga).select();
    if (error) throw error;
    state.mete = ordinaMete([...meteTutte(), (data && data[0]) || { ...riga, id: 'tmp' + Date.now() }]);
    render();
    showToast('Meta aggiunta', 'success');
    setTimeout(() => { const t = $('meta-testo'); if (t) t.focus(); }, 60);
    proponiChiudiScrivereMete();
  } catch (e) { showToast('Meta non salvata: ' + e.message, 'error'); }
}
// Con 7 mete scritte: «SCRIVERE LE METE» si può chiudere (una volta sola)
function proponiChiudiScrivereMete() {
  if (meteTutte().length < PRINC.METE_MIN) return;
  const c = state.cicli.find(x => !x.done && /\bscriver\w*\s+(?:le\s+)?(?:mie\s+)?mete\b/i.test(senzaAccenti(x.title)));
  if (!c || lsLeggi(PRINC.LS.METE_CHIUDI) === String(c.id)) return;
  lsScrivi(PRINC.LS.METE_CHIUDI, String(c.id));
  setTimeout(() => apriConferma({ titolo: `Hai scritto ${meteTutte().length} mete`, testo: `Chiudo «${c.title}»?`, ok: 'Sì, è fatta', no: 'Non ancora', onOk: () => azioneFatto(c.id) }), 300);
}
async function salvaMeta(id) {
  const m = metaPerId(id);
  if (!m) return;
  const testo = ($('meta-testo-mod').value || '').trim();
  if (!testo) { $('meta-testo-mod').focus(); return; }
  await patchMeta(id, { testo: testo.slice(0, 160), area: ($('meta-area-mod') || {}).value || (m.area && !nomiAree().length ? m.area : null), entro: $('meta-entro-mod').value || null });
  ui.metaEdit = null;
  render();
  showToast('Meta salvata', 'success');
}
async function patchMeta(id, patch) {
  const conData = { ...patch, updated_at: new Date().toISOString() };
  const { error } = await db.from('mete').update(conData).eq('id', id);
  if (error) { showToast('Non salvata: ' + error.message, 'error'); throw error; }
  state.mete = ordinaMete(meteTutte().map(m => String(m.id) === String(id) ? { ...m, ...conData } : m));
}
async function spostaMeta(id, dir) {
  const l = meteTutte().slice(), i = l.findIndex(m => String(m.id) === String(id));
  if (i < 0) return;
  let j = i + dir;
  while (j >= 0 && j < l.length && !!l[j].raggiunta !== !!l[i].raggiunta) j += dir;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]];
  const cambiate = l.map((m, k) => ({ m, k })).filter(({ m, k }) => (m.ordine ?? -1) !== k);
  state.mete = l.map((m, k) => ({ ...m, ordine: k }));
  render();
  try { for (const { m, k } of cambiate) { const { error } = await db.from('mete').update({ ordine: k }).eq('id', m.id); if (error) throw error; } }
  catch (e) { showToast('Ordine non salvato: ' + e.message, 'error'); }
}
function togliMeta(id) {
  const m = metaPerId(id);
  if (!m) return;
  const n = cicliDiMeta(m).length;
  apriConferma({ titolo: 'Togli questa meta?', testo: `«${m.testo}»${n ? `: ${plurale(n, 'cosa resta', 'cose restano')} ma senza meta` : ''}.`, ok: 'Sì, toglila', no: 'Annulla', onOk: async () => {
    try {
      const { error } = await db.from('mete').delete().eq('id', id);
      if (error) throw error;
      state.mete = meteTutte().filter(x => String(x.id) !== String(id));
      state.cicli = state.cicli.map(c => String(c.meta_id || '') === String(id) ? { ...c, meta_id: null } : c);   // nel database: on delete set null
      ui.metaEdit = null;
      render();
      showToast('Meta tolta', 'info');
    } catch (e) { showToast('Non riesco: ' + e.message, 'error'); }
  } });
}
Object.assign(AZIONI, {
  'meta-aggiungi': () => aggiungiMeta(),
  'meta-modifica': el => { ui.metaEdit = el.dataset.id; ui.meteRiordina = false; render(); setTimeout(() => { const t = $('meta-testo-mod'); if (t) t.focus(); }, 50); },
  'meta-annulla': () => { ui.metaEdit = null; render(); },
  'meta-salva': el => salvaMeta(el.dataset.id).catch(() => {}),
  'meta-togli': el => togliMeta(el.dataset.id),
  'meta-su': el => spostaMeta(el.dataset.id, -1),
  'meta-giu': el => spostaMeta(el.dataset.id, 1),
  'meta-raggiunta': async el => { const m = metaPerId(el.dataset.id); if (!m) return; try { await patchMeta(m.id, { raggiunta: !m.raggiunta }); ui.metaEdit = null; render(); showToast(m.raggiunta ? 'Di nuovo in corso' : 'Meta raggiunta: bel lavoro', 'success'); } catch (_) {} },
  'mete-riordina': () => { ui.meteRiordina = !ui.meteRiordina; ui.metaEdit = null; render(); },
  'mete-apri': () => vai('altro', { sub: 'mete' }),
  'mete-card-chiudi': () => { const c = bpSettimanaCorrente(); lsScrivi(PRINC.LS.METE_CARD, settKey(c.week, c.year)); render(); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.isComposing) return;
  if (e.target.id === 'meta-testo') { e.preventDefault(); aggiungiMeta(); }
  if (e.target.id === 'meta-testo-mod') { e.preventDefault(); const r = e.target.closest('[data-meta]'); if (r) salvaMeta(r.dataset.meta).catch(() => {}); }
});

// La card gentile in Oggi: nessuna meta → una volta a settimana
function cardMete() {
  if (!state.meteOk || !Array.isArray(state.mete) || state.mete.length || modoSemplice()) return '';
  const c = bpSettimanaCorrente();
  if (lsLeggi(PRINC.LS.METE_CARD) === settKey(c.week, c.year)) return '';
  return `<section class="banner-piano banner-leggero" aria-label="Le tue mete"><i class="ti ti-flag"></i>
    <div><b>Non hai ancora scritto le tue mete</b><p class="t-caption muted">Cosa stai costruendo da qui a 5 anni? Con le mete scritte è più facile dire di no a quello che non serve.</p>
      <div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="mete-apri">Scrivile</button></div></div>
    <button type="button" class="btn btn-icon" data-act="mete-card-chiudi" aria-label="Non ora" data-tip="Non questa settimana"><i class="ti ti-x"></i></button></section>`;
}

// ─── Nel dettaglio: «Serve a quale meta?» (si salva subito) ───
$('det-passi').insertAdjacentHTML('afterend', `<div id="det-meta" class="det-box det-meta" hidden>
  <label class="field-label" for="f-meta"><i class="ti ti-flag" aria-hidden="true"></i>Serve a quale meta?</label>
  <select class="input" id="f-meta" aria-label="Serve a quale meta?"></select></div>`);
function disegnaDetMeta(c) {
  const box = $('det-meta');
  const l = meteTutte();
  const mostra = !!c && !!state.metaColOk && l.length > 0;
  box.hidden = !mostra;
  if (!mostra) return;
  const att = c.meta_id ? String(c.meta_id) : '';
  const voci = l.filter(m => !m.raggiunta || String(m.id) === att);
  $('f-meta').innerHTML = `<option value="">Nessuna</option>${voci.map(m => `<option value="${esc(m.id)}"${String(m.id) === att ? ' selected' : ''}>${escHtml(corta(m.testo, 60))}</option>`).join('')}`;
}
const _apriDettaglioPr = apriDettaglio;
apriDettaglio = function (id) { const r = _apriDettaglioPr.apply(this, arguments); disegnaDetMeta(ciclo(id)); return r; };
async function collegaMeta(id, metaId, silenzioso) {
  const c = ciclo(id);
  if (!c || !state.metaColOk) return;
  const prima = c.meta_id || null, dopo = metaId || null;
  if (String(prima || '') === String(dopo || '')) return;
  try {
    await patchCiclo(id, { meta_id: dopo });
    render();
    const m = metaPerId(dopo);
    if (!silenzioso) showToast(m ? `Serve a: ${corta(m.testo, 40)}` : 'Senza meta', 'success', { annulla: async () => { await patchCiclo(id, { meta_id: prima }); if (editingId === id) disegnaDetMeta(ciclo(id)); render(); } });
  } catch (e) { showToast('Non collegata: ' + e.message, 'error'); }
}
document.addEventListener('change', e => { if (e.target.id === 'f-meta' && editingId) collegaMeta(editingId, e.target.value); });

// ─── Nella riga: il segno della meta ───
const _rigaPr = riga;
riga = function (r, opz) {
  const h = _rigaPr(r, opz);
  const m = r && r.c && metaDi(r.c);
  if (!m) return h;
  const tag = `<span class="meta-tag" data-tip="Serve a: ${esc(m.testo)}"><i class="ti ti-flag" aria-hidden="true"></i><span><span class="sr-only">Meta: </span>${escHtml(corta(m.testo, 28))}</span></span>`;
  return h.replace(/(<span class="item-meta">)([\s\S]*?)(<\/span><\/button>)/, (x, a, dentro, b) => a + dentro + (dentro.trim() ? '<span class="sep">·</span>' : '') + tag + b);
};

// ─── Riordina: un'Importante ti avvicina a una meta? Se no: Delega o Lascia stare (dire no) ───
const _disegnaRiordinaPr = disegnaRiordina;
disegnaRiordina = function () {
  _disegnaRiordinaPr();
  const r = ui.rio;
  if (!r || r.rimaste || r.i >= r.ids.length) return;
  const c = ciclo(r.ids[r.i]), corpo = $('rio-corpo');
  if (!c || !corpo) return;
  const m = metaDi(c), meta = corpo.querySelector('.rio-meta');
  if (m && meta) meta.insertAdjacentHTML('beforeend', `<span class="meta-tag"><i class="ti ti-flag" aria-hidden="true"></i><span>${escHtml(corta(m.testo, 28))}</span></span>`);
  const cosa = corpo.querySelector('.rio-cosa');
  if (cosa && troppoGenerica(c)) cosa.insertAdjacentHTML('afterend', `<div class="rio-vaga"><i class="ti ti-help-circle" aria-hidden="true"></i><span>Troppo generica: cosa devi fare, con chi, quanto?</span><button type="button" class="btn btn-secondary btn-sm" data-act="rio-spacchetta"><i class="ti ti-list-tree"></i>Spacchettala</button></div>`);
  if (r.scelta !== 'importante' || !state.metaColOk || !meteAperte().length) return;
  const date = corpo.querySelector('.rio-date');
  if (!date) return;
  const scelta = r.metaScelta && r.metaScelta.id === c.id ? r.metaScelta.v : (c.meta_id ? String(c.meta_id) : null);
  const chip = (v, l) => `<button type="button" class="chip" data-act="rio-meta" data-v="${esc(v)}" aria-pressed="${scelta === v}">${l}</button>`;
  const domanda = `<div class="rio-mete" role="group" aria-label="Ti avvicina a una meta?"><b>Ti avvicina a una meta?</b>
    <div class="chips chips-wrap">${meteAperte().map(x => chip(String(x.id), `<i class="ti ti-flag" aria-hidden="true"></i>${escHtml(corta(x.testo, 34))}`)).join('')}${chip('nessuna', 'Nessuna')}</div>
    ${scelta === 'nessuna' ? `<div class="rio-dire-no"><b>Allora è una Delega o Lascia stare?</b><span class="t-caption">Se non ti avvicina a niente di quello che stai costruendo, puoi dire di no.</span>
      <div class="tasti"><button type="button" class="btn btn-q3 btn-sm" data-act="rio-tipo" data-v="delega"><i class="ti ti-user-share"></i>Delega</button>
        <button type="button" class="btn btn-q4 btn-sm" data-act="rio-tipo" data-v="lascia"><i class="ti ti-wind"></i>Lascia stare</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="rio-meta" data-v="comunque">È Importante lo stesso</button></div></div>` : ''}</div>`;
  date.insertAdjacentHTML('beforebegin', domanda);
  if (scelta === 'nessuna') date.hidden = true;
};
AZIONI['rio-meta'] = async el => {
  const r = ui.rio;
  if (!r) return;
  const c = ciclo(r.ids[r.i]);
  if (!c) return;
  const v = el.dataset.v;
  r.metaScelta = { id: c.id, v };
  if (v === 'nessuna') { if (c.meta_id) await collegaMeta(c.id, null, true); }
  else if (v !== 'comunque') await collegaMeta(c.id, v, true);
  disegnaRiordina();
};

