// v2 · AGGANCI ALLA LOGICA E AVVIO
// ══════════════════════════════════════════════════════════════
// Il select categoria mostra solo i nomi e, in fondo, «+ Nuova categoria».
const _renderCatOptionsBase = renderCatOptions;
renderCatOptions = function (ctx) {
  _renderCatOptionsBase(ctx);
  const sel = $('f-cat');
  if (!sel) return;
  [...sel.options].forEach(o => { o.textContent = catNome(o.value); });
  const o = document.createElement('option');
  o.value = '__nuova__'; o.textContent = '+ Nuova categoria';
  sel.appendChild(o);
};

// Spostare una riga nell'agenda sposta anche la sua riga nel piano della settimana.
const _moveCicloInAgendaBase = moveCicloInAgenda;
moveCicloInAgenda = async function (cicloId, giorno, fascia) {
  await _moveCicloInAgendaBase(cicloId, giorno, fascia);
  const item = state.bp ? itemDelPiano(cicloId) : null;
  if (item && (item.giorno !== giorno || item.fascia !== fascia)) {
    const { error } = await db.from('battle_plan_items').update({ giorno, fascia }).eq('id', item.id);
    if (!error) state.bpItems = state.bpItems.map(i => i.id === item.id ? { ...i, giorno, fascia } : i);
  }
  render();
};

// Nel wizard, accanto a ogni giorno, il tempo già preso dagli appuntamenti.
const _bpwRenderStep2Base = bpwRenderStep2;
bpwRenderStep2 = function () {
  // senza giorno = «in settimana»: così chip, colonne e riepilogo dicono la stessa cosa
  _bpwSel.forEach((v, id) => { if (!v.giorno) _bpwSel.set(id, { ...v, giorno: 'settimana', fascia: null }); });
  _bpwRenderStep2Base(); decoraWizard(); bpwChipGiorni();
};

// Dopo il collegamento a Google Calendar: carica gli appuntamenti della settimana.
const _handleGcalTokenBase = _handleGcalToken;
_handleGcalToken = async function (resp) { await _handleGcalTokenBase(resp); caricaEventi(state.week, state.year); render(); riconciliaCalendar(); };

// ══════════════════════════════════════════════════════════════
