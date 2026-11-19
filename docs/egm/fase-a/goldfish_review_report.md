# Goldfish Annotated Review Report

**Target:** `docs/egm/fase-a/design_draft.md` (full file)
**Fonte dei rilievi:** [consolidated_review_report.md](consolidated_review_report.md) (azioni A1–A19)
**Status:** in attesa della decisione di Roby

## Da decidere tu (ESCALATE)

### E1. Prove che falliscono già sulla v50 [`egm-comprehension`, `egm-implementation-readiness`, `egm-zoom-out`] - Severity: Major
*   **Affected Scope:** righe 26, 39, 177
*   **Fatto:** sulla v50 non toccata 25 prove su 27 passano; `t26.js` e `t29.js` si bloccano sempre allo stesso punto (rilanciate due volte). Causa verificata: `t26` cerca gli obiettivi in `.v26-testa`, che la v47 ha spostato; `t29` clicca un tasto dei minuti di preparazione che oggi c'è ma non è visibile. Sono prove rimaste indietro rispetto all'app, non errori della fase A.
*   ***AI Suggestion:*** ESCALATE
*   ***Justification:*** la tua regola «dopo la fase A tutte le prove devono passare» non si può soddisfare senza toccare `tests/` (con `index.html` identico il risultato non può cambiare). Proposta: criterio della fase A = «stessi risultati della v50» (25/27, stessi due fallimenti); aggiornare `t26` e `t29` alla v50 in un lavoro a parte, prima della fase C, così da lì in poi «tutte devono passare» vale davvero.

### E2. Le 27 prove prima e dopo: toglierle? [`egm-zoom-out` ZO-10] - Severity: Nit
*   ***AI Suggestion:*** ESCALATE (non le tolgo)
*   ***Justification:*** il revisore ha ragione che con lo SHA identico non danno informazione nuova, ma le hai chieste esplicitamente con l'elenco. Le faccio girare comunque (costano circa 10 minuti di macchina).

### E3. GitHub Action di sola verifica [A9] - Severity: Nit
*   ***AI Suggestion:*** ESCALATE (proposta: non ora)
*   ***Justification:*** pro: scatta anche dove l'hook non è attivo. Contro: avvisa solo dopo il push (Pages pubblica comunque), aggiunge `.github/`, oggi lavori da un solo Mac. Nel design la scrivo come rinviata; se la vuoi la aggiungo.

### E4. I README del bootstrap EGM [R6, A10] - Severity: Major
*   ***AI Suggestion:*** ESCALATE
*   ***Justification:*** il bootstrap ha scritto 6 README (`README.md` aggiornato, `supabase/`, `supabase/functions/`, `supabase/functions/claude/`, `tools/`, `tools/mappa/`, `tools/posta/`) e per regola della skill non li committa: li rivedi tu. Proposta: la fase A non tocca `README.md` (le istruzioni su `src/` vanno in un nuovo `src/README.md`) e committa solo i suoi file; i README del bootstrap restano da parte finché non dici ok.

## Correzioni proposte (PROPOSE FIX)

| ID | Gravità | Modifica alla bozza |
|---|---|---|
| A6 | Blocker | Nuova H2 «Rischi e mitigazioni» con 5 righe (staging parziale → A1; hook non attivo → A5; file non elencato → A3; a-capo dell'editor → A2; modifica diretta di `index.html` → messaggio con `git diff index.html` + A4). Righe 40 e 54 spostate lì. Una riga dice quali rischi sono esclusi e perché (A18) |
| A1 | Major | Hook `#!/bin/sh`: se `git diff --cached --name-only` contiene `^index\.html$`, `^src/` o `^build\.js$` → se `git diff --name-only` (non in staging) contiene gli stessi percorsi, rifiuta («metti in staging anche …»); poi `node build.js --check`; se `node` manca, messaggio chiaro. Prova con staging parziale nel Verification Plan |
| A2 | Major | Ogni pezzo finisce con `\n` (anche `coda.html`, che termina con `</html>\n`); `build.js` unisce con `''` |
| A3 | Major | `build.js` esce 2 se trova sotto `src/css`, `src/js` o `src/*.html` un file non elencato, o una voce ripetuta |
| A4 | Major | CLAUDE.md (solo locale): «si modifica il file in `src/` dove sta lo strato più alto della funzione; niente strati nuovi; poi `node build.js`; `src/` e `index.html` nello stesso commit». Riscritte «Non riscrivere index.html da zero — usa Edit…» (→ «usa Edit sui file di `src/`»), «single file» e «un solo `<script>` in due parti» |
| A5 | Major | Goal: «con l'hook attivo (una volta per copia del repo)». Passo esplicito: `chmod +x tools/hooks/pre-commit` prima di `git add`, poi `git config core.hooksPath tools/hooks` in questa copia (lo faccio io) |
| A7 | Major | Regex: CSS `^/\*.*\bv\d+`, JS `^// v\d+(\.\d+)?\b` oppure `^// ║ PARTE 2`; intervalli (testa 1–63, CSS 64–2635, corpo 2636–3498, JS 3499–21795, coda 21796–21798); 47 e 115 bloccanti. Nomi: `NNN-vX-slug` (slug = minuscole, senza accenti, `[^a-z0-9]+`→`-`, al massimo 40 caratteri senza trattino finale; versione con il punto sostituito da trattino, es. `v29-1`); titolo vuoto → `NNN-vX`; primo pezzo `000-base`; pezzo PARTE 2 → `001-parte-2-interfaccia` |
| A7b | Major | `build.js` = il codice di PIANO_RIORDINO con due modifiche (A2, A3); messaggi invariati; percorsi relativi a `src/`; `RADICE` variabile d'ambiente, predefinita la cartella di `build.js` |
| A8 | Major | Comando: `cd tests && NM="$PWD/node_modules" OUT=<cartella> node <file>` in un ciclo su `smoke.js t*.js`, registrando codice d'uscita, numero di `ok` e di `FAIL`; riferimento salvato prima; criterio = risultati uguali a quelli della v50 (vedi E1) |
| A10 | Major | Commit della fase A con l'elenco esatto: `src/**`, `build.js`, `tools/hooks/pre-commit`, `index.html` (invariato), `tests/README.md`, `docs/PIANO_RIORDINO.md`, `docs/egm/fase-a/**`. Fuori: i README del bootstrap (E4) |
| A16 | Major | Nuova sezione «Vincoli dati da Roby (19/11)» con le sue regole citate; Alternativa C motivata con i suoi Cons; aggiunte «verifica in CI» (rinviata, E3) e «taglio ai sotto-titoli» (fase B, come da PIANO) |
| A17 | Major | «file piccoli» → «162 file invece di uno (il più grande, `000-base.js`, ha 2.982 righe)»; «un errore non si vede…» → «un errore emerge solo se una prova lo copre»; frase su `corpo.html` riscritta con gli intervalli; `ordine.txt` = 165 voci + 2 commenti; prova `--check`: «cancellando dal disco un file elencato → 2», ripristino con `git checkout -- index.html src/` |
| A15 | Nit | «847 KB» → «1,47 MB» |
| A19 | Nit | `tools/README.md` con `hooks/` (insieme ai README del bootstrap, E4); in PIANO la fase A segnata nel titolo e in «Stima»; `tests/README`: «dalla radice del repo `node build.js`» |

## Non accolte (DECLINE)

| ID | Motivo |
|---|---|
| A11 diagnostica / `--assorbi` | `git diff index.html` mostra già la modifica fatta a mano; basta citarlo nel messaggio dell'hook (ZO-6) |
| A12 taglio ai sotto-titoli e nomi senza posizione | il PIANO approvato lo mette nella fase B; anticiparlo allarga la fase A senza più sicurezza (ZO-9) |
| A13 cucitura dei tagli | cosmetico; la regex resta quella della prova già verificata; si sistema in fase B quando si taglia ai sotto-titoli |
| A14 script di taglio in `tools/` | gira una volta; dopo, la fonte è `src/` e il giudice è lo SHA (ZO-8) |
| A18 rischi esotici | un utente, un Mac: autocrlf (repo solo LF), merge, `--no-verify`, client grafici, hooksPath dopo revert restano fuori, con una riga che lo dice |

## Conteggio

PROPOSE FIX 15 · ESCALATE 4 · DECLINE 5 · CONTEST 0
