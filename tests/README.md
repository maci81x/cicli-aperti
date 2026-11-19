# Test di Cicli Aperti

L'app vera (`../index.html`) in Chromium con Supabase e Google Calendar finti, tutto in memoria.

```
cd tests && npm i playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0 axe-core pngjs@7.0.0 pixelmatch@5.3.0
npx playwright install chromium
mkdir -p /tmp/prove
for f in smoke.js t*.js; do NM="$PWD/node_modules" OUT=/tmp/prove node "$f" > "/tmp/prove/${f%.js}.log" 2>&1; echo "$f exit=$? FAIL=$(grep -c '^FAIL' /tmp/prove/${f%.js}.log)"; done
```

Una prova **passa solo se esce con 0 e non ha righe `FAIL`**. Installare sempre tutti i pacchetti nello stesso comando: `npm i --no-save` toglie quelli non elencati.

## Rete di sicurezza del riordino

- `t51-globali.js` — l'elenco ordinato dei nomi globali dopo l'avvio (proprietà aggiunte a `window` + dichiarazioni di livello alto dello script, con il loro `typeof`) deve coincidere con `riferimento/globali.json` (preso dalla v50).
- `t52-golden.js` — con dati e ora fissi: l'HTML di `#view` per Oggi, Pianifica › Settimana e › Giorno, Tutto › Lista e › Matrice, Un giorno, Altro, e quello del foglio Smaltisci, su telefono e computer, deve coincidere con `riferimento/golden/`; 16 schermate (Oggi, Pianifica, Smaltisci, Tutto › Matrice × telefono/computer × chiaro/scuro) confrontate con `riferimento/schermate/`: al massimo lo 0,1% di pixel diversi, altrimenti l'immagine delle differenze va in `$OUT/diff_*.png`. Le schermate dipendono dalla macchina (riferimento preso su questo Mac).
- `t53-caratterizza.js` — caratterizzazione prima della fase D: l'HTML dell'anteprima del «+» (computer) e del campo «Cosa hai in testa?» (telefono) mentre si scrive, e le righe che il campo salva (campi stabili), confrontati con `riferimento/caratterizza.json`. Copre `disegnaAnteprima`, `disegnaAnteprimaCattura` e `salvaCattura`.
- Quando un cambiamento è voluto (per esempio si toglie una funzione morta), si riscrive il riferimento con `AGGIORNA=1 node t51-globali.js` (o `t52-golden.js`) e si controlla nel diff di git che cambi solo quello che ci si aspetta.

`harness.js` esporta:

- `apriApp({ mobile, viewport, seed, events, ora, oraFinta, attesa, localStorage })` → `{ browser, context, page, logs, db, cal }`. `mobile` = iPhone 13, altrimenti `viewport` (predefinito 1280×900); `seed` = righe per tabella; `events` = eventi per calendario; `ora` = data finta (ISO); `attesa` = millisecondi dopo l'avvio (predefinito 1500); `db.tabelle` / `cal.state` per controllare le scritture. Alla fine `browser.close()`.
- `errori(logs)` → gli errori della console da far valere.
- `assertDi()` → la funzione di controllo `a(condizione, messaggio)`: stampa `ok` o `FAIL` e, al primo `FAIL`, mette `process.exitCode = 1`.

Variabili d'ambiente:

- `NM` — percorso assoluto di `node_modules`: lo usano `harness.js` (Supabase, jsPDF, font delle icone Tabler) e `t50.js` (`axe-core`; senza `NM` assoluto il controllo di accessibilità viene saltato).
- `OUT` — cartella dove le prove salvano schermate e PDF (predefinita `/tmp`).

Le prove aprono `../index.html`: dopo una modifica in `src/` lanciare prima `node build.js` dalla radice del repo.
