# Fase C — inventario dei candidati (generato il 19/11 su index.html e8ef9bc5…)

Righe = righe di `index.html`; il file di `src/` è indicato accanto. Generato da script nello scratchpad (`candidati.js`, `css_candidati.js`); verifiche dinamiche descritte nella bozza.

## 1. Funzioni mai chiamate (25)

Nessun riferimento nel JS (escluse dichiarazione e riferimenti da altre funzioni morte), nell’HTML, in `data-act`/`onclick` o in stringhe.

| Funzione | Righe | File |
|---|---|---|
| `formatWeekLabel` | 3631-3636 | `js/core/000-04-utils.js:21` |
| `catIcona` | 3685-3694 | `js/core/000-04-utils.js:75` |
| `filterByCat` | 3853-3858 | `js/core/000-07-navigation.js:15` |
| `filterByPersona` | 3860-3863 | `js/core/000-07-navigation.js:22` |
| `dayName` | 4602-4604 | `js/core/000-25-date-utils.js:23` |
| `monthName` | 4606-4610 | `js/core/000-25-date-utils.js:27` |
| `getMaCssClass` | 4615-4619 | `js/altro/000-26-macro-area-helpers.js:4` |
| `getMaColor` | 4621-4621 | `js/altro/000-26-macro-area-helpers.js:10` |
| `getMaEmoji` | 4622-4622 | `js/altro/000-26-macro-area-helpers.js:11` |
| `retryFailedSyncs` | 4945-4952 | `js/calendario/000-28-google-calendar-oauth-sync.js:284` |
| `batchSyncAll` | 4965-4975 | `js/calendario/000-28-google-calendar-oauth-sync.js:304` |
| `openPostponeModal` | 5001-5009 | `js/pianifica/000-34-modal-posticipa.js:4` |
| `agendaDayDate` | 5112-5117 | `js/pianifica/000-41-vista-agenda-settimanale.js:8` |
| `isSameDay` | 5119-5121 | `js/pianifica/000-41-vista-agenda-settimanale.js:15` |
| `agendaPianificati` | 5233-5233 | `js/pianifica/000-41-vista-agenda-settimanale.js:129` |
| `agendaDaPianificare` | 5234-5234 | `js/pianifica/000-41-vista-agenda-settimanale.js:130` |
| `parcheggiaCiclo` | 5323-5336 | `js/pianifica/000-41-vista-agenda-settimanale.js:219` |
| `bpPctClass` | 5779-5779 | `js/pianifica/000-44-battle-plan-piano-di-battaglia-settimana.js:89` |
| `q2PianificaOra` | 6445-6456 | `js/pianifica/000-44-battle-plan-piano-di-battaglia-settimana.js:755` |
| `switchView` | 6657-6669 | `js/core/004-v2-navigazione.js:28` |
| `chiudiRapido` | 9464-9464 | `js/cattura/031-v3-inserimento-a-un-campo-invio-salvata-una.js:28` |
| `v30InDaPianificare` | 20235-20242 | `js/calendario/094-v30-4-11-i-promemoria-del-calendario-non-inv.js:28` |
| `agendaBaseCicli` | 5227-5229 | `js/pianifica/000-41-vista-agenda-settimanale.js:123` |
| `v30Marca` | 20232-20232 | `js/calendario/094-v30-4-11-i-promemoria-del-calendario-non-inv.js:25` |
| `applyFilters` | 3872-3877 | `js/core/000-08-render.js:8` |

### Catene mai chiamate (1)

Gli unici riferimenti sono i propri alias e le proprie riassegnazioni: si toglie tutta la catena.

| Funzione | Righe | File | Alias |
|---|---|---|---|
| `apriNuovo` | 7230-7244 | `js/core/009-v2-foglio-nuova-cosa-dettaglio-i-campi-sono.js:7` | `_apriNuovoPr` |

## 2. Strati sostituiti (33 funzioni)

Lo strato indicato riscrive la funzione senza richiamare la versione precedente: base e strati prima di lui (con i loro alias) non sono richiamati da nessuno.

| Funzione | Sostituita a riga | Base | Strati prima | Alias da togliere | Note |
|---|---|---|---|---|---|
| `caricaEventi` | 14926 (`js/core/073-03-24-10-iphone-la-vista-non-resta-scivolat.js:120`) | 6907-6928 | 10576-10586, 12676-12688 | `_caricaEventiV6` |  |
| `eventiDelGiorno` | 10589 (`js/calendario/047-v5-google-calendar-due-calendari-letti-lavo.js:88`) | 6929-6932 | — | — |  |
| `rigaEvento` | 13538 (`js/calendario/070-v9-appuntamenti-toccabili.js:77`) | 9771-9774 | 10596-10607 | — |  |
| `ensureGcalCalendar` | 13989 (`js/cattura/073-01-22-10-sera-e-una-cosa-da-fare-dal-foglio.js:48`) | 4843-4861 | 10612-10631 | — |  |
| `bpwAggiungiCusc` | 10663 (`js/pianifica/048-v5-cuscinetti-negli-spazi-liberi-non-piu-a.js:30`) | 9790-9793 | — | — |  |
| `bpwConEventi` | 10684 (`js/pianifica/048-v5-cuscinetti-negli-spazi-liberi-non-piu-a.js:51`) | 8085-8090 | — | — |  |
| `quandoPiano` | 10763 (`js/oggi/050-v5-banner-e-ora-del-business-plan-incontro.js:3`) | 9610-9613 | — | — |  |
| `bannerPiano` | 10783 (`js/oggi/050-v5-banner-e-ora-del-business-plan-incontro.js:23`) | 9630-9642 | — | — |  |
| `inviaPianoProssima` | 10812 (`js/oggi/050-v5-banner-e-ora-del-business-plan-incontro.js:52`) | 10174-10183 | — | — |  |
| `chiudiBlocco` | 14050 (`js/cattura/073-01-22-10-sera-e-una-cosa-da-fare-dal-foglio.js:109`) | 10112-10122 | 10969-10969, 13733-13741 | `_chiudiBloccoV4`, `_chiudiBloccoV9` |  |
| `salvaRapido` | 13041 (`js/cattura/066-v9-spesa-con-sotto-righe-che-iniziano-con-o.js:188`) | 9475-9480 | — | — |  |
| `salvaCattura` | 16380 (`js/smaltisci/074-01-4-chiudi-la-settimana-in-una-schermata-l.js:335`) | 11769-11779 | 13060-13070, 13835-13840, 15637-15643 | `_salvaCatturaV9`, `_salvaCatturaPr` |  |
| `disegnaAnteprima` | 16276 (`js/smaltisci/074-01-4-chiudi-la-settimana-in-una-schermata-l.js:231`) | **resta** | 13803-13810, 14520-14530, 15568-15584 | `_disegnaAnteprimaV9`, `_disegnaAnteprimaDopp`, `_disegnaAnteprimaPr` | la base resta: l’ascoltatore `input` alla riga 12976 tiene l’oggetto funzione base |
| `disegnaAnteprimaCattura` | 16287 (`js/smaltisci/074-01-4-chiudi-la-settimana-in-una-schermata-l.js:242`) | **resta** | 13813-13818, 14532-14538, 15586-15598 | `_disegnaAnteprimaCatturaV9`, `_disegnaAnteprimaCatturaDopp`, `_disegnaAnteprimaCatturaPr` | la base resta: l’ascoltatore `input` alla riga 13059 tiene l’oggetto funzione base |
| `corpoEvento` | 14030 (`js/cattura/073-01-22-10-sera-e-una-cosa-da-fare-dal-foglio.js:89`) | 10023-10028 | — | — |  |
| `sincronizzaPromemoria` | 14107 (`js/cattura/073-01-22-10-sera-e-una-cosa-da-fare-dal-foglio.js:166`) | 10734-10758 | — | — |  |
| `eventoInElenco` | 14150 (`js/cattura/073-01-22-10-sera-e-una-cosa-da-fare-dal-foglio.js:209`) | 13584-13597 | — | — |  |
| `gruppiAperti` | 15068 (`js/altro/073-04-24-10-copia-errori-in-altro-impostazioni.js:98`) | 14570-14573 | — | — |  |
| `offriFallaOraDopo` | 16356 (`js/smaltisci/074-01-4-chiudi-la-settimana-in-una-schermata-l.js:311`) | 15644-15649 | — | — |  |
| `unisciGruppo` | 16496 (`js/smaltisci/074-01-4-chiudi-la-settimana-in-una-schermata-l.js:451`) | 14606-14630 | — | — |  |
| `eventoSpuntabile` | 17773 (`js/calendario/079-v15-28-10-appuntamenti-si-spuntano-tutti-anc.js:7`) | 13499-13499 | 17065-17065 | `_eventoSpuntabileV11` |  |
| `disegnaFoglioEvento` | 17829 (`js/calendario/079-v15-28-10-appuntamenti-si-spuntano-tutti-anc.js:63`) | 13569-13583 | 17084-17100 | `_disegnaFoglioEventoV11` |  |
| `azioneElimina` | 17148 (`js/smaltisci/075-v11-togliere-25-10.js:145`) | 7166-7175 | — | — |  |
| `apriRapidoCon` | 17244 (`js/cattura/076-v12-26-10-cosa-hai-in-testa-che-non-perde-ni.js:43`) | 12981-12981 | — | — |  |
| `switchCtx` | 17579 (`js/altro/077-v13-27-10-una-lista-sola-lavoro-e-personale.js:25`) | 3843-3850 | — | — |  |
| `vistaFatte` | 17726 (`js/smaltisci/078-v14-28-10-fatta-sparisce.js:67`) | 7853-7867 | — | — |  |
| `orarioEvento` | 18914 (`js/pianifica/090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js:14`) | 9770-9770 | — | — |  |
| `stampaGiorno` | 19419 (`js/pianifica/090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js:519`) | 18418-18440 | — | — |  |
| `v25RitmoCard` | 20460 (`js/oggi/095-v31-04-11-carta-di-precisione-fase-1-e-via-l.js:114`) | 18783-18792 | 19471-19483 | — |  |
| `creaDaSubito` | 19705 (`js/cattura/091-v27-3-11-dopo-una-subito-due-passi-chiari.js:59`) | 11003-11015 | — | — |  |
| `cercaCicliInCalendario` | 20243 (`js/calendario/094-v30-4-11-i-promemoria-del-calendario-non-inv.js:36`) | 11242-11262 | — | — |  |
| `cardCoach` | 20355 (`js/oggi/095-v31-04-11-carta-di-precisione-fase-1-e-via-l.js:9`) | 12587-12596 | — | — |  |
| `v22RigaCoach` | 20356 (`js/oggi/095-v31-04-11-carta-di-precisione-fase-1-e-via-l.js:10`) | 18452-18459 | — | — |  |

## 3. Selettori CSS che richiedono una classe che nessun elemento ha (39)

Classe assente come requisito (non dentro `:not()`). Escluse le classi composte dal codice (`p-q${q}`, `t-q${…}`, `chip-q${q}`, `v17-q${q}`). Prefisso costruito = qualunque testo letterale davanti a `${…}` o a `' + …` (così `tag-q${q}` tiene vive `tag-q3` e `tag-q4`). Verificate a mano come morte nonostante un prefisso simile: `toast-danger` (`'toast-' + n` è un id), `v25-sezione-chip` (`'v25-' + nome` è una chiave).

| Riga | Selettore | Classi assenti |
|---|---|---|
| 269 | `.item.is-open .item-side .ti` | is-open |
| 279 | `.item-detail` | item-detail |
| 280 | `.item.is-open .item-detail` | is-open, item-detail |
| 281 | `.item.is-open .item-title` | is-open |
| 282 | `.item-note` | item-note |
| 283 | `.facts` | facts |
| 284 | `.fact` | fact |
| 285 | `.fact .ti` | fact |
| 286 | `.item-actions` | item-actions |
| 287 | `.item-actions .btn-icon` | item-actions |
| 290 | `.dense .item-row` | dense |
| 291 | `.dense .check` | dense |
| 292 | `.dense .check-box` | dense |
| 293 | `.dense .check-box svg` | dense |
| 294 | `.dense .item-title` | dense |
| 295 | `.dense .item-meta` | dense |
| 311 | `.bar-sm` | bar-sm |
| 319 | `.toast-danger .ti:first-child` | toast-danger |
| 320 | `[data-theme="dark"] .toast-danger .ti:first-child` | toast-danger |
| 331 | `.fab` | fab |
| 332 | `[data-theme="dark"] .fab` | fab |
| 333 | `.fab:active` | fab |
| 334 | `.fab .ti` | fab |
| 404 | `.tabbar .tab-add` | tab-add |
| 405 | `.tabbar .fab` | fab |
| 406 | `.tabbar .fab .ti` | fab |
| 407 | `.tabbar .tab-add:active .fab` | tab-add, fab |
| 453 | `.solo-desk` (@media (max-width: 767px)) | solo-desk |
| 661 | `.acc-body .pad` | pad |
| 662 | `.acc-body .pad p` | pad |
| 705 | `.bp-rev-opt.sel` | bp-rev-opt |
| 714 | `.det-box .pv-row` | pv-row |
| 790 | `.q-badge` | q-badge |
| 816 | `.bp-warn` | bp-warn |
| 817 | `.bp-tip` | bp-tip |
| 1211 | `.ptr` | ptr |
| 1212 | `.ptr.on` | ptr |
| 1876 | `.v25-sezione-chip` | v25-sezione-chip |
| 2300 | `.v40-altre` | v40-altre |

Restano (classe assente solo dentro `:not()`, il selettore funziona): `.item:not(.is-open) .item-side .ti-chevron-down`.

## 4. Variabili delle tavolozze sempre coperte (252 dichiarazioni)

Una dichiarazione `--x` sulla radice è coperta se, per ogni selettore della sua regola, una regola successiva o più specifica, nello stesso contesto (`@media` compreso) e sempre attiva quando lei lo è, ridefinisce la stessa variabile. Verifica dinamica: valori calcolati di tutte le 106 variabili in 5 stati (chiaro, scuro, contrasto alto chiaro/scuro, tema di sistema scuro) identici prima e dopo.

| Regola | Dichiarazioni | Righe |
|---|---|---|
| `:root` | 4 | 68–1912 |
| `:root, [data-theme="light"]` | 47 | 100–137 |
| `[data-theme="dark"]` | 47 | 142–180 |
| `[data-contrast="alto"]` | 5 | 629–629 |
| `:root[data-theme="dark"]` | 3 | 1914–1914 |
| `html:root, html[data-theme="light"]` | 69 | 2034–2351 |
| `html:root[data-theme="dark"]` | 66 | 2058–2370 |
| `html:root` | 11 | 2256–2256 |

Nota: le regole del contrasto alto della v1 (riga 629) sono coperte; il contrasto alto funziona grazie a `html:root[data-contrast="alto"]` della v30 (righe 2080–2081).
