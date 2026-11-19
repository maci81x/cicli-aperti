# Test di Cicli Aperti

L'app vera (`../index.html`) in Chromium con Supabase e Google Calendar finti, tutto in memoria.

```
cd tests && npm i playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0 axe-core
node smoke.js && node t26.js && node t26b.js
```

`harness.js` → `apriApp({ mobile, viewport, seed, events, ora, localStorage })` restituisce `{ page, db, cal, logs }`:
`seed` = righe per tabella, `events` = eventi per calendario, `ora` = data finta (ISO), `db.tabelle` / `cal.state` per controllare le scritture.

Le prove aprono `../index.html`: dopo una modifica in `src/` lanciare prima `node build.js` dalla radice del repo. `t50.js` usa `axe-core` solo se `NM` è il percorso assoluto di `node_modules` (`NM="$PWD/node_modules" node t50.js`).
