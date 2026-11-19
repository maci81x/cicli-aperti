# Cicli Aperti — Roby

Gestione visuale dei cicli aperti (impegni, promesse, task) con Matrice Eisenhower, sincronizzazione Supabase e import da Plaud.

## System Overview

L'app pubblicata è un solo file, `index.html` (HTML + CSS + JavaScript senza framework), servito da GitHub Pages su https://maci81x.github.io/cicli-aperti/. Dal riordino (fasi A e B, 19/11/2026) `index.html` non si modifica a mano: lo genera `node build.js` mettendo in fila i sorgenti di `src/` (cartelle per area) nell'ordine di `src/ordine.txt`. Nel browser l'app parla con Supabase (database Postgres, Realtime, accesso con codice personale) e con Google Calendar (GIS, token nel browser). Le chiamate a Claude passano da una Edge Function Supabase che tiene la chiave sul server.

Il codice è cresciuto a strati (v1…v50): ogni versione ha aggiunto JS in fondo allo script e CSS in fondo allo stile, «avvolgendo» funzioni esistenti. La mappa degli strati è in [docs/MAPPA.md](./docs/MAPPA.md), il piano per dividere il file in sorgenti per area in [docs/PIANO_RIORDINO.md](./docs/PIANO_RIORDINO.md).

## Local Interface & Invariants

- `index.html` — il file pubblicato, **generato** da `build.js` (identico byte per byte a quello che uscirebbe da `src/`). `VERSIONE_APP` dice la versione; `state` tiene i dati, `ui` lo stato dell'interfaccia; `render()` ridisegna la vista; i click passano da un solo ascoltatore (`data-act` → `AZIONI`). L'ordine del codice conta: 301 riassegnazioni di funzioni e 154 ascoltatori registrati al caricamento (vedi la mappa).
- `build.js` — `node build.js` riscrive `index.html` da `src/`; `node build.js --check` esce con 1 se non corrisponde, con 2 per un errore in `src/ordine.txt`; avvisa se un file di `src/` non è elencato. L'hook `tools/hooks/pre-commit` (attivo con `git config core.hooksPath tools/hooks`) rifiuta i commit non allineati.
- `index.legacy.html` — rimanda a `./`, non va rimessa la versione vecchia.
- `manifest.json` + `icons/` — PWA (icone 192 e 512).
- `supabase_migration*.sql` — le migration del database, da applicare a mano (`apply_migration`). Tabelle create dalle migration del repo: `cicli`, `persone`, `categorie`, `agenda_override`, `rituali_completati`, `battle_plan`, `battle_plan_items`, `esercizi_q2`, `macro_aree`, `eventi_fatti`, `eventi_nascosti` (più `posta_thread` e `posta_scansioni`, create da `supabase_migration_togli.sql` ma non usate dall'app come tabelle). L'app usa anche tabelle create fuori da queste migration: `user_tokens`, `assegnazioni`, `eventi_tipo`, `prep_appuntamenti`, `cal_scelte`, `mete`, `non_doppioni`, `obiettivi_settimana`, `eventi_fissi`.
  - `supabase_migration_privacy.sql` mette la policy `solo_proprietario` sulle tabelle dell'app; `supabase_migration_privacy_rollback.sql` la toglie e rimette le policy aperte di prima: non va lanciata senza motivo.
  - `supabase_migration_itime_b.sql` modifica dati esistenti (aree), le altre aggiungono colonne o tabelle.
  - L'app controlla all'avvio se le colonne ci sono (`rilevaColonneV3/V4/V5`) e spegne le funzioni che ne dipendono.

## Subdirectories & System Boundaries

- src: [./src/README.md](./src/README.md) - i sorgenti di `index.html`: `testa.html`, `corpo.html`, `coda.html`, `css/<area>/` (47 file) e `js/<area>/` (167 file) per le aree core, oggi, pianifica, smaltisci, calendario, posta, stampa, cattura, altro; `ordine.txt` dà l'ordine di esecuzione (storico).
- supabase: [./supabase/README.md](./supabase/README.md) - le Edge Function (oggi solo `claude`, proxy verso l'API Anthropic per l'unico utente ammesso).
- tools: [./tools/README.md](./tools/README.md) - strumenti di sviluppo fuori dall'app: `hooks` (pre-commit che controlla `index.html`), `mappa` (genera docs/MAPPA.md) e `posta` (lettura di Gmail in sola lettura da console).
- tests: [./tests/README.md](./tests/README.md) - prove Playwright: l'app vera in Chromium con Supabase e Google Calendar finti, in memoria.
- docs: [./docs/MAPPA.md](./docs/MAPPA.md), [./docs/PIANO_RIORDINO.md](./docs/PIANO_RIORDINO.md), [./docs/STATO_RIORDINO.md](./docs/STATO_RIORDINO.md) - documentazione tecnica e stato del riordino.

## Global Invariants

- Ogni tabella dell'app ha la policy `solo_proprietario`: legge e scrive solo l'utente collegato con l'email ammessa.
- La chiave Anthropic sta solo nella Edge Function (segreto `ANTHROPIC_API_KEY`); nel browser solo come riserva, se l'utente la inserisce.
- Su Google Calendar l'app scrive solo sul calendario scelto (predefinito Lavoro) e modifica o cancella da sola solo gli eventi con la proprietà privata `cicli_aperti` (`gcalFetch`). Eccezione: i comandi dati dall'utente sul foglio di un appuntamento (sposta, sposta la serie, «toglila dal calendario») passano da `gcalFetchUtente` e agiscono anche su eventi non dell'app.
- Note, decisioni, backup e titoli veri stanno in `privata/` (fuori da git). Nel codice compaiono comunque alcuni indirizzi email reali (l'utente ammesso, il coach, i dati finti dei test): il repo non va trattato come privo di dati personali.
- `index.html` è generato da `node build.js` a partire da `src/` (vedi [src/README.md](./src/README.md)); non si modifica a mano.

## Global Side Effects

- Supabase: lettura e scrittura delle tabelle sopra, Realtime su `cicli`, `persone`, `categorie`, `agenda_override`, `rituali_completati`, `battle_plan`, `battle_plan_items`, `eventi_fatti`, `cal_scelte`.
- Google Calendar API: lettura dei calendari Lavoro e Privato, scrittura di blocchi, avvisi e promemoria.
- API Anthropic tramite la Edge Function `claude` (consuma crediti).
- `localStorage` del browser: preferenze, token di Google, copie locali degli eventi.

## System Verification

- Run: `cd tests && npm i playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0 && node smoke.js` (le altre prove: `node t26.js` … `node t50.js`; t50 usa `axe-core` se installato e `NM` punta a `node_modules`).

## Come aprirla

```
open /Users/admin/Sites/cicli-aperti-roby/index.html
```

Oppure doppio clic sul file `index.html`. Funziona direttamente nel browser, senza server.

## Supabase

- **Progetto**: cicli-aperti-roby
- **URL**: https://qujxbvootvollmziaqrd.supabase.co
- Tabelle e Realtime: vedi «Local Interface & Invariants» e «Global Side Effects» qui sopra

## Import da Plaud

1. Altro → **Importa da una registrazione** (o `Cmd+P`)
2. Incolla la trascrizione o apri il file della app Plaud
3. Nel formato «RIUNIONE: … / DA FARE IO: …» la legge l'app da sola; altrimenti la legge Claude (Haiku 5.5)
4. Rivedi l'anteprima (un'attività madre e i suoi passi), togli quelli che non vuoi
5. **Importa** → salvati su Supabase

### Chiave di Claude

La chiave sta sul server: Edge Function `claude` (`supabase/functions/claude/index.ts`), segreto `ANTHROPIC_API_KEY` in Supabase → Edge Functions → Secrets. La funzione accetta solo l'utente dell'app.
Finché il segreto non c'è, l'app usa la chiave salvata nel browser (Altro → Impostazioni → Chiave API) e lo segnala in Impostazioni.

## Shortcut da tastiera

| Tasto | Azione |
|-------|--------|
| `Cmd+K` / `Ctrl+K` | Nuova cosa (campo unico «+») |
| `Cmd+P` / `Ctrl+P` | Importa da una registrazione (Plaud) |
| `Cmd+F` / `Ctrl+F` | Cerca |
| `←` / `→` | Settimana precedente/successiva (solo in Pianifica) |
| `Escape` | Chiude il foglio aperto |

## Sezioni

- **Oggi** — la giornata: Adesso, appuntamenti e cose con ora, «Oggi: N cose da chiudere», Da controllare
- **Pianifica** — Settimana, Giorno, Mese; preparazione e chiusura della settimana
- **Tutto** — le cose aperte: Lista, Matrice, Persone, filtri
- **Altro** — Fatte, Esercizio Q2, Guida, Importa, Impostazioni

Sul telefono: barra in basso con le stesse sezioni e il campo «Cosa hai in testa?»; sul computer barra laterale. Descrizione completa in `CLAUDE.md` (solo locale) e in `docs/MAPPA.md` per il codice.

## Quadranti Eisenhower

| Quadrante | Tipo | Azione |
|-----------|------|--------|
| Q1 🔥 Crisi | Urgente + Prioritario | **FA SUBITO** |
| Q2 📌 Qualità | Prioritario, non urgente | **PIANIFICA** |
| Q3 📋 Inganno | Urgente, non prioritario | **DELEGA** |
| Q4 🗑 Spreco | Non urgente, non prioritario | **ELIMINA** |

## Escalation automatica

I cicli vengono automaticamente riclassificati in base alla scadenza:
- **30 giorni** dalla scadenza → barra arancione, segnalazione
- **14 giorni** dalla scadenza → barra rossa, etichetta `⚠ CRITICO`
- Q2 con scadenza imminente → escalation automatica a Q1
- Q4 con scadenza critica → escalation automatica a Q3

## Aree e categorie

Le aree (metodo i-Time) e le loro categorie stanno nella tabella `macro_aree` e si modificano da Altro → Impostazioni → Aree: non sono più fisse nel codice. Ogni cosa è di Lavoro o Personale; i tipi (Subito, Importante, Delega, Lascia stare) hanno i loro colori.

## Mobile

Su schermo < 768px: barra in basso, fogli che salgono dal basso, gesti sulle righe (swipe per Fatto e per le azioni rapide).
