Drift report fatto sul commit `4b23c0d` (ramo `riordino/fase-e`). I documenti sono confrontati con i file sul disco. Al momento del controllo 6 file hanno modifiche non committate, cioè la chiusura v53 in corso: `NOTE_LOGICA.md`, `docs/MAPPA.md`, `docs/STATO_RIORDINO.md`, `index.html`, `src/js/core/084-v20-…js` (`VERSIONE_APP` «2026-11-23 v53 riordino») e `tools/mappa/genera_mappa.js`. `node build.js --check` dà 0.


> **Corretti nel commit di chiusura (v53)**: testo fisso «HTML righe 2638–3497» di `tools/mappa/genera_mappa.js` (ora calcolato) e `docs/MAPPA.md` rigenerata; intestazione di `tools/riordino/README.md` (fasi C, D, E); `tools/README.md` elenca `riordino/`; stato in testa a `docs/PIANO_RIORDINO.md` (struttura per componenti non fatta); esito in testa al design della fase E (nessun `!important` tolto, E3 in un commit). `STATO_RIORDINO.md` e `NOTE_LOGICA.md` sono entrati nello stesso commit. Gli altri rilievi (design delle fasi A e C con numeri del 19/11, README di cartella e README della radice) restano: descrivono lo stato al momento in cui furono scritti o cose fuori dal riordino.

## docs/egm/fase-a/design_draft.md

- Righe 27, 31 e 195: «162 file», «165 file: … 47 file CSS … 115 file JS» e «`ordine.txt` … 165 voci = 167 righe». Oggi `ordine.txt` ha 220 righe e 218 voci: 3 HTML, 48 CSS e 167 JS.
- Righe 67–75 (schema) e 91–92: i file sono descritti piatti (`css/000…046-*.css`, `js/000…114-*.js`). Dalla fase B stanno in `src/css/<area>/` e `src/js/<area>/`, e i pezzi dei file grandi si chiamano `NNN-kk-…` (per esempio `js/core/000-01-config.js`).
- Riga 27: «il più grande, `000-base.js`, ha 2.983 righe». Quel file non esiste più: la fase B lo ha diviso in `src/js/<area>/000-NN-….js`. Oggi il JS più lungo è `pianifica/063-v6-…js`, con 893 righe.
- Righe 18 e 33: il Goal «`node build.js` riscrive `index.html` con impronta `e8ef9bc5…aa6b`» non vale più. Dalla fase C `index.html` cambia: sul disco l'impronta è `3c7b16d8…`, nel commit HEAD è `35a17838…`. Il documento non dice da quando l'impronta smette di essere il criterio.
- Riga 83: `testa.html` è indicato come righe 1–63. Oggi ne ha 64, per il commento «File generato da build.js…» aggiunto nella fase C. Anche l'intervallo di `corpo.html` (2636–3498, riga 85) non vale più: in `index.html` l'HTML del body va da `</style>` (riga 2529) a `<script>` (riga 3391).
- Riga 207: «per questo `tools/README.md` non elenca ancora `hooks/`». Oggi lo elenca (`tools/README.md:9`).

## docs/egm/fase-c/design_draft.md

- Righe 12, 17 e 49: «29 file» di prova e «29/29». Oggi le prove sono 32 (`smoke.js` e 31 file `t*.js`, fino a `t55`).
- Righe 53 e 72: «Le 2 basi catturate (`disegnaAnteprima`, `disegnaAnteprimaCattura`) … restano». La fase D ha tolto la base catturata di `disegnaAnteprima`, che oggi è una sola `function` in `cattura/081-v17-…js:101`. Resta catturata solo `disegnaAnteprimaCattura`.
- Riga 81: le catture sono date in «`066-v9-spesa-…js:123` e `:206` (righe 12976 e 13059 di `index.html`)». Il file oggi ha 207 righe: la base di `disegnaAnteprimaCattura` è alla 180 e il suo ascoltatore `input` alla 191. Alla 123 e alla 206 non c'è più nessuna cattura.
- Riga 84: lo strato per nome è indicato in «`src/js/pianifica/063-…js:888-891`». Oggi è alle righe 856–858.
- Riga 58: «`VERSIONE_APP` … cambia alla chiusura del riordino, v51». v51 e v52 sono state versioni normali; la chiusura del riordino è la v53 («2026-11-23 v53 riordino», per ora solo sul disco).
- Riga 169: la chiusura prevede `docs/MAPPA.md` rigenerata. Nel commit HEAD la MAPPA è ancora quella del 19/11 (commit `948aad8`, v50, 21.798 righe); quella rigenerata c'è solo sul disco, non committata.

## docs/egm/fase-d/design_draft.md

- Righe 88 e 158: i riferimenti di riga del «passo a mano» non tornano più. Per `index.html` cita le righe 12356, 12322 e 13139, per `066-v9-…js` le righe 89 e 123, e `074-01-4-…js:231` come «strato v10 di `disegnaAnteprima`». Oggi `074…:231` è `disegnaAnteprimaCattura = function () {` e `066-v9-…js` non ha più `disegnaAnteprima`.
- Righe 44 e 137 (anche nella fase E): «le altre ~150 catene della MAPPA». La MAPPA rigenerata conta 133 funzioni riassegnate (44 con 2 o più strati e 89 con uno solo) e 204 riassegnazioni.

## docs/egm/fase-e/design_draft.md

- Titolo, riga 12 e riga 129 (commit 4, «meno `!important`»): nessun `!important` è stato tolto. In `src/css` ce ne sono ancora 95, con la stessa distribuzione della riga 29 (28, 22 e 13). Il commit si chiama «via le dichiarazioni che non vincono mai» e toglie solo 39 dichiarazioni coperte. Il documento non registra l'esito: ne parla solo `casi.md` («!important che restano»).
- Riga 128: E3 doveva essere «un commit per area nell'ordine di `ordine.txt`». È stato fatto con un solo commit, «un selettore una volta dentro ogni file» (`473a864`): 4 unioni, in `core/000-base` e `calendario/028-v30`.
- Riga 12: «Il CSS è in 47 file». Dopo E2 i file sono 48, con `core/000-tavolozza.css`.
- Righe 12 e 28 (obiettivo «ogni selettore definito una volta»): restano separate 4 coppie nello stesso file e 48 selettori ripetuti tra file diversi (`casi.md`). La MAPPA rigenerata conta ancora 65 selettori definiti più volte nello stesso contesto. L'esclusione dei casi tra file diversi è scritta nelle alternative, ma il Goal nell'Overview non è stato ridimensionato.
- Riga 130 (commit 5, «docs: chiusura del riordino (v53)»): non è ancora committato. `VERSIONE_APP`, `NOTE_LOGICA.md`, `docs/MAPPA.md`, `docs/STATO_RIORDINO.md` e `genera_mappa.js` sono modificati solo sul disco. `STATO_RIORDINO.md` però dice già «Chiusura … **fatta** sul ramo fase E».

## docs/PIANO_RIORDINO.md

- Riga 3: «Nessun file è stato ancora spostato: `index.html` non è toccato». Sono fatte le fasi A–D, e la E è fatta sul ramo.
- Righe 122, 145, 151, 160 e 199–202: solo la Fase A è segnata «✅ fatta», anche nella tabella «Stima». Le fasi B, C e D sono fatte e pubblicate, la E è fatta sul ramo `riordino/fase-e` (vedi `STATO_RIORDINO.md`).
- Righe 27–58 («Struttura finale proposta»): non corrisponde a quella di oggi. Non esistono `css/token.css`, `css/base.css`, `css/componenti/`, i file CSS unici per area (`oggi.css`…), `accessibilita.css`, `js/dati/` e `js/avvio.js`. Esistono invece le cartelle `src/css/<area>/` (con `core/`) e `src/js/<area>/`, e la tavolozza è in `src/css/core/000-tavolozza.css`.
- Righe 31–32: `testa.html` è dato come «righe 1–63» e `corpo.html` come «righe 2636–3498». Oggi `testa.html` ha 64 righe e il body sta tra le righe 2529 e 3391 di `index.html`.
- Riga 65: il testo resta contraddittorio. Dice che `build.js` usa `join('')`, poi nella stessa riga «concatena i file con un a-capo tra l'uno e l'altro». Il blocco di codice (righe 67–101) non è più `build.js`: unisce con `join('\n')`, non controlla le voci ripetute, non avvisa per i file non elencati e conta le righe con `length` invece di `length - 1`.
- Righe 118 e 124: l'esempio `090-v26-il-metodo-di-leo.js` non esiste: il file è `pianifica/090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js`. «`000-base.js` (2.982 righe)» è stato diviso nella fase B.
- Riga 129: «trova tutti e 15 gli strati di `vistaOggi`». Dopo la fase D `vistaOggi` è una sola funzione in `oggi/113-v50-…js`.
- Riga 152: le lunghezze delle catene («`disegnaAnteprima` 7, `salvaCattura` 6») non tornano con quelle appiattite nella fase D: 3 strati più la base catturata, e 2 strati.
- Riga 158: «i 154 ascoltatori globali vanno in `avvio.js`» non è stato fatto (`avvio.js` non esiste), e nessun documento di fase lo rinvia esplicitamente.
- Riga 161 (Fase E): il piano prevede di togliere i prefissi `html:root` e «la maggior parte dei 96 `!important`», un file per area e `ordine.txt` raggruppato. Nel CSS restano 53 `html:root` e 95 `!important`, i file sono ancora 48 in ordine storico, e `ordine.txt` non è raggruppato. Anche il conteggio «96 `!important`» (righe 21 e 161) non torna: sono 95.
- Riga 177: «NOTE_LOGICA.md e MAPPA.md citano i file invece dei numeri di riga». `docs/MAPPA.md`, anche quella rigenerata, dà ancora i numeri di riga di `index.html` e nessun percorso `src/js/`.
- Riga 169: la GitHub Action resta indicata come possibile («se si vuole»), mentre la bozza della fase A la esclude per decisione (Non-Goals e Alternativa D).

## README.md

- Riga 13: «301 riassegnazioni di funzioni e 154 ascoltatori» sono numeri della v50. La MAPPA rigenerata conta 204 riassegnazioni su 133 funzioni.
- Riga 24: «`css/<area>/` (47 file)». Oggi sono 48.
- Riga 26: nella voce `tools` manca `riordino` (`tools/riordino/README.md`).
- Riga 47 («System Verification»): «le altre prove: `node t26.js` … `node t50.js`», ma le prove arrivano a `t55` (`t51-globali`, `t52-golden`, `t53`, `t54-caratterizza`, `t55`). Il comando `npm i` non installa `axe-core`, `pngjs` e `pixelmatch`, che servono a `t50` e `t52`. `tests/README.md:6` invece li installa.
- Righe 104–110 («Escalation automatica»): nel codice non c'è nessuna riclassificazione automatica per scadenza (a 30 o 14 giorni, Q2→Q1, Q4→Q3, «⚠ CRITICO»). La cosa compare solo come testo della guida (`src/js/altro/000-20-guida.js:29-36`). Anche le «barre» arancione e rossa contraddicono la v6 («Niente barre laterali»).
- Riga 9: il README non dice niente delle fasi C–E: codice morto tolto, sei catene appiattite, tavolozza in `src/css/core/000-tavolozza.css`. Descrive il codice solo come «cresciuto a strati (v1…v50)».

## src/README.md

- Riga 28: «`css/<area>/NNN-….css` … (47 file)». Oggi sono 48.
- Il README non dice che le variabili della tavolozza (colori e token di tutti i temi) stanno in `css/core/000-tavolozza.css` e vanno modificate lì. Questo file non segue la regola «`NNN` è la posizione nella sequenza storica» (riga 47): ha `000` come `core/000-base.css` e viene prima di lui in `ordine.txt`.
- Riga 47: «Dove sta uno strato di una funzione: docs/MAPPA.md (numeri di sezione = `NNN`)». La MAPPA indica la versione (`vNN`) e la riga di `index.html`, non `NNN`. I file nati dalla divisione di `000-base` (`000-01-config.js`…) non hanno versione nel nome. Per le sei funzioni appiattite la MAPPA non indica più nessuno strato.

## tools/README.md

- Riga 5: «Uno controlla i commit (`hooks`), uno analizza… (`mappa`), il terzo… (`posta`)». Le cartelle sono quattro, e in «Subdirectories & Boundaries» manca `riordino/` (13 script e `README.md`, fasi C–E).

## tests/README.md

- Riga 16: il riferimento di `t51-globali` sarebbe «preso dalla v50». È stato riscritto nelle fasi C e D (ultimo aggiornamento: `9109036`, «fase D, riga in una funzione»).
- Riga 17: `t52-golden` confronta anche gli avvisi in console (`console.warn` e `error`) con `riferimento/golden/avvisi_*.json` (`t52-golden.js:48-53`), e `t54` fa lo stesso. Il README non lo dice. Non cita nemmeno `dati-golden.js`, da cui `t52` e `tools/riordino/stili.js` prendono dati, ora e viste.
- Riga 19: `AGGIORNA=1` è documentato solo per `t51` e `t52`, ma lo legge anche `t54-caratterizza.js` (riga 48).
- Riga 23: fra le opzioni di `apriApp` manca `colorScheme` (tema del sistema, aggiunto nella fase E: `harness.js:137`).

## tools/riordino/README.md

- Riga 3: «Strumenti del riordino (fase C, codice morto)». Oggi la cartella contiene anche gli strumenti delle fasi D (`catene.js`, `appiattisci.js`, `testi.js`) ed E (`stili.js`, `variabili.js`, `css_riordina.js`).
- Riga 13: `css_riordina.js importanti` è descritto solo come togliere «`!important` che nessuna regola potrebbe battere». Il modo toglie anche le dichiarazioni coperte da `html:root S` (righe 257–266), cioè le 39 tolte nella fase E, e nella fase E non ha tolto nessun `!important`. Non sono documentate nemmeno le opzioni `--solo`, `--escludi` e `--prova`, né la variabile `MOTIVI`.
- Riga 20: i design citati sono solo quelli della fase C. Mancano `docs/egm/fase-d/design_draft.md` e `docs/egm/fase-e/design_draft.md` (`fase-d` è citato solo alla riga 16).

## tools/mappa/README.md

- Righe 22–23: le dipendenze elencate sono «`acorn`, `acorn-walk`, `postcss`». `package.json` ha anche `postcss-selector-parser`.
- Riga 40: l'elenco di `verificateDinamiche` non comprende `tag-q1`…`tag-q4`, che invece sono in `genera_mappa.js:10`.
- Righe 62–65: secondo il README, `genera_mappa.js` contiene la data «19/11/2026», «v50, 21.798 righe», le righe delle tavolozze in §4.1 e il filtro `awk -F: '$1<2636'`. Sul disco, data, versione e righe si calcolano da `index.html`, la §4.1 è un testo sulla tavolozza unica e l'`awk` è diventato `grep -rn '!important' src/css`. Resta fisso solo «HTML righe 2638–3497» (`genera_mappa.js:33`), che è sbagliato: oggi l'HTML del body sta fra le righe 2529 e 3391, e la MAPPA rigenerata stampa un intervallo HTML che si sovrappone allo `<script>` (3392–21046).
- Righe 71–75 («Side Effects»): `genera_mappa.js` è descritto come se leggesse solo `report.json`. Sul disco legge anche `../../index.html` (`genera_mappa.js:28`) per versione e righe.
- Riga 44: «la versione indicata nella mappa corrisponde al file `src/js/<area>/NNN-vX-….js` della stessa versione». Non vale per i pezzi di `000-base` (`000-NN-…`, senza versione) e per le sei funzioni appiattite, che stanno nel file dell'ultimo strato.

## tools/posta/README.md

Nessuna deriva.

## supabase/README.md

Nessuna deriva.

## supabase/functions/README.md

Nessuna deriva.

## supabase/functions/claude/README.md

Nessuna deriva.

## .claude/skills/mobile-app-ui-design/README.md

- Riga 5: il badge della licenza rimanda a `LICENSE`, ma nella cartella della skill quel file non c'è (ci sono solo `SKILL.md`, `INDEX.md`, `README.md` e `references/`). È una skill di terzi, non legata al codice dell'app.
