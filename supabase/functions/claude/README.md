# claude (Edge Function)

## Overview

Edge Function Supabase (Deno) che fa da intermediario tra l'app e l'API Anthropic, così la chiave `ANTHROPIC_API_KEY` resta sul server e non nel browser. L'app la chiama su `SUPABASE_URL + '/functions/v1/claude'` (costante `CLAUDE.FUNZIONE` in `src/js/cattura/068-v9-22-10-claude-dal-server.js`, da cui `build.js` genera `index.html`) per due compiti: l'import grezzo delle riunioni Plaud (`riunione`) e l'assegnazione automatica dell'area (`area`). Un terzo compito, `stato`, dice solo se il segreto è configurato.

## Interface

- `index.ts:Deno.serve` — unico handler HTTP.
  - `OPTIONS` → `200 "ok"` con le intestazioni CORS.
  - Metodi diversi da `POST` → `405 { errore: "metodo" }`.
  - `POST` con corpo JSON `{ compito, testo }`:
    - `compito = "stato"` → `200 { pronto: boolean, modello }` (non chiama Claude).
    - `compito = "riunione"` | `"area"` → `200 { testo, troncato }`; `troncato` è `true` quando `stop_reason === "max_tokens"`.
  - Errori (campo `errore` nel corpo): `403 "utente"`, `400 "json"`, `400 "compito"`, `400 "testo"`, `503 "manca_segreto"`, `422 "rifiuto"`, `502 "anthropic"` (con `stato` = status HTTP di Anthropic o `null`), `500 "interno"`.
- `index.ts:COMPITI` — tabella dei compiti ammessi con limite di testo e parametri del modello:
  - `riunione`: `maxTesto: 200_000`, `max_tokens: 16000`, `output_config.effort: "low"`.
  - `area`: `maxTesto: 4_000`, `max_tokens: 256`, `thinking: { type: "disabled" }`, `output_config.effort: "low"`.
- `index.ts:utenteAmmesso(req)` — verifica il token `Bearer` con `supabase.auth.getUser` e confronta l'email con `EMAIL_AMMESSA`.
- `index.ts:intestazioni(req)` / `index.ts:risposta(req, stato, corpo)` — intestazioni CORS + JSON e costruzione della risposta.
- Costanti: `EMAIL_AMMESSA`, `MODELLO` (`"claude-haiku-5-5"`), `ORIGINI` (`https://maci81x.github.io`, `http://localhost:8765`).
- Dipendenze: `npm:@anthropic-ai/sdk@1.1.0`, `npm:@supabase/supabase-js@2.118.0`.

## Invariants

- Solo l'utente con email `EMAIL_AMMESSA` (confronto in minuscolo) passa `utenteAmmesso`; tutti gli altri ricevono `403` prima che il corpo venga letto (`index.ts:utenteAmmesso`). Il commento in testa dichiara anche `verify_jwt` attivo: è un'impostazione del deploy, non presente in questo repository.
- Sono accettati solo i compiti in `COMPITI` più `stato`; qualsiasi altro valore dà `400 "compito"` (`index.ts:COMPITI`).
- `testo` viene ripulito con `trim()` e deve essere non vuoto e lungo al massimo `maxTesto` del compito (`index.ts:Deno.serve`).
- `Access-Control-Allow-Origin` riflette l'origine della richiesta solo se è in `ORIGINI`, altrimenti vale `ORIGINI[0]` (`index.ts:intestazioni`).
- `MODELLO` e i parametri di `COMPITI` devono restare allineati con `CLAUDE.MODELLO` e `CLAUDE.PARAMS` in `src/js/cattura/068-v9-22-10-claude-dal-server.js` (non in `index.html`, che è generato), che li usa per la chiamata di riserva con la chiave del browser.
- Il messaggio inviato al modello è un solo turno `user` con `testo`; la risposta restituita è la concatenazione dei soli blocchi `text`.

## Side Effects

- Legge le variabili d'ambiente `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `ANTHROPIC_API_KEY` (`Deno.env.get`).
- Chiamata di rete a Supabase Auth (`sb.auth.getUser`) a ogni richiesta `POST`.
- Chiamata di rete all'API Anthropic (`client.messages.create`) per i compiti `riunione` e `area`; consuma crediti dell'account Anthropic.
- Scrive nei log della funzione con `console.error` (`"anthropic"` con status e messaggio, oppure `"claude"` con l'eccezione).
- Nessuna scrittura su database o storage.

## Verification

- Run: `cd tests && node smoke.js` (vedi `tests/README.md`). Nei test l'app è servita con Supabase finto e `tests/harness.js` risponde `500` a ogni richiesta `/functions/`, quindi questa funzione non viene eseguita: va provata dopo il deploy, con il compito `stato`.
