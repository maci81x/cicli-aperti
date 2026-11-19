## docs/egm/fase-a/design_draft.md

- Il riquadro «Rischi e mitigazioni» dice che il comando per attivare l'hook sta «in `src/README.md` e in `docs/STATO_RIORDINO.md`», ma `docs/STATO_RIORDINO.md` non esiste (in `docs/` ci sono solo `MAPPA.md`, `PIANO_RIORDINO.md` ed `egm/`). Anche la nota del 19/11 in `NOTE_LOGICA.md` rimanda a questo file.
- Il passo 1 di «Hook» chiede `^index\.html$`, ma in `tools/hooks/pre-commit` c'è `PERCORSI='^(index\.html|src/|build\.js$)'`: il `$` si applica solo a `build.js`. Quindi passano anche percorsi come `index.html.bak` o `index.htmlx`, sia nel filtro sullo staging sia nel controllo delle modifiche non in staging.
- «The Problem» dice che `000-base.js` «ha 2.982 righe», ma `src/js/000-base.js` ne ha 2.983 (`wc -l`, righe 3499–6481 di `index.html`, come scrive `NOTE_LOGICA.md`).
- Il passo 8 («Commit con l'elenco esatto dei file») non è stato fatto: `build.js`, `src/`, `tools/hooks/` e `docs/egm/` non sono tracciati, e `README.md`, `tests/README.md` e `docs/PIANO_RIORDINO.md` hanno modifiche non committate. La bozza però porta già lo stato «Approved» e il PIANO dà la fase come fatta. Per ora il bit di esecuzione «in git» dell'hook non si può verificare: c'è solo sul disco.
- `NOTE_LOGICA.md` è modificato (sezione «Riordino · fase A · 19/11»), ma non compare nella tabella «File» della bozza, che dovrebbe essere l'elenco esatto dei file del commit.

## src/README.md

- Il README non dice che `ordine.txt` accetta righe vuote e commenti `#`, anche se lo stesso `ordine.txt` si apre con due righe di commento e `build.js` le salta.
- «se manca, `build.js` avvisa»: l'avviso scatta solo per i file `.html`, `.css` e `.js` (`ESTENSIONI` in `build.js`). Un file di `src/` con un'altra estensione che manca da `ordine.txt` viene ignorato senza avviso.
- Codici d'uscita: il README dà il 2 solo per «voci ripetute o file che non esistono». In `build.js` però ogni eccezione esce con 2, per esempio quando manca `ordine.txt` o una cartella non si legge.
- Non è documentata la variabile d'ambiente `RADICE`, che `build.js` legge per lavorare su una copia del repo.

## README.md

- «System Overview» e «Local Interface & Invariants» descrivono ancora `index.html` come «un solo file» e «l'app intera». Dalla fase A però `index.html` si genera con `build.js` a partire da `src/`. Il README non cita mai `src/`, `build.js`, `node build.js --check` né l'hook `tools/hooks/pre-commit` con `git config core.hooksPath tools/hooks`.
- In «Subdirectories & System Boundaries» manca `src/` (e il suo `src/README.md`). La voce `tools` elenca solo `mappa` e `posta`, senza `hooks`.
- In «Global Invariants» c'è «Nomi, email e titoli veri stanno in `privata/`, mai nei file del repo». Nei file tracciati invece ci sono indirizzi email veri e nomi: `index.html` e 6 file di `src/js/` (5 indirizzi diversi, fra cui costanti come `CAL_LETTURA` e il destinatario predefinito del coach), `tests/harness.js` (2), `tools/posta/leggi.js` (1, più un nome e la ragione sociale scritti nel codice) e `supabase/functions/claude/index.ts` (`EMAIL_AMMESSA`).
- Sempre in «Global Invariants», l'app «modifica o cancella solo gli eventi con la proprietà privata `cicli_aperti`». Ma `gcalFetchUtente` scrive con PATCH, POST e DELETE anche su eventi qualsiasi, quando l'utente lo chiede: per esempio la cancellazione di un appuntamento portato in elenco e lo spostamento di una serie (`spostaSerieEvento`). L'eccezione non è scritta.
- L'elenco delle tabelle («Tabelle toccate», a cui rimanda «Global Side Effects») è incompleto. Il codice usa anche `user_tokens`, `assegnazioni`, `eventi_tipo` (`V24.TABELLA`), `prep_appuntamenti` (`V29.TAB`), `cal_scelte` (`V41.TABELLA`), `mete`, `non_doppioni`, `obiettivi_settimana` ed `eventi_fissi`. Nessuna di queste ha una migration nel repo.
- Al contrario, `posta_thread` e `posta_scansioni` sono elencate (create da `supabase_migration_togli.sql`), ma l'app non le usa come tabelle: `posta_thread` compare solo come campo di una cosa (`c.posta_thread`).
- Anche il Realtime è incompleto: oltre alle 7 tabelle elencate, l'app si iscrive a `eventi_fatti` e `cal_scelte`.
- «Shortcut da tastiera»: `←`/`→` cambiano settimana solo nella scheda Pianifica (`ui.tab === 'pianifica'`), non ovunque. `Cmd+F`/`Ctrl+F` (`focusRicerca`) manca dalla tabella.
- Le sezioni «Viste» (Matrice, Lista, Persone, Storico con emoji), «Contesti» (colori blu e viola) e «Categorie» (con «Da Delegare» fra le categorie di lavoro) descrivono l'interfaccia di prima della v2. Oggi le sezioni sono Oggi, Pianifica, Tutto e Altro, e le aree vengono da `macro_aree`.

## tests/README.md

- `apriApp` restituisce `{ browser, context, page, logs, db, cal }`, ma il README dà solo `{ page, db, cal, logs }`: mancano `browser` e `context`, che servono per chiudere il browser. Fra le opzioni mancano `attesa` (attesa dopo l'avvio, predefinita 1500 ms) e `oraFinta`.
- `harness.js` esporta anche `errori` e `assertDi`, che le prove usano (`ok`/`FAIL`, `process.exitCode`), ma il README non li cita.
- La variabile `OUT`, usata dalle prove per salvare schermate e PDF (predefinita `/tmp`, vedi `t26.js`), non è documentata. Non è documentato nemmeno che `NM` serve anche a `harness.js` per i font di `@tabler/icons-webfont`, e non solo a `t50.js` per `axe-core`.
- Il README fa installare `playwright`, `@supabase/supabase-js`, `jspdf` e `@tabler/icons-webfont`, ma non `axe-core`, che `t50.js` usa e che c'è in `tests/node_modules`. Dei 27 file di prova (`smoke.js` e 26 `t*.js`) il comando ne lancia solo 3.

## tools/README.md

- In «Subdirectories & Boundaries» manca `hooks/` (`tools/hooks/pre-commit`, l'hook che rifiuta i commit con `index.html` non allineato a `src/`). L'Overview dice che in `tools/` ci sono due strumenti, «Uno… l'altro…», ma le cartelle sono tre. La bozza della fase A lascia fuori `hooks/` di proposito, finché i README non vengono approvati, ma rispetto al codice resta una deriva.

## tools/mappa/README.md

- Il README non dice come la mappa si collega a `src/`. `docs/MAPPA.md` dà le righe di `index.html`, mentre `src/README.md` e `CLAUDE.md` mandano a cercare lì lo strato da modificare dentro `src/js/`. Manca la regola, che oggi è scritta solo in `NOTE_LOGICA.md`: il file di `src/js/` è quello della versione indicata.
- `verificateDinamiche` è descritta come i motivi `p-q*`, `t-q*`, `chip-q*` e `v17-q*`. In `genera_mappa.js` è invece un elenco fisso che lascia fuori `p-q2` e `chip-q4`, quindi quelle due classi restano fra le «classi CSS senza elementi».

## tools/posta/README.md

- «la riga di stato iniziale dice se è quello atteso»: l'account atteso è un indirizzo scritto nel codice di `leggi.js` (nel commento in testa e nel confronto finale), non un parametro. Il README non lo dice. Anche `leggi` toglie dall'oggetto un nome di persona e una ragione sociale scritti nel codice.
- In `leggi`, i messaggi senza una data leggibile si tengono sempre (`!m.d || m.d >= da`), mentre il README dice che tiene «i messaggi dalla data `opz.da` in poi».
- L'elenco degli allegati che si citano solo per nome è incompleto: il codice ci mette anche `.gif`, `.heic`, `.rar` e `PastedGraphic…`.
- `__posta.lista()` è sincrona, ma «Verification» la chiama con `await`. Funziona lo stesso, però non corrisponde all'Interface, dove non è indicata come async.

## supabase/README.md

Nessuna deriva trovata.

## supabase/functions/README.md

- Le risposte sono date come `{ testo, troncato }` o `{ errore }`. Con il compito `stato` però la funzione risponde `{ pronto, modello }`. Manca anche che l'errore `anthropic` ha in più il campo `stato`.

## supabase/functions/claude/README.md

- Il README mette `CLAUDE.FUNZIONE`, `CLAUDE.MODELLO` e `CLAUDE.PARAMS` «in `index.html`». Dalla fase A però la costante si modifica in `src/js/068-v9-22-10-claude-dal-server.js`: `index.html` è generato e non si modifica a mano, quindi il riferimento porta al file sbagliato per tenere allineati i parametri.

## docs/PIANO_RIORDINO.md (sezioni «Fase A» e «Lo script di build»)

- Il blocco di codice di «Lo script di build» non è più `build.js`. Unisce i file con `join('\n')`, mentre `build.js` usa `join('')`, e il testo dice ancora «concatena i file con un a-capo tra l'uno e l'altro». Non controlla le voci ripetute in `ordine.txt` (in `build.js` sono un errore con codice 2) e non avvisa per i file di `src/` non elencati. Conta le righe come `split('\n').length`, `build.js` come `length - 1`. La nota della Fase A cita l'a-capo, l'avviso e lo staging, ma non il controllo delle voci ripetute.
- Il nome d'esempio della Fase A, `090-v26-il-metodo-di-leo.js`, non c'è: il file vero è `090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js`. La regola dei nomi della bozza tiene la data nello slug e lo taglia a 40 caratteri.
- La regola di taglio della Fase A («a ogni commento di versione (`// vNN ·` …)») non torna con il taglio fatto. Si taglia su `^// v\d+(\.\d+)?\b` anche senza `·`, e in più su `^// ║ PARTE 2` (il file `001-parte-2-interfaccia.js`).
- La Fase A è segnata «✅ fatta il 19/11/2026», ma niente è committato (vedi la prima sezione). La sua «Verifica» (`git diff --exit-code index.html`) non tiene conto che `src/` e `build.js` non sono ancora in git.
