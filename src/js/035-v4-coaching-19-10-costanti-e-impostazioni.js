// v4 · COACHING 19/10 — costanti e impostazioni
// ══════════════════════════════════════════════════════════════
const CUSC = { META: '13:00', FINE: '17:30', DURATA: 60, SOGLIA_FINE: '15:00' };   // cuscinetti: metà e fine giornata, 1 ora
const PIANO = { ANCORA: 1.1 };            // «Puoi aggiungerne ancora» sotto il 110 % di quante ne avevi pianificate
const SETT = { BARRE: 8, ALTEZZA: 60, BARRA: 24 };   // Fatte → Settimane: ultime 8, barre alte 60px e larghe 24
const PASSI = { GROSSA: 240 };            // da 4 ore in su: «Grossa: scomponila in passi»
const LS4 = { CUSC_AUTO: 'cuscinetti_auto', COACH: 'coach_email', NOME: 'nome_utente', BPW_CAL: 'bpw_cal', INVIATO: 'piano_inviato' };
const COACH_PREDEFINITO = 'l.beretta@osmanagement.it';   // Leonardo Beretta; timemanagement@osmanagement.it (la slide) va in copia
const NOME_PREDEFINITO = 'Roberto Macinai';
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const cuscAutomatici = () => lsLeggi(LS4.CUSC_AUTO) !== '0';
const nomeUtente = () => (lsLeggi(LS4.NOME) || '').trim() || NOME_PREDEFINITO;
const emailCoach = () => (lsLeggi(LS4.COACH) || '').trim() || COACH_PREDEFINITO;
const eTelefono = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

// Invio del piano: data per settimana, solo su questo dispositivo ({ '2026-W43': '2026-10-17' })
function inviati() { try { return JSON.parse(lsLeggi(LS4.INVIATO) || '{}') || {}; } catch (_) { return {}; } }
function inviatoIl(week, year) { const iso = inviati()[settKey(week, year)]; return iso ? fmtGgMm(iso) : ''; }
function segnaInviato(week, year) { lsScrivi(LS4.INVIATO, JSON.stringify({ ...inviati(), [settKey(week, year)]: oggiLocale() })); }

// ══════════════════════════════════════════════════════════════
