# Report consolidato — review EGM della Fase A

**Target:** `docs/egm/fase-a/design_draft.md` · modalità: report consolidato (5 stadi senza pause) · 19/11/2026
**Report dei singoli stadi:** [zoom_out_report.md](zoom_out_report.md) (5) · [comprehension_report.md](comprehension_report.md) (6) · [critic_report.md](critic_report.md) (7) · [intermediate_zoom_out_report.md](intermediate_zoom_out_report.md) (8) · [implementation_readiness_report.md](implementation_readiness_report.md) (9)

| Stadio | Revisori | Blocker | Major | Nit |
|---|---|---|---|---|
| 5 Zoom out | zoom-out, inventive-catalyst | 0 | 4 | 4 |
| 6 Comprensione | comprehension | 0 | 5 | 9 |
| 7 Critica | design, structural, style | 1 | 7 | molti |
| 8 Zoom out intermedio | zoom-out | 0 | 5 | 6 |
| 9 Prontezza | implementation-readiness, codebase-details, style | 0 | 12 | 6 |

Tutti i 10 revisori hanno completato. Tre di loro hanno verificato i numeri su `index.html` (SHA, confini, 47 + 115 pezzi, pezzi JS validi uno per uno): nessun numero del design è sbagliato, tranne «847 KB».

## Azioni consolidate

### 🔴 Blocker

| ID | Azione | Da |
|---|---|---|
| A6 | Aggiungere «Rischi e mitigazioni» (tabella breve: staging parziale, hook non attivo, file non elencato, a-capo dell'editor, modifica diretta di `index.html`) e spostarci righe 40 e 54 | K1, ZO-7 |

### 🟡 Major

| ID | Azione | Da |
|---|---|---|
| A1 | Hook: rifiutare il commit se `index.html`, `src/` o `build.js` hanno modifiche non in staging; poi `--check`; nomi con `^`; messaggio se manca `node`; prova con staging parziale | Z1, C3, K3, ZO-1, R5 |
| A2 | A-capo: ogni pezzo finisce con `\n`, `build.js` unisce con `''` | Z7, C2, K2, ZO-3, R1 |
| A3 | `build.js`: codice 2 per file `.html/.css/.js` sotto `src/` non elencati e per voci ripetute | K4, ZO-4 |
| A4 | CLAUDE.md: regola del PIANO («niente strati nuovi, modifica lo strato più alto nel suo file») + correggere «Non riscrivere index.html da zero», «single file», «un solo `<script>`» | Z2, ZO-2, R10 |
| A5 | Goal riformulato («con l'hook attivo»); attivazione (`git config core.hooksPath tools/hooks`, `chmod +x`) tra i passi | Z3, C4, K5, ZO-5, R9 |
| A7 | Regole esatte: regex di taglio, intervalli di riga, algoritmo dei nomi, conteggi 47/115 bloccanti | C1, C7, C8, K7, R2, R3, R4 |
| A8 | Prove: comando esatto (`NM` assoluto), criterio «stessi codici d'uscita», t26/t29 | C5, R8, ZO-10, Z6 |
| A10 | Confine dei commit con le modifiche già presenti (bootstrap EGM) | R6 |
| A16 | Alternatives: motivare C con i suoi Cons, citare le regole di Roby in un posto versionato, aggiungere «verifica in CI» e «taglio ai sotto-titoli» | K6, ZO-11, C12 |
| A17 | Affermazioni da calibrare: «file piccoli», «un errore non si vede», frase su `corpo.html`, `ordine.txt` 167 righe, prova di `--check` univoca | K8, R11, R12, stile |
| A7b | `build.js`: dichiarare normativo il codice provato, con le modifiche A2–A3 | R7 |

### 🟢 Nit

| ID | Azione | Da |
|---|---|---|
| A9 | GitHub Action di sola verifica | Z3, K5 (pro); ZO-5 (rinviare) |
| A11 | Diagnostica del punto di divergenza / `--assorbi` | Z4 (pro); ZO-6 (rifiutare) |
| A12 | Taglio ai sotto-titoli e nomi senza posizione già ora | Z8 (pro); ZO-9 (fase B) |
| A13 | Cucitura dei tagli (`// ═══`, `// ╔`) | R-nit, codebase 10 |
| A14 | Script di taglio in `tools/`, regola condivisa con `analizza.js` | Z5 (pro); ZO-8 (rifiutare) |
| A15 | «847 KB» → 1,47 MB | codebase 14 |
| A18 | Rischi esotici (autocrlf, merge, `--no-verify`, client grafici, hooksPath dopo revert) | C14, K1, design 5 |
| A19 | `tools/README.md` con `hooks/`; punto esatto in PIANO; refusi e intestazioni miste | readiness, style |

## Matrice di tracciabilità (rilievo → azione)

Z1→A1 · Z2→A4 · Z3→A5, A9 · Z4→A11 · Z5→A14 · Z6→A8 · Z7→A2, A17 · Z8→A12 · C1→A7 · C2→A2 · C3→A1 · C4→A5 · C5→A8 · C6→A17 · C7–C9→A7 · C10–C13→A17, A19 · C14→A18 · K1→A6 · K2→A2 · K3→A1 · K4→A3 · K5→A5, A9 · K6→A16, A12 · K7→A7 · K8→A17 · ZO-1→A1 · ZO-2→A4 · ZO-3→A2 · ZO-4→A3 · ZO-5→A5, A9 · ZO-6→A11 · ZO-7→A6, A18 · ZO-8→A7, A14 · ZO-9→A12 · ZO-10→A8 · ZO-11→A16 · R1→A2 · R2–R4→A7 · R5→A1 · R6→A10 · R7→A7b · R8→A8 · R9→A5 · R10→A4 · R11–R12→A17 · nit stadio 9→A13, A15, A19
