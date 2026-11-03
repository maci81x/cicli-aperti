# Test di Cicli Aperti

L'app vera (`../index.html`) in Chromium con Supabase e Google Calendar finti, tutto in memoria.

```
cd tests && npm i playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0
node smoke.js && node t26.js && node t26b.js
```

`harness.js` → `apriApp({ mobile, viewport, seed, events, ora, localStorage })` restituisce `{ page, db, cal, logs }`:
`seed` = righe per tabella, `events` = eventi per calendario, `ora` = data finta (ISO), `db.tabelle` / `cal.state` per controllare le scritture.
