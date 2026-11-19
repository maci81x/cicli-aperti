// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════
let state = {
  ctx:              localStorage.getItem(LS.CTX)  || 'lavoro',
  week:             parseInt(localStorage.getItem(LS.WEEK)) || getWeekNumber(new Date()),
  year:             new Date().getFullYear(),
  view:             localStorage.getItem(LS.VIEW) || 'matrix',
  filter_cat:       localStorage.getItem(LS.CAT_FILTER) || null,
  filter_persona:   null,
  cicli:            [],
  persone:          [],
  categorie:        [],
  loading:          true,
  searchQuery:      '',
  personaDetailId:  null,
  agendaSub:        localStorage.getItem(LS.AGENDA_SUB) || 'pianificati',
  agendaOverrides:  [],
  agendaTableOk:    true,
  agendaColsOk:     true,
  parcheggioColsOk: true,
  pianificaColsOk:  true,
  ritualiColsOk:    true,
  ritualiTableOk:   true,
  ritualiCompletati: [],
  parcheggioQuery:  '',
  bp:               null,   // battle_plan della settimana selezionata
  bpItems:          [],     // battle_plan_items del bp corrente
  bpTableOk:        true
};

