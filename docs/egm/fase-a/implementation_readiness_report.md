# Goldfish Review Report — Stadio 9 (Pronto per l'implementazione)

**Target:** `docs/egm/fase-a/design_draft.md` (DetailedRange, righe 118–183)
**Standard:** `implementation-readiness-standard` per `egm-implementation-readiness` e `egm-codebase-details`

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-implementation-readiness` | completed |
| `egm-codebase-details` | completed (ha confrontato il piano con il repo: SHA, confini, conteggi, assenza di `package.json` e di `core.hooksPath`, `CLAUDE.md` ignorato, stato del working tree) |
| `egm-style` | completed |

Nessun Blocker. Verdetto comune: struttura e numeri giusti, ma restano scelte lasciate a chi esegue.

## Major

| # | Rilievo | Revisori |
|---|---|---|
| R1 | A-capo finale: `index.html` finisce con `</html>\n`; la regola di riga 80 lo perde. Scegliere una convenzione sola | readiness, codebase |
| R2 | Regola di taglio senza espressione esatta: con `^// v\d` si ottengono 115 file, con `// vNN ` 114, con `// vNN ·` (PIANO) 112. Righe anomale: 10279 `// v4:`, 13346 `// v9 (22/10) ·`, 13942 `// v10 (22/10) ·`. Dare le regex e rendere bloccanti i conteggi 47/115 | readiness, codebase, style |
| R3 | Nomi dei file non deterministici: titolo vuoto (`/* ══ v3 ══ */`, riga 574), pezzo `PARTE 2`, separatori, taglio a 40 caratteri, versioni doppie | readiness, codebase, style |
| R4 | Intervalli di riga dei cinque blocchi da scrivere (testa 1–63, CSS 64–2635, corpo 2636–3498, JS 3499–21795, coda 21796–fine) | readiness, style |
| R5 | Hook: controlla il disco, non lo staging; `grep` sui nomi senza àncora `^` | readiness, codebase |
| R6 | Confine del commit: nel working tree ci sono già `README.md` modificato e i README del bootstrap EGM non tracciati; il piano modifica `README.md` | readiness, codebase |
| R7 | `build.js`: dichiarare normativo il codice del PIANO (messaggi esatti), oppure darne le differenze | readiness, codebase |
| R8 | Prove non eseguibili come scritte: valore di `NM` (t50 senza `NM` salta axe), comando del ciclo, cosa si registra, criterio per t26/t29 | readiness, codebase, style |
| R9 | Attivazione dell'hook assente dai passi (`git config core.hooksPath tools/hooks`, `chmod +x`, shebang, come si fa la copia per la prova) | readiness, codebase, style |
| R10 | CLAUDE.md: anche «Non riscrivere index.html da zero — usa Edit» e «single file» diventano falsi; la regola sostitutiva deve togliere l'«avvolgi» | readiness, codebase, style |
| R11 | Conteggio di `ordine.txt`: 165 voci + 2 commenti = 167 righe; testo dei commenti da dare | style (Major), readiness/codebase (Nit) |
| R12 | Prova di `--check`: «togliendo un file» è ambiguo (cancellato dal disco → 2; tolto dall'elenco → 1); comando di ripristino | style |

## Nit

* Cucitura dei tagli: la riga `// ═══` (o `// ╔`) sopra il marcatore resta nel file precedente; dire che è voluto o tagliare prima.
* `tools/README.md` da aggiornare con `hooks/`; punto esatto dove segnare la fase A in PIANO; `node ../build.js` se lanciato da `tests/`.
* Ordine dei passi dentro il commit.
* `RADICE` = variabile d'ambiente, percorsi relativi a `src/`, significato dei codici d'uscita.
* «(Modify → riscritto)» contraddice «nessuna differenza»; riferimento esplicito dell'impronta; «Type / Scope» ridondante; riga di provenienza EGM.
* Riga 12: «847 KB» è sbagliato, il file pesa 1.473.428 byte.
