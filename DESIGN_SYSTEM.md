# Cicli Aperti — Design system

Riferimento per il redesign. La pagina `design-preview.html` (in `privata/`, solo in locale: ha dati veri) mostra tutto quello che è scritto qui, nei due temi; se i due documenti non coincidono, vale l'anteprima e questo file va corretto.

Punto di partenza: `ui-ux-pro-max` (stile piatto, verde acqua + arancio d'azione, Plus Jakarta Sans). Affinato con `mobile-app-ui-design` (regola 60/30/10, griglia a 4, due pesi, azione principale nella zona del pollice) e passato quattro volte da `design-critique`.

## Principi

1. **Si capisce senza spiegazioni.** Parole di tutti i giorni; il termine del metodo resta come suggerimento per chi lo conosce.
2. **Calma.** Il 60% dello schermo è sfondo neutro, il 30% testo, il 10% colore. Niente gradienti.
3. **Completare dà soddisfazione.** La spunta è l'unico momento animato in modo espressivo.
4. **Un'azione principale per schermata**, in basso, a portata di pollice.
5. **Il colore non è mai l'unico segnale.** Ogni tipo ha icona + parola; lo stato attivo ha una forma, non solo una tinta.

## Mappa del linguaggio

| Termine OSM | In app | Sottotitolo / aiuto | Suggerimento per chi conosce il metodo |
|---|---|---|---|
| Q1 — Crisi | **Subito** | Va fatta oggi | Q1 · urgente e importante |
| Q2 — Qualità | **Importante** | Scegli quando | Q2 · importante, non urgente |
| Q3 — Inganno | **Delega** | La fa un altro | Q3 · urgente, non importante |
| Q4 — Spreco | **Lascia stare** | Può aspettare | Q4 · né urgente né importante |
| Cicli aperti | **Cose aperte** | — | Cicli aperti |
| Ciclo (singolo) | **cosa da fare** | nei bottoni basta «Aggiungi» | Ciclo |
| Armadio | **Tutto** (voce di menu) → pagina «Cose aperte» | Tutte le cose aperte | Armadio dei cicli |
| Battle Plan / Business Plan settimanale | **Piano della settimana** · il foglio stampato si chiama «Business Plan Settimanale» · banner «È ora del Business Plan» | — | Business Plan settimanale |
| Wizard del piano | **Prepara la settimana** | — | — |
| Review di chiusura | **Chiudi la settimana** | — | Review |
| Parcheggio / parcheggiare | **Un giorno** / «Lascia stare» la porta lì | Fuori dalla vista, non sparisce | Parcheggio |
| Rituali | **Routine** | — | Rituali quotidiani |
| Google Calendar | **Calendario** | solo per Google Calendar | — |
| Da pianificare | **Da piazzare** | non ha ancora un giorno | — |
| Focus del giorno | **Le tue 3** | Cosa porti a casa oggi? | — |
| Regola dei 2 minuti | **Rapida** (≤ 15 min) · «Ci vogliono 2 minuti? Falle ora.» | — | — |
| Delega con follow-up | **Da controllare** · «Chiedi a Marco: …» | Quando controlli? | Q3 delegato |
| Piano al 130 % | **Pianificato: N cose / Xh** · «Pianificane circa il 30% in più di quante pensi di fare» | se ne chiude circa l'80 % | 130 → 80 |
| Slot cuscinetto | **Cuscinetto** · «per gli imprevisti» | [Urgenza arrivata] [Riempi] | — |
| Sotto-cicli | **Passi** · «2/5 passi» · azione **Scomponi** | «Grossa: scomponila in passi» da 4 ore | — |
| Appuntamento con te stesso | **Blocca in agenda** / Togli dall'agenda | evento su Google Calendar | — |
| Invio al coach | **Invia il piano** · «Piano inviato al coach il 17/10» | PDF + email o condivisione | — |
| Motivi della review | **Perché?** · «Questa settimana ti hanno rallentato soprattutto: …» | suggerimenti Importanti | — |
| Pianifica (azione) | **Pianifica** | Scegli un giorno | — |
| Posticipa +1g | **Domani** | — | — |
| Macro area | **Area** · le 8 di i-Time (Management, Marketing, Vendite, Amministrazione, Produzione, Ricerca e sviluppo, Famiglia / cose personali, Formazione); la categoria sta sotto l'area | «Dalla categoria» | Macro area |
| Q2 in agenda inderogabile | **Importante bloccata** · lucchetto · «È un'attività importante bloccata. La sposti davvero?» | [Sposta comunque] / [Lasciala] | Q2 inderogabile |
| Esercizio Q2 | **Esercizio Q2 · prossimi 3 mesi** | «Questa è una categoria: rendila un'attività a cui dare una data» | Esercizio focus sul Q2 |
| Esercizio dei cicli aperti | **Svuota la testa** · «Scrivi tutto, al resto pensi dopo» · «Spacchettala» | una colonna per area | Matrice dei cicli aperti |
| Depennare il piano stampato | **Riporta il foglio** (primo passo di Chiudi la settimana) | «Cose nuove che hai scritto sul foglio» | — |
| Lavoro delegato che torna | **Mi è tornata indietro** («Tornata» nello swipe) | «Deleghe tornate indietro: N» | Q3 |
| Contesto | **Lavoro / Personale** | — | — |
| Storico | **Fatte** | — | — |
| Import Plaud | **Da una registrazione** | — | Plaud |

Regole di scrittura: frasi brevi, verbo all'inizio nei bottoni («Aggiungi», «Prepara la settimana»), niente maiuscole gridate, niente sigle. I messaggi dicono cosa è successo e cosa si può fare («Non salvata: sei senza rete · Riprova»).

«Blocca in agenda» è l'unica eccezione alla parola «Agenda»: l'ha chiesta il coach e indica un evento su Google Calendar.

Nomi fissati: la voce di menu dell'armadio è «Tutto» e il titolo della pagina è «Cose aperte» (in modalità semplice entrambi diventano «Cose»). Pianifica ha solo **Settimana** e **Mese**: l'agenda a fasce sta dentro la Settimana, e le fasce compaiono solo quando almeno una cosa del giorno ha un momento o un'ora. La parola «Agenda» non si usa più nell'interfaccia; «Calendario» si usa solo per Google Calendar.

## Colori

Token semantici. Nell'app stanno su `:root` (chiaro) e `:root[data-theme="dark"]`.

| Token | Chiaro | Scuro | Uso |
|---|---|---|---|
| `--bg` | `#F5F7F6` | `#0D1312` | sfondo della pagina |
| `--surface` | `#FFFFFF` | `#161D1C` | card, fogli, barre |
| `--surface-2` | `#ECF0EE` | `#202A28` | binari, stati hover, campi disattivati |
| `--surface-3` | `#FFFFFF` | `#34413E` | elemento rialzato dentro `surface-2` (voce attiva del selettore) |
| `--border` | `#DFE5E2` | `#2A3533` | filetti e contorni decorativi |
| `--border-strong` | `#84918C` | `#71807B` | contorni di controlli (≥ 3:1) |
| `--text` | `#14201D` | `#ECF1EF` | titoli e testo |
| `--text-2` | `#46544F` | `#B7C2BE` | testo secondario |
| `--text-3` | `#5F6C67` | `#93A09B` | testo di servizio, segnaposto |
| `--done-title` | `#5F6C67` | `#B7C2BE` | titolo barrato di una cosa fatta |
| `--done-meta` / `--done-opacity` | `#5F6C67` / `.6` | `#93A09B` / `1` | dettagli e ora di una cosa fatta |
| `--primary` | `#0F766E` | `#2DD4BF` | bottone principale, spunta, avanzamento |
| `--primary-deep` | `#0A544E` | `#15988A` | spessore del bottone principale |
| `--primary-ink` | `#0B5F58` | `#5EEAD4` | testo e icone color primario |
| `--primary-soft` | `#DDF2EE` | `#12332F` | fondo tenue (bottone secondario, voce attiva del menu) |
| `--on-primary` | `#FFFFFF` | `#04201D` | testo sopra `--primary` |
| `--q1-mark` / `--q1` / `--q1-soft` | `#D92D20` / `#B42318` / `#FFF4F3` | `#F97066` / = / `#3A1D1A` | **Subito**: casella, puntini / testo / fondo della riga. Nel PDF anche «!» davanti al titolo |
| `--q2-mark` / `--q2` / `--q2-soft` | `#0F766E` / `#0B5F58` / `#DDF2EE` | `#2DD4BF` / = / `#12332F` | **Importante** (= primario) |
| `--q3-mark` / `--q3` / `--q3-soft` | `#2563EB` / `#1D4ED8` / `#E8EFFE` | `#93B4FF` / = / `#1B2A4A` | **Delega** |
| `--q4-mark` / `--q4` / `--q4-soft` | `#8A9692` / `#5F6C67` / `#ECF0EE` | `#8A9692` / = / `#202A28` | **Lascia stare** (grigio) |
| `--evt-mark` / `--evt` / `--evt-soft` | `#7C3AED` / `#6D28D9` / `#F3EEFE` | `#B9A2F7` / = / `#261E3D` | **Appuntamento** (Google Calendar): cerchio, ora, fondo |
| `--pensa` / `--pensa-bordo` / `--pensa-ink` | `#FDF6D8` / `#E3C65A` / `#6B5300` | `#2E2810` / `#7A6420` / `#F2D675` | colonna gialla «In settimana · pensaci dopo» |
| `--danger` / `--danger-soft` | `#B42318` / `#FCE8E6` | `#F98B82` / `#3B1A17` | eliminare, errori |
| `--warn` / `--warn-soft` | `#92500A` / `#FBEFD5` | `#F5C261` / `#3A2C10` | avvisi |
| `--inverse-bg` / `--inverse-text` / `--inverse-accent` | `#14201D` / `#FFFFFF` / `#5EEAD4` | `#ECF1EF` / `#14201D` / `#0B5F58` | toast |
| `--scrim` | `rgba(20,32,29,.42)` | `rgba(0,0,0,.6)` | velo dietro i fogli |
| `--ring` | `#0F766E` | `#5EEAD4` | anello di focus, 2px con stacco 2px |

I sei colori portanti: primario, Subito, Delega, testo, sfondo, superficie.

### Colori = priorità (v6, 20/10/2026)

Ogni cosa porta il colore del suo tipo, uguale nell'app (chiaro e scuro) e nel foglio PDF:

- **La casella da spuntare** è un quadratino (raggio 7) con il bordo 2px del colore del tipo (`--qN-mark`); spuntata si riempie dello stesso colore. Gli **appuntamenti** hanno un **cerchio** viola al posto del quadratino, su fondo `--evt-soft`.
- **Subito** ha anche il fondo della riga `--q1-soft`. Nessuna barra colorata laterale, da nessuna parte.
- Due livelli per colore: `-mark` è il colore esatto per i segni (casella, puntino, cerchio, ≥ 3:1); il token senza suffisso è per il **testo** (≥ 4,5:1 su tutte le superfici). In chiaro sono diversi perché alcuni colori dei segni non arrivano a 4,5:1 come testo (Subito `#D92D20` sul suo fondo: 4,48; Lascia stare `#8A9692`: 3,06). In scuro coincidono.
- Verificato con a11y-audit (`contrast_checker.py`): tutte le coppie di testo passano 4,5:1 nei due temi; i segni passano 3:1. Le uniche coppie sotto sono la casella di Lascia stare su fondo Subito o appuntamento, combinazioni che non esistono.
- Legenda (testata di Pianifica a colonne e foglio PDF): quadratino rosso col fondo rosato «Subito», verde «Importante», blu «Delega», grigio «Lascia stare», cerchio viola «Appuntamento».

Regole:
- «Importante» usa il colore del marchio di proposito: è il posto dove il metodo vuole farti stare.
- Il rosso compare solo su Subito e sui ritardi. Una cosa fatta resta barrata e attenuata; la casella spuntata tiene il colore del tipo.
- Tutte le coppie testo/fondo usate stanno a 4,5:1 o più, i contorni dei controlli a 3:1 o più, in entrambi i temi (verificato in automatico sull'anteprima).
- Rispetto alla proposta di `ui-ux-pro-max`: sfondo e bordi resi neutri (erano verde acqua pieni, troppo presenti per un'app calma) e primario scurito da `#0D9488` a `#0F766E` perché il testo bianco sopra non arrivava a 4,5:1.

## Tipografia

- Testo: **Plus Jakarta Sans**, pesi 500 e 700.
- Cifre: **JetBrains Mono** 500, con `tabular-nums`. Solo per ore (`09:30`), date numeriche (`13/10`) e conteggi (`2/6`). Le date a parole («mar 13 ott») restano nel font del testo: in mono sembravano codice.

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Plus+Jakarta+Sans:wght@500;700&display=swap" rel="stylesheet">
```

I token sono in `rem` (28px = 1.75rem…): «Dimensione testo» in Impostazioni porta la radice a 100 / 112 / 125 % e tutto il testo scala insieme. Ogni layout deve reggere 125 % a 375px senza scroll orizzontale.

| Livello | Token | Corpo / interlinea | Peso | Uso |
|---|---|---|---|---|
| Display | `--fs-display` | 28 / 34, −0.02em | 700 | titolo della schermata («Oggi») |
| Title | `--fs-title` | 20 / 26, −0.01em | 700 | titoli di sezione, fogli, empty state |
| Body | `--fs-body` | 16 / 24 | 500 (700 se aperta) | titolo della cosa da fare, bottoni, campi |
| Label | `--fs-label` | 14 / 20 | 500 o 700 | note, intestazioni di gruppo, chip, selettore |
| Caption | `--fs-caption` | 12 / 16 | 500 o 700 | riga dei dettagli, etichette del menu |

Mai sotto i 12px. I campi di testo restano a 16px (sotto, iOS ingrandisce la pagina al tocco).

## Spaziature, raggi, ombre, movimento

| Spaziatura | `--sp-1` | `--sp-2` | `--sp-3` | `--sp-4` | `--sp-5` | `--sp-6` | `--sp-7` |
|---|---|---|---|---|---|---|---|
| px | 4 | 8 | 12 | 16 | 24 | 32 | 48 |

Margine laterale della pagina 16. Tra elementi dello stesso gruppo 8; tra gruppi 24; tra sezioni 48.

| Raggio | Valore | Uso |
|---|---|---|
| `--r-sm` | 8 | voce del selettore, riquadro icona |
| `--r-md` | 12 | bottoni, campi, toast, selettore |
| `--r-lg` | 16 | gruppi/card, bottone «+» |
| `--r-xl` | 24 | angoli alti del bottom sheet |
| `--r-full` | 999 | chip, spunta, pastiglie |

| Ombra | Chiaro | Scuro |
|---|---|---|
| `--shadow-1` (card) | `0 1px 2px rgba(20,32,29,.06)` | solo contorno `--border` |
| `--shadow-2` (toast, «+») | `0 4px 12px rgba(20,32,29,.08), 0 1px 2px rgba(20,32,29,.05)` | contorno + `0 6px 16px rgba(0,0,0,.4)` |
| `--shadow-3` (bottom sheet) | `0 16px 40px rgba(20,32,29,.16), 0 2px 6px rgba(20,32,29,.06)` | contorno + `0 20px 48px rgba(0,0,0,.55)` |

Le ombre sono tinte col colore del testo, mai nero puro. Nel tema scuro la profondità la danno le superfici più chiare, non le ombre.

Movimento: `--t-fast` 120ms (pressione), `--t-base` 200ms (cambi di stato), `--t-slow` 320ms (spunta). Curve `--ease-out: cubic-bezier(.2,.8,.2,1)` e `--ease-pop: cubic-bezier(.3,1.6,.5,1)` per il rimbalzo della spunta. Con `prefers-reduced-motion` tutto diventa istantaneo.

Misure fisse: area di tocco minima `--tap` 44px; barra in basso `--nav-h` 56px + `env(safe-area-inset-bottom)`.

## Componenti

### Bottoni
| Variante | Aspetto | Quando |
|---|---|---|
| Primario `.btn-primary` | fondo `--primary`, testo `--on-primary`, spessore 3px `--primary-deep` (ombra piena, non occupa spazio) che si schiaccia al tocco | l'azione della schermata, una sola |
| Secondario `.btn-secondary` | fondo `--primary-soft`, testo `--primary-ink` | alternativa utile («Domani», «Pianifica») |
| Ghost `.btn-ghost` | senza fondo, testo `--text-2`; `.btn-danger` per eliminare | annullare, azioni rare |
| Icona `.btn-icon` | 44×44 tondo, sempre con `aria-label` | chiudere, «altre azioni» |

Altezza 48 (16/700); `.btn-sm` 44 (14/700). Disattivato: fondo `--surface-2`, testo `--text-3`, niente spessore. Niente bottoni con sola icona per azioni che un nuovo utente non conosce.

### Card ciclo
Le righe stanno dentro un gruppo (`.group`: superficie, raggio 16, filetto tra le righe), non sono card separate.

- **Compatta** (`.item`): spunta 44×44 · titolo 16/22 fino a due righe, poi tagliato · riga dei dettagli 12px con tipo (icona + parola) e un solo dato in più · a destra l'ora in mono. Altezza minima 64. Tutta la riga è toccabile e non ha freccia: la freccia compare solo sulla riga aperta, per richiuderla.
- **Espansa** (`.item.is-open`): si apre sul posto. Titolo in 700 senza limite di righe, nota in 14px, righe «quando» e «con chi» con icona, poi le azioni: **Fatto** (primario), **Domani** (secondario), **⋯** per modifica, metti in attesa, elimina. Tre azioni al massimo in vista.
- **Fatta** (`.is-done`): titolo barrato in `--done-title`, tipo e ora in `--done-meta`. Nel tema scuro stanno un livello più su che nel chiaro (titolo su testo-2, dettagli su testo-3 senza trasparenza): restano sotto le cose da fare ma si leggono.
- **In ritardo** (`.is-late`): ora in `--q1` e la scritta «in ritardo di N giorni». Mai solo il colore.

### Chip filtro
Pillola alta 36 con area di tocco estesa a 44. Spento: superficie + bordo. Acceso: fondo `--text`, testo `--bg`, peso 700. Icona 16 e conteggio in mono facoltativi. In fila scorrono in orizzontale fino al bordo dello schermo (la fila esce dal margine di 16, così l'ultimo chip tagliato fa capire che si scorre); quando sono una scelta obbligata dentro un modulo vanno a capo (`.chips-wrap`) così nessuna opzione resta nascosta.

### Segmented control
Binario `--surface-2` raggio 12, padding 4; voci alte 44. La voce attiva è `--surface-3` con ombra 1 e peso 700. Da 2 a 4 voci, mai di più.

### Bottom nav
Quattro voci: **Oggi · Settimana · Tutto · Altro** (v6; «Settimana» apre Pianifica; modalità semplice: Oggi · Cose). Icona 22 + etichetta 12 sempre visibile. La voce attiva ha una pastiglia `--primary-soft` 56×28 dietro l'icona, testo `--primary-ink` 700 e `aria-current="page"`. Altezza 56 + safe area.

### Campo fisso (telefono, v6)
Sopra la barra in basso, sempre visibile: campo «Cosa hai in testa?» (44px, cresce fino a 120px), microfono (se c'è la dettatura) e **[+]** 44×44 `--primary`. Invio salva in Tutto come Importante senza data; più righe = più cose (Maiusc+Invio va a capo). Con il campo vuoto, [+] apre il foglio completo (Subito / Oggi / Con…). I toast stanno sopra il campo.

### Accordion
Intestazione alta 52: freccia che ruota di 90°, nome in 700 (con «oggi» accanto al giorno corrente), a destra barretta di avanzamento e conteggio `2/6` in mono. `aria-expanded` sul bottone. Oggi aperto di default.

### Checkbox con animazione di completamento
Cerchio da 26 dentro un'area da 44, bordo 2px `--border-strong`. Alla spunta, in 320ms: il cerchio si riempie di `--primary` e rimbalza (0.8 → 1.14 → 1), il segno si disegna (tratto SVG, 200ms con 80ms di ritardo), un anello si allarga fino a 2× e svanisce. Subito dopo il titolo si barra, l'avanzamento si aggiorna e compare il toast con «Annulla».

### Toast
Fondo invertito (`--inverse-bg`), raggio 12, altezza 52: icona · testo su una riga · azione in `--inverse-accent`. Sta 12px sopra la barra in basso, a tutta larghezza; il bottone **+** si alza per fargli posto. Dura 4 secondi. `role="status"`. Sempre con una via d'uscita: «Annulla» o «Riprova».

### Bottom sheet
Superficie con angoli alti da 24, maniglia 36×4, velo `--scrim` dietro. Titolo a domanda («Cosa devi fare?») e chiusura a destra. Un campo, la scelta del tipo (griglia 2×2: riquadro icona tinto, nome, una riga di aiuto; selezionato = bordo `--text` e fondo `--surface-2`), il «quando» a chip, il primario a tutta larghezza. Il resto dietro «Altre opzioni». Padding in basso 16 + safe area.

### Empty state
Cerchio da 64 `--primary-soft` con icona 30, titolo 20/700, una frase in 14px (massimo 30 caratteri per riga) e un bottone. Dice cosa è successo e cosa fare adesso; quello di fine giornata festeggia («Per oggi hai finito»).

### Altri
- **Campo di testo**: alto 52, bordo 1.5px `--border-strong`, raggio 12; a fuoco bordo `--primary` e alone `--primary-soft`.
- **Barra di avanzamento**: alta 8 (6 nella versione piccola), binario `--surface-2`, riempimento `--primary`.

### Inserimento a un campo
Il **+** apre un foglio con un solo campo grande («Cosa hai in testa?», corpo 20) e il microfono a destra se il browser ha la dettatura (Web Speech API, it-IT). Invio salva; Maiusc+Invio va a capo e ogni riga diventa una cosa. Sotto, tre chip spenti: Subito, Oggi, Con…. Predefinito: Importante, contesto attivo. Il toast «Aggiunta a Tutto · Importante» ha l'azione **Dettagli**.

### Oggi
Dall'alto: avviso del piano (venerdì) · Rimaste indietro · avanzamento · «La giornata» (appuntamenti e cuscinetti in ordine di ora) · Routine · **Le tue 3** (stellina `--q1` per entrare/uscire) · **Rapide** · **Da controllare** · «Il resto di oggi» chiuso · In scadenza · dopo le 18 una riga sola «Oggi N su M · Bella giornata. · N giorni di fila».

### Banner di Oggi (v5)
Uno alla volta, in quest'ordine: **incontro con il coach** («Hai l'incontro con il coach mer 21 ott alle 19:00 — invia il piano», icona `ti-user-check`, [Invia al coach]) da 48 ore prima; **«È ora del Business Plan»** dal momento fissato a domenica, [Prepara] [Stampa] [Invia al coach] (il bottone principale è Prepara se il piano non c'è, Stampa se c'è; i secondari su `--surface` per vedersi sul fondo `--primary-soft`). Poi, separati: **Esercizio Q2** e, su `--surface-2`, **«N appuntamenti sembrano un ciclo aperto»** [Guarda]. Ognuno si chiude per oggi con la X.

### Fogli nuovi (v5)
- **Il piano è pronto** (fine del wizard): due bottoni grandi a tutta larghezza (`.btn-grande`, alti 64, testo `--fs-title`): [Stampa il foglio] principale, [Invia al coach] secondario; sotto lo stato con `ti-circle-check` (fatto, `--primary-ink`) o `ti-circle-dashed`.
- **La sposti davvero?**: lucchetto in un cerchio `--q2-soft`, la cosa in un riquadro `--surface-2`, una frase sul metodo, chip del motivo, [Sposta comunque] ghost a sinistra e [Lasciala] principale a destra.
- **Riporta il foglio**: le righe sono bottoni grandi con un quadrato di spunta da 24 (pieno `--primary` quando spuntata, titolo barrato); il riquadro «Settimana (pensaci dopo)» ha fondo `--warn-soft` come il giallo del foglio.
- **Svuota la testa**: telefono una colonna per schermata con scroll-snap e ‹ 1 di 8 ›; computer griglia 4 × 2. Titolo dell'area con la sua icona e il numero di righe in mono.
- **Esercizio Q2**: tre trattini di avanzamento come nel wizard; chip delle voci che vanno a capo; avviso categoria su `--warn-soft` sotto il campo; calendario di 14 settimane con celle da 44px: pieno = tratteggio `--surface-2`, qualche appuntamento = sottolineatura `--warn-soft`, già preso = bordo `--q2`, scelto = pieno `--text` come i chip premuti; legenda sotto.
- **Questi sembrano cicli**: come «Trovate sul calendario», tre chip per riga; togliere dal calendario chiede sempre conferma.

### Appuntamenti (v5)
Titolo senza l'orario davanti; sotto «09:45–11:15 · Lavoro». Avvisi su righe proprie, in `--warn` a peso normale, una riga sola: `ti-alert-triangle` «si sovrappone a … e altri N» (e la riga ha un bordo sinistro da 3px `--warn`), `ti-clock-exclamation` «orario nel titolo diverso (10:00)». Con il coach: icona `ti-user-check` ed etichetta «Coach» su `--q3-soft`. La routine del mattino del Privato sta nell'accordion Routine, non nella giornata.

### Pianifica a colonne (computer ≥ 1100px, v6)
Testata: «Business Plan · Settimana N», ‹ date ›, «N cose · Xh · sett. scorsa F su T (P%)», legenda, a destra [Modifica il piano] [Stampa il foglio] [Invia al coach]. Poi la card «Per il coach» e le colonne: **Da pianificare** 250px (ricerca, chip Subito/Importante/Delega con il conteggio, avviso giallo «N senza giorno né data · Riordina in 10 minuti», elenco trascinabile) · **In settimana** 190px gialla («pensaci dopo») · **Lun–Ven** (Sab/Dom solo se hanno qualcosa) con totale ore in testa, appuntamenti e cose in ordine di ora, cuscinetti e spazi liberi tratteggiati, in fondo «+ Ciclo» e «+ Appuntamento». Si trascinano cose e appuntamenti; con la tastiera Alt + freccia sposta la cosa che ha il fuoco nella colonna accanto. Sotto i 1100px resta la vista a lista.

### Riordina (v6)
Schermo pieno, una cosa alla volta (le più vecchie prima): in alto «Interrompi», «Riordina», «12 / 92» e la barra; la carta con area, «aperta da N giorni», titolo in corpo display, nota. Quattro tasti grandi 2×2 (≥ 88px) col colore del tipo: Subito (questa settimana), Importante (poi chip Questa sett. / Prossima / Tra 1 mese / Tra 3 mesi / Data), Delega (foglio a chi + quando), Lascia stare. Sotto: È fatta · Spacchettala · Salta. In fondo il riepilogo. Ogni scelta ha il toast con Annulla; chiudendo si riprende dallo stesso punto.

### Sposta un appuntamento (v6)
Foglio «Sposta a»: chip Domani + giorni della settimana, campi Giorno / Ora / Durata, «Solo questa volta / Anche le prossime» se si ripete, avviso giallo se si sovrappone con [Usa … alle hh:mm] (primo spazio libero da adesso), «X riceve l'aggiornamento» se ci sono invitati (il bottone diventa «Sposta e avvisa»). Se lo organizza un altro: «Lo organizza X: chiedigli di spostarlo» + [Crea un promemoria].

### Per il coach (v6)
Card con bordo viola: «Per il coach», prossimo incontro e conto alla rovescia, quattro voci con quadratino spuntato dai dati (verde quando è fatta) e un bottone per quella aperta.

### Il foglio PDF (v6: a colori)
A4 a colori (stampa a colori come nel mockup; in scala di grigi le Subito si riconoscono dal «!» e dal fondo): testata con nome e settimana, «Fatte ____ / N», «Q2 spostate ____», legenda; riquadro giallo «Settimana (pensaci dopo)»; per giorno cerchio viola + ora viola per gli appuntamenti, quadratino col bordo del colore del tipo per le cose (Subito su fondo rosato `253,226,223` e «!»), cuscinetti tratteggiati con la riga da compilare; colonna destra «APPUNTI · NUOVE COSE EMERSE» a righe fino in fondo; piè di pagina «Stampato il … · Inviato a … il …» e «1 / 1». Un giorno non si spezza mai tra due pagine; testo ≥ 9 pt (anche in A5).

### Il foglio PDF (v5, sostituito)
Formato del piano i-Time, leggibile in bianco e nero: titolo «Business Plan Settimanale — Nome — Settimana N (gg/mm–gg/mm)»; riquadro «Settimana (pensaci dopo)» giallo chiaro (255, 244, 179) con bordo grigio; un blocco per giorno separato da una riga sottile; quadratino = cosa (spuntato se fatta, Subito su fondo grigio in grassetto), cerchio = appuntamento o routine con orario inizio–fine, quadratino tratteggiato = cuscinetto con una riga vuota sotto, nota in grigio piccolo, asterisco = sovrapposto; colonna destra «APPUNTI» a righe punteggiate; in fondo «Nuove cose emerse» (8 righe) e «Fatte ____ / ____». A4 o A5.

### Avvisi
Migration mancante: fondo `--warn-soft`, testo `--warn`, icona `ti-alert-triangle`, sempre con le parole, mai solo il colore. Non bloccano niente. Il banner del piano usa `--primary-soft` e ha due stati: «È ora del piano» [Prepara] e «Il piano della prossima settimana è pronto» [Invia il piano] [Modifica]. Il limite di carico («Troppo per un giorno») non c'è più: accanto a ogni giorno solo il totale ore (cose + appuntamenti + cuscinetti), in mono.

### Il giorno ora per ora (v4)
Una sola sequenza in ordine di ora: **appuntamento** (`.evt-riga`: icona `ti-calendar-event` in `--text-3`, titolo e orario «09:00–10:00 · Google Calendar» in `--text-2`, niente spunta né azioni), **cuscinetto** (`.cusc-riga`: icona `ti-lifebuoy` in `--primary-ink`, «Cuscinetto · 13:00 · 1h» a peso normale, sotto «per gli imprevisti · fino alle 14:00»; in Oggi due chip [Urgenza arrivata] [Riempi]), **cosa con ora** (riga normale). Sotto, le cose senza ora: per fascia se almeno una ne ha una, altrimenti «Senza ora». Nel wizard il cuscinetto è un riquadro tratteggiato `--border-strong` con ora e durata modificabili su una seconda riga.

### Passi (v4)
Nel dettaglio, riquadro `det-box`: «Passi» + «2/5 fatti» in mono, barra da 6px, righe normali (con spunta e azioni proprie), poi «+ Passo» a tutta larghezza e sotto durata + [Aggiungi]. Nella riga della madre: `ti-list-tree` + «2/5 passi»; nella riga del passo: `ti-corner-down-right` + titolo della madre. Chiusura dell'ultimo passo → foglio di conferma (mai `confirm()`).

### Fatte → Settimane (v4)
«Trend: +2% rispetto alla settimana scorsa» con `ti-trending-up/down`; grafico a barre SVG alto 60px, barre da 24px con angoli arrotondati solo in alto, `--primary` (l'ultima piena, le altre al 55 %), linea tratteggiata `--border-strong` all'80 %, numero della settimana in mono sotto; `<title>` e tooltip su ogni barra; sotto la tabella Settimana · Pianificate · Fatte · % (vista accessibile degli stessi dati).

### Contrasto alto e movimento
`html[data-contrast="alto"]`: `--border` e `--border-strong` più scuri, `--text-2`/`--text-3` più scuri, tipi e badge con bordo, chip e campi con bordo 2px. Con `prefers-reduced-motion: reduce` animazioni e transizioni durano 0.

## Icone

Tabler Icons, contorno, via CDN (versione fissata):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css">
<i class="ti ti-sun"></i>
```

| Concetto | Icona | Concetto | Icona |
|---|---|---|---|
| Oggi | `ti-sun` | Subito | `ti-flame` |
| Pianifica | `ti-calendar-week` | Importante | `ti-target` |
| Tutto (Armadio) | `ti-stack-2` | Delega | `ti-user-share` |
| Altro | `ti-dots` | Lascia stare | `ti-wind` |
| Routine | `ti-repeat` | Un giorno | `ti-hourglass-empty` |
| Le tue 3 | `ti-star` / `ti-star-filled` | Rapida | `ti-bolt` |
| Da controllare | `ti-user-check` | Avviso (migration mancante) | `ti-alert-triangle` |
| Dettatura | `ti-microphone` | Invio | `ti-corner-down-left` |
| Cuscinetto | `ti-lifebuoy` | Urgenza arrivata | `ti-urgent` |
| Riempi | `ti-arrow-bar-to-down` | Passi / Scomponi | `ti-list-tree` |
| Blocca in agenda | `ti-calendar-plus` / `ti-calendar-x` | Bloccata | `ti-calendar-check` |
| Invia il piano | `ti-send` | Trend | `ti-trending-up` / `ti-trending-down` |
| Piano della settimana | `ti-map-2` | Persone | `ti-users` |
| Aggiungi | `ti-plus` | Fatto | `ti-check` / `ti-circle-check` |
| Quando | `ti-calendar-event` | Con chi | `ti-user` |
| Modifica | `ti-pencil` | Chiudi | `ti-x` |
| Apri / chiudi riga | `ti-chevron-down` / `ti-chevron-right` | Senza rete | `ti-wifi-off` |
| Tema | `ti-sun` / `ti-moon` | Festa di fine giornata | `ti-confetti` |
| Importante bloccata (inderogabile) | `ti-lock` | Mi è tornata indietro | `ti-arrow-back-up` |
| Svuota la testa | `ti-brain` | Spacchettala | `ti-list-tree` |
| Esercizio Q2 | `ti-target` | Incontro con il coach | `ti-user-check` |
| Si sovrappone | `ti-alert-triangle` | Orario nel titolo diverso | `ti-clock-exclamation` |
| Sembrano cicli | `ti-arrows-exchange` | Promemoria su Calendar | `ti-bell` |
| Aree: Management · Marketing · Vendite · Amministrazione | `ti-crown` · `ti-speakerphone` · `ti-trending-up` · `ti-file-text` | Produzione · Ricerca e sviluppo · Famiglia · Formazione | `ti-building-factory-2` · `ti-flask` · `ti-home` · `ti-school` |

Misure: 24 nel menu e negli empty state, 20 nei bottoni, 16 nei chip, 14 accanto al tipo. Un'icona per concetto, sempre con la parola accanto. Nessuna emoji nell'interfaccia (le emoji delle categorie salvate nel database vanno sostituite da un'icona o tolte).

## Densità: telefono e desktop

| | Telefono (< 768px) | Desktop (≥ 768px) |
|---|---|---|
| Navigazione | barra in basso a 4 voci + bottone **+** | colonna a sinistra (240px) con le stesse voci; **+** diventa «Aggiungi» in alto |
| Riga della cosa da fare | alta 64, due righe (titolo + dettagli) | alta 44, una riga: titolo 14px, tipo e ora a destra |
| Area di tocco | 44×44 minimo | riga 44, spunta 20 dentro un'area 44 |
| Margini | 16 ai lati | contenuto centrato, largo al massimo 720 |
| Piano della settimana | giorni in accordion | 7 colonne + «In settimana» |
| Aggiungere / modificare | bottom sheet | finestra centrata, larga 480 |
| Toast | sopra la barra, a tutta larghezza | in basso a sinistra, largo al massimo 360 |
| Aprire una riga | sul posto | sul posto, oppure pannello a destra oltre i 1200px |
| Passaggio del mouse | non esiste: nessuna informazione solo al passaggio | sfondo `--surface-2` sulla riga, suggerimenti con il termine OSM |

Su telefono: `viewport-fit=cover`, `padding-bottom: env(safe-area-inset-bottom)` su barra e fogli, nessuno scorrimento orizzontale della pagina.

## Verifiche fatte sull'anteprima

- 375px e 1280px, tema chiaro e scuro: nessuno scorrimento orizzontale, nessun testo tagliato, nessun controllo sotto i 44px.
- Contrasto di tutte le coppie di token: testo ≥ 4,5:1, contorni dei controlli ≥ 3:1.
- Spunta → avanzamento aggiornato, toast visibile, «Annulla» riporta tutto com'era.
