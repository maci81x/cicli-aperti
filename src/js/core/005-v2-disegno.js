// v2 · DISEGNO
// ══════════════════════════════════════════════════════════════
let _renderInCoda = false;
function render() {
  // un solo disegno per giro: realtime e azioni possono chiamare render più volte di fila
  if (_renderInCoda) return;
  _renderInCoda = true;
  Promise.resolve().then(() => { _renderInCoda = false; disegna(); });
}


function renderSkeleton() {
  $('view').innerHTML = '<div class="vh"><div><h1>&nbsp;</h1></div></div>' + '<div class="skel"></div>'.repeat(5);
}

// Nomi dei vecchi disegni ancora chiamati dalla logica: ridisegnano la vista corrente.
function renderAgenda() { render(); }
function renderBattlePlan() { render(); }

function updateGcalButton() {
  const btn = $('gcalBtn');
  if (!btn) return;
  const ok = !!isGcalTokenValid();
  btn.classList.toggle('connected', ok);
  btn.dataset.tip = ok ? 'Google Calendar collegato' : gcalDaRicollegare() ? 'Ricollega Google Calendar' : gcalEraCollegato() ? 'Google Calendar: rinnovo il collegamento' : 'Collega Google Calendar';
  btn.setAttribute('aria-label', btn.dataset.tip);
}

function vuoto(icona, titolo, testo, azione) {
  return `<div class="group empty"><span class="empty-ico"><i class="ti ${icona}"></i></span><h3 class="t-title">${titolo}</h3>${testo ? `<p>${testo}</p>` : ''}${azione || ''}</div>`;
}

function accordion(chiave, titolo, destra, corpo) {
  const aperto = ui.aperti.has(chiave);
  return `<div class="acc"><button type="button" class="acc-head" data-act="acc" data-k="${chiave}" aria-expanded="${aperto}"><i class="ti ti-chevron-right"></i><span class="acc-title">${titolo}</span><span class="acc-count">${destra || ''}</span></button><div class="acc-body">${aperto ? corpo : ''}</div></div>`;
}

const SVG_SPUNTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>';


function evidenzia(testo, q) {
  const t = String(testo || ''), i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return escHtml(t);
  return escHtml(t.slice(0, i)) + '<mark>' + escHtml(t.slice(i, i + q.length)) + '</mark>' + escHtml(t.slice(i + q.length));
}

// ══════════════════════════════════════════════════════════════
