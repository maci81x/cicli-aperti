# CICLI APERTI — CLAUDE.md

App single-file HTML per gestione cicli aperti (impegni/task) con metodologia OSM.
Deploy su GitHub Pages: https://maci81x.github.io/cicli-aperti/

## Stack

- **Frontend**: HTML + CSS + Vanilla JS (single file `index.html`)
- **Backend**: Supabase (Postgres + Realtime)
- **AI**: Claude API (Haiku) per import Plaud e auto-categorizzazione
- **Calendar**: Google Calendar API (GIS token model)

## Supabase

- **Project ID**: `qujxbvootvollmziaqrd`
- **URL**: `https://qujxbvootvollmziaqrd.supabase.co`
- **Region**: eu-west-1
- **Org**: upzdzdiqnllyvvimlrvy
- **Anon key**: in `SUPABASE_ANON` const nel file HTML

### Tabelle

| Tabella | Descrizione | RLS |
|---------|-------------|-----|
| `cicli` | Task/impegni principali | Aperto (anon) |
| `persone` | Rubrica persone | Aperto |
| `categorie` | Categorie personalizzabili | RLS con policy pubblica |
| `assegnazioni` | Assegnazioni ciclo→persona con ruolo | Disabilitato |
| `macro_aree` | 9 macro aree fisse SSI | Disabilitato |
| `user_tokens` | Token OAuth Google | Disabilitato |
| `agenda_override` | Spostamenti agenda validi per 1 sola settimana | RLS con policy anon |

### Schema cicli (colonne rilevanti)

```sql
id uuid PK, title text, note text, cat text, due_date date,
week int, year int, q int(1-4), ctx lavoro|personale,
done bool, da_plaud bool, persone_menzionate text[],
scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
scheduled_time time, scheduled_end timestamp,
execution_status text DEFAULT 'planned',  -- planned|in_progress|done|postponed
google_event_id text,
macro_area text,                          -- 9 macro aree SSI
giorno_settimana text,                    -- lunedi..domenica (giorno preferito agenda)
fascia_oraria text,                       -- mattina|pomeriggio|sera
settimana_anno text,                      -- es. 2025-W26
sync_status text DEFAULT 'pending',       -- pending|synced|failed
created_at, updated_at
```

### Schema assegnazioni

```sql
id serial PK, ciclo_id uuid FK cicli, persona_id uuid FK persone,
ruolo text DEFAULT 'esecutore_principale', created_at timestamp
```

### Schema agenda_override

```sql
id uuid PK, ciclo_id uuid FK cicli ON DELETE CASCADE,
settimana int NOT NULL, anno int NOT NULL,
giorno_settimana text NOT NULL, fascia_oraria text NOT NULL,
created_at timestamptz,
UNIQUE(ciclo_id, settimana, anno)
```

Un override vale **solo per la settimana indicata**: la settimana successiva
il ciclo torna al `giorno_settimana`/`fascia_oraria` definiti sul ciclo stesso.

### Schema user_tokens

```sql
id serial PK, user_email text UNIQUE,
google_access_token text, google_refresh_token text,
google_calendar_id text, expires_at timestamp
```

### Realtime

Attivo su: `cicli`, `persone`, `categorie`

## Google Calendar OAuth

- **Client ID**: `257619503185-gqh4iv9f8rkq6uhe9ihlfb394pq1p681.apps.googleusercontent.com`
- **Scope**: `https://www.googleapis.com/auth/calendar`
- **Redirect URI**: `https://maci81x.github.io/cicli-aperti/`
- **Account test**: `r.macinai@sisoluzioniimpresa.it`
- **Libreria**: Google Identity Services (GIS) token model (popup, no redirect)
- **Calendario**: `Cicli Aperti — Battle Plan` (auto-creato)
- **Token storage**: localStorage + Supabase `user_tokens`

### Flusso sync Calendar

1. `connectGoogleCalendar()` → GIS popup → `_handleGcalToken()`
2. `ensureGcalCalendar()` → cerca o crea calendario dedicato
3. `syncCicloToGcal(ciclo)` → POST/PATCH/DELETE su Calendar API
4. `retryFailedSyncs()` → ogni 5 min ritenta `sync_status='failed'`
5. Ciclo done → `[DONE]` nel titolo evento → eliminazione evento

## Struttura JS (sezioni principali)

```
CONFIG → INIT SUPABASE → STATE → UTILS → SUPABASE CRUD →
REALTIME → NAVIGATION → RENDER → SEARCH → SIDEBAR →
CARD BUILDER → CATEGORIE → PERSONA CHIPS → MODAL →
PLAUD IMPORT → API KEY → TOAST → THEME → TOOLTIP → GUIDA →
SKELETON → KEYBOARD → AVVIO →
[BATTLE PLAN] GOOGLE CALENDAR → AUTO-CAT → VISTE (OGGI/SETTIMANA/MESE/AREE) →
MOBILE CARD SWIPE → POSTPONE → PULL-TO-REFRESH → BATCH MIGRATE →
DRAWER → COMPACT CARD → MATRIX MOBILE → VISTA AGENDA
```

## Macro Aree (9 fisse SSI)

`Management`, `Marketing`, `Vendite`, `Amministrazione`, `Produzione`, `HR`, `R&D`, `Personale`, `Da Delegare`

Auto-assegnate via Claude Haiku alla creazione di ogni ciclo di tipo `lavoro`.

## Viste disponibili

| Vista | Descrizione | Mobile nav |
|-------|-------------|------------|
| Oggi | Cicli con scheduled_date = oggi, card mobili | ☀️ |
| Settimana | Cicli per giorno nella settimana corrente | 📅 |
| Mese | Grid mensile con dot per macro area | 🗓 |
| Matrice | Eisenhower 4 quadranti | 🔲 |
| Aree | Grid 9 macro aree × cicli settimana | 🏢 |
| Lista | Lista ordinata per priorità (desktop) | — |
| Persone | Cicli raggruppati per persona | — |
| Storico | Cicli completati e passati | — |
| Guida | Documentazione OSM | — |
| Agenda | Griglia 7 giorni × 3 fasce, drag & drop override settimanali | 📆 |

## Mobile redesign v2 (2026-06-29)

- Header mobile: 56px, solo logo + hamburger ≡
- **Drawer** (`#drawer`): slide-in 250ms sinistra (80vw) con contesto, settimana nav, viste, GCal, strumenti, impostazioni
- Nav mobile: **4 tab** — ☀️ Oggi | 📅 Settimana | 🔲 Matrice | 📆 Agenda (Mese/Aree/Persone nel drawer)
- **Compact card** (`makeCompactCard`): 48px altezza, riga [dot Q][titolo][area pill][orario], tap=expand inline, swipe threshold 60px
- **Matrix mobile**: 2×2 grid compact boxes (`renderMatrixMobile`), tap box=espandi full-width
- **Modal semplificato**: Contesto+Titolo+DataPianificata sempre visibili; "Più opzioni ▼" collassa il resto (solo mobile; desktop mostra tutto)
- **Cache-Control**: meta tags no-cache su header HTML

## Gesti mobile

- **Swipe destra >60px** → completato (verde, animazione out) — compact card row
- **Swipe sinistra >60px** → posticipa +1g diretto (compact card) o apre modal
- **Tap compact card** → espande inline (note + azioni: Fatto / +1g / Modifica)
- **Long press 600ms** → apre modal modifica completa
- **Pull-to-refresh** → ricarica dati da Supabase

## localStorage keys

```
cicli_claude_key   — Claude API key
cicli_ctx          — contesto attivo (lavoro|personale)
cicli_view         — vista corrente
cicli_week         — settimana selezionata
cicli_cat_filter   — filtro categoria
cicli_theme        — tema (dark|light)
cicli_agenda_sub   — sotto-vista agenda (pianificati|dapianificare)
gcal_token         — Google access token
gcal_expires       — timestamp scadenza token
gcal_cal_id        — ID calendario Google Calendar
gcal_email         — email account Google
```

## Vista Agenda (2026-08-25)

Due sotto-viste (toggle in header, persistito in `cicli_agenda_sub`):

- **📅 Pianificati** — griglia 7 colonne (Lun→Dom) × sezioni 🌅 Mattina / ☀️ Pomeriggio /
  🌙 Sera. Una quarta sezione "Non specificato" appare in cima al giorno solo se
  contiene cicli con `fascia_oraria` null. Ogni sezione fascia è drop-zone.
- **📥 Da pianificare** — cicli aperti senza `giorno_settimana`, raggruppati per
  quadrante Q1→Q4. Pulsante "Pianifica" apre un mini dropdown che scrive
  direttamente su `cicli` (assegnazione permanente, non override).

Risoluzione posizione di un ciclo (`agendaSlotFor`):
1. override in `agenda_override` per (ciclo_id, settimana, anno) → vince
2. altrimenti `cicli.giorno_settimana` / `cicli.fascia_oraria`

Drag & drop → upsert su `agenda_override` con `onConflict: 'ciclo_id,settimana,anno'`.
Il selettore settimana in header è attivo in questa vista e ricarica gli override.

**Degradazione**: `state.agendaColsOk` / `state.agendaTableOk` rilevano se la
migration è applicata; se no, i campi del modale sono nascosti, il payload di
`saveCiclo` non include le nuove colonne e il drag & drop è disabilitato.

Migration: `supabase_migration_agenda.sql`.

## Regole per Claude Code

- **Non riscrivere index.html da zero** — usa Edit per modifiche chirurgiche
- **Mantieni le feature esistenti**: matrice Eisenhower, Plaud import, dark/light mode, categorie custom, persone, storico, guida, keyboard shortcuts
- **Supabase**: usa `apply_migration` per DDL, non eseguire SQL diretto
- **CSS**: mobile-first, breakpoint a 768px
- **JS**: vanilla, no framework, immutable updates
