# Goldfish Annotated Review Report — Fase C

**Target:** `docs/egm/fase-c/design_draft.md` (full file)
**Status:** resolved — correzioni applicate in blocco («auto accept»): Roby ha chiesto il 19/11 di fermarsi solo al passo 6 (chiusura), quindi il gate interattivo di `egm-resolve` è stato saltato e le decisioni sono registrate qui.
**Report:** stadio 5 [zoom_out_report.md](zoom_out_report.md) · 6 [comprehension_report.md](comprehension_report.md) · 7 [critic_report.md](critic_report.md) · 8 [intermediate_zoom_out_report.md](intermediate_zoom_out_report.md) · 9 [implementation_readiness_report.md](implementation_readiness_report.md)

| Rilievo | Decisione | Come |
|---|---|---|
| K1 `tag-q3/4` vive (Blocker) | PROPOSE FIX | regola generica «testo davanti a `${`» in `css_candidati.js`; selettori morti 41 → 39; `tag-q1…4` in `verificateDinamiche`; `t52` esteso a Tutto › Lista e › Matrice, Un giorno, Altro (16 schermate) prima dei tagli |
| Z1/K2 catena `apriNuovo` | PROPOSE FIX | `candidati.js` trova le catene mai chiamate; nel commit 1 |
| Z2/K4 globale implicita | PROPOSE FIX | commit 2b separato (`pezzi.js dichiara`): 28 `f = function…` → `function f(…)`, 3 frecce di una riga → `function f() { return …; }`, `var f;` di ripiego (non servito) |
| Z3/R2 script nel repo, riconciliazione | PROPOSE FIX | `tools/riordino/` (7 script + README); tabella di riconciliazione nel design |
| K3 cascata | PROPOSE FIX | giro dopo il commit 2 → commit 2c (5 funzioni: `corpoPromemoria`, `testoQuandoCoach`, `suggerimentoParente`, `v21GiornoVuoto`, `fmtGiornoNum`) |
| Z4 trappole | PROPOSE FIX (già fatto) | 76 trappole, 29 prove: nessuna scattata; controllo del meccanismo positivo |
| Z5 togliere i 2 ascoltatori ridondanti e le 2 basi | DECLINE (rinvio) | codice che gira: fase D, appiattendo `disegnaAnteprima*` |
| Z7/R6 tavolozze | PROPOSE FIX | Non-Goal: l'unificazione in una tavolozza chiara e una scura è della fase E |
| Z8/K9 commento «file generato» | PROPOSE FIX | commit a parte in `src/testa.html` |
| Z9 CLAUDE.md | DECLINE (rinvio) | alla chiusura |
| Z10/C8/R11 comandi | PROPOSE FIX | comandi unici nel piano |
| Z11, Z12, Z13 | DECLINE | Z13: nessuna variabile della radice dentro `@media` di larghezza |
| K5b «t51 stampa 20 nomi» | DECLINE | era vero (`slice(0, 20)`); corretto lo stesso: ora stampa tutti i nomi |
| R2/R3/R9 script del CSS e delle variabili | PROPOSE FIX | `togli_css.js` e `variabili.js` versionati e descritti |
| R4 righe scadute | PROPOSE FIX | ogni commit rigenera i candidati dallo stato corrente |
| R6 controllo della MAPPA | PROPOSE FIX | dopo il 2b, con controllo in positivo |
| R7 file con il solo marcatore | PROPOSE FIX | restano; `ordine.txt` invariato |
| R8 codice non-funzione morto | DECLINE (rinvio) | fuori scopo (la fase C toglie funzioni, strati, selettori, variabili); elencato in STATO per la fase D |
| R12 «0 pixel» | PROPOSE FIX | nel log di `t52`: in C ogni schermata deve dire «0.000%» |
| C1–C12, K6–K11, R13, Nit di stile | PROPOSE FIX | testo del design riscritto |

Conteggio: PROPOSE FIX 21 · DECLINE 7 (di cui 4 rinvii) · CONTEST 0 · ESCALATE 0.
