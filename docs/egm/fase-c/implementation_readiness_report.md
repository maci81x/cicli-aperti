# Goldfish Review Report — Fase C, stadio 9 (Pronto per l'implementazione)

**Target:** `docs/egm/fase-c/design_draft.md` (DetailedRange) · **Reviewer:** `egm-implementation-readiness` completed (non pronto), `egm-codebase-details` completed (non passa ancora), `egm-style` completed.

| # | Severità | Rilievo | Revisori |
|---|---|---|---|
| R1 | Blocker | Le decisioni «adottare» dello stadio 8 non sono passi del piano (`tag-q3/4`, `apriNuovo`, script nel repo, riconciliazione, giro a cascata, commit 2b, estensione di `t52`, `variabili.js`, commento «file generato», testi fissi di `genera_mappa.js`) | readiness |
| R2 | Blocker | Commit 4 non eseguibile: `candidati.md` §4 riassume, non elenca le 252 dichiarazioni; serve lo script versionato con comando e uscita attesa | readiness, codebase |
| R3 | Blocker | `variabili.js` non specificato (stati, elemento letto, elenco delle variabili, dove si salva il «prima», criterio) | readiness |
| R4 | Major | Righe di `index.html` scadute dopo il commit 1; §3 e §4 senza file di `src/`: scegliere una strada (rigenerare prima di ogni commit) | readiness, codebase |
| R5 | Major | Elenco dei file toccati assente (anche `tests/riferimento/globali.json`, `NOTE_LOGICA.md` in radice, `tools/mappa/genera_mappa.js`, `tests/t52-golden.js`) | readiness, codebase |
| R6 | Major | Il controllo «MAPPA §3 vuota» dopo il commit 2 non controlla niente: `analizza.js` registra le catene solo se `f` è dichiarata; va fatto dopo il 2b, controllando anche in positivo che le catene vive restino | codebase |
| R7 | Major | File di `src/` che restano con il solo marcatore (`altro/000-26-macro-area-helpers.js`, `core/000-07-navigation.js`): tenerli o toglierli con la voce di `ordine.txt` | codebase |
| R8 | Major | Codice che non è una funzione diventa morto (`MACRO_AREA_COLORS`/`EMOJIS`, `#postponeOverlay` con `doPostpone`…, `let messe` nel file v30): restano o si tolgono? | codebase |
| R9 | Major | Strumento della modifica CSS non nominato; controllo «byte per byte» non definito | codebase |
| R10 | Major | Dipendenze acorn/postcss: dove e quale versione | readiness |
| R11 | Major | Comando unico di `t51` e delle 29 prove; elenchi attesi di `t51` (25 + `apriNuovo` nel commit 1; 13 alias nel commit 2); «aggiunti = 0» | readiness, codebase, style |
| R12 | Major | «0 pixel» in C contro la soglia 0,1% di `t52`: come lo si verifica; 12 contro 16 schermate | readiness |
| R13 | Major | Passi e Verification Plan non coincidono; «§3» ambiguo; «solo alla chiusura» e «passo 6 di Roby» ambigui; criteri di uscita assenti | style |
| — | Nit | Regola meccanica del commento attaccato; postcss e `raws`; messaggi dei commit; `core.hooksPath` come prerequisito; valore atteso delle righe; commento di testa del file v30 che diventa fuorviante; `[data-contrast][data-theme=dark]` (riga 630) coperta ma non in §4 (la regola non tratta i selettori composti: prudente) | tutti |

Verifiche positive dei revisori: le 25 funzioni sono tutte a colonna 0 e senza riferimenti nemmeno nei test; nessun `'use strict'`; i 13 alias hanno una sola dichiarazione e usi solo negli strati che si tolgono; i nomi di §3 (esclusi `tag-q*`) non compaiono in HTML o JS né sono costruiti da prefissi.
