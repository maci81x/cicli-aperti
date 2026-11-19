# MAPPA di `index.html`

Fotografia del file a commit `948aad8` (v50, 21798 righe). I numeri di riga si riferiscono a quel file.
Generata con un'analisi statica (script Node, nessuna dipendenza) e verificata a campione a mano: dove l'analisi può sbagliare è scritto.

| Zona | Righe |
|---|---|
| `<head>` + script di configurazione + librerie esterne | 1–62 |
| `<style>` unico (tutto il CSS, v1→v50) | 63–2636 |
| HTML del corpo (barra, viste, fogli, modali) | 2638–3497 |
| `<script>` principale (tutto il JS, v1→v50) | 3498–21796 |

## Numeri in breve

- **1169** funzioni di primo livello; **156** riassegnate almeno una volta, **57** riassegnate due o più volte.
- **38** riassegnazioni che **non chiamano** lo strato precedente (lo sostituiscono): il codice sotto di loro non gira più (sezione 2).
- **27** ritocchi retroattivi: righe dentro uno strato vecchio marcate con una versione successiva (sezione 3).
- **2287** regole CSS (una per selettore); **74** selettori definiti più volte nello stesso contesto; **96** dichiarazioni `!important`.
- Codice morto: **22** funzioni mai chiamate, **1** azione di `AZIONI` senza bottone, **19** classi CSS mai usate (sezione 6).

### Come leggere le catene

- **definita**: `function nome(){…}` o `const nome = …`. Le dichiarazioni `function` sono *sollevate* (hoisting): valgono da subito, anche se stanno più in basso nel file, quindi le metto sempre in testa alla catena.
- **avvolge**: `const _x = nome; nome = function(){ … _x.apply(this, arguments) … }` — aggiunge qualcosa e chiama lo strato sotto.
- **SOSTITUISCE**: `nome = function(){…}` senza chiamare lo strato sotto. Tutto quello che c'era prima smette di girare.
- **puntata**: `nome = altraFunzione;`.
- La colonna *Cosa aggiunge* è il commento scritto sopra (o dentro) lo strato; se manca, tra parentesi c'è il titolo della sezione `// vN · …` in cui si trova.
- **L'ordine di esecuzione è l'ordine delle righe**, non il numero di versione: le intestazioni di primo livello sono in ordine, ma 27 righe marcate con versioni successive (es. `// v36 ·` dentro il codice v2/v3) sono state inserite dentro strati vecchi: sezione 3.

## 1. Funzioni avvolte più volte

Ordinate per numero di strati. 57 funzioni.

Indice: [`vistaOggi`](#vistaoggi) (16) · [`disegna`](#disegna) (13) · [`avviaApp`](#avviaapp) (8) · [`disegnaAnteprima`](#disegnaanteprima) (8) · [`riga`](#riga) (7) · [`apriRapido`](#aprirapido) (6) · [`disegnaAnteprimaCattura`](#disegnaanteprimacattura) (6) · [`rigaEvento`](#rigaevento) (6) · [`salvaCattura`](#salvacattura) (6) · [`vistaPianifica`](#vistapianifica) (6) · [`apriDettaglio`](#apridettaglio) (5) · [`disegnaFoglioEvento`](#disegnafoglioevento) (5) · [`eventiDelGiorno`](#eventidelgiorno) (5) · [`htmlDaPianificareLista`](#htmldapianificarelista) (5) · [`salvaRapido`](#salvarapido) (5) · [`vociDaRighe`](#vocidarighe) (5) · [`_handleGcalToken`](#_handlegcaltoken) (4) · [`aggiornaTutto`](#aggiornatutto) (4) · [`aggiungiFrasi`](#aggiungifrasi) (4) · [`azioneFatto`](#azionefatto) (4) · [`caricaEventi`](#caricaeventi) (4) · [`caricaEventiNascosti`](#caricaeventinascosti) (4) · [`chiudiBlocco`](#chiudiblocco) (4) · [`colonnaGiorno`](#colonnagiorno) (4) · [`disegnaReview`](#disegnareview) (4) · [`ensureGcalCalendar`](#ensuregcalcalendar) (4) · [`eventoDa`](#eventoda) (4) · [`openBpReview`](#openbpreview) (4) · [`render`](#render) (4) · [`showToast`](#showtoast) (4) · [`aggiornaBlocco`](#aggiornablocco) (3) · [`aggiungiRighe`](#aggiungirighe) (3) · [`apriFoglioEvento`](#aprifoglioevento) (3) · [`apriMenu`](#aprimenu) (3) · [`bannerCicliCal`](#bannerciclical) (3) · [`bpwRenderStep2`](#bpwrenderstep2) (3) · [`cercaCicliInCalendario`](#cercacicliincalendario) (3) · [`corpoEvento`](#corpoevento) (3) · [`disegnaRapido`](#disegnarapido) (3) · [`disegnaRiordina`](#disegnariordina) (3) · [`eventoInElenco`](#eventoinelenco) (3) · [`eventoSpuntabile`](#eventospuntabile) (3) · [`flipDone`](#flipdone) (3) · [`moveCicloInAgenda`](#movecicloinagenda) (3) · [`openBpWizard`](#openbpwizard) (3) · [`patchCiclo`](#patchciclo) (3) · [`revMotiviConteggio`](#revmotiviconteggio) (3) · [`rigaDaVoce`](#rigadavoce) (3) · [`segnaStampato`](#segnastampato) (3) · [`togliBlocco`](#togliblocco) (3) · [`v25RitmoCard`](#v25ritmocard) (3) · [`v26DisegnaChiudi`](#v26disegnachiudi) (3) · [`vistaAltro`](#vistaaltro) (3) · [`vistaFatte`](#vistafatte) (3) · [`vistaImpostazioni`](#vistaimpostazioni) (3) · [`vistaTutto`](#vistatutto) (3) · [`voceAnteprimaPlaud`](#voceanteprimaplaud) (3)

### `vistaOggi`

16 strati · 5 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7446–7522 | definita | (v2 · OGGI) |
| 2 | v10 | 14967 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v10 | 15887–15892 | avvolge | in Oggi: sopra «Da controllare» (o tra i banner); in Tutto → Persone: sotto il nome |
| 4 | v11 | 17073–17080 | avvolge | (v11 · TOGLIERE (25/10)) |
| 5 | v12 | 17488–17542 | avvolge | (v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare) |
| 6 | v21 | 18393–18400 | avvolge | Oggi: la stampante accanto al titolo |
| 7 | v23 | 18586–18599 | avvolge | subito sotto la testata «Oggi», prima di tutto il resto (anche dentro la cornice v12) |
| 8 | v25 | 18795–18806 | avvolge | (v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE …) |
| 9 | v29 | 19961–19975 | avvolge | (v29 · 3/11 · IL TEMPO PER PREPARARE GLI APPUNTAMENTI (sezione 10 del canvas, idea di Leo)) |
| 10 | v31 | 20462–20473 | avvolge | (v31 · 04/11 — «Carta di precisione» (fase 1) e via la scheda del coach) |
| 11 | v32 | 20512–20534 | avvolge | (v32 · 05/11 — il telefono: più spazio, meno scorrere (approvato sul canvas, sezione 13)) |
| 12 | v33 | 20621–20649 | avvolge | (v33 · 05/11 — il computer: usare tutta la larghezza (approvato sul canvas, sezione 14)) |
| 13 | v43 | 21039–21060 | (B) avvolge | (v43 · 17/11 — sul computer (tre colonne) Coach e «Settimana senza piano» vanno a sinistra, sotto la giornata,) |
| 14 | v49 | 21597–21610 | (B) avvolge | Oggi: sotto «Oggi: N cose da chiudere», il bottone per smaltire le rimaste indietro |
| 15 | v49 | 21617–21645 | (B) avvolge | (v49 · 19/11 — approvate le bozze della sezione 17 e lo stile di Pianifica della 14 con i colori della 15:) |
| 16 | v50 | 21689–21716 | (B) avvolge | Oggi sul telefono: un solo riquadro «Da controllare» sotto le cose da chiudere |

### `disegna`

13 strati · 12 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 6710–6741 | definita | (v2 · DISEGNO) |
| 2 | v6 | 12336–12339 | avvolge | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 3 | v13 | 17588–17598 | avvolge | (v13 · 27/10 · UNA LISTA SOLA: lavoro e personale insieme) |
| 4 | v25 | 18865–18868 | avvolge | (v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE …) |
| 5 | v26 | 19216–19219 | avvolge | (v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11)) |
| 6 | v32 | 20594–20598 | avvolge | (v32 · 05/11 — il telefono: più spazio, meno scorrere (approvato sul canvas, sezione 13)) |
| 7 | v33 | 20681–20685 | avvolge | (v33 · 05/11 — il computer: usare tutta la larghezza (approvato sul canvas, sezione 14)) |
| 8 | v40.2 | 20867 | (B) avvolge | v40.2 · la vista Giorno non si allarga oltre 1240px |
| 9 | v46 | 21231–21236 | (B) avvolge | (v46 · 17/11 — «quando spunto una casella in fondo o a metà, l'elenco riparte dall'inizio») |
| 10 | v47 | 21321–21335 | (B) avvolge | dopo il disegno: giorni tutti in vista e altezza della testa per le intestazioni fisse |
| 11 | v49 | 21672 | (B) avvolge | (v49 · 19/11 — approvate le bozze della sezione 17 e lo stile di Pianifica della 14 con i colori della 15:) |
| 12 | v50 | 21680–21684 | (B) avvolge | (v50 · 19/11 — sfondo salvia; in Oggi ogni cosa è una scheda a sé (Subito / Importante / Delega si distinguono…) |
| 13 | v50 | 21794 | (B) avvolge | (v50 · accessibilità (axe, WCAG 2.1 AA)) |

### `avviaApp`

8 strati · 2 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v10 | 14774–14805 | definita (sollevata) | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 2 | v9 | 13086–13094 | avvolge | (v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi) |
| 3 | v10 | 14655–14661 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 4 | v10 | 16039–16044 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 5 | v11 | 17194–17199 | avvolge | all'avvio: i nascosti |
| 6 | v12 | 17546–17552 | avvolge | all'avvio: la bozza del campo e gli invii nel database |
| 7 | v13 | 17649–17657 | avvolge | all'avvio: si parte da Tutto; la colonna del calendario della cosa c'è? |
| 8 | v15 | 17886–17891 | avvolge | (v15 · 28/10 · APPUNTAMENTI: si spuntano tutti, anche quelli di tutto il giorno, e si chiudono con un feedback) |

### `disegnaAnteprima`

8 strati · 16 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 12942–12952 | definita | (v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi) |
| 2 | v9 | 13803–13810 | avvolge | (v9 · AVVISO ALL'ORA DETTA) |
| 3 | v10 | 14520–14530 | avvolge | ─── Il riepilogo prima di salvare: «c'è già» / «simile», e «Vedi anche» per i parenti ─── |
| 4 | v10 | 15568–15584 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 5 | v10 | 16276–16286 | **SOSTITUISCE** | (v10 · SNELLA (25/10): meno tocchi, stesse funzioni) |
| 6 | v12 | 17336–17355 | avvolge | «unisci ↑» tra due pezzi della stessa frase |
| 7 | v14 | 17703–17708 | avvolge | (v14 · 28/10 · FATTA = SPARISCE) |
| 8 | v17 | 18091–18103 | avvolge | nel foglio Aggiungi: sotto ogni cosa |

### `riga`

7 strati · 404 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 6772–6820 | definita | Una riga: spunta, titolo, tipo + un dato, ora. Azioni rapide con lo swipe (telefono) o «···» (desktop). |
| 2 | v10 | 15297–15303 | avvolge | ─── Nella riga: il segno della meta ─── |
| 3 | v13 | 17603–17607 | avvolge | (v13 · 27/10 · UNA LISTA SOLA: lavoro e personale insieme) |
| 4 | v19 | 18239–18243 | avvolge | (v19 · 29/10 · DALLA POSTA DI LAVORO) |
| 5 | v26 | 18933–18937 | avvolge | la riga di una cosa: classe per il rosso |
| 6 | v30 | 20331–20337 | avvolge | (v30 · 4/11 · I PROMEMORIA DEL CALENDARIO NON INVECCHIANO NELLE DOMANDE) |
| 7 | v45 | 21164–21173 | (B) avvolge | v47: tutte, non solo le Subito |

### `apriRapido`

6 strati · 12 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v3 | 9443–9450 | definita | (v3 · INSERIMENTO A UN CAMPO («+»): Invio = salvata, una riga = una cosa) |
| 2 | v9 | 12980 | avvolge | (v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi) |
| 3 | v9 | 13832 | avvolge | (v9 · AVVISO ALL'ORA DETTA) |
| 4 | v10 | 16359 | avvolge | apre il foglio: contesto per riga azzerato; i doppioni guardano anche gli appuntamenti già letti |
| 5 | v12 | 17238–17243 | avvolge | (v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare) |
| 6 | v14 | 17696–17701 | avvolge | (v14 · 28/10 · FATTA = SPARISCE) |

### `disegnaAnteprimaCattura`

6 strati · 13 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 13048–13057 | definita | campo fisso del telefono: stesso riepilogo, in breve; «Modifica» apre il foglio con il testo |
| 2 | v9 | 13813–13818 | avvolge | (v9 · AVVISO ALL'ORA DETTA) |
| 3 | v10 | 14532–14538 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 4 | v10 | 15586–15598 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 5 | v10 | 16287–16295 | **SOSTITUISCE** | (v10 · SNELLA (25/10): meno tocchi, stesse funzioni) |
| 6 | v17 | 18106–18116 | avvolge | nel campo del telefono: quante, e «Modifica» le mostra |

### `rigaEvento`

6 strati · 7 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v4 | 9771–9774 | definita | (v4 · IL GIORNO ORA PER ORA: appuntamenti + cuscinetti + cose con ora) |
| 2 | v5 | 10596–10607 | **SOSTITUISCE** | (v5 · GOOGLE CALENDAR: due calendari letti (Lavoro, Privato), uno scritto) |
| 3 | v9 | 13538–13552 | **SOSTITUISCE** | (v9 · APPUNTAMENTI TOCCABILI) |
| 4 | v12 | 17476–17480 | avvolge | il pallino rosso nel titolo dei passati |
| 5 | v24 | 18659–18673 | avvolge | (v24 · 2/11 · APPUNTAMENTI CON ALTRI E TEMPO TUO (disegno 8 del canvas «versione snella»)) |
| 6 | v26 | 18940–18949 | avvolge | la riga di un appuntamento: rosso + «non si sposta» |

### `salvaCattura`

6 strati · 4 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v6 | 11769–11779 | definita | campo vuoto: [+] apre il foglio con Subito / Oggi / Con… |
| 2 | v9 | 13060–13070 | **SOSTITUISCE** | (v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi) |
| 3 | v9 | 13835–13840 | avvolge | il campo del telefono: la sua spunta vale per tutte le righe con un'ora |
| 4 | v10 | 15637–15643 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 5 | v10 | 16380–16392 | **SOSTITUISCE** | (v10 · SNELLA (25/10): meno tocchi, stesse funzioni) |
| 6 | v12 | 17252–17256 | avvolge | (v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare) |

### `vistaPianifica`

6 strati · 2 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7537–7548 | definita | l'agenda è dentro la Settimana |
| 2 | v6 | 12226–12230 | avvolge | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 3 | v10 | 14969 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 4 | v22 | 18547–18555 | avvolge | (v22 · 30/10 · PIANIFICA: I GIORNI IN VISTA (disegni «6» e «7» del canvas «versione snella»)) |
| 5 | v26 | 19208–19214 | avvolge | (v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11)) |
| 6 | v47 | 21294–21318 | (B) avvolge | (v47 · 19/11 — Pianifica › Settimana sul computer come il foglio di Leo (call del 18/11, scelto da Roby)) |

### `apriDettaglio`

5 strati · 21 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7246–7279 | definita | (v2 · FOGLIO NUOVA COSA / DETTAGLIO (i campi sono quelli di saveCiclo)) |
| 2 | v10 | 15278 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v11 | 17183–17190 | avvolge | il tasto c'è sempre: aperte, fatte, in Un giorno |
| 4 | v19 | 18245–18264 | avvolge | (v19 · 29/10 · DALLA POSTA DI LAVORO) |
| 5 | v27 | 19734–19746 | avvolge | (v27 · 3/11 · DOPO UNA «SUBITO»: DUE PASSI CHIARI) |

### `disegnaFoglioEvento`

5 strati · 8 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 13569–13583 | definita | (v9 · APPUNTAMENTI TOCCABILI) |
| 2 | v11 | 17084–17100 | avvolge | --- il foglio dell'appuntamento: nascondi / togli --- |
| 3 | v15 | 17829–17862 | **SOSTITUISCE** | (v15 · 28/10 · APPUNTAMENTI: si spuntano tutti, anche quelli di tutto il giorno, e si chiudono con un feedback) |
| 4 | v24 | 18695–18709 | avvolge | il foglio dell'appuntamento: «È con altre persone» / «È tempo mio» (vale per tutta la serie) |
| 5 | v26 | 19007–19016 | avvolge | il foglio dell'appuntamento: «Non si sposta» |

### `eventiDelGiorno`

5 strati · 17 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 6929–6932 | definita | (v2 · APPUNTAMENTI DI GOOGLE CALENDAR (sola lettura)) |
| 2 | v5 | 10589 | **SOSTITUISCE** | Gli appuntamenti del giorno, senza la routine del mattino (quella va in Routine) |
| 3 | v10 | 14069 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 4 | v10 | 14148 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 5 | v11 | 17060 | avvolge | dove si vedono gli appuntamenti: niente nascosti, niente figlie (quelle hanno la loro riga in Oggi) |

### `htmlDaPianificareLista`

5 strati · 5 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v6 | 12163–12166 | definita | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 2 | v24 | 18753–18761 | avvolge | (v24 · 2/11 · APPUNTAMENTI CON ALTRI E TEMPO TUO (disegno 8 del canvas «versione snella»)) |
| 3 | v45 | 21175–21182 | (B) avvolge | (v45 · 17/11 — «se ho messo una Subito in un giorno e non l'ho chiusa, deve tornare nell'elenco») |
| 4 | v47 | 21274–21283 | (B) avvolge | la colonna Da pianificare: in testa tutte le rimaste indietro (sostituisce il gruppo delle sole Subito della v45) |
| 5 | v49 | 21588–21592 | (B) avvolge | (v49 · 19/11 — approvate le bozze della sezione 17 e lo stile di Pianifica della 14 con i colori della 15:) |

### `salvaRapido`

5 strati · 3 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v3 | 9475–9480 | definita | (v3 · INSERIMENTO A UN CAMPO («+»): Invio = salvata, una riga = una cosa) |
| 2 | v9 | 13041–13046 | **SOSTITUISCE** | (v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi) |
| 3 | v10 | 15629–15635 | avvolge | dopo un salvataggio normale di una cosa breve: «Falla ora» nel messaggio |
| 4 | v12 | 17246–17250 | avvolge | (v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare) |
| 5 | v14 | 17718–17722 | avvolge | (v14 · 28/10 · FATTA = SPARISCE) |

### `vociDaRighe`

5 strati · 22 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 12912–12927 | definita | Le righe del campo con le scelte del foglio (Subito, Oggi, il giorno della colonna) e le correzioni a mano |
| 2 | v9 | 13798–13801 | avvolge | (v9 · AVVISO ALL'ORA DETTA) |
| 3 | v10 | 15551–15560 | avvolge | ─── Le voci del campo: «5 minuti», «al volo», «subito» o il chip «5 min» → breve; titolo generico → avviso ─── |
| 4 | v10 | 16211–16218 | avvolge | ─── Le voci: il contesto per riga (indovinato o toccato) ─── |
| 5 | v12 | 17320–17326 | avvolge | (v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare) |

### `_handleGcalToken`

4 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v1 | 4694–4715 | definita | (AUTO-CATEGORIZZAZIONE CLAUDE) |
| 2 | v2 | 10329 | avvolge | Dopo il collegamento a Google Calendar: carica gli appuntamenti della settimana. |
| 3 | v5 | 11694–11699 | avvolge | Dopo il collegamento a Google Calendar: calendario di scrittura, promemoria, appuntamenti che sembrano cicli |
| 4 | v10 | 14952–14956 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |

### `aggiornaTutto`

4 strati · 2 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7751–7777 | definita | (v2 · TUTTO (Cose aperte): Lista · Matrice · Persone, filtri, Un giorno) |
| 2 | v5 | 11129–11133 | avvolge | (v5 · TUTTO: «N cose aperte» e com'era 7 giorni fa (meno è meglio)) |
| 3 | v25 | 18846–18860 | avvolge | (v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE …) |
| 4 | v25 | 18870 | avvolge | (v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE …) |

### `aggiungiFrasi`

4 strati · 5 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 13008–13040 | definita | (v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi) |
| 2 | v9 | 13843–13853 | avvolge | dopo il salvataggio: un avviso per ogni cosa con giorno e ora e la spunta attiva |
| 3 | v10 | 14499–14516 | avvolge | urgenza arrivata: va nel cuscinetto com'è |
| 4 | v10 | 16408–16427 | avvolge | urgenza arrivata: nel cuscinetto com'è |

### `azioneFatto`

4 strati · 19 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7025–7071 | definita | routine di ogni giorno: fatta per oggi, domani torna |
| 2 | v4 | 10273–10278 | avvolge | La logica di «Fatto» resta quella: qui si aggiunge solo il «le tue 3 sono fatte». |
| 3 | v4 | 10281–10290 | avvolge | v4: chiudere una cosa bloccata in agenda aggiorna l'evento; l'ultimo passo fatto chiede di chiudere la cosa intera. |
| 4 | v5 | 11017–11023 | avvolge | (v5 · DOPO UNA «SUBITO»: cosa l'ha generata? (al massimo una volta al giorno per area)) |

### `caricaEventi`

4 strati · 21 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 6907–6928 | definita | segnaposto: non richiedere due volte |
| 2 | v5 | 10576–10586 | **SOSTITUISCE** | (v5 · GOOGLE CALENDAR: due calendari letti (Lavoro, Privato), uno scritto) |
| 3 | v7 | 12676–12688 | avvolge | si rilegge da Google senza svuotare: fino alla risposta restano quelli della copia |
| 4 | v10 | 14926–14935 | **SOSTITUISCE** | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |

### `caricaEventiNascosti`

4 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v11 | 17027–17036 | definita | tabella non ancora creata: si resta sul browser |
| 2 | v24 | 18623–18627 | avvolge | (v24 · 2/11 · APPUNTAMENTI CON ALTRI E TEMPO TUO (disegno 8 del canvas «versione snella»)) |
| 3 | v26 | 19639–19644 | avvolge | --- caricamento --- |
| 4 | v29 | 20201–20205 | avvolge | --- avvio: con le altre tabelle degli appuntamenti --- |

### `chiudiBlocco`

4 strati · 4 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v4 | 10112–10122 | definita | Chiusa: se l'appuntamento era ancora da venire si toglie; se è passato resta, con la spunta nel titolo. |
| 2 | v5 | 10969–10987 | avvolge | ══════════════════════════════════════════════════════════════ |
| 3 | v9 | 13733–13741 | avvolge | chiusa: l'avviso si cancella sempre (il blocco di «Blocca in agenda» fa come prima) |
| 4 | v10 | 14050–14062 | **SOSTITUISCE** | chiusa: avviso → cancellato; blocco futuro → cancellato; blocco passato → «✓» davanti al titolo. Solo eventi dell'app. |

### `colonnaGiorno`

4 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v6 | 12187–12203 | definita | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 2 | v21 | 18340–18344 | avvolge | (v21 · 30/10 · LA SETTIMANA DA OGGI E LA GIORNATA STAMPATA) |
| 3 | v24 | 18738–18742 | avvolge | (v24 · 2/11 · APPUNTAMENTI CON ALTRI E TEMPO TUO (disegno 8 del canvas «versione snella»)) |
| 4 | v26 | 18971–18974 | avvolge | (v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11)) |

### `disegnaReview`

4 strati · 20 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7971–8006 | definita | (v2 · CHIUDI LA SETTIMANA (review in due passi)) |
| 2 | v5 | 11216–11221 | avvolge | (v5 · CHIUDI LA SETTIMANA: 0. Riporta il foglio · 1. quello che è rimasto · 2. com'è andata) |
| 3 | v10 | 15991–16003 | avvolge | la nota già scritta non si perde |
| 4 | v10 | 16623–16629 | avvolge | dopo «Riporta il foglio» (o una data mancante) si torna qui |

### `ensureGcalCalendar`

4 strati · 13 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v1 | 4843–4861 | definita | Cerca calendario esistente |
| 2 | v5 | 10612–10631 | **SOSTITUISCE** | (v5 · GOOGLE CALENDAR: due calendari letti (Lavoro, Privato), uno scritto) |
| 3 | v10 | 13989–14004 | **SOSTITUISCE** | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 4 | v13 | 17641–17645 | avvolge | (v13 · 27/10 · UNA LISTA SOLA: lavoro e personale insieme) |

### `eventoDa`

4 strati · 2 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v5 | 10510–10539 | definita | (v5 · GOOGLE CALENDAR: due calendari letti (Lavoro, Privato), uno scritto) |
| 2 | v11 | 17015–17019 | avvolge | --- eventi delle figlie --- |
| 3 | v24 | 18630–18642 | avvolge | il promemoria della posta: solo su Google |
| 4 | v29 | 19818–19826 | avvolge | --- gli eventi sanno chi è esterno --- |

### `openBpReview`

4 strati · 2 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7963–7969 | definita | (v2 · CHIUDI LA SETTIMANA (review in due passi)) |
| 2 | v5 | 11139–11144 | avvolge | (v5 · CHIUDI LA SETTIMANA: 0. Riporta il foglio · 1. quello che è rimasto · 2. com'è andata) |
| 3 | v10 | 15941–15949 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 4 | v10 | 16615–16621 | avvolge | (v10 · SNELLA (25/10): meno tocchi, stesse funzioni) |

### `render`

4 strati · 253 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 6703–6708 | definita | un solo disegno per giro: realtime e azioni possono chiamare render più volte di fila |
| 2 | v6 | 12277–12280 | avvolge | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 3 | v10 | 14879–14883 | avvolge | dopo ogni disegno: Oggi non deve restare vuota |
| 4 | v18 | 18177–18181 | avvolge | (v18 · 29/10 · APPUNTAMENTI: il cestino a portata di mano) |

### `showToast`

4 strati · 303 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 6578–6604 | definita | (v2 · TOAST (con «Annulla») E TEMA) |
| 2 | v10 | 16396–16399 | avvolge | ─── Salvare: subito, ognuna nel suo contesto; poi i doppioni e «Vai a Personale» ─── |
| 3 | v14 | 17667–17682 | avvolge | messaggi con più tasti e una durata scelta |
| 4 | v48 | 21387–21390 | (B) avvolge | (v48 · 19/11 · PIÙ PRATICA: «Annulla» anche sugli spostamenti, giorni con un tocco (ore libere), PDF nei color…) |

### `aggiornaBlocco`

3 strati · 11 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v4 | 10101–10109 | definita | Dopo uno spostamento o una modifica: l'evento segue la cosa. Non fa niente se la cosa non è bloccata. |
| 2 | v5 | 10967–10987 | avvolge | ══════════════════════════════════════════════════════════════ |
| 3 | v9 | 13715–13730 | avvolge | spostata: l'avviso segue la cosa (senza ora → si toglie). Per gli altri eventi resta il comportamento di prima. |

### `aggiungiRighe`

3 strati · 4 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v3 | 9482–9500 | definita | Una riga = una cosa. Restituisce le cose salvate (o null se il salvataggio non riesce). |
| 2 | v6 | 11801–11811 | avvolge | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 3 | v10 | 16554–16565 | avvolge | ─── 3 · Il contesto anche nelle altre strade: righe, foglio riportato, Plaud (per riga) ─── aggiungiRighe legge state.ctx subito: ogni gruppo di righ… |

### `apriFoglioEvento`

3 strati · 5 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 13564–13568 | definita | (v9 · APPUNTAMENTI TOCCABILI) |
| 2 | v10 | 14231 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v15 | 17869 | avvolge | (v15 · 28/10 · APPUNTAMENTI: si spuntano tutti, anche quelli di tutto il giorno, e si chiudono con un feedback) |

### `apriMenu`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7426–7440 | definita | (v2 · SWIPE (telefono) E MENU «···» (desktop)) |
| 2 | v26 | 19036–19044 | avvolge | il menu ⋯ di una cosa: «Non si sposta» |
| 3 | v37 | 20730–20744 | avvolge | (v37 · 06/11 — rimettere una cosa in «Da pianificare») |

### `bannerCicliCal`

3 strati · 2 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v5 | 10837–10843 | definita | (v5 · BANNER: è ora del Business Plan · incontro con il coach · esercizio Q2 · appuntamenti che sembrano cicli) |
| 2 | v10 | 15894–15897 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v42 | 20952–20957 | (B) avvolge | (2) il banner di Oggi dice la cosa giusta quando ci sono promemoria passati |

### `bpwRenderStep2`

3 strati · 12 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v1 | 6162–6216 | definita | (BATTLE PLAN — PIANO DI BATTAGLIA SETTIMANALE) |
| 2 | v2 | 10321–10325 | avvolge | Nel wizard, accanto a ogni giorno, il tempo già preso dagli appuntamenti. |
| 3 | v10 | 15454 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |

### `cercaCicliInCalendario`

3 strati · 2 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v5 | 11242–11262 | definita | (v5 · APPUNTAMENTI CHE SEMBRANO CICLI (mai cancellare senza il tocco di Roberto)) |
| 2 | v30 | 20243–20285 | **SOSTITUISCE** | (v30 · 4/11 · I PROMEMORIA DEL CALENDARIO NON INVECCHIANO NELLE DOMANDE) |
| 3 | v41 | 20914–20918 | (B) avvolge | mai due giri insieme: creerebbero due volte la stessa cosa |

### `corpoEvento`

3 strati · 3 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v4 | 10023–10028 | definita | (v4 · BLOCCA IN AGENDA: un evento sul calendario «Cicli Aperti — Battle Plan») |
| 2 | v10 | 14030–14038 | **SOSTITUISCE** | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v10 | 16949 | avvolge | (v10 · SNELLA (25/10): meno tocchi, stesse funzioni) |

### `disegnaRapido`

3 strati · 10 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v3 | 9451–9463 | definita | (v3 · INSERIMENTO A UN CAMPO («+»): Invio = salvata, una riga = una cosa) |
| 2 | v6 | 11794–11798 | avvolge | «+ Ciclo» di una colonna: il foglio rapido con il giorno già scelto |
| 3 | v9 | 12978 | avvolge | (v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi) |

### `disegnaRiordina`

3 strati · 8 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v6 | 12382–12418 | definita | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 2 | v9 | 13886–13918 | avvolge | (v9 · OGGI SUL TELEFONO: «Rimaste indietro» diventa una riga «N indietro · Sistema») |
| 3 | v10 | 15307–15330 | avvolge | ─── Riordina: un'Importante ti avvicina a una meta? Se no: Delega o Lascia stare (dire no) ─── |

### `eventoInElenco`

3 strati · 2 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 13584–13597 | definita | (v9 · APPUNTAMENTI TOCCABILI) |
| 2 | v10 | 14150–14168 | **SOSTITUISCE** | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v10 | 14554–14565 | avvolge | ─── «È una cosa da fare»: già aperta → il dettaglio (come prima, ora anche se è scritta un po' diversa); fatta da poco → riapro o nuova ─── |

### `eventoSpuntabile`

3 strati · 8 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 13499 | definita | si spunta un appuntamento con un orario (non quelli di giornata, non la routine) |
| 2 | v11 | 17065 | avvolge | (v11 · TOGLIERE (25/10)) |
| 3 | v15 | 17773 | **SOSTITUISCE** | (v15 · 28/10 · APPUNTAMENTI: si spuntano tutti, anche quelli di tutto il giorno, e si chiudono con un feedback) |

### `flipDone`

3 strati · 14 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v1 | 3810–3824 | definita | 22/10 · chiuso_at sempre: si scrive alla chiusura (anche passi e ricorrenti, che passano tutti da qui), si toglie se si riapre |
| 2 | v9 | 13765–13770 | avvolge | tutte le chiusure passano da flipDone |
| 3 | v42 | 20978–20982 | (B) avvolge | (v42 · 10/11 — gli spunti di Roby contro le cose già chiuse che ricompaiono) |

### `moveCicloInAgenda`

3 strati · 4 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v1 | 5282–5313 | definita | Crea/aggiorna l'override — vale SOLO per la settimana corrente |
| 2 | v2 | 10309–10317 | avvolge | Spostare una riga nell'agenda sposta anche la sua riga nel piano della settimana. |
| 3 | v6 | 11870–11874 | avvolge | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |

### `openBpWizard`

3 strati · 2 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v1 | 5917–5981 | definita | (BATTLE PLAN — PIANO DI BATTAGLIA SETTIMANALE) |
| 2 | v5 | 10679–10683 | avvolge | (v5 · CUSCINETTI NEGLI SPAZI LIBERI (non più a orario fisso)) |
| 3 | v10 | 16802–16823 | avvolge | modifica di un piano attivo: il wizard di prima |

### `patchCiclo`

3 strati · 67 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 6968–6972 | definita | (v2 · AZIONI RAPIDE (Fatto · Domani · Scegli quando · Ripeti · Lascia stare)) |
| 2 | v9 | 13752–13756 | avvolge | (v9 · AVVISO ALL'ORA DETTA) |
| 3 | v30 | 20340–20344 | avvolge | basta toccarla (spostarla, cambiarla, chiuderla) e non è più «da rivedere» |

### `revMotiviConteggio`

3 strati · 2 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v4 | 10198–10204 | definita | { urgenze: 2, telefonate: 1, …, altro_note: ['…'] } — solo per le cose ancora aperte |
| 2 | v5 | 11224–11227 | avvolge | I conteggi della settimana (Q2 spostate per motivo, deleghe tornate) restano in motivi anche alla chiusura. |
| 3 | v10 | 16011–16016 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |

### `rigaDaVoce`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v9 | 12998–13007 | definita | Una riga del database per una voce: delega con persona e controllo, oppure giorno e ora |
| 2 | v10 | 15563–15566 | avvolge | la durata di 5 minuti la rende una Rapida (≤ 15 min, come prima) |
| 3 | v14 | 17710–17716 | avvolge | (v14 · 28/10 · FATTA = SPARISCE) |

### `segnaStampato`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v5 | 10369 | definita | (v5 · METODO i-TIME — costanti e impostazioni (vedi privata/DECISIONI.md, solo in locale)) |
| 2 | v6 | 12616 | avvolge | (v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,) |
| 3 | v12 | 17389 | avvolge | (v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare) |

### `togliBlocco`

3 strati · 9 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v4 | 10045–10051 | definita | (v4 · BLOCCA IN AGENDA: un evento sul calendario «Cicli Aperti — Battle Plan») |
| 2 | v5 | 10959–10965 | avvolge | evento del calendario Lavoro: si scollega, non si cancella |
| 3 | v10 | 14041–14048 | avvolge | togli: un evento che non è dell'app non si cancella, si scollega soltanto |

### `v25RitmoCard`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v25 | 18783–18792 | definita | (v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE …) |
| 2 | v26 | 19471–19483 | **SOSTITUISCE** | (v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11)) |
| 3 | v31 | 20460 | **SOSTITUISCE** | «Adesso» prende il posto del vecchio riquadro «Adesso tocca a…» e ne porta dentro il suggerimento |

### `v26DisegnaChiudi`

3 strati · 3 chiamate nel file · (B) = strato scritto dentro un blocco `{ … }`

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v26 | 19499–19516 | definita | (v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11)) |
| 2 | v30 | 20305–20311 | avvolge | la sera, in «Chiudi la giornata» |
| 3 | v42 | 20996–21005 | (B) avvolge | (v42 · 10/11 — gli spunti di Roby contro le cose già chiuse che ricompaiono) |

### `vistaAltro`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7836–7851 | definita | (v2 · ALTRO: tema, Fatte, Guida, registrazione, Impostazioni) |
| 2 | v10 | 14647–14652 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v10 | 16022–16031 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |

### `vistaFatte`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7853–7867 | definita | (v2 · ALTRO: tema, Fatte, Guida, registrazione, Impostazioni) |
| 2 | v14 | 17726–17748 | **SOSTITUISCE** | (v14 · 28/10 · FATTA = SPARISCE) |
| 3 | v15 | 17873–17883 | avvolge | Fatte: anche gli appuntamenti chiusi, con il feedback |

### `vistaImpostazioni`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7884–7907 | definita | (v2 · ALTRO: tema, Fatte, Guida, registrazione, Impostazioni) |
| 2 | v10 | 15001 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v26 | 19608–19635 | avvolge | via «Assegna l'area con Claude»: la sezione la propone già l'app |

### `vistaTutto`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v2 | 7736–7749 | definita | (v2 · TUTTO (Cose aperte): Lista · Matrice · Persone, filtri, Un giorno) |
| 2 | v14 | 17760–17764 | avvolge | in Cose aperte: il passaggio alle Fatte |
| 3 | v25 | 18838–18844 | avvolge | (v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE …) |

### `voceAnteprimaPlaud`

3 strati · 1 chiamate nel file

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 1 | v8 | 13220–13233 | definita | (v8 · IMPORT PLAUD: un'attività madre per la riunione, le cose da fare come passi) |
| 2 | v10 | 14547–14550 | avvolge | (v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO) |
| 3 | v10 | 16587–16590 | avvolge | (v10 · SNELLA (25/10): meno tocchi, stesse funzioni) |

### 1.2 Funzioni avvolte una volta sola

| Funzione | Definita | Riassegnata | Tipo |
|---|---|---|---|
| `applicaRiporta` | v5 · 11180 | v10 · 16575 | avvolge |
| `apriNuovo` | v2 · 7230 | v10 · 15280 | avvolge |
| `apriPronto` | v5 · 10856 | v10 · 16947 | avvolge |
| `apriRapidoCon` | v9 · 12981 | v12 · 17244 | **SOSTITUISCE** |
| `apriSpostaEvento` | v6 · 11923 | v26 · 19000 | avvolge |
| `apriWizard` | v2 · 8068 | v26 · 19131 | avvolge |
| `autoCategoria` | v1 · 4627 | v25 · 18894 | avvolge |
| `azioneDomani` | v2 · 7103 | v6 · 11857 | avvolge |
| `azioneElimina` | v2 · 7166 | v11 · 17148 | **SOSTITUISCE** |
| `bannerCoach` | v5 · 10773 | v6 · 12599 | avvolge |
| `bannerPiano` | v3 · 9630 | v5 · 10783 | **SOSTITUISCE** |
| `bloccoRimaste` | v2 · 8161 | v9 · 13864 | avvolge |
| `bordoSposta` | v6 · 12236 | v48 · 21394 | avvolge |
| `bpAttiva` | v1 · 6360 | v5 · 10858 | avvolge |
| `bpSlotConfirm` | v1 · 6338 | v10 · 16944 | avvolge |
| `bpStampaPdf` | v5 · 8650 | v5 · 10863 | avvolge |
| `bpwAggiungiCusc` | v4 · 9790 | v5 · 10663 | **SOSTITUISCE** |
| `bpwBloccoGiorno` | v2 · 9112 | v5 · 10693 | avvolge |
| `bpwCambiaCusc` | v4 · 9794 | v5 · 11591 | avvolge |
| `bpwConEventi` | v2 · 8085 | v5 · 10684 | **SOSTITUISCE** |
| `cardCoach` | v6 · 12587 | v31 · 20355 | **SOSTITUISCE** |
| `chiediOrigineSubito` | v5 · 10992 | v27 · 19685 | avvolge |
| `chiediSpostamento` | v5 · 10900 | v26 · 18994 | avvolge |
| `closeModal` | v1 · 4116 | v10 · 14216 | avvolge |
| `closeModalOnBg` | v1 · 4122 | v10 · 14221 | avvolge |
| `colonnaDaPianificare` | v6 · 12167 | v30 · 20323 | avvolge |
| `confermaPianificazione` | v1 · 5499 | v9 · 13783 | avvolge |
| `confermaSpostaEvento` | v6 · 12022 | v9 · 13628 | avvolge |
| `corpoPromemoriaV10` | v10 · 14084 | v10 · 15789 | avvolge |
| `creaBlocco` | v4 · 10036 | v5 · 10950 | avvolge |
| `creaDaSubito` | v5 · 11003 | v27 · 19705 | **SOSTITUISCE** |
| `daPianificareFiltrate` | v6 · 12156 | v30 · 20317 | avvolge |
| `disconnectGcal` | v1 · 4956 | v7 · 12691 | avvolge |
| `disegnaCalCicli` | v5 · 11263 | v30 · 20288 | avvolge |
| `disegnaSpostaEvento` | v6 · 11933 | v9 · 13609 | avvolge |
| `dopoIlSalvataggio` | v10 · 16428 | v13 · 17620 | avvolge |
| `etichettaSalva` | v10 · 16271 | v13 · 17618 | avvolge |
| `gcalFetch` | v1 · 4863 | v10 · 13954 | avvolge |
| `giorniVisibili` | v6 · 12204 | v21 · 18334 | avvolge |
| `gruppiAperti` | v10 · 14570 | v10 · 15068 | **SOSTITUISCE** |
| `importaRiunione` | v8 · 13305 | v10 · 16593 | avvolge |
| `impostaGiorno` | v2 · 9184 | v6 · 11864 | avvolge |
| `infoPassi` | v4 · 9908 | v5 · 11031 | avvolge |
| `interpretaFrase` | v8 · 12763 | v12 · 17329 | avvolge |
| `inviaPiano` | v4 · 10152 | v5 · 11594 | avvolge |
| `inviaPianoProssima` | v4 · 10174 | v5 · 10812 | **SOSTITUISCE** |
| `inviati` | v4 · 9744 | v12 · 17368 | avvolge |
| `legendaColori` | v6 · 12116 | v24 · 18746 | avvolge |
| `leggiEventi` | v5 · 10550 | v10 · 14067 | avvolge |
| `loadAll` | v1 · 3703 | v42 · 21012 | avvolge |
| `loadBattlePlan` | v1 · 5719 | v11 · 17141 | avvolge |
| `loadGcalTokenFromDB` | v1 · 4810 | v10 · 14016 | avvolge |
| `navSettimana` | v2 · 7527 | v10 · 15464 | avvolge |
| `notaCtx` | v10 · 16263 | v13 · 17616 | avvolge |
| `offriFallaOraDopo` | v10 · 15644 | v10 · 16356 | **SOSTITUISCE** |
| `openPianificaModal` | v1 · 5361 | v48 · 21446 | avvolge |
| `openPlaudModal` | v1 · 4283 | v8 · 13280 | avvolge |
| `orarioEvento` | v4 · 9770 | v26 · 18914 | **SOSTITUISCE** |
| `pianFondo` | v2 · 7696 | v6 · 12233 | avvolge |
| `pianLargo` | v6 · 12207 | v21 · 18346 | avvolge |
| `pianSettimana` | v2 · 7578 | v21 · 18376 | avvolge |
| `pianSettimanaColonne` | v2 · 7610 | v21 · 18355 | avvolge |
| `preparaPlaud` | v8 · 13206 | v10 · 14542 | avvolge |
| `quandoPiano` | v3 · 9610 | v5 · 10763 | **SOSTITUISCE** |
| `renderCatOptions` | v1 · 4131 | v2 · 10297 | avvolge |
| `rigaNuova` | v3 · 9466 | v10 · 16568 | avvolge |
| `rigaSceltaSn` | v10 · 16824 | v13 · 17609 | avvolge |
| `rigaSpazio` | v6 · 12183 | v24 · 18744 | avvolge |
| `righeCampo` | v9 · 12858 | v12 · 17312 | avvolge |
| `rioSalva` | v6 · 12348 | v9 · 13884 | avvolge |
| `rispondiConferma` | v4 · 9986 | v10 · 15913 | avvolge |
| `rispondiProteggi` | v5 · 10914 | v26 · 18984 | avvolge |
| `routineDelGiorno` | v5 · 10590 | v11 · 17062 | avvolge |
| `salvaCacheEventi` | v7 · 12659 | v10 · 14897 | avvolge |
| `salvaDalFoglio` | v2 · 7282 | v9 · 13773 | avvolge |
| `salvaDelega` | v3 · 9418 | v6 · 12473 | avvolge |
| `sceltaCalCiclo` | v5 · 11273 | v41 · 20920 | avvolge |
| `segnaEvento` | v9 · 13511 | v15 · 17785 | avvolge |
| `segnaInviato` | v4 · 9746 | v12 · 17387 | avvolge |
| `segnaleMia` | v10 · 16104 | v28 · 19772 | avvolge |
| `sezioneItime` | v5 · 11541 | v10 · 15801 | avvolge |
| `sezionePiano` | v4 · 10246 | v5 · 11563 | avvolge |
| `sincronizzaPromemoria` | v5 · 10734 | v10 · 14107 | **SOSTITUISCE** |
| `stampaGiorno` | v21 · 18418 | v26 · 19419 | **SOSTITUISCE** |
| `stampati` | v5 · 10367 | v12 · 17374 | avvolge |
| `switchCtx` | v1 · 3843 | v13 · 17579 | **SOSTITUISCE** |
| `testaBoard` | v6 · 12135 | v10 · 15466 | avvolge |
| `testoInvio` | v4 · 10127 | v26 · 19139 | avvolge |
| `tuttoPersone` | v2 · 7814 | v10 · 15899 | avvolge |
| `unisciGruppo` | v10 · 14606 | v10 · 16496 | **SOSTITUISCE** |
| `upsertOverride` | v2 · 7073 | v9 · 13758 | avvolge |
| `v22RigaCoach` | v22 · 18452 | v31 · 20356 | **SOSTITUISCE** |
| `v25Momento` | v25 · 18772 | v26 · 19464 | avvolge |
| `v26VistaGiorno` | v26 · 19165 | v40 · 20829 | avvolge |
| `v40Candidate` | v40 · 20796 | v45 · 21184 | avvolge |
| `v44Aggiorna` | v44 · 21076 | v47 · 21338 | avvolge |
| `v49Annulla` | v49 · 21548 | v50 · 21751 | avvolge |
| `v49Fai` | v49 · 21530 | v50 · 21724 | avvolge |
| `v49Lista` | v49 · 21472 | v50 · 21722 | avvolge |

### 1.3 Strati fuori ordine e dichiarazioni sollevate

Strati con versione più alta che stanno **sopra** uno con versione più bassa: chi legge il file "in ordine di versione" sbaglia l'ordine di esecuzione.

**Intestazioni di primo livello fuori ordine** (una sezione con versione più bassa scritta dopo una più alta):

| Riga | Sezione | Tra |
|---|---|---|
| 8413 | `v5 · il foglio nel formato del piano i-Time: in cima il riquadro giallo «Settimana (pensa…` | v2 (riga 8404) e v2 (riga 8663) |
| 10293 | `v2 · AGGANCI ALLA LOGICA E AVVIO` | v4 (riga 10279) e v5 (riga 10332) |
| 12854 | `v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due pun…` | v8 (riga 12694) e v8 (riga 13097) |

Il v5 a riga 8413 è la riscrittura del foglio PDF messa dentro la sezione v2 «Stampa la settimana»; il «v2 · Agganci alla logica e avvio» chiude in fondo i blocchi v2–v4 (l’avvio deve stare dopo tutte le loro definizioni); il v9 «Spesa:» sta prima del v8 «Import Plaud». Dividendo per strati, questi blocchi restano dove sono.

Dentro le catene delle funzioni:

Nessuna funzione ha strati con versione decrescente oltre a quelli dovuti alle due sezioni qui sopra; le altre eccezioni sono i ritocchi in linea della sezione 3.

Dichiarazioni `function` che stanno **dopo** un loro avvolgimento (funzionano solo grazie all'hoisting: finché tutto il JS finisce in **un solo** `<script>` va bene; con più `<script>` o con moduli si rompono):

- `avviaApp`: dichiarata a riga 14774 (v10), già avvolta a riga 13086 (v9).

## 2. Strati che non girano più (sostituiti)

Quando uno strato SOSTITUISCE, il corpo degli strati precedenti non viene più eseguito — a meno che un alias catturato prima (`const _xBase = x`) sia chiamato da qualche altra parte: va controllato caso per caso prima di cancellare.

| Funzione | Sostituita a | Strati resi inutili |
|---|---|---|
| `switchCtx` | v13 · riga 17579 | v1 · 3843–3850 |
| `ensureGcalCalendar` | v5 · riga 10612 | v1 · 4843–4861 |
| `ensureGcalCalendar` | v10 · riga 13989 | v5 · 10612–10631 |
| `caricaEventi` | v5 · riga 10576 | v2 · 6907–6928 |
| `caricaEventi` | v10 · riga 14926 | v5 · 10576–10586, v7 · 12676–12688 |
| `eventiDelGiorno` | v5 · riga 10589 | v2 · 6929–6932 |
| `azioneElimina` | v11 · riga 17148 | v2 · 7166–7175 |
| `vistaFatte` | v14 · riga 17726 | v2 · 7853–7867 |
| `bpwConEventi` | v5 · riga 10684 | v2 · 8085–8090 |
| `salvaRapido` | v9 · riga 13041 | v3 · 9475–9480 |
| `quandoPiano` | v5 · riga 10763 | v3 · 9610–9613 |
| `bannerPiano` | v5 · riga 10783 | v3 · 9630–9642 |
| `orarioEvento` | v26 · riga 18914 | v4 · 9770 |
| `rigaEvento` | v5 · riga 10596 | v4 · 9771–9774 |
| `rigaEvento` | v9 · riga 13538 | v5 · 10596–10607 |
| `bpwAggiungiCusc` | v5 · riga 10663 | v4 · 9790–9793 |
| `corpoEvento` | v10 · riga 14030 | v4 · 10023–10028 |
| `chiudiBlocco` | v10 · riga 14050 | v4 · 10112–10122, v5 · 10969–10987, v9 · 13733–13741 |
| `inviaPianoProssima` | v5 · riga 10812 | v4 · 10174–10183 |
| `sincronizzaPromemoria` | v10 · riga 14107 | v5 · 10734–10758 |
| `creaDaSubito` | v27 · riga 19705 | v5 · 11003–11015 |
| `cercaCicliInCalendario` | v30 · riga 20243 | v5 · 11242–11262 |
| `salvaCattura` | v9 · riga 13060 | v6 · 11769–11779 |
| `salvaCattura` | v10 · riga 16380 | v9 · 13060–13070, v9 · 13835–13840, v10 · 15637–15643 |
| `cardCoach` | v31 · riga 20355 | v6 · 12587–12596 |
| `disegnaAnteprima` | v10 · riga 16276 | v9 · 12942–12952, v9 · 13803–13810, v10 · 14520–14530, v10 · 15568–15584 |
| `apriRapidoCon` | v12 · riga 17244 | v9 · 12981 |
| `disegnaAnteprimaCattura` | v10 · riga 16287 | v9 · 13048–13057, v9 · 13813–13818, v10 · 14532–14538, v10 · 15586–15598 |
| `eventoSpuntabile` | v15 · riga 17773 | v9 · 13499, v11 · 17065 |
| `disegnaFoglioEvento` | v15 · riga 17829 | v9 · 13569–13583, v11 · 17084–17100 |
| `eventoInElenco` | v10 · riga 14150 | v9 · 13584–13597 |
| `gruppiAperti` | v10 · riga 15068 | v10 · 14570–14573 |
| `unisciGruppo` | v10 · riga 16496 | v10 · 14606–14630 |
| `offriFallaOraDopo` | v10 · riga 16356 | v10 · 15644–15649 |
| `stampaGiorno` | v26 · riga 19419 | v21 · 18418–18440 |
| `v22RigaCoach` | v31 · riga 20356 | v22 · 18452–18459 |
| `v25RitmoCard` | v26 · riga 19471 | v25 · 18783–18792 |
| `v25RitmoCard` | v31 · riga 20460 | v26 · 19471–19483 |

## 3. Ritocchi retroattivi (righe nuove dentro strati vecchi)

Queste righe stanno dentro uno strato vecchio ma portano il segno di una versione successiva: la regola "ogni versione si aggiunge in fondo" non è sempre stata rispettata. Quando si divide il file vanno lasciate dove sono (spostarle cambia il comportamento).

| Riga | Strato in cui sta | Ritocco | Testo |
|---|---|---|---|
| 3714 | v1 | v11 | `// v11 · le cose eliminate dall'app (eliminato_at) restano nel database ma non si vedono` |
| 5055 | v1 | v5 | `const toMigrate = state.cicli.filter(c => !areaDi(c) && c.ctx === 'lavoro').slice(0, 50); // v5: chi ha l'are…` |
| 7452 | v2 | v9 | `const evSpunta = appuntamentiSpuntabili(oggi); // v9: anche gli appuntamenti con orario si spuntano` |
| 7468 | v2 | v9 | `// v9 · sul telefono il primo schermo è: data e progresso, Subito, le prime righe della giornata, il campo` |
| 7475 | v2 | v6 | `// v6 · 1. SUBITO in cima (quelle con un'ora stanno nella giornata, al loro posto)` |
| 8467 | v5 | v6 | `// v6 · colori del foglio = colori dell'app (tema chiaro); il fondo delle Subito è un po' più carico, sulla c…` |
| 8468 | v5 | v48 | `const PDF_COL = { 1: [217, 45, 32], 2: [37, 99, 235], 3: [161, 98, 7], 4: [122, 134, 130], evt: [91, 90, 142]…` |
| 8561 | v5 | v38 | `const v38ObY = y - 4 * s; // v38 · qui, in alto a destra, va il riquadro degli obiettivi (disegnato alla fine…` |
| 8602 | v5 | v38 | `// v38 · obiettivi della settimana in alto a destra (come nel foglio del giorno); «Appunti» scende sotto` |
| 9289 | v3 | v36 | `if (!righe.length \|\| righe.some(r => r.item.in_focus)) return; // v36 · ogni mattina, anche con poche cose` |
| 9296 | v3 | v36 | `const base = segnate.length ? segnate : righe; // v36 · tutte spuntate: togli quelle che oggi non porti a casa` |
| 16158 | v10 | v28 | `const daTe = new Set(); // v28 · parole decise da te (correzioni) o da una persona: queste battono la lista` |
| 16189 | v10 | v28 | `if (dette.some(d => d !== ctx)) { // v28 · imparata solo dalle cose salvate (spesso indovinate in automatico)…` |
| 16310 | v10 | v28 | `if (el.dataset.to && el.dataset.to === v.ctx) return; // v28 · già scelto` |
| 17404 | v12 | v45 | `&& c.pianificato_data && c.pianificato_data < oggi && !daPiano.has(c.id) && computeEffectiveQ(c) !== 1); // v…` |
| 17429 | v12 | v36 | `// v36 · «Cosa porti a casa oggi?»: la stellina sulle righe del piano e il conto nella testa della scheda` |
| 19353 | v26 | v35 | `// v35 · appuntamenti ora per ora: le ore libere restano righe vuote per scriverci quello che entra` |
| 19908 | v29 | v29.3 | `// v29.3 · ultima possibilità: il giorno stesso, prima dell'appuntamento` |
| 20085 | v29 | v29.3 | `giorni.push(e.giorno); // v29.3 · anche il giorno stesso, solo prima dell'appuntamento; mai dopo` |
| 20134 | v29 | v29.2 | `// v29.2 · a mano: solo i giorni da oggi al giorno prima dell'appuntamento (anche sabato e domenica)` |
| 20258 | v30 | v41 | `if (!e.serie && eventoFatto(e)) { scelte[k] = 'fatta'; cambiate = true; return; } // v41: spuntato come fatto…` |
| 20278 | v30 | v42 | `// v42: niente più trasformazione silenziosa: un promemoria passato senza risposta resta una domanda («L'hai …` |
| 21167 | v45 | v47 | `const indietro = c && !r.fatto && !c.done && c.pianificato_data && c.pianificato_data < oggiLocale() && ripet…` |
| 21168 | v45 | v46 | `if (indietro && opz && opz.passato && opz.data === c.pianificato_data) // v46: nel suo giorno passato resta s…` |
| 21186 | v45 | v47 | `const lista = typeof v47Indietro === 'function' ? v47Indietro() : v45SubitoIndietro(); // v47: tutte le rimas…` |
| 21416 | v48 | v49 | `if (!ui.eventi[settKey(w.week, w.year)] && !tok) return { t: '' }; // v49 · senza accesso a Google valgono gl…` |
| 125 | v1 (CSS) | v24 | `--v24-tratto: #C4B5FD; /* v24 · tempo tuo, bordo tratteggiato */` |

## 4. CSS: selettori definiti più volte

74 selettori compaiono in più regole nello stesso contesto (stessa `@media`). "Proprietà in conflitto" = la stessa proprietà impostata in più regole: vince l'ultima (o quella con `!important`). Non conto i selettori che si sovrappongono solo in parte (es. `.riga` e `#view .riga`): quelli sono molti di più e vanno visti a mano.

| Selettore | Contesto | Volte | Dove (versione · riga) | Proprietà in conflitto |
|---|---|---|---|---|
| `html:root` | — | 4 | v31 · 2031, v34 · 2256, v43 · 2335, v44.1 · 2424 | --bg, --surface, --surface-2, --surface-3, --border, --border-strong, --text, --text-2, --text-3, --done-title, --done-meta, --primary, --primary-deep, --primary-ink, --primary-soft, --on-primary, --q1, --q1-mark, --q1-soft, --q2, --q2-mark, --q2-soft, --q3, --q3-mark, --q3-soft, --q4, --q4-mark, --q4-soft, --evt, --evt-mark, --evt-soft, --v24-tratto, --pensa, --pensa-bordo, --pensa-ink, --danger, --danger-soft, --warn, --warn-soft, --inverse-bg, --inverse-text, --inverse-accent, --ring, --shadow-1, --shadow-2, --v26-ob-bg, --v26-ob-bordo, --v26-ob-ink, --v31-notte, --v31-notte-2, --v31-notte-3, --v31-luce, --v31-su-notte, --v31-su-notte-2, --v31-hl, --v34-sub-bg, --v34-sub-bordo, --v34-sub-ink, --v34-io, --v34-io-ink, --v34-altri, --v34-altri-ink, --v34-altri-2, --v34-lib, --v34-lib-bordo, --v34-lib-ink |
| `html:root[data-theme="dark"]` | — | 4 | v31 · 2057, v34 · 2257, v43 · 2358, v44.1 · 2431 | --bg, --surface, --surface-2, --surface-3, --border, --border-strong, --text, --text-2, --text-3, --done-title, --done-meta, --primary, --primary-deep, --primary-ink, --primary-soft, --on-primary, --q1, --q1-mark, --q1-soft, --q2, --q2-mark, --q2-soft, --q3, --q3-mark, --q3-soft, --evt, --evt-mark, --evt-soft, --v24-tratto, --pensa, --pensa-bordo, --pensa-ink, --danger, --danger-soft, --inverse-bg, --inverse-text, --inverse-accent, --ring, --v26-ob-bg, --v26-ob-bordo, --v26-ob-ink, --v34-sub-bg, --v34-sub-bordo, --v34-sub-ink, --v34-io, --v34-io-ink, --v34-altri, --v34-altri-ink, --v34-altri-2, --v34-lib, --v34-lib-bordo, --v34-lib-ink |
| `.spazio-riga` | — | 4 | v6 · 1258, v6 · 1259, v24 · 1889, v34 · 2276 | border, background |
| `.spazio-riga .item-title` | — | 4 | v6 · 1260, v6 · 1265, v24 · 1890, v34 · 2277 | color, font-weight |
| `:root` | — | 4 | v1 · 67, v1 · 98, v9 · 1360, v26 · 1912 | — (proprietà diverse: si sommano) |
| `html[data-theme="light"]` | — | 3 | v31 · 2031, v43 · 2335, v44.1 · 2424 | --bg, --surface, --surface-2, --surface-3, --border, --border-strong, --text, --text-2, --text-3, --done-title, --done-meta, --primary, --primary-deep, --primary-ink, --primary-soft, --on-primary, --q1, --q1-mark, --q1-soft, --q2, --q2-mark, --q2-soft, --q3, --q3-mark, --q3-soft, --q4, --q4-mark, --q4-soft, --evt, --evt-mark, --evt-soft, --v24-tratto, --pensa, --pensa-bordo, --pensa-ink, --danger, --danger-soft, --warn, --warn-soft, --inverse-bg, --inverse-text, --inverse-accent, --ring, --shadow-1, --shadow-2, --v26-ob-bg, --v26-ob-bordo, --v26-ob-ink, --v31-notte, --v31-notte-2, --v31-notte-3, --v31-luce, --v31-su-notte, --v31-su-notte-2, --v31-hl |
| `.board .evt-riga.v24-mio` | — | 3 | v24 · 1883, v34 · 2265, v34 · 2273 | margin, border-radius, border, box-shadow |
| `html:root .board .evt-riga.v24-altri` | — | 3 | v43 · 2394, v47 · 2495, v49 · 2593 | background (!), box-shadow (!) |
| `html:root .board .evt-riga.v24-mio` | — | 3 | v43 · 2400, v47 · 2495, v49 · 2596 | background (!), box-shadow (!) |
| `.v49-giorni` | `@media (max-width: 767px)` | 3 | v49 · 2553, v49 · 2558, v49 · 2559 | padding-left, padding-right |
| `.item.p-q1:not(.is-done) .item-row` | — | 3 | v1 · 472, v32 · 2143, v34 · 2259 | background |
| `body` | — | 3 | v1 · 185, v1 · 369, v1 · 370 | — (proprietà diverse: si sommano) |
| `.legenda` | — | 2 | v3 · 652, v6 · 1219 | display, flex-wrap, gap, font-size, color |
| `.logo` | — | 2 | v1 · 378, v31 · 2084 | font-family, font-size, letter-spacing, font-weight |
| `.list-head` | — | 2 | v1 · 442, v31 · 2089 | font-size, line-height, font-weight, color |
| `.v12-head span:first-child` | — | 2 | v12 · 1687, v31 · 2096 | letter-spacing, text-transform, font-size |
| `.v47-indietro > summary` | — | 2 | v47 · 2484, v49 · 2562 | display (!), align-items, gap |
| `.t-title` | — | 2 | v1 · 195, v31 · 2088 | font-weight, letter-spacing |
| `.check-box` | — | 2 | v1 · 239, v31 · 2091 | border-radius, border |
| `.vh h1` | — | 2 | v1 · 437, v31 · 2087 | font-weight, letter-spacing |
| `.list-head .mono` | — | 2 | v1 · 444, v31 · 2090 | color, font-size |
| `.evt-riga.evt-app.v24-altri` | — | 2 | v24 · 1878, v34 · 2268 | background, box-shadow |
| `.evt-riga.evt-app.v24-mio` | — | 2 | v24 · 1880, v34 · 2265 | background, box-shadow |
| `html:root .v40-riga.q1` | — | 2 | v43 · 2384, v44.1 · 2443 | background, border-color |
| `.v49-dom` | `@media (max-width: 767px)` | 2 | v49 · 2558, v49 · 2559 | padding-left, padding-right |
| `.v49-scelte` | `@media (max-width: 767px)` | 2 | v49 · 2558, v49 · 2559 | padding-left, padding-right |
| `.btn-primary` | — | 2 | v1 · 205, v31 · 2092 | box-shadow |
| `.btn-primary:active` | — | 2 | v1 · 206, v31 · 2093 | transform |
| `.item-side` | — | 2 | v1 · 266, v1 · 475 | gap |
| `.nav button[aria-current="page"] .nav-ico` | — | 2 | v1 · 328, v31 · 2094 | background |
| `.sheet-head` | — | 2 | v1 · 339, v3 · 680 | align-items |
| `.logo span` | — | 2 | v1 · 379, v31 · 2086 | color |
| `.meta-tag` | — | 2 | v8 · 791, v9 · 1361 | color |
| `.evt-cerchio` | — | 2 | v4 · 944, v9 · 1350 | display |
| `.bpw-sotto-h` | — | 2 | v4 · 996, v4 · 997 | color |
| `.cattura` | `@media print` | 2 | v5 · 1213, v6 · 1337 | display (!) |
| `.spazio-riga .evt-ico` | — | 2 | v6 · 1265, v34 · 2277 | color |
| `.sn-vedi` | — | 2 | v10 · 1550, v10 · 1551 | color |
| `.evt-riga.evt-app.v24-altri .item-title` | — | 2 | v24 · 1879, v34 · 2269 | color |
| `.spazio-riga .evt-ico .ti` | — | 2 | v24 · 1891, v34 · 2277 | color |
| `.v31-ad-ritmo > span` | — | 2 | v31 · 2113, v48 · 2512 | flex (!) |
| `.v31-ad-ritmo .btn:not(.btn-icon)` | — | 2 | v31 · 2114, v48 · 2513 | flex (!) |
| `.v40-dametti` | — | 2 | v40 · 2284, v40.2 · 2311 | gap |
| `.v40-gr-h` | — | 2 | v40 · 2289, v40.2 · 2313 | margin-top |
| `.v40-apri` | — | 2 | v40 · 2294, v40.2 · 2315 | padding |
| `.v40-apri .t` | — | 2 | v40 · 2295, v40.2 · 2316 | -webkit-line-clamp |
| `html:root .item.p-q1:not(.is-done) .item-row` | — | 2 | v43 · 2377, v44.1 · 2438 | background |
| `html:root .item.p-q1:not(.is-done) .check-box` | — | 2 | v43 · 2379, v44.1 · 2440 | border-color |
| `html:root .item.p-q1:not(.is-done) + .item.p-q1:not(.is-done)` | — | 2 | v43 · 2382, v44.1 · 2439 | border-top |
| `.v47-testa` | — | 2 | v47 · 2465, v50 · 2608 | background |
| `.v48-g.we` | — | 2 | v48 · 2510, v50 · 2629 | opacity |
| `html` | — | 2 | v1 · 184, v1 · 369 | — (proprietà diverse: si sommano) |
| `button` | — | 2 | v1 · 186, v1 · 187 | — (proprietà diverse: si sommano) |
| `.item-row` | — | 2 | v1 · 261, v1 · 471 | — (proprietà diverse: si sommano) |
| `.cattura` | — | 2 | v1 · 384, v8 · 760 | — (proprietà diverse: si sommano) |
| `.top` | — | 2 | v1 · 396, v13 · 1733 | — (proprietà diverse: si sommano) |
| `.top .seg` | — | 2 | v1 · 397, v1 · 399 | — (proprietà diverse: si sommano) |
| `.riga-link` | — | 2 | v1 · 456, v1 · 458 | — (proprietà diverse: si sommano) |
| `.cols .check` | — | 2 | v1 · 527, v1 · 528 | — (proprietà diverse: si sommano) |
| `.carry-giorni` | — | 2 | v1 · 561, v1 · 565 | — (proprietà diverse: si sommano) |
| `.guida-body ul` | — | 2 | v8 · 859, v8 · 860 | — (proprietà diverse: si sommano) |
| `.vh-board` | — | 2 | v6 · 1226, v22 · 1811 | — (proprietà diverse: si sommano) |
| `.board .evt-riga[draggable="true"]` | — | 2 | v6 · 1244, v6 · 1266 | — (proprietà diverse: si sommano) |
| `.persona-avviso > .ti` | — | 2 | v9 · 1504, v9 · 1510 | — (proprietà diverse: si sommano) |
| `.sn-q` | — | 2 | v10 · 1532, v10 · 1533 | — (proprietà diverse: si sommano) |
| `.sn-dett` | — | 2 | v10 · 1619, v10 · 1647 | — (proprietà diverse: si sommano) |
| `.evt-riga.evt-app.v24-mio .evt-cerchio` | — | 2 | v24 · 1881, v34 · 2266 | — (proprietà diverse: si sommano) |
| `.board .evt-riga.v24-altri` | — | 2 | v34 · 2268, v34 · 2273 | — (proprietà diverse: si sommano) |
| `.v40-riga` | — | 2 | v40 · 2291, v40.2 · 2314 | — (proprietà diverse: si sommano) |
| `.v43-metodo .v12-coach li` | — | 2 | v43 · 2406, v46 · 2453 | — (proprietà diverse: si sommano) |
| `.v47-testa .vh-board` | — | 2 | v47 · 2487, v47 · 2490 | — (proprietà diverse: si sommano) |
| `.v49-sc b` | — | 2 | v49 · 2539, v49 · 2540 | — (proprietà diverse: si sommano) |
| `.v49-sc small` | — | 2 | v49 · 2539, v49 · 2541 | — (proprietà diverse: si sommano) |
| `.v49-piede` | `@media (max-width: 767px)` | 2 | v49 · 2552, v49 · 2558 | — (proprietà diverse: si sommano) |

### 4.1 Dettaglio dei conflitti più pesanti

- `html:root`:
  - `--bg`: v31·2031 → `#F4EFE4` ⟶ v43·2335 → `#F6F4EF`
  - `--surface`: v31·2031 → `#FFFCF5` ⟶ v43·2335 → `#FFFFFF`
  - `--surface-2`: v31·2031 → `#EDE6D7` ⟶ v43·2335 → `#F0EDE6`
  - `--surface-3`: v31·2031 → `#FFFCF5` ⟶ v43·2335 → `#FFFFFF`
  - `--border`: v31·2031 → `#E3DAC7` ⟶ v43·2335 → `#E7E2D7`
  - `--border-strong`: v31·2031 → `#8A8270` ⟶ v43·2335 → `#9A9486`
  - `--text`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#1B1A17`
  - `--text-2`: v31·2031 → `#55503F` ⟶ v43·2335 → `#5C574D`
  - `--text-3`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--done-title`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--done-meta`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--primary`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#2F6B57`
  - `--primary-deep`: v31·2031 → `#000000` ⟶ v43·2335 → `#234F41`
  - `--primary-ink`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#2F6B57`
  - `--primary-soft`: v31·2031 → `#FAEFC3` ⟶ v43·2335 → `#E6F0EB`
  - `--on-primary`: v31·2031 → `#F4EFE4` ⟶ v43·2335 → `#FFFFFF`
  - `--q1`: v31·2031 → `#B3261E` ⟶ v43·2335 → `#A8431F` ⟶ v44.1·2424 → `#B42318`
  - `--q1-mark`: v31·2031 → `#B3261E` ⟶ v43·2335 → `#C2552D` ⟶ v44.1·2424 → `#D92D20`
  - `--q1-soft`: v31·2031 → `#F6E1DB` ⟶ v43·2335 → `#FAEDE6` ⟶ v44.1·2424 → `#FDEEEC`
  - `--q2`: v31·2031 → `#1E5E4E` ⟶ v43·2335 → `#2F6B57` ⟶ v44.1·2424 → `#1D4ED8`
  - `--q2-mark`: v31·2031 → `#1E5E4E` ⟶ v43·2335 → `#2F6B57` ⟶ v44.1·2424 → `#2563EB`
  - `--q2-soft`: v31·2031 → `#DCEAE3` ⟶ v43·2335 → `#E6F0EB` ⟶ v44.1·2424 → `#EBF1FE`
  - `--q3`: v31·2031 → `#3F6E7A` ⟶ v43·2335 → `#3E5C76` ⟶ v44.1·2424 → `#8A5A00`
  - `--q3-mark`: v31·2031 → `#3F6E7A` ⟶ v43·2335 → `#3E5C76` ⟶ v44.1·2424 → `#A16207`
  - `--q3-soft`: v31·2031 → `#E1ECEE` ⟶ v43·2335 → `#E6EDF3` ⟶ v44.1·2424 → `#FBF1DC`
  - `--q4`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--q4-mark`: v31·2031 → `#8A8270` ⟶ v43·2335 → `#9A9486`
  - `--q4-soft`: v31·2031 → `#EDE6D7` ⟶ v43·2335 → `#F0EDE6`
  - `--evt`: v31·2031 → `#5E4B8B` ⟶ v43·2335 → `#55548A`
  - `--evt-mark`: v31·2031 → `#5E4B8B` ⟶ v43·2335 → `#5B5A8E`
  - `--evt-soft`: v31·2031 → `#EEEAF5` ⟶ v43·2335 → `#EFEFF7`
  - `--v24-tratto`: v31·2031 → `#B9AED3` ⟶ v43·2335 → `#B9B8D8`
  - `--pensa`: v31·2031 → `#FAEFC3` ⟶ v43·2335 → `#F7F2E2`
  - `--pensa-bordo`: v31·2031 → `#D9B43A` ⟶ v43·2335 → `#DCCB8E`
  - `--pensa-ink`: v31·2031 → `#5E4A00` ⟶ v43·2335 → `#5E4A00`
  - `--danger`: v31·2031 → `#B3261E` ⟶ v43·2335 → `#A8431F` ⟶ v44.1·2424 → `#B42318`
  - `--danger-soft`: v31·2031 → `#F6E1DB` ⟶ v43·2335 → `#FAEDE6` ⟶ v44.1·2424 → `#FDEEEC`
  - `--warn`: v31·2031 → `#8A5A00` ⟶ v43·2335 → `#8A5A00`
  - `--warn-soft`: v31·2031 → `#F7EBCF` ⟶ v43·2335 → `#F7EED6`
  - `--inverse-bg`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#1D2A24`
  - `--inverse-text`: v31·2031 → `#F4EFE4` ⟶ v43·2335 → `#EEF2EE`
  - `--inverse-accent`: v31·2031 → `#8FE3C8` ⟶ v43·2335 → `#A7E3C5`
  - `--ring`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#2F6B57`
  - `--shadow-1`: v31·2031 → `0 1px 0 rgba(28, 27, 24, .04)` ⟶ v43·2335 → `0 1px 2px rgba(27, 26, 23, .05)`
  - `--shadow-2`: v31·2031 → `0 1px 0 rgba(28, 27, 24, .04), 0 6px 16px rgba(60…` ⟶ v43·2335 → `0 1px 2px rgba(27, 26, 23, .05), 0 6px 18px rgba(…`
  - `--v26-ob-bg`: v31·2031 → `#E4E8F6` ⟶ v43·2335 → `#EDF1FD` ⟶ v44.1·2424 → `#EEF0F8`
  - `--v26-ob-bordo`: v31·2031 → `#B5C0E6` ⟶ v43·2335 → `#CAD5F7` ⟶ v44.1·2424 → `#C7CCE6`
  - `--v26-ob-ink`: v31·2031 → `#2343A6` ⟶ v43·2335 → `#2F55D4` ⟶ v44.1·2424 → `#1E3A8A`
  - `--v31-notte`: v31·2031 → `#151410` ⟶ v43·2335 → `#1D2A24`
  - `--v31-notte-2`: v31·2031 → `#211F19` ⟶ v43·2335 → `#26352E`
  - `--v31-notte-3`: v31·2031 → `#2E2B23` ⟶ v43·2335 → `#344A40`
  - `--v31-luce`: v31·2031 → `#8FE3C8` ⟶ v43·2335 → `#A7E3C5`
  - `--v31-su-notte`: v31·2031 → `#F3EEE3` ⟶ v43·2335 → `#EEF2EE`
  - `--v31-su-notte-2`: v31·2031 → `#B9B2A2` ⟶ v43·2335 → `#B5C4BB`
  - `--v31-hl`: v31·2031 → `#F1CE4A` ⟶ v43·2335 → `#E9D27A`
  - `--v34-sub-bg`: v34·2256 → `#F6E1DB` ⟶ v43·2335 → `transparent`
  - `--v34-sub-bordo`: v34·2256 → `#D9776E` ⟶ v43·2335 → `var(--border)`
  - `--v34-sub-ink`: v34·2256 → `#5A1410` ⟶ v43·2335 → `var(--text)`
  - `--v34-io`: v34·2256 → `#EEEAF5` ⟶ v43·2335 → `#FFFFFF`
  - `--v34-io-ink`: v34·2256 → `#5E4B8B` ⟶ v43·2335 → `#55548A`
  - `--v34-altri`: v34·2256 → `#5E4B8B` ⟶ v43·2335 → `#EFEFF7`
  - `--v34-altri-ink`: v34·2256 → `#FFFFFF` ⟶ v43·2335 → `#1B1A17`
  - `--v34-altri-2`: v34·2256 → `#E4DEF3` ⟶ v43·2335 → `#55548A`
  - `--v34-lib`: v34·2256 → `#EEF6F2` ⟶ v43·2335 → `#F1F6F2`
  - `--v34-lib-bordo`: v34·2256 → `#9CC9B8` ⟶ v43·2335 → `#A9CBB9`
  - `--v34-lib-ink`: v34·2256 → `#1E5E4E` ⟶ v43·2335 → `#2F6B57`
- `html:root[data-theme="dark"]`:
  - `--bg`: v31·2057 → `#12110E` ⟶ v43·2358 → `#121513`
  - `--surface`: v31·2057 → `#1B1A16` ⟶ v43·2358 → `#1A1E1B`
  - `--surface-2`: v31·2057 → `#24221C` ⟶ v43·2358 → `#232823`
  - `--surface-3`: v31·2057 → `#2E2B23` ⟶ v43·2358 → `#2D332E`
  - `--border`: v31·2057 → `#2C2A23` ⟶ v43·2358 → `#2D332E`
  - `--border-strong`: v31·2057 → `#8D8676` ⟶ v43·2358 → `#8C968E`
  - `--text`: v31·2057 → `#F1ECE1` ⟶ v43·2358 → `#EEF1EC`
  - `--text-2`: v31·2057 → `#BDB5A4` ⟶ v43·2358 → `#B9C1BA`
  - `--text-3`: v31·2057 → `#A39B8A` ⟶ v43·2358 → `#A0A9A1`
  - `--done-title`: v31·2057 → `#BDB5A4` ⟶ v43·2358 → `#B9C1BA`
  - `--done-meta`: v31·2057 → `#A39B8A` ⟶ v43·2358 → `#A0A9A1`
  - `--primary`: v31·2057 → `#F1ECE1` ⟶ v43·2358 → `#7FC8A9`
  - `--primary-deep`: v31·2057 → `#BDB5A4` ⟶ v43·2358 → `#5FAE8D`
  - `--primary-ink`: v31·2057 → `#F1ECE1` ⟶ v43·2358 → `#9ADBBF`
  - `--primary-soft`: v31·2057 → `#3A3217` ⟶ v43·2358 → `#1C3229`
  - `--on-primary`: v31·2057 → `#12110E` ⟶ v43·2358 → `#0E1A15`
  - `--q1`: v31·2057 → `#FF8A7A` ⟶ v43·2358 → `#F0936F` ⟶ v44.1·2431 → `#FF8A80`
  - `--q1-mark`: v31·2057 → `#FF8A7A` ⟶ v43·2358 → `#F0936F` ⟶ v44.1·2431 → `#F97066`
  - `--q1-soft`: v31·2057 → `#3A1F1A` ⟶ v43·2358 → `#3A2219` ⟶ v44.1·2431 → `#3A1C1A`
  - `--q2`: v31·2057 → `#8FE3C8` ⟶ v43·2358 → `#7FC8A9` ⟶ v44.1·2431 → `#93B4FF`
  - `--q2-mark`: v31·2057 → `#8FE3C8` ⟶ v43·2358 → `#7FC8A9` ⟶ v44.1·2431 → `#7EA6FF`
  - `--q2-soft`: v31·2057 → `#173129` ⟶ v43·2358 → `#1C3229` ⟶ v44.1·2431 → `#1B2744`
  - `--q3`: v31·2057 → `#9CCAD6` ⟶ v43·2358 → `#9DB8CF` ⟶ v44.1·2431 → `#E9B949`
  - `--q3-mark`: v31·2057 → `#9CCAD6` ⟶ v43·2358 → `#9DB8CF` ⟶ v44.1·2431 → `#E9B949`
  - `--q3-soft`: v31·2057 → `#182A2F` ⟶ v43·2358 → `#1B2731` ⟶ v44.1·2431 → `#33270F`
  - `--evt`: v31·2057 → `#B9A8E6` ⟶ v43·2358 → `#B9B6E8`
  - `--evt-mark`: v31·2057 → `#B9A8E6` ⟶ v43·2358 → `#B9B6E8`
  - `--evt-soft`: v31·2057 → `#262035` ⟶ v43·2358 → `#25243A`
  - `--v24-tratto`: v31·2057 → `#5B4F7E` ⟶ v43·2358 → `#55548A`
  - `--pensa`: v31·2057 → `#3A3217` ⟶ v43·2358 → `#2C2714`
  - `--pensa-bordo`: v31·2057 → `#7A6420` ⟶ v43·2358 → `#6F6226`
  - `--pensa-ink`: v31·2057 → `#F2D675` ⟶ v43·2358 → `#EAD78F`
  - `--danger`: v31·2057 → `#FF8A7A` ⟶ v43·2358 → `#F0936F` ⟶ v44.1·2431 → `#FF8A80`
  - `--danger-soft`: v31·2057 → `#3A1F1A` ⟶ v43·2358 → `#3A2219` ⟶ v44.1·2431 → `#3A1C1A`
  - `--inverse-bg`: v31·2057 → `#F1ECE1` ⟶ v43·2358 → `#EEF1EC`
  - `--inverse-text`: v31·2057 → `#12110E` ⟶ v43·2358 → `#1D2A24`
  - `--inverse-accent`: v31·2057 → `#1E5E4E` ⟶ v43·2358 → `#2F6B57`
  - `--ring`: v31·2057 → `#8FE3C8` ⟶ v43·2358 → `#9ADBBF`
  - `--v26-ob-bg`: v31·2057 → `#1D2440` ⟶ v43·2358 → `#1B2340` ⟶ v44.1·2431 → `#1A2038`
  - `--v26-ob-bordo`: v31·2057 → `#34407A` ⟶ v43·2358 → `#2F3D6E` ⟶ v44.1·2431 → `#2E3A66`
  - `--v26-ob-ink`: v31·2057 → `#9DB2FF` ⟶ v43·2358 → `#A9BBFF` ⟶ v44.1·2431 → `#B4C6FF`
  - `--v34-sub-bg`: v34·2257 → `#3A1F1A` ⟶ v43·2358 → `transparent`
  - `--v34-sub-bordo`: v34·2257 → `#8C3B33` ⟶ v43·2358 → `var(--border)`
  - `--v34-sub-ink`: v34·2257 → `#FFD9D3` ⟶ v43·2358 → `var(--text)`
  - `--v34-io`: v34·2257 → `#262035` ⟶ v43·2358 → `var(--surface)`
  - `--v34-io-ink`: v34·2257 → `#C9BCEB` ⟶ v43·2358 → `#B9B6E8`
  - `--v34-altri`: v34·2257 → `#6C5AA0` ⟶ v43·2358 → `#25243A`
  - `--v34-altri-ink`: v34·2257 → `#FFFFFF` ⟶ v43·2358 → `#EEF1EC`
  - `--v34-altri-2`: v34·2257 → `#E4DEF3` ⟶ v43·2358 → `#B9B6E8`
  - `--v34-lib`: v34·2257 → `#14281F` ⟶ v43·2358 → `#152420`
  - `--v34-lib-bordo`: v34·2257 → `#2F6B57` ⟶ v43·2358 → `#2F5A4A`
  - `--v34-lib-ink`: v34·2257 → `#8FE3C8` ⟶ v43·2358 → `#9ADBBF`
- `.spazio-riga`:
  - `border`: v6·1258 → `1.5px dashed var(--border-strong)` ⟶ v24·1889 → `1.5px dotted var(--border-strong)` ⟶ v34·2276 → `1.5px dashed var(--v34-lib-bordo)`
  - `background`: v6·1258 → `transparent` ⟶ v24·1889 → `transparent` ⟶ v34·2276 → `var(--v34-lib)`
- `.spazio-riga .item-title`:
  - `color`: v6·1265 → `var(--text-3)` ⟶ v24·1890 → `var(--text-3)` ⟶ v34·2277 → `var(--v34-lib-ink)`
  - `font-weight`: v24·1890 → `500` ⟶ v34·2277 → `600`
- `html[data-theme="light"]`:
  - `--bg`: v31·2031 → `#F4EFE4` ⟶ v43·2335 → `#F6F4EF`
  - `--surface`: v31·2031 → `#FFFCF5` ⟶ v43·2335 → `#FFFFFF`
  - `--surface-2`: v31·2031 → `#EDE6D7` ⟶ v43·2335 → `#F0EDE6`
  - `--surface-3`: v31·2031 → `#FFFCF5` ⟶ v43·2335 → `#FFFFFF`
  - `--border`: v31·2031 → `#E3DAC7` ⟶ v43·2335 → `#E7E2D7`
  - `--border-strong`: v31·2031 → `#8A8270` ⟶ v43·2335 → `#9A9486`
  - `--text`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#1B1A17`
  - `--text-2`: v31·2031 → `#55503F` ⟶ v43·2335 → `#5C574D`
  - `--text-3`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--done-title`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--done-meta`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--primary`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#2F6B57`
  - `--primary-deep`: v31·2031 → `#000000` ⟶ v43·2335 → `#234F41`
  - `--primary-ink`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#2F6B57`
  - `--primary-soft`: v31·2031 → `#FAEFC3` ⟶ v43·2335 → `#E6F0EB`
  - `--on-primary`: v31·2031 → `#F4EFE4` ⟶ v43·2335 → `#FFFFFF`
  - `--q1`: v31·2031 → `#B3261E` ⟶ v43·2335 → `#A8431F` ⟶ v44.1·2424 → `#B42318`
  - `--q1-mark`: v31·2031 → `#B3261E` ⟶ v43·2335 → `#C2552D` ⟶ v44.1·2424 → `#D92D20`
  - `--q1-soft`: v31·2031 → `#F6E1DB` ⟶ v43·2335 → `#FAEDE6` ⟶ v44.1·2424 → `#FDEEEC`
  - `--q2`: v31·2031 → `#1E5E4E` ⟶ v43·2335 → `#2F6B57` ⟶ v44.1·2424 → `#1D4ED8`
  - `--q2-mark`: v31·2031 → `#1E5E4E` ⟶ v43·2335 → `#2F6B57` ⟶ v44.1·2424 → `#2563EB`
  - `--q2-soft`: v31·2031 → `#DCEAE3` ⟶ v43·2335 → `#E6F0EB` ⟶ v44.1·2424 → `#EBF1FE`
  - `--q3`: v31·2031 → `#3F6E7A` ⟶ v43·2335 → `#3E5C76` ⟶ v44.1·2424 → `#8A5A00`
  - `--q3-mark`: v31·2031 → `#3F6E7A` ⟶ v43·2335 → `#3E5C76` ⟶ v44.1·2424 → `#A16207`
  - `--q3-soft`: v31·2031 → `#E1ECEE` ⟶ v43·2335 → `#E6EDF3` ⟶ v44.1·2424 → `#FBF1DC`
  - `--q4`: v31·2031 → `#6B6553` ⟶ v43·2335 → `#6B665B`
  - `--q4-mark`: v31·2031 → `#8A8270` ⟶ v43·2335 → `#9A9486`
  - `--q4-soft`: v31·2031 → `#EDE6D7` ⟶ v43·2335 → `#F0EDE6`
  - `--evt`: v31·2031 → `#5E4B8B` ⟶ v43·2335 → `#55548A`
  - `--evt-mark`: v31·2031 → `#5E4B8B` ⟶ v43·2335 → `#5B5A8E`
  - `--evt-soft`: v31·2031 → `#EEEAF5` ⟶ v43·2335 → `#EFEFF7`
  - `--v24-tratto`: v31·2031 → `#B9AED3` ⟶ v43·2335 → `#B9B8D8`
  - `--pensa`: v31·2031 → `#FAEFC3` ⟶ v43·2335 → `#F7F2E2`
  - `--pensa-bordo`: v31·2031 → `#D9B43A` ⟶ v43·2335 → `#DCCB8E`
  - `--pensa-ink`: v31·2031 → `#5E4A00` ⟶ v43·2335 → `#5E4A00`
  - `--danger`: v31·2031 → `#B3261E` ⟶ v43·2335 → `#A8431F` ⟶ v44.1·2424 → `#B42318`
  - `--danger-soft`: v31·2031 → `#F6E1DB` ⟶ v43·2335 → `#FAEDE6` ⟶ v44.1·2424 → `#FDEEEC`
  - `--warn`: v31·2031 → `#8A5A00` ⟶ v43·2335 → `#8A5A00`
  - `--warn-soft`: v31·2031 → `#F7EBCF` ⟶ v43·2335 → `#F7EED6`
  - `--inverse-bg`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#1D2A24`
  - `--inverse-text`: v31·2031 → `#F4EFE4` ⟶ v43·2335 → `#EEF2EE`
  - `--inverse-accent`: v31·2031 → `#8FE3C8` ⟶ v43·2335 → `#A7E3C5`
  - `--ring`: v31·2031 → `#1C1B18` ⟶ v43·2335 → `#2F6B57`
  - `--shadow-1`: v31·2031 → `0 1px 0 rgba(28, 27, 24, .04)` ⟶ v43·2335 → `0 1px 2px rgba(27, 26, 23, .05)`
  - `--shadow-2`: v31·2031 → `0 1px 0 rgba(28, 27, 24, .04), 0 6px 16px rgba(60…` ⟶ v43·2335 → `0 1px 2px rgba(27, 26, 23, .05), 0 6px 18px rgba(…`
  - `--v26-ob-bg`: v31·2031 → `#E4E8F6` ⟶ v43·2335 → `#EDF1FD` ⟶ v44.1·2424 → `#EEF0F8`
  - `--v26-ob-bordo`: v31·2031 → `#B5C0E6` ⟶ v43·2335 → `#CAD5F7` ⟶ v44.1·2424 → `#C7CCE6`
  - `--v26-ob-ink`: v31·2031 → `#2343A6` ⟶ v43·2335 → `#2F55D4` ⟶ v44.1·2424 → `#1E3A8A`
  - `--v31-notte`: v31·2031 → `#151410` ⟶ v43·2335 → `#1D2A24`
  - `--v31-notte-2`: v31·2031 → `#211F19` ⟶ v43·2335 → `#26352E`
  - `--v31-notte-3`: v31·2031 → `#2E2B23` ⟶ v43·2335 → `#344A40`
  - `--v31-luce`: v31·2031 → `#8FE3C8` ⟶ v43·2335 → `#A7E3C5`
  - `--v31-su-notte`: v31·2031 → `#F3EEE3` ⟶ v43·2335 → `#EEF2EE`
  - `--v31-su-notte-2`: v31·2031 → `#B9B2A2` ⟶ v43·2335 → `#B5C4BB`
  - `--v31-hl`: v31·2031 → `#F1CE4A` ⟶ v43·2335 → `#E9D27A`
- `.board .evt-riga.v24-mio`:
  - `margin`: v24·1883 → `4px` ⟶ v34·2273 → `4px`
  - `border-radius`: v24·1883 → `var(--r-sm)` ⟶ v34·2273 → `var(--r-sm)`
  - `border`: v24·1883 → `1.5px dashed var(--v24-tratto)` ⟶ v34·2265 → `0`
  - `box-shadow`: v24·1883 → `none` ⟶ v34·2265 → `none`
- `html:root .board .evt-riga.v24-altri`:
  - `background`: v43·2394 → `var(--v34-altri)` ⟶ v47·2495 → `var(--surface)` ⟶ v49·2593 → `var(--evt-mark, #5B5A8E)` !important
  - `box-shadow`: v43·2394 → `inset 3px 0 0 var(--evt-mark)` ⟶ v49·2593 → `none` !important
- `html:root .board .evt-riga.v24-mio`:
  - `background`: v43·2400 → `var(--surface)` ⟶ v47·2495 → `var(--surface)` ⟶ v49·2596 → `var(--evt-soft, #EFEFF7)` !important
  - `box-shadow`: v43·2400 → `inset 3px 0 0 var(--v24-tratto)` ⟶ v49·2596 → `none` !important
- `.v49-giorni` in `@media (max-width: 767px)`:
  - `padding-left`: v49·2558 → `16px` ⟶ v49·2559 → `0`
  - `padding-right`: v49·2558 → `16px` ⟶ v49·2559 → `0`
- `.item.p-q1:not(.is-done) .item-row`:
  - `background`: v1·472 → `var(--q1-soft)` ⟶ v32·2143 → `var(--surface)` ⟶ v34·2259 → `var(--v34-sub-bg)`
- `.legenda`:
  - `display`: v3·652 → `flex` ⟶ v6·1219 → `flex`
  - `flex-wrap`: v3·652 → `wrap` ⟶ v6·1219 → `wrap`
  - `gap`: v3·652 → `var(--sp-3)` ⟶ v6·1219 → `var(--sp-2) var(--sp-4)`
  - `font-size`: v3·652 → `var(--fs-caption)` ⟶ v6·1219 → `var(--fs-caption)`
  - `color`: v3·652 → `var(--text-2)` ⟶ v6·1219 → `var(--text-2)`
- `.logo`:
  - `font-family`: v1·378 → `'Bebas Neue', var(--font-sans)` ⟶ v31·2084 → `var(--font-serif)`
  - `font-size`: v1·378 → `24px` ⟶ v31·2084 → `19px`
  - `letter-spacing`: v1·378 → `2px` ⟶ v31·2084 → `-.02em`
  - `font-weight`: v1·378 → `400` ⟶ v31·2084 → `650`
- `.list-head`:
  - `font-size`: v1·442 → `var(--fs-label)` ⟶ v31·2089 → `18px`
  - `line-height`: v1·442 → `var(--lh-label)` ⟶ v31·2089 → `24px`
  - `font-weight`: v1·442 → `var(--fw-strong)` ⟶ v31·2089 → `600`
  - `color`: v1·442 → `var(--text-2)` ⟶ v31·2089 → `var(--text)`
- `.v12-head span:first-child`:
  - `letter-spacing`: v12·1687 → `.06em` ⟶ v31·2096 → `-.01em`
  - `text-transform`: v12·1687 → `uppercase` ⟶ v31·2096 → `none`
  - `font-size`: v12·1687 → `var(--fs-caption)` ⟶ v31·2096 → `18px`
- `.v47-indietro > summary`:
  - `display`: v47·2484 → `flex` ⟶ v49·2562 → `flex` !important
  - `align-items`: v47·2484 → `center` ⟶ v49·2562 → `center`
  - `gap`: v47·2484 → `6px` ⟶ v49·2562 → `6px`

## 5. CSS: `!important`

Per versione:

| Versione | `!important` |
|---|---|
| v1 | 3 |
| v3 | 13 |
| v4 | 3 |
| v6 | 3 |
| v8 | 1 |
| v10 | 2 |
| v18 | 1 |
| v32 | 2 |
| v33 | 2 |
| v34 | 1 |
| v43 | 2 |
| v47 | 2 |
| v48 | 2 |
| v49 | 35 |
| v50 | 24 |

Elenco (selettore · proprietà · riga):

| Riga | Versione | Selettore | Proprietà |
|---|---|---|---|
| 372 | v1 | `[hidden]` | display |
| 452 | v1 | `.solo-tel` (@media (min-width: 768px)) | display |
| 453 | v1 | `.solo-desk` (@media (max-width: 767px)) | display |
| 623 | v3 | `.semplice .q2-nudge` | display |
| 637 | v3 | `*::after` (@media (prefers-reduced-motion: reduce)) | animation-duration, animation-iteration-count, transition-duration, scroll-behavior |
| 677 | v3 | `.sheet-narrow` | max-width |
| 690 | v3 | `.sheet-wide` (@media (min-width: 768px)) | max-width |
| 727 | v3 | `.pchip` | background, color |
| 728 | v3 | `.pchip-av` | background, color |
| 733 | v3 | `.persona-dd-av` | background, color |
| 803 | v8 | `.bp-qgroup-hd span[style]` | color |
| 962 | v4 | `.blocco-ico` | font-size, color |
| 1052 | v4 | `.invia-ogg` | font-family |
| 1282 | v6 | `.riordina-overlay` | align-items, padding |
| 1337 | v6 | `.riordina-overlay` (@media print) | display |
| 1581 | v10 | `#bprev-back[hidden]` | display |
| 1622 | v10 | `.bp-sn.sheet-wide` (@media (min-width: 768px)) | max-width |
| 1789 | v18 | `.v18-menu-cestino` | color |
| 2172 | v32 | `.v32-coppia > *` (@media (max-width: 767px)) | margin-bottom |
| 2189 | v32 | `.v12-head .mono .v32-tel-n` (@media (max-width: 767px)) | display |
| 2225 | v33 | `.v33-col > .v12-prima:first-child .list-head` (@media (min-width: 1280px)) | margin-top |
| 2230 | v33 | `.v33-dx > .group` (@media (min-width: 1280px)) | margin-top |
| 2270 | v34 | `.evt-riga.evt-app.v24-altri .evt-ico .ti` | color |
| 2396 | v43 | `html:root .evt-riga.evt-app.v24-altri .evt-ico .ti` | color |
| 2397 | v43 | `html:root .evt-riga.evt-app.v24-altri .item-meta .mono` | color |
| 2480 | v47 | `.v47-on .cols.board` | min-width |
| 2489 | v47 | `.v47-testa .v22-testa` | flex-wrap |
| 2512 | v48 | `.v31-ad-ritmo > span` | flex |
| 2513 | v48 | `.v31-ad-ritmo .btn:not(.btn-icon)` | flex |
| 2562 | v49 | `.v47-indietro > summary` | display |
| 2572 | v49 | `.v49-ctl > .v49-diretto` | margin, border, border-top, border-radius, box-shadow |
| 2584 | v49 | `.v49-r-corpo > *` | margin |
| 2586 | v49 | `.board .bzona:not(#dp-lista)` | background, border, box-shadow, padding, overflow |
| 2587 | v49 | `.board .bzona > details > .item` | margin, border-radius, border, box-shadow |
| 2588 | v49 | `.board .bzona > .item.p-q1` | border-color |
| 2589 | v49 | `.board .bzona > .item.p-q2` | box-shadow |
| 2590 | v49 | `.board .bzona > .fascia-h` | background, border |
| 2593 | v49 | `html:root .board .evt-riga.v24-altri` | background, border-color, box-shadow |
| 2594 | v49 | `html:root .board .evt-riga.v24-altri .v18-cestino` | color |
| 2595 | v49 | `html:root .board .evt-riga.v24-altri .evt-cerchio` | border-color |
| 2596 | v49 | `html:root .board .evt-riga.v24-mio` | background, border-color, box-shadow |
| 2599 | v49 | `html:root .board .bzona > .spazio-riga` | min-height, padding, background, border, box-shadow |
| 2603 | v49 | `html:root[data-theme="dark"] .board .bzona > .item.p-q1` | border-color |
| 2604 | v49 | `html:root[data-theme="dark"] .board .bzona > .spazio-riga` | border-color |
| 2610 | v50 | `#view.v50-oggi .v12-righe` | background, border, box-shadow, overflow |
| 2611 | v50 | `#view.v50-oggi .v12-rosso .v12-righe` | padding |
| 2612 | v50 | `#view.v50-oggi .v12-righe > .item` | margin, border, border-radius |
| 2613 | v50 | `#view.v50-oggi .v12-righe > .item + .item` | border-top |
| 2614 | v50 | `#view.v50-oggi .v12-righe > .item.p-q1` | border-color |
| 2615 | v50 | `#view.v50-oggi .v12-righe > .item.p-q2` | border-color |
| 2616 | v50 | `#view.v50-oggi .v12-righe > .item.p-q3` | border-color |
| 2617 | v50 | `#view.v50-oggi .item.p-q2::before` | display |
| 2618 | v50 | `#view.v50-oggi .group.giornata` | background, border, box-shadow |
| 2619 | v50 | `#view.v50-oggi .group.giornata > .evt-riga` | margin, border-radius |
| 2620 | v50 | `html:root[data-theme="dark"] #view.v50-oggi .v12-righe > .item.p-q1` | border-color |
| 2621 | v50 | `html:root[data-theme="dark"] #view.v50-oggi .v12-righe > .item.p-q2` | border-color |
| 2622 | v50 | `html:root[data-theme="dark"] #view.v50-oggi .v12-righe > .item.p-q3` | border-color |
| 2623 | v50 | `html:root[data-theme="dark"] .board .bzona > .item.p-q2` | box-shadow |
| 2633 | v50 | `html:root[data-theme="dark"] .board .evt-riga.v24-altri` | background, border-color |

## 6. Codice morto

### 6.1 Funzioni mai chiamate

Nessun riferimento nel file (né nel JS, né negli `onclick` dell'HTML, né come alias poi usato). Quasi tutte vengono dalla v1 (`index.legacy.html`) e sono rimaste orfane col redesign v2. Attenzione: una funzione chiamata solo da un'altra funzione morta non compare qui (morte "di secondo livello").

| Funzione | Versione · riga | Commento |
|---|---|---|
| `formatWeekLabel` | v1 · 3631–3636 | INIT SUPABASE |
| `catIcona` | v1 · 3685–3694 | INIT SUPABASE |
| `filterByCat` | v1 · 3853–3858 | NAVIGATION |
| `filterByPersona` | v1 · 3860–3863 | NAVIGATION |
| `dayName` | v1 · 4602–4604 | DATE UTILS |
| `monthName` | v1 · 4606–4610 | DATE UTILS |
| `getMaCssClass` | v1 · 4615–4619 | MACRO AREA HELPERS |
| `getMaColor` | v1 · 4621 | MACRO AREA HELPERS |
| `getMaEmoji` | v1 · 4622 | MACRO AREA HELPERS |
| `retryFailedSyncs` | v1 · 4945–4952 | AUTO-CATEGORIZZAZIONE CLAUDE |
| `batchSyncAll` | v1 · 4965–4975 | AUTO-CATEGORIZZAZIONE CLAUDE |
| `openPostponeModal` | v1 · 5001–5009 | Pre-fill date input |
| `agendaDayDate` | v1 · 5112–5117 | Data del giorno `idx` (0=lunedì) nella settimana selezionata |
| `isSameDay` | v1 · 5119–5121 | VISTA AGENDA SETTIMANALE |
| `agendaPianificati` | v1 · 5233 | I rituali giornalieri hanno un blocco dedicato: escludili dalla griglia settimanale, altrimenti com… |
| `agendaDaPianificare` | v1 · 5234 | VISTA AGENDA SETTIMANALE |
| `parcheggiaCiclo` | v1 · 5323–5336 | ── AZIONI PARCHEGGIO ── |
| `bpPctClass` | v1 · 5779 | BATTLE PLAN — PIANO DI BATTAGLIA SETTIMANALE |
| `q2PianificaOra` | v1 · 6445–6456 | Banner informativo sotto il quadrant picker: i Q2 non urgenti spariscono se non vengono piazzati in… |
| `switchView` | v2 · 6657–6669 | Nomi di vista della versione precedente → nuove sezioni (li usa ancora la logica). |
| `chiudiRapido` | v3 · 9464 | v3 · INSERIMENTO A UN CAMPO («+»): Invio = salvata, una riga = una cosa |
| `v30InDaPianificare` | v30 · 20235–20242 | già fatta su un altro dispositivo |

### 6.2 Azioni senza bottone

Su 346 chiavi di `AZIONI`, queste non compaiono in nessun `data-act` né in nessuna stringa:

- `v40-tutte` (v40, riga 20826)

### 6.3 Classi CSS senza elementi

Classi usate nei selettori ma mai scritte nell'HTML né nel JS (cercate come parola intera).

| Classe | Regole | Righe CSS | Versioni |
|---|---|---|---|
| `.is-open` | 4 | 268, 269, 280, 281 | v1 |
| `.item-detail` | 2 | 279, 280 | v1 |
| `.item-note` | 1 | 282 | v1 |
| `.facts` | 1 | 283 | v1 |
| `.fact` | 2 | 284, 285 | v1 |
| `.item-actions` | 2 | 286, 287 | v1 |
| `.dense` | 6 | 290, 291, 292, 293, 294, 295 | v1 |
| `.bar-sm` | 1 | 311 | v1 |
| `.fab` | 7 | 331, 332, 333, 334, 405, 406 | v1 |
| `.tab-add` | 2 | 404, 407 | v1 |
| `.solo-desk` | 1 | 453 | v1 |
| `.pad` | 2 | 661, 662 | v3 |
| `.bp-rev-opt` | 1 | 705 | v3 |
| `.pv-row` | 1 | 714 | v3 |
| `.q-badge` | 1 | 790 | v8 |
| `.bp-warn` | 1 | 816 | v8 |
| `.bp-tip` | 1 | 817 | v8 |
| `.ptr` | 2 | 1211, 1212 | v5 |
| `.v40-altre` | 1 | 2300 | v40 |

Probabilmente **vive**, costruite al volo (es. `` `p-q${q}` ``): non toccarle senza provare.

| Classe | Prefisso dinamico trovato | Righe CSS |
|---|---|---|
| `.p-q1` | `p-q…` | 247, 249, 472, 751, 765, 771 |
| `.p-q3` | `p-q…` | 248, 251, 752, 765, 771, 2616 |
| `.p-q4` | `p-q…` | 248, 252, 752 |
| `.tag-q3` | `tag-q…` | 277 |
| `.tag-q4` | `tag-q…` | 277 |
| `.toast-danger` | `toast-…` | 319, 320 |
| `.chip-q1` | `chip-q…` | 1251 |
| `.chip-q2` | `chip-q…` | 1251 |
| `.chip-q3` | `chip-q…` | 1251 |
| `.t-q1` | `t-q…` | 1301 |
| `.t-q2` | `t-q…` | 1302 |
| `.t-q3` | `t-q…` | 1303 |
| `.t-q4` | `t-q…` | 1304 |
| `.v17-q1` | `v17-q…` | 1766 |
| `.v17-q2` | `v17-q…` | 1766 |
| `.v17-q3` | `v17-q…` | 1766 |
| `.v17-q4` | `v17-q…` | 1766 |
| `.v25-sezione-chip` | `v25-…` | 1876 |

ID usati nei selettori e assenti dall'HTML/JS: nessuno.

## 7. Limiti dell'analisi

- È un'analisi per righe, non un parser JS completo: riconosce le funzioni di primo livello scritte nello stile del file (colonna 0) e le riassegnazioni `nome = function…` / `nome = (…) =>`. Le riassegnazioni dentro blocchi `{ … }` o IIFE sono segnalate a parte ("riassegnata anche dentro blocchi").
- "avvolge / SOSTITUISCE" guarda se il corpo nomina un alias catturato prima (`_xV12`, `_xBase`…). Un avvolgimento che chiama il precedente per altra via (es. tramite un oggetto) risulterebbe SOSTITUISCE: i casi della sezione 2 sono stati controllati a campione (`salvaCattura` v9 e v10, `eventiDelGiorno` v5: sostituzioni vere).
- I conflitti CSS sono per selettore identico; la specificità e le sovrapposizioni parziali non sono calcolate.
- Le classi CSS "morte" possono essere aggiunte da librerie esterne (Tabler, jsPDF) o da stringhe composte in modo non riconosciuto: prima di cancellare, cercare a mano e far girare i test.

Rigenerare: lo script di analisi è descritto in `docs/PIANO_RIORDINO.md` (fase 0); dopo la divisione in file va adattato a `src/`.
