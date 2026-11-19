# Goldfish Review Report — Stadio 8 (Zoom Out intermedio)

**Target:** `docs/egm/fase-a/design_draft.md` (righe 1–183) · con i report degli stadi 5, 6, 7
**Reviewer:** `egm-zoom-out` — completed · Nessun Blocker

Verdetto: il design ha la dimensione giusta; il rischio ora è appesantirlo con le ~20 aggiunte proposte dagli stadi 5–7. Per un'app con un solo manutentore su un solo Mac ne servono circa sei, tutte da poche righe.

| Proposta | Decisione del revisore | Costo |
|---|---|---|
| ZO-1 Hook: rifiutare se `git diff --name-only` (non in staging) contiene `index.html`, `src/`, `build.js`; poi `--check` su disco. Prova con staging parziale | Adottare | 1 riga di shell |
| ZO-2 CLAUDE.md: regola del PIANO «niente strati nuovi» + elenco delle frasi che diventano false | Adottare | solo testo |
| ZO-3 Ogni file finisce con `\n`, unione con `''` | Adottare | nessuno |
| ZO-4 `build.js`: codice 2 per file in `src/` non elencati o voci ripetute | Adottare | poche righe |
| ZO-5 Goal riformulato («con l'hook attivo»), attivazione nel Rollout | Adottare | solo testo |
| ZO-7 Tabella Rischi breve (5 righe) | Adottare | solo testo |
| ZO-1 Export dello staging con `checkout-index` | Rifiutare (la riga sopra fa lo stesso) | — |
| ZO-5 GitHub Action di verifica | Rinviare, dichiarato nei Non-Goals | — |
| ZO-6 Diagnostica del punto di divergenza, `--assorbi` | Rifiutare: basta `git diff index.html` nel messaggio | — |
| ZO-9 Taglio ai sotto-titoli, nomi senza posizione | Fase B, come da PIANO | — |
| ZO-8 Specifiche dettagliate di confini e nomi; script di taglio in `tools/` | Rifiutare: il criterio è lo SHA; accorciare il Technical Plan | — |
| ZO-10 27 prove prima e dopo | Togliere (SHA identico ⇒ stesso risultato) | — |
| ZO-7 autocrlf, merge, `--no-verify`, client grafici, hooksPath dopo revert | Rifiutare (YAGNI) | — |
| ZO-11 Alternativa C motivata con i suoi Cons; regola citata dal PIANO | Adottare | solo testo |
