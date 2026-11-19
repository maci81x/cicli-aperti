// v8 · IMPORT PLAUD: un'attività madre per la riunione, le cose da fare come passi
// ══════════════════════════════════════════════════════════════
const PLAUD = {
  MAX_FILE: 500 * 1024, ESTENSIONI: /\.(txt|md|markdown)$/i,
  TIPO: { subito: 1, importante: 2, delega: 3, 'lascia stare': 4 },
  SEZIONI: { 'riunione': 'riunione', 'con': 'con', 'da fare io': 'io', 'delegate': 'delegate', 'decisioni': 'decisioni' }
};
ui.plaud = null;
const ePlaudFormato = t => /RIUNIONE\s*:/i.test(t) && /DA FARE IO\s*:/i.test(t);
const vuotoODash = s => { const x = String(s || '').trim(); return !x || /^[-–—]$/.test(x) ? null : x; };
function dataDaTesto(s, rif) {
  const x = vuotoODash(s);
  if (!x) return null;
  const m = /^(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?$/.exec(x);
  if (m) { const d = dataValida(+m[1], +m[2], m[3] ? +m[3] : null, rif); return d ? toISODate(d) : null; }
  return interpretaFrase(x, rif).data;
}
// Il formato del foglio Plaud: RIUNIONE / CON / DA FARE IO / DELEGATE / DECISIONI
function parsePlaudFormato(testo, oggi = new Date()) {
  const out = { titolo: '', data: null, con: [], decisioni: [], cose: [] };
  let sez = null;
  String(testo || '').split(/\r?\n/).forEach(rigaGrezza => {
    const riga = rigaGrezza.replace(/\*\*/g, '').replace(/^\s*[#>]+\s*/, '').trim();
    if (!riga) return;
    const h = /^(RIUNIONE|CON|DA FARE IO|DELEGATE|DECISIONI)\s*:\s*(.*)$/i.exec(riga);
    if (h) {
      sez = PLAUD.SEZIONI[h[1].toLowerCase()];
      const v = h[2].trim();
      if (sez === 'riunione') {
        const m = /^(.*?)\s*[—–-]\s*(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4})\s*$/.exec(v);
        out.titolo = (m ? m[1] : v).trim();
        out.data = m ? dataDaTesto(m[2], oggi) : null;
      } else if (sez === 'con' && v) out.con = v.split(/,|\s+e\s+/).map(s => s.trim()).filter(Boolean);
      return;
    }
    const b = /^[-*•]\s*(.+)$/.exec(riga);
    const voce = b ? b[1].trim() : riga;
    const rif = out.data ? parseISODate(out.data) : oggi;
    if (sez === 'io') {
      const [primo, ...altri] = voce.split('|').map(s => s.trim());
      const t = /^\[([^\]]+)\]\s*(.*)$/.exec(primo);
      const campi = Object.fromEntries(altri.map(a => { const i = a.indexOf(':'); return i < 0 ? [a.toLowerCase(), ''] : [a.slice(0, i).trim().toLowerCase(), a.slice(i + 1).trim()]; }));
      const title = (t ? t[2] : primo).trim();
      if (title) out.cose.push({ title, q: PLAUD.TIPO[senzaAccenti(t ? t[1] : '')] || 2, data: dataDaTesto(campi.entro, rif), note: vuotoODash(campi.note), persona: null });
    } else if (sez === 'delegate') {
      const m = /^([^:|]+):\s*(.+)$/.exec(voce);
      if (!m) return;
      const [cosa, ...altri] = m[2].split('|').map(s => s.trim());
      const ctrl = altri.map(a => /^controllo\s*:\s*(.*)$/i.exec(a)).find(Boolean);
      if (cosa) out.cose.push({ title: cosa, q: 3, data: ctrl ? dataDaTesto(ctrl[1], rif) : null, note: null, persona: m[1].trim() });
    } else if (sez === 'decisioni') out.decisioni.push(voce);
    else if (sez === 'con') out.con.push(...voce.split(/,|\s+e\s+/).map(s => s.trim()).filter(Boolean));
  });
  return out;
}

// Senza formato: Claude, con la data di oggi e i tipi dell'app
function promptRiunione(testo) {
  const oggi = new Date();
  return `Oggi è ${fmtGiornoLungo(oggi)} ${oggi.getFullYear()} (${toISODate(oggi)}). Leggi questa trascrizione italiana di una riunione e trova le cose da fare.

Restituisci SOLO un oggetto JSON valido, nessun altro testo:
{
  "riunione": { "titolo": "titolo breve della riunione (max 50 caratteri)", "data": "YYYY-MM-DD o null" },
  "presenti": ["nomi delle persone presenti"],
  "decisioni": ["decisioni prese, una frase ciascuna"],
  "cose": [{
    "title": "cosa da fare, con un verbo all'infinito (max 60 caratteri)",
    "note": "un dettaglio utile o null",
    "tipo": "Subito | Importante | Delega",
    "persona": "chi la fa, solo se tipo è Delega, altrimenti null",
    "data": "YYYY-MM-DD o null",
    "cat": "management"
  }]
}

Tipi: "Subito" = urgente, da fare entro 1-2 giorni; "Importante" = la faccio io, senza urgenza; "Delega" = la fa un'altra persona (scrivi chi).
data: per Subito e Importante quando va fatta; per Delega quando controllare. Risolvi le date relative ("venerdì", "la settimana prossima") a partire da oggi. Se la riunione non ha una data, usa null.
cat valide: management, hr, marketing, vendite, amministrazione, produzione, rnd, salute, relazioni, finanze, crescita, hobbies, spiritualita, casa, idee

TRASCRIZIONE:
${testo}`;
}
async function chiamaClaudeRiunione(testo) {
  const t = await chiediClaude('riunione', promptRiunione(testo));
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const grezzo = (m ? m[1] : t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)).trim();
  return JSON.parse(grezzo);
}
// la risposta di Claude è un dato esterno: si tiene solo quello che ha la forma giusta
function daRispostaAI(r) {
  const testo = (x, max) => typeof x === 'string' && x.trim() ? x.trim().slice(0, max) : null;
  const iso = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && parseISODate(x) ? x : null;
  const lista = x => Array.isArray(x) ? x : [];
  const ri = (r && r.riunione) || {};
  return {
    titolo: testo(ri.titolo, 80) || 'Riunione', data: iso(ri.data),
    con: lista(r && r.presenti).map(x => testo(x, 60)).filter(Boolean),
    decisioni: lista(r && r.decisioni).map(x => testo(x, 300)).filter(Boolean),
    cose: lista(r && r.cose).map(c => ({
      title: testo(c && c.title, 120), note: testo(c && c.note, 500), q: PLAUD.TIPO[senzaAccenti(c && c.tipo)] || 2,
      data: iso(c && c.data), persona: testo(c && c.persona, 60), cat: typeof (c && c.cat) === 'string' && categoriaEsiste(c.cat) ? c.cat : null
    })).filter(c => c.title)
  };
}
const maiuscola = t => { const x = String(t || '').trim(); return x.charAt(0).toUpperCase() + x.slice(1); };
// una delega senza data di controllo si controlla 2 giorni dopo la riunione (come a voce)
const controlloDopoRiunione = dataRiunione => toISODate(piuGiorni(parseISODate(dataRiunione) || new Date(), FRASE.CONTROLLO_GIORNI));
// Il modello dell'anteprima: la madre e i passi, ognuno con la sua spunta
function preparaPlaud(r, fonte) {
  const data = r.data || oggiLocale();
  const titolo = r.titolo || 'Riunione';
  return {
    fonte, data, con: r.con, decisioni: r.decisioni,
    madre: /\d{1,2}\/\d{1,2}\s*$/.test(titolo) ? titolo : `${titolo} – ${fmtGgMm(data)}`,
    cose: r.cose.map((c, i) => {
      const p = c.persona ? trovaPersona(c.persona) : null;
      return { i, scelta: true, title: maiuscola(c.title), note: c.note, q: c.q, data: c.data, cat: c.cat || null, persona: p ? p.nome : c.persona ? maiuscola(c.persona) : null, personaId: p ? p.id : null, crea: true };
    })
  };
}
const notaMadre = p => [p.con.length ? `CON: ${p.con.join(', ')}` : '', p.decisioni.length ? `DECISIONI:\n${p.decisioni.map(d => `- ${d}`).join('\n')}` : ''].filter(Boolean).join('\n\n') || null;

function voceAnteprimaPlaud(c) {
  const chiedi = c.q === 3 && c.persona && !c.personaId;
  return `<div class="plaud-item p-q${c.q}" data-i="${c.i}">
    <div class="plaud-item-header"><label class="plaud-check-label"><input type="checkbox" class="plaud-item-check" data-pl="scelta" ${c.scelta ? 'checked' : ''}><span class="plaud-item-title">${escHtml(c.title)}</span></label></div>
    ${c.note ? `<div class="plaud-item-note">${escHtml(c.note)}</div>` : ''}
    <div class="plaud-item-meta">
      <select class="input pl-tipo" data-pl="q" data-q="${c.q}" aria-label="Tipo">${[1, 2, 3, 4].map(q => `<option value="${q}"${q === c.q ? ' selected' : ''}>${TIPI[q].label}</option>`).join('')}</select>
      <label class="pl-data"><span>${c.q === 3 ? 'controllo' : 'quando'}</span><input type="date" class="plaud-date-input" data-pl="data" value="${c.data || (c.q === 3 ? controlloDopoRiunione(ui.plaud.data) : '')}"></label>
      ${c.q === 3 && c.persona ? `<span class="pl-chi"><i class="ti ti-user"></i>${escHtml(c.persona)}</span>` : ''}
    </div>
    ${chiedi ? `<div class="pl-chiedi"><span>${escHtml(c.persona)} non è tra le tue persone. La aggiungo?</span>
      <span class="chips"><button type="button" class="chip" data-act="pl-crea" data-v="si" aria-pressed="${c.crea}">Sì</button><button type="button" class="chip" data-act="pl-crea" data-v="no" aria-pressed="${!c.crea}">No</button></span></div>` : ''}
  </div>`;
}
function disegnaAnteprimaPlaud() {
  const p = ui.plaud, box = $('plaud-items');
  if (!p || !box) return;
  const scelte = p.cose.filter(c => c.scelta).length, scorri = box.scrollTop;   // ridisegnando, l'elenco resta dov'era
  const sommario = document.querySelector('#plaud-step-3 .plaud-summary');
  if (sommario) sommario.innerHTML = `${p.fonte === 'formato' ? 'Letta dal formato, senza AI.' : 'Letta da Claude.'} Un'attività madre e <b class="mono" id="plaud-count">${scelte}</b> ${scelte === 1 ? 'passo' : 'passi'}: togli la spunta a quelli che non vuoi.`;
  box.innerHTML = `<div class="plaud-item pl-madre p-q2">
      <label class="t-caption muted" for="pl-madre">Attività madre · Importante</label>
      <input type="text" class="input" id="pl-madre" value="${escAttr(p.madre)}" maxlength="200">
      ${p.con.length ? `<div class="plaud-item-note">Con ${escHtml(p.con.join(', '))}</div>` : ''}
      ${p.decisioni.length ? `<div class="plaud-item-note">${plurale(p.decisioni.length, 'decisione', 'decisioni')} nella nota</div>` : ''}
    </div>
    ${p.cose.length ? p.cose.map(voceAnteprimaPlaud).join('') : '<p class="t-label muted">Nessuna cosa da fare: importo solo la riunione.</p>'}`;
  box.scrollTop = scorri;
  const btn = $('btn-import-plaud');
  if (btn) { btn.disabled = false; btn.textContent = scelte ? `Importa · ${plurale(scelte, 'passo', 'passi')}` : 'Importa la riunione'; }
}
function cambiaVocePlaud(i, chiave, valore) {
  const p = ui.plaud;
  if (!p) return;
  ui.plaud = { ...p, cose: p.cose.map(c => c.i !== i ? c : { ...c, [chiave]: valore }) };
  disegnaAnteprimaPlaud();
}
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'pl-madre' && ui.plaud) { ui.plaud = { ...ui.plaud, madre: t.value.trim() || ui.plaud.madre }; return; }
  if (t.id === 'plaud-file') { leggiFilePlaud(t.files && t.files[0]); t.value = ''; return; }
  const box = t.closest && t.closest('#plaud-items .plaud-item[data-i]');
  if (!box || !t.dataset.pl) return;
  const i = +box.dataset.i;
  if (t.dataset.pl === 'scelta') cambiaVocePlaud(i, 'scelta', t.checked);
  else if (t.dataset.pl === 'q') cambiaVocePlaud(i, 'q', parseInt(t.value, 10) || 2);
  else if (t.dataset.pl === 'data') cambiaVocePlaud(i, 'data', t.value || null);
});
AZIONI['pl-crea'] = el => { const box = el.closest('.plaud-item[data-i]'); if (box) cambiaVocePlaud(+box.dataset.i, 'crea', el.dataset.v === 'si'); };

function leggiFilePlaud(file) {
  if (!file) return;
  if (!PLAUD.ESTENSIONI.test(file.name || '')) { showToast('Scegli un file .txt o .md', 'warn'); return; }
  if (file.size > PLAUD.MAX_FILE) { showToast('Il file è troppo grande (massimo 500 KB)', 'warn'); return; }
  const r = new FileReader();
  r.onload = () => { $('plaud-transcript').value = String(r.result || ''); showToast(`Letto «${file.name}»`, 'success'); };
  r.onerror = () => showToast('Non riesco a leggere il file', 'error');
  r.readAsText(file);
}
const _openPlaudModalV8 = openPlaudModal;
openPlaudModal = function () { ui.plaud = null; _openPlaudModalV8(); };
async function analyzePlaud() {
  const testo = ($('plaud-transcript').value || '').trim();
  if (!testo) { showToast('Incolla il testo della registrazione o apri un file', 'warn'); return; }
  if (ePlaudFormato(testo)) {
    const r = parsePlaudFormato(testo);
    if (!r.titolo) { showToast('Manca il titolo dopo «RIUNIONE:»', 'warn'); return; }
    ui.plaud = preparaPlaud(r, 'formato');
    disegnaAnteprimaPlaud();
    setPlaudStep(3);
    return;
  }
  if (!claudeDisponibile()) { closePlaudModal(); openApiKeyModal(); return; }
  setPlaudStep(2);
  try {
    ui.plaud = preparaPlaud(daRispostaAI(await chiamaClaudeRiunione(testo)), 'ai');
    disegnaAnteprimaPlaud();
    setPlaudStep(3);
  } catch (e) {
    console.warn('[Plaud] lettura con Claude:', e.message);
    showToast('Non sono riuscito a leggere la trascrizione: ' + e.message, 'error');
    setPlaudStep(1);
  }
};
// la madre (Importante, nota = CON + DECISIONI) e i passi spuntati, con parent_id; poi state e render, senza ricaricare
async function importaRiunione() {
  const p = ui.plaud;
  if (!p) return;
  const btn = $('btn-import-plaud');
  btn.disabled = true; btn.textContent = 'Importo…';
  const ctx = state.ctx;
  const salvate = [];
  try {
    const base = rigaNuova(p.madre, { subito: false }, ctx);
    const madre = await upsertCiclo({ ...base, q: 2, note: notaMadre(p), da_plaud: true, persone_menzionate: unici(p.con), macro_area: areaDaCategoria(base.cat) });
    if (!madre) throw new Error('attività madre non salvata');
    salvate.push(madre);
    state.cicli = [madre, ...state.cicli];
    for (const c of p.cose.filter(x => x.scelta)) {
      const persona = c.q === 3 && c.persona ? (c.personaId ? personaDi(c.personaId) : c.crea ? await creaPersona(c.persona) : null) : null;
      const cat = c.cat || madre.cat;
      const riga = { ...rigaNuova(c.title, { subito: c.q === 1 }, ctx), q: c.q, note: c.note || null, cat, macro_area: areaDaCategoria(cat), da_plaud: true,
        persone_menzionate: unici([persona ? persona.nome : c.q === 3 ? c.persona : null]), ...(state.passiColOk ? { parent_id: madre.id } : {}) };
      const conDelega = c.q === 3 && state.delegaColsOk
        ? { ...riga, delega_persona_id: persona ? persona.id : null, delega_controllo: c.data || controlloDopoRiunione(p.data) }
        : c.data && c.q !== 3 ? { ...riga, scheduled_date: c.data } : riga;
      const salvata = await upsertCiclo(conDelega);
      if (!salvata) continue;
      salvate.push(salvata);
      state.cicli = [salvata, ...state.cicli];
      if (c.data && c.q !== 3) await pianificaInData(salvata, parseISODate(c.data), null);
    }
    closePlaudModal();
    ui.plaud = null;
    render();
    const passi = salvate.length - 1;
    showToast(`Importata «${madre.title}»${passi ? ` con ${plurale(passi, 'passo', 'passi')}` : ''}`, 'success', { annulla: () => apriDettaglio(madre.id), etichetta: 'Apri' });
  } catch (e) {
    console.warn('[Plaud] import:', e.message);
    showToast(`Import interrotto: ${e.message}${salvate.length ? ` (${plurale(salvate.length, 'cosa salvata', 'cose salvate')})` : ''}`, 'error');
    btn.disabled = false; disegnaAnteprimaPlaud();
    render();
  }
}

// ══════════════════════════════════════════════════════════════
