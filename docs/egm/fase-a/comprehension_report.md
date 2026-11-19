# Comprehension Report — Stadio 6

**Target:** `docs/egm/fase-a/design_draft.md` · FeatureRange 1–117 · DetailedRange 118–183 · nessun GoldfishContext (solo il documento)
**Reviewer:** `egm-comprehension` — completed

## Cosa propone (parafrasi del revisore)

Dividere `index.html` (v50, circa 21.800 righe) in file sorgente sotto `src/`, senza cambiare né l'ordine né il contenuto: tre pezzi HTML (testa, corpo, coda), 47 pezzi CSS e 115 pezzi JS tagliati prima di ogni commento di versione a colonna 0, elencati in `src/ordine.txt`. `build.js` (Node puro) li unisce con `\n` e riscrive `index.html`, che deve restare identico byte per byte. `--check` non scrive e restituisce 0 / 1 / 2. Un hook pre-commit versionato in `tools/hooks/` lancia il check quando il commit tocca `index.html` o `src/`, e va attivato a mano con `core.hooksPath`. Le fasi B–E (aree, codice morto, fusione degli strati, CSS) restano fuori.

## Come funziona oggi, secondo il documento

Un solo `index.html` con HTML, un `<style>` (righe 63–2636) e uno `<script>` inline principale (righe 3498–21796), pubblicato così com'è da GitHub Pages. Le modifiche si aggiungono in fondo e avvolgono funzioni già avvolte (`vistaOggi` ha 15 strati). Il comportamento dipende dall'ordine: riassegnazioni, ascoltatori registrati al caricamento, cascata CSS con `!important`, funzioni globali chiamate da `onclick`/`data-act`. Le prove Playwright in `tests/` aprono `../index.html`; `t26` e `t29` falliscono già sulla v50.

## Rilievi

| # | Severità | Ambito | Rilievo |
|---|---|---|---|
| C1 | Major | righe 76, 80 | Confini dei tre file HTML ambigui: le righe 63 e 2636 (e 3498, 21796) stanno nell'HTML o nel CSS/JS? L'inciso sul «piccolo script in testa» è oscuro; non si dice dove finiscono gli altri `<script>` (CDN, tema). Lo script di taglio non resta nel repo, quindi il testo è l'unica fonte |
| C2 | Major | riga 80 | A-capo finale di `index.html`, fine riga (LF/CRLF), codifica e BOM non trattati; la regola «nessun file termina con un a-capo» contraddice l'identità se l'originale finisce con `\n` |
| C3 | Major | righe 25, 86, 150 vs CUJ 1 | Il check guarda i file su disco, non lo staging: commit a metà non bloccato. Non è detto se una modifica a `build.js` attivi il check |
| C4 | Major | riga 25 vs riga 40 | L'obiettivo presenta il controllo come automatico; solo dopo si scopre che l'hook va attivato a mano su ogni copia |
| C5 | Major | riga 177 | `NM` non definito; non si dice dove installare Playwright e `axe-core` |
| C6 | Nit | riga 125 | «165 righe» + 2 righe di commento = 167 |
| C7 | Nit | righe 78, 82 | Nome del pezzo `// ║ PARTE 2` (senza versione) non definito; «PARTE 2» non spiegato |
| C8 | Nit | righe 77–78 | Non è detto se ogni commento con `vNN` a colonna 0 apre una sezione (`/* corretto in v12 */`?); conteggi senza spiegazione di come sono verificati |
| C9 | Nit | riga 84 | `RADICE`: variabile d'ambiente o costante? Valore predefinito? |
| C10 | Nit | righe 16, 99 | Termini del progetto non definiti: strato, avvolgere, `data-act`, `VERSIONE_APP` |
| C11 | Nit | riga 33 | Motivo per cui niente `package.json` in radice troppo compresso |
| C12 | Nit | righe 6, 106 | La «richiesta del 19/11» è citata come fonte vincolante ma non ha un link |
| C13 | Nit | riga 54 | Caporali annidati nel messaggio dell'hook |
| C14 | Nit | riga 112 | Dopo un `git revert` chi ha `core.hooksPath tools/hooks` resta con un percorso che non esiste |

Nessun Blocker: tutte le sezioni si possono parafrasare e i pezzi si collegano.
