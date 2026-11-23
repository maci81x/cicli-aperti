// v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi
const PUNTO_ELENCO = /^[-•*]\s*/;
// 24/10 · le righe di un campo: tolte le righe vuote in testa e in coda, ne resta al massimo una di fila
// (serve a chiudere un'intestazione «Mattina 26»: vale per le righe sotto fino a una riga vuota)
function righeCampo(t) {
  const out = [];
  String(t || '').split(/\r?\n/).map(x => x.trim()).forEach(x => { if (x || (out.length && out[out.length - 1])) out.push(x); });
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}
// 24/10 · una riga che dice solo QUANDO non è una cosa: «Mattina 26», «Lunedì:», «Domani pomeriggio», «Venerdì 30 ottobre».
// Restituisce { data, fascia, controllaGiorno } oppure null. «lunedì 26 chiamare Ale» NON è un'intestazione (c'è la cosa).
const QUANDO_PAROLE = new Set(['oggi', 'domani', 'dopodomani', 'stamattina', 'stamani', 'domattina', 'stasera', 'mattina', 'mattino', 'pomeriggio', 'sera',
  'il', 'lo', 'la', 'l', 'di', 'del', 'della', 'per', 'prossimo', 'prossima', 'settimana', 'in', 'mattinata', 'serata']);
function intestazioneQuando(riga, oggi = new Date()) {
  const pulita = String(riga || '').replace(/^[-•*#\s]+/, '').replace(/[\s:.,;–—-]+$/, '').trim();
  if (!pulita || pulita.length > 40) return null;
  const parole = senzaAccenti(pulita).replace(/[,']/g, ' ').split(/\s+/).filter(Boolean);
  let numero = null, quando = false;
  for (const w of parole) {
    const x = w.replace(/°$/, '');
    if (FRASE.GIORNI.includes(x) || FRASE.MESI.includes(x) || /^(?:oggi|domani|dopodomani|stamattina|stamani|domattina|stasera|settimana|mattina|mattino|mattinata|pomeriggio|sera|serata)$/.test(x)) { quando = true; continue; }
    if (/^\d{1,2}$/.test(x)) { if (+x >= 1 && +x <= 31) { numero = numero == null ? +x : numero; quando = true; continue; } return null; }
    if (/^\d{1,2}[/\-]\d{1,2}(?:[/\-]\d{2,4})?$/.test(x) || /^\d{4}$/.test(x)) { quando = true; continue; }
    if (QUANDO_PAROLE.has(x)) continue;
    return null;   // c'è altro: è una cosa da fare
  }
  if (!quando) return null;
  const t = senzaAccenti(pulita);
  const fascia = /\b(?:pomeriggio)\b/.test(t) ? 'pomeriggio' : /\b(?:sera|stasera|serata)\b/.test(t) ? 'sera' : /\b(?:mattina|mattino|mattinata|stamattina|stamani|domattina)\b/.test(t) ? 'mattina' : null;
  const base = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  const f = interpretaFrase(pulita, base);
  let data = f.data, controlla = !!f.controllaGiorno;
  if (!data && numero != null) { const d = giornoDelMese(numero, base); data = d ? toISODate(d) : null; }   // «Mattina 26» = il 26
  if (!data && numero != null) return null;
  if (!data && fascia) data = toISODate(base);   // «Pomeriggio:» da solo = oggi pomeriggio
  if (!data) return null;
  return { data, fascia, controllaGiorno: controlla };
}
function gruppiDaRighe(righe) {
  const lista = righe || [], gruppi = [];
  let quando = null;
  lista.forEach((riga, i) => {
    if (!riga) { quando = null; return; }   // riga vuota: l'intestazione finisce qui
    const q = intestazioneQuando(riga);
    if (q && lista[i + 1]) { quando = q; return; }   // un'intestazione vale solo se sotto c'è almeno una riga
    const ultimo = gruppi[gruppi.length - 1];
    if (PUNTO_ELENCO.test(riga) && ultimo && ultimo.apre && ultimo.quando === quando) {
      const passo = riga.replace(PUNTO_ELENCO, '').trim();
      if (passo) ultimo.passi.push(passo);
      return;
    }
    gruppi.push({ testo: riga, apre: /:\s*$/.test(riga), passi: [], quando });
  });
  return gruppi.map(g => ({ testo: g.testo, titolo: g.passi.length ? g.testo.replace(/\s*:\s*$/, '') : g.quando ? g.testo.replace(PUNTO_ELENCO, '') : g.testo, passi: g.passi, quando: g.quando }));
}
const frasePassi = n => `1 cosa con ${n} ${n === 1 ? 'passo' : 'passi'}`;
// Le righe del campo con le scelte del foglio (Subito, Oggi, il giorno della colonna) e le correzioni a mano
function vociDaRighe(righe, r) {
  const mod = (r && r.mod) || {};
  return gruppiDaRighe(righe).map((g, i) => {
    const testo = g.testo;
    let v = { ...interpretaFrase(g.titolo), testo, passi: g.passi.map(maiuscola) };
    // sotto un'intestazione («Mattina 26»): il suo giorno e la sua fascia, se la riga non ne dice altri
    if (g.quando && !v.data && v.q !== 3) v = { ...v, data: g.quando.data, controllaGiorno: g.quando.controllaGiorno };
    if (g.quando && g.quando.fascia && !v.ora && v.q !== 3) v = { ...v, fascia: g.quando.fascia };
    if (r && r.subito && v.q !== 3) v = { ...v, q: 1 };
    if (!v.data && r && r.data) v = { ...v, data: r.data };
    if (!v.data && r && r.oggi && v.q !== 3) v = { ...v, data: oggiLocale() };
    if (!v.data && v.ora && v.q !== 3) v = { ...v, data: oggiLocale() };   // solo l'ora detta: oggi a quell'ora
    const m = mod[i];
    return m && m.testo === testo ? { ...v, ...m.valori } : v;
  });
}

// ─── Il riepilogo sotto il campo, modificabile ───
function editorVoce(v, i) {
  const persone = state.persone || [];
  return `<div class="rap-edit" data-i="${i}">
    <input type="text" class="input" data-campo="title" value="${escAttr(v.title)}" aria-label="Cosa">
    <div class="rap-edit-riga">
      <input type="date" class="input" data-campo="data" value="${v.data || ''}" aria-label="Giorno">
      <input type="time" class="input" data-campo="ora" value="${v.ora || ''}" aria-label="Ora">
      <select class="input pl-tipo" data-campo="q" data-q="${v.q}" aria-label="Tipo">${[1, 2, 3, 4].map(q => `<option value="${q}"${q === v.q ? ' selected' : ''}>${TIPI[q].label}</option>`).join('')}</select>
    </div>
    ${v.q === 3 ? `<select class="input" data-campo="delega" aria-label="A chi"><option value="">A chi?</option>${v.delega && !v.delega.id ? `<option value="nuova:${escAttr(v.delega.nome)}" selected>${escHtml(v.delega.nome)} (nuova)</option>` : ''}${persone.map(p => `<option value="${p.id}"${v.delega && String(v.delega.id) === String(p.id) ? ' selected' : ''}>${escHtml(p.nome)}</option>`).join('')}</select>` : ''}
  </div>`;
}
// una correzione nel riepilogo: vale finché la riga del campo resta uguale
function correggiVoce(i, campo, valore) {
  const righe = righeCampo($('rapido-testo').value);
  const v = vociDaRighe(righe, ui.rapido)[i];
  if (!v) return;
  const valori = { title: v.title, data: v.data, ora: v.ora, q: v.q, delega: v.delega, controllaGiorno: campo === 'data' ? false : !!v.controllaGiorno };   // data scelta a mano: niente avviso
  if (campo === 'q') { valori.q = parseInt(valore, 10) || 2; if (valori.q !== 3) valori.delega = null; }
  else if (campo === 'delega') valori.delega = !valore ? null : valore.startsWith('nuova:') ? { id: null, nome: valore.slice(6) } : (p => p && { id: p.id, nome: p.nome })(personaDi(valore));
  else valori[campo] = String(valore || '').trim() || (campo === 'title' ? v.title : null);
  ui.rapido = { ...ui.rapido, mod: { ...(ui.rapido.mod || {}), [i]: { testo: v.testo, valori } } };
  if (campo === 'q' || campo === 'data') disegnaAnteprima();
}
document.addEventListener('change', e => {
  const t = e.target, ed = t.closest && t.closest('#rapido-anteprima .rap-edit');
  if (ed && t.dataset.campo) correggiVoce(+ed.dataset.i, t.dataset.campo, t.value);
});
document.addEventListener('input', e => {
  const t = e.target, ed = t.closest && t.closest('#rapido-anteprima .rap-edit');
  if (ed && t.dataset.campo === 'title') correggiVoce(+ed.dataset.i, 'title', t.value);
});
AZIONI['rap-modifica'] = el => { const i = +el.dataset.i; ui.rapido = { ...ui.rapido, aperta: ui.rapido.aperta === i ? null : i }; disegnaAnteprima(); };
const _disegnaRapidoV8 = disegnaRapido;
disegnaRapido = function () { _disegnaRapidoV8(); disegnaAnteprima(); };
const _apriRapidoV8 = apriRapido;
apriRapido = function () { _apriRapidoV8(); ui.rapido = { ...ui.rapido, mod: {}, aperta: null }; disegnaAnteprima(); };

// ─── Salvataggio: senza data va in Tutto (non più oggi); con data e ora va in quel giorno ───
async function creaPersona(nome) {
  const pulito = String(nome || '').trim().slice(0, 80);
  if (!pulito) return null;
  const gia = trovaPersona(pulito);
  if (gia) return gia;
  const { data, error } = await db.from('persone').insert({ nome: pulito, colore: personColor({ nome: pulito }), created_at: new Date().toISOString() }).select();
  if (error) throw error;
  const p = data && data[0];
  if (p) state.persone = [...state.persone, p].sort((a, b) => a.nome.localeCompare(b.nome));
  return p || null;
}
const fasciaDaOra = ora => !ora ? null : ora < '13:00' ? 'mattina' : ora < '18:00' ? 'pomeriggio' : 'sera';
const unici = lista => [...new Set(lista.filter(Boolean))];
// Una riga del database per una voce: delega con persona e controllo, oppure giorno e ora
async function rigaDaVoce(v, r, ctx) {
  const base = rigaNuova(v.title, { subito: v.q === 1, persona: r && r.persona }, ctx);
  const riga = { ...base, q: v.q };
  if (v.q === 3) {
    const p = v.delega ? (v.delega.id ? personaDi(v.delega.id) : await creaPersona(v.delega.nome)) : null;
    if (p && state.delegaColsOk) return { ...riga, delega_persona_id: p.id, delega_controllo: v.data || toISODate(dataPiu(FRASE.CONTROLLO_GIORNI)), persone_menzionate: unici([...base.persone_menzionate, p.nome]) };
    return p ? { ...riga, persone_menzionate: unici([...base.persone_menzionate, p.nome]) } : riga;
  }
  return v.data ? { ...riga, scheduled_date: v.data, scheduled_time: v.ora || null, ...(v.fascia && state.agendaColsOk ? { fascia_oraria: v.fascia } : {}) } : riga;
}
async function aggiungiFrasi(voci, r) {
  const ctx = state.ctx;
  try {
    const coppie = [];
    const passiNuovi = [];
    for (const v of voci) {
      const riga = await rigaDaVoce(v, r, ctx);
      const passi = v.passi || [];
      // senza la colonna dei passi restano nella nota, uno per riga
      const c = await upsertCiclo(passi.length && !state.passiColOk ? { ...riga, note: passi.map(p => '- ' + p).join('\n') } : riga);
      if (!c) continue;
      coppie.push({ v, c });
      if (passi.length && state.passiColOk) {
        for (const t of passi) {
          const p = await upsertCiclo({ ...rigaNuova(t, { subito: false }, ctx), q: c.q === 1 ? 1 : 2, cat: c.cat, macro_area: c.macro_area, persone_menzionate: c.persone_menzionate || [], parent_id: c.id });
          if (p) passiNuovi.push(p);
        }
      }
    }
    const nuove = coppie.map(x => x.c), tutte = [...nuove, ...passiNuovi];
    state.cicli = [...tutte, ...state.cicli.filter(c => !tutte.some(n => n.id === c.id))];
    for (const { v, c } of coppie) if (v.data && v.q !== 3) await pianificaInData(ciclo(c.id) || c, parseISODate(v.data), v.fascia || fasciaDaOra(v.ora));
    render();
    if (r && r.cusc && nuove[0]) { await riempiCuscinetto(r.cusc, nuove[0].id); return nuove; }   // urgenza arrivata: va nel cuscinetto
    coppie.forEach(({ v, c }) => {
      if (ctx === 'lavoro' && !areaDi(c)) autoCategoria(c.title, '').then(area => area && patchCiclo(c.id, { macro_area: area })).catch(() => {});   // solo se la categoria non ha un'area
    });
    const conPassi = v => (v.passi || []).length ? ` · con ${v.passi.length} ${v.passi.length === 1 ? 'passo' : 'passi'}` : '';
    if (coppie.length === 1) showToast(`Aggiunta: ${sintesiVoce(coppie[0].v)}${conPassi(coppie[0].v)}`, 'success', { annulla: () => apriDettaglio(nuove[0].id), etichetta: 'Dettagli' });
    else showToast(`${coppie.length} cose aggiunte`, 'success');
    return nuove;
  } catch (e) { showToast('Errore: ' + e.message, 'error'); return null; }
}
async function salvaRapido() {
  const righe = righeCampo($('rapido-testo').value);
  if (!righe.length) { $('rapido-testo').focus(); return; }
  fermaDettatura();
  if (await aggiungiFrasi(vociDaRighe(righe, ui.rapido), { ...ui.rapido })) closeModal('rapidoOverlay');
}
// campo fisso del telefono: stesso riepilogo, in breve; «Modifica» apre il foglio con il testo
function disegnaAnteprimaCattura() {
  const box = $('cattura-anteprima');
  if (!box) return;
  const voci = vociDaRighe(righeCattura(), {});
  box.hidden = !voci.length;
  if (!voci.length) { box.innerHTML = ''; return; }
  const prime = voci.slice(0, 2).map(v => `<span class="p-q${v.q}"><i class="ti ${TIPI[v.q].icon}" aria-hidden="true"></i>${escHtml(sintesiVoce(v))}${v.passi.length ? ` — ${frasePassi(v.passi.length)}` : ''}</span>`).join('');
  box.innerHTML = `<div class="ca-voci">${prime}${voci.length > 2 ? `<span class="muted">+ altre ${voci.length - 2}</span>` : ''}</div>
    <button type="button" class="btn btn-ghost btn-sm" data-act="cattura-modifica"><i class="ti ti-pencil"></i>Modifica</button>`;
}
AZIONI['cattura-modifica'] = () => { const t = $('cattura-testo').value; fermaDettatura(); $('cattura-testo').value = ''; allungaCattura(); disegnaAnteprimaCattura(); apriRapidoCon(t); };
$('cattura-testo').addEventListener('input', disegnaAnteprimaCattura);

// ─── ?nuova=<testo>: dopo l'accesso apre il «+» con il testo già interpretato (Comando Rapido «Cicli») ───
const NUOVA_URL = { PARAM: 'nuova', MAX: 2000, ATTESA_MS: 15000, PASSO_MS: 200 };
function testoNuovaDaUrl() {
  try { return (new URLSearchParams(location.search).get(NUOVA_URL.PARAM) || '').trim().slice(0, NUOVA_URL.MAX); } catch (_) { return ''; }
}
function togliNuovaDaUrl() {
  try { const u = new URL(location.href); u.searchParams.delete(NUOVA_URL.PARAM); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (_) {}
}
// le persone servono per riconoscere le deleghe: si aspetta la fine del primo caricamento
function dopoIlCaricamento() {
  const inizio = Date.now();
  return new Promise(ok => { const t = setInterval(() => { if (!state.loading || Date.now() - inizio > NUOVA_URL.ATTESA_MS) { clearInterval(t); ok(); } }, NUOVA_URL.PASSO_MS); });
}

// ══════════════════════════════════════════════════════════════
