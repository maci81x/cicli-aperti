# Goldfish Review Report — Stadio 5 (Zoom Out iniziale)

**Target:** `docs/egm/fase-a/design_draft.md` (righe 1–183, file intero)
**GoldfishContext:** `docs/PIANO_RIORDINO.md`, `docs/MAPPA.md`, `tests/README.md`

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |
| `egm-inventive-catalyst` | completed |

## Prioritized Findings (Blockers -> Major -> Nits)

Nessun Blocker.

### Z1. L'hook controlla i file su disco, non quelli del commit - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** righe 25, 44–48, 69, 84–86, 147–150
* **Discrepancy Description**: `build.js --check` confronta i sorgenti su disco con `index.html` su disco. Con `git add src/` senza `index.html` (o staging parziale) il check passa e il commit porta il sorgente nuovo con l'`index.html` vecchio: Pages pubblica la versione precedente.
* **Rationale & Recommendation**: l'hook deve verificare l'albero in staging: esportarlo in una cartella temporanea (`git checkout-index -a --prefix=…`) e lanciare `RADICE=<tmp> node build.js --check`; in alternativa rifiutare se `index.html`/`src/` hanno modifiche non in staging. Aggiungere il caso «staging parziale» al Verification Plan.

### Z2. La regola provvisoria per CLAUDE.md contraddice il PIANO - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** righe 167–170 (file 10)
* **Discrepancy Description**: «aggiungere in fondo all'ultimo file di `src/js/`» tiene vivo il meccanismo a strati che il design chiama problema; il PIANO approvato («Come si lavora dopo», punto 4) dice «niente più strati nuovi».
* **Rationale & Recommendation**: regola da subito: «modifica lo strato più alto della funzione nel suo file; niente strati nuovi». Elencare anche le altre frasi di CLAUDE.md che diventano false («Non riscrivere index.html da zero — usa Edit», «single file», «un solo `<script>` in due parti»).

### Z3. Protezione solo locale: persi la Action di verifica e il check nei test - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst` (anche `egm-zoom-out`, come Nit)
* **Affected Scope:** righe 25, 32, 40, 102–106
* **Discrepancy Description**: l'hook vale solo dove `core.hooksPath` è impostato. Il PIANO prevedeva `--check` anche «in una GitHub Action sui push» e «nei test»; il design li ha tolti senza dirlo. L'Alternativa C scartata riguarda una Action che *costruisce*; una Action che solo *verifica* non ha quel difetto.
* **Rationale & Recommendation**: aggiungere una Action di sola verifica (non costruisce, non pubblica), oppure dichiarare esplicitamente il rinvio e a quale fase. Valutare un avviso di `build.js` se l'hook non è attivo.

### Z4. La modifica fatta a mano in index.html va persa senza diagnosi - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** righe 50–54, 84
* **Discrepancy Description**: CUJ 2 accetta che rilanciare la build cancelli la modifica; `--check` non dice dove sta la differenza.
* **Rationale & Recommendation**: quando `--check` fallisce, indicare il primo file di `src/` e la riga in cui l'`index.html` diverge (i confini dei pezzi sono noti). Facoltativo: `--assorbi` per riportare la modifica nel pezzo giusto; commento «generato da build.js» in un secondo commit separato.

### Z5. Due regole diverse per riconoscere le versioni - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** righe 74–78, 82
* **Discrepancy Description**: `tools/mappa/analizza.js` riconosce anche `// --- … (v29.1)` e non tratta in modo speciale `// v4: …` (riga 10279), il taglio della fase A sì: nomi dei file e versioni in MAPPA vanno fuori sincronia.
* **Rationale & Recommendation**: allineare le regole e tenere lo script di taglio in `tools/`.

### Z6. Test prima/dopo non aggiungono informazione - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** righe 26, 39, 177
* **Discrepancy Description**: con SHA identico i test aprono lo stesso file; il criterio è lo SHA.
* **Rationale & Recommendation**: tenere lo SHA come criterio; spostare «tutte le prove devono passare» alla fase C.

### Z7. Dettagli di implementazione nel design; frase sugli a-capo falsa - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** righe 80, 82, 84
* **Discrepancy Description**: 40 caratteri, accenti, uscita 2, `RADICE` sono dettagli. «Nessun file termina con un a-capo proprio» è falso per `coda.html` (`index.html` finisce con `</html>\n`).
* **Rationale & Recommendation**: unico criterio lo SHA; correggere la frase sugli a-capo.

### Z8. Taglio troppo grosso e nomi legati alla posizione - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** righe 74–82, 132–140
* **Discrepancy Description**: restano pezzi da 2.982, 2.104, 958, 926 righe (tetto del PIANO: 800); il prefisso `NNN` di posizione costringe a rinominare in fase B.
* **Rationale & Recommendation**: tagliare già ai sotto-titoli `// ═══` i pezzi oltre 800 righe (resta identico byte per byte); numerazione rada o senza numero di posizione.
