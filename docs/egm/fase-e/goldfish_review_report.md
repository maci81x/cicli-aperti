# Goldfish Annotated Review Report — Fase E

**Target:** `docs/egm/fase-e/design_draft.md` (full file), 23/11
**Revisori (in parallelo):** `egm-design`, `egm-codebase-details`, `egm-implementation-readiness`, `egm-zoom-out`.
**Status:** resolved. Roby ha chiesto di procedere fino a fine fase E: decisioni applicate in blocco e registrate qui.

| Rilievo | Revisori | Decisione | Come |
|---|---|---|---|
| Piano dettagliato assente (comandi, prove, ripristino) (Blocker) | readiness | PROPOSE FIX | sezione «Detailed Implementation Plan» sul modello della fase D |
| `stili.js` non specificato; prova di stabilità mancante (Blocker) | readiness | PROPOSE FIX | tabella degli scenari, chiave, proprietà, pseudo-elementi, formato; due giri su `main` = 0, cambio finto = 3 (fatto) |
| Seme di `t52` non riusabile, `apriApp` senza `colorScheme` (Blocker) | readiness | PROPOSE FIX | `tests/dati-golden.js` richiesto da `t52`; opzione `colorScheme` in `harness.js` |
| Elenco dei selettori della radice incompleto (`000-base:34,39`) | codebase, design | PROPOSE FIX | 16 regole con file e riga |
| Ipotesi di E2 da scrivere (attributi solo su `<html>`, JS cambia gli attributi a runtime) | codebase | PROPOSE FIX | paragrafo «Ipotesi» |
| Tavolozza dai valori calcolati perde `var()` | design, zoom-out | PROPOSE FIX | si sposta il testo che vince per stato; i valori calcolati solo come verifica |
| Regola `@media (prefers-color-scheme: dark)` di `023:16` non vale mai | design | PROPOSE FIX | tolta in E2; stati dell'app 4, verifica su 8 |
| E3: ordine nella regola unita (`.spazio-riga`: `border-color` dopo `border`) | design | PROPOSE FIX | dichiarazioni nell'ordine originale; doppioni solo per nome identico; longhand/shorthand non toccati |
| E3: controllo «in mezzo» anche su altri contesti; tabella delle famiglie | design, zoom-out | PROPOSE FIX | qualsiasi contesto; tabella esplicita e prudente |
| E3 tra file diversi = spostare regole tra file | zoom-out | PROPOSE FIX | solo dentro un file; i ripetuti tra file in `casi.md` |
| E4: filtro sugli elementi non sicuro (`.a` e `.b` sullo stesso elemento, `:hover`, classi di stato) | zoom-out, design | PROPOSE FIX | criterio statico sull'intero foglio, indipendente dagli elementi |
| E4: famiglie, animazioni (`.item.lampo`), `@media print`/riduci movimento, `*`, `[hidden]`, stili in linea letti per intero | design, codebase | PROPOSE FIX | condizioni 1-5 |
| E4: dichiarazioni che non valgono mai (`html:root S` copre S) | design | PROPOSE FIX | tolte intere |
| Quattro script nuovi sono troppi | zoom-out | PROPOSE FIX | `stili.js` + `css_riordina.js` con tre modi; `variabili.js` esteso |
| Riferimento in cartella temporanea senza commit d'origine | readiness | PROPOSE FIX | preso da `1bf722d`, si rigenera |
| Come dividere E3 e trovare il colpevole | readiness | PROPOSE FIX | un commit per area; `--solo`, `--escludi`, bisezione; `casi.md` |
| Scenario tra 768 e 1100, pseudo-classi forzate via CDP | zoom-out | PROPOSE FIX in parte | scenario a 900 px sì; `:hover` forzato no (le regole statiche coprono gli stati) |
| `stili.js` non serve per E1/E2 | zoom-out | DECLINE | costa 3 minuti e ha già trovato zero differenze su base stabile: si tiene per ogni commit |

Conteggio: PROPOSE FIX 17 (1 in parte) · DECLINE 1 · CONTEST 0 · ESCALATE 0.
