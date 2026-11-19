# Goldfish Review Report — Fase C, stadio 8 (Zoom Out intermedio)

**Target:** `docs/egm/fase-c/design_draft.md` con i report degli stadi 5–7 · **Reviewer:** `egm-zoom-out` completed · Verdetto: impostazione giusta, non passa finché non si chiudono K1 (`tag-q3/4`) e la divergenza dell'inventario da `tools/mappa`.

| Proposta | Decisione del revisore | Costo |
|---|---|---|
| K1: `tag-q3/4` fuori; regola generica «testo letterale davanti a `${` in una classe»; `tag-q1…4` in `verificateDinamiche` di `genera_mappa.js` | adottare | 30 min |
| Z1/K2: catena `apriNuovo` nel commit 1 | adottare | 5 min |
| Z3: script dell'inventario copiati nel repo (`tools/mappa/`), senza riscrivere `analizza.js` | adottare | 5 min |
| R2: tabella di riconciliazione MAPPA ↔ inventario prima del commit 1 (assorbe C1/Z6/K8) | adottare | 20 min |
| K3: un solo giro dell'inventario dopo il commit 2; eventuale commit «cascata» | adottare ridotto | 10 min |
| Z2/K4: base tolta, poi `function f(…)` **in un commit separato dopo il 2**: nel commit 2 una cattura sfuggita darebbe `ReferenceError` e le prove la vedrebbero; con la dichiarazione sollevata no. Frecce di una riga → `function x() { return …; }`; non a colonna 0 → base tenuta | adottare (commit 2b) | 30 min + 1 corsa di prove |
| K5a: `t52` esteso a Tutto › Lista, Tutto › Matrice, Altro prima della fase; in C pretendere 0 pixel | adottare | 45–60 min |
| K5b: «`t51` stampa solo 20 nomi» | rifiutare (falso: `tolti.join`) | 0 |
| Z4: build con trappole | rifiutare (le prove dopo la rimozione danno lo stesso segnale) | — |
| Z5: togliere i 2 ascoltatori e le 2 basi | rinviare alla fase D (appiattimento di `disegnaAnteprima*`) | 0 |
| Z7/R6: unificazione delle tavolozze dichiarata per la fase E; `variabili.js` versionato | adottare | 5 min |
| Z8/K9: commento «file generato» in testa a `index.html` | adottare (commit a parte) | 5 min |
| Z9: CLAUDE.md | rinviare alla chiusura | 0 |
| Z10/C8: percorso di `t51` | adottare | 1 min |
| Z11, Z12, Z13 | rifiutare | 0 |
| C2–C12, K6, K7, K10, K11: definizioni, esempio del modello a strati, criterio delle variabili, rischi in più, affermazioni calibrate | adottare (testo) | 1 ora |
| Testi fissi di `genera_mappa.js` da aggiornare a fine fase | adottare (passo 6) | 15 min |

Nota del revisore: `t51` unisce nomi e `typeof`, quindi né la globale implicita né la conversione in dichiarazione cambiano il suo riferimento.
