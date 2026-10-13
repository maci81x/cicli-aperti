# NOTE_LOGICA — inventario della logica JavaScript di `index.html`

Inventario completo delle funzioni dello script di `index.html` (righe 1600–7128): 231 dichiarazioni `function` più le funzioni assegnate a variabile e i gestori anonimi a livello globale. Serve al redesign dell'interfaccia: ogni comportamento elencato qui deve sopravvivere.
Ordine: stato e costanti, poi una sezione per ogni blocco del sorgente nell'ordine del file (titoli = commenti di sezione del codice), infine regole di business, listener/avvio e id del DOM letti dalla logica. I numeri di riga si riferiscono a `index.html` al momento della stesura.

Legenda **Tipo**: `logica` (nessun DOM) · `dati` (Supabase, localStorage, API esterne) · `render` (costruisce HTML/DOM) · `ui` (eventi, modali, navigazione) · `misto` (logica o dati mescolati a DOM: è indicato cosa).

---

## Stato e costanti

### Oggetto `state` (riga 1681)

| Campo | Valore iniziale | Significato |
|---|---|---|
| `ctx` | localStorage `cicli_ctx` o `'lavoro'` | Contesto attivo: `lavoro` / `personale` |
| `week` | localStorage `cicli_week` o settimana ISO di oggi | Settimana selezionata (1–52: `changeWeek` non conosce la 53) |
| `year` | anno di calendario di oggi | Anno selezionato. NON è persistito e NON è l'anno ISO |
| `view` | localStorage `cicli_view` o `'matrix'` | Vista corrente: `bp, matrix, list, persone, storico, guida, oggi, settimana, mese, aree, agenda, parcheggio` |
| `filter_cat` | localStorage `cicli_cat_filter` o `null` | Filtro categoria (slug builtin o `custom_<id>`) |
| `filter_persona` | `null` | Filtro per nome persona (solo in memoria; `filterByPersona` non ha chiamanti) |
| `cicli` | `[]` | Tutte le righe di `cicli` (tutti i contesti, chiusi e parcheggiati compresi), `created_at` DESC |
| `persone` | `[]` | Righe di `persone` ordinate per `nome` |
| `categorie` | `[]` | Categorie custom ordinate per `ordine` |
| `loading` | `true` | Vero durante `loadAll` (nessuno lo legge) |
| `searchQuery` | `''` | Testo della ricerca globale; se non vuoto sostituisce qualsiasi vista |
| `personaDetailId` | `null` | Id della persona aperta in dettaglio nella vista Persone |
| `agendaSub` | localStorage `cicli_agenda_sub` o `'pianificati'` | Sotto-vista agenda: `pianificati` / `dapianificare` |
| `agendaOverrides` | `[]` | Righe di `agenda_override` della SOLA settimana selezionata |
| `agendaTableOk` | `true` | Tabella `agenda_override` raggiungibile |
| `agendaColsOk` | `true` | Colonne `giorno_settimana`/`fascia_oraria` presenti su `cicli` |
| `parcheggioColsOk` | `true` | Colonne `parcheggiato`/`parcheggiato_at` presenti |
| `pianificaColsOk` | `true` | Colonne `pianificato_data`/`pianificato_ripetizione` presenti |
| `ritualiColsOk` | `true` | Colonne `ora_inizio`/`durata_minuti` presenti |
| `ritualiTableOk` | `true` | Tabella `rituali_completati` raggiungibile |
| `ritualiCompletati` | `[]` | Righe di `rituali_completati` con `data_completamento` = oggi (al momento del caricamento) |
| `parcheggioQuery` | `''` | Testo della ricerca interna alla vista Parcheggio |
| `bp` | `null` | Riga `battle_plan` della settimana selezionata |
| `bpItems` | `[]` | Righe `battle_plan_items` del piano corrente, ordinate per `ordine` |
| `bpTableOk` | `true` | Tabella `battle_plan` raggiungibile |

### Altro stato globale (variabili `let`/`const` fuori da `state`)

| Variabile | Riga | Significato |
|---|---|---|
| `_searchDebounce` | 2311 | Timer del debounce (300 ms) della ricerca |
| `_catFormCtx`, `_catFormEmoji`, `_catEditId` | 2649–2651 | Stato del form categoria inline: contesto, emoji scelta, id in modifica (`null` = nuova) |
| `_modalPersone` | 2732 | Chip persone del modale ciclo: array di `{id, nome, colore}`. È la fonte di `persone_menzionate` al salvataggio |
| `editingId`, `selectedQ`, `modalCtx` | 2832–2834 | Stato del modale ciclo: id in modifica (`null` = nuovo), quadrante scelto (default 2), contesto scelto |
| `plaudStep`, `plaudExtracted` | 3067–3068 | Passo corrente (1–3) e array estratto da Claude nell'import Plaud |
| `_toastId` | 3273 | Contatore degli id dei toast |
| `_tipTimer` | 3315 | Timer (400 ms) di comparsa del tooltip |
| `gcal` | 3555 | Stato runtime Google Calendar: `token`, `calendarId`, `email`, `expiresAt`, `client` (token client GIS). Inizializzato da localStorage |
| `areesWeekOffset`, `settimanaOffset`, `meseOffset` | 3563–3565 | Scostamenti (in settimane/mesi rispetto a OGGI) delle viste Aree, Settimana, Mese. Indipendenti da `state.week`. Modificati da `onclick` inline (`settimanaOffset--;render()`): devono restare globali |
| `_postponeId` | 3566 | Id del ciclo nel modale Posticipa |
| `_autoCatTimer` | 3567 | Dichiarato, mai usato |
| `_syncRetryTimer` | 3568 | Handle del `setInterval` dei retry Google Calendar |
| `_expandedCardId` | 4534 | Id della compact card espansa (una sola alla volta) |
| `_expandedQBox` | 4707 | Box del quadrante espanso nella matrice mobile |
| `_agendaDragId` | 4798 | Id del ciclo in trascinamento nell'agenda |
| `_pfCicloId`, `_pfQuando`, `_pfRip` | 5482–5484 | Stato del mini-modale Pianifica: ciclo, preset QUANDO, ripetizione |
| `_bpAutoAperti` | 5921 | `Set` di `anno-settimana` per cui il wizard è già stato proposto in automatico (per sessione) |
| `_bpAccAperti` | 5922 | `Set` dei giorni espansi a mano nell'accordion mobile del Battle Plan |
| `_bpwStep`, `_bpwWeek`, `_bpwYear`, `_bpwPlan` | 6322–6325 | Stato del wizard: passo, settimana/anno del piano, riga `battle_plan` esistente |
| `_bpwSel` | 6326 | `Map` ciclo_id → `{giorno, fascia, ora, durata, completato, completato_at, inAgenda}`: la selezione del wizard |
| `_bpwQuery`, `_bpwCat`, `_bpwDragId` | 6327–6329 | Filtri testo/categoria dello step 1 e id in trascinamento dello step 2 |
| `_bpsCicloId`, `_bpsFascia` | 6681–6682 | Ciclo e fascia correnti nel pannello slot del wizard |
| `_bpRevScelte` | 6810 | `Map` item_id → `sposta` / `armadio` / `chiudi` della review |

### Costanti globali

| Costante | Riga | Significato |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON` | 1604–1605 | Endpoint e chiave anon del progetto Supabase |
| `LS` | 1607 | Chiavi localStorage: `cicli_claude_key`, `cicli_ctx`, `cicli_view`, `cicli_week`, `cicli_cat_filter`, `cicli_theme`, `cicli_agenda_sub` |
| (chiavi non in `LS`) | 3556–3559 | `gcal_token`, `gcal_expires`, `gcal_cal_id`, `gcal_email`: scritte come stringhe letterali |
| `CAT_COLORS` | 1617 | Slug categoria builtin → classe CSS `cat-<slug>` (16 slug) |
| `CAT_LABELS` | 1626 | Slug builtin → etichetta breve (`amministrazione`→`Amm.`, `da-delegare`→`Delega`, `rnd`→`R&D`) |
| `CAT_EMOJIS` | 1633 | Slug builtin → emoji |
| `GIORNI` | 1641 | 7 giorni `{key, short, label}`; chiavi `lunedi, martedi, mercoledi, giovedi, venerdi, sabato, domenica` (indice 0 = lunedì) |
| `FASCE` | 1651 | 3 fasce `{key, emoji, label}`: `mattina`, `pomeriggio`, `sera` |
| `FASCIA_NULL` | 1657 | `'__none__'`: pseudo-fascia "Non specificato" dell'agenda (non è una drop-zone) |
| `CAT_FALLBACK_EMOJI` | 1659 | `📌`: emoji per categoria assente o senza emoji |
| `RIP_LABELS` | 1661 | Etichette ripetizione mostrate sulle card agenda: `settimanale`, `mensile`, `trimestrale` (manca `giornaliera`: ha un badge suo) |
| `CAT_BUILTIN` | 1664 | Categorie builtin per contesto. lavoro: `management, hr, marketing, vendite, amministrazione, produzione, rnd, da-delegare, idee`; personale: `salute, relazioni, finanze, crescita, hobbies, spiritualita, casa, idee` (`idee` è in entrambi) |
| `GIORNI_MAP`, `FASCE_MAP` | 1669–1670 | Indici per chiave di `GIORNI` e `FASCE` |
| `db` | 1676 | Client Supabase (`supabase.createClient`, libreria da CDN jsdelivr `@supabase/supabase-js@2`) |
| `CAT_EMOJIS_LIST` | 2648 | 30 emoji proposte nel form categoria |
| `GUIDA_SECTIONS` | 3353 | 9 sezioni `{icon, title, content}` della Guida (HTML statico) |
| `GOOGLE_CLIENT_ID`, `GCAL_SCOPE` | 3535–3536 | Client OAuth e scope `calendar` |
| `GCAL_CAL_NAME` | 3537 | `'Cicli Aperti — Battle Plan'`: nome del calendario cercato/creato |
| `APP_URL` | 3538 | URL pubblico: redirect OAuth e link `#ciclo=<id>` nella descrizione degli eventi |
| `GCAL_USER_EMAIL` | 3539 | Email fissa usata come chiave di `user_tokens` e mostrata come account connesso |
| `MACRO_AREE_LIST` | 3541 | 9 macro aree: `Management, Marketing, Vendite, Amministrazione, Produzione, HR, R&D, Personale, Da Delegare` |
| `MACRO_AREA_COLORS`, `MACRO_AREA_EMOJIS` | 3543, 3549 | Colore esadecimale ed emoji per macro area |
| `Q_META` | 4701 | Etichetta, sottotitolo e classe CSS dei 4 quadranti (matrice mobile): Q1 Crisi, Q2 Qualità, Q3 Inganno, Q4 Spreco |
| `RIPETIZIONE_MESI` | 4862 | Passo in mesi delle ripetizioni: `mensile: 1`, `trimestrale: 3` |
| `BP_DURATA_DEFAULT` | 5904 | 30 minuti: durata di un item senza durata |
| `BP_OBIETTIVO_PCT` | 5905 | 80: percentuale di completamento attesa |
| `BP_SOVRACCARICO_MIN` | 5906 | 2400 minuti (40 h): oltre scatta l'avviso di sovraccarico nel wizard |
| `BP_STATI` | 5908 | Stati del piano: `bozza` 🟡, `attivo` 🟢, `chiuso` ⚫ |
| `BP_ZONE`, `BP_ZONE_MAP` | 5915, 5919 | I 7 giorni più la zona `settimana` (cicli senza giorno): le 8 colonne del piano |
| `BP_REV_OPZIONI` | 6812 | Scelte della review: `sposta` (Prossima settimana), `armadio` (Rimetti nell'armadio), `chiudi` (Chiudi comunque) |

Tabelle Supabase toccate dal codice: `cicli`, `persone`, `categorie`, `agenda_override`, `rituali_completati`, `battle_plan`, `battle_plan_items`, `user_tokens`. Le tabelle `assegnazioni` e `macro_aree` descritte in CLAUDE.md non sono mai lette né scritte.

---

## CONFIG · INIT SUPABASE · STATE (righe 1601–1707)

Nessuna funzione: solo le costanti e l'oggetto `state` descritti sopra. Nota: `state` chiama `getWeekNumber` in fase di inizializzazione (funziona per hoisting).

## UTILS (righe 1709–1796)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `getWeekNumber(d)` | 1712 | logica | Numero di settimana ISO 8601 della data (giovedì della settimana, calcolo in UTC) | — | — |
| `getWeekStart(week, year)` | 1720 | logica | Lunedì (ora locale) della settimana ISO indicata | — | — |
| `formatWeekLabel(week, year)` | 1729 | logica | Etichetta `Sett. N — g/m–g/m` (lunedì–domenica) | — | — |
| `getEscalation(c)` | 1736 | logica | Senza `due_date` → `null`; giorni alla scadenza ≤14 (anche scaduto) → `'crit'`; ≤30 → `'warn'`; altrimenti `null` | — | — |
| `getDaysLeft(due_date)` | 1744 | logica | Giorni (arrotondati per eccesso) alla scadenza, negativi se scaduta, `null` senza data | — | — |
| `formatDaysLeft(n)` | 1749 | logica | `<0` → `Ngg fa`; 0 → `Oggi`; 1 → `Domani`; altrimenti `Ngg` | — | — |
| `computeEffectiveQ(c)` | 1756 | logica | Quadrante effettivo: Q2 con escalation `warn` o `crit` → Q1; Q4 con `crit` → Q3; Q1 e Q3 invariati. Non scrive mai `q` sul DB | — | — |
| `isParcheggiato(c)` | 1768 | logica | `true` se `c.parcheggiato` è vero | — | — |
| `isAttivo(c)` | 1769 | logica | Predicato unico delle viste di pianificazione: `!done && !parcheggiato` | — | — |
| `catNome(cat)` | 1771 | logica | Etichetta della categoria: builtin da `CAT_LABELS`; `custom_<id>` → nome da `state.categorie`, se non trovata `'Senza categoria'`; vuota → `''`; slug sconosciuto → lo slug stesso | — | — |
| `catIcona(cat)` | 1783 | logica | Emoji della categoria: builtin, poi emoji della custom, altrimenti `📌` | — | — |
| `escHtml(s)` | 1794 | logica | Escape di `&`, `<`, `>`. NON fa l'escape di apici e virgolette | — | — |

## SUPABASE CRUD (righe 1798–1912)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `loadAll()` | 1801 | misto (dati + render) | Carica tutti i `cicli` (`created_at` DESC) e le `persone` (per `nome`) in parallelo, poi le `categorie` (per `ordine`), poi `reloadWeekData()`, infine `render()`. Se la vista è `matrix` mostra prima lo skeleton. Errore su cicli/persone → toast, ma prosegue. È il ricaricamento completo usato da realtime e pull-to-refresh | `cicli` (R), `persone` (R), `categorie` (R) + quelle di `reloadWeekData` | tutto il DOM via `render()`; `#q1-list…#q4-list` via skeleton |
| `reloadWeekData()` | 1830 | dati | Ricarica i dati che dipendono dalla settimana selezionata: `loadAgendaOverrides()` poi `loadBattlePlan()` | vedi le due funzioni | — |
| `loadAgendaOverrides()` | 1837 | dati | Sonda con 4 `select … limit(1)` la presenza delle colonne agenda, parcheggio, pianifica, rituali e imposta i 4 flag `*ColsOk`; chiama `loadRitualiCompletati()`; carica gli override di `(state.week, state.year)` e imposta `agendaTableOk`. Gli override di altre settimane non vengono mai caricati | `cicli` (R sonda), `agenda_override` (R), `rituali_completati` (R) | — |
| `upsertCiclo(data)` | 1883 | dati | Con `data.id` fa `update` (aggiunge `updated_at`), senza fa `insert` (aggiunge `created_at`/`updated_at`). Restituisce la riga salvata; lancia l'errore | `cicli` (W) | — |
| `removeCiclo(id)` | 1897 | dati | Cancella il ciclo. Non cancella l'evento Google Calendar collegato (override e item del piano cadono per cascade lato DB) | `cicli` (D) | — |
| `flipDone(id, currentDone)` | 1902 | dati | Inverte `done`; scrive `execution_status` = `done`/`planned`, `sync_status='pending'`, `updated_at`; poi lancia in background `syncCicloToGcal`. Non aggiorna `state.cicli` e non fa render: la UI cambia solo quando arriva il realtime. Nessuna gestione della ricorrenza | `cicli` (W) | — |

## REALTIME (righe 1914–1925)

Nessuna funzione dichiarata. Canale `cicli-changes`: qualsiasi evento su `cicli`, `persone`, `categorie`, `agenda_override`, `rituali_completati` chiama `loadAll()` (ricarica completa + render completo). Vedi "Regole di business" e "Listener globali".

## NAVIGATION (righe 1927–1965)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `changeWeek(dir)` | 1930 | misto (stato + localStorage + render) | Sposta `state.week` di ±1; sotto 1 → 52 dell'anno prima, sopra 52 → 1 dell'anno dopo (la settimana 53 non esiste per la navigazione). Salva `cicli_week`, fa `render()`, poi `reloadWeekData()` e un secondo `render()` solo se la vista è `agenda` o `bp` | via `reloadWeekData` | tutto via `render()` |
| `switchCtx(ctx)` | 1940 | misto (stato + localStorage + render) | Cambia contesto e azzera i filtri categoria e persona; salva `cicli_ctx` e svuota `cicli_cat_filter`; `render()` | — | tutto via `render()` |
| `switchView(v)` | 1949 | misto (stato + localStorage + render) | Imposta la vista, salva `cicli_view`, `render()`. Non azzera `searchQuery` né `personaDetailId` | — | tutto via `render()` |
| `filterByCat(cat)` | 1955 | misto (stato + localStorage + render) | Imposta il filtro categoria (`null` = tutte), azzera il filtro persona, salva `cicli_cat_filter`, `render()` | — | tutto via `render()` |
| `filterByPersona(nome)` | 1962 | ui | Attiva/disattiva (toggle) il filtro per persona e fa `render()`. Nessun chiamante nel file: codice morto, ma `applyFilters` lo rispetta | — | tutto via `render()` |

## RENDER (righe 1967–2306)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `render()` | 1970 | render | Ridisegna tutto, in ordine: `updateHeader`, `renderSidebar`, `renderViews`, `updateMobileNav` | — | header, `#sidebar`, tutte le `#view-*`, nav mobile, drawer |
| `updateHeader()` | 1977 | render | Scrive l'etichetta settimana, le classi dei pulsanti contesto e del pulsante "+". Attenua (`opacity 0.4`) il navigatore settimana fuori da Lista, Agenda, Battle Plan e ricerca, ma lo lascia cliccabile | — | `#weekLabel`, `#ctx-lavoro`, `#ctx-personale`, `#addBtn`, `.week-nav` |
| `updateMobileNav()` | 1992 | render | Evidenzia il tab mobile attivo fra `oggi, settimana, matrix, agenda` e chiama `updateDrawer()` | — | `#mnav-oggi`, `#mnav-settimana`, `#mnav-matrix`, `#mnav-agenda` + drawer |
| `renderViews()` | 2000 | misto (logica di filtro + render) | Mostra solo la `#view-<vista>` attiva e aggiorna i pulsanti `#vbtn-*`, titolo e legenda (solo matrice senza ricerca). Con `searchQuery` non vuota: titolo `RICERCA`, nasconde tutto, mostra `#view-list` con i risultati e azzera contatori e avvisi. Azzera `filter_cat` (e `filter_persona`) se nessun ciclo attivo del contesto ha quella categoria. Base matrice = cicli attivi del contesto SENZA filtro settimana; base lista = attivi del contesto con `week`/`year` selezionati; entrambe passano da `applyFilters`. Contatori e avvisi usano la base lista solo in vista `list`, altrimenti la base matrice. Smista al render della vista | — | `#view-*` (12), `#vbtn-*`, `#legend-bar`, `#viewTitle` |
| `applyFilters(cicli)` | 2064 | logica | Applica `filter_cat` (uguaglianza su `cat`) e `filter_persona` (nome incluso in `persone_menzionate`) | — | — |
| `renderSummary(filtered)` | 2071 | render | Conta i cicli non chiusi per quadrante EFFETTIVO e scrive i 4 contatori (barra riepilogo e intestazioni dei quadranti) | — | `#cnt-q1…#cnt-q4`, `#q1c…#q4c` |
| `renderEscalationNotices(filtered)` | 2080 | render | Mostra/nasconde gli avvisi con il numero di cicli non chiusi `crit` (≤14 gg) e `warn` (≤30 gg) | — | `#notice-crit`, `#notice-warn`, `#notice-crit-text`, `#notice-warn-text` |
| `renderMatrix(filtered)` | 2089 | render | Sotto 769 px di larghezza delega a `renderMatrixMobile`. Altrimenti riempie i 4 elenchi per quadrante effettivo con `makeCicloCard(c,'matrix')` o "Nessun ciclo". Se gli elenchi non esistono più (distrutti dalla versione mobile) salta in silenzio | — | `#q1-list…#q4-list` |
| `renderList(filtered)` | 2101 | render | Lista della settimana ordinata per quadrante effettivo, poi per `due_date` crescente (senza data in fondo); vuota → "Nessun ciclo per questa settimana" | — | `#view-list` |
| `personColor(p)` | 2116 | logica | Colore della persona: `p.colore` se presente, altrimenti scelto fra 10 colori con hash del nome (accetta oggetto o stringa) | — | — |
| `cicliForPersona(nome)` | 2124 | logica | Cicli attivi di TUTTI i contesti che citano quel nome in `persone_menzionate` | — | — |
| `renderPersone()` | 2128 | render | Se `personaDetailId` è impostato delega a `renderPersonaDetail`. Altrimenti pulsante "+ Aggiungi persona" e una card per persona con avatar, ruolo e numero di cicli aperti; click sulla card apre il dettaglio | — | `#view-persone` |
| `renderPersonaDetail(pv)` | 2171 | render | Dettaglio persona: pulsante indietro, intestazione, cicli attivi (di entrambi i contesti) raggruppati per quadrante effettivo Q1→Q4, ogni card con il segno del contesto (💼/🌿). Persona non trovata → torna all'elenco | — | `#view-persone` (passato come `pv`) |
| `renderAddPersonaForm(pv)` | 2227 | render | Inserisce (una sola volta) il form nuova persona con nome, ruolo e 10 campioni colore, subito dopo il pulsante "Aggiungi" | — | `#addPersonaForm`, `#apf-nome`, `#apf-ruolo`, `#apf-colors` |
| `apfSelectColor(el, color)` | 2257 | ui | Segna come `selected` il campione colore cliccato (il colore viene poi letto da `data-color`) | — | `#apf-colors .color-swatch` |
| `saveNewPersona()` | 2263 | misto (dati + lettura DOM) | Valida il nome obbligatorio e inserisce la persona con ruolo (o `null`) e colore del campione selezionato (default `#3d7fff`). Non chiude il form e non aggiorna lo stato: ci pensa il realtime | `persone` (W) | `#apf-nome`, `#apf-ruolo`, `#apf-colors .color-swatch.selected` |
| `renderStorico(allCtx)` | 2276 | render | Archivio del contesto: cicli chiusi OPPURE con `year`/`week` precedenti alla settimana selezionata (anche aperti e parcheggiati: qui `isAttivo` non si applica). Ordinati per `updated_at` DESC e raggruppati per settimana, dalla più recente; `week` nullo → "Senza settimana" | — | `#view-storico` |

## SEARCH (righe 2308–2373)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `onSearchInput(val)` | 2313 | ui | Debounce 300 ms: imposta `state.searchQuery` (trim), mostra/nasconde il pulsante di pulizia, `render()` | — | `#searchClear` |
| `clearSearch()` | 2323 | ui | Svuota campo e `searchQuery`, nasconde il pulsante di pulizia, `render()` | — | `#searchInput`, `#searchClear` |
| `highlightTerm(text, term)` | 2332 | logica | Restituisce HTML con escape e il termine avvolto in `<mark class="hl">` (case-insensitive, regex con escape) | — | — |
| `renderSearchResults()` | 2339 | render | Cerca fra i cicli attivi di TUTTI i contesti e TUTTE le settimane in titolo, note, slug categoria, nome categoria e persone; ordina per quadrante effettivo; evidenzia il termine nel titolo trovandolo con il selettore `div[style*="text-overflow"]` (dipende dallo stile inline della card lista) | — | `#view-list` |

## SIDEBAR (righe 2375–2468)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderSidebar()` | 2378 | render | Riscrive tutto `#sidebar`: 8 voci di vista (`bp, matrix, agenda, list, persone, storico, parcheggio, guida`) con tooltip, il Parcheggio con il conteggio dei parcheggiati non chiusi; "Tutti" + categorie builtin del contesto + custom del contesto, ciascuna con il numero di cicli attivi; le custom hanno ✏️ e, solo se a zero cicli attivi, 🗑; pulsante "+ Categoria" con il contenitore del form; "Completati" (totale chiusi del contesto); pulsanti Import Plaud e Assegna Macro Aree. Ricreando l'HTML distrugge il form categoria se era aperto | — | `#sidebar` (crea `#catAddBtn`, `#catInlineForm`) |

## CARD BUILDER (righe 2470–2643)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `makeGiornalieroBadge(c)` | 2476 | render | Solo per i rituali giornalieri: badge `🌅 HH:MM` oppure `🌅 Ogni giorno`, con ora e durata nel title | — | crea `span.giornaliero-badge` |
| `makeGiornoBadge(c)` | 2487 | render | Per i cicli non giornalieri con `giorno_settimana`: badge `📅 Lun mattina` (prime 3 lettere del giorno + fascia) | — | crea `span.giorno-badge` |
| `makeCicloCard(c, mode)` | 2500 | misto (render + azione dati) | Card del ciclo. `mode='list'`: riga con badge del quadrante effettivo, spunta, titolo (⚠️ se `sync_status='failed'`, etichetta Plaud se `da_plaud`), categoria, badge giorno/rituale, `Sett.N`, persone, giorni alla scadenza e pillola CRITICO/PRESTO. Altrimenti card matrice con barra di escalation. Click sulla card → `openModal(null, id)`; click sulla spunta → `flipDone` con toast | `cicli` (W via `flipDone`) | crea `div.list-item` o `div.ciclo-card` |

## CATEGORIE CUSTOM (righe 2645–2727)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `toggleCatForm(editData)` | 2653 | ui | Apre/chiude il form categoria nella sidebar; con `editData` lo precompila (nome, emoji, contesto) e imposta `_catEditId`. Contesto di default = contesto attivo, emoji di default 📋. Mette il focus sul nome dopo 100 ms | — | `#catInlineForm`, `#catAddBtn`; crea `#catf-nome`, `#catf-emojis`, `#catf-ctx-lav`, `#catf-ctx-per` |
| `selectCatEmoji(e, btn)` | 2685 | ui | Memorizza l'emoji scelta in `_catFormEmoji` ed evidenzia il pulsante | — | `#catf-emojis .emoji-btn` |
| `setCatCtx(ctx)` | 2691 | ui | Memorizza il contesto della categoria in `_catFormCtx` ed evidenzia il pulsante | — | `#catf-ctx-lav`, `#catf-ctx-per` |
| `saveCatForm()` | 2697 | misto (dati + lettura DOM) | Nome obbligatorio. In modifica aggiorna `nome/emoji/ctx`; in creazione inserisce con `ordine = numero di categorie esistenti`. Nasconde il form; la sidebar si aggiorna via realtime | `categorie` (W) | `#catf-nome`, `#catInlineForm` |
| `deleteCat(id)` | 2714 | dati | Dopo `confirm()` cancella la categoria. Nessun controllo sui cicli che la usano (l'icona 🗑 compare solo a zero cicli attivi, ma i chiusi o parcheggiati restano con `custom_<id>` → "Senza categoria") | `categorie` (D) | — |
| `editCatInline(id)` | 2723 | ui | Trova la categoria in `state.categorie` e apre il form in modifica | — | via `toggleCatForm` |

## PERSONA CHIPS IN MODAL (righe 2729–2827)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `initPersonaChips(persone_menzionate)` | 2734 | ui | Ricostruisce `_modalPersone` dai nomi del ciclo (agganciando la persona in rubrica se esiste, altrimenti `id: null`) e ridisegna i chip | — | via `renderPersonaChips` |
| `renderPersonaChips()` | 2743 | render | Rimuove i `.pchip` esistenti e li reinserisce prima dell'input, con ✕ che chiama `removePersonaChip('<nome>')` in `onclick` inline | — | `#personaChipsBox`, `#personaChipInput` |
| `removePersonaChip(nome)` | 2761 | ui | Toglie la persona da `_modalPersone` e ridisegna | — | via `renderPersonaChips` |
| `onPersonaChipInput(val)` | 2766 | render | Menu a tendina: fino a 6 persone della rubrica che contengono il testo e non sono già scelte, più la voce `+ Crea "<testo>"` se nessuna persona ha esattamente quel nome | — | `#personaDd` |
| `selectPersonaFromDd(nome)` | 2785 | ui | Aggiunge la persona ai chip (senza duplicati), svuota l'input e chiude il menu | — | `#personaChipInput`, `#personaDd` |
| `createAndSelectPersona(nome)` | 2797 | misto (dati + ui) | Inserisce la persona in rubrica con colore da hash, la aggiunge a `state.persone` (push: mutazione) e ai chip. Se l'insert fallisce aggiunge comunque il chip senza segnalare l'errore | `persone` (W) | via `selectPersonaFromDd` |
| `onPersonaChipKey(e)` | 2810 | ui | Backspace a input vuoto toglie l'ultimo chip; Escape chiude il menu. Invio NON crea un chip: lo intercetta il listener globale e salva il ciclo | — | `#personaDd` |

## MODAL NUOVO/MODIFICA CICLO (righe 2829–3062)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `openModal(defaultQ, editId)` | 2836 | ui | Apre il modale ciclo. In modifica precompila dal ciclo (settimana di default = selezionata, data pianificata di default = oggi) e mostra "Elimina"; in creazione azzera i campi, quadrante = `defaultQ` o 2, categoria di default `management`/`salute` secondo il contesto, data pianificata = oggi. Nasconde i campi agenda se `agendaColsOk` è falso. Chiama `setModalCtx(ctx, true)`, poi riapplica la categoria del ciclo se l'opzione esiste (altrimenti il default del contesto), `selectQ`. Sotto 769 px chiude "Più opzioni", altrimenti le apre. Focus sul titolo dopo 200 ms | — | `#modalOverlay`, `#modalTitle`, `#btn-delete`, `#btn-save`, `#f-title`, `#f-note`, `#f-date`, `#f-week`, `#f-scheduled-date`, `#f-scheduled-time`, `#f-macro-area`, `#f-giorno-settimana`, `#f-fascia-oraria`, `#f-cat`, `#agenda-fields-row`, `#agenda-fields-hint` |
| `closeModal(overlayId)` | 2902 | ui | Toglie `open` dall'overlay indicato (default `modalOverlay`); solo per `modalOverlay` azzera `editingId` | — | l'overlay passato |
| `closeModalOnBg(e, id)` | 2908 | ui | Chiude l'overlay solo se il click è sullo sfondo e non sul contenuto | — | l'overlay passato |
| `renderCatOptions(ctx)` | 2917 | render | Ricostruisce `#f-cat`: optgroup con le builtin del contesto, poi optgroup "Personalizzate" con le custom del contesto ordinate per `ordine`, valore `custom_<id>` | — | `#f-cat` |
| `catOptionEsiste(value)` | 2947 | logica (legge il DOM) | Vero se `#f-cat` contiene un'opzione con quel valore | — | `#f-cat` |
| `setModalCtx(ctx, keepCat)` | 2957 | ui | Imposta `modalCtx`, evidenzia i pulsanti contesto, ricostruisce le categorie. Senza `keepCat` (click su Lavoro/Personale) mantiene la categoria precedente solo se esiste nel nuovo contesto, altrimenti `management`/`salute`. Con `keepCat=true` non tocca il valore (lo riapplica `openModal`) | — | `#f-cat`, `#cpk-lavoro`, `#cpk-personale`, `#btn-save` |
| `selectQ(q)` | 2974 | ui | Imposta `selectedQ`, evidenzia il pulsante `data-q` e mostra il banner Q2 (`#q2-nudge`) solo per Q2 | — | `.q-pick-btn`, `#q2-nudge` |
| `saveCiclo()` | 2984 | misto (dati + lettura DOM) | Titolo obbligatorio. Costruisce il payload: `note` (o `null`), `cat`, `due_date`, `week` (campo o settimana selezionata), `year = state.year` SEMPRE (anche in modifica), `q = selectedQ`, `ctx = modalCtx`, `persone_menzionate` da `_modalPersone`, `scheduled_date` (campo o oggi: il controllo "obbligatoria" è irraggiungibile), `scheduled_time`, `macro_area`, `sync_status='pending'`, `settimana_anno` dalla data pianificata; `giorno_settimana`/`fascia_oraria` solo se `agendaColsOk`. In modifica conserva `done`, `da_plaud`, `execution_status`, `google_event_id`; in creazione `done=false`, `da_plaud=false`, `execution_status='planned'`. Non scrive mai ricorrenza, pianificazione, parcheggio, ora/durata. Chiude il modale, aggiorna `state.cicli` senza render (lo fa il realtime), lancia `syncCicloToGcal({...data})` (per un ciclo nuovo `data` non ha `id`). Restituisce la riga salvata o `null` | `cicli` (W) | `#f-title`, `#f-scheduled-date`, `#f-macro-area`, `#f-note`, `#f-cat`, `#f-date`, `#f-week`, `#f-scheduled-time`, `#f-giorno-settimana`, `#f-fascia-oraria`, `#btn-save` |
| `deleteCurrent()` | 3052 | misto (dati + ui) | Con `editingId` e dopo `confirm()` elimina il ciclo e chiude il modale; la lista si aggiorna via realtime | `cicli` (D) | `#modalOverlay` |

## PLAUD IMPORT (3 step) (righe 3064–3250)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `openPlaudModal()` | 3070 | ui | Azzera passo ed estratti, svuota la trascrizione e apre il modale | — | `#plaud-transcript`, `#plaudOverlay` |
| `closePlaudModal()` | 3079 | ui | Chiude il modale Plaud | — | `#plaudOverlay` |
| `setPlaudStep(n)` | 3083 | ui | Mostra il pannello del passo n (1 incolla, 2 analisi, 3 conferma), aggiorna etichetta e pallini | — | `#plaud-step-label`, `#plaud-step-1…3`, `#plaud-dot-1…3` |
| `analyzePlaud()` | 3096 | misto (dati + ui) | Trascrizione obbligatoria. Senza chiave Claude in localStorage chiude Plaud e apre il modale chiave. Passa allo step 2, chiama Claude; array vuoto o errore → toast e ritorno allo step 1; altrimenti elenco e step 3 | API Anthropic; localStorage `cicli_claude_key` (R) | `#plaud-transcript` |
| `callClaude(transcript, apiKey)` | 3124 | dati | POST diretta dal browser a `api.anthropic.com/v1/messages` (modello `claude-haiku-4-5-20251001`, `max_tokens 3000`, header `anthropic-dangerous-allow-browser`). Estrae il JSON (anche dentro un blocco ```` ``` ````) e lo restituisce; lancia su HTTP non ok o JSON non valido | API Anthropic | — |
| `buildPrompt(transcript)` | 3151 | logica | Prompt che chiede un array JSON di `{title (max 60), note, q 1–4, cat fra le 16 builtin, ctx, due_date, persone_menzionate}` | — | — |
| `renderPlaudItems(items)` | 3175 | render | Elenco degli estratti: checkbox già spuntata (`data-idx`), titolo, badge Q (default 2), note, categoria, persone e un campo data modificabile per riga | — | `#plaud-items`, `#plaud-count`; crea `.plaud-item-check`, `#plaud-date-<idx>` |
| `importPlaudSelected()` | 3210 | misto (dati + lettura DOM) | Almeno una riga spuntata. Inserisce in blocco: `q` (default 2), `cat` (default `management` anche per il personale), `ctx` (default contesto attivo), `due_date` dal campo data della riga, `week`/`year` = settimana SELEZIONATA, `done=false`, `da_plaud=true`. Non imposta `scheduled_date` (vale il default del DB), né `macro_area`, non sincronizza Google Calendar, non crea le persone in rubrica, non valida `cat`/`q` restituiti da Claude | `cicli` (W) | `.plaud-item-check:checked`, `#plaud-date-<idx>`, `#btn-import-plaud` |

## API KEY MODAL (righe 3252–3268)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `openApiKeyModal()` | 3255 | ui | Precompila il campo con la chiave salvata e apre il modale | localStorage `cicli_claude_key` (R) | `#claude-key-input`, `#apikeyOverlay` |
| `saveApiKey()` | 3261 | misto (dati + ui) | Accetta solo chiavi che iniziano con `sk-ant-`; salva in localStorage, chiude e dopo 300 ms apre SEMPRE il modale Plaud (anche se si arrivava dall'ingranaggio) | localStorage `cicli_claude_key` (W) | `#claude-key-input`, `#apikeyOverlay` |

## TOAST (righe 3270–3293)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `showToast(msg, type)` | 3274 | render | Aggiunge un toast (`type`: `success`, `error`, `warn`, `info` o nessuno) che si chiude al click o dopo 3200 ms | — | `#toast-container`; crea `#toast-<n>` |
| `_dismissToast(id)` | 3288 | ui | Toglie `show` e rimuove il toast dopo 300 ms | — | `#toast-<n>` |

## DARK / LIGHT THEME (righe 3295–3310)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `applyTheme()` | 3298 | misto (localStorage + DOM) | Applica il tema salvato (default `dark`): classe `light` su `body` e icona del pulsante | localStorage `cicli_theme` (R) | `body`, `#themeBtn` |
| `toggleTheme()` | 3305 | misto (localStorage + DOM) | Inverte la classe `light`, salva `light`/`dark`, aggiorna l'icona. Non aggiorna `#drawer-theme-label` | localStorage `cicli_theme` (W) | `body`, `#themeBtn` |

## TOOLTIP (righe 3312–3348)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `_tip` (arrow in `const`) | 3316 | ui | Restituisce l'elemento `#tooltip` | — | `#tooltip` |
| `positionTooltip(tip, anchor)` | 3337 | ui | Posiziona il tooltip a destra dell'ancora (a sinistra se non ci sta), dentro la finestra, assumendo 240×60 px | — | `#tooltip` |

Gestori anonimi: `mouseover`/`mouseout` su `document` per qualsiasi elemento `[data-tip]` (comparsa dopo 400 ms).

## GUIDA (righe 3350–3487)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderGuida()` | 3460 | render | Scrive una volta sola (se `#view-guida` è vuoto) le 9 sezioni a fisarmonica da `GUIDA_SECTIONS`. Il testo della guida descrive regole di escalation diverse dal codice (vedi incoerenze) | — | `#view-guida`; crea `#guida-sec-<i>` |
| `toggleGuidaSection(i)` | 3484 | ui | Apre/chiude la sezione i (classe `open`) | — | `#guida-sec-<i>` |

## SKELETON (righe 3489–3497)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderSkeleton()` | 3492 | render | Mette 3 card segnaposto in ciascuno dei 4 elenchi della matrice | — | `#q1-list…#q4-list` |

## KEYBOARD SHORTCUTS · AVVIO (righe 3499–3530)

Nessuna funzione dichiarata: due listener `keydown` anonimi e la sequenza di avvio. Vedi "Listener globali e avvio".

## BATTLE PLAN — COSTANTI E STATO (righe 3532–3568)

Nessuna funzione: costanti Google Calendar, macro aree, oggetto `gcal` e offset delle viste (descritti in "Stato e costanti").

## DATE UTILS (righe 3570–3600)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `todayISO()` | 3573 | logica | Data di oggi `YYYY-MM-DD` ricavata da `toISOString()`: è la data UTC, non quella locale | — | — |
| `isoWeekStr(d)` | 3577 | logica | Stringa `YYYY-Www` con anno ISO (usata per `settimana_anno`) | — | — |
| `addDays(isoDate, n)` | 3586 | logica | Somma n giorni a una data ISO e restituisce `YYYY-MM-DD` (via UTC) | — | — |
| `dayName(isoDate)` | 3592 | logica | Giorno in italiano, es. `lunedì 12 ott` | — | — |
| `monthName(offset)` | 3596 | logica | Mese e anno in italiano a `offset` mesi da oggi. Nessun chiamante: codice morto | — | — |

## MACRO AREA HELPERS (righe 3602–3612)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `getMaCssClass(area)` | 3605 | logica | Classe CSS `ma-<Area>` togliendo `&` e il primo spazio (`R&D`→`ma-RD`, `Da Delegare`→`ma-DaDelegare`: i `replace` successivi non hanno più effetto) | — | — |
| `getMaColor(area)` | 3611 | logica | Colore della macro area, default `#64748b` | — | — |
| `getMaEmoji(area)` | 3612 | logica | Emoji della macro area, default `📂` | — | — |

## AUTO-CATEGORIZZAZIONE CLAUDE (righe 3614–3670)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `autoCategoria(title, note)` | 3617 | dati | Senza chiave o senza titolo → `null`. Chiede a Claude Haiku (`max_tokens 30`) una sola delle 9 macro aree; restituisce l'area solo se è esattamente nell'elenco, altrimenti `null` (anche su HTTP non ok) | API Anthropic; localStorage `cicli_claude_key` (R) | — |

Gestore anonimo (riga 3645): al `DOMContentLoaded` aggancia un `blur` a `#f-title`; se c'è un titolo e `#f-macro-area` è vuota chiama `autoCategoria(titolo, #f-note)` e, se la select è ancora vuota, la imposta. Scrive `#auto-cat-spin` e `#auto-cat-hint`. Vale per entrambi i contesti. Il salvataggio non richiama l'auto-categorizzazione.

## GOOGLE CALENDAR — OAUTH + SYNC (righe 3672–3940)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `isGcalTokenValid()` | 3675 | logica | Token presente e scadenza oltre 60 secondi da adesso | — | — |
| `initGcal()` | 3679 | misto (dati + ui) | Avvio: carica il token dal DB (senza attendere), aggiorna il pulsante, avvia il `setInterval` dei retry ogni 5 minuti, prova a inizializzare GIS | `user_tokens` (R) | `#gcalBtn`, `#gcal-btn-label` |
| `_tryInitGis()` | 3689 | dati | Se la libreria Google Identity Services è caricata crea il token client (callback `_handleGcalToken`), altrimenti riprova ogni 800 ms senza limite | — | — |
| `_handleGcalToken(resp)` | 3701 | misto (dati + ui) | Callback OAuth: salva token e scadenza (`expires_in`) in `gcal`, localStorage e DB; email = `GCAL_USER_EMAIL`; assicura il calendario; toast; chiude il modale | `user_tokens` (W); localStorage `gcal_token`, `gcal_expires`, `gcal_email` | `#gcalBtn`, `#gcal-btn-label`, `#gcalOverlay` |
| `connectGoogleCalendar()` | 3716 | ui | Con il client GIS chiede il token (popup); altrimenti fa redirect al flusso implicito con `state=gcal_connect` | — | `window.location` |
| `checkImplicitCallback()` | 3732 | misto (dati + ui) | Eseguita subito al caricamento: se l'hash contiene `state=gcal_connect` e `access_token` salva il token (default 3600 s), ripulisce l'URL, salva su DB e assicura il calendario | `user_tokens` (W); localStorage `gcal_*` | `window.location.hash`, `#gcalBtn` |
| `loadGcalTokenFromDB()` | 3753 | dati | Legge la riga di `GCAL_USER_EMAIL`; solo se non c'è già un token in memoria adotta token, scadenza, calendario ed email e li copia in localStorage | `user_tokens` (R) | `#gcalBtn`, `#gcal-btn-label` |
| `saveGcalTokenToDB()` | 3771 | dati | Upsert su `user_email` di token, id calendario e scadenza (`google_refresh_token` sempre `null`); errori ignorati | `user_tokens` (W) | — |
| `ensureGcalCalendar()` | 3783 | dati | Con token valido e senza `calendarId`: cerca nella lista calendari quello con nome `GCAL_CAL_NAME`, altrimenti lo crea (fuso `Europe/Rome`); salva l'id in localStorage e DB | `user_tokens` (W); API Google Calendar | — |
| `gcalFetch(path, method, body)` | 3803 | dati | Chiamata all'API Calendar v3 con il Bearer token. Token non valido → richiede un nuovo token (popup) e restituisce `null` senza eseguire la chiamata. HTTP non ok → lancia; 204 → `null` | API Google Calendar | — |
| `buildGcalEvent(ciclo)` | 3824 | logica | Evento: titolo `[DONE] ` (se chiuso) + `[Macro area] ` + titolo; descrizione = note, persone, link `APP_URL#ciclo=<id>`. Con `scheduled_time` evento di 1 ora (ora+1, senza gestione del passaggio oltre le 23), altrimenti evento di giornata intera con inizio = fine = `scheduled_date` | — | — |
| `syncCicloToGcal(ciclo)` | 3847 | dati | Esce se il token non è valido, manca il calendario o manca `scheduled_date`. Ciclo chiuso con evento: PATCH del titolo con `[DONE]`, poi DELETE dell'evento, `google_event_id=null`, `sync_status='synced'`. Con `google_event_id`: PATCH dell'evento. Senza: POST e salvataggio di `google_event_id`. Successo → `sync_status='synced'`; errore → `sync_status='failed'` | `cicli` (W); API Google Calendar | — |
| `retryFailedSyncs()` | 3883 | dati | Con token valido ritenta al massimo 5 cicli non chiusi con `sync_status='failed'`, a 300 ms l'uno dall'altro. I `pending` non vengono mai ritentati | `cicli` (W) | — |
| `updateGcalButton()` | 3892 | render | Pulsante header: classe `connected` ed etichetta `GCal ✓` oppure `Connetti` | — | `#gcalBtn`, `#gcal-btn-label` |
| `openGcalModal()` | 3905 | render | Riscrive corpo e azioni del modale: connesso → account, calendario, "Disconnetti", "Ri-sincronizza tutti"; non connesso → spiegazione e "Connetti Google" | — | `#gcal-modal-body`, `#gcal-modal-actions`, `#gcalOverlay` |
| `disconnectGcal()` | 3921 | misto (dati + ui) | Azzera `gcal`, rimuove le 4 chiavi `gcal_*` da localStorage, cancella la riga in `user_tokens`, aggiorna il pulsante e chiude il modale. Non revoca il token presso Google | `user_tokens` (D) | `#gcalBtn`, `#gcalOverlay` |
| `batchSyncAll()` | 3930 | misto (dati + ui) | Sincronizza in sequenza (200 ms di pausa) tutti i cicli non chiusi con `scheduled_date`, di tutti i contesti, parcheggiati compresi; toast con il conteggio e chiusura del modale | `cicli` (W) | `#gcalOverlay` |

## VISTA OGGI (righe 3942–3986)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderOggi()` | 3945 | render | Cicli attivi di TUTTI i contesti con `scheduled_date` = oggi (`todayISO`), ordinati per `scheduled_time` (senza ora in fondo). Intestazione con data e conteggio, spinner del pull-to-refresh. Card: `makeCompactCard` sotto 769 px, altrimenti `makeMobileCard`. Non applica i filtri di sidebar | — | `#view-oggi`; crea `#ptr-oggi` |

## VISTA SETTIMANA (mobile cards per giorno) (righe 3988–4055)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderSettimana()` | 3991 | render | Settimana di OGGI spostata di `settimanaOffset` (non usa `state.week`). Navigazione ‹ › con `onclick` inline sull'offset. Cicli attivi di tutti i contesti con `scheduled_date` nell'intervallo, raggruppati per giorno e ordinati per ora; giorno vuoto → "Nessuna attività". Le date ISO dei 7 giorni escono da `toISOString()` di una mezzanotte locale (vedi incoerenze sulle date) | — | `#view-settimana`; crea `#ptr-settimana` |

## VISTA MESE (righe 4057–4148)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderMese()` | 4060 | render | Griglia del mese di oggi + `meseOffset`, da lunedì; per ogni giorno fino a 6 pallini (colore della macro area) dei cicli attivi di tutti i contesti con quella `scheduled_date`. Click su un giorno → azzera `settimanaOffset` e apre la vista Settimana (quella corrente, non quella del giorno cliccato). In fondo legenda delle prime 5 macro aree in uso | — | `#view-mese` |

## VISTA AREE — Griglia 9 macro aree per settimana (righe 4150–4228)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderAree()` | 4153 | render | Settimana di oggi + `areesWeekOffset`. Cicli attivi di tutti i contesti con `scheduled_date` nella settimana OPPURE `week`/`year` uguali; raggruppati sulle 9 macro aree (senza area → `Da Delegare`). Intestazioni con conteggio, pillole cliccabili che aprono il modale | — | `#view-aree` |

## MOBILE CARD CON SWIPE (righe 4230–4359)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `makeMobileCard(ciclo)` | 4233 | misto (render + azione dati) | Card con titolo (⚠️ se sync fallita), ora, macro area, prime 2 persone, spunta (`flipDone`). Click → modale; pressione lunga 600 ms → modale; swipe via `initSwipe`. Usata in Oggi/Settimana sopra i 768 px | `cicli` (W via `flipDone`) | crea `div.mobile-card` |
| `initSwipe(card, ciclo, doneBg, postponeBg)` | 4314 | misto (ui + azione dati) | Swipe orizzontale con soglia 80 px: a destra anima l'uscita e dopo 250 ms chiude il ciclo (`flipDone(id, false)`); a sinistra apre il modale Posticipa. Marca l'evento con `_swipeHandled` per bloccare il click | `cicli` (W via `flipDone`) | la card passata |

## MODAL POSTICIPA (righe 4361–4406)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `openPostponeModal(cicloId)` | 4364 | ui | Memorizza `_postponeId`, precompila la data personalizzata con `scheduled_date` + 1 giorno e apre il modale | — | `#postpone-custom-date`, `#postponeOverlay` |
| `doPostpone(days)` | 4374 | dati | Sposta di `days` giorni (pulsanti +1, +2, +7) a partire dalla `scheduled_date` del ciclo (o da oggi) | via `_applyPostpone` | — |
| `doPostponeCustom()` | 4382 | misto (dati + lettura DOM) | Sposta alla data scelta nel campo; senza data non fa nulla | via `_applyPostpone` | `#postpone-custom-date` |
| `_applyPostpone(ciclo, newDate)` | 4390 | misto (dati + ui) | Scrive `scheduled_date`, `execution_status='postponed'`, `sync_status='pending'`, `settimana_anno`; chiude il modale, toast, sync Google Calendar in background. Non cambia `week`/`year` e non controlla l'`error` di Supabase (toast di successo anche se l'update fallisce) | `cicli` (W) | `#postponeOverlay` |

## PULL TO REFRESH (righe 4408–4439)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `initPullToRefresh()` | 4411 | misto (ui + dati) | Aggancia i touch a `.content`: trascinando oltre 50 px da scroll 0 mostra lo spinner `#ptr-<vista>`; al rilascio, se lo spinner è visibile, `loadAll()` e toast. Lo spinner esiste solo in Oggi e Settimana: nelle altre viste il gesto non fa nulla | via `loadAll` | `.content`, `#ptr-oggi`, `#ptr-settimana` |

## BATCH MIGRAZIONE MACRO AREE SU CICLI ESISTENTI (righe 4441–4465)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `batchMigrateAree()` | 4444 | dati | Richiede la chiave Claude. Prende al massimo 50 cicli di contesto `lavoro` senza `macro_area` (chiusi compresi), li classifica uno alla volta con `autoCategoria` (200 ms di pausa), scrive `macro_area`, poi `loadAll()` e toast con il conteggio | `cicli` (W); API Anthropic | — |

## DRAWER MOBILE (righe 4467–4504)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `openDrawer()` | 4470 | ui | Apre drawer e overlay e ne aggiorna il contenuto | — | `#drawer`, `#drawerOverlay` |
| `closeDrawer()` | 4476 | ui | Chiude drawer e overlay | — | `#drawer`, `#drawerOverlay` |
| `updateDrawer()` | 4481 | render | Scrive l'etichetta settimana, le classi dei pulsanti contesto e lo stato Google Calendar (icona, etichetta, voce "Disconnetti" visibile solo con token valido) | — | `#drawerWeekLabel`, `#drawer-ctx-lavoro`, `#drawer-ctx-personale`, `#drawer-gcal-icon`, `#drawer-gcal-label`, `#drawer-disconnect-item` |

## MODAL PIÙ OPZIONI TOGGLE (righe 4506–4529)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `toggleMoreOpts()` | 4509 | ui | Apre/chiude la sezione "Più opzioni" del modale e aggiorna il testo del pulsante | — | `#moreOptsSection`, `#moreOptsBtn` |
| `openMoreOpts()` | 4517 | ui | Apre la sezione (default desktop) | — | `#moreOptsSection`, `#moreOptsBtn` |
| `closeMoreOpts()` | 4524 | ui | Chiude la sezione (default mobile) | — | `#moreOptsSection`, `#moreOptsBtn` |

## COMPACT CARD (mobile redesign v2) (righe 4531–4696)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `makeCompactCard(ciclo)` | 4536 | misto (render + azione dati) | Riga compatta: pallino del quadrante effettivo, titolo, ora, macro area. Tap sulla riga espande (una sola card aperta alla volta) note troncate a 120 caratteri e 3 azioni: Fatto/Riapri (`flipDone`), `+1g` (`_applyPostpone` a +1 giorno, senza modale), Modifica (`openModal`). Pressione lunga 600 ms → modale | `cicli` (W) | crea `div.compact-card[data-id]` |
| `initCompactSwipe(card, row, ciclo, doneBg, postponeBg)` | 4653 | misto (ui + azione dati) | Come `initSwipe` ma sulla riga e con soglia 60 px: destra = chiude il ciclo dopo 220 ms, sinistra = apre il modale Posticipa | `cicli` (W via `flipDone`) | la riga passata |

## MATRIX MOBILE 2×2 COMPACT (righe 4698–4794)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderMatrixMobile(filtered)` | 4709 | render | SOSTITUISCE tutto `#view-matrix` (assi, quadranti, `#qN-list`, `#qNc`, pulsanti "+ Aggiungi") con una griglia 2×2: per quadrante numero, etichetta, sottotitolo e fino a 20 titoli (poi "…e altri N"). Tap sul box lo espande (uno alla volta), tap su un titolo apre il modale. In fondo "+ Nuovo ciclo" | — | `#view-matrix`, `#q1-list…#q4-list` |
| `collapseBox(box, grid)` | 4791 | ui | Toglie `expanded` dal box e azzera `_expandedQBox` | — | il box passato |

## VISTA AGENDA SETTIMANALE (righe 4795–5475)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `switchAgendaSub(sub)` | 4800 | misto (stato + localStorage + render) | Accetta solo `pianificati` o `dapianificare`; salva `cicli_agenda_sub` e ridisegna l'agenda | localStorage `cicli_agenda_sub` (W) | `#view-agenda` |
| `agendaDayDate(idx)` | 4808 | logica | Data del giorno `idx` (0 = lunedì) della settimana selezionata | — | — |
| `isSameDay(a, b)` | 4815 | logica | Stesso giorno di calendario (ora locale) | — | — |
| `agendaWeekSubtitle()` | 4819 | logica | Sottotitolo `Sett. NN · gg/mm–gg/mm` | — | — |
| `agendaOverrideFor(cicloId)` | 4827 | logica | Override del ciclo per la settimana selezionata, o `null` | — | — |
| `isoWeekParts(d)` | 4835 | logica | `{week, year}` ISO di una data (anno ISO, non di calendario) | — | — |
| `parseISODate(str)` | 4844 | logica | Da `YYYY-MM-DD…` a `Date` in ora locale; `null` se non valida | — | — |
| `addMesi(date, n)` | 4851 | logica | Somma n mesi con clamp sull'ultimo giorno del mese (31 gen + 1 → 28/29 feb) | — | — |
| `ricadeInSettimana(c, week, year)` | 4865 | logica | Il ciclo cade in quella settimana per `pianificato_data` + `pianificato_ripetizione`? `nessuna`: solo la sua settimana ISO. Altrimenti mai prima della prima occorrenza; `settimanale`: ogni settimana da lì in poi; `mensile`/`trimestrale`: itera le occorrenze con `addMesi` (max 400) e controlla la settimana ISO. `giornaliera` non è in `RIPETIZIONE_MESI` → `false` (i rituali hanno il loro blocco) | — | — |
| `agendaSlotForWeek(c, week, year)` | 4896 | logica | Posizione del ciclo nella settimana, in ordine: (1) override in `state.agendaOverrides` per quella settimana; (2) con `pianificato_data`: se ricade → giorno = `giorno_settimana` o il giorno della data, fascia = `fascia_oraria`; se non ricade → nessun giorno; (3) senza `pianificato_data` → `giorno_settimana`/`fascia_oraria` permanenti, presenti ogni settimana. Restituisce `{giorno, fascia, overridden}` | — | — |
| `agendaSlotFor(c)` | 4916 | logica | `agendaSlotForWeek` sulla settimana selezionata | — | — |
| `haPianificazione(c)` | 4921 | logica | Vero se rituale giornaliero, oppure ha `pianificato_data`, oppure `giorno_settimana`, oppure un override per la settimana selezionata | — | — |
| `agendaBaseCicli()` | 4929 | logica | Cicli attivi del contesto con i filtri di sidebar applicati | — | — |
| `agendaPianificati()` | 4935 | logica | Base esclusi i rituali giornalieri, con un giorno risolto per la settimana selezionata | — | — |
| `agendaDaPianificare()` | 4936 | logica | Base senza alcuna pianificazione (`!haPianificazione`) | — | — |
| `renderAgenda()` | 4938 | render | Intestazione con sottotitolo settimana e toggle Pianificati/Da pianificare con i conteggi; banner se la migration agenda manca; poi `renderAgendaDaPianificare` oppure `renderRitualiBlock` + `renderAgendaPianificati` | — | `#view-agenda` |
| `renderAgendaPianificati(root, isP)` | 4989 | render | Griglia 7 colonne × fasce: indicizza i cicli per giorno e fascia (fascia assente o sconosciuta → "Non specificato", mostrata in cima solo se non vuota e non droppabile). Le 3 fasce sono drop-zone solo se tabella e colonne agenda esistono. Pallini di navigazione per giorno (scroll alla colonna) sincronizzati con lo scroll orizzontale | — | crea `#agendaGrid`, `.agenda-col`, `.agenda-slot[data-giorno][data-fascia]`, `.agenda-dots` |
| `makeAgendaCard(c)` | 5096 | misto (render + azione dati) | Card trascinabile (se la migration c'è): spunta (`flipDone`), titolo, badge Q effettivo, 🔄 se la posizione viene da un override, avatar, badge 🔁 della ripetizione. `dragstart`/`dragend` gestiscono `_agendaDragId`. Click → modale | `cicli` (W via `flipDone`) | crea `div.ag-card[data-id]`; `.agenda-slot.drag-over` |
| `makeAgendaAvatars(nomi)` | 5173 | render | Fino a 3 avatar con iniziale e colore, più `+N` con i nomi restanti nel title; `null` senza nomi | — | crea `div.ag-avatars` |
| `attachDropZone(slot, giorno, fascia)` | 5199 | ui | Rende lo slot una drop-zone: `dragover`/`dragleave` gestiscono `drag-over`; `drop` legge l'id (dataTransfer o `_agendaDragId`) e chiama `moveCicloInAgenda` | via `moveCicloInAgenda` | lo slot passato |
| `moveCicloInAgenda(cicloId, giorno, fascia)` | 5222 | misto (dati + render) | Se la posizione cambia: upsert di un override per `(ciclo, settimana selezionata, anno)` con `onConflict: 'ciclo_id,settimana,anno'`; aggiorna `state.agendaOverrides`, ridisegna l'agenda, toast. Non modifica mai il ciclo: vale solo per quella settimana | `agenda_override` (W) | `#view-agenda` |
| `makeBigCard(c, mode)` | 5257 | render | Card grande. `mode='parcheggio'`: data di parcheggio, "🔄 Riattiva" (`riattivaCiclo`) e "📅 Pianifica ora" (`openPianificaModal`). Altrimenti (`'pianifica'`): "⭐ Metti da parte" (solo se le colonne parcheggio esistono, `parcheggiaCiclo`) e "📅 Pianifica". Click sulla card → modale | — | crea `div.big-card` |
| `sortByQThenCreated(list)` | 5338 | logica | Copia ordinata per quadrante effettivo, poi per `created_at` crescente | — | — |
| `renderAgendaDaPianificare(root)` | 5347 | render | Titolo con conteggio e griglia di `makeBigCard(c,'pianifica')` ordinata con `sortByQThenCreated` (elenco unico, non raggruppato per quadrante); vuoto → messaggio | — | `#view-agenda` (passato come `root`) |
| `renderParcheggio()` | 5371 | render | Banner se la migration manca. Cicli del contesto non chiusi e parcheggiati, `parcheggiato_at` DESC; campo di ricerca interno (titolo, note, nome categoria, persone) che a ogni tasto ridisegna la vista e ripristina focus e cursore; conteggio `trovati / totali`; card `makeBigCard(c,'parcheggio')` | — | `#view-parcheggio`; crea `.park-search` |
| `parcheggiaCiclo(cicloId)` | 5448 | misto (dati + render) | Scrive `parcheggiato=true`, `parcheggiato_at=adesso`; aggiorna lo stato locale, `render()`, toast. Non tocca pianificazione, override né item del Battle Plan | `cicli` (W) | tutto via `render()` |
| `riattivaCiclo(cicloId)` | 5463 | misto (dati + render) | Scrive `parcheggiato=false`, `parcheggiato_at=null`; aggiorna lo stato locale, `render()`, toast | `cicli` (W) | tutto via `render()` |

## MINI-MODALE PIANIFICA CICLO (righe 5479–5739)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `openPianificaModal(cicloId)` | 5486 | ui | Richiede le colonne agenda. Azzera QUANDO a `questa` (sempre, anche se il ciclo è già pianificato), ripetizione = quella del ciclo; precompila giorno (default `lunedi`), fascia (default `mattina`), data specifica, ora e durata (preset `15,30,45,60,90,120,180`, altrimenti `custom`). Senza colonne rituali nasconde l'opzione `giornaliera` e il campo ora/durata; senza colonne pianifica nasconde tutto il campo RIPETIZIONE e forza `nessuna` | — | `#pf-ciclo-title`, `#pf-giorno`, `#pf-fascia`, `#pf-data-specifica`, `#f-ora-inizio`, `#f-durata`, `#f-durata-custom`, `#pf-oradurata-field`, `#pianificaOverlay`, `.pf-opt[data-rip]`, `#pf-save` |
| `closePianificaModal()` | 5543 | ui | Chiude l'overlay e azzera `_pfCicloId` | — | `#pianificaOverlay` |
| `pfSelectQuando(key)` | 5548 | ui | Imposta `_pfQuando` (`questa, prossima, mese1, mese3, specifica`), evidenzia il pulsante; mostra il campo data solo per `specifica`, precompilandolo con oggi se vuoto | — | `.pf-opt[data-quando]`, `#pf-data-specifica` |
| `pfSelectRip(key)` | 5557 | ui | Imposta `_pfRip` (`nessuna, giornaliera, settimanale, mensile, trimestrale`), evidenzia il pulsante; per `giornaliera` nasconde giorno/fascia e cambia il suggerimento sull'ora; azzera l'errore | — | `.pf-opt[data-rip]`, `#pf-giornofascia-field`, `#pf-oradurata-hint`, `#pf-error` |
| `pfMostraErrore(msg)` | 5572 | ui | Mostra o nasconde il messaggio d'errore del mini-modale | — | `#pf-error` |
| `pfDurataMinuti()` | 5580 | logica (legge il DOM) | Durata in minuti dalla select; `custom` → valore del campo limitato a 5–480; vuota → `null` | — | `#f-durata`, `#f-durata-custom` |
| `pfDataBase()` | 5600 | logica (legge il DOM) | Data base del preset: `questa` = lunedì della settimana SELEZIONATA; `prossima` = quel lunedì + 7; `mese1`/`mese3` = oggi + 1/3 mesi; `specifica` = data del campo (o oggi) | — | `#pf-data-specifica` |
| `pfAggiustaAlGiorno(base, giornoKey)` | 5611 | logica | Porta la data al giorno scelto restando nella stessa settimana ISO (può anche arretrare rispetto alla base) | — | — |
| `toISODate(d)` | 5620 | logica | `YYYY-MM-DD` in ora locale (a differenza di `todayISO`) | — | — |
| `confermaPianificazione()` | 5624 | misto (dati + lettura DOM + render) | Valida: data obbligatoria per `specifica`; per `giornaliera` servono le colonne rituali e l'ora (durata default 30). Calcola data = `pfAggiustaAlGiorno(pfDataBase(), giorno)`. Scrive sul ciclo: `giorno_settimana`/`fascia_oraria` (`null` per i giornalieri), `pianificato_data` (oggi per i giornalieri) e `pianificato_ripetizione` se le colonne esistono, `ora_inizio`/`durata_minuti` se esistono, `ricorrenza = _pfRip` sempre; se era parcheggiato lo riattiva. Non giornaliero e tabella presente: upsert dell'override per la settimana ISO della data calcolata. Aggiorna lo stato locale (l'override solo se è della settimana selezionata), chiude, `render()`, toast. Non sincronizza Google Calendar | `cicli` (W), `agenda_override` (W) | `#pf-giorno`, `#pf-fascia`, `#pf-data-specifica`, `#f-ora-inizio`, `#f-durata`, `#f-durata-custom`, `#pf-error`, `#pf-save`, `#pianificaOverlay` |

Gestori anonimi: `change` su `document` per `#f-durata` (mostra `#f-durata-custom` se `custom`, riga 5591); `click` delegato su `#pianificaOverlay .pf-opt` che smista a `pfSelectQuando`/`pfSelectRip` (riga 5734).

## RITUALI QUOTIDIANI (righe 5741–5895)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `isGiornaliero(c)` | 5744 | logica | Rituale quotidiano = `pianificato_ripetizione === 'giornaliera'` (non guarda `ricorrenza`) | — | — |
| `formatDurata(min)` | 5748 | logica | `45 min`, `1 ora`, `2 ore`, `1h 30`; vuota per 0/null | — | — |
| `formatOra(t)` | 5755 | logica | Primi 5 caratteri dell'ora (`HH:MM`) o stringa vuota | — | — |
| `ritualiQuotidiani()` | 5760 | logica | Rituali attivi del contesto ordinati per `ora_inizio` (ignora i filtri di sidebar) | — | — |
| `rituraleFattoOggi(cicloId)` | 5766 | logica | Esiste in `state.ritualiCompletati` una riga del ciclo con `data_completamento` = oggi | — | — |
| `loadRitualiCompletati()` | 5771 | dati | Carica le righe di oggi (`todayISO`) e imposta `ritualiTableOk` | `rituali_completati` (R) | — |
| `toggleRitualeOggi(cicloId)` | 5788 | misto (dati + render) | Se già fatto oggi cancella la riga `(ciclo_id, oggi)`, altrimenti la inserisce; aggiorna lo stato e ridisegna l'agenda. Non chiude mai il ciclo: domani riappare da fare | `rituali_completati` (W/D) | `#view-agenda` |
| `makeRitualeCard(c)` | 5814 | render | Card del rituale: Q effettivo, "✓ Fatto oggi", ora, durata, titolo, categoria, spunta (`toggleRitualeOggi`). Click → modale ciclo | — | crea `div.rit-card` |
| `renderRitualiBlock(root)` | 5872 | render | Se ci sono rituali aggiunge in testa all'agenda il blocco "🌅 Rituali quotidiani (N)" e un separatore | — | `#view-agenda` (passato come `root`) |

## BATTLE PLAN — PIANO DI BATTAGLIA SETTIMANALE (righe 5897–7126)

### Caricamento e helper (righe 5924–6025)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `loadBattlePlan()` | 5925 | dati | Carica il piano di `(state.week, state.year)` (`maybeSingle`) e i suoi item per `ordine`; errore sul piano → `bpTableOk=false`. Nessun piano → item vuoti | `battle_plan` (R), `battle_plan_items` (R) | — |
| `bpFetchPlan(week, year)` | 5955 | dati | Piano e item di una settimana qualsiasi senza toccare `state`; lancia in caso di errore | `battle_plan` (R), `battle_plan_items` (R) | — |
| `bpCiclo(item)` | 5967 | logica | Ciclo dell'item da `state.cicli`, o `null` se eliminato | — | — |
| `bpItemsValidi()` | 5968 | logica | Item il cui ciclo esiste ancora | — | — |
| `bpDurata(item)` | 5969 | logica | `durata_prevista` o 30 | — | — |
| `bpOra(item)` | 5970 | logica | `ora_prevista` come `HH:MM` o `null` | — | — |
| `bpFormatMin(min)` | 5972 | logica | `0min`, `45min`, `2h`, `1h 30min` | — | — |
| `bpStats(items)` | 5979 | logica | `{tot, done, pct}` con `pct` arrotondato (0 se vuoto) | — | — |
| `bpPctClass(pct)` | 5985 | logica | `ok` ≥80, `mid` ≥50, `low` sotto | — | — |
| `bpEricorrente(c)` | 5988 | logica | Ricorrente se rituale giornaliero oppure `pianificato_ripetizione` (o, in mancanza, `ricorrenza`) diverso da `nessuna` | — | — |
| `bpSottotitolo(week, year)` | 5995 | logica | `Settimana NN · gg/mm – gg/mm · YYYY` | — | — |
| `bpDataGiorno(week, year, idx)` | 6002 | logica | Data del giorno `idx` di quella settimana | — | — |
| `bpSettimanaSuccessiva(week, year)` | 6009 | logica | `{week, year}` ISO della settimana dopo | — | — |
| `bpSettimanaCorrente()` | 6015 | logica | `{week, year}` ISO di oggi | — | — |
| `bpSettimanaPassata()` | 6018 | logica | La settimana selezionata inizia prima della settimana corrente | — | — |
| `bpSolaLettura()` | 6023 | logica | Piano esistente e (`stato === 'chiuso'` oppure settimana passata) | — | — |

### Vista (righe 6027–6285)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `renderBattlePlan()` | 6028 | render | Senza tabella solo il banner della migration. Altrimenti intestazione; senza piano `bpRenderVuoto`; con piano barra di avanzamento, note di riflessione (se presenti) e griglia | — | `#view-bp` |
| `bpHeader()` | 6058 | render | Titolo, sottotitolo, badge di stato. Pulsanti: "Stampa PDF" (se c'è un piano), "Modifica piano" (se non in sola lettura), "Chiudi settimana" (solo stato `attivo` e settimana non passata) | — | crea `div.bp-head` |
| `bpProgressBar(st)` | 6103 | render | Barra con `N completati su M`, percentuale e classe colore (verde ≥80, arancio ≥50, rosso sotto) | — | crea `div.bp-progress-wrap` |
| `bpRenderVuoto(root)` | 6117 | misto (render + ui) | Stato vuoto: testo diverso per settimana passata; se non passata pulsante "Prepara il Battle Plan" e, la prima volta per quella settimana nella sessione, apertura automatica del wizard dopo 250 ms (se si è ancora in vista `bp` senza piano) | — | `#view-bp` (passato come `root`) |
| `bpGriglia(items)` | 6145 | render | 8 colonne (`BP_ZONE`): item con `giorno` sconosciuto → `settimana`; ordinati per ora (senza ora in fondo) poi `ordine`; totale minuti per colonna. Sotto 769 px le colonne sono a fisarmonica: aperte oggi, la colonna Settimana e quelle in `_bpAccAperti`; il click sull'intestazione le apre/chiude | — | crea `div.bp-grid`, `.bp-col` |
| `makeBpCard(item, readonly)` | 6229 | misto (render + azione dati) | Card dell'item: spunta (`toggleBpItem`, disattivata in sola lettura), titolo (o "(ciclo eliminato)"), ora, durata, categoria, Q effettivo. Click → modale del ciclo | via `toggleBpItem` | crea `div.bp-card` |
| `toggleBpItem(itemId)` | 6291 | misto (dati + render) | Inverte `completato` e scrive `completato_at`. Se il ciclo NON è ricorrente e il suo `done` è diverso, chiama `flipDone` (chiude o riapre il ciclo) e aggiorna `state.cicli`. I ricorrenti restano aperti. Ridisegna il piano, toast con `fatti/totali` | `battle_plan_items` (W), `cicli` (W via `flipDone`) | `#view-bp` |

### Wizard: step 1 selezione, step 2 assegnazione (righe 6321–6746)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `bpwCandidati()` | 6332 | logica | "Armadio": cicli attivi del contesto esclusi i rituali giornalieri, per Q effettivo poi `created_at` | — | — |
| `bpwDefaultDurata(c)` | 6342 | logica | `durata_minuti` del ciclo o 30 | — | — |
| `bpwDefaultOra(c)` | 6343 | logica | `ora_inizio`, altrimenti `scheduled_time`, come `HH:MM`; o `null` | — | — |
| `openBpWizard(week, year, preselIds)` | 6348 | misto (dati + ui) | Azzera lo stato del wizard, legge il piano esistente e ne carica gli item in `_bpwSel` (conservando `completato`). Pre-seleziona con `inAgenda: true` i candidati che `agendaSlotForWeek` colloca in quella settimana, poi i cicli di `preselIds` (senza giorno). Apre l'overlay sullo step 1. Non svuota il campo `#bpw-search` | `battle_plan` (R), `battle_plan_items` (R) | `#bpw-sub`, `#bpWizOverlay`, `#bpw-cat` |
| `closeBpWizard()` | 6399 | ui | Chiude l'overlay del wizard (la selezione non salvata va persa) | — | `#bpWizOverlay` |
| `bpwGoStep(n)` | 6403 | ui | Mostra lo step, aggiorna indicatori, titolo e testi dei pulsanti ("Avanti → Assegna ai giorni" / "✅ Attiva il Battle Plan"; "Annulla" / "← Indietro") e ridisegna lo step | — | `#bpw-step1`, `#bpw-step2`, `#bpw-s1`, `#bpw-s2`, `#bpw-title`, `#bpw-next`, `#bpw-back` |
| `bpwBack()` | 6424 | ui | Dallo step 2 torna all'1; dallo step 1 chiude il wizard | — | via `bpwGoStep` / `closeBpWizard` |
| `bpwNext()` | 6426 | ui | Step 1: serve almeno un ciclo selezionato, poi step 2. Step 2: `bpAttiva()` | via `bpAttiva` | — |
| `bpwRenderCatFilter()` | 6436 | render | Popola il filtro con le sole categorie usate dai candidati | — | `#bpw-cat` |
| `bpwSetQuery(v)` | 6445 | ui | Imposta il filtro testo (minuscolo, trim) e ridisegna lo step 1 | — | via `bpwRenderStep1` |
| `bpwSetCat(v)` | 6446 | ui | Imposta il filtro categoria e ridisegna lo step 1 | — | via `bpwRenderStep1` |
| `bpwToggle(cicloId)` | 6448 | ui | Toglie il ciclo dalla selezione oppure lo aggiunge con giorno/fascia da `agendaSlotForWeek` e ora/durata di default | — | via `bpwRenderStep1` |
| `bpwRenderStep1()` | 6462 | render | Candidati filtrati per categoria e testo (titolo, note), raggruppati per Q effettivo con checkbox; chip categoria, persone, scadenza, "📅 Già in agenda". Poi il riepilogo | — | `#bpw-list` |
| `bpwRenderSummary()` | 6532 | render | Numero di cicli, tempo totale e medio, obiettivo 80% in numero di cicli (arrotondato per eccesso), avviso oltre 40 ore, consiglio del 130% | — | `#bpw-summary` |
| `bpwRenderStep2()` | 6551 | render | Pool dei cicli senza giorno ("finiranno in 📋 Settimana") e 8 drop-zone con totale minuti, card ordinate per ora | — | `#bpw-pool`, `#bpw-days`, `#bpw-pool-hd` |
| `bpwMiniCard(cicloId, v, zonaKey)` | 6607 | render | Mini card trascinabile: ✕ toglie il ciclo dalla selezione, titolo, ora · emoji fascia · durata. Click → `bpSlotOpen`; `dragstart`/`dragend` gestiscono `_bpwDragId` | — | crea `div.bp-mini[data-id]`; `.bp-drop.drag-over` |
| `bpwAttachDrop(zone, zonaKey)` | 6651 | ui | Drop-zone dello step 2: sulla colonna `settimana`, o se il ciclo ha già fascia e durata, assegna direttamente (fascia `null` per `settimana`); altrimenti apre il pannello slot | — | la zona passata |
| `bpSlotOpen(cicloId, giornoKey)` | 6684 | ui | Apre il pannello slot: popola la select con le 8 zone, i 3 pulsanti fascia (default `mattina`), ora e durata (se la durata non è fra le opzioni → 30) | — | `#bps-sub`, `#bps-giorno`, `#bps-fasce`, `#bps-ora`, `#bps-durata`, `#bpSlotPanel` |
| `bpSlotClose()` | 6722 | ui | Chiude il pannello e azzera `_bpsCicloId` | — | `#bpSlotPanel` |
| `bpSlotConfirm()` | 6727 | misto (stato + lettura DOM) | Scrive in `_bpwSel` giorno, fascia (`null` per `settimana`), ora e durata (default 30), chiude e ridisegna lo step 2. Nessuna scrittura su DB | — | `#bps-giorno`, `#bps-ora`, `#bps-durata` |

Gestore anonimo (riga 6744): click su `#bpSlotPanel` fuori dal contenuto → `bpSlotClose()`. Agganciato direttamente all'elemento al caricamento dello script.

### Attivazione, review, Q2, PDF (righe 6748–7115)

| Funzione | Riga | Tipo | Cosa fa | Tabelle Supabase | DOM toccato |
|---|---|---|---|---|---|
| `bpAttiva()` | 6749 | misto (dati + ui) | Upsert del piano (`onConflict: 'settimana,anno'`, stato sempre `attivo`); cancella gli item non più selezionati; upsert degli altri (`onConflict: 'battle_plan_id,ciclo_id'`) con giorno (default `settimana`), fascia (`null` senza giorno), ora, durata, `completato` conservato, `ordine` = posizione. Chiude il wizard; se la settimana del wizard è diversa sposta `state.week`/`year` (salva `cicli_week`) e ricarica; passa alla vista `bp`; toast | `battle_plan` (W), `battle_plan_items` (R/W/D) | `#bpw-next` |
| `openBpReview()` | 6818 | render | Review: barra di avanzamento, verdetto (≥80 "Ottimo lavoro", ≥50 "Buon lavoro", sotto "Settimana difficile"), per ogni item non completato 3 scelte con `sposta` preselezionata, textarea delle note precompilata | — | `#bprev-title`, `#bprev-sub`, `#bprev-body`, `#bpRevOverlay`, `#bprev-ok`; crea `#bprev-note` |
| `bpChiudiSettimana()` | 6896 | misto (dati + lettura DOM + render) | Mette il piano in `chiuso` con `chiuso_at` e note. Scelta `chiudi` → `done=true`, `execution_status='done'`, `sync_status='pending'` sui cicli (anche ricorrenti, senza sync Google Calendar). `armadio` → nessuna azione. `sposta` → nessuna scrittura: gli id vengono solo passati al wizard della settimana successiva, aperto dopo 400 ms. Ridisegna il piano | `battle_plan` (W), `cicli` (W) | `#bprev-note`, `#bprev-ok`, `#bpRevOverlay`, `#view-bp` |
| `q2PianificaOra()` | 6944 | misto (dati + ui) | Dal banner Q2 del modale: se il ciclo esiste chiude il modale e apre Pianifica; altrimenti richiede il titolo, salva con `saveCiclo()` e apre Pianifica sulla riga salvata dopo 150 ms | `cicli` (W via `saveCiclo`) | `#f-title`, `#modalOverlay` |
| `pdfTxt(s)` | 6960 | logica | Toglie emoji, frecce, simboli e selettori di variante (i font PDF standard non li rendono) e comprime gli spazi | — | — |
| `bpStampaPdf()` | 6967 | misto (render PDF + ui) | Genera con jsPDF (A4 verticale, margini 14 mm, 10 sotto 769 px) intestazione, un blocco per zona con checkbox, titolo, ora/durata, categoria e righe tratteggiate per le note, 10 righe di NOTE GENERALI e il bilancio. Apre il blob in una nuova scheda; con popup bloccato scarica `battle-plan-YYYY-Wnn.pdf` | — | `window.open`; nessun id |

---

## Regole di business da non perdere

### Escalation
- `getEscalation` (1736): scadenza entro 14 giorni, o già passata → `crit`; entro 30 → `warn`. Senza `due_date` nessuna escalation.
- `computeEffectiveQ` (1756): Q2 → Q1 con `warn` o `crit` (quindi entro 30 giorni); Q4 → Q3 solo con `crit` (entro 14). Il quadrante effettivo è solo calcolato a video: `cicli.q` non viene mai riscritto. Tutte le viste, i contatori e gli ordinamenti usano l'effettivo.
- Avvio (3524): toast "N ciclo/i auto-escalati" se esistono cicli non chiusi con quadrante effettivo diverso da `q` (conta tutti i contesti e anche i parcheggiati).
- `renderEscalationNotices` (2080): contatori `crit`/`warn` sopra le viste.

### Ricorrenza
- Valori ammessi (pulsanti `data-rip`, riga 1370–1374): `nessuna`, `giornaliera`, `settimanale`, `mensile`, `trimestrale`. Scritti da `confermaPianificazione` (5624) sia in `pianificato_ripetizione` (se la colonna esiste) sia in `ricorrenza`. Il modale ciclo non espone né scrive questi campi.
- Chiusura con la spunta normale (`flipDone`, 1902): il ciclo viene chiuso comunque, anche se ricorrente. Non esiste nel file alcuna logica che ricrei il ciclo o ne sposti la data: il commento alla riga 5676 ("usato dalla logica di ripetizione alla chiusura") descrive codice che non c'è.
- Chiusura dal Battle Plan (`toggleBpItem`, 6291 + `bpEricorrente`, 5988): se ricorrente si spunta solo l'item, il ciclo resta aperto e ricompare per `ricadeInSettimana`.
- `ricadeInSettimana` (4865): `nessuna` = solo la settimana ISO di `pianificato_data`; `settimanale` = ogni settimana da quella in poi; `mensile`/`trimestrale` = occorrenze ogni 1/3 mesi con clamp sui mesi corti (`addMesi`, 4851).
- `bpChiudiSettimana` (6896) con scelta `chiudi` chiude anche i cicli ricorrenti.

### Parcheggio
- `isAttivo` (1769): `!done && !parcheggiato` è il filtro di matrice, lista, agenda, oggi, settimana, mese, aree, persone, ricerca, conteggi sidebar, candidati del wizard. Lo Storico non lo applica.
- `parcheggiaCiclo` (5448): `parcheggiato=true`, `parcheggiato_at=adesso`. Disponibile solo dalle card di Agenda → Da pianificare.
- `riattivaCiclo` (5463): `parcheggiato=false`, `parcheggiato_at=null`.
- `confermaPianificazione` (5678): pianificare un ciclo parcheggiato lo riattiva.
- `renderParcheggio` (5371): ordinamento `parcheggiato_at` DESC, ricerca interna propria (`state.parcheggioQuery`).
- La funzione `assegnaGiornoCiclo()` citata in CLAUDE.md non esiste nel file.

### Override agenda
- `moveCicloInAgenda` (5222): il drag & drop crea/aggiorna un override per `(ciclo, settimana selezionata, anno)`; non modifica il ciclo. La settimana dopo il ciclo torna alla posizione di base. Dall'interfaccia un override non si può cancellare.
- `confermaPianificazione` (5686): crea un override anche per la settimana della data calcolata (non per i giornalieri).
- `loadAgendaOverrides` (1837): in memoria ci sono solo gli override della settimana selezionata.
- La fascia "Non specificato" (`FASCIA_NULL`) non accetta drop.

### Risoluzione posizione in agenda
- `agendaSlotForWeek` (4896): (1) override della settimana; (2) `pianificato_data` + ripetizione: se ricade → `giorno_settimana` o il giorno della data; se non ricade → fuori dalla settimana anche se ha `giorno_settimana`; (3) solo `giorno_settimana` → presente ogni settimana.
- `haPianificazione` (4921): un ciclo esce da "Da pianificare" se è giornaliero, ha `pianificato_data`, ha `giorno_settimana` o ha un override nella settimana selezionata. Un ciclo con `pianificato_data` in un'altra settimana non compare né fra i pianificati né fra i da pianificare.
- `agendaPianificati` (4935): i rituali giornalieri sono esclusi dalla griglia (hanno il loro blocco).

### Battle Plan
- Stati (`BP_STATI`, 5908): `bozza`, `attivo`, `chiuso`. Il codice scrive solo `attivo` (`bpAttiva`, 6756) e `chiuso` (`bpChiudiSettimana`, 6914); `bozza` è solo il default del DB.
- `bpAttiva` (6749): un piano per settimana (`onConflict: 'settimana,anno'`); gli item deselezionati vengono cancellati, gli altri aggiornati conservando `completato`; item senza giorno → zona `settimana`.
- `openBpWizard` (6348): pre-seleziona i cicli che l'agenda colloca in quella settimana (badge "Già in agenda") e quelli rinviati dalla review.
- `bpRenderVuoto` (6136): wizard proposto in automatico una sola volta per settimana e per sessione (`_bpAutoAperti`).
- Completamento (`toggleBpItem`, 6291): ciclo non ricorrente → `flipDone` in entrambe le direzioni (spuntare chiude, togliere la spunta riapre); ricorrente → solo l'item.
- Sola lettura (`bpSolaLettura`, 6023): piano `chiuso` oppure settimana passata → niente spunte né "Modifica piano". "Chiudi settimana" solo se `attivo` e settimana non passata (6091).
- Review (`openBpReview`, 6818 / `bpChiudiSettimana`, 6896): default `sposta` per ogni item non fatto; `sposta` non scrive nulla, pre-seleziona soltanto nel wizard della settimana successiva (se il wizard viene annullato il rinvio va perso); `armadio` = nessuna azione; `chiudi` = ciclo chiuso. Le note finiscono in `battle_plan.note`.
- Soglie: obiettivo 80% (`BP_OBIETTIVO_PCT`), durata di default 30 minuti, avviso di sovraccarico oltre 40 ore, colori barra ≥80 / ≥50 (`bpPctClass`, 5985).
- PDF (`bpStampaPdf`, 6967): le emoji vanno tolte con `pdfTxt` (6960).

### Rituali
- `isGiornaliero` (5744): `pianificato_ripetizione === 'giornaliera'`.
- `confermaPianificazione` (5640): per un rituale l'ora è obbligatoria, durata default 30, `giorno_settimana` e `fascia_oraria` a `null`, `pianificato_data` = oggi, nessun override.
- `toggleRitualeOggi` (5788): fatto/non fatto vale per il solo giorno di oggi (riga in `rituali_completati`); il ciclo non viene chiuso.
- `loadRitualiCompletati` (5771): carica solo le righe di oggi, al caricamento; dopo la mezzanotte serve un ricaricamento.
- I rituali sono esclusi dalla griglia agenda (4935) e dai candidati del wizard (6334); hanno il badge `makeGiornalieroBadge` (2476).

### Auto-categorizzazione / macro aree
- `autoCategoria` (3617): una delle 9 macro aree esatte, altrimenti `null`. Richiede la chiave Claude in localStorage.
- Listener `blur` su `#f-title` (3645): classifica solo se `#f-macro-area` è vuota; non sovrascrive una scelta manuale; vale per entrambi i contesti. Messaggio "Nessuna key Claude" anche quando l'API risponde con errore o con un valore non valido.
- `batchMigrateAree` (4444): solo contesto `lavoro`, senza macro area, massimo 50 per esecuzione.
- `renderAree` (4186): un ciclo senza macro area viene mostrato sotto `Da Delegare`.
- Categorie custom: valore `custom_<id>` in `cicli.cat`; mai mostrare lo slug (`catNome`/`catIcona`, 1771/1783); `setModalCtx(ctx, true)` da `openModal` per non perdere la categoria (2957).

### Import Plaud
- `analyzePlaud` (3096) → `callClaude` (3124, modello `claude-haiku-4-5-20251001`) → `renderPlaudItems` (3175) → `importPlaudSelected` (3210).
- Senza chiave si apre il modale chiave; `saveApiKey` (3261) accetta solo `sk-ant-…` e riapre Plaud.
- I cicli importati hanno `da_plaud=true`, settimana = quella selezionata, `q` default 2, `cat` default `management`, `ctx` default contesto attivo; la scadenza è modificabile riga per riga prima dell'import.

### Sync Google Calendar
- Crea/aggiorna: `saveCiclo` (3042), `_applyPostpone` (4402), `flipDone` (1911), `retryFailedSyncs` (3883), `batchSyncAll` (3930). Regola in `syncCicloToGcal` (3847): POST se manca `google_event_id`, altrimenti PATCH; serve `scheduled_date`.
- Cancella: solo quando il ciclo è chiuso e ha un evento (PATCH `[DONE]` poi DELETE, 3855). `removeCiclo` non cancella l'evento.
- Non sincronizzano: import Plaud, Pianifica, parcheggio, chiusura dalla review del Battle Plan.
- Retry (`initGcal`, 3684): ogni 5 minuti, massimo 5 cicli `failed` non chiusi. I `pending` non vengono ritentati.
- Token: valido se scade fra più di 60 secondi (3675); nessun refresh token; con token scaduto la sync esce in silenzio.
- Evento: 1 ora se c'è `scheduled_time`, altrimenti giornata intera; fuso `Europe/Rome` (`buildGcalEvent`, 3824).

### Realtime
- Canale `cicli-changes` (1917): eventi su `cicli`, `persone`, `categorie`, `agenda_override`, `rituali_completati` → `loadAll()`.
- Canale `bp-changes` (7120): eventi su `battle_plan`, `battle_plan_items` → `loadBattlePlan()` e `renderBattlePlan()` solo se la vista è `bp`.
- Molte azioni non aggiornano lo stato locale e contano sul realtime per ridisegnare: `flipDone`, `saveNewPersona`, `saveCatForm`, `deleteCat`, `deleteCurrent`, `_applyPostpone`, `importPlaudSelected`, `saveCiclo` (aggiorna lo stato ma non fa render).

---

## Listener globali e avvio

### `addEventListener` su documento, finestra o elementi fissi

| Riga | Bersaglio / evento | Effetto |
|---|---|---|
| 2822 | `document` `click` | Click fuori da `.persona-chips-wrap` → chiude `#personaDd` |
| 3318 | `document` `mouseover` | Su `[data-tip]`: dopo 400 ms mostra `#tooltip` con il testo e lo posiziona |
| 3330 | `document` `mouseout` | Su `[data-tip]`: annulla il timer e nasconde il tooltip |
| 3502 | `document` `keydown` | Scorciatoie (tabella sotto) |
| 3513 | `document` `keydown` | Invio con `#modalOverlay` aperto → `saveCiclo()` |
| 3645 | `document` `DOMContentLoaded` | Aggancia il `blur` di `#f-title` per l'auto-categorizzazione |
| 5591 | `document` `change` | `#f-durata`: mostra `#f-durata-custom` (con focus) se il valore è `custom` |
| 5734 | `document` `click` | Delega sui `.pf-opt` di `#pianificaOverlay` → `pfSelectQuando` / `pfSelectRip` |
| 6744 | `#bpSlotPanel` `click` | Click sullo sfondo del pannello → `bpSlotClose()` |
| 4416–4429 | `.content` `touchstart/touchmove/touchend` | Pull-to-refresh (agganciati da `initPullToRefresh` all'avvio) |

Non ci sono listener su `window` (nessun `resize`, nessun `hashchange`): la scelta mobile/desktop viene fatta con `window.innerWidth <= 768` al momento di ogni render.

Gli altri gestori sono `onclick`/`oninput`/`onchange`/`onkeydown` inline nell'HTML (statico e generato): richiedono che tutte le funzioni e le variabili `settimanaOffset`, `meseOffset`, `areesWeekOffset` siano globali.

### Timer

| Riga | Tipo | Effetto |
|---|---|---|
| 3684 | `setInterval` 5 min | `retryFailedSyncs` (avviato da `initGcal`) |
| 3697 | `setTimeout` 800 ms ricorsivo | `_tryInitGis` finché la libreria Google non è caricata |
| 2315 | `setTimeout` 300 ms | Debounce della ricerca |
| 3285 / 3292 | `setTimeout` 3200 / 300 ms | Chiusura automatica e rimozione dei toast |
| 3322 | `setTimeout` 400 ms | Ritardo del tooltip |
| 3526 | `setTimeout` 1200 ms | Toast dei cicli auto-escalati all'avvio |
| 6140 | `setTimeout` 250 ms | Apertura automatica del wizard Battle Plan |
| 6933 | `setTimeout` 400 ms | Wizard della settimana successiva dopo la review |
| 4306, 4645 | `setTimeout` 600 ms | Pressione lunga sulle card → modale |

### Sequenza di avvio (ordine di esecuzione dello script)

1. Costanti, `db = createClient(...)`, `state` (legge localStorage, chiama `getWeekNumber`).
2. Riga 1917: sottoscrizione del canale realtime `cicli-changes`.
3. Listener `click`, `mouseover`, `mouseout`, i due `keydown`.
4. Riga 3522: `applyTheme()`.
5. Riga 3523: `loadAll()` → (`renderSkeleton` se matrice) → cicli + persone → categorie → `reloadWeekData()` → `loadAgendaOverrides()` (sonde colonne, `loadRitualiCompletati()`, override) → `loadBattlePlan()` → `render()`.
6. Al termine di `loadAll`: toast di auto-escalation, `initGcal()` (`loadGcalTokenFromDB`, `updateGcalButton`, `setInterval` dei retry, `_tryInitGis`), `initPullToRefresh()`.
7. Riga 3751 (sincrono, prima che `loadAll` finisca): `checkImplicitCallback()`.
8. Listener `DOMContentLoaded`, `change`, `click` delegato Pianifica, click su `#bpSlotPanel`.
9. Riga 7120: sottoscrizione del canale realtime `bp-changes`.

### Scorciatoie da tastiera

| Tasto | Effetto | Condizione |
|---|---|---|
| `Escape` | Toglie `open` al primo `.modal-overlay.open` in ordine di DOM, senza passare dalle funzioni di chiusura (`editingId`, `_pfCicloId` non vengono azzerati) | un overlay aperto |
| `←` / `→` | `changeWeek(-1)` / `changeWeek(1)` con `preventDefault` | nessun overlay aperto; vale anche con il focus in un campo di testo |
| `Cmd/Ctrl + K` | `openModal()` (nuovo ciclo) | nessun overlay aperto |
| `Cmd/Ctrl + P` | `openPlaudModal()` | nessun overlay aperto |
| `Cmd/Ctrl + F` | Focus e selezione di `#searchInput` | nessun overlay aperto |
| `Invio` | `saveCiclo()` | `#modalOverlay` aperto e bersaglio diverso da `TEXTAREA` e `SELECT` (vale anche nel campo persone) |
| `Backspace` / `Escape` nel campo persone | Toglie l'ultimo chip / chiude il menu (`onPersonaChipKey`) | focus in `#personaChipInput` |

---

## Id del DOM letti dalla logica

Id (e selettori) da cui le funzioni `dati`/`misto`/`ui` leggono un VALORE. Se il redesign li rinomina o li sposta, la funzione indicata smette di funzionare.

| Id / selettore | Letto da | Valori ammessi |
|---|---|---|
| `#apf-colors .color-swatch.selected` (`data-color`) | `saveNewPersona` | uno dei 10 colori; default `#3d7fff` |
| `#apf-nome` | `saveNewPersona` | testo, obbligatorio |
| `#apf-ruolo` | `saveNewPersona` | testo, facoltativo |
| `#bprev-note` | `bpChiudiSettimana` | testo libero |
| `#bps-durata` | `bpSlotConfirm`, `bpSlotOpen` | `15, 30, 45, 60, 90, 120, 180, 240` |
| `#bps-giorno` | `bpSlotConfirm` | le 7 chiavi di `GIORNI` + `settimana` (opzioni generate) |
| `#bps-ora` | `bpSlotConfirm` | `HH:MM` o vuoto |
| `#bpw-cat` | `bpwSetCat` (via `onchange`) | `''` o slug categoria |
| `#bpw-search` | `bpwSetQuery` (via `oninput`) | testo |
| `#catf-nome` | `saveCatForm` | testo, obbligatorio |
| `#claude-key-input` | `saveApiKey` | deve iniziare con `sk-ant-` |
| `#f-cat` | `saveCiclo`, `setModalCtx`, `catOptionEsiste` | slug builtin del contesto o `custom_<id>` (opzioni generate da `renderCatOptions`) |
| `#f-date` | `saveCiclo` | data ISO o vuoto → `due_date` |
| `#f-durata` | `pfDurataMinuti`, listener `change` | `'', 15, 30, 45, 60, 90, 120, 180, custom` |
| `#f-durata-custom` | `pfDurataMinuti` | intero, limitato a 5–480 |
| `#f-fascia-oraria` | `saveCiclo` | `'', mattina, pomeriggio, sera` |
| `#f-giorno-settimana` | `saveCiclo` | `''` o una chiave di `GIORNI` |
| `#f-macro-area` | `saveCiclo`, listener `blur` di `#f-title` | `''` o una delle 9 macro aree (testo dell'opzione = valore) |
| `#f-note` | `saveCiclo`, listener `blur` di `#f-title` | testo |
| `#f-ora-inizio` | `confermaPianificazione` | `HH:MM`; obbligatorio per `giornaliera` (sta nel mini-modale Pianifica, nonostante il prefisso `f-`) |
| `#f-scheduled-date` | `saveCiclo` | data ISO; vuoto → oggi |
| `#f-scheduled-time` | `saveCiclo` | `HH:MM` o vuoto |
| `#f-title` | `saveCiclo`, `q2PianificaOra`, listener `blur` | testo, obbligatorio |
| `#f-week` | `saveCiclo` | intero 1–53; vuoto → settimana selezionata |
| `#personaChipInput` | `onPersonaChipInput` (via `oninput`), `onPersonaChipKey` | testo |
| `#pf-data-specifica` | `pfDataBase`, `confermaPianificazione`, `pfSelectQuando` | data ISO, obbligatoria con QUANDO = `specifica` |
| `#pf-fascia` | `confermaPianificazione` | `mattina, pomeriggio, sera` |
| `#pf-giorno` | `confermaPianificazione` | una chiave di `GIORNI` |
| `.pf-opt[data-quando]` | listener `click` delegato → `pfSelectQuando` | `questa, prossima, mese1, mese3, specifica` |
| `.pf-opt[data-rip]` | listener `click` delegato → `pfSelectRip` | `nessuna, giornaliera, settimanale, mensile, trimestrale` |
| `.plaud-item-check:checked` (`data-idx`) | `importPlaudSelected` | indice in `plaudExtracted` |
| `#plaud-date-<idx>` | `importPlaudSelected` | data ISO o vuoto |
| `#plaud-transcript` | `analyzePlaud` | testo, obbligatorio |
| `#postpone-custom-date` | `doPostponeCustom` | data ISO, obbligatoria |
| `.q-pick-btn[data-q]` | `selectQ` | `1, 2, 3, 4` |
| `#searchInput` | `onSearchInput` (via `oninput`), `clearSearch`, scorciatoia Cmd+F | testo |
| `.park-search` | `renderParcheggio` (`oninput`) | testo |

Valori non letti dal DOM ma da variabili di modulo, da non dimenticare nel nuovo modale: quadrante (`selectedQ`), contesto del ciclo (`modalCtx`), persone (`_modalPersone`), id in modifica (`editingId`), emoji e contesto della categoria (`_catFormEmoji`, `_catFormCtx`), fascia del pannello slot (`_bpsFascia`), scelte della review (`_bpRevScelte`).

Id presenti nell'HTML ma mai usati dallo script: `#searchBar`, `#fabBtn`, `#hamburgerBtn`, `#drawer-gcal-item`, `#drawer-theme-label`, `#bps-title`, `#bps-ok`.

---

## Incoerenze e trappole rilevate nel codice

- **Matrice mobile distruttiva**: `renderMatrixMobile` (4709) svuota `#view-matrix`. Se poi la finestra supera i 768 px, `renderMatrix` non trova più `#qN-list` e la matrice resta quella mobile fino al ricaricamento della pagina.
- **Date in UTC**: `todayISO` (3573) e `addDays` usano `toISOString()`. Fra mezzanotte e l'1–2 di notte (ora italiana) "oggi" è ancora ieri. In `renderSettimana` (4002, 4029) le chiavi dei giorni nascono da una mezzanotte locale convertita in UTC, quindi sono arretrate di un giorno: la settimana mostrata va da domenica a sabato. `toISODate` (5620) invece è locale.
- **Anno e settimana 53**: `state.year` è l'anno di calendario e non è persistito, `state.week` sì; `changeWeek` salta la settimana 53; `saveCiclo` riscrive `year = state.year` anche modificando un ciclo di un altro anno.
- **Sync Google di un ciclo nuovo**: `saveCiclo` passa a `syncCicloToGcal` il payload senza `id` (3042): l'evento viene creato ma `google_event_id` non viene salvato sulla riga, e il link in descrizione è `#ciclo=undefined`.
- **`.catch()` sul query builder di Supabase** (3878, 4457): da verificare che la versione caricata dal CDN (`@supabase/supabase-js@2`, non bloccata) lo supporti; in caso contrario quelle righe lanciano.
- **Override di altre settimane non caricati**: `agendaSlotForWeek` guarda solo `state.agendaOverrides` (settimana selezionata): il wizard aperto sulla settimana successiva non vede gli override di quella settimana.
- **Guida diversa dal codice**: la Guida (3382) dice "Q2 entro 30 giorni → Q1, Q4 entro 14 → Q3" (coerente) ma anche che un ciclo riaperto "torna nella settimana corrente": `flipDone` non cambia `week`.
- **CLAUDE.md non allineato**: cita `assegnaGiornoCiclo()` (inesistente), dice che la ricorrenza non è cablata e che l'auto-categorizzazione avviene alla creazione dei soli cicli `lavoro`; "Da pianificare" non è raggruppato per quadrante ma ordinato.
- **Escape e wizard**: `#bpSlotPanel` non è un `.modal-overlay`: con il pannello aperto Escape chiude il wizard sottostante e lascia aperto il pannello.
- **Apici nei nomi**: i chip e il menu persone generano `onclick="…('<nome>')"` con `escHtml`, che non fa l'escape degli apici: un nome con apostrofo rompe il gestore.


---

## Redesign v2: dove è finita ogni funzione

`index.html` (v2) è fatto di due parti nello stesso `<script>`:

1. **Parte 1 — Logica**: il codice di `index.legacy.html` così com'è, meno le funzioni di solo disegno elencate qui sotto.
2. **Parte 2 — Interfaccia v2**: le nuove viste (Oggi, Pianifica, Tutto, Altro), le azioni rapide, i fogli.

### Funzioni tolte perché sostituite (76)

| Vecchia funzione | Sostituita da |
|---|---|
| `render`, `updateHeader`, `updateMobileNav`, `renderViews`, `renderSkeleton` | `render` / `disegna`, `renderSkeleton` (v2) |
| `switchView`, `changeWeek` | `switchView` (traduce i vecchi nomi di vista), `vai`, `changeWeek` (ora attraversa bene l'anno), `vaiAData`, `tornaAOggi` |
| `renderSidebar`, `renderSummary`, `renderEscalationNotices`, `openDrawer`, `closeDrawer`, `updateDrawer` | barra laterale e intestazione fisse; «In scadenza» in Oggi; contatori nel foglio Filtri |
| `renderOggi`, `makeMobileCard`, `initSwipe`, `makeRitualeCard`, `renderRitualiBlock` | `vistaOggi`, `riga`, swipe globale (`touchstart/move/end`), sezione Routine |
| `renderSettimana`, `renderBattlePlan`, `bpHeader`, `bpProgressBar`, `bpRenderVuoto`, `bpGriglia`, `makeBpCard` | `vistaPianifica` → `pianSettimana`, `pianSettimanaColonne`, `statoPiano`, `righeGiorno` |
| `renderMese` | `pianMese` (puntini per tipo, `caricaOverrideMese`) |
| `renderAgenda`, `renderAgendaPianificati`, `makeAgendaCard`, `makeAgendaAvatars`, `switchAgendaSub`, `agendaWeekSubtitle` | `pianAgenda` + `agganciaAgenda` (il drag & drop usa ancora `attachDropZone` / `moveCicloInAgenda`) |
| `renderAgendaDaPianificare`, `makeBigCard`, `sortByQThenCreated` | accordion «Senza data» in fondo a Pianifica |
| `renderMatrix`, `renderMatrixMobile`, `collapseBox`, `renderList`, `makeCicloCard`, `makeCompactCard`, `initCompactSwipe`, `makeGiornalieroBadge`, `makeGiornoBadge` | `vistaTutto` → `tuttoLista` (raggruppa per Tipo / Categoria / Area / Persona), `tuttoMatrice`, `riga` |
| `renderAree` | Lista raggruppata per Area + chip Area nei Filtri |
| `renderPersone`, `renderPersonaDetail`, `renderAddPersonaForm`, `apfSelectColor`, `saveNewPersona` | `tuttoPersone`; elenco e `aggiungiPersona` in Impostazioni |
| `renderParcheggio` | `vistaAttesa` («In attesa»), `azioneRiattiva`, `azioneElimina` |
| `renderStorico` | `vistaFatte` |
| `renderGuida`, `toggleGuidaSection` | `vistaGuida` (usa ancora `GUIDA_SECTIONS`) |
| `onSearchInput`, `clearSearch`, `highlightTerm`, `renderSearchResults` | ricerca in Tutto (`cicliFiltrati`, `evidenzia`) |
| `toggleCatForm`, `selectCatEmoji`, `setCatCtx`, `saveCatForm`, `editCatInline` | `apriCategoria`, `salvaCategoria` (icona Tabler salvata in `categorie.emoji` come `ti-…`) |
| `toggleMoreOpts`, `openMoreOpts`, `closeMoreOpts` | stesse funzioni, riscritte per il nuovo foglio |
| `showToast`, `_dismissToast` | `showToast` con «Annulla» (5 secondi) |
| `applyTheme`, `toggleTheme` | stesse funzioni: `data-theme` su `<html>`, `prefers-color-scheme` al primo avvio |
| `updateGcalButton`, `openGcalModal` | stesse funzioni, ridisegnate |
| `initPullToRefresh` | stessa funzione, sul nuovo contenitore |
| `openBpReview`, `bpChiudiSettimana` | review in due passi con sei scelte per ogni cosa non fatta |
| `bpStampaPdf` | «Stampa la settimana»: un foglio A4, funziona anche senza piano |

### Ritocchi alla logica rimasta (tutti in `build`, uno per uno)

- **Annuale**: `RIPETIZIONE_MESI.annuale = 12`; `ricadeInSettimana`, `bpEricorrente` e il modale Pianifica leggono `ripetizioneDi(c)`. Il valore `annuale` è salvato in `cicli.ricorrenza` con `pianificato_ripetizione = 'nessuna'`, perché il CHECK sul database non ammette `annuale` (vedi sotto).
- **Avvio** spostato in fondo; la tastiera chiama `apriNuovo`, `salvaDalFoglio`, `focusRicerca`; le frecce cambiano settimana solo in Pianifica e non mentre si scrive.
- **Parole**: i testi di toast, wizard e modali seguono la mappa del linguaggio; tolte le emoji dalle stringhe.
- `openModal` non mette più il fuoco sul titolo quando apre un dettaglio (su telefono saltava su la tastiera).

### Comportamenti nuovi

- **Fatto su una cosa che si ripete** (settimanale, mensile, trimestrale, annuale): `chiudiERicrea` chiude la riga e ne crea una nuova con data (e scadenza, se c'è) spostate di un passo. Prima restava aperta la stessa riga. Le routine di ogni giorno continuano a usare `rituali_completati`.
- **Domani**: `azioneDomani` scrive l'override del giorno dopo; per le cose non ricorrenti sposta anche `pianificato_data`, e aggiorna la riga del piano se c'è.
- **Lascia stare**: tipo Q4 + in attesa. Nella review sostituisce «Chiudi comunque».
- **Appuntamenti**: `caricaEventi` legge il calendario principale di Google (sola lettura) per Oggi, Pianifica e il wizard. `mettiPianoSuCalendar` crea un evento per ogni riga del piano con un'ora.
- Spostare una riga in Agenda aggiorna anche la sua riga nel piano della settimana.

### Da fare sul database

`supabase_migration_annuale.sql` non è ancora nel repo né applicata: allargare il CHECK di `cicli.pianificato_ripetizione` con `'annuale'`. Finché non c'è, l'annuale funziona tramite `cicli.ricorrenza`.
