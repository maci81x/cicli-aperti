# Goldfish Annotated Review Report — Fase D

**Target:** `docs/egm/fase-d/design_draft.md` (full file), 23/11 dopo il riallineamento alla v52
**Revisori (in parallelo, review consolidata):** `egm-design`, `egm-codebase-details`, `egm-implementation-readiness`, `egm-zoom-out`, con le uscite reali di `appiattisci.js --prova` sulle sei catene.
**Status:** resolved. Roby ha chiesto di procedere fino a fine fase D senza fermarsi: le decisioni sono applicate in blocco e registrate qui.

Esito comune: nessun cambio di comportamento sulle sei catene (catture, chiamate al caricamento, `this`/`arguments`, async, alias fuori catena, `window[nome]` controllati nel codice). I rilievi riguardano lo strumento e la scrittura del piano.

| Rilievo | Revisori | Decisione | Come |
|---|---|---|---|
| Comando unico delle 32 prove assente; ordine contraddittorio con `t51` (Blocker) | readiness | PROPOSE FIX | ciclo delle prove nel piano; primo giro: unico `NO` ammesso `t51` con i soli alias attesi, poi `AGGIORNA=1` e 32/32 |
| Alias attesi non elencati; cosa fare con nomi inattesi | readiness | PROPOSE FIX | tabella con gli alias a colonna 0 e quelli nei blocchi; altrimenti `git checkout` e stop |
| Passo a mano di `disegnaAnteprima` descritto con righe di `index.html`, strato detto «v12» | readiness, codebase | PROPOSE FIX | file e righe di `src/` (066:89 e :123, 074-01:231); `--prova` dopo il passo a mano |
| Criteri del `--prova` e controllo di fine fase senza comando | readiness | PROPOSE FIX | riepilogo «base + N → forma X» su stderr da confrontare; `grep` + MAPPA rigenerata in `$T` |
| Commenti persi: quelli tra le istruzioni di uno strato e quelli sopra l'alias | codebase, design | PROPOSE FIX | il passo copia il testo dalla prima istruzione alla `}` (commenti interni compresi); commento sopra alias e strato |
| Commenti orfani e blocchi `{ }` vuoti dopo i tagli | codebase, design | PROPOSE FIX | lo strumento toglie i commenti attaccati (già copiati) e i blocchi vuoti; i commenti sciolti del blocco vanno nel passo |
| Passi senza etichetta, numeri di riga di `index.html` che scadono | zoom-out | PROPOSE FIX | indice dei passi in testa; `// ── passo k · <file>` sopra ogni passo; niente righe di `index.html` |
| `try/catch` + `console.warn`: un passo rotto non fa fallire niente | zoom-out | PROPOSE FIX | `t52` e `t54` confrontano gli avvisi in console con il riferimento (oggi zero); verificato con un avviso finto (commit `tests:` a parte) |
| Controllo «sequenza» troppo largo (chiamata dentro `?:`, `||`, frecce) | design, codebase | PROPOSE FIX | la chiamata deve essere esattamente l'espressione, l'init di `const/let` o il `return` (con `await` ammesso) |
| Nessun controllo su dove sta lo strato (dentro `if` o funzioni) | design | PROPOSE FIX | lo strumento si ferma se tra strato/alias e radice c'è altro che blocchi `{ }` |
| `_x(a, b)` in sequenza: `this`/`arguments` del passo prima | codebase | PROPOSE FIX | ammesso solo se il passo prima non li usa (oggi il caso di `riga`: la base non li usa) |
| `passoN` non confrontati con i nomi usati | design | PROPOSE FIX | controllo come per l'accumulatore |
| Rientri incoerenti, `(...arguments)` e «promessa» inutili | zoom-out | PROPOSE FIX | rientro dalla colonna d'origine; `(...arguments)` solo con parametri; nota sulla promessa solo se c'è un `async` |
| Forma annidata: si legge ancora dal fondo | zoom-out | PROPOSE FIX | detto nei Goals e nel commento della funzione |
| Numeri del Problem (file e versioni) | codebase | PROPOSE FIX | 15 file, 15 versioni |
| Semplificazioni dentro le funzioni appiattite (passi che si ripetono) | zoom-out | DECLINE (rinvio) | fuori dalla D (Non-Goal); elencate in STATO come candidate |
| Base di `disegnaAnteprima` non del tutto senza effetti (cache `_v12Voci`) | design | DECLINE | lo strato v12, che resta, fa la stessa chiamata con lo stesso input: risultato invariato; annotato |

Conteggio: PROPOSE FIX 15 · DECLINE 2 (1 rinvio) · CONTEST 0 · ESCALATE 0.
