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
| `categorie` | Categorie personalizzabili (id, nome, emoji, ctx, ordine — nessuna colonna colore) | RLS con policy pubblica |
| `assegnazioni` | Assegnazioni ciclo→persona con ruolo | Disabilitato |
| `macro_aree` | 9 macro aree fisse SSI | Disabilitato |
| `user_tokens` | Token OAuth Google | Disabilitato |
| `agenda_override` | Spostamenti agenda validi per 1 sola settimana | RLS con policy anon |
| `battle_plan` | Piano settimanale (una riga per settimana/anno) | RLS con policy anon |
| `battle_plan_items` | Cicli del piano con giorno, fascia, ora, durata | RLS con policy anon |

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
ricorrenza text DEFAULT 'nessuna',        -- colonna esistente, NON ancora cablata nel modale
parcheggiato boolean DEFAULT false,       -- "metti da parte": escluso dalle viste attive
parcheggiato_at timestamptz,              -- quando e stato parcheggiato (ordinamento vista)
pianificato_data date,                    -- data target calcolata dal mini-modale Pianifica
pianificato_ripetizione text DEFAULT 'nessuna', -- nessuna|settimanale|mensile|trimestrale
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

### Schema battle_plan / battle_plan_items

```sql
-- battle_plan: una riga per settimana ISO
id uuid PK, settimana int NOT NULL, anno int NOT NULL,
stato text DEFAULT 'bozza' CHECK (bozza|attivo|chiuso),
note text,                       -- note di riflessione scritte nella review
creato_at timestamptz, chiuso_at timestamptz,
UNIQUE(settimana, anno)

-- battle_plan_items: i cicli presi in carico per quella settimana
id uuid PK,
battle_plan_id uuid FK battle_plan ON DELETE CASCADE,
ciclo_id uuid FK cicli ON DELETE CASCADE,
giorno text CHECK (lunedi..domenica | settimana),   -- 'settimana' = senza giorno
fascia text CHECK (mattina|pomeriggio|sera),
ora_prevista time, durata_prevista int DEFAULT 30,
completato boolean DEFAULT false, completato_at timestamptz,
ordine int DEFAULT 0, note_item text,
UNIQUE(battle_plan_id, ciclo_id)
```

Migration: `supabase_migration_battleplan.sql`.

### Schema user_tokens

```sql
id serial PK, user_email text UNIQUE,
google_access_token text, google_refresh_token text,
google_calendar_id text, expires_at timestamp
```

### Realtime

Attivo su: `cicli`, `persone`, `categorie`, `agenda_override`, `rituali_completati`,
`battle_plan`, `battle_plan_items` (questi ultimi su canale separato `bp-changes`)

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
DRAWER → COMPACT CARD → MATRIX MOBILE → VISTA AGENDA →
MINI-MODALE PIANIFICA → RITUALI QUOTIDIANI → BATTLE PLAN
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
| Parcheggio | Cicli messi da parte, ordinati per parcheggiato_at DESC | — |
| Battle Plan | Piano settimanale: 7 giorni + colonna Settimana, progress bar, PDF | drawer |

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

## Categorie: risoluzione etichette

I cicli referenziano le categorie custom con `cat = 'custom_<id>'`. **Non mostrare
mai quello slug in UI**: usa sempre gli helper

- `catNome(cat)` → builtin da `CAT_LABELS`, custom da `state.categorie`, altrimenti
  `'Senza categoria'`. Non restituisce mai `custom_N`.
- `catIcona(cat)` → emoji builtin, emoji della categoria, altrimenti
  `CAT_FALLBACK_EMOJI` (📌).

## Modale ciclo: categorie custom (2026-08-27)

`#f-cat` contiene solo le categorie builtin nell'HTML. `renderCatOptions()` inietta
a ogni apertura le custom come `custom_<id>` nell'optgroup del contesto giusto.

`setModalCtx(ctx, keepCat)` — con `keepCat=true` (usato da `openModal`) non tocca
`#f-cat`, così riaprire un ciclo non ne sovrascrive la categoria. Senza il flag
(click sui pulsanti Lavoro/Personale) resetta al default del contesto, che è corretto
perché le categorie sono legate al contesto.

**Regressione storica**: prima di questo fix ogni salvataggio dal modale completo
riscriveva `cat` a `management`/`salute`, sia per le custom sia per le builtin.

## Parcheggio (2026-08-25)

Un ciclo `parcheggiato = true` resta nel DB ma sparisce dalle viste di
pianificazione. Il predicato unico è `isAttivo(c)` = `!c.done && !c.parcheggiato`,
usato da: matrice, lista settimana, agenda, oggi, settimana, mese, aree, persone,
ricerca e conteggi sidebar. Storico è volutamente escluso dal filtro (è l'archivio).

Un ciclo esce da **Agenda → Da pianificare** quando ha `giorno_settimana`,
oppure un `agenda_override` per la settimana corrente, oppure è parcheggiato.

Azioni: `parcheggiaCiclo(id)`, `riattivaCiclo(id)`. `assegnaGiornoCiclo()`
disparcheggia automaticamente se il ciclo era in parcheggio.

Migration: `supabase_migration_parcheggio.sql`. Degradazione via
`state.parcheggioColsOk` (nasconde il pulsante e mostra un banner nella vista).

## Mini-modale Pianifica (2026-08-27)

Sostituisce il vecchio mini-dropdown. Aperto da `openPianificaModal(id)` dalle card
di *Da pianificare* e *Parcheggio*. Tre campi: QUANDO (4 preset + data specifica),
GIORNO/FASCIA, RIPETIZIONE.

Calcolo della data: `pfDataBase()` risolve il preset, poi `pfAggiustaAlGiorno()`
sposta la data al giorno scelto **restando nella stessa settimana ISO**. Al salvataggio
scrive `pianificato_data`, `pianificato_ripetizione`, `giorno_settimana`, `fascia_oraria`,
`ricorrenza`, e fa upsert su `agenda_override` per la settimana calcolata.

### Risoluzione della posizione in agenda (`agendaSlotForWeek`)

In ordine di priorità:
1. `agenda_override` per quella (settimana, anno) → vince
2. `pianificato_data` + ripetizione → `ricadeInSettimana()` decide
3. `giorno_settimana` permanente senza `pianificato_data` → presente in ogni settimana

`ricadeInSettimana()`: `nessuna` = solo la sua settimana; `settimanale` = ogni settimana
da lì in poi; `mensile`/`trimestrale` = itera le occorrenze con `addMesi()` (che fa
clamp sui mesi corti: 31 gen +1 mese → 28 feb).

Un ciclo esce da *Da pianificare* quando `haPianificazione(c)` è vera:
`pianificato_data` **oppure** `giorno_settimana` **oppure** un override per la settimana corrente.

Migration: `supabase_migration_pianifica.sql`. Degradazione via `state.pianificaColsOk`
(nasconde la sezione RIPETIZIONE e omette le due colonne dal payload).

## Battle Plan (2026-09-04)

Piano di battaglia settimanale: unisce l'armadio dei cicli aperti e l'agenda in
un unico piano per la settimana ISO selezionata. La settimana in header è attiva
in questa vista (come in Lista e Agenda).

### Vista

Header (titolo Syne 22px, sottotitolo `Settimana XX · GG/MM – GG/MM · YYYY`,
badge stato 🟡/🟢/⚫) → progress bar (verde ≥80%, arancio ≥50%, rosso <50%) →
griglia **8 colonne**: Lun→Dom + `📋 SETT.` (cicli senza giorno specifico).
Le card sono ordinate per `ora_prevista` ASC, poi `ordine`.

Su mobile la griglia diventa una lista verticale con i giorni come accordion
(aperti di default: oggi e la colonna Settimana).

### Wizard di creazione

`openBpWizard(week, year, preselIds)` — due step in `#bpWizOverlay`:

1. **Selezione** — cicli aperti del contesto raggruppati per quadrante Q1→Q4,
   con ricerca e filtro categoria. Pre-selezionati (badge `📅 Già in agenda`) i
   cicli che `agendaSlotForWeek()` colloca in quella settimana. A destra il
   riepilogo: numero, tempo stimato (default 30 min/ciclo), warning oltre 40h.
2. **Assegnazione** — pool a sinistra + 8 drop-zone. Drag & drop su desktop,
   tap sulla card su mobile: entrambi aprono `#bpSlotPanel` (giorno, fascia, ora,
   durata). Un ciclo che ha già fascia e durata viene assegnato diretto al drop.

`bpAttiva()` fa upsert su `battle_plan` (`onConflict: 'settimana,anno'`,
stato `attivo`), elimina gli item deselezionati e fa upsert dei restanti su
`onConflict: 'battle_plan_id,ciclo_id'` — così `completato` non viene azzerato
quando si rientra nel wizard per modificare un piano già attivo.

Se non esiste un piano per la settimana corrente il wizard viene proposto
automaticamente **una sola volta per settimana per sessione** (`_bpAutoAperti`).

### Completamento

`toggleBpItem(id)` scrive `completato`/`completato_at` sull'item e:

- ciclo **una volta sola** → chiude anche il ciclo (`flipDone`)
- ciclo **ricorrente** (`pianificato_ripetizione`/`ricorrenza` ≠ `nessuna`,
  rituali giornalieri inclusi) → resta aperto, ricompare la settimana dopo

### Review di chiusura

`openBpReview()` → verdetto per fascia di completamento, per ogni ciclo non
fatto tre scelte (`sposta` default / `armadio` / `chiudi`), textarea note.
`bpChiudiSettimana()` mette il piano in `chiuso`, chiude i cicli marcati
`chiudi` e riapre il wizard sulla settimana successiva con i cicli `sposta`
pre-selezionati.

### Storico

Navigando a una settimana passata il piano è in **sola lettura**
(`bpSolaLettura()` = stato `chiuso` oppure settimana già trascorsa):
progress bar finale, note di riflessione, nessuna spunta.

### PDF

`bpStampaPdf()` usa **jsPDF 2.5.1** (CDN cdnjs, globale `window.jspdf.jsPDF`).
A4 verticale, un blocco per giorno con checkbox quadrati, titolo, ora/durata e
categoria a sinistra e righe tratteggiate per le note a destra; in fondo NOTE
GENERALI (10 righe) e il bilancio. `pdfTxt()` **rimuove le emoji**: i font
standard PDF sono WinAnsi e le renderebbero come caratteri sporchi.

### Q2 → agenda

Selezionando Q2 nel modale ciclo compare `#q2-nudge` (banner informativo, non
bloccante) con il pulsante *Pianifica in agenda ora* → `q2PianificaOra()`:
se il ciclo esiste apre il mini-modale Pianifica, altrimenti lo salva prima
(`saveCiclo()` ora restituisce la riga salvata).

**Degradazione**: `state.bpTableOk` — senza migration la vista mostra solo il
banner e il resto dell'app funziona normalmente.

## Regole per Claude Code

- **Non riscrivere index.html da zero** — usa Edit per modifiche chirurgiche
- **Mantieni le feature esistenti**: matrice Eisenhower, Plaud import, dark/light mode, categorie custom, persone, storico, guida, keyboard shortcuts
- **Supabase**: usa `apply_migration` per DDL, non eseguire SQL diretto
- **CSS**: mobile-first, breakpoint a 768px
- **JS**: vanilla, no framework, immutable updates
