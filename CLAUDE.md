# CICLI APERTI — CLAUDE.md

App single-file HTML per gestione cicli aperti (impegni/task) con metodologia OSM.
Deploy su GitHub Pages: https://maci81x.github.io/cicli-aperti/

## Redesign v2 (2026-10-13)

`index.html` è la versione nuova; `index.legacy.html` è quella di prima, raggiungibile da Altro → Versione precedente.
Riferimenti: `DESIGN_SYSTEM.md` (token, componenti, mappa del linguaggio), `design-preview.html`, `NOTE_LOGICA.md` (ogni funzione e dove è finita).

### Architettura: 3 modalità + Altro

| Sezione | Cosa c'è |
|---|---|
| **Oggi** (apertura) | data, «N di M fatte», Appuntamenti (Google Calendar, sola lettura), Routine, Mattina / Pomeriggio / Sera, «In scadenza» |
| **Pianifica** | Settimana (chip dei giorni su telefono, colonne Lun–Ven su desktop) · Mese (puntini per tipo, tap → quel giorno) · Agenda (giorni × momenti, drag & drop su desktop). In fondo: Senza data, Riepilogo, Stampa la settimana, Chiudi la settimana |
| **Tutto** (titolo «Cose aperte») | ricerca, Filtri (tipo, categoria, area, + Nuova categoria), Lista / Matrice / Persone, «Raggruppa per», In attesa |
| **Altro** | Tema, Fatte, Guida, Importa da una registrazione, Impostazioni (Google Calendar, categorie, persone, Assegna Macro Aree, chiave API), Versione precedente |

Telefono: barra in basso Oggi · Pianifica · [+] · Tutto · Altro. Desktop (≥ 768px): barra laterale stretta + intestazione con Lavoro/Personale, ricerca, tema, Google Calendar, Aggiungi.

Il file ha un solo `<script>` in due parti: **Parte 1 — Logica** (codice di prima, invariato) e **Parte 2 — Interfaccia v2**. Lo stato dell'interfaccia sta in `ui`; `render()` ridisegna la vista corrente; i click passano da un solo ascoltatore (`data-act` → `AZIONI`).

### Mappa del linguaggio

Subito / Importante / Delega / Lascia stare (Q1–Q4 nel suggerimento) · Cose aperte (cicli) · Tutto (armadio) · Piano della settimana (Battle Plan) · Prepara la settimana (wizard) · Chiudi la settimana (review) · In attesa (parcheggio) · Routine (rituali) · Agenda (giorni × momenti) · Senza data (da pianificare) · Fatte (storico) · Domani (posticipa). «Calendario» si usa solo per Google Calendar. Niente emoji nell'interfaccia: icone Tabler.

### Azioni rapide su ogni riga

Swipe a sinistra su telefono, «···» su desktop; lo swipe a destra fa «Fatto». Ogni azione mostra un toast con «Annulla» per 5 secondi.

| Azione | Funzione | Cosa scrive |
|---|---|---|
| Fatto | `azioneFatto` | chiude; routine di ogni giorno → `rituali_completati`; se si ripete → `chiudiERicrea` (chiude e crea la prossima a +1 passo, scadenza compresa) |
| Domani | `azioneDomani` | `agenda_override` del giorno dopo, stesso momento; se non si ripete sposta anche `pianificato_data`; aggiorna la riga del piano |
| Scegli quando | `azioneQuando` | apre il modale Pianifica (`confermaPianificazione`) |
| Ripeti | `apriRipeti` / `salvaRipeti` | Giornaliera / Settimanale / Mensile / Trimestrale / Annuale |
| Lascia stare | `azioneLascia` | `q = 4` + `parcheggiato = true`; da In attesa: «Elimina definitivamente» |

**Annuale**: salvata come `ricorrenza = 'annuale'` e `pianificato_ripetizione = 'nessuna'` (il CHECK del database non ammette ancora `annuale`). Leggere sempre con `ripetizioneDi(c)`, mai dal campo diretto.

### Chiudi la settimana

Due passi. Per ogni cosa non fatta: Domani / Prossima settimana (predefinita) / Tra 2 settimane / Scegli data / Rimetti in Cose aperte / Lascia stare. Poi «N su M», una nota, «Metti il piano su Google Calendar» (`mettiPianoSuCalendar`), e si apre la preparazione della settimana dopo con le cose spostate già scelte.

### Aiuto della schermata («?»)

Accanto al titolo di Oggi, Pianifica, Tutto, In attesa e Fatte c'è `btnAiuto(k)`. I testi stanno in `AIUTI`; il «?» mostra l'aiuto della sotto-vista aperta (`chiaveAiuto`: Mese, Agenda, Matrice, Persone hanno il loro). Telefono: foglio `#aiutoOverlay`; desktop: riquadro `#aiutoPop`. La Guida si apre con «Come funziona in 1 minuto», che riusa gli stessi testi.

### Riconciliazione con Google Calendar

`riconciliaCalendar()` parte all'avvio se Calendar è collegato, al massimo una volta ogni 6 ore (`localStorage cal_recon_last`).

1. `eventiPassatiCalendar()` legge gli eventi degli ultimi 14 giorni fino a ieri (calendario principale + «Cicli Aperti — Battle Plan»).
2. `reconAbbina()` cerca per ogni cosa aperta un evento. Match certo (`calendar_event_id`, etichetta «dal piano», o `google_event_id`): sempre proposto, in cima. Match per titolo (`titoliUguali`, su `normTitolo`): `dice` sui bigrammi ≥ 0.8, oppure inclusione a parole intere solo se il titolo dell'evento (e il pezzo contenuto) ha almeno 3 parole e 12 caratteri. Un evento di una parola non aggancia mai per inclusione. Al massimo 10 righe per foglio: le altre tornano alla prossima apertura.
3. Se trova qualcosa, in Oggi si apre il foglio «Trovate sul calendario» (`#reconOverlay`): [Fatta] = `azioneFatto` (ricorrenza compresa), [Non ancora] = l'evento finisce in `localStorage cal_recon_ignored` come `{ id, t }` e non viene più chiesto, nemmeno se torna con un titolo simile (`reconEventoIgnorato`). «Chiedimelo dopo» azzera `cal_recon_last`.

Non chiude mai niente da sola. `cicli.calendar_event_id` (migration applicata) viene scritto da `mettiPianoSuCalendar`.

### Piano di qualsiasi settimana (2026-10-15)

- **Wizard**: nell'intestazione `‹ Settimana 42 · 12/10–18/10 ›` (`bpwDisegnaSettimana`, `bpwCambiaSettimana`): cambiare settimana riapre il wizard per quella (pre-spunte comprese); non si va prima della settimana corrente. Titolo da `bpwFrase()`: «questa settimana» / «la prossima settimana» / «la settimana del 26/10».
- **Modalità modifica** (`bpwModifica()` = la settimana ha un piano `attivo` o `bozza`): titolo «Modifica il piano di…», passo 1 con il gruppo «Già nel piano» in cima (`_bpwNelPiano`), passo 2 con i giorni già assegnati, bottone «Salva il piano». Il salvataggio è sempre `bpAttiva()` (upsert degli item, elimina i deselezionati, stato → `attivo`).
- `apriWizard(week, year)`: senza argomenti usa la settimana in vista in Pianifica (in Oggi quella corrente). `etichettaWizard()` dà «Prepara la settimana» o «Modifica il piano».
- Gli appuntamenti Google Calendar della settimana del wizard si caricano con `bpwConEventi()` e finiscono nel carico per giorno (passo 2) e in «Appuntamenti in calendario» nel riepilogo (passo 1).
- **Pianifica → Settimana**: in cima `cardPiano()` (N cose · tempo previsto · fatte N/M · barra · «Modifica il piano»), matita in alto a destra se il piano si può modificare. Settimana chiusa: «Settimana chiusa», nota della chiusura, righe in sola lettura (`riga(..., { solaLettura })`). Settimana futura senza piano: «Nessun piano» + «Prepara la settimana».
- Righe di un giorno passato non fatte: puntino `--q1` + «in ritardo» (`riga(..., { passato })`, opzioni da `opzRighe(d)`).
- **Altro → Fatte → Settimane** (`ui.fatte`, `caricaSettimane`, `fatteSettimane`): piani passati o chiusi con fatte/totali e %; tap → `vaiASettimana(w, y)`.

### Rimaste indietro (2026-10-15)

`caricaRimaste()` legge gli item non completati dei piani `attivo`/`bozza` delle ultime 4 settimane (`CARRY.SETTIMANE`) con giorno prima di oggi (o senza giorno, se la settimana è finita). Parte all'avvio, all'apertura di Oggi, dopo il wizard e con il pull-to-refresh. `rimasteVisibili()` scarta le cose fatte, in attesa, routine o dell'altro contesto.

`bloccoRimaste()` è un blocco in pagina in cima a Oggi e in Pianifica → Settimana (solo settimana corrente). Ogni riga: spunta (= `azioneFatto`), «era lunedì 13», chip [Oggi] [Domani] [Scegli giorno] [Lascia stare]. Scegli giorno = L–D della settimana corrente (i giorni passati sono spenti) + «Prossima settimana».

- `carrySposta(rec, { data }, cache)`: sposta l'item nel piano della settimana di destinazione (`pianoPer` lo crea in **bozza** se manca; se la cosa c'è già in quel piano aggiorna quella riga e cancella la vecchia), poi scrive l'agenda come «Domani» (`pianificaInData` o, se si ripete, solo `upsertOverride`). Senza `data` = prossima settimana, giorno `settimana`, `pianificato_data` al lunedì. Restituisce la funzione di annullamento.
- Lascia stare: `q = 4` + `parcheggiato`, item tolto dal piano.
- «Porta tutte a oggi» (`carryTutteAOggi`): un toast con Annulla che rimette ogni riga com'era e cancella i piani creati in bozza nel giro.
- X «Chiudi per oggi»: `localStorage carry_dismissed = YYYY-MM-DD`, il blocco torna domani; le righe restano nel piano col giorno vecchio.

### Chip dei giorni

`chipGiorni(act, id, attivo)` disegna L M M G V S D + «Sett.» (in settimana, senza giorno).

- **Prepara la settimana, passo 2** (`bpwChipGiorni`): ogni cosa scelta ha i suoi chip, con ora/momento/durata sotto; in alto il carico di ogni giorno (cose + appuntamenti Calendar). Su desktop restano in più le colonne per trascinare; su telefono solo i chip.
- **Dettaglio, sezione Pianificazione** (`disegnaPianificazione`, `impostaGiorno`): cambia il giorno nella settimana selezionata. «Sett.» è attivo solo se c'è un piano della settimana.

### PWA

`manifest.json` + `icons/icon-192.png`, `icons/icon-512.png` (dal logo) + meta `apple-mobile-web-app-*`.

### localStorage in più

`cicli_tab`, `cicli_onboarded` (introduzione già vista), `cicli_raggruppa`, `carry_dismissed` (Rimaste indietro chiuso per oggi). `cicli_theme` vuoto = segue il tema del sistema.

### Per modificare la v2

- CSS: solo token di `DESIGN_SYSTEM.md`, niente colori scritti a mano; area di tocco ≥ 44px.
- Una vista nuova = una funzione `vistaX()` che restituisce HTML + una voce in `disegna()`.
- Le funzioni della Parte 1 mostrano i loro toast: se le chiami da un'azione v2 usa `inSilenzio(...)` e dai tu il messaggio.
- Le sezioni qui sotto descrivono il modello dati e la logica, che non sono cambiati; i nomi delle viste e i gesti sono quelli della versione precedente.

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
- **Non toccare index.legacy.html**: è la versione precedente, resta com'è
- **Mantieni le feature esistenti**: matrice Eisenhower, Plaud import, dark/light mode, categorie custom, persone, storico, guida, keyboard shortcuts
- **Supabase**: usa `apply_migration` per DDL, non eseguire SQL diretto
- **CSS**: mobile-first, breakpoint a 768px
- **JS**: vanilla, no framework, immutable updates
