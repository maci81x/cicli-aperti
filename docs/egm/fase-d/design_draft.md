# Fase D — appiattire le catene di strati

*   **Author:** Roby
*   **Status:** In Review
*   **Date:** 2026-11-19
*   **Contesto:** [PIANO_RIORDINO.md](../../PIANO_RIORDINO.md) (fase D), [MAPPA.md](../../MAPPA.md) §1, [fase C](../fase-c/design_draft.md), strumenti [tools/riordino/](../../tools/riordino/README.md) (`catene.js`, `appiattisci.js`). Ramo `riordino/fase-d`, da `riordino/fase-c` a `dc17335`.

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
| `disegnaAnteprima`, `salvaCattura` | **nuova** `t53-caratterizza`: HTML dell'anteprima del «+» e del campo «Cosa hai in testa?» mentre si scrive, righe salvate (campi stabili). Verificata al contrario: altera un pezzo dell'anteprima finale → fallisce; altera solo la base catturata → non se ne accorge (prova che quel risultato è sempre sovrascritto) |

Le prove diventano 30 (29 + `t53`).

## The Problem

`vistaOggi` è la somma di 16 pezzi sparsi in 12 file e 14 versioni; per capire cosa disegna Oggi bisogna leggerli in ordine inverso. Lo stesso vale, in misura minore, per le altre cinque. Dopo la fase C le catene contengono solo strati che girano.

## Goals

*   Sei commit, uno per funzione: `vistaOggi` (base + 15 strati), `disegna` (13), `avviaApp` (7), `disegnaAnteprima` (base catturata + 1 + 3), `salvaCattura` (2), `riga` (6).
*   Dopo ogni commit: 30/30; `t52` con HTML uguale e 16 schermate a 0,000%; `t53` uguale; `t51` diverso solo per gli alias tolti (riferimento aggiornato nello stesso commit).

## Non-Goals

*   Nessuna riscrittura «a mano» della logica (unire due `replace`, togliere passaggi inutili): sarebbe un cambio di struttura non meccanico, fuori da questa fase.
*   Le altre ~150 catene della MAPPA restano (prossime sessioni, con lo stesso strumento).
*   Strati per nome (`window[nome] = …`) non toccati.

## Technical Plan (Architecture)

### Analisi (`tools/riordino/catene.js`)

Per ogni pezzo della catena: file e riga in `src/`, se sta dentro un blocco o una funzione, quali nomi **locali** usa. Risultato sulle sei catene: l'unico nome locale usato dagli strati è il loro alias (che sparisce). Nessuno strato dipende da costanti del suo blocco, quindi il suo codice si può spostare nel punto dell'ultimo strato senza perdere variabili.

### Due forme, entrambe meccaniche ed esatte (`tools/riordino/appiattisci.js`)

**Sequenza** — se in ogni strato la prima istruzione è la chiamata alla versione precedente (`const h = _x.apply(this, arguments)`) e l'alias non è usato altrove nello strato:

```js
function vistaOggi() {
  // base (era alla riga …)
  let ris = (() => { …corpo della base… })(...arguments);
  // v10 · «dati di ieri» … (era lo strato alla riga …: file)
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

La base (v9) è catturata da `$('rapido-testo').addEventListener('input', disegnaAnteprima)` (riga 12318) prima di essere sostituita; dalla v9 un secondo ascoltatore (riga 13101, `() => disegnaAnteprima()`) chiama sempre l'ultima versione nello stesso evento e riscrive `#rapido-anteprima`. La base scrive solo quell'anteprima (`hidden`, `innerHTML`), quindi il suo risultato è sempre sovrascritto (lo conferma `t53` al contrario). Nel commit di `disegnaAnteprima`: si tolgono la base e il suo ascoltatore, lo strato v10 che sostituiva diventa la base della catena, poi si appiattisce. Il gemello `disegnaAnteprimaCattura` resta com'è (non è nell'elenco).

### Cosa resta dove

Codice di livello alto vicino agli strati (ascoltatori, `setInterval`, `insertAdjacentHTML`, definizioni di aiuto) non si tocca: lo strumento toglie solo le istruzioni `const _x = f;` e `f = …;` della catena e la dichiarazione della base.

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Uno strato usa una variabile del suo blocco | `catene.js`: nessuno (solo gli alias) |
| Uno strato chiama l'alias più volte o non per prima cosa | lo strumento usa la forma annidata, che non dipende da questo |
| Un alias è usato fuori dalla catena | lo strumento si ferma |
| La funzione finale, sollevata, è chiamata al caricamento prima dell'ultimo strato | la base era già sollevata e le catene si completano prima dell'avvio (`avviaApp` parte dopo il caricamento dello script); prove di avvio in ogni test |
| Un `return` dentro un passo della sequenza | resta locale al passo, come era locale allo strato |
| Cambio di `this`/`arguments` | frecce nella sequenza (ereditano gli stessi valori); funzioni normali nella forma annidata |
| Rientro e commenti peggiorano | ogni passo porta il commento dello strato e il riferimento a riga e file di prima |

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

Sequenza per ogni funzione (dalla radice, `$T` cartella temporanea):

1.  `node tools/riordino/appiattisci.js . <f> --prova > $T/<f>.js` e lettura del risultato;
2.  `node tools/riordino/appiattisci.js . <f>`; `node build.js`;
3.  prove (30) con il criterio stretto; `t51` deve elencare come tolti solo gli alias della catena → `cd tests && AGGIORNA=1 NM="$PWD/node_modules" node t51-globali.js`;
4.  commit `refactor: fase D, <f> in una funzione`.

| # | Funzione | Forma | Alias attesi tolti da `t51` |
|---|---|---|---|
| 0 | — | `tests: caratterizzazione prima della fase D` (`t53`) | — |
| 1 | `vistaOggi` | sequenza (base + 15) | gli alias a colonna 0 della catena (quelli dentro blocchi non sono in `t51`) |
| 2 | `disegna` | annidata (base + 13) | idem |
| 3 | `avviaApp` | annidata (base + 7) | idem |
| 4 | `disegnaAnteprima` | togliere base catturata e ascoltatore (riga 12318 di `index.html`), `disegnaAnteprima = function` (v10) → `function disegnaAnteprima`, poi sequenza | idem |
| 5 | `salvaCattura` | sequenza (base + 2, l'ultimo era una IIFE con `orig`) | idem |
| 6 | `riga` | sequenza (base + 6) | idem |

Alla fine: MAPPA rigenerata nella cartella temporanea per controllare che le sei funzioni non abbiano più strati.
