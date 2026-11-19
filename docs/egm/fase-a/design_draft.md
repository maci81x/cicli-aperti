# Fase A — index.html diviso in sorgenti, ricostruito da build.js

*   **Author:** Roby
*   **Status:** Approved (review EGM del 19/11, correzioni accolte con «auto accept»)
*   **Date:** 2026-11-19
*   **Contesto di partenza:** [docs/PIANO_RIORDINO.md](../../PIANO_RIORDINO.md), [docs/MAPPA.md](../../MAPPA.md), i vincoli di Roby qui sotto. Review: [consolidated_review_report.md](consolidated_review_report.md), decisioni: [goldfish_review_report.md](goldfish_review_report.md).

--------------------------------------------------------------------------------

## Overview

`index.html` (v50, 21.798 righe, 1,47 MB) contiene in un solo file l'HTML, 2.572 righe di CSS e 18.297 righe di JavaScript, ed è il file che GitHub Pages pubblica. La fase A lo divide in file sorgente sotto `src/`, tagliando ai commenti di versione, e aggiunge `build.js`, che rimette i pezzi in fila e riscrive `index.html`. Il file ricostruito deve essere **identico byte per byte** a quello di oggi, quindi il comportamento dell'app resta invariato.

## Vincoli dati da Roby (19/11)

*   «L'index.html in radice resta il file pubblicato da GitHub Pages: va sempre ricostruito con build.js e committato insieme ai pezzi in src/.»
*   «Aggiungi un controllo che fallisce se l'index.html committato non è uguale a quello ricostruito.»
*   L'impronta SHA-256 di `index.html` deve restare `e8ef9bc5933465775a5ef10bd14734d23b2d9ac7267e177f85c039028b13aa6b`; se non è identica ci si ferma.
*   Avviso se un file in `src/` non è in `ordine.txt`; a-capo finale preservato.
*   Prove: stessi risultati della v50 su questa macchina; `t26` e `t29` non si riscrivono.
*   README del bootstrap EGM fuori dal commit; le istruzioni vanno in `src/README.md`. Niente GitHub Action.

## The Problem

Ogni modifica oggi si fa dentro un file di 21.798 righe, aggiungendo codice in fondo e avvolgendo funzioni già avvolte (`vistaOggi` ha 15 strati, vedi MAPPA §1). Per trovare uno strato si cerca per testo, e un errore di modifica può toccare qualunque parte dell'app, perché tutto sta nello stesso file e nello stesso ambito globale. Dividere per area (oggi, pianifica, …) è l'obiettivo, ma non in un passo solo: l'app dipende dall'ordine del codice (301 riassegnazioni di funzioni, 154 ascoltatori registrati al caricamento, cascata CSS con 96 `!important`; fonte: MAPPA, «In breve»).

La fase A fa solo la parte meccanica e verificabile: divide senza cambiare l'ordine. Le fasi successive lavorano su 162 file invece che su uno (il più grande, `000-base.js`, ha 2.983 righe e verrà tagliato ancora in fase B), e ogni passo ha un controllo automatico.

## Goals

*   `src/` contiene tutto `index.html` diviso in 165 file: testa, corpo e coda HTML, 47 file CSS (uno per sezione di versione del `<style>`), 115 file JS (uno per sezione di versione dello `<script>` principale).
*   `src/ordine.txt` elenca i file nell'ordine in cui finiscono in `index.html`.
*   `node build.js` riscrive `index.html` dai sorgenti con impronta SHA-256 `e8ef9bc5…aa6b`.
*   `node build.js --check` esce con codice diverso da 0 se `index.html` non è quello che uscirebbe dai sorgenti.
*   Con l'hook attivo (una volta per copia del repo), un commit che porta `src/`, `build.js` o `index.html` non allineati viene rifiutato.

## Non-Goals

*   Nessun raggruppamento per area (fase B), nessuna cancellazione di codice morto (C), nessuna fusione di strati (D), nessun riordino del CSS (E).
*   Nessun cambio all'HTML, al CSS o al JS dell'app.
*   Nessuna GitHub Action, né di build né di verifica: oggi si lavora da un solo Mac, e una Action avviserebbe solo dopo il push.
*   Nessun `package.json` in radice: `tests/` non ne ha uno, e `npm i` lanciato in `tests/` risalirebbe fino a un `package.json` in radice, installando le dipendenze nella radice del repo.
*   `tests/` non cambia, se non per una riga del README.

## Critical User Journeys (CUJs)

### CUJ 1: Modificare l'app dopo la fase A

*   **Given**: il repo dopo la fase A, hook attivo.
*   **When**: si cambia un file in `src/js/…`, si lancia `node build.js` dalla radice, si mettono in staging il file e `index.html`, si committa.
*   **Then**: l'hook passa; dopo il push (con l'ok di Roby) GitHub Pages pubblica il nuovo `index.html`.

### CUJ 2: Modifica fatta per errore direttamente in index.html

*   **Given**: hook attivo.
*   **When**: si modifica `index.html` a mano e si prova a committare.
*   **Then**: l'hook rifiuta il commit e stampa: `index.html non corrisponde a src/: lancia «node build.js»`. La modifica fatta a mano si vede con `git diff index.html` e va rifatta nel file giusto di `src/` prima di ricostruire.

### CUJ 3: Aprire l'app in locale o nei test

*   **Given**: il repo dopo la fase A.
*   **When**: si apre `index.html` nel browser o si lancia una prova in `tests/`.
*   **Then**: si apre lo stesso file di prima; non serve compilare nulla per usare l'app.

## Technical Plan (Architecture)

```text
src/                                    tools/hooks/pre-commit
 ├ ordine.txt  (elenco, in ordine)            │ (git, prima del commit)
 ├ testa.html                                 ▼
 ├ css/000…046-*.css   ──►  build.js  ──►  index.html (radice, committato) ──► GitHub Pages
 ├ corpo.html                  │                 │
 ├ js/000…114-*.js             │                 └──► tests/harness.js (apre ../index.html)
 └ coda.html                   └── --check: confronta il risultato con index.html su disco
```

### Taglio

Lo script di taglio gira una volta sola e non resta nel repo; il giudice della correttezza è l'impronta SHA-256. Intervalli di `index.html`:

| File | Righe |
|---|---|
| `testa.html` | 1–63 (fino a `<style>` compreso: meta, script del tema alle righe 22–59, i tre `<script src>` dei CDN alle righe 60–62) |
| `css/…` | 64–2635 |
| `corpo.html` | 2636–3498 (da `</style>` a `<script>` compresi: tutto l'HTML del body) |
| `js/…` | 3499–21795 |
| `coda.html` | 21796–21798 (`</script>`, `</body>`, `</html>`) |

Taglio dentro i blocchi, prima di ogni riga che corrisponde a:

*   CSS: `^/\*.*\bv\d+` → 46 tagli, **47 file**;
*   JS: `^// v\d+(\.\d+)?\b` oppure `^// ║ PARTE 2` → 114 tagli, **115 file**.

I conteggi sono bloccanti: se non tornano ci si ferma. La riga di cornice (`// ═══`, `// ╔`) sopra un marcatore resta in fondo al file precedente: è voluto, si sistema in fase B.

**A-capo.** Ogni file finisce con `\n` (anche `coda.html`, che termina con `</html>\n` come `index.html`); `build.js` unisce i file senza aggiungere niente. È la forma che gli editor producono da soli.

### Nomi

`NNN-vX-slug.css|js`: `NNN` = posizione a tre cifre; `vX` = versione del marcatore, con il punto sostituito da un trattino (`v29-1`); `slug` = il resto del commento in minuscolo, senza accenti, ogni sequenza di caratteri diversi da `a-z0-9` sostituita da `-`, al massimo 40 caratteri, senza trattini ai lati. Titolo vuoto → `NNN-vX`. Il primo file di ogni blocco è `000-base`; il pezzo che inizia con `// ║ PARTE 2` è `001-parte-2-interfaccia`. L'ordine è quello di `ordine.txt`; il numero serve solo a vedere i file in ordine nella cartella.

### build.js

Il codice provato in PIANO_RIORDINO («Lo script di build»), con le modifiche accolte in review:

*   legge `src/ordine.txt` (percorsi relativi a `src/`; righe vuote e righe che iniziano con `#` ignorate);
*   unisce i file così come sono (ognuno finisce con `\n`);
*   voce ripetuta o file elencato che non esiste → errore, codice 2;
*   file `.html`, `.css` o `.js` sotto `src/` non elencato → **avviso** su stderr (la build continua);
*   senza argomenti scrive `index.html`; con `--check` non scrive e confronta: 0 = uguale, 1 = diverso, 2 = errore;
*   variabile d'ambiente `RADICE` (predefinita: la cartella di `build.js`) per provarlo su una copia.

### Hook

`tools/hooks/pre-commit` (`#!/bin/sh`, eseguibile in git):

1.  se nessun file in staging corrisponde a `^index\.html$`, `^src/` o `^build\.js$`, esce 0;
2.  se `node` manca, rifiuta con un messaggio che lo dice;
3.  se gli stessi percorsi hanno modifiche **non** in staging (`git diff --name-only`), rifiuta: «metti in staging anche questi file, o annulla le modifiche». Così disco e staging coincidono e il passo 4 controlla proprio quello che entra nel commit;
4.  lancia `node build.js --check`; se fallisce, rifiuta e ricorda `git diff index.html`.

Si attiva con `git config core.hooksPath tools/hooks` (impostazione locale della copia).

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Commit con `src/` nuovo e `index.html` vecchio (staging parziale) | l'hook rifiuta se `src/`, `build.js` o `index.html` hanno modifiche fuori dallo staging, poi controlla |
| Hook non attivo (altra copia, `core.hooksPath` non impostato) | attivato in questa copia durante la fase A; comando in `src/README.md` e in `docs/STATO_RIORDINO.md` |
| File nuovo in `src/` dimenticato in `ordine.txt` | `build.js` stampa un avviso con il nome del file |
| Editor che aggiunge l'a-capo finale | ogni file finisce già con `\n`; la build unisce senza separatori |
| Modifica fatta direttamente in `index.html` (abitudine delle versioni 1–50) | hook (CUJ 2); CLAUDE.md locale riscritto: si modifica `src/` |

Esclusi perché non realistici oggi (un utente, un Mac, file solo LF): `core.autocrlf`, conflitti di merge su `index.html`, `git commit --no-verify`, client git grafici, `core.hooksPath` dopo un revert.

## Alternatives Considered

### Alternativa A: dividere subito per area

*   **Pros**: si arriva prima alla struttura finale.
*   **Cons**: cambia l'ordine di strati, ascoltatori e regole CSS; ogni spostamento va provato a mano.
*   **Reason for Rejection**: senza identità byte per byte non c'è un controllo semplice che dica «non è cambiato niente» ([PIANO, «Perché non si può spostare per area subito»](../../PIANO_RIORDINO.md#perché-non-si-può-spostare-per-area-subito)).

### Alternativa B: bundler (esbuild, Vite) con moduli ES

*   **Pros**: strumenti noti, minificazione, mappe dei sorgenti.
*   **Cons**: i moduli ES isolano le variabili: le 699 dichiarazioni di livello alto e le 1.169 funzioni globali (MAPPA, «In breve»), chiamate anche da `onclick` e `data-act`, non sarebbero più accessibili tra un file e l'altro; servirebbero import ed export in ogni file. L'uscita non può coincidere con l'`index.html` di oggi.
*   **Reason for Rejection**: cambia il comportamento; la concatenazione tiene lo stesso ambito globale di oggi.

### Alternativa C: build su GitHub Actions, index.html non committato

*   **Pros**: impossibile dimenticare di ricostruire.
*   **Cons**: Pages dipende da una pipeline in più; se la Action fallisce il sito non si aggiorna; i test in locale dovrebbero prima costruire.
*   **Reason for Rejection**: i Cons qui sopra, e il primo vincolo di Roby.

### Alternativa D: GitHub Action di sola verifica

*   **Pros**: scatta anche dove l'hook non è attivo.
*   **Cons**: avvisa solo dopo il push (Pages pubblica comunque); aggiunge `.github/`.
*   **Reason for Rejection**: un solo Mac oggi; decisione di Roby del 19/11.

### Alternativa E: tagliare già ai sotto-titoli `// ═══`

*   **Pros**: niente file oltre 800 righe già in fase A.
*   **Cons**: allarga la fase A; serve comunque l'assegnazione alle aree.
*   **Reason for Rejection**: è il primo passo della fase B nel PIANO approvato.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Rollout & Rollback**: un commit (più quello dei documenti). `git revert` riporta indietro senza effetti sul sito, perché `index.html` è identico. Il push si fa solo con l'ok di Roby.
*   **Sicurezza**: i file di `src/` contengono lo stesso testo di `index.html`, già pubblico.
*   **Prestazioni**: nessun effetto (stesso file servito).

--------------------------------------------------------------------------------

## Detailed Implementation Plan

### Passi, in ordine

1.  `git pull --ff-only`; controllare che `index.html` abbia l'impronta `e8ef9bc5…aa6b`, altrimenti fermarsi.
2.  Taglio nello scratchpad, poi copia in `src/`; controllare 47 e 115.
3.  `node build.js` → `git diff --exit-code index.html` vuoto e impronta uguale; altrimenti fermarsi.
4.  Prove di `--check` (sotto).
5.  Hook: scrivere, `chmod +x`, `git config core.hooksPath tools/hooks`, prove (sotto).
6.  Documentazione.
7.  Le 27 prove.
8.  Commit con l'elenco esatto dei file; push dopo l'ok.

### File

| File | Azione | Cosa e perché |
|---|---|---|
| `src/ordine.txt` | crea | 2 righe di commento (`# Ordine dei pezzi di index.html: build.js li unisce in questo ordine.` e `# L'ordine conta: non riordinare senza aver letto docs/PIANO_RIORDINO.md.`) + 165 voci = 167 righe |
| `src/testa.html`, `src/corpo.html`, `src/coda.html` | crea | intervalli della tabella «Taglio» |
| `src/css/*.css` (47), `src/js/*.js` (115) | crea | regole di «Taglio» e «Nomi» |
| `src/README.md` | crea | come si lavora: modificare `src/`, `node build.js`, committare insieme; attivare l'hook; niente strati nuovi. Non è elencato in `ordine.txt` e non è `.html/.css/.js`, quindi la build lo ignora senza avvisi |
| `build.js` | crea | come in «build.js» |
| `tools/hooks/pre-commit` | crea, eseguibile | come in «Hook» |
| `index.html` | rigenerato, contenuto invariato | impronta `e8ef9bc5…aa6b` |
| `tests/README.md` | modifica | una riga: le prove aprono `../index.html`; dopo una modifica in `src/` lanciare prima `node build.js` dalla radice |
| `docs/PIANO_RIORDINO.md` | modifica | titolo della Fase A e tabella «Stima» segnati come fatti, con data e impronta |
| `docs/egm/fase-a/*` | crea | bozza approvata e report della review |
| `CLAUDE.md` | modifica, solo locale (`.gitignore`) | «Regole per Claude Code»: si modifica il file di `src/` dove sta lo strato più alto della funzione; niente strati nuovi; poi `node build.js`; `src/` e `index.html` nello stesso commit. Riscritte «Non riscrivere index.html da zero — usa Edit» (→ Edit sui file di `src/`), «single file `index.html`» e «un solo `<script>` in due parti» |

Fuori dal commit: i README del bootstrap EGM (`README.md` in radice, `supabase/**/README.md`, `tools/README.md`, `tools/mappa/README.md`, `tools/posta/README.md`), finché Roby non li approva. Per questo `tools/README.md` non elenca ancora `hooks/`.

### Verification Plan

*   **Build**: `node build.js && git diff --exit-code index.html && shasum -a 256 index.html` → `e8ef9bc5…aa6b`.
*   **Check**: `node build.js --check` → 0. Aggiungendo una riga a `index.html` → 1. Cancellando dal disco un file elencato → 2. Creando `src/js/prova.js` non elencato → avviso. Ripristino: `git checkout -- index.html src/` e rimozione dei file di prova.
*   **Hook** (in una copia: `git clone` locale nello scratchpad, con `core.hooksPath` impostato anche lì): (a) commit con `index.html` alterato → rifiutato; (b) `src/` modificato e ricostruito ma solo `src/` in staging → rifiutato; (c) entrambi in staging → accettato.
*   **Prove**: per ogni file in `smoke.js t*.js`: `cd tests && NM="$PWD/node_modules" OUT=<cartella> node <file>`, registrando codice d'uscita, numero di righe `ok` e di righe `FAIL`. Criterio: risultati uguali a quelli della v50 su questo Mac (25/27; `t26` e `t29` si fermano allo stesso punto). `axe-core` è già in `tests/node_modules`.
