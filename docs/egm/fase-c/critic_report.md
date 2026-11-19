# Goldfish Review Report — Fase C, stadio 7 (Critica)

**Target:** `docs/egm/fase-c/design_draft.md` (FeatureRange) · **Reviewer:** `egm-design` completed (verdetto: non passa), `egm-structural` completed, `egm-style` completed.

## Blocker

| # | Rilievo | Revisore |
|---|---|---|
| K1 | `.tag-q3` e `.tag-q4` sono **vive**: `tagTipo(q)` scrive `tag tag-q${q}` (`src/js/core/002-v2-…js:80`, index.html 6564) ed è chiamata con q = 3 e 4 (righe 6084, 7786, 7807, 7829, 9308, 15539). L'inventario le dava «verificate a mano come morte» (la ricerca era su `tag-${`, non su `tag-q${`). Toglierle scolorirebbe Delega e Lascia stare in Tutto › Matrice, Un giorno e nel wizard, e nessuna prova se ne accorgerebbe (t52 non copre Tutto né Altro). Correzione: fuori dal commit 3; ogni testo davanti a `${` dentro una classe conta come prefisso dinamico; ricontrollare tutti i selettori; estendere la rete a Tutto e Altro prima del commit 3 | design |

## Major

| # | Rilievo | Revisori |
|---|---|---|
| K2 | Catena morta di `apriNuovo` assente (= Z1) | design |
| K3 | Punto fisso solo dentro il §1: dopo i commit 1–2 possono nascere altre funzioni morte e altre classi senza elementi; rigenerare l'inventario prima di ogni commit e aggiungere un giro «a cascata» | design |
| K4 | Togliere la base cambia la natura del nome (globale implicita, niente hoisting) (= Z2) | design |
| K5 | CUJ 1 promette Tutto e Altro, che `t52` non copre; `t51` stampa solo i primi 20 nomi tolti: confrontare il diff di `globali.json` | design, structural, style |
| K6 | Alternatives senza le scelte vere: strati in C o in D; tavolozze intere (PIANO: «resta v44.1 + v50») o dichiarazioni coperte; analisi statica o copertura completa | design, structural |
| K7 | Rischi incompleti: viste non fotografate, globale implicita, inventario scaduto dopo ogni commit, strati per nome (`window[nome] = …`, `src/js/altro/077-…js:22`, `src/js/pianifica/063-…js:888-891`), sicurezza da motivare (si tolgono percorsi che scrivevano su Calendar: `retryFailedSyncs`, `batchSyncAll`, base di `ensureGcalCalendar`); limite della copertura; riferimenti dai test | design, structural |
| K8 | Numeri non riconciliati (MAPPA 23/38/23/tavolozze; 76 = 25 + 31 + 2 + 18) | tutti |
| K9 | Commento «file generato» in testa a `index.html` (PIANO): includerlo o escluderlo | structural |
| K10 | Affermazioni assolute da ridurre alle prove: «non può mai essere eseguito», «il comportamento non cambia», «esattamente quello di prima», «punto fisso verificato con la copertura», «sicurezza: nessuna» | style |
| K11 | Rifiuto dell'Alternativa A appoggiato a un'interpretazione del vincolo: esplicitare il compromesso (tempo contro granularità del revert) | structural |

## Nit

Titoli in due lingue e ordine Rischi/Alternatives; «impronta» e «rete di sicurezza» da definire; soglia 0,1% contro «0 pixel attesi»; «nessun errore in console» senza prova citata (lo controllano `smoke`, `t50`, `t51`, `t52`); regola del commento attaccato da rendere meccanica; righe di `index.html` senza file di `src/`; CLAUDE.md cita funzioni che spariranno; criterio dei prefissi diverso tra Technical Plan e Rischi; «4 schede» contro 5 sezioni.
