// v49 · 19/11 — approvate le bozze della sezione 17 e lo stile di Pianifica della 14 con i colori della 15:
// (1) Smaltisci: le rimaste indietro una alla volta (tasti sul computer, bottoni grandi sul telefono)
// (2) Oggi sul computer: un solo riquadro «Da controllare» (posta, obiettivi, calendario, deleghe, preparazioni, il metodo)
// (3) Pianifica: ogni cosa e ogni appuntamento è una scheda a sé; appuntamenti viola (con altri pieno, tuoi chiaro) con l'orario a sinistra; spazi liberi in una riga sottile
// ══════════════════════════════════════════════════════════════
ui.v49 = null;
document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="v49Overlay" onclick="closeModalOnBg(event,'v49Overlay')">
  <div class="modal sheet v49-sm" role="dialog" aria-modal="true" aria-labelledby="v49-t"><div class="sheet-grab"></div><div id="v49-corpo"></div></div></div>`);
function v49Lista() { return v47Indietro(); }
function v49Da(c) {
  if (c.pianificato_data) return v45Da(c);
  try { const r = rimasteVisibili().find(x => x.item.ciclo_id === c.id); const d = r && carryData(r.item, r.plan); if (d) return 'rimasta da ' + d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'numeric' }); } catch (_) {}
  return 'rimasta da una settimana passata';
}
function v49Apri() {
  ui.v49 = { idx: 0, fatte: 0, storia: [] };
  v49Disegna();
  $('v49Overlay').classList.add('open');
  setTimeout(() => { const b = document.querySelector('#v49-corpo .v48-g'); if (b && window.innerWidth >= 768) b.focus(); }, 50);
}
function v49Disegna() {
  const box = $('v49-corpo'), s = ui.v49;
  if (!box || !s) return;
  const l = v49Lista(), tot = s.fatte + l.length;
  const kbd = t => `<kbd>${t}</kbd>`;
  const testa = n => `<div class="v49-testa"><span class="v49-k" id="v49-t">Smaltisci le rimaste indietro</span><span class="mono">${n}</span>
    <button type="button" class="btn btn-icon" onclick="closeModal('v49Overlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div class="v49-barra" aria-hidden="true"><span style="width:${tot ? Math.round(s.fatte / tot * 100) : 100}%"></span></div>`;
  if (!l.length) {
    box.innerHTML = testa(`${s.fatte} di ${tot}`) + `<div class="v49-fine"><i class="ti ti-circle-check" aria-hidden="true"></i><p class="v49-fine-t">Niente più rimaste indietro</p>
      <p class="t-caption muted">${s.fatte ? `Ne hai sistemate ${s.fatte}.` : 'Non ce n\'erano.'}</p>
      <div class="v49-fine-b">${s.storia.length ? `<button type="button" class="btn btn-ghost" data-act="v49-annulla"><i class="ti ti-arrow-back-up"></i>Annulla l'ultima</button>` : ''}<button type="button" class="btn btn-primary" onclick="closeModal('v49Overlay')">Chiudi</button></div></div>`;
    return;
  }
  if (s.idx >= l.length) {
    box.innerHTML = testa(`${s.fatte} di ${tot}`) + `<div class="v49-fine"><i class="ti ti-player-skip-forward" aria-hidden="true"></i><p class="v49-fine-t">Le hai viste tutte</p>
      <p class="t-caption muted">Ne restano ${l.length} che hai saltato.</p>
      <div class="v49-fine-b"><button type="button" class="btn btn-ghost" onclick="closeModal('v49Overlay')">Basta per ora</button><button type="button" class="btn btn-primary" data-act="v49-ricomincia">Ricomincia da quelle</button></div></div>`;
    return;
  }
  const c = l[s.idx], q = computeEffectiveQ(c), oggi = oggiData();
  const corrente = eSettimanaCorrente();
  const giorni = Array.from({ length: 8 }, (_, i) => piuGiorni(oggi, i)).map((d, i) => {
    const iso = toISODate(d), lb = v48Libere(d);
    const nome = i === 0 ? 'Oggi' : i === 1 ? 'Domani' : d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');
    return `<button type="button" class="v48-g${lb.pieno ? ' pieno' : ''}${lb.weekend ? ' we' : ''}${i < 2 ? ' v49-big' : ''}" data-act="v49-giorno" data-iso="${iso}" aria-label="${escHtml(fmtGiorno(d))}${lb.t ? ', libere ' + escHtml(lb.t) : ''}">
      <span class="v48-n">${escHtml(nome)}${i < 2 ? ` ${kbd(i + 1)}` : ''}</span><b>${d.getDate()}</b><span class="v48-l mono">${escHtml(lb.t || ' ')}</span></button>`;
  }).join('');
  const scelta = (act, ico, t, sub, k, extra = '') => `<button type="button" class="v49-sc${extra}" data-act="${act}"><i class="ti ${ico}" aria-hidden="true"></i><span><b>${t}</b><small>${sub}</small></span>${kbd(k)}</button>`;
  box.innerHTML = testa(`${s.fatte + s.idx + 1} di ${tot}`) + `
    <div class="v49-cosa p-q${q}"><p class="v49-tit">${escHtml(c.title)}</p>
      <p class="v49-meta"><span class="v49-da">● ${escHtml(v49Da(c))}</span> · ${escHtml(TIPI[q].label)}${c.durata_minuti ? ` · ${c.durata_minuti} min` : ''}</p></div>
    <p class="v49-dom">Quando la fai? <small>sotto la data, le ore libere tolti gli appuntamenti</small></p>
    <div class="v48-giorni v49-giorni">${giorni}</div>
    <div class="v49-scelte">
      ${corrente ? scelta('v49-settimana', 'ti-bulb', 'Pensaci dopo', 'in settimana, senza giorno', '3') : ''}
      ${scelta('v49-chiusa', 'ti-check', 'È chiusa', 'fatta, la tolgo', '4', ' v49-ok')}
      ${scelta('v49-delega', 'ti-user-share', 'Delega', 'a chi e quando controlli', 'D')}
      ${scelta('v49-lascia', 'ti-wind', 'Lascia stare', 'va in Un giorno', 'L')}
    </div>
    <div class="v49-piede">
      <button type="button" class="btn btn-ghost btn-sm" data-act="v49-indietro"${s.idx ? '' : ' disabled'}><i class="ti ti-arrow-left"></i>Indietro</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="v49-annulla"${s.storia.length ? '' : ' disabled'}><i class="ti ti-arrow-back-up"></i>Annulla l'ultima <span class="v49-solo-pc">${kbd('Z')}</span></button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="v49-salta">Salta<i class="ti ti-arrow-right"></i></button>
    </div>`;
}
async function v49Fai(tipo, iso) {
  const s = ui.v49; if (!s || s.occupato) return;
  const c = v49Lista()[s.idx]; if (!c) return;
  if (tipo === 'delega') { closeModal('v49Overlay'); apriDelega(c.id); return; }
  const f = v48Foto(c.id); f.q = c.q;
  s.occupato = true;
  try {
    if (tipo === 'giorno') await v48MettiIn(c.id, iso);
    else if (tipo === 'settimana') await bordoSposta(c.id, 'settimana');
    else if (tipo === 'chiusa') await azioneFatto(c.id);
    else if (tipo === 'lascia') await azioneLascia(c.id);
    const d = ciclo(c.id);
    const fatto = !d || tipo === 'chiusa' ? !!(d && d.done) || !d : !v49Lista().some(x => x.id === c.id);
    if (fatto) { s.storia.push({ tipo, f, id: c.id }); s.fatte++; }
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
  finally { s.occupato = false; }
  v49Disegna();
}
async function v49Annulla() {
  const s = ui.v49, u = s && s.storia.pop();
  if (!u) return;
  try {
    if (u.tipo === 'chiusa') { const c = ciclo(u.id); if (c && c.done) await azioneFatto(u.id); }
    else if (u.tipo === 'lascia') await patchCiclo(u.id, { q: u.f.q, ...(state.parcheggioColsOk ? { parcheggiato: !!u.f.campi.parcheggiato, parcheggiato_at: u.f.campi.parcheggiato_at || null } : {}) });
    else await v48Rimetti(u.f);
    s.fatte = Math.max(0, s.fatte - 1);
    const i = v49Lista().findIndex(x => x.id === u.id);
    if (i >= 0) s.idx = i;
    render();
  } catch (e) { showToast('Non riesco ad annullare: ' + e.message, 'error'); }
  v49Disegna();
}
Object.assign(AZIONI, {
  'v49-apri': () => v49Apri(),
  'v49-giorno': el => v49Fai('giorno', el.dataset.iso),
  'v49-settimana': () => v49Fai('settimana'),
  'v49-chiusa': () => v49Fai('chiusa'),
  'v49-lascia': () => v49Fai('lascia'),
  'v49-delega': () => v49Fai('delega'),
  'v49-salta': () => { if (ui.v49) { ui.v49.idx++; v49Disegna(); } },
  'v49-indietro': () => { if (ui.v49 && ui.v49.idx) { ui.v49.idx--; v49Disegna(); } },
  'v49-annulla': () => v49Annulla(),
  'v49-ricomincia': () => { if (ui.v49) { ui.v49.idx = 0; v49Disegna(); } }
});
// il bollino «N rimaste indietro» e il gruppo in Da pianificare aprono Smaltisci
AZIONI['v47-vai-indietro'] = () => v49Apri();
document.addEventListener('click', e => { if (e.target.closest('summary [data-act="v49-apri"]')) e.preventDefault(); }, true);
document.addEventListener('keydown', e => {
  const o = $('v49Overlay');
  if (!o || !o.classList.contains('open') || !ui.v49 || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase(), oggi = oggiData();
  const mappa = { '1': () => v49Fai('giorno', toISODate(oggi)), '2': () => v49Fai('giorno', toISODate(piuGiorni(oggi, 1))), '3': () => eSettimanaCorrente() && v49Fai('settimana'), '4': () => v49Fai('chiusa'),
    'd': () => v49Fai('delega'), 'l': () => v49Fai('lascia'), 'z': () => v49Annulla(), 'arrowright': AZIONI['v49-salta'], 'arrowleft': AZIONI['v49-indietro'] };
  if (mappa[k]) { e.preventDefault(); mappa[k](); }
});
{
  const _listaV49 = htmlDaPianificareLista;
  htmlDaPianificareLista = function () {
    const h = _listaV49.apply(this, arguments);
    if (!/class="v47-indietro"/.test(h)) return h;
    return '<button type="button" class="v49-sm-btn v50-sm-riga" data-act="v49-apri"><i class="ti ti-player-track-next" aria-hidden="true"></i>Smaltisci, una alla volta</button>' + h;
  };
}
// Oggi: sotto «Oggi: N cose da chiudere», il bottone per smaltire le rimaste indietro
{
  const _oggiV49a = vistaOggi;
  vistaOggi = function () {
    let h = _oggiV49a.apply(this, arguments);
    try {
      const n = v49Lista().length;
      if (!n) return h;
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const card = tpl.content.querySelector('.v12-card.v12-rosso');
      const b = `<button type="button" class="v49-oggi" data-act="v49-apri"><i class="ti ti-player-track-next" aria-hidden="true"></i><span>Smaltisci ${n === 1 ? 'la rimasta indietro' : `le ${n} rimaste indietro`}</span><i class="ti ti-chevron-right" aria-hidden="true"></i></button>`;
      if (card) card.insertAdjacentHTML('beforeend', b);
      else { const g = tpl.content.querySelector('.v33-centro') || tpl.content.querySelector('.v12-oggi') || tpl.content; g.insertAdjacentHTML('afterbegin', b); }
      const d = document.createElement('div'); d.appendChild(tpl.content); h = d.innerHTML;
    } catch (e) { console.warn('[v49] oggi smaltisci:', e.message); }
    return h;
  };
}
// (2) Oggi sul computer: «Da controllare»
ui.v49Aperti = ui.v49Aperti || new Set();
function v49Chiave(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9àèéìòù]+/g, '-').slice(0, 40); }
{
  const _oggiV49b = vistaOggi;
  vistaOggi = function () {
    let h = _oggiV49b.apply(this, arguments);
    if (!/v33-tre/.test(h)) return h;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, tre = f.querySelector('.v33-tre'), dx = f.querySelector('.v33-dx');
      if (!tre || !dx) return h;
      const righe = [];
      const testo = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
      // già compatti: restano come sono (si aprono da soli)
      tre.querySelectorAll('.v31-ob, .v23-posta').forEach(el => { el.classList.add('v49-diretto'); righe.push(el.outerHTML); el.remove(); });
      const blocchi = [...tre.querySelectorAll('.v29-prep, .banner-piano, .v43-metodo .v12-card')];
      blocchi.forEach(el => {
        const tEl = el.querySelector('.v29-t, b, h3, strong') || el.querySelector('p');
        const t = testo(tEl) || 'Da guardare';
        const sEl = [...el.querySelectorAll('.v29-s, .t-caption, p, small')].find(x => x !== tEl && !x.contains(tEl) && testo(x) && testo(x) !== t);
        const sub = sEl ? testo(sEl) : '';
        const ico = (el.querySelector('i.ti') || {}).className || 'ti ti-point';
        const k = v49Chiave(t);
        righe.push(`<details class="v49-r" data-v49="${esc(k)}"${ui.v49Aperti.has(k) ? ' open' : ''}><summary><i class="${esc(ico)}" aria-hidden="true"></i><span class="v49-r-t"><b>${escHtml(corta(t, 60))}</b>${sub ? `<small>${escHtml(corta(sub, 70))}</small>` : ''}</span><i class="ti ti-chevron-down v49-r-v" aria-hidden="true"></i></summary><div class="v49-r-corpo">${el.outerHTML}</div></details>`);
        el.remove();
      });
      const metodo = tre.querySelector('.v43-metodo');
      if (metodo && !metodo.querySelector('.v12-card')) metodo.remove();
      if (righe.length) dx.insertAdjacentHTML('afterbegin', `<section class="v49-ctl" aria-label="Da controllare"><p class="v49-ctl-h"><span>Da controllare</span><span class="mono">${righe.length}</span></p>${righe.join('')}</section>`);
      const d = document.createElement('div'); d.appendChild(f); h = d.innerHTML;
    } catch (e) { console.warn('[v49] da controllare:', e.message); }
    return h;
  };
}
document.addEventListener('toggle', e => { const d = e.target; if (d && d.matches && d.matches('details[data-v49]')) { if (d.open) ui.v49Aperti.add(d.dataset.v49); else ui.v49Aperti.delete(d.dataset.v49); } }, true);
// (3) Pianifica: l'orario degli appuntamenti a sinistra, in colonna
function v49Orari() {
  document.querySelectorAll('.board .evt-riga.evt-app:not([data-v49o])').forEach(r => {
    r.setAttribute('data-v49o', '1');
    const m = r.querySelector('.item-meta .mono');
    const t = m && m.textContent.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
    const main = r.querySelector('.evt-main');
    if (!main) return;
    if (t) {
      main.insertAdjacentHTML('beforebegin', `<span class="v49-ore mono">${t[1]}<br>${t[2]}</span>`);
      const sep = m.nextElementSibling; if (sep && sep.classList.contains('sep')) sep.remove();
      m.remove();
    } else if (/senza orario|tutto il giorno/i.test(m ? m.textContent : '')) {
      main.insertAdjacentHTML('beforebegin', `<span class="v49-ore mono">tutto il<br>giorno</span>`);
    }
  });
  document.querySelectorAll('.board .spazio-riga .item-title:not([data-v49o])').forEach(t => {
    t.setAttribute('data-v49o', '1');
    const o = t.querySelector('.mono');
    if (o) t.innerHTML = `Libero dalle <span class="mono">${escHtml(o.textContent)}</span>`;
  });
}
{
  const _disegnaV49 = disegna;
  disegna = function () { const r = _disegnaV49.apply(this, arguments); try { v49Orari(); } catch (e) { console.warn('[v49] orari:', e.message); } return r; };
}
// ══════════════════════════════════════════════════════════════
