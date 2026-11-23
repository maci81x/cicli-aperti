# MAPPA di index.html — strati, sovrascritture, codice morto

> Generata il 23/11/2026 su `index.html` al commit `4b23c0d` (2026-11-23 v53 riordino, 21.049 righe) con un'analisi statica (parser JavaScript *acorn* + parser CSS *postcss*). I file di `src/` sono in cartelle per area: per trovare un pezzo, `grep -rn` sul nome in `src/`.
> I numeri di riga sono quelli di `index.html`. Se il file cambia, le righe scorrono: rigenerare la mappa (vedi in fondo).

## In breve

| | |
|---|---|
| Blocchi | `<style>` righe 65–2528 · HTML righe 2529–3391 · `<script>` principale righe 3392–21046 (più un piccolo `<script>` in testa, righe 24–59) |
| Funzioni top-level | 1144 |
| Alias `const _x = fn` | 195 |
| Riassegnazioni `fn = …` | 204 su 133 funzioni |
| Funzioni avvolte **2 o più volte** | **44** (115 strati in tutto) |
| Funzioni avvolte una volta sola | 89 |
| Strati che **sostituiscono** senza richiamare il precedente | 1 (tutto ciò che sta sotto di loro non viene più eseguito) |
| Regole CSS (selettore × media) | 2115 |
| Selettori definiti più volte nello stesso contesto | 65 |
| `!important` | 95 (di cui 59 in v49–v50) |
| Funzioni mai chiamate | 0 |
| Classi CSS senza elementi | 6 |

**Legenda «tipo»**: *chiama \_xV12* = lo strato richiama la versione precedente (avvolge davvero); *decoratore proteggi()* = `fn = proteggi(fn)`; *IIFE con orig* = `fn = (function (orig) { … })(fn)`; **sostituisce** = riscrive la funzione da capo: gli strati precedenti diventano codice morto.

**Versione** = l'ultimo commento di sezione `// vNN ·` a colonna 0 prima della riga. Nella «PARTE 2» le sezioni v2–v5 sono mescolate (è nata a blocchi), quindi lì l'ordine delle versioni non è monotòno.

## 1. Funzioni avvolte più volte — la catena degli strati

Ordine = ordine di esecuzione dello script: l'ultimo strato è quello che gira per primo quando la funzione viene chiamata, e dentro di sé chiama i precedenti.

Indice: [`vistaPianifica`](#vistapianifica) (5) · [`apriRapido`](#aprirapido) (5) · [`vociDaRighe`](#vocidarighe) (4) · [`apriDettaglio`](#apridettaglio) (4) · [`htmlDaPianificareLista`](#htmldapianificarelista) (4) · [`azioneFatto`](#azionefatto) (3) · [`moveCicloInAgenda`](#movecicloinagenda) (3) · [`_handleGcalToken`](#_handlegcaltoken) (3) · [`aggiornaTutto`](#aggiornatutto) (3) · [`openBpReview`](#openbpreview) (3) · [`disegnaReview`](#disegnareview) (3) · [`render`](#render) (3) · [`aggiungiFrasi`](#aggiungifrasi) (3) · [`eventiDelGiorno`](#eventidelgiorno) (3) · [`salvaRapido`](#salvarapido) (3) · [`showToast`](#showtoast) (3) · [`eventoDa`](#eventoda) (3) · [`rigaEvento`](#rigaevento) (3) · [`colonnaGiorno`](#colonnagiorno) (3) · [`caricaEventiNascosti`](#caricaeventinascosti) (3) · [`bpwRenderStep2`](#bpwrenderstep2) (2) · [`openBpWizard`](#openbpwizard) (2) · [`azioneDomani`](#azionedomani) (2) · [`impostaGiorno`](#impostagiorno) (2) · [`togliBlocco`](#togliblocco) (2) · [`aggiornaBlocco`](#aggiornablocco) (2) · [`revMotiviConteggio`](#revmotiviconteggio) (2) · [`disegnaRapido`](#disegnarapido) (2) · [`aggiungiRighe`](#aggiungirighe) (2) · [`segnaStampato`](#segnastampato) (2) · [`patchCiclo`](#patchciclo) (2) · [`flipDone`](#flipdone) (2) · [`disegnaRiordina`](#disegnariordina) (2) · [`apriFoglioEvento`](#aprifoglioevento) (2) · [`voceAnteprimaPlaud`](#voceanteprimaplaud) (2) · [`vistaAltro`](#vistaaltro) (2) · [`vistaImpostazioni`](#vistaimpostazioni) (2) · [`rigaDaVoce`](#rigadavoce) (2) · [`bannerCicliCal`](#bannerciclical) (2) · [`disegnaAnteprimaCattura`](#disegnaanteprimacattura) (2) · [`vistaTutto`](#vistatutto) (2) · [`disegnaFoglioEvento`](#disegnafoglioevento) (2) · [`apriMenu`](#aprimenu) (2) · [`v26DisegnaChiudi`](#v26disegnachiudi) (2)

### vistaPianifica

Definita a riga 7067 (v2) · 5 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7067 | base | definizione originale |
| 1 | v6 | 11552 | (chiama _vistaPianificaV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `boardAttiva`, `btnAiuto`, `pianLargo` |
| 2 | v10 | 14064 | (chiama _vistaPianificaAgg) | «dati di ieri»: la settimana di oggi viene da una lettura di più di 12 ore fa (copia locale o token scaduto) — usa: `notaEventiVecchi` |
| 3 | v22 | 17481 | (chiama _vistaPianificaV22) | piano e coach: sotto il giorno — usa: `boardAttiva`, `v22Board`, `v22Telefono` |
| 4 | v26 | 18092 | (chiama _vistaPianificaV26) | _(nessun commento; sezione: v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11))_ — usa: `v26VistaGiorno`, `v26SegConGiorno`, `v26InserisciObiettivi` |
| 5 | v47 | 20133 | (chiama _vpV47) | la colonna Da pianificare: in testa tutte le rimaste indietro (sostituisce il gruppo delle sole Subito della v45) — usa: `riga`, `v47Indietro` |

### apriRapido

Definita a riga 8951 (v3) · 5 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v3 | 8951 | base | definizione originale |
| 1 | v9 | 12255 | (chiama _apriRapidoV8) | una correzione nel riepilogo: vale finché la riga del campo resta uguale — usa: `disegnaAnteprima` |
| 2 | v9 | 13027 | (chiama _apriRapidoV9) | i campi ascoltavano le versioni di prima: si ridisegna anche con la spunta |
| 3 | v10 | 15372 | (chiama _apriRapidoSn) | apre il foglio: contesto per riga azzerato; i doppioni guardano anche gli appuntamenti già letti — usa: `disegnaAnteprima`, `caricaEventiDopp` |
| 4 | v12 | 16201 | (chiama _apriRapidoV12) | --- 2. La bozza --- — usa: `bozzaLeggi`, `$`, `disegnaAnteprima` |
| 5 | v14 | 16537 | (chiama _apriRapidoV14) | + Seguito — usa: `$` |

### vociDaRighe

Definita a riga 12201 (v9) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12201 | base | definizione originale |
| 1 | v9 | 13009 | (chiama _vociDaRigheV9) | «Avvisami» nel riepilogo: attiva di default quando c'è l'ora (e Google è collegato) — usa: `puoAvvisare` |
| 2 | v10 | 14636 | (chiama _vociDaRighePr) | Le voci del campo: «5 minuti», «al volo», «subito» o il chip «5 min» → breve; titolo generico → avviso  — usa: `detto`, `togliBreve`, `troppoGenericaTitolo` |
| 3 | v10 | 15235 | (chiama _vociDaRigheSn) | Le voci: il contesto per riga (indovinato o toccato)  — usa: `indovinaContesto` |
| 4 | v12 | 16277 | (chiama _vociDaRigheV12) | stesso testo, stesso risultato: il riepilogo si ridisegna da più punti a ogni tasto |

### apriDettaglio

Definita a riga 6853 (v2) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6853 | base | definizione originale |
| 1 | v10 | 14373 | (chiama _apriDettaglioPr) | Nel dettaglio: «Serve a quale meta?» (si salva subito)  — usa: `disegnaDetMeta`, `ciclo` |
| 2 | v11 | 16154 | (chiama _apriDettaglioV11) | il tasto c'è sempre: aperte, fatte, in Un giorno — usa: `$`, `ciclo` |
| 3 | v19 | 17223 | (chiama _apriDettaglioV19) | nel dettaglio: che tipo è, l'ultima mail e i tasti per aprire le mail in Gmail. — usa: `ciclo`, `$`, `daPosta`, `esc`, `linkMail` |
| 4 | v27 | 18600 | (chiama _apriDettaglioV27) | In Dettagli: da dove nasce (anche per quelle create con la versione vecchia) — usa: `$`, `v27Origine`, `ciclo`, `escHtml` |

### htmlDaPianificareLista

Definita a riga 11489 (v6) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v6 | 11489 | base | definizione originale |
| 1 | v24 | 17672 | (chiama _htmlDaPianificareListaV24) | Da pianificare: le Subito tutte, poi poche Importanti; il resto sotto «Altre N» — usa: `daPianificareFiltrate`, `computeEffectiveQ`, `riga`, `oggiLocale` |
| 2 | v45 | 19914 | (chiama _listaV45) | le Subito rimaste indietro, pronte da trascinare in un giorno nuovo. — usa: `v45SubitoIndietro`, `riga`, `oggiLocale` |
| 3 | v47 | 20113 | (chiama _listaV47) | la colonna Da pianificare: in testa tutte le rimaste indietro (sostituisce il gruppo delle sole Subito della v45) — usa: `v47Indietro`, `computeEffectiveQ`, `riga`, `oggiLocale` |
| 4 | v49 | 20410 | (chiama _listaV49) | il bollino «N rimaste indietro» e il gruppo in Da pianificare aprono Smaltisci |

### azioneFatto

Definita a riga 6657 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6657 | base | definizione originale |
| 1 | v4 | 9732 | (chiama _azioneFattoBase) | La logica di «Fatto» resta quella: qui si aggiunge solo il «le tue 3 sono fatte». — usa: `focusAperte`, `showToast` |
| 2 | v4 | 9740 | (chiama _azioneFattoV3) | v4: chiudere una cosa bloccata in agenda aggiorna l'evento; l'ultimo passo fatto chiede di chiudere la cosa intera. — usa: `ciclo`, `chiudiBlocco`, `controllaMadre`, `$`, `disegnaPassi` |
| 3 | v5 | 10374 | (chiama _azioneFattoV4) | _(nessun commento; sezione: v5 · DOPO UNA «SUBITO»: cosa l'ha generata? (al massimo una volta al giorno per area))_ — usa: `ciclo`, `isGiornaliero`, `computeEffectiveQ`, `chiediOrigineSubito` |

### moveCicloInAgenda

Definita a riga 5055 (v1) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 5055 | base | definizione originale |
| 1 | v2 | 9768 | (chiama _moveCicloInAgendaBase) | Spostare una riga nell'agenda sposta anche la sua riga nel piano della settimana. — usa: `itemDelPiano`, `render` |
| 2 | v5 | 10305 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| 3 | v6 | 11195 | (chiama _moveCicloV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `ciclo`, `siRipete`, `chiediSerie`, `conProtezione`, `spostaSerie` |

### _handleGcalToken

Definita a riga 4532 (v1) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 4532 | base | definizione originale |
| 1 | v2 | 9788 | (chiama _handleGcalTokenBase) | Dopo il collegamento a Google Calendar: carica gli appuntamenti della settimana. — usa: `caricaEventi`, `render`, `riconciliaCalendar` |
| 2 | v5 | 11030 | (chiama _handleGcalTokenV2) | Dopo il collegamento a Google Calendar: calendario di scrittura, promemoria, appuntamenti che sembrano cicli — usa: `isGcalTokenValid`, `avvioCalendarV5` |
| 3 | v10 | 14049 | (chiama _handleGcalTokenAgg) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `aggiornaEventiAperti` |

### aggiornaTutto

Definita a riga 7281 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7281 | base | definizione originale |
| 1 | v5 | 10486 | (chiama _aggiornaTuttoV4) | 7 giorni fa: esisteva, non era ancora chiusa (updated_at di una chiusa ≈ quando è stata chiusa) e non era in Un giorno — usa: `$`, `modoSemplice`, `htmlAperte` |
| 2 | v25 | 17742 | (chiama _aggiornaTuttoV25) | _(nessun commento; sezione: v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE N)_ — usa: `modoSemplice`, `$`, `nFiltri`, `cicliFiltrati`, `vedi` |
| 3 | v25 | 17761 | (chiama _aggiornaTuttoV25b) | l'armadio usa tutta la larghezza, come la board della settimana — usa: `$`, `v25ArmadioAttivo`, `boardAttiva` |

### openBpReview

Definita a riga 7478 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7478 | base | definizione originale |
| 1 | v5 | 10496 | (chiama _openBpReviewV4) | ══════════════════════════════════════════════════════════════ v5 · CHIUDI LA SETTIMANA: 0. Riporta il foglio · 1. quello che è rimasto · 2. com'è andata ══════════════════════════════════════════════════════════════ — usa: `disegnaReview` |
| 2 | v10 | 14972 | (chiama _openBpReviewPr) | Chiudi la settimana: tempo per il futuro, e «Cosa ti ha tolto la spinta?» (principio 11)  — usa: `caricaRinviate`, `disegnaReview`, `caricaSpintePassate` |
| 3 | v10 | 15615 | (chiama _openBpReviewSn) | i motivi nuovi stanno anche nel passo dettagliato (prima di «Altro…») — usa: `disegnaReview` |

### disegnaReview

Definita a riga 7486 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7486 | base | definizione originale |
| 1 | v5 | 10573 | (chiama _disegnaReviewV4) | _(nessun commento; sezione: v5 · CHIUDI LA SETTIMANA: 0. Riporta il foglio · 1. quello che è rimasto · 2. com'è andata)_ — usa: `disegnaRiporta`, `$`, `revStatQ2` |
| 2 | v10 | 15022 | (chiama _disegnaReviewPr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `$`, `htmlFuturo`, `quotaSettimana`, `htmlSpinta` |
| 3 | v10 | 15623 | (chiama _disegnaReviewSn) | i motivi nuovi stanno anche nel passo dettagliato (prima di «Altro…») — usa: `$`, `disegnaChiudiSnella` |

### render

Definita a riga 6433 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6433 | base | definizione originale |
| 1 | v6 | 11603 | (chiama _renderV9) | il disegno rimandato si fa al rilascio. |
| 2 | v10 | 13976 | (chiama _renderVista) | dopo ogni disegno: Oggi non deve restare vuota — usa: `controllaOggiVuota` |
| 3 | v18 | 17161 | (chiama _renderV18) | il cestino dentro la riga: lo aggiungo dopo ogni disegno (passandoci sopra sul computer, scorrendo sul telefono) — usa: `cestiniEventi` |

### aggiungiFrasi

Definita a riga 12282 (v9) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12282 | base | definizione originale |
| 1 | v9 | 13030 | (chiama _aggiungiFrasiV9) | dopo il salvataggio: un avviso per ogni cosa con giorno e ora e la spunta attiva — usa: `creaAvviso` |
| 2 | v10 | 13685 | (chiama _aggiungiFrasiDopp) | Quando aggiungi («+», campo del telefono, Ricordami): prima di salvare, una domanda per ogni doppione  — usa: `decidiDoppioni`, `creaPassoDi`, `flipDone`, `creaCosaDaEvento`, `showToast` |
| 3 | v10 | 15408 | (chiama _aggiungiFrasiDopp) | Esegue fn (che legge state.ctx prima di qualsiasi await) con il contesto ctx, poi rimette quello in vista. — usa: `doppioneForte`, `conContesto`, `imparaCtx`, `render`, `dopoIlSalvataggio` |

### eventiDelGiorno

Definita a riga 10037 (v5) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 10037 | base | definizione originale |
| 1 | v10 | 13256 | (chiama _eventiDelGiornoV10) | In Oggi e nelle colonne: un evento dell'app collegato a una cosa non compare (si vede la cosa, con la sua ora) — usa: `collegatoACosa` |
| 2 | v10 | 13335 | (chiama _eventiDelGiornoDalCal) | già tra le cose da fare: collegata a questo evento, oppure una cosa aperta uguale o molto simile (vedi DOPPIONI) — usa: `eventoCollegato` |
| 3 | v11 | 16060 | (chiama _eventiDelGiornoV11) | dove si vedono gli appuntamenti: niente nascosti, niente figlie (quelle hanno la loro riga in Oggi) — usa: `eNascosto`, `eFiglie` |

### salvaRapido

Definita a riga 12315 (v9) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12315 | base | definizione originale |
| 1 | v10 | 14682 | (chiama _salvaRapidoPr) | dopo un salvataggio normale di una cosa breve: «Falla ora» nel messaggio — usa: `vociDaRighe`, `righeCampo`, `$`, `offriFallaOraDopo` |
| 2 | v12 | 16209 | (chiama _salvaRapidoV12) | --- 2. La bozza --- — usa: `$`, `bozzaScrivi`, `salvaUnite` |
| 3 | v14 | 16552 | (chiama _salvaRapidoV14) | _(nessun commento; sezione: v14 · 28/10 · FATTA = SPARISCE)_ — usa: `$` |

### showToast

Definita a riga 6322 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6322 | base | definizione originale |
| 1 | v10 | 15396 | (chiama _showToastSn) | Salvare: subito, ognuna nel suo contesto; poi i doppioni e «Vai a Personale»  |
| 2 | v14 | 16508 | (chiama _showToastV14) | · Fatte: tutte le cose chiuse in un posto, con cerca e Riapri (da Altro e da Cose aperte) ══════════════════════════════════════════════════════════════ messaggi con più tasti e una durata scelta — usa: `$`, `render` |
| 3 | v48 | 20209 | (chiama _st) | i messaggi verdi senza «Annulla» degli spostamenti si tacciono: il messaggio con «Annulla» lo dà v48 |

### eventoDa

Definita a riga 9969 (v5) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 9969 | base | definizione originale |
| 1 | v11 | 16015 | (chiama _eventoDaV11) | --- eventi delle figlie --- — usa: `titoloSenzaFiglie` |
| 2 | v24 | 17549 | (chiama _eventoDaV24) | · Da pianificare: Subito tutte, poi poche Importanti e «Altre N» |
| 3 | v29 | 18684 | (chiama _eventoDaV29) | --- gli eventi sanno chi è esterno --- — usa: `unici` |

### rigaEvento

Definita a riga 12789 (v9) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12789 | base | definizione originale |
| 1 | v12 | 16411 | (chiama _rigaEventoV12) | il pallino rosso nel titolo dei passati — usa: `oggiLocale` |
| 2 | v24 | 17578 | (chiama _rigaEventoV24) | _(nessun commento; sezione: v24 · 2/11 · APPUNTAMENTI CON ALTRI E TEMPO TUO (disegno 8 del canvas «versione snella»))_ — usa: `eFiglie`, `v24ConAltri`, `v24SceltoAMano`, `escHtml`, `v24ConChi` |
| 3 | v26 | 17824 | (chiama _rigaEventoV26) | la riga di un appuntamento: rosso + «non si sposta» — usa: `v26EventoFisso` |

### colonnaGiorno

Definita a riga 11513 (v6) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v6 | 11513 | base | definizione originale |
| 1 | v21 | 17318 | (chiama _colonnaGiornoV21) | board (≥ 1100 px) — usa: `v21Tpl`, `v21InTesta`, `v21BtnStampa` |
| 2 | v24 | 17657 | (chiama _colonnaGiornoV24) | le ore del giorno: con altri e tue (eventi con un orario; quelli di tutto il giorno a parte) — usa: `v24OreGiorno`, `dataDelGiorno` |
| 3 | v26 | 17855 | (chiama _colonnaGiornoV26) | nei giorni: in cima «Non si sposta», poi il resto — usa: `v21Tpl`, `v26Raggruppa` |

### caricaEventiNascosti

Definita a riga 16027 (v11) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v11 | 16027 | base | definizione originale |
| 1 | v24 | 17542 | (chiama _caricaEventiNascostiV24) | · Da pianificare: Subito tutte, poi poche Importanti e «Altre N» — usa: `caricaEventiTipo` |
| 2 | v26 | 18505 | (chiama _caricaEventiNascostiV26) | --- caricamento --- — usa: `v26CaricaFissi`, `v26CaricaObiettivi` |
| 3 | v29.1 | 19051 | (chiama _caricaEventiNascostiV29) | --- avvio: con le altre tabelle degli appuntamenti --- — usa: `v29Carica`, `v29CaricaSettimane` |

### bpwRenderStep2

Definita a riga 5920 (v1) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 5920 | base | definizione originale |
| 1 | v2 | 9780 | (chiama _bpwRenderStep2Base) | Nel wizard, accanto a ogni giorno, il tempo già preso dagli appuntamenti. — usa: `decoraWizard`, `bpwChipGiorni` |
| 2 | v10 | 14539 | (chiama _bpwRenderStep2Pr) | Mete nel piano della settimana: quante Importanti per meta, e quelle ferme da 4 settimane — usa: `disegnaFuturoWizard` |

### openBpWizard

Definita a riga 5675 (v1) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 5675 | base | definizione originale |
| 1 | v5 | 10095 | (chiama _openBpWizardV4) | Quando arrivano gli appuntamenti, i cuscinetti automatici ancora da salvare si rimettono negli spazi veri. — usa: `bpwConEventi` |
| 2 | v10 | 15802 | (chiama _openBpWizardSn) | un cuscinetto al giorno (quello del pomeriggio, se c'è): gli altri automatici si tolgono — usa: `$`, `bpwModifica`, `closeBpWizard`, `lsLeggi`, `caricaEventi` |

### azioneDomani

Definita a riga 6735 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6735 | base | definizione originale |
| 1 | v5 | 10302 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| 2 | v6 | 11182 | (chiama _azioneDomaniV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `ciclo`, `siRipete`, `parseISODate`, `chiediSerie`, `conProtezione` |

### impostaGiorno

Definita a riga 8692 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 8692 | base | definizione originale |
| 1 | v5 | 10304 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| 2 | v6 | 11189 | (chiama _impostaGiornoV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `ciclo`, `siRipete`, `chiediSerie`, `conProtezione`, `spostaSerie` |

### togliBlocco

Definita a riga 9527 (v4) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 9527 | base | definizione originale |
| 1 | v5 | 10331 | (chiama _togliBloccoV4) | Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera. — usa: `bloccoEsterno`, `patchCiclo`, `render`, `showToast` |
| 2 | v10 | 13228 | (chiama _togliBloccoV10) | togli: un evento che non è dell'app non si cancella, si scollega soltanto — usa: `patchCiclo`, `render`, `showToast` |

### aggiornaBlocco

Definita a riga 9583 (v4) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 9583 | base | definizione originale |
| 1 | v5 | 10339 | (chiama _aggiornaBloccoV4) | Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera. — usa: `bloccoEsterno`, `ciclo` |
| 2 | v9 | 12937 | (chiama _aggiornaBloccoV9) | spostata: l'avviso segue la cosa (senza ora → si toglie). Per gli altri eventi resta il comportamento di prima. — usa: `ciclo`, `bloccoEsterno`, `isGcalTokenValid`, `slotAvviso`, `firmaAvviso` |

### revMotiviConteggio

Definita a riga 9657 (v4) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 9657 | base | definizione originale |
| 1 | v5 | 10581 | (chiama _revMotiviConteggioV4) | I conteggi della settimana (Q2 spostate per motivo, deleghe tornate) restano in motivi anche alla chiusura. |
| 2 | v10 | 15042 | (chiama _revMotiviConteggioPr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ |

### disegnaRapido

Definita a riga 8959 (v3) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v3 | 8959 | base | definizione originale |
| 1 | v6 | 11119 | (chiama _disegnaRapidoV5) | «+ Ciclo» di una colonna: il foglio rapido con il giorno già scelto — usa: `$`, `fmtGiorno`, `parseISODate` |
| 2 | v9 | 12253 | (chiama _disegnaRapidoV8) | una correzione nel riepilogo: vale finché la riga del campo resta uguale — usa: `disegnaAnteprima` |

### aggiungiRighe

Definita a riga 8983 (v3) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v3 | 8983 | base | definizione originale |
| 1 | v6 | 11126 | (chiama _aggiungiRigheV5) | «+ Ciclo» di una colonna: il foglio rapido con il giorno già scelto — usa: `inSilenzio`, `pianificaInData`, `ciclo`, `parseISODate`, `render` |
| 2 | v10 | 15554 | (chiama _aggiungiRigheSn) | 3 · Il contesto anche nelle altre strade: righe, foglio riportato, Plaud (per riga) aggiungiRighe legge state.ctx subito: ogni gruppo di righe con il suo contesto — usa: `indovinaContesto`, `conContesto` |

### segnaStampato

Definita a riga 9828 (v5) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 9828 | base | definizione originale |
| 1 | v6 | 11919 | (chiama _segnaStampatoV5) | la checklist si aggiorna con i dati: dopo la chiusura, l'invio, la stampa, l'esercizio Q2 — usa: `render` |
| 2 | v12 | 16324 | (chiama _segnaStampatoV12) | _(nessun commento; sezione: v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare)_ — usa: `segnaNelDb` |

### patchCiclo

Definita a riga 6600 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6600 | base | definizione originale |
| 1 | v9 | 12963 | (chiama _patchCicloV9) | Ogni spostamento passa da patchCiclo o upsertOverride: dopo un attimo l'evento si allinea (una volta sola) — usa: `seguiCosa` |
| 2 | v30 | 19173 | (chiama _patchCicloV30) | basta toccarla (spostarla, cambiarla, chiuderla) e non è più «da rivedere» — usa: `ciclo` |

### flipDone

Definita a riga 3687 (v1) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 3687 | base | definizione originale |
| 1 | v9 | 12976 | (chiama _flipDoneV9) | tutte le chiusure passano da flipDone — usa: `ciclo`, `chiudiBlocco` |
| 2 | v42 | 19754 | (chiama _flipV42) | (3) chiusa → via anche dal calendario — usa: `ciclo`, `v42TogliPromemoria` |

### disegnaRiordina

Definita a riga 11703 (v6) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v6 | 11703 | base | definizione originale |
| 1 | v9 | 13073 | (chiama _disegnaRiordinaV9) | _(nessun commento; sezione: v9 · OGGI SUL TELEFONO: «Rimaste indietro» diventa una riga «N indietro · Sistema»)_ — usa: `$`, `recRimasta`, `vuoto`, `ciclo`, `carryData` |
| 2 | v10 | 14392 | (chiama _disegnaRiordinaPr) | Riordina: un'Importante ti avvicina a una meta? Se no: Delega o Lascia stare (dire no)  — usa: `ciclo`, `$`, `metaDi`, `escHtml`, `corta` |

### apriFoglioEvento

Definita a riga 12815 (v9) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12815 | base | definizione originale |
| 1 | v10 | 13418 | (chiama _apriFoglioEventoDalCal) | mentre il foglio aspetta la risposta: la X vale «No, lascialo», il tocco fuori non chiude |
| 2 | v15 | 16703 | (chiama _apriFoglioEventoV15) | _(nessun commento; sezione: v15 · 28/10 · APPUNTAMENTI: si spuntano tutti, anche quelli di tutto il giorno, e si chiudono con un feedback)_ |

### voceAnteprimaPlaud

Definita a riga 12473 (v8) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v8 | 12473 | base | definizione originale |
| 1 | v10 | 13713 | (chiama _voceAnteprimaPlaudDopp) | Plaud: le cose che ci sono già partono senza spunta, con «c'è già» (si possono riattivare)  — usa: `etichettaDopp`, `escHtml`, `testoDopp` |
| 2 | v10 | 15587 | (chiama _voceAnteprimaPlaudSn) | Plaud: la madre prende il contesto della riunione; ogni passo il suo (si cambia con l'etichetta) — usa: `ctxPlaud`, `nomeCtx` |

### vistaAltro

Definita a riga 7366 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7366 | base | definizione originale |
| 1 | v10 | 13784 | (chiama _vistaAltroDopp) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `vistaDoppioni`, `gruppiAperti`, `riga`, `plurale` |
| 2 | v10 | 15053 | (chiama _vistaAltroPr) | ══════════════════════════════════════════════════════════════ ALTRO: «Le mie mete» e «Da rendere specifiche» · GUIDA · AVVIO ══════════════════════════════════════════════════════════════ — usa: `vistaMete`, `vistaSpecifiche`, `meteTutte`, `daRendereSpecifiche`, `plurale` |

### vistaImpostazioni

Definita a riga 7399 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7399 | base | definizione originale |
| 1 | v10 | 14096 | (chiama _vistaImpostazioniErr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `sezioneErrori` |
| 2 | v26 | 18474 | (chiama _vistaImpostazioniV26) | via «Assegna l'area con Claude»: la sezione la propone già l'app — usa: `v21Tpl`, `esc`, `aree`, `v26RitmoAcceso` |

### rigaDaVoce

Definita a riga 12272 (v9) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12272 | base | definizione originale |
| 1 | v10 | 14648 | (chiama _rigaDaVocePr) | la durata di 5 minuti la rende una Rapida (≤ 15 min, come prima) — usa: `riga` |
| 2 | v14 | 16544 | (chiama _rigaDaVoceV14) | + Seguito — usa: `riga` |

### bannerCicliCal

Definita a riga 10209 (v5) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 10209 | base | definizione originale |
| 1 | v10 | 14925 | (chiama _bannerCicliCalPr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `daControllare`, `bannerSera`, `cardMete`, `cardDeleghe` |
| 2 | v42 | 19728 | (chiama _bannerV42) | (2) il banner di Oggi dice la cosa giusta quando ci sono promemoria passati |

### disegnaAnteprimaCattura

Definita a riga 12322 (v9) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12322 | base | definizione originale |
| 1 | v10 | 15300 | **sostituisce** | _(nessun commento; sezione: v10 · SNELLA (25/10): meno tocchi, stesse funzioni)_ — usa: `$`, `vociDi`, `htmlVoceSn`, `notaCtx` |
| 2 | v17 | 17090 | (chiama _disegnaAnteprimaCatturaV17) | nel campo del telefono: quante, e «Modifica» le mostra — usa: `$`, `vociDi`, `collegate`, `v17Parola` |

### vistaTutto

Definita a riga 7266 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7266 | base | definizione originale |
| 1 | v14 | 16594 | (chiama _vistaTuttoV14) | in Cose aperte: il passaggio alle Fatte — usa: `vedi` |
| 2 | v25 | 17734 | (chiama _vistaTuttoV25) | _(nessun commento; sezione: v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE N)_ — usa: `modoSemplice` |

### disegnaFoglioEvento

Definita a riga 16663 (v15) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v15 | 16663 | base | definizione originale |
| 1 | v24 | 17614 | (chiama _disegnaFoglioEventoV24) | il foglio dell'appuntamento: «È con altre persone» / «È tempo mio» (vale per tutta la serie) — usa: `eventoPerId`, `$`, `eFiglie`, `v24ConAltri`, `v24SceltoAMano` |
| 2 | v26 | 17891 | (chiama _disegnaFoglioEventoV26) | il foglio dell'appuntamento: «Non si sposta» — usa: `eventoPerId`, `$`, `v26EventoFisso`, `esc` |

### apriMenu

Definita a riga 7033 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7033 | base | definizione originale |
| 1 | v26 | 17920 | (chiama _apriMenuV26) | il menu ⋯ di una cosa: «Non si sposta» — usa: `ciclo`, `$` |
| 2 | v37 | 19511 | (chiama _apriMenuV37) | il menu è cresciuto: se esce sotto, va sopra — usa: `ciclo`, `$`, `v37Pianificata`, `siRipete`, `isGiornaliero` |

### v26DisegnaChiudi

Definita a riga 18365 (v26) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v26 | 18365 | base | definizione originale |
| 1 | v30 | 19146 | (chiama _v26DisegnaChiudiV30) | la sera, in «Chiudi la giornata» — usa: `$` |
| 2 | v42 | 19772 | (chiama _chiudiV42) | (4) «È già fatta?»: aperte molto simili a una chiusa negli ultimi 7 giorni — usa: `$`, `v42GiaFatte`, `escHtml`, `esc` |

## 2. Funzioni avvolte una volta sola

| Funzione | Base | Strato | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| `renderCatOptions` | v1 · 3984 | v2 · 9756 | (chiama _renderCatOptionsBase) | v2 · AGGANCI ALLA LOGICA E AVVIO ══════════════════════════════════════════════════════════════ Il select categoria mostra solo i nomi e, in fondo, «+ Nuova categoria». — usa: `$`, `catNome` |
| `bpwBloccoGiorno` | v2 · 8620 | v5 · 10109 | (chiama _bpwBloccoGiornoV4) | Quando arrivano gli appuntamenti, i cuscinetti automatici ancora da salvare si rimettono negli spazi veri. — usa: `giornataPiena`, `bpDataGiorno`, `occupatiWizard` |
| `bpAttiva` | v1 · 6118 | v5 · 10230 | (chiama _bpAttivaV4) | _(nessun commento; sezione: v5 · FINE DEL WIZARD: «Il piano è pronto» con Stampa il foglio e Invia al coach)_ — usa: `$`, `apriPronto` |
| `bpStampaPdf` | v5 · 8158 | v5 · 10235 | (chiama _bpStampaPdfV4) | _(nessun commento; sezione: v5 · FINE DEL WIZARD: «Il piano è pronto» con Stampa il foglio e Invia al coach)_ — usa: `segnaStampato`, `render`, `$`, `disegnaPronto` |
| `azioneQuando` | v2 · 6772 | v5 · 10303 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| `azioneLascia` | v2 · 6781 | v5 · 10308 | (chiama _azioneLasciaV4) | Lascia stare toglie anche il blocco in agenda: non è più un impegno con te stesso. — usa: `proteggi`, `ciclo`, `bloccoEsterno`, `isGcalTokenValid`, `togliBlocco` |
| `creaBlocco` | v4 · 9518 | v5 · 10322 | (chiama _creaBloccoV4) | Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera. — usa: `ciclo`, `computeEffectiveQ`, `patchCiclo`, `render` |
| `infoPassi` | v4 · 9382 | v5 · 10388 | (chiama _infoPassiV4) | _(nessun commento; sezione: v5 · SVUOTA LA TESTA: una colonna per area, una riga = una cosa)_ — usa: `passiDi`, `eGenerica` |
| `sezionePiano` | v4 · 9705 | v5 · 10899 | (chiama _sezionePianoV4) | Email del coach + in copia (nella sezione v4 «Piano della settimana») — usa: `esc`, `emailCC` |
| `bpwCambiaCusc` | v4 · 9268 | v5 · 10927 | (chiama _bpwCambiaCuscV4) | v5 · AZIONI, CAMPI E AVVIO ══════════════════════════════════════════════════════════════ Un cuscinetto toccato a mano non si sposta più da solo. |
| `inviaPiano` | v4 · 9622 | v5 · 10930 | (chiama _inviaPianoV4) | Dopo l'invio, «Il piano è pronto» mostra la data. — usa: `$`, `disegnaPronto` |
| `pianFondo` | v2 · 7226 | v6 · 11559 | (chiama _pianFondoV5) | sotto i 1100px resta la lista: in più la card del coach, sopra «Da piazzare» — usa: `cardCoach` |
| `salvaDelega` | v3 · 8926 | v6 · 11794 | (chiama _salvaDelegaV5) | la Delega passa dal suo foglio (a chi + quando controlli): quando è salvata, avanti — usa: `$`, `ciclo`, `rioConta`, `rioSalta` |
| `bannerCoach` | v5 · 10145 | v6 · 11902 | (chiama _bannerCoachV5) | Banner in Oggi: 48 ore prima dell'incontro, se una voce è ancora aperta — usa: `coachEvento`, `vociCoach`, `fmtGiorno`, `escHtml` |
| `disconnectGcal` | v1 · 4767 | v7 · 11980 | (chiama _disconnectGcalV6) | scollegando, la copia locale va via — usa: `lsScrivi`, `render` |
| `openPlaudModal` | v1 · 4136 | v8 · 12533 | (chiama _openPlaudModalV8) | _(nessun commento; sezione: v8 · IMPORT PLAUD: un'attività madre per la riunione, le cose da fare come passi)_ |
| `disegnaSpostaEvento` | v6 · 11258 | v9 · 12831 | (chiama _disegnaSpostaEventoV9) | Sposta un appuntamento di tutto il giorno: solo la data (niente ora né durata) — usa: `eventoPerId`, `serveScopeEventi`, `parseISODate`, `toISODate`, `isoWeekParts` |
| `confermaSpostaEvento` | v6 · 11347 | v9 · 12850 | (chiama _confermaSpostaEventoV9) | Sposta un appuntamento di tutto il giorno: solo la data (niente ora né durata) — usa: `eventoPerId`, `$`, `serveScopeEventi`, `oggiLocale`, `parseISODate` |
| `upsertOverride` | v2 · 6705 | v9 · 12969 | (chiama _upsertOverrideV9) | Ogni spostamento passa da patchCiclo o upsertOverride: dopo un attimo l'evento si allinea (una volta sola) — usa: `seguiCosa` |
| `salvaDalFoglio` | v2 · 6889 | v9 · 12984 | (chiama _salvaDalFoglioV9) | dettaglio: giorno e ora nuovi (o cambiati) e nessun evento → avviso — usa: `ciclo`, `chiaveSlot`, `slotAvviso`, `creaAvviso` |
| `confermaPianificazione` | v1 · 5258 | v9 · 12994 | (chiama _confermaPianificazioneV9) | dettaglio: giorno e ora nuovi (o cambiati) e nessun evento → avviso — usa: `ciclo`, `chiaveSlot`, `slotAvviso`, `creaAvviso` |
| `bloccoRimaste` | v2 · 7669 | v9 · 13051 | (chiama _bloccoRimasteV9) | che apre il riordino delle rimaste, una alla volta (le scelte sono quelle del blocco di prima). — usa: `schermoStretto`, `rimasteVisibili`, `carryNascosto` |
| `rioSalva` | v6 · 11669 | v9 · 13071 | (chiama _rioSalvaV9) | _(nessun commento; sezione: v9 · OGGI SUL TELEFONO: «Rimaste indietro» diventa una riga «N indietro · Sistema»)_ |
| `gcalFetch` | v1 · 4682 | v10 · 13141 | (chiama _gcalFetchV10) | ogni PATCH / PUT / DELETE su un evento esistente: prima si legge, e si va avanti solo se è dell'app — usa: `scriviSoloSeDellApp` |
| `loadGcalTokenFromDB` | v1 · 4648 | v10 · 13203 | (chiama _loadGcalTokenFromDBV10) | un id vecchio (localStorage gcal_cal_id o user_tokens.google_calendar_id) che non è quello di scrittura → Lavoro, subito — usa: `normalizzaCalendario` |
| `leggiEventi` | v5 · 10009 | v10 · 13254 | (chiama _leggiEventiV10) | In Oggi e nelle colonne: un evento dell'app collegato a una cosa non compare (si vede la cosa, con la sua ora) — usa: `collegatoACosa` |
| `closeModal` | v1 · 3969 | v10 · 13403 | (chiama _closeModalDalCal) | mentre il foglio aspetta la risposta: la X vale «No, lascialo», il tocco fuori non chiude — usa: `rispondiTogliEvento` |
| `closeModalOnBg` | v1 · 3975 | v10 · 13408 | (chiama _closeModalOnBgDalCal) | mentre il foglio aspetta la risposta: la X vale «No, lascialo», il tocco fuori non chiude |
| `preparaPlaud` | v8 · 12459 | v10 · 13708 | (chiama _preparaPlaudDopp) | Plaud: le cose che ci sono già partono senza spunta, con «c'è già» (si possono riattivare)  — usa: `trovaDoppione`, `forte` |
| `eventoInElenco` | v10 · 13337 | v10 · 13720 | (chiama _eventoInElencoDopp) | «È una cosa da fare»: già aperta → il dettaglio (come prima, ora anche se è scritta un po' diversa); fatta da poco → riapro o nuova  — usa: `eventoPerId`, `cosaDiEvento`, `trovaDoppione`, `chiediDoppione`, `flipDone` |
| `salvaCacheEventi` | v7 · 11962 | v10 · 13994 | (chiama _salvaCacheEventiAgg) | La copia locale si usa solo finché Google non risponde; se ha più di 12 ore la vista lo dice («dati di ieri»). — usa: `leggiJson`, `settimaneDaTenere` |
| `navSettimana` | v2 · 7057 | v10 · 14549 | (chiama _navSettimanaPr) | In Settimana: una pillola compatta in testa, tocchi e vedi come lo calcolo — usa: `chipFuturo` |
| `testaBoard` | v6 · 11460 | v10 · 14551 | (chiama _testaBoardPr) | In Settimana: una pillola compatta in testa, tocchi e vedi come lo calcolo — usa: `chipFuturo` |
| `corpoPromemoriaV10` | v10 · 13271 | v10 · 14828 | (chiama _corpoPromemoriaPr) | Promemoria su Google Calendar: «18.45 - Piano di domani (5 minuti)», solo dal tasto  — usa: `toISODate`, `primoFerialeDa`, `calScelto`, `titoloAvviso` |
| `sezioneItime` | v5 · 10877 | v10 · 14840 | (chiama _sezioneItimePr) | Promemoria su Google Calendar: «18.45 - Piano di domani (5 minuti)», solo dal tasto  — usa: `leggiJson`, `isGcalTokenValid`, `escHtml`, `nomeCalScrittura` |
| `tuttoPersone` | v2 · 7344 | v10 · 14930 | (chiama _tuttoPersonePr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `avvisiDeleghe`, `escHtml`, `testoAvvisoDelega`, `tastiDelega`, `chiudiDelega` |
| `rispondiConferma` | v52 · 9474 | v10 · 14944 | (chiama _rispondiConfermaPr) | «Riprendila io» e «Mi è tornata indietro»: prima una domanda (principio 10) |
| `rigaNuova` | v3 · 8973 | v10 · 15568 | (chiama _rigaNuovaSn) | rigaNuova: titoli con un contesto già scelto (Plaud) o da indovinare (foglio riportato) — usa: `indovinaContesto` |
| `applicaRiporta` | v5 · 10537 | v10 · 15575 | (chiama _applicaRiportaSn) | rigaNuova: titoli con un contesto già scelto (Plaud) o da indovinare (foglio riportato) |
| `importaRiunione` | v8 · 12558 | v10 · 15593 | (chiama _importaRiunioneSn) | Plaud: la madre prende il contesto della riunione; ogni passo il suo (si cambia con l'etichetta) — usa: `ctxMadrePlaud`, `ctxPlaud`, `conContesto` |
| `bpSlotConfirm` | v1 · 6096 | v10 · 15944 | (chiama _bpSlotConfirmSn) | trascinata in un altro giorno: il primo buco libero che la contiene (o senza ora) — usa: `$`, `disegnaSn` |
| `apriPronto` | v5 · 10228 | v10 · 15947 | (chiama _apriProntoSn) | Attiva: il piano si salva con bpAttiva (come prima); poi foglio o invio al coach, e Calendar se spuntato |
| `corpoEvento` | v10 · 13217 | v10 · 15949 | (chiama _corpoEventoSn) | Attiva: il piano si salva con bpAttiva (come prima); poi foglio o invio al coach, e Calendar se spuntato |
| `routineDelGiorno` | v5 · 10038 | v11 · 16062 | (chiama _routineDelGiornoV11) | dove si vedono gli appuntamenti: niente nascosti, niente figlie (quelle hanno la loro riga in Oggi) — usa: `eNascosto` |
| `loadBattlePlan` | v1 · 5478 | v11 · 16112 | (chiama _loadBattlePlanV11) | --- Elimina una cosa, con Annulla --- |
| `righeCampo` | v9 · 12147 | v12 · 16269 | (chiama _righeCampoV12) | _(nessun commento; sezione: v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare)_ — usa: `spezzaPensieri` |
| `interpretaFrase` | v8 · 12052 | v12 · 16286 | (chiama _interpretaFraseV12) | «Bologna - Tavoli - - Riccardo»: tolta la data, niente trattini doppi |
| `inviati` | v4 · 9227 | v12 · 16303 | (chiama _inviatiV12) | --- 4. Inviato e stampato anche nel database --- |
| `stampati` | v5 · 9826 | v12 · 16309 | (chiama _stampatiV12) | --- 4. Inviato e stampato anche nel database --- |
| `segnaInviato` | v4 · 9229 | v12 · 16322 | (chiama _segnaInviatoV12) | _(nessun commento; sezione: v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare)_ — usa: `segnaNelDb` |
| `rigaSceltaSn` | v10 · 15824 | v13 · 16461 | (chiama _rigaSceltaSnV13) | --- l'etichetta «Personale» --- — usa: `ciclo` |
| `notaCtx` | v10 · 15287 | v13 · 16468 | (chiama _notaCtxV13) | --- aggiungere: con «Tutto» niente «Sei in Lavoro: la metto in Personale» --- |
| `etichettaSalva` | v10 · 15295 | v13 · 16470 | (chiama _etichettaSalvaV13) | --- aggiungere: con «Tutto» niente «Sei in Lavoro: la metto in Personale» --- |
| `dopoIlSalvataggio` | v10 · 15428 | v13 · 16472 | (chiama _dopoIlSalvataggioV13) | --- aggiungere: con «Tutto» niente «Sei in Lavoro: la metto in Personale» --- |
| `ensureGcalCalendar` | v10 · 13176 | v13 · 16493 | (chiama _ensureGcalCalendarV13) | --- calendario della cosa: personali sul Privato, se l'account può scriverci --- — usa: `verificaCalPrivato` |
| `segnaEvento` | v9 · 12762 | v15 · 16619 | (chiama _segnaEventoV15) | la spunta salva anche il titolo (per ritrovarla in Fatte) — usa: `eventoPerId` |
| `vistaFatte` | v14 · 16560 | v15 · 16707 | (chiama _vistaFatteV15) | Fatte: anche gli appuntamenti chiusi, con il feedback — usa: `normTitolo`, `escHtml`, `fmtGgMm` |
| `giorniVisibili` | v6 · 11530 | v21 · 17312 | (chiama _giorniVisibiliV21) | board (≥ 1100 px) — usa: `eSettimanaCorrente`, `v21Da` |
| `pianLargo` | v6 · 11533 | v21 · 17324 | (chiama _pianLargoV21) | board (≥ 1100 px) — usa: `eSettimanaCorrente`, `v21RigaPassati` |
| `pianSettimanaColonne` | v2 · 7140 | v21 · 17333 | (chiama _pianSettimanaColonneV21) | colonne (768–1100 px) — usa: `eSettimanaCorrente`, `v21Tpl`, `v21Da`, `v21InTesta`, `v21BtnStampa` |
| `pianSettimana` | v2 · 7108 | v21 · 17354 | (chiama _pianSettimanaV21) | telefono: i giorni da oggi in poi nella fila in alto — usa: `v21Da`, `v21Tpl`, `riga`, `v21RigaPassati`, `v21InTesta` |
| `rigaSpazio` | v6 · 11509 | v24 · 17663 | (chiama _rigaSpazioV24) | le ore del giorno: con altri e tue (eventi con un orario; quelli di tutto il giorno a parte) |
| `legendaColori` | v6 · 11441 | v24 · 17665 | (chiama _legendaColoriV24) | le ore del giorno: con altri e tue (eventi con un orario; quelli di tutto il giorno a parte) |
| `autoCategoria` | v1 · 4465 | v25 · 17785 | (chiama _autoCategoriaV25) | somiglianza con le cose già smistate: la sezione con più parole in comune — usa: `v25SuggerisciArea`, `showToast`, `apriDettaglio` |
| `rispondiProteggi` | v5 · 10286 | v26 · 17868 | (chiama _rispondiProteggiV26) | conferma prima di spostare un appuntamento che non si sposta — usa: `$`, `closeModal`, `render`, `showToast` |
| `chiediSpostamento` | v5 · 10272 | v26 · 17878 | (chiama _chiediSpostamentoV26) | conferma prima di spostare un appuntamento che non si sposta — usa: `computeEffectiveQ`, `$` |
| `apriSpostaEvento` | v6 · 11248 | v26 · 17884 | (chiama _apriSpostaEventoV26) | conferma prima di spostare un appuntamento che non si sposta — usa: `eventoPerId`, `v26EventoFisso`, `protezione`, `v26ChiediEvento` |
| `apriWizard` | v2 · 7583 | v26 · 18015 | (chiama _apriWizardV26) | «Prepara la settimana»: primo passo gli obiettivi — usa: `bpSettimanaCorrente`, `v26ObDi`, `settKey`, `v26ApriObiettivi` |
| `testoInvio` | v4 · 9597 | v26 · 18023 | (chiama _testoInvioV26) | la mail a Leo — usa: `v26ObDi` |
| `v25Momento` | v25 · 17691 | v26 · 18343 | (chiama _v25MomentoV26) | --- Oggi: «Adesso tocca a…» in una riga, «Prima di iniziare», la sera «Chiudi la giornata» --- |
| `chiediOrigineSubito` | v5 · 10362 | v27 · 18551 | (chiama _chiediOrigineSubitoV27) | _(nessun commento; sezione: v27 · 3/11 · DOPO UNA «SUBITO»: DUE PASSI CHIARI)_ — usa: `$`, `v27DataBreve`, `v27DisegnaSubito` |
| `segnaleMia` | v10 · 15128 | v28 · 18638 | (chiama _segnaleMiaV28) | «Mia» dettata minuscola: «la cresima di mia», «vestito cresima mia» — usa: `testoCtx` |
| `disegnaCalCicli` | v5 · 10599 | v30 · 19129 | (chiama _disegnaCalCicliV30) | il foglio: per i promemoria passati «Già fatta · Mettila tra le cose da fare · Lascia stare» — usa: `oggiLocale`, `esc`, `$`, `escHtml`, `fmtGiorno` |
| `daPianificareFiltrate` | v6 · 11482 | v30 · 19158 | (chiama _daPianificareFiltrateV30) | --- «Da rivedere» in Da pianificare --- |
| `colonnaDaPianificare` | v6 · 11493 | v30 · 19164 | (chiama _colonnaDaPianificareV30) | --- «Da rivedere» in Da pianificare --- — usa: `v30DaRivedere` |
| `v31Ritmo` | v31 · 19228 | v32 · 19317 | (IIFE con orig) | · Pianifica: il titolo non è più coperto dai bottoni; «Piano in bozza» intero. — usa: `v25Momento` |
| `v31Giornata` | v31 · 19269 | v32 · 19320 | (IIFE con orig) | · Pianifica: il titolo non è più coperto dai bottoni; «Piano in bozza» intero. |
| `v31Obiettivi` | v31 · 19283 | v32 · 19323 | (IIFE con orig) | · Pianifica: il titolo non è più coperto dai bottoni; «Piano in bozza» intero. |
| `v26VistaGiorno` | v26 · 18049 | v40 · 19610 | (chiama _vgV40) | _(nessun commento; sezione: v40 · 10/11 — Pianifica › Giorno: a destra (sul telefono sotto la giornata) le Subito e le Importanti)_ — usa: `v40Box`, `dataDelGiorno` |
| `cercaCicliInCalendario` | v30 · 19084 | v41 · 19690 | (chiama _cercaV41) | _(nessun commento; sezione: v41 · 10/11 — «mi ritrovo cose che ho già chiuso»)_ — usa: `v41LeggiScelte`, `v41SpingiScelte` |
| `sceltaCalCiclo` | v5 · 10609 | v41 · 19696 | (chiama _sceltaV41) | _(nessun commento; sezione: v41 · 10/11 — «mi ritrovo cose che ho già chiuso»)_ — usa: `v41SpingiScelte` |
| `loadAll` | v1 · 3580 | v42 · 19788 | (chiama _loadV42) | (5) «Aggiornato alle…» — usa: `v42Etichetta` |
| `v40Candidate` | v40 · 19577 | v45 · 19923 | (chiama _candV45) | le Subito rimaste indietro, pronte da trascinare in un giorno nuovo. — usa: `v47Indietro`, `v45SubitoIndietro`, `computeEffectiveQ`, `v45Da` |
| `v44Aggiorna` | v44 · 19827 | v47 · 20160 | (chiama _v44V47) | la barra della v44 sul computer non serve più: la testa resta già in vista — usa: `v44Barra` |
| `bordoSposta` | v6 · 11562 | v48 · 20216 | (chiama _bsV48) | i messaggi verdi senza «Annulla» degli spostamenti si tacciono: il messaggio con «Annulla» lo dà v48 — usa: `ciclo`, `siRipete`, `v48Foto`, `patchCiclo`, `showToast` |
| `openPianificaModal` | v1 · 5120 | v48 · 20268 | (chiama _openPfV48) | _(nessun commento; sezione: v48 · 19/11 · PIÙ PRATICA: «Annulla» anche sugli spostamenti, giorni con un tocco (ore libere), PDF nei colori)_ — usa: `v48Giorni` |
| `v49Lista` | v49 · 20294 | v50 · 20846 | (chiama _listaV50) | Smaltisci: Delega apre il suo foglio e, chiuso quello, si torna a Smaltisci |
| `v49Fai` | v49 · 20352 | v50 · 20848 | (chiama _faiV50) | Smaltisci: Delega apre il suo foglio e, chiuso quello, si torna a Smaltisci — usa: `v49Lista`, `closeModal`, `apriDelega`, `$`, `v50Riprendi` |
| `v49Annulla` | v49 · 20370 | v50 · 20875 | (chiama _annV50) | _(nessun commento; sezione: v50 · 19/11 — sfondo salvia; in Oggi ogni cosa è una scheda a sé (Subito / Importante / Delega si distinguono))_ — usa: `patchCiclo`, `v49Lista`, `render`, `showToast`, `v49Disegna` |

## 3. Strati che sostituiscono (codice morto dentro le catene)

Quando uno strato riscrive la funzione senza richiamare l'alias precedente, la definizione base e gli strati prima di lui non girano più — a meno che qualcuno chiami direttamente un alias vecchio (`_xBase(…)`). Sono candidati sicuri da togliere nel riordino, dopo aver verificato gli alias.

| Funzione | Strato che sostituisce | Strati resi morti sotto di lui |
|---|---|---|
| `disegnaAnteprimaCattura` | v10 · riga 15300 | base |

## 4. CSS sovrascritto

### 4.1 Le tavolozze (variabili `--…`)

Dalla fase E del riordino (23/11) tutte le variabili della radice stanno in `src/css/core/000-tavolozza.css`: `:root` (tema chiaro e base), `:root[data-theme="dark"]`, `:root[data-contrast="alto"]`, `:root[data-theme="dark"][data-contrast="alto"]`. Prima erano ridefinite a ogni cambio di stile (v1, v3, v9, v26, v30, v43, v44.1, v50). Fuori dalla tavolozza restano solo le variabili locali di alcuni componenti (`.futuro`, `.sn-futuro`).

### 4.2 Selettori definiti più volte

Stesso selettore nello stesso contesto (`@media` compreso). «Proprietà sovrascritte» = dichiarate in più di una delle regole (le altre si sommano).

| Selettore | Volte | Dove (versione@riga) | Proprietà sovrascritte | !important |
|---|---|---|---|---|
| `.spazio-riga` | 4 | v6@1305 v6@1306 v24@1900 v30@2215 | border, background |  |
| `.spazio-riga .item-title` | 4 | v6@1307 v6@1312 v24@1901 v30@2216 | color, font-weight |  |
| `body` | 3 | v1@281 v1@441 v1@442 | — |  |
| `.board .evt-riga.v24-mio` | 3 | v24@1894 v30@2207 v30@2212 | margin, border-radius, border |  |
| `html:root .board .evt-riga.v24-altri` | 3 | v43@2289 v47@2376 v49@2482 | background, box-shadow | 3 |
| `html:root .board .evt-riga.v24-mio` | 3 | v43@2295 v47@2376 v49@2485 | background, box-shadow | 3 |
| `@media (max-width: 767px) .v49-giorni` | 3 | v49@2442 v49@2447 v49@2448 | padding-left, padding-right |  |
| `html` | 2 | v1@280 v1@441 | — |  |
| `button` | 2 | v1@282 v1@283 | — |  |
| `.t-title` | 2 | v1@291 v30@2037 | font-weight, letter-spacing |  |
| `.btn-primary` | 2 | v1@301 v30@2041 | box-shadow |  |
| `.btn-primary:active` | 2 | v1@302 v30@2042 | transform |  |
| `.check-box` | 2 | v1@335 v30@2040 | border-radius, border |  |
| `.item-row` | 2 | v1@357 v1@536 | — |  |
| `.item-side` | 2 | v1@362 v1@539 | gap |  |
| `.nav button[aria-current="page"] .nav-ico` | 2 | v1@404 v30@2043 | background |  |
| `.sheet-head` | 2 | v1@411 v3@739 | align-items |  |
| `.logo` | 2 | v1@450 v30@2033 | font-family, font-size, letter-spacing, font-weight |  |
| `.logo span` | 2 | v1@451 v30@2035 | color |  |
| `.cattura` | 2 | v1@456 v8@813 | — |  |
| `.top` | 2 | v1@468 v13@1753 | — |  |
| `.vh h1` | 2 | v1@504 v30@2036 | font-weight, letter-spacing |  |
| `.list-head` | 2 | v1@509 v30@2038 | font-size, line-height, font-weight, color |  |
| `.list-head .mono` | 2 | v1@511 v30@2039 | color, font-size |  |
| `.carry-giorni` | 2 | v1@624 v1@628 | — |  |
| `.legenda` | 2 | v3@713 v6@1266 | display, flex-wrap, gap, font-size, color |  |
| `.meta-tag` | 2 | v8@843 v9@1391 | color |  |
| `.guida-body ul` | 2 | v8@909 v8@910 | — |  |
| `.evt-cerchio` | 2 | v4@994 v9@1381 | display |  |
| `.bpw-sotto-h` | 2 | v4@1046 v4@1047 | color |  |
| `@media print .cattura` | 2 | v5@1260 v6@1368 | display | 1 |
| `.vh-board` | 2 | v6@1273 v22@1831 | — |  |
| `.bcol-h` | 2 | v6@1286 v51@2380 | — |  |
| `.board .evt-riga[draggable="true"]` | 2 | v6@1291 v6@1313 | — |  |
| `.spazio-riga .evt-ico` | 2 | v6@1312 v30@2216 | color |  |
| `.persona-avviso > .ti` | 2 | v9@1530 v9@1536 | — |  |
| `.sn-q` | 2 | v10@1558 v10@1559 | — |  |
| `.sn-vedi` | 2 | v10@1576 v10@1577 | color |  |
| `.sn-dett` | 2 | v10@1645 v10@1673 | — |  |
| `.v12-head span:first-child` | 2 | v12@1713 v30@2045 | letter-spacing, text-transform, font-size |  |
| `.evt-riga.evt-app.v24-mio .evt-cerchio` | 2 | v24@1892 v30@2208 | — |  |
| `.spazio-riga .evt-ico .ti` | 2 | v24@1902 v30@2216 | color |  |
| `.v31-ad-ritmo > span` | 2 | v30@2062 v48@2401 | flex | 1 |
| `.v31-ad-ritmo .btn:not(.btn-icon)` | 2 | v30@2063 v48@2402 | flex | 1 |
| `.board .evt-riga.v24-altri` | 2 | v30@2210 v30@2212 | — |  |
| `.v40-dametti` | 2 | v40@2223 v40.2@2247 | gap |  |
| `.v40-gr-h` | 2 | v40@2228 v40.2@2249 | margin-top |  |
| `.v40-riga` | 2 | v40@2230 v40.2@2250 | — |  |
| `.v40-apri` | 2 | v40@2231 v40.2@2251 | padding |  |
| `.v40-apri .t` | 2 | v40@2232 v40.2@2252 | -webkit-line-clamp |  |
| `html:root .item.p-q1:not(.is-done) .item-row` | 2 | v43@2272 v44.1@2319 | background |  |
| `html:root .item.p-q1:not(.is-done) .check-box` | 2 | v43@2274 v44.1@2321 | border-color |  |
| `html:root .item.p-q1:not(.is-done) + .item.p-q1:not(.is-done)` | 2 | v43@2277 v44.1@2320 | border-top |  |
| `html:root .v40-riga.q1` | 2 | v43@2279 v44.1@2324 | background, border-color |  |
| `.v43-metodo .v12-coach li` | 2 | v43@2301 v46@2334 | — |  |
| `.v47-testa` | 2 | v47@2346 v50@2496 | background |  |
| `.v47-indietro > summary` | 2 | v47@2365 v49@2451 | display, align-items, gap | 1 |
| `.v47-testa .vh-board` | 2 | v47@2368 v47@2371 | — |  |
| `.v48-g.we` | 2 | v48@2399 v50@2517 | opacity |  |
| `.v49-sc b` | 2 | v49@2428 v49@2429 | — |  |
| `.v49-sc small` | 2 | v49@2428 v49@2430 | — |  |
| `@media (max-width: 767px) .v49-piede` | 2 | v49@2441 v49@2447 | — |  |
| `@media (max-width: 767px) .v49-dom` | 2 | v49@2447 v49@2448 | padding-left, padding-right |  |
| `@media (max-width: 767px) .v49-scelte` | 2 | v49@2447 v49@2448 | padding-left, padding-right |  |

Molte più sovrascritture sono **indirette** (selettore diverso ma più specifico, es. `html:root .board .evt-riga.v24-mio` contro `.board .evt-riga.v24-mio`): l'analisi per selettore identico non le vede. Il prefisso `html:root` aggiunto da v43 in poi è proprio un trucco di specificità per vincere sulle regole vecchie.

### 4.3 `!important` per versione

| Versione | v1 | v3 | v4 | v6 | v8 | v10 | v18 | v30 | v43 | v47 | v48 | v49 | v50 | Totale |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| N. | 2 | 13 | 3 | 3 | 1 | 2 | 1 | 5 | 2 | 2 | 2 | 35 | 24 | 95 |

Quasi due terzi stanno in v49–v50: sono gli strati che hanno dovuto battere la cascata accumulata. Elenco completo: `grep -rn '!important' src/css`; perché ognuno resta: `docs/egm/fase-e/casi.md`.

## 5. Codice morto

### 5.1 Funzioni mai chiamate

Nessun riferimento nel JavaScript (escluse dichiarazione e alias), nell'HTML, negli attributi `onclick`/`data-act` né in alcuna stringa o template. Verificato anche con `grep`: ogni nome compare solo nella propria dichiarazione.

| Funzione | Riga | Versione | Nota |
|---|---|---|---|

Non è contata la morte «a cascata» (funzioni chiamate solo da funzioni morte) né le 1 catene troncate della sezione 3: il codice realmente eliminabile è di più.

### 5.2 Classi CSS senza elementi

Classi presenti nel CSS ma mai scritte nell'HTML né in una stringa JS. Escluse le classi composte a runtime che ho verificato (`p-q${q}`, `t-q${q}`, `chip-q${q}`, `v17-q${q}`).

| Classe | Righe CSS |
|---|---|
| `.is-open` | 364 |
| `.dopp-parente` | 1111 |
| `.v25-ritmo` | 1872, 1873, 1874, 1875, 1876, 1877 |
| `.ti-ico` | 1873 |
| `.v25-testo` | 1874, 1875, 1951 |
| `.v26-ritmo` | 1951 |

`tag-q3`/`tag-q4`: nel JS compaiono solo `tag-q1` e `tag-q2` scritti per intero. Nessun id CSS (`#…`) risulta orfano.

## Come rigenerare

Script in `tools/mappa/`: `cd tools/mappa && npm i && node analizza.js ../../index.html > report.json && node genera_mappa.js report.json ../../docs/MAPPA.md $(git rev-parse --short HEAD)`.

**Limiti dell'analisi**: (1) chiamate costruite per nome (`window[nome]()`) non si vedono — controllate a campione, nessun caso trovato tra le funzioni «morte»; (2) «cosa aggiunge» viene dal commento più vicino allo strato, non da una lettura riga per riga; (3) le classi CSS dentro `:not()`/`:has()` contano come usate se compaiono altrove.
