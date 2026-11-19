// v4 · IMPOSTAZIONI: cuscinetti automatici, email del coach, nome
// ══════════════════════════════════════════════════════════════
function sezionePiano() {
  const auto = cuscAutomatici();
  const mancano = [state.passiColOk === false && 'Passi', state.cuscColOk === false && 'cuscinetti', state.statsColOk === false && 'percentuale e motivi della settimana'].filter(Boolean);
  return `${mancano.length ? `<div class="avviso"><i class="ti ti-alert-triangle"></i><span>Spenti: ${mancano.join(', ')}. Manca la migration v4: esegui <span class="mono">supabase_migration_v4.sql</span> nel SQL Editor di Supabase.</span></div>` : ''}
    <p class="list-head"><span>Piano della settimana</span></p>
    <div class="group">
      <button type="button" class="riga-link" data-act="cusc-auto" role="switch" aria-checked="${auto}"${state.cuscColOk === false ? ' disabled' : ''}><i class="ti ti-lifebuoy"></i><span>Cuscinetti automatici<small>In un piano nuovo, ogni giorno lavorativo alle ${CUSC.META} e alle ${CUSC.FINE}, un'ora. Li cambi nel piano.</small></span><span></span><span class="switch"></span></button>
      <div class="riga-link riga-scelta"><i class="ti ti-send"></i><label for="set-coach">Email del coach<small>«Invia il piano» la mette come destinatario</small></label>
        <div class="tools-row"><input type="email" class="input" id="set-coach" data-act="set-coach" value="${esc(emailCoach())}" autocomplete="email" inputmode="email"></div></div>
      <div class="riga-link riga-scelta"><i class="ti ti-user"></i><label for="set-nome">Il tuo nome<small>Nel titolo del PDF e nell'oggetto dell'email</small></label>
        <div class="tools-row"><input type="text" class="input" id="set-nome" data-act="set-nome" value="${esc(nomeUtente())}" autocomplete="name"></div></div>
    </div>`;
}

// Le colonne della migration v4: senza, passi, cuscinetti e numeri salvati si spengono.
async function rilevaColonneV4() {
  const prova = async (tabella, colonne) => { try { const { error } = await db.from(tabella).select(colonne).limit(1); return !error; } catch (_) { return false; } };
  [state.passiColOk, state.cuscColOk, state.statsColOk] = await Promise.all([
    prova('cicli', 'id,parent_id'),
    prova('battle_plan_items', 'id,tipo_slot'),
    prova('battle_plan', 'id,pianificate,completate,percentuale,motivi')
  ]);
  render();
}

// La logica di «Fatto» resta quella: qui si aggiunge solo il «le tue 3 sono fatte».
const _azioneFattoBase = azioneFatto;
azioneFatto = async function (id) {
  const prima = focusAperte();
  await _azioneFattoBase(id);
  const dopo = focusAperte();
  if (prima.tot && prima.aperte > 0 && dopo.aperte === 0) setTimeout(() => showToast('Hai chiuso tutto quello che volevi portare a casa oggi. Il resto è bonus.', 'success', {}), 600);
};
