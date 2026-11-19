# Goldfish Review Report — Fase C, stadio 5 (Zoom Out iniziale)

**Target:** `docs/egm/fase-c/design_draft.md` · **Reviewer:** `egm-zoom-out` completed, `egm-inventive-catalyst` completed · Nessun Blocker.

| # | Severità | Rilievo | Revisori |
|---|---|---|---|
| Z1 | Major | Manca la catena `apriNuovo` (dichiarazione 7230, alias e strato 15279–15280): avvolta ma mai chiamata; la regola conta alias e strati come riferimenti vivi. PIANO e MAPPA §5.1 la citano | zoom-out, catalyst (Nit) |
| Z2 | Major | Togliendo la base `function f`, lo strato `f = function…` diventa un'assegnazione a un nome non dichiarato (globale implicita: niente hoisting, `no-undef`); `t51` non se ne accorge perché resta una proprietà di `window` con lo stesso `typeof`. Proposta: riscrivere l'intestazione dello strato a colonna 0 in `function f(…)` (non dentro blocchi: Annex B; attenzione alle frecce) | zoom-out, catalyst |
| Z3 | Major | Inventario prodotto da script nello scratchpad, non versionati e diversi da `tools/mappa`: portare le regole nel repo | zoom-out |
| Z4 | Major | La copertura misura solo l'avvio e 4 schede. Proposta: build con una trappola (`console.error('[morto] …')`) all'inizio di ogni pezzo candidato e le 29 prove su quella build: ogni trappola scattata smentisce la «morte» | catalyst (zoom-out: Nit, «presentarla come controllo di buon senso») |
| Z5 | Major | Le 2 basi tenute (`disegnaAnteprima`, `disegnaAnteprimaCattura`) girano a ogni tasto ma il loro risultato è sempre sovrascritto subito dall'ascoltatore v9 (righe 13829–13830, «i campi ascoltavano le versioni di prima»); proposta: togliere anche i due `addEventListener` delle righe 12976 e 13059 | catalyst |
| Z6 | Nit | Numeri del Problem (MAPPA) e dei Goals non riconciliati (23→25, 38→33, 23→41, «tre tavolozze»→252) | zoom-out, catalyst |
| Z7 | Nit | Tavolozze: si tolgono solo dichiarazioni sempre coperte, regole frammentate; l'unificazione completa («resta v44.1 + v50») va dichiarata per la fase E | zoom-out, catalyst |
| Z8 | Nit | Commento «file generato» in testa a `index.html` previsto dal PIANO per la fase C: includerlo o escluderlo | zoom-out |
| Z9 | Nit | CLAUDE.md locale cita helper che spariranno (`catIcona`, `parcheggiaCiclo`, `retryFailedSyncs`, `switchView`) | zoom-out |
| Z10 | Nit | Percorso di `t51` incoerente nel piano (`node tests/t51…` vs `node t51…`) | zoom-out |
| Z11 | Nit | Granularità: come si trova il colpevole se il commit 2 rompe una prova (dimezzare le esclusioni) | catalyst |
| Z12 | Nit | Aggiornamento di `t51` controllato a mano: confronto automatico con l'elenco atteso | catalyst |
| Z13 | Nit | `variabili.js`: anche 390 e 1440 px e contrasto alto + tema di sistema | catalyst |

Controlli dei revisori senza problemi: catture alle righe 12976 e 13059 esistono; nessuna prova chiama per nome i candidati; le classi `ptr`, `fab`, `is-open`, `dense`, `solo-desk`, `toast-danger`, `bp-rev-opt` non compaiono in `src/js`; i decoratori per nome (`window[nome]`, righe 12610–12614 e 17576) non riguardano i candidati.
