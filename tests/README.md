# Test di Cicli Aperti

L'app vera (`../index.html`) in Chromium con Supabase e Google Calendar finti, tutto in memoria.

```
cd tests && npm i playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0 axe-core
npx playwright install chromium
mkdir -p /tmp/prove
for f in smoke.js t*.js; do NM="$PWD/node_modules" OUT=/tmp/prove node "$f" > "/tmp/prove/${f%.js}.log" 2>&1; echo "$f exit=$? FAIL=$(grep -c '^FAIL' /tmp/prove/${f%.js}.log)"; done
```

Una prova **passa solo se esce con 0 e non ha righe `FAIL`**.

`harness.js` esporta:

- `apriApp({ mobile, viewport, seed, events, ora, oraFinta, attesa, localStorage })` → `{ browser, context, page, logs, db, cal }`. `mobile` = iPhone 13, altrimenti `viewport` (predefinito 1280×900); `seed` = righe per tabella; `events` = eventi per calendario; `ora` = data finta (ISO); `attesa` = millisecondi dopo l'avvio (predefinito 1500); `db.tabelle` / `cal.state` per controllare le scritture. Alla fine `browser.close()`.
- `errori(logs)` → gli errori della console da far valere.
- `assertDi()` → la funzione di controllo `a(condizione, messaggio)`: stampa `ok` o `FAIL` e, al primo `FAIL`, mette `process.exitCode = 1`.

Variabili d'ambiente:

- `NM` — percorso assoluto di `node_modules`: lo usano `harness.js` (Supabase, jsPDF, font delle icone Tabler) e `t50.js` (`axe-core`; senza `NM` assoluto il controllo di accessibilità viene saltato).
- `OUT` — cartella dove le prove salvano schermate e PDF (predefinita `/tmp`).

Le prove aprono `../index.html`: dopo una modifica in `src/` lanciare prima `node build.js` dalla radice del repo.
