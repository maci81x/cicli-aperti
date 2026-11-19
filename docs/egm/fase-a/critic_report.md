# Goldfish Review Report — Stadio 7 (Critica del design)

**Target:** `docs/egm/fase-a/design_draft.md` (FeatureRange, righe 1–117)
**Standard:** `feature-spec-standard` per `egm-design` e `egm-structural`
**GoldfishContext:** `docs/PIANO_RIORDINO.md`, `docs/MAPPA.md`, `tests/README.md`, `tests/harness.js`

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-design` | completed (ha verificato su `index.html`: SHA, righe 63–2636 e 3498–21796, 46+114 tagli, i 115 pezzi JS validi da soli con `vm.Script`, CSS bilanciato, file che finisce con `</html>\n` senza CR né BOM) |
| `egm-structural` | completed |
| `egm-style` | completed |

## Prioritized Findings (Blockers -> Major -> Nits)

### K1. Manca la sezione «Rischi e mitigazioni» - Severity: Blocker
* **Reviewer Lens:** `egm-structural` (Blocker), `egm-design` (Major)
* **Affected Scope:** righe 1–117 (rischi sparsi tra righe 40, 54, 112–114)
* **Discrepancy Description**: lo standard chiede modi di guasto e mitigazioni. Non compaiono: staging parziale, hook non attivo o aggirato (`--no-verify`, client grafici senza `node` nel PATH), file in `src/` non elencati in `ordine.txt`, a-capo finale aggiunto dall'editor, `core.autocrlf`, conflitti di merge su `index.html`, abitudine di modificare `index.html` direttamente.
* **Rationale & Recommendation**: aggiungere una H2 con tabella Rischio | Mitigazione; spostarci righe 40 e 54.

### K2. A-capo finale: la regola rompe l'identità ed è fragile - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** righe 80, 84, 25
* **Discrepancy Description**: `index.html` finisce con `</html>\n`: se `coda.html` non lo tiene, si perde l'ultimo byte. Inoltre molti editor aggiungono l'a-capo finale da soli: `build.js` produrrebbe righe vuote in più e `--check` passerebbe lo stesso (confronta solo `src/` con `index.html`).
* **Rationale & Recommendation**: convenzione «ogni file finisce con `\n`, unione con `''`», naturale per gli editor; facoltativo un controllo contro l'impronta congelata fino alla fine della fase B.

### K3. L'hook controlla il disco, non lo staging - Severity: Major
* **Reviewer Lens:** `egm-design` (stesso rilievo di Z1 e C3)
* **Affected Scope:** righe 25, 47–48, 86
* **Rationale & Recommendation**: costruire dall'albero in staging in una cartella temporanea con `RADICE`, o almeno bloccare se `src/` è in staging e `index.html` no (o viceversa).

### K4. File di `src/` non elencati in `ordine.txt` ignorati in silenzio - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** righe 22, 84
* **Rationale & Recommendation**: `build.js` fallisce (codice 2) se trova file `.html/.css/.js` sotto `src/` non elencati, o voci ripetute.

### K5. Il Goal promette un controllo automatico che dipende da un'attivazione manuale - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style` (stesso rilievo di Z3 e C4)
* **Affected Scope:** righe 25, 40
* **Rationale & Recommendation**: riformulare il Goal («una volta attivato in locale…»); Action GitHub di sola verifica come rete che non contraddice il Non-Goal di riga 32; messaggio chiaro nell'hook se `node` manca.

### K6. Alternatives: motivazione d'autorità senza link; mancano due alternative - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-structural`
* **Affected Scope:** righe 6, 88–106
* **Discrepancy Description**: l'Alternativa C si appoggia a «regola di Roby» senza riferimento; la richiesta del 19/11 (riga 6) non è collegata. Mancano: (a) verifica in CI senza build; (b) tagliare già ai sotto-titoli `// ═══` (pezzi da 2.983, 2.104, 958, 926, 746 righe oltre il tetto di 800).
* **Rationale & Recommendation**: motivare C con i Cons tecnici di riga 105 e citare la regola come vincolo con un riferimento versionato; aggiungere le due alternative con il motivo del rifiuto o dell'adozione.

### K7. Nome del pezzo «PARTE 2» e titoli vuoti non definiti - Severity: Major
* **Reviewer Lens:** `egm-structural` (Major), `egm-design` (Nit)
* **Affected Scope:** righe 78, 82
* **Discrepancy Description**: `NNN-vX-titolo` non vale per `// ║ PARTE 2` (senza versione) né per `/* ══ v3 ══ */` (titolo vuoto); non è detto se i 40 caratteri valgono per il titolo o per il nome intero.

### K8. Affermazioni più forti di quanto il documento prova - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** righe 18 («file piccoli», ma `000-base.js` ha 2.982 righe), 93 («un errore non si vede con un controllo automatico», ma le prove di `tests/` sono un controllo), 80 (frase su `corpo.html` a frammenti).

### Nit (raggruppati)
* `egm-structural` / `egm-style`: H3 al posto delle etichette in grassetto nel Technical Plan; diagramma che fa pendere i file da `ordine.txt`; estremi dei blocchi con i tag (63–2636) contro MAPPA senza tag (64–2635); link Markdown al PIANO in riga 94; lingue mescolate nelle intestazioni e «Rejected by author» ripetuto; separatori `---` non uniformi; 21.798 vs 21.800; «non si pubblica senza ok» da spostare in Rollout; «Prestazioni: nessuna»; titoli dei CUJ non uniformi; caporali annidati in riga 54; «confronta e esce»; «usarla» senza soggetto; «qualcosa sotto `src/`».
* `egm-design`: hook che non scatta se cambia solo `build.js`; attivazione dell'hook da elencare nel rollout; fonte dei numeri (MAPPA) da citare.
