// v5 · METODO i-TIME — costanti e impostazioni (vedi privata/DECISIONI.md, solo in locale)
// ══════════════════════════════════════════════════════════════
const LS5 = { PIANO_DURATA: 'piano_durata', FORMATO: 'foglio_formato', PROTEGGI: 'proteggi_q2', CC: 'coach_cc', STAMPATO: 'piano_stampato',
  CAL_SCRITTURA: 'gcal_cal_scelto', PROM: 'promemoria_cal', SUBITO: 'subito_chiesto', CICLI_CAL: 'cal_cicli_scelte', Q2_AGENDA: 'q2_agenda_scelte',
  BANNER_Q2: 'banner_q2_chiuso', BANNER_CICLI: 'banner_cicli_chiuso', COACH_V5: 'coach_v5' };
// Calendario di scrittura (dal 22/10): Lavoro. I «Cicli Aperti — Battle Plan» non ci sono più e l'app non crea calendari.
const GCAL_CAL_PREFERITO = 'r.macinai@sisoluzioniimpresa.it';
// Calendari da leggere: niente colleghi, sale o festività
const CAL_LETTURA = [
  { id: 'r.macinai@sisoluzioniimpresa.it', tipo: 'lavoro', nome: 'Lavoro' },
  { id: 'maci81x@gmail.com', tipo: 'privato', nome: 'Privato' }
];
const MIE_EMAIL = new Set(CAL_LETTURA.map(c => c.id));
const COACH_PERSONA = 'l.beretta@osmanagement.it';
const CC_PREDEFINITO = 'timemanagement@osmanagement.it';
const ROUTINE_ENTRO = '08:30';                                   // eventi ricorrenti del Privato prima di quest'ora = routine del mattino
const GIORNATA = { INIZIO: '09:00', FINE: '19:00', META: '14:00', CUSC_MIN: 45 };   // dove cercare i cuscinetti
const COACH_ORE = 48;                                            // il banner del coach compare 48 ore prima
const Q2 = { OGNI_GIORNI: 90, ORIZZONTE: 92, SETTIMANE: 14,
  MOMENTI: { giornata: { l: 'Giornata intera', ora: '09:00', durata: 540, fascia: 'mattina' },
             mattina: { l: 'Mattina', ora: '09:00', durata: 240, fascia: 'mattina' },
             pomeriggio: { l: 'Pomeriggio', ora: '14:00', durata: 240, fascia: 'pomeriggio' } },
  PIENO: { giornata: 300, mattina: 120, pomeriggio: 120 } };     // minuti di appuntamenti oltre i quali il giorno è «pieno»
const PROTEZIONI = [{ v: 'conferma', l: 'Conferma' }, { v: 'avviso', l: 'Solo avviso' }, { v: 'spento', l: 'Spento' }];
const FORMATI = [{ v: 'a4', l: 'A4' }, { v: 'a5', l: 'A5' }];
const DURATE_PIANO = [60, 90, 105, 120, 180];   // 105 = 16:45–18:30

const leggiJson = (k, base) => { try { return JSON.parse(lsLeggi(k) || 'null') || base; } catch (_) { return base; } };
const scriviJson = (k, v) => lsScrivi(k, JSON.stringify(v));
const minDi = hm => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + (m || 0); };
const hmDi = min => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const protezione = () => PROTEZIONI.some(p => p.v === lsLeggi(LS5.PROTEGGI)) ? lsLeggi(LS5.PROTEGGI) : 'conferma';
const formatoFoglio = () => lsLeggi(LS5.FORMATO) === 'a5' ? 'a5' : 'a4';
const emailCC = () => { const v = lsLeggi(LS5.CC); return v === null ? CC_PREDEFINITO : v.trim(); };
const durataPiano = () => DURATE_PIANO.includes(parseInt(lsLeggi(LS5.PIANO_DURATA), 10)) ? parseInt(lsLeggi(LS5.PIANO_DURATA), 10) : 105;
function stampati() { return leggiJson(LS5.STAMPATO, {}); }
function stampatoIl(week, year) { const iso = stampati()[settKey(week, year)]; return iso ? fmtGgMm(iso) : ''; }
function segnaStampato(week, year) { scriviJson(LS5.STAMPATO, { ...stampati(), [settKey(week, year)]: oggiLocale() }); }
const bloccoEsterno = c => !!c && String(c.calendar_event_id || '').startsWith('ext:');   // collegata a un evento ricorrente del calendario Lavoro
const eInderogabile = c => !!c && !!c.inderogabile && state.inderoColOk && !c.done && protezione() !== 'spento';

// Le colonne della migration i-Time (parte a): senza, le funzioni che ne dipendono si spengono.
async function rilevaColonneV5() {
  const prova = async (tabella, colonne) => { try { const { error } = await db.from(tabella).select(colonne).limit(1); return !error; } catch (_) { return false; } };
  [state.inderoColOk, state.ritorniColOk, state.q2ColOk, state.riportoColOk, state.esQ2Ok, state.areeColOk] = await Promise.all([
    prova('cicli', 'id,inderogabile'), prova('cicli', 'id,ritorni_delega'), prova('battle_plan', 'id,q2_spostate'),
    prova('battle_plan', 'id,riportato_at'), prova('esercizi_q2', 'id,fatto_at'), prova('macro_aree', 'id,categorie')
  ]);
  await Promise.all([caricaAree(), caricaUltimoQ2()]);
  render();
}

// ══════════════════════════════════════════════════════════════
