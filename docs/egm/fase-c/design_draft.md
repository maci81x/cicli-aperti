# Fase C — togliere il codice morto

*   **Author:** Roby
*   **Status:** Approved (review EGM del 19/11, correzioni applicate: [goldfish_review_report.md](goldfish_review_report.md))
*   **Date:** 2026-11-19
*   **Contesto:** [PIANO_RIORDINO.md](../../PIANO_RIORDINO.md) (fase C), [MAPPA.md](../../MAPPA.md) §3 e §5, [STATO_RIORDINO.md](../../STATO_RIORDINO.md), inventario [candidati.md](candidati.md), strumenti [tools/riordino/](../../tools/riordino/README.md). Ramo `riordino/fase-c`, da `main` a `e2603c4`.

--------------------------------------------------------------------------------

## Overview

Togliere da `src/` il codice che l'analisi statica non trova chiamato e che nessuna prova esegue: funzioni mai chiamate, strati di funzioni coperti da uno strato successivo che non li richiama, selettori CSS che richiedono una classe che nessun elemento ha, dichiarazioni di variabili CSS sempre coperte. Il comportamento non deve cambiare. Fino alla fase B la garanzia era l'**impronta** (SHA-256 di `index.html`, sempre `e8ef9bc5…`); da qui `index.html` cambia e la garanzia è la **rete di sicurezza**: le prove di `tests/` (29 file), fra cui `t51-globali` (nomi globali) e `t52-golden` (HTML delle viste e 16 schermate).

## Vincoli dati da Roby (19/11)

*   Un ramo per fase; ciclo `egm-draft` → `egm-review` → `egm-resolve`; una cosa per commit.
*   Ogni commit: 29 prove su 29 con il **criterio stretto** (uscita 0 e nessuna riga `FAIL`).
*   Attenzione alle classi costruite dal codice e alle azioni usate per nome (`AZIONI`, `data-act`, `onclick`).
*   Mai SQL sul database; non toccare dati, Gmail o Calendar; niente unione su `main` né pubblicazione senza «ok pubblica»; fermarsi solo alla chiusura (passo 6).

## Il modello a strati, in breve

```js
function f() { /* base */ }              // base
const _fV9 = f;                          // alias: tiene la versione di prima
f = function () { _fV9(); /* + v9 */ };  // strato che richiama (avvolge)
f = function () { /* tutto da capo */ };  // strato che sostituisce: base, strato v9 e alias _fV9 non girano più
```

Si tolgono base, strati prima dello strato che sostituisce e i loro alias. Un **decoratore** è `f = proteggi(f)` (avvolge). La «base catturata» è un caso a parte: se al caricamento qualcuno tiene l'oggetto funzione (`addEventListener('input', f)` prima della sostituzione), quella versione continua a girare.

## The Problem

La MAPPA (19/11) conta 23 funzioni mai chiamate, 38 strati che sostituiscono (righe della §3, 33 funzioni distinte), 23 classi senza elementi e tre tavolozze sovrascritte. Questo codice sembra attivo e non lo è, allunga i file e complica le fasi D (appiattire le catene) ed E (CSS).

**Riconciliazione con la MAPPA:**

| MAPPA | Fase C | Perché |
|---|---|---|
| 23 funzioni mai chiamate | 25 + 1 catena + 5 a cascata | `apriNuovo` (in MAPPA fra le 23) è una catena: si toglie con alias e strato; +3 usate solo da funzioni morte (`agendaBaseCicli`, `v30Marca`, `applyFilters`); +5 restano senza chiamate dopo gli strati |
| 38 righe di strati che sostituiscono | 33 funzioni | 5 funzioni compaiono due volte (`caricaEventi`, `rigaEvento`, `ensureGcalCalendar`, `salvaCattura`, `v25RitmoCard`) |
| 23 classi | 39 selettori | si contano i selettori; `tag-q3/4` sono vive (costruite da `tag-q${q}`) |
| tre tavolozze | 252 dichiarazioni in 8 regole | si tolgono solo le dichiarazioni sempre coperte; l'unificazione in una tavolozza è della fase E |

## Goals

*   Togliere, una categoria per commit: funzioni e catene mai chiamate; strati sostituiti; funzioni rimaste senza chiamate; selettori CSS morti; variabili coperte.
*   Rimettere una dichiarazione `function f` dove il commit degli strati ha tolto la base (niente globali implicite).
*   Dopo ogni commit: 29/29; `t52` con «0.000%» su ogni schermata e HTML uguale; `t51` diverso solo per i nomi attesi, riferimento aggiornato nello stesso commit.

## Non-Goals

*   Nessuna fusione di strati che si richiamano (fase D). Le 2 basi catturate (`disegnaAnteprima`, `disegnaAnteprimaCattura`) e i loro ascoltatori `input` ridondanti restano: girano, si sistemano in D.
*   Nessuna unione di selettori ripetuti, nessuna tavolozza unica, nessuna riduzione degli `!important` (fase E).
*   Codice che non è una funzione e resta senza uso (`MACRO_AREA_COLORS`/`EMOJIS`, il foglio `#postponeOverlay` con `doPostpone`…, il resto del blocco v30): elencato in STATO, rinviato.
*   File di `src/` che restano con il solo marcatore di sezione: restano, `ordine.txt` invariato.
*   Selettori composti sulla radice (`[data-contrast][data-theme]`) e regole del tema di sistema: lo script non li giudica, restano.
*   `VERSIONE_APP` invariata (cambia alla chiusura del riordino, v51).

## Critical User Journeys (CUJs)

### CUJ 1: Roby usa l'app dopo la fase C

*   **Given**: `index.html` costruito dal ramo.
*   **When**: apre Oggi, Pianifica, Smaltisci, Tutto (Lista e Matrice), Un giorno, Altro, su telefono e computer, chiaro e scuro.
*   **Then**: `t52` trova HTML uguale e schermate con 0 pixel diversi; `smoke`, `t50`, `t51`, `t52` trovano la console pulita.

### CUJ 2: Chi legge il codice cerca una funzione

*   **Given**: il ramo dopo la fase C.
*   **When**: cerca `filterByCat` o lo strato v9 di `caricaEventi`.
*   **Then**: non c'è più; la MAPPA rigenerata non elenca funzioni morte né strati sotto uno strato che sostituisce, tranne le 2 basi catturate.

## Technical Plan (Architecture)

### Come si trovano i candidati (`tools/riordino/candidati.js`, `css_candidati.js`)

*   **Funzione morta**: nessun riferimento fuori dalla propria dichiarazione e dalle altre funzioni morte (ripetuto finché non cambia più niente) e nome assente da HTML, attributi e stringhe del JS (copre `data-act`, `AZIONI['…']`, `onclick`).
*   **Catena mai chiamata**: gli unici riferimenti sono i propri alias e le proprie riassegnazioni (`apriNuovo`).
*   **Strato sostituito**: l'assegnazione `f = …` che non usa nessun alias di `f` e non passa `f` a un decoratore; prima di lei, base, strati e alias, se nessun alias è usato fuori da quei pezzi.
*   **Catture**: letture di `f` al caricamento, prima della sostituzione, che non sono alias. Due, nel codice di `src/js/cattura/066-v9-spesa-…js:123` e `:206` (righe 12976 e 13059 di `index.html`): basi tenute.
*   **Selettore morto**: una classe richiesta (fuori da `:not()/:is()/:where()/:has()`) che non compare in HTML né JS e non comincia con un prefisso costruito dal codice (qualunque testo letterale davanti a `${…}` o a `' + …`). Verificate a mano come morte nonostante un prefisso simile: `toast-danger` (`'toast-' + n` costruisce un id), `v25-sezione-chip` (`'v25-' + nome` è una chiave).
*   **Variabile coperta**: una dichiarazione `--x` sulla radice (`:root`, `html`, `html:root`, con `[data-theme]` o `[data-contrast]`) è coperta se, per ogni selettore della sua regola, una regola nello stesso contesto (`@media` compreso), sempre attiva quando lei lo è, con specificità maggiore o uguale e posizione successiva, ridefinisce la stessa variabile.
*   Strati per nome (`window[nome] = …(window[nome])`, `src/js/altro/077-…js:22`, `src/js/pianifica/063-…js:888-891`): non riguardano nessun candidato; da ricordare in D.

### Controlli che non tolgono niente (già fatti)

*   **Copertura all'avvio** (`copertura.js`): computer e telefono, schede Oggi, Pianifica, Tutto, Altro: nessuno dei 76 pezzi (25 funzioni + 31 basi + 2 della catena + 18 strati) viene eseguito; controllo della misura: la base di `vistaOggi`, richiamata dai suoi strati, risulta eseguita.
*   **Trappole** (`pezzi.js trappole`): build con `console.error('[morto] …')` in testa ai 76 pezzi e 29 prove: nessuna trappola scattata (meccanismo verificato con un `[morto]` lanciato apposta).
*   **Prova generale** su una copia: tutti i tagli, 28/29 (fallisce solo `t51`, per i nomi tolti), `t52` invariato.

### Come si toglie

*   **JS** (`pezzi.js`): istruzioni intere, sugli offset di `index.html` riportati al file di `src/` che le contiene (ogni pezzo sta in un solo file: lo script si ferma altrimenti). Si toglie anche il commento attaccato: righe `//` contigue subito sopra, fino alla prima riga vuota o a un marcatore (`// vNN`, `═`, `║`, `---`). Un blocco `{ … }` di livello alto che resta vuoto si toglie.
*   **Dichiarazioni** (`pezzi.js dichiara`, commit separato): la prima assegnazione di una funzione rimasta senza base, se è a colonna 0, diventa `function f(…)` (`async` compreso, punto e virgola finale tolto); una freccia di una riga senza `this`/`arguments` diventa `function f(…) { return …; }`; altrimenti `var f;` a livello alto subito prima. Commit separato dal taglio, così un'eventuale cattura sfuggita si vede come `ReferenceError` nelle prove del commit precedente.
*   **CSS** (`togli_css.js`, postcss): si toglie il selettore dalla lista, la regola se resta senza selettori, la dichiarazione se coperta, la regola se resta vuota; il resto del file non cambia (controllo: `git diff` con sole righe tolte o accorciate).
*   Ogni passo rigenera i candidati dallo stato corrente: dopo un taglio le righe cambiano.

## Alternatives Considered

### Alternativa A: un commit per ogni funzione o regola

*   **Pros**: `git revert` di un solo pezzo.
*   **Cons**: circa 350 commit da 29 prove (circa 10 minuti ciascuna).
*   **Reason for Rejection**: tempo (decine di ore) contro una granularità che serve solo se un commit rompe; ogni categoria è omogenea e annullabile da sola, e il colpevole dentro una categoria si trova dimezzando l'elenco.

### Alternativa B: strati sostituiti nella fase D invece che nella C

*   **Pros**: la fase D riscrive comunque le catene.
*   **Cons**: D appiattisce catene vive; i pezzi morti sotto uno strato che sostituisce non vanno fusi, vanno solo tolti, e farlo prima rende le catene di D più corte e leggibili.
*   **Reason for Rejection**: è codice che non gira (copertura e trappole), quindi appartiene a C.

### Alternativa C: tavolozze intere (PIANO: «resta v44.1 + i ritocchi v50»)

*   **Pros**: un solo blocco di token.
*   **Cons**: riscrivere i token è una modifica, non una pulizia: richiede la verifica di ogni colore in ogni stato.
*   **Reason for Rejection**: in C solo le dichiarazioni sempre coperte (togliere non cambia nessun valore calcolato); l'unificazione nella fase E.

### Alternativa D: copertura dinamica completa come criterio primario

*   **Pros**: misura cosa gira davvero.
*   **Cons**: vede solo i percorsi che le prove percorrono; non dimostra che un pezzo non giri mai.
*   **Reason for Rejection**: criterio statico (riferimenti e stringhe) più due controlli dinamici (copertura, trappole).

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Funzione chiamata per nome costruito | ricerca del nome in tutte le stringhe; trappole con le 29 prove; `t51` elenca i nomi tolti |
| Oggetto funzione catturato prima della sostituzione | controllo delle letture al caricamento: 2 basi tenute |
| Classe costruita dal codice | qualunque testo davanti a `${…}` è un prefisso; `tag-q3/4` salvate così |
| Viste non fotografate | `t52` esteso a Tutto › Lista e › Matrice, Un giorno, Altro prima dei tagli; restano scoperti i fogli modali e il contrasto alto (per le variabili: confronto dei valori calcolati in 5 stati) |
| Globale implicita dopo aver tolto la base | commit di dichiarazioni subito dopo; nessun `'use strict'` nello script (verificato) |
| Inventario scaduto dopo un commit | ogni passo rigenera i candidati; un giro a cascata dopo gli strati |
| Commenti rimasti senza codice | regola meccanica del commento attaccato; i marcatori di sezione restano (qualche commento di sezione può descrivere codice tolto: es. testa del file v30) |
| Sicurezza | si tolgono anche percorsi mai raggiunti che scrivevano su Calendar (`retryFailedSyncs`, `batchSyncAll`, base di `ensureGcalCalendar`): la superficie si riduce; nessun pezzo tocca accesso, policy o token |

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Rollback**: ogni commit si annulla con `git revert`; il ramo non tocca `main`.
*   **Dipendenze**: `acorn`, `acorn-walk`, `postcss` di `tools/mappa/node_modules` (`cd tools/mappa && npm i`); `playwright`, `pngjs`, `pixelmatch` di `tests/node_modules`.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

**Sequenza comune a ogni commit** (dalla radice del repo, con `git config core.hooksPath` = `tools/hooks`):

1.  `node tools/riordino/candidati.js . > $T/c.json` (e `css_candidati.js` per il CSS), con `$T` cartella temporanea;
2.  lo strumento del commit;
3.  `node build.js` (l'hook rifarà `--check` sul commit);
4.  le 29 prove: `for f in smoke.js t*.js; do NM="$PWD/node_modules" OUT=$T node "$f"; done` dentro `tests/`, criterio stretto;
5.  se cambiano i nomi globali: `t51` deve elencare come tolti esattamente i nomi attesi e nessun aggiunto → `cd tests && AGGIORNA=1 NM="$PWD/node_modules" node t51-globali.js`;
6.  `t52`: ogni schermata «0.000%», HTML uguale.

| # | Commit | Strumento | Atteso |
|---|---|---|---|
| 0 | `tests: rete estesa a Tutto, Un giorno e Altro` | `t52-golden.js` (+ `t51` stampa tutti i nomi) | riferimenti nuovi presi dal codice intatto; 29/29 |
| 0b | `chore: commento «file generato» in testa a index.html` + strumenti del riordino | `src/testa.html`, `tools/riordino/`, `tools/mappa/genera_mappa.js` (`tag-q1…4`) | 29/29 |
| 1 | `refactor: fase C, funzioni e catene mai chiamate` | `pezzi.js funzioni` | `t51`: tolti i 25 nomi + `apriNuovo` + `_apriNuovoPr` |
| 2 | `refactor: fase C, strati sostituiti` | `pezzi.js strati` | `t51`: tolti i 13 alias (`_caricaEventiV6`, `_chiudiBloccoV4`, `_chiudiBloccoV9`, `_salvaCatturaV9`, `_salvaCatturaPr`, `_disegnaAnteprimaV9/Dopp/Pr`, `_disegnaAnteprimaCatturaV9/Dopp/Pr`, `_eventoSpuntabileV11`, `_disegnaFoglioEventoV11`) |
| 2b | `refactor: fase C, funzioni rimaste senza chiamate` | `candidati.js` di nuovo, `pezzi.js funzioni` | `t51`: tolti i 5 nomi della cascata |
| 2c | `refactor: fase C, dichiarazioni al posto delle assegnazioni senza base` | `pezzi.js dichiara` (con i candidati di prima del commit 2) | `t51` invariato; MAPPA rigenerata nella cartella temporanea: §3 con le sole 2 basi catturate, catene vive (`rigaEvento`, `salvaCattura`…) ancora elencate |
| 3 | `refactor: fase C, selettori CSS senza elementi` | `togli_css.js selettori` | numero rigenerato dopo i tagli JS (le classi usate solo da codice tolto si aggiungono) |
| 4 | `refactor: fase C, variabili delle tavolozze sempre coperte` | `togli_css.js variabili` | `variabili.js` prima/dopo: uscita identica |

Alla chiusura del riordino (passo 6 di Roby): `docs/MAPPA.md` rigenerata (e i testi fissi di `genera_mappa.js` aggiornati a mano), `docs/STATO_RIORDINO.md`, `NOTE_LOGICA.md` (in radice: funzioni tolte segnate), CLAUDE.md locale.
