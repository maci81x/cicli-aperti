# Fase D — appiattire le catene di strati

*   **Author:** Roby
*   **Status:** Approvato dopo review EGM (vedi [goldfish_review_report.md](goldfish_review_report.md))
*   **Date:** 2026-11-19, aggiornato il 2026-11-23 (riallineato alla v52)
*   **Contesto:** [PIANO_RIORDINO.md](../../PIANO_RIORDINO.md) (fase D), [MAPPA.md](../../MAPPA.md) §1, [fase C](../fase-c/design_draft.md), strumenti [tools/riordino/](../../tools/riordino/README.md) (`catene.js`, `appiattisci.js`). Ramo `riordino/fase-d`, sopra `main` a `f22f7c7` (fase C unita, v52).

--------------------------------------------------------------------------------

## Overview

Ogni catena di strati (`const _x = f; f = function () { … _x() … }`, ripetuta fino a 15 volte) diventa **una sola funzione** `function f(…)`, scritta nel punto dell'ultimo strato (stesso file di `src/`, subito dopo l'istruzione di livello alto che conteneva l'ultimo strato; stessa posizione in `ordine.txt`). Base, strati e alias spariscono. Il comportamento non cambia: l'ordine in cui girano i pezzi di codice resta quello di oggi.

## Vincoli dati da Roby (19/11)

*   Skill `working-with-legacy-code`; una funzione per commit, partendo da `vistaOggi`, poi `disegna`, `avviaApp`, `disegnaAnteprima`, `salvaCattura`, `riga`.
*   Ogni catena diventa una funzione con la logica finale nel punto dell'ultimo strato; non spostare codice in altri file né cambiare l'ordine di esecuzione (ascoltatori, avvio e variabili definite più avanti dipendono dalla posizione).
*   Gli strati con effetti al caricamento (`addEventListener`, `setInterval`, `insertAdjacentHTML` sul body) restano dove sono.
*   Ogni commit: tutte le prove con il criterio stretto (uscita 0, nessun `FAIL`).

## Rete di sicurezza (Feathers: coprire prima di modificare)

| Funzione | Coperta da |
|---|---|
| `vistaOggi`, `riga`, `disegna` | `t52-golden`: HTML di Oggi, Pianifica (Settimana e Giorno), Tutto, Un giorno, Altro, Smaltisci su telefono e computer; 16 schermate |
| `avviaApp` | ogni prova (avvio con sessione finta); `t51` (nomi globali dopo l'avvio) |
| `disegnaAnteprima`, `salvaCattura` | **nuova** `t54-caratterizza`: HTML dell'anteprima del «+» e del campo «Cosa hai in testa?» mentre si scrive, righe salvate (campi stabili). Verificata al contrario: altera un pezzo dell'anteprima finale → fallisce; altera solo la base catturata → non se ne accorge (prova che quel risultato è sempre sovrascritto) |

Le prove sono 32: `smoke`, `t26`…`t50`, `t51`, `t52`, `t53` (v51), `t54`, `t55` (v52).

## The Problem

`vistaOggi` è la somma di 16 pezzi sparsi in 15 file e 15 versioni; per capire cosa disegna Oggi bisogna leggerli in ordine inverso. Lo stesso vale, in misura minore, per le altre cinque. Dopo la fase C le catene contengono solo strati che girano.

## Goals

*   Sei commit, uno per funzione: `vistaOggi` (base + 15 strati), `disegna` (13), `avviaApp` (7), `disegnaAnteprima` (base catturata + 1 + 3), `salvaCattura` (2), `riga` (6).
*   Forma annidata (`disegna`, `avviaApp`): il guadagno è che il codice sta in un posto solo; la lettura resta dal fondo (l'ultimo passo chiama il penultimo).
*   Dopo ogni commit: 32/32; `t52` con HTML uguale e 16 schermate a 0,000%; `t54` uguale; `t51` diverso solo per gli alias tolti (riferimento aggiornato nello stesso commit).

## Non-Goals

*   Nessuna riscrittura «a mano» della logica (unire due `replace`, togliere passaggi inutili): sarebbe un cambio di struttura non meccanico, fuori da questa fase.
*   Le altre ~150 catene della MAPPA restano (prossime sessioni, con lo stesso strumento).
*   Strati per nome (`window[nome] = …`) non toccati.
*   Semplificazioni dentro le funzioni appiattite (in `vistaOggi` più passi «inseriscono dopo `.vh`», v49 e v50 si somigliano): elencate in STATO come candidate per dopo.

## Technical Plan (Architecture)

### Analisi (`tools/riordino/catene.js`)

Per ogni pezzo della catena: file e riga in `src/`, se sta dentro un blocco o una funzione, quali nomi **locali** usa. Risultato sulle sei catene: l'unico nome locale usato dagli strati è il loro alias (che sparisce). Nessuno strato dipende da costanti del suo blocco, quindi il suo codice si può spostare nel punto dell'ultimo strato senza perdere variabili.

### Due forme, entrambe meccaniche ed esatte (`tools/riordino/appiattisci.js`)

**Sequenza** — se in ogni strato la prima istruzione è la chiamata alla versione precedente (`const h = _x.apply(this, arguments)`) e l'alias non è usato altrove nello strato:

```js
function vistaOggi() {
  // base (era alla riga …)
  let ris = (() => { …corpo della base… })(...arguments);
  // ── passo 1 · <file di src/js> (commento dello strato)
  ris = (() => { const h = ris; …resto dello strato… })(...arguments);
  …
  return ris;
}
```

Ogni passo è una freccia eseguita subito: eredita `this` e `arguments` della funzione finale (gli stessi che riceveva lo strato), un `return` anticipato dello strato resta un `return` del passo. L'ordine è quello di oggi: prima la base, poi gli strati dal più vecchio al più nuovo (prima era: lo strato più nuovo chiama per prima cosa il precedente, fino alla base). Il nome del risultato (`ris`, …) è il primo che nessuno strato usa (evita di coprire variabili locali che si chiamano `r`). La funzione finale non è `async`: restituisce quello che restituiva lo strato più esterno.

**Annidata** — se almeno uno strato fa qualcosa *prima* di chiamare la versione precedente (`disegna`: `const a = v46Annota()`; `avviaApp`: `const prima = _appAvviata`):

```js
function avviaApp(sessione) {
  const passo0 = function (sessione) { …base… };
  const passo1 = function (sessione) { const prima = _appAvviata; passo0(sessione); … };
  …
  return passo7.apply(this, arguments);
}
```

Ogni strato resta com'era (stessi parametri, `this`, `arguments`), con l'alias sostituito dal nome del passo precedente.

In entrambe le forme la funzione finale è una dichiarazione `function` di livello alto (sollevata come la base di prima), nel file dell'ultimo strato subito dopo l'istruzione che lo conteneva. Gli strati dentro blocchi `{ … }` lasciano il blocco con il resto del suo contenuto.

### Caso `disegnaAnteprima`

La base (v9) è catturata da `$('rapido-testo').addEventListener('input', disegnaAnteprima)` (riga 12356 di `index.html`, base dichiarata alla 12322) prima di essere sostituita; dalla v9 un secondo ascoltatore (riga 13139, `() => disegnaAnteprima()`) chiama sempre l'ultima versione nello stesso evento e riscrive `#rapido-anteprima`. La base scrive solo quell'anteprima (`hidden`, `innerHTML`), quindi il suo risultato è sempre sovrascritto (lo conferma `t54` al contrario). Nel commit di `disegnaAnteprima`: si tolgono la base e il suo ascoltatore, lo strato v10 che sostituiva diventa la base della catena, poi si appiattisce. Il gemello `disegnaAnteprimaCattura` resta com'è (non è nell'elenco).

### Cosa resta dove

Codice di livello alto vicino agli strati (ascoltatori, `setInterval`, `insertAdjacentHTML`, definizioni di aiuto) non si tocca: lo strumento toglie solo le istruzioni `const _x = f;` e `f = …;` della catena, la dichiarazione della base, i commenti attaccati sopra di loro (copiati nella funzione) e i blocchi `{ }` che restano vuoti (i loro commenti sciolti vanno nel passo). Un commento di sezione (`// ═══`) resta dov'è.

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Uno strato usa una variabile del suo blocco | `catene.js`: nessuno (solo gli alias) |
| Uno strato chiama l'alias più volte o non per prima cosa | lo strumento usa la forma annidata, che non dipende da questo |
| Un alias è usato fuori dalla catena | lo strumento si ferma |
| La funzione finale, sollevata, è chiamata al caricamento prima dell'ultimo strato | la base era già sollevata e le catene si completano prima dell'avvio (`avviaApp` parte dopo il caricamento dello script); prove di avvio in ogni test |
| Un `return` dentro un passo della sequenza | resta locale al passo, come era locale allo strato |
| Cambio di `this`/`arguments` | frecce nella sequenza (ereditano gli stessi valori); funzioni normali nella forma annidata |
| Rientro e commenti peggiorano | indice dei passi in testa alla funzione; ogni passo porta file di provenienza, commento sopra l'alias/lo strato e i commenti interni; commenti attaccati e blocchi `{ }` rimasti vuoti si tolgono dal posto di prima (niente numeri di riga di `index.html`, che scadono) |
| Un passo chiuso in `try/catch` si rompe e lascia solo un `console.warn` | `t52` e `t54` confrontano gli avvisi in console con il riferimento (oggi nessuno); verificato al contrario con un avviso finto |
| Lo strumento, riusato sulle altre catene, appiattisce male | si ferma se uno strato non sta a livello alto o in un blocco `{ }` di livello alto; sequenza solo se la chiamata è esattamente la prima istruzione (non dentro `?:`, `||`, frecce); `_x(a, b)` in sequenza solo se il passo prima non usa `this`/`arguments`; i nomi `passoN` e l'accumulatore non coprono nomi usati |
| Catture al caricamento o chiamate prima dell'ultimo strato | verificato dai revisori: l'unica cattura è l'ascoltatore di `disegnaAnteprima` (gestito); nessuna chiamata sincrona al caricamento; `avviaApp` parte dopo `await db.auth.getSession()` o da `setTimeout`; `render` rimanda `disegna` in un microtask |

## Alternatives Considered

### Alternativa A: riscrivere a mano ogni catena come codice lineare

*   **Pros**: funzioni più corte e leggibili.
*   **Cons**: ogni strato va capito e ricomposto (16 per `vistaOggi`): rischio di errori non meccanici; i golden coprono le viste principali ma non ogni ramo.
*   **Reason for Rejection**: prima l'appiattimento meccanico (struttura), poi eventuali semplificazioni come cambi separati (Feathers: struttura e comportamento in passi diversi).

### Alternativa B: tenere gli strati e solo spostarli nello stesso file

*   **Pros**: ancora più semplice.
*   **Cons**: restano alias e riassegnazioni; non è «una funzione».
*   **Reason for Rejection**: non raggiunge l'obiettivo.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Rollback**: `git revert` di un commit = una funzione.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Prerequisiti: `git config core.hooksPath tools/hooks`; `cd tools/mappa && npm i` (acorn); dipendenze delle prove installate in `tests/node_modules` (vedi `tests/README.md`). `$T` = una cartella temporanea fuori dal repo. Comando unico delle prove (dalla radice; passa solo con `TOTALE 32/32`):

```sh
cd tests && export NM="$PWD/node_modules" OUT=$T; n=0; ok=0
for f in smoke.js t*.js; do n=$((n+1)); node "$f" > "$T/${f%.js}.log" 2>&1 && ! grep -q '^FAIL' "$T/${f%.js}.log" && ok=$((ok+1)) || echo "NO $f"; done
echo "TOTALE $ok/$n"; cd ..
```

Per ogni funzione, in quest'ordine:

1. **Prova dello strumento**: `node tools/riordino/appiattisci.js . <f> --prova > $T/<f>.js`. Criteri: uscita 0; su stderr «base + N strati → 1 funzione (forma X)» con N e X uguali alla tabella; nel file letto: ogni passo con la sua etichetta e i commenti. Se uno non torna: fermarsi.
2. **Applicazione**: `node tools/riordino/appiattisci.js . <f> && node build.js`; `git diff --stat src` deve toccare solo i file degli strati di quella catena.
3. **Prove** (comando sopra). L'unico `NO` ammesso al primo giro è `t51-globali`, e solo se il suo `FAIL` elenca come tolti esattamente gli alias a colonna 0 della tabella e nessun nome aggiunto. Allora `cd tests && AGGIORNA=1 NM="$PWD/node_modules" node t51-globali.js; cd ..` e si rilanciano tutte le prove: serve `TOTALE 32/32` (in `t52`: 16 HTML uguali, 16 schermate «0.000%», nessun avviso in console; `t54` uguale). Qualunque altra differenza: `git checkout src index.html tests/riferimento`, fermarsi e segnalarla.
4. **Commit**: `git add src index.html tests/riferimento/globali.json && git commit -m "refactor: fase D, <f> in una funzione"` (l'hook controlla `build.js --check`).

| # | Funzione | N, forma | Alias a colonna 0 che `t51` deve dare come tolti | Alias dentro blocchi (non in `t51`) |
|---|---|---|---|---|
| 1 | `vistaOggi` | 15, sequenza | `_vistaOggiAgg _vistaOggiPr _vistaOggiV11 _vistaOggiV12 _vistaOggiV21 _vistaOggiV23 _vistaOggiV25 _vistaOggiV29 _vistaOggiV31 _vistaOggiV32 _vistaOggiV33` | `_vistaOggiV43 _oggiV49a _oggiV49b _oggiV50` |
| 2 | `disegna` | 13, annidata | `_disegnaV5 _disegnaV13 _disegnaV25 _disegnaV26 _disegnaV32 _disegnaV33` | `_dV402 _dV44 _disegnaV46 _dV47 _disegnaV49 _disegnaV50 _disegnaV50b` |
| 3 | `avviaApp` | 7, annidata | `_avviaAppV8 _avviaAppV9 _avviaAppV11 _avviaAppV12 _avviaAppV13 _avviaAppPr _avviaAppV15` | — |
| 4 | `disegnaAnteprima` | 3, sequenza (dopo il passo a mano) | `_disegnaAnteprimaV12 _disegnaAnteprimaV14 _disegnaAnteprimaV17` | — |
| 5 | `salvaCattura` | 2, sequenza | `_salvaCatturaV12` | — |
| 6 | `riga` | 6, sequenza | `_rigaV13 _rigaV19 _rigaPr _rigaV26 _rigaV30` | `_rigaV45` |

**Passo a mano di `disegnaAnteprima`** (prima del punto 1, stesso commit): in `src/js/cattura/066-v9-…js` togliere `function disegnaAnteprima() { … }` (riga 89, con il commento attaccato sopra) e la riga 123 `$('rapido-testo').addEventListener('input', disegnaAnteprima);`; in `src/js/smaltisci/074-01-4-…js:231` (lo strato v10, che non chiama la base) cambiare `disegnaAnteprima = function () {` in `function disegnaAnteprima() {` e togliere il `;` dopo la `}` finale; `node build.js`; poi i punti 1–4 (il `--prova` deve dire «base + 3 strati»). Unica differenza attesa: sparisce un possibile errore in console della base quando `ui.rapido` è null (v10 ha la guardia), che nessuna prova raggiunge.

**Fine fase**: `grep -rnE "^(const _[A-Za-z0-9]+ = |[ \t]+const _[A-Za-z0-9]+ = )?(vistaOggi|disegna|avviaApp|disegnaAnteprima|salvaCattura|riga)( = |;)" src/js` → 0 righe; `cd tools/mappa && node analizza.js ../../index.html > $T/report.json && node genera_mappa.js $T/report.json $T/MAPPA.md x`: le sei funzioni non compaiono tra le catene di `$T/MAPPA.md`.
