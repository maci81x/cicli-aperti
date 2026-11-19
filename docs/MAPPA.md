# MAPPA di index.html — strati, sovrascritture, codice morto

> Generata il 19/11/2026 su `index.html` al commit `948aad8` (v50, 21.798 righe) con un'analisi statica (parser JavaScript *acorn* + parser CSS *postcss*), poi controllata a campione a mano.
> I numeri di riga sono quelli di `index.html`. Se il file cambia, le righe scorrono: rigenerare la mappa (vedi in fondo).

## In breve

| | |
|---|---|
| Blocchi | `<style>` righe 64–2635 · HTML righe 2638–3497 · `<script>` principale righe 3499–21795 (più un piccolo `<script>` in testa, righe 23–58) |
| Funzioni top-level | 1169 |
| Alias `const _x = fn` | 254 |
| Riassegnazioni `fn = …` | 301 su 161 funzioni |
| Funzioni avvolte **2 o più volte** | **59** (199 strati in tutto) |
| Funzioni avvolte una volta sola | 102 |
| Strati che **sostituiscono** senza richiamare il precedente | 38 (tutto ciò che sta sotto di loro non viene più eseguito) |
| Regole CSS (selettore × media) | 2208 |
| Selettori definiti più volte nello stesso contesto | 74 |
| `!important` | 96 (di cui 59 in v49–v50) |
| Funzioni mai chiamate | 23 |
| Classi CSS senza elementi | 23 |

**Legenda «tipo»**: *chiama \_xV12* = lo strato richiama la versione precedente (avvolge davvero); *decoratore proteggi()* = `fn = proteggi(fn)`; *IIFE con orig* = `fn = (function (orig) { … })(fn)`; **sostituisce** = riscrive la funzione da capo: gli strati precedenti diventano codice morto.

**Versione** = l'ultimo commento di sezione `// vNN ·` a colonna 0 prima della riga. Tra le righe 6485 e 11722 le sezioni v2–v5 sono mescolate (la «PARTE 2» è nata a blocchi), quindi l'ordine delle versioni lì non è monotòno.

## 1. Funzioni avvolte più volte — la catena degli strati

Ordine = ordine di esecuzione dello script: l'ultimo strato è quello che gira per primo quando la funzione viene chiamata, e dentro di sé chiama i precedenti.

Indice: [`vistaOggi`](#vistaoggi) (15) · [`disegna`](#disegna) (13) · [`avviaApp`](#avviaapp) (7) · [`disegnaAnteprima`](#disegnaanteprima) (7) · [`salvaCattura`](#salvacattura) (6) · [`riga`](#riga) (6) · [`rigaEvento`](#rigaevento) (5) · [`vistaPianifica`](#vistapianifica) (5) · [`apriRapido`](#aprirapido) (5) · [`disegnaAnteprimaCattura`](#disegnaanteprimacattura) (5) · [`eventiDelGiorno`](#eventidelgiorno) (4) · [`salvaRapido`](#salvarapido) (4) · [`vociDaRighe`](#vocidarighe) (4) · [`apriDettaglio`](#apridettaglio) (4) · [`disegnaFoglioEvento`](#disegnafoglioevento) (4) · [`htmlDaPianificareLista`](#htmldapianificarelista) (4) · [`azioneFatto`](#azionefatto) (3) · [`moveCicloInAgenda`](#movecicloinagenda) (3) · [`_handleGcalToken`](#_handlegcaltoken) (3) · [`caricaEventi`](#caricaeventi) (3) · [`ensureGcalCalendar`](#ensuregcalcalendar) (3) · [`chiudiBlocco`](#chiudiblocco) (3) · [`aggiornaTutto`](#aggiornatutto) (3) · [`openBpReview`](#openbpreview) (3) · [`disegnaReview`](#disegnareview) (3) · [`render`](#render) (3) · [`aggiungiFrasi`](#aggiungifrasi) (3) · [`showToast`](#showtoast) (3) · [`eventoDa`](#eventoda) (3) · [`colonnaGiorno`](#colonnagiorno) (3) · [`caricaEventiNascosti`](#caricaeventinascosti) (3) · [`bpwRenderStep2`](#bpwrenderstep2) (2) · [`openBpWizard`](#openbpwizard) (2) · [`azioneDomani`](#azionedomani) (2) · [`impostaGiorno`](#impostagiorno) (2) · [`togliBlocco`](#togliblocco) (2) · [`aggiornaBlocco`](#aggiornablocco) (2) · [`revMotiviConteggio`](#revmotiviconteggio) (2) · [`disegnaRapido`](#disegnarapido) (2) · [`aggiungiRighe`](#aggiungirighe) (2) · [`segnaStampato`](#segnastampato) (2) · [`patchCiclo`](#patchciclo) (2) · [`flipDone`](#flipdone) (2) · [`disegnaRiordina`](#disegnariordina) (2) · [`corpoEvento`](#corpoevento) (2) · [`eventoInElenco`](#eventoinelenco) (2) · [`apriFoglioEvento`](#aprifoglioevento) (2) · [`voceAnteprimaPlaud`](#voceanteprimaplaud) (2) · [`vistaAltro`](#vistaaltro) (2) · [`vistaImpostazioni`](#vistaimpostazioni) (2) · [`rigaDaVoce`](#rigadavoce) (2) · [`bannerCicliCal`](#bannerciclical) (2) · [`eventoSpuntabile`](#eventospuntabile) (2) · [`vistaFatte`](#vistafatte) (2) · [`vistaTutto`](#vistatutto) (2) · [`apriMenu`](#aprimenu) (2) · [`v25RitmoCard`](#v25ritmocard) (2) · [`cercaCicliInCalendario`](#cercacicliincalendario) (2) · [`v26DisegnaChiudi`](#v26disegnachiudi) (2)

### vistaOggi

Definita a riga 7446 (v2) · 15 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7446 | base | definizione originale |
| 1 | v10 | 14967 | (chiama _vistaOggiAgg) | «dati di ieri»: la settimana di oggi viene da una lettura di più di 12 ore fa (copia locale o token scaduto) — usa: `notaEventiVecchi` |
| 2 | v10 | 15887 | (chiama _vistaOggiPr) | in Oggi: sopra «Da controllare» (o tra i banner); in Tutto → Persone: sotto il nome — usa: `cardDeleghe` |
| 3 | v11 | 17073 | (chiama _vistaOggiV11) | la riga di un impegno delle figlie: grigia, con l'etichetta — usa: `figlieDelGiorno`, `rigaFiglie` |
| 4 | v12 | 17488 | (chiama _vistaOggiV12) | i suggerimenti: fuori dalla cima, in «Quando hai tempo» — usa: `modoSemplice`, `primaDiTutto`, `escHtml`, `plurale` |
| 5 | v21 | 18393 | (chiama _vistaOggiV21) | Oggi: la stampante accanto al titolo — usa: `v21Tpl`, `v21BtnStampa`, `giornoIdxDi`, `oggiData`, `v21InTesta` |
| 6 | v23 | 18586 | (chiama _vistaOggiV23) | _(nessun commento; sezione: v23 · 31/10 · OGGI: «DA RISPONDERE (N)» — le cose arrivate dalla posta che aspettano una tua risposta)_ — usa: `v23Blocco` |
| 7 | v25 | 18795 | (chiama _vistaOggiV25) | _(nessun commento; sezione: v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE N)_ — usa: `modoSemplice`, `v25RitmoCard` |
| 8 | v29 | 19961 | (chiama _vistaOggiV29) | _(nessun commento; sezione: v29 · 3/11 · IL TEMPO PER PREPARARE GLI APPUNTAMENTI (sezione 10 del canvas, idea di Leo))_ — usa: `v29Blocco`, `v29ControllaPresto` |
| 9 | v31 | 20462 | (chiama _vistaOggiV31) | «Adesso» prende il posto del vecchio riquadro «Adesso tocca a…» e ne porta dentro il suggerimento — usa: `modoSemplice` |
| 10 | v32 | 20512 | (chiama _vistaOggiV32) | routine: quelle del calendario già passate stanno in una riga chiusa — usa: `v31Ora`, `routineDelGiorno`, `oggiData`, `minDi`, `escHtml` |
| 11 | v33 | 20621 | (chiama _vistaOggiV33) | · Tutte (Lista): i gruppi su due colonne (Subito a sinistra, Importante a destra…). — usa: `v33Largo`, `v33InSettimana` |
| 12 | v43 | 21039 | (chiama _vistaOggiV43) | come «Il metodo · da fare»; al centro resta solo «Oggi: N cose da chiudere», a tutta larghezza. |
| 13 | v49 | 21597 | (chiama _oggiV49a) | Oggi: sotto «Oggi: N cose da chiudere», il bottone per smaltire le rimaste indietro — usa: `v49Lista` |
| 14 | v49 | 21617 | (chiama _oggiV49b) | già compatti: restano come sono (si aprono da soli) — usa: `v49Chiave`, `esc`, `escHtml`, `corta` |
| 15 | v50 | 21689 | (chiama _oggiV50) | Oggi sul telefono: un solo riquadro «Da controllare» sotto le cose da chiudere — usa: `v49Chiave`, `esc`, `escHtml`, `corta` |

### disegna

Definita a riga 6710 (v2) · 13 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6710 | base | definizione originale |
| 1 | v6 | 12336 | (chiama _disegnaV5) | Tastiera: Alt + freccia sposta la cosa selezionata nella colonna accanto — usa: `$`, `boardAttiva` |
| 2 | v13 | 17588 | (chiama _disegnaV13) | --- il filtro in alto --- — usa: `$` |
| 3 | v25 | 18865 | (chiama _disegnaV25) | l'armadio usa tutta la larghezza, come la board della settimana — usa: `v25ArmadioAttivo`, `$` |
| 4 | v26 | 19216 | (chiama _disegnaV26) | _(nessun commento; sezione: v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11))_ — usa: `$` |
| 5 | v32 | 20594 | (chiama _disegnaV32) | --- la barra in alto: «Tutto ▾» e il titolo quando scorri --- — usa: `v32AggiornaTesta`, `$`, `v32Tel` |
| 6 | v33 | 20681 | (chiama _disegnaV33) | Tutte, Lista: due colonne, ogni gruppo nella colonna più corta — usa: `v33DopoDisegno` |
| 7 | v40.2 | 20867 | (chiama _dV402) | _(nessun commento; sezione: v40.2 · la vista Giorno non si allarga oltre 1240px)_ — usa: `$`, `v40Altezza` |
| 8 | v44 | 21116 | (chiama _dV44) | _(nessun commento; sezione: v44 · 17/11 — Pianifica sul computer: scorrendo in giù resta in alto una barra con la settimana (‹ ›))_ — usa: `v44Chiedi` |
| 9 | v46 | 21231 | (chiama _disegnaV46) | _(nessun commento; sezione: v46 · 17/11 — «quando spunto una casella in fondo o a metà, l'elenco riparte dall'inizio»)_ — usa: `v46Annota`, `v46Rimetti` |
| 10 | v47 | 21321 | (chiama _dV47) | dopo il disegno: giorni tutti in vista e altezza della testa per le intestazioni fisse — usa: `$` |
| 11 | v49 | 21672 | (chiama _disegnaV49) | (3) Pianifica: l'orario degli appuntamenti a sinistra, in colonna — usa: `v49Orari` |
| 12 | v50 | 21680 | (chiama _disegnaV50) | «Da controllare» anche sul telefono; Delega da Smaltisci torna a Smaltisci — usa: `$` |
| 13 | v50 | 21794 | (chiama _disegnaV50b) | appuntamenti: niente bottoni dentro un bottone; si apre dal titolo (Invio o clic), la spunta e il cestino restano bottoni — usa: `v50Appuntamenti` |

### avviaApp

Definita a riga 14774 (v10) · 7 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v10 | 14774 | base | definizione originale |
| 1 | v9 | 13086 | (chiama _avviaAppV8) | le persone servono per riconoscere le deleghe: si aspetta la fine del primo caricamento — usa: `testoNuovaDaUrl`, `togliNuovaDaUrl`, `dopoIlCaricamento`, `$`, `apriRapidoCon` |
| 2 | v10 | 14655 | (chiama _avviaAppV9) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `controllaClaudeServer`, `render`, `caricaEventiFatti` |
| 3 | v10 | 16039 | (chiama _avviaAppPr) | ALTRO: «Le mie mete» e «Da rendere specifiche» · GUIDA · AVVIO — usa: `dopoIlCaricamento`, `rilevaPrincipi` |
| 4 | v11 | 17194 | (chiama _avviaAppV11) | all'avvio: i nascosti — usa: `caricaEventiNascosti` |
| 5 | v12 | 17546 | (chiama _avviaAppV12) | all'avvio: la bozza del campo e gli invii nel database — usa: `ripristinaBozzaCattura`, `caricaInviiDb` |
| 6 | v13 | 17649 | (chiama _avviaAppV13) | all'avvio: si parte da Tutto; la colonna del calendario della cosa c'è? — usa: `verificaCalPrivato` |
| 7 | v15 | 17886 | (chiama _avviaAppV15) | Fatte: anche gli appuntamenti chiusi, con il feedback — usa: `caricaEventiInfo`, `render` |

### disegnaAnteprima

Definita a riga 12942 (v9) · 7 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12942 | base | definizione originale |
| 1 | v9 | 13803 | (chiama _disegnaAnteprimaV9) | «Avvisami» nel riepilogo: attiva di default quando c'è l'ora (e Google è collegato) — usa: `vociDaRighe`, `righeCampo`, `$`, `spuntaAvviso` |
| 2 | v10 | 14520 | (chiama _disegnaAnteprimaDopp) | Il riepilogo prima di salvare: «c'è già» / «simile», e «Vedi anche» per i parenti  — usa: `$`, `vociDaRighe`, `righeCampo`, `trovaDoppione`, `forte` |
| 3 | v10 | 15568 | (chiama _disegnaAnteprimaPr) | la durata di 5 minuti la rende una Rapida (≤ 15 min, come prima) — usa: `$`, `vociDaRighe`, `righeCampo` |
| 4 | v10 | 16276 | **sostituisce** | _(nessun commento; sezione: v10 · SNELLA (25/10): meno tocchi, stesse funzioni)_ — usa: `$`, `vociDi`, `htmlVoceSn`, `notaCtx`, `etichettaSalva` |
| 5 | v12 | 17336 | (chiama _disegnaAnteprimaV12) | «unisci ↑» tra due pezzi della stessa frase — usa: `$`, `vociDaRighe`, `righeCampo`, `eTelefono`, `esc` |
| 6 | v14 | 17703 | (chiama _disegnaAnteprimaV14) | + Seguito — usa: `escHtml` |
| 7 | v17 | 18091 | (chiama _disegnaAnteprimaV17) | nel foglio Aggiungi: sotto ogni cosa — usa: `$`, `vociDi`, `htmlCollegate` |

### salvaCattura

Definita a riga 11769 (v6) · 6 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v6 | 11769 | base | definizione originale |
| 1 | v9 | 13060 | **sostituisce** | campo fisso del telefono: stesso riepilogo, in breve; «Modifica» apre il foglio con il testo — usa: `righeCattura`, `apriRapido`, `fermaDettatura`, `$`, `aggiungiFrasi` |
| 2 | v9 | 13835 | (chiama _salvaCatturaV9) | il campo del telefono: la sua spunta vale per tutte le righe con un'ora |
| 3 | v10 | 15637 | (chiama _salvaCatturaPr) | dopo un salvataggio normale di una cosa breve: «Falla ora» nel messaggio — usa: `vociDaRighe`, `righeCattura`, `offriFallaOraDopo` |
| 4 | v10 | 16380 | **sostituisce** | i tasti del campo non tolgono il cursore (iPhone: altrimenti la riga dei chip sparisce sotto il dito) — usa: `righeCattura`, `apriRapido`, `fermaDettatura`, `$`, `rCattura` |
| 5 | v12 | 17252 | (chiama _salvaCatturaV12) | --- 2. La bozza --- — usa: `$`, `bozzaScrivi` |
| 6 | v32 | 20561 | (IIFE con orig) | --- «Cosa hai in testa?» dal centro del menu --- — usa: `$`, `v32ChiudiCattura` |

### riga

Definita a riga 6772 (v2) · 6 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6772 | base | definizione originale |
| 1 | v10 | 15297 | (chiama _rigaPr) | Nella riga: il segno della meta  — usa: `metaDi`, `esc`, `escHtml`, `corta` |
| 2 | v13 | 17603 | (chiama _rigaV13) | --- l'etichetta «Personale» --- — usa: `filtroQui` |
| 3 | v19 | 18239 | (chiama _rigaV19) | nel dettaglio: che tipo è, l'ultima mail e i tasti per aprire le mail in Gmail. — usa: `daPosta`, `tagPosta` |
| 4 | v26 | 18933 | (chiama _rigaV26) | la riga di una cosa: classe per il rosso — usa: `v26CosaFissa` |
| 5 | v30 | 20331 | (chiama _rigaV30) | --- «Da rivedere» in Da pianificare --- |
| 6 | v45 | 21164 | (chiama _rigaV45) | le Subito rimaste indietro, pronte da trascinare in un giorno nuovo. — usa: `indietro`, `oggiLocale`, `ripetizioneDi`, `isGiornaliero`, `v45Da` |

### rigaEvento

Definita a riga 9771 (v4) · 5 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 9771 | base | definizione originale |
| 1 | v5 | 10596 | **sostituisce** | Gli appuntamenti del giorno, senza la routine del mattino (quella va in Routine) — usa: `orarioEvento`, `coseSovrapposte`, `escHtml`, `esc` |
| 2 | v9 | 13538 | **sostituisce** | _(nessun commento; sezione: v9 · APPUNTAMENTI TOCCABILI)_ — usa: `orarioEvento`, `nomeCalendario`, `coseSovrapposte`, `escHtml`, `eventoSpuntabile` |
| 3 | v12 | 17476 | (chiama _rigaEventoV12) | il pallino rosso nel titolo dei passati — usa: `oggiLocale` |
| 4 | v24 | 18659 | (chiama _rigaEventoV24) | _(nessun commento; sezione: v24 · 2/11 · APPUNTAMENTI CON ALTRI E TEMPO TUO (disegno 8 del canvas «versione snella»))_ — usa: `eFiglie`, `v24ConAltri`, `v24SceltoAMano`, `escHtml`, `v24ConChi` |
| 5 | v26 | 18940 | (chiama _rigaEventoV26) | la riga di un appuntamento: rosso + «non si sposta» — usa: `v26EventoFisso` |

### vistaPianifica

Definita a riga 7537 (v2) · 5 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7537 | base | definizione originale |
| 1 | v6 | 12226 | (chiama _vistaPianificaV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `boardAttiva`, `btnAiuto`, `pianLargo` |
| 2 | v10 | 14969 | (chiama _vistaPianificaAgg) | «dati di ieri»: la settimana di oggi viene da una lettura di più di 12 ore fa (copia locale o token scaduto) — usa: `notaEventiVecchi` |
| 3 | v22 | 18547 | (chiama _vistaPianificaV22) | piano e coach: sotto il giorno — usa: `boardAttiva`, `v22Board`, `v22Telefono` |
| 4 | v26 | 19208 | (chiama _vistaPianificaV26) | _(nessun commento; sezione: v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11))_ — usa: `v26VistaGiorno`, `v26SegConGiorno`, `v26InserisciObiettivi` |
| 5 | v47 | 21294 | (chiama _vpV47) | la colonna Da pianificare: in testa tutte le rimaste indietro (sostituisce il gruppo delle sole Subito della v45) — usa: `riga`, `v47Indietro` |

### apriRapido

Definita a riga 9443 (v3) · 5 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v3 | 9443 | base | definizione originale |
| 1 | v9 | 12980 | (chiama _apriRapidoV8) | _(nessun commento; sezione: v9 · «Spesa:» con sotto righe che iniziano con «-», «•» o «*» = UNA cosa (senza i due punti) con quei passi)_ — usa: `disegnaAnteprima` |
| 2 | v9 | 13832 | (chiama _apriRapidoV9) | i campi ascoltavano le versioni di prima: si ridisegna anche con la spunta |
| 3 | v10 | 16359 | (chiama _apriRapidoSn) | apre il foglio: contesto per riga azzerato; i doppioni guardano anche gli appuntamenti già letti — usa: `disegnaAnteprima`, `caricaEventiDopp` |
| 4 | v12 | 17238 | (chiama _apriRapidoV12) | --- 2. La bozza --- — usa: `bozzaLeggi`, `$`, `disegnaAnteprima` |
| 5 | v14 | 17696 | (chiama _apriRapidoV14) | + Seguito — usa: `$` |

### disegnaAnteprimaCattura

Definita a riga 13048 (v9) · 5 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 13048 | base | definizione originale |
| 1 | v9 | 13813 | (chiama _disegnaAnteprimaCatturaV9) | «Avvisami» nel riepilogo: attiva di default quando c'è l'ora (e Google è collegato) — usa: `$`, `vociDaRighe`, `righeCattura`, `puoAvvisare` |
| 2 | v10 | 14532 | (chiama _disegnaAnteprimaCatturaDopp) | Il riepilogo prima di salvare: «c'è già» / «simile», e «Vedi anche» per i parenti  — usa: `$`, `vociDaRighe`, `righeCattura`, `trovaDoppione`, `forte` |
| 3 | v10 | 15586 | (chiama _disegnaAnteprimaCatturaPr) | la durata di 5 minuti la rende una Rapida (≤ 15 min, come prima) — usa: `$`, `vociDaRighe`, `righeCattura` |
| 4 | v10 | 16287 | **sostituisce** | _(nessun commento; sezione: v10 · SNELLA (25/10): meno tocchi, stesse funzioni)_ — usa: `$`, `vociDi`, `htmlVoceSn`, `notaCtx` |
| 5 | v17 | 18106 | (chiama _disegnaAnteprimaCatturaV17) | nel campo del telefono: quante, e «Modifica» le mostra — usa: `$`, `vociDi`, `collegate`, `v17Parola` |

### eventiDelGiorno

Definita a riga 6929 (v2) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6929 | base | definizione originale |
| 1 | v5 | 10589 | **sostituisce** | Gli appuntamenti del giorno, senza la routine del mattino (quella va in Routine) — usa: `toISODate`, `eventiSettimanaDi` |
| 2 | v10 | 14069 | (chiama _eventiDelGiornoV10) | In Oggi e nelle colonne: un evento dell'app collegato a una cosa non compare (si vede la cosa, con la sua ora) — usa: `collegatoACosa` |
| 3 | v10 | 14148 | (chiama _eventiDelGiornoDalCal) | già tra le cose da fare: collegata a questo evento, oppure una cosa aperta uguale o molto simile (vedi DOPPIONI) — usa: `eventoCollegato` |
| 4 | v11 | 17060 | (chiama _eventiDelGiornoV11) | dove si vedono gli appuntamenti: niente nascosti, niente figlie (quelle hanno la loro riga in Oggi) — usa: `eNascosto`, `eFiglie` |

### salvaRapido

Definita a riga 9475 (v3) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v3 | 9475 | base | definizione originale |
| 1 | v9 | 13041 | **sostituisce** | senza la colonna dei passi restano nella nota, uno per riga — usa: `righeCampo`, `$`, `fermaDettatura`, `aggiungiFrasi`, `vociDaRighe` |
| 2 | v10 | 15629 | (chiama _salvaRapidoPr) | dopo un salvataggio normale di una cosa breve: «Falla ora» nel messaggio — usa: `vociDaRighe`, `righeCampo`, `$`, `offriFallaOraDopo` |
| 3 | v12 | 17246 | (chiama _salvaRapidoV12) | --- 2. La bozza --- — usa: `$`, `bozzaScrivi`, `salvaUnite` |
| 4 | v14 | 17718 | (chiama _salvaRapidoV14) | _(nessun commento; sezione: v14 · 28/10 · FATTA = SPARISCE)_ — usa: `$` |

### vociDaRighe

Definita a riga 12912 (v9) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12912 | base | definizione originale |
| 1 | v9 | 13798 | (chiama _vociDaRigheV9) | «Avvisami» nel riepilogo: attiva di default quando c'è l'ora (e Google è collegato) — usa: `puoAvvisare` |
| 2 | v10 | 15551 | (chiama _vociDaRighePr) | Le voci del campo: «5 minuti», «al volo», «subito» o il chip «5 min» → breve; titolo generico → avviso  — usa: `detto`, `togliBreve`, `troppoGenericaTitolo` |
| 3 | v10 | 16211 | (chiama _vociDaRigheSn) | Le voci: il contesto per riga (indovinato o toccato)  — usa: `indovinaContesto` |
| 4 | v12 | 17320 | (chiama _vociDaRigheV12) | stesso testo, stesso risultato: il riepilogo si ridisegna da più punti a ogni tasto |

### apriDettaglio

Definita a riga 7246 (v2) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7246 | base | definizione originale |
| 1 | v10 | 15278 | (chiama _apriDettaglioPr) | Nel dettaglio: «Serve a quale meta?» (si salva subito)  — usa: `disegnaDetMeta`, `ciclo` |
| 2 | v11 | 17183 | (chiama _apriDettaglioV11) | il tasto c'è sempre: aperte, fatte, in Un giorno — usa: `$`, `ciclo` |
| 3 | v19 | 18245 | (chiama _apriDettaglioV19) | nel dettaglio: che tipo è, l'ultima mail e i tasti per aprire le mail in Gmail. — usa: `ciclo`, `$`, `daPosta`, `esc`, `linkMail` |
| 4 | v27 | 19734 | (chiama _apriDettaglioV27) | In Dettagli: da dove nasce (anche per quelle create con la versione vecchia) — usa: `$`, `v27Origine`, `ciclo`, `escHtml` |

### disegnaFoglioEvento

Definita a riga 13569 (v9) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 13569 | base | definizione originale |
| 1 | v11 | 17084 | (chiama _disegnaFoglioEventoV11) | --- il foglio dell'appuntamento: nascondi / togli --- — usa: `eventoPerId`, `$`, `eFiglie`, `riga`, `esc` |
| 2 | v15 | 17829 | **sostituisce** | il foglio dell'appuntamento, rifatto — usa: `eventoPerId`, `$`, `eventoSpuntabile`, `eventoFatto`, `escHtml` |
| 3 | v24 | 18695 | (chiama _disegnaFoglioEventoV24) | il foglio dell'appuntamento: «È con altre persone» / «È tempo mio» (vale per tutta la serie) — usa: `eventoPerId`, `$`, `eFiglie`, `v24ConAltri`, `v24SceltoAMano` |
| 4 | v26 | 19007 | (chiama _disegnaFoglioEventoV26) | il foglio dell'appuntamento: «Non si sposta» — usa: `eventoPerId`, `$`, `v26EventoFisso`, `esc` |

### htmlDaPianificareLista

Definita a riga 12163 (v6) · 4 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v6 | 12163 | base | definizione originale |
| 1 | v24 | 18753 | (chiama _htmlDaPianificareListaV24) | Da pianificare: le Subito tutte, poi poche Importanti; il resto sotto «Altre N» — usa: `daPianificareFiltrate`, `computeEffectiveQ`, `riga`, `oggiLocale` |
| 2 | v45 | 21175 | (chiama _listaV45) | le Subito rimaste indietro, pronte da trascinare in un giorno nuovo. — usa: `v45SubitoIndietro`, `riga`, `oggiLocale` |
| 3 | v47 | 21274 | (chiama _listaV47) | la colonna Da pianificare: in testa tutte le rimaste indietro (sostituisce il gruppo delle sole Subito della v45) — usa: `v47Indietro`, `computeEffectiveQ`, `riga`, `oggiLocale` |
| 4 | v49 | 21588 | (chiama _listaV49) | il bollino «N rimaste indietro» e il gruppo in Da pianificare aprono Smaltisci |

### azioneFatto

Definita a riga 7025 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7025 | base | definizione originale |
| 1 | v4 | 10273 | (chiama _azioneFattoBase) | La logica di «Fatto» resta quella: qui si aggiunge solo il «le tue 3 sono fatte». — usa: `focusAperte`, `showToast` |
| 2 | v4 | 10281 | (chiama _azioneFattoV3) | v4: chiudere una cosa bloccata in agenda aggiorna l'evento; l'ultimo passo fatto chiede di chiudere la cosa intera. — usa: `ciclo`, `chiudiBlocco`, `controllaMadre`, `$`, `disegnaPassi` |
| 3 | v5 | 11017 | (chiama _azioneFattoV4) | _(nessun commento; sezione: v5 · DOPO UNA «SUBITO»: cosa l'ha generata? (al massimo una volta al giorno per area))_ — usa: `ciclo`, `isGiornaliero`, `computeEffectiveQ`, `chiediOrigineSubito` |

### moveCicloInAgenda

Definita a riga 5282 (v1) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 5282 | base | definizione originale |
| 1 | v2 | 10309 | (chiama _moveCicloInAgendaBase) | Spostare una riga nell'agenda sposta anche la sua riga nel piano della settimana. — usa: `itemDelPiano`, `render` |
| 2 | v5 | 10933 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| 3 | v6 | 11870 | (chiama _moveCicloV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `ciclo`, `siRipete`, `chiediSerie`, `conProtezione`, `spostaSerie` |

### _handleGcalToken

Definita a riga 4694 (v1) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 4694 | base | definizione originale |
| 1 | v2 | 10329 | (chiama _handleGcalTokenBase) | Dopo il collegamento a Google Calendar: carica gli appuntamenti della settimana. — usa: `caricaEventi`, `render`, `riconciliaCalendar` |
| 2 | v5 | 11694 | (chiama _handleGcalTokenV2) | Dopo il collegamento a Google Calendar: calendario di scrittura, promemoria, appuntamenti che sembrano cicli — usa: `isGcalTokenValid`, `avvioCalendarV5` |
| 3 | v10 | 14952 | (chiama _handleGcalTokenAgg) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `aggiornaEventiAperti` |

### caricaEventi

Definita a riga 6907 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6907 | base | definizione originale |
| 1 | v5 | 10576 | **sostituisce** | _(nessun commento; sezione: v5 · GOOGLE CALENDAR: due calendari letti (Lavoro, Privato), uno scritto)_ — usa: `settKey`, `isGcalTokenValid`, `getWeekStart`, `leggiEventi`, `render` |
| 2 | v7 | 12676 | (chiama _caricaEventiV6) | si rilegge da Google senza svuotare: fino alla risposta restano quelli della copia — usa: `settKey`, `isGcalTokenValid`, `salvaCacheEventi`, `settimaneDaTenere` |
| 3 | v10 | 14926 | **sostituisce** | a token scaduto durante la lettura Google non ha risposto davvero: si tiene quello che c'è — usa: `settKey`, `isGcalTokenValid`, `rileggiSettimana` |

### ensureGcalCalendar

Definita a riga 4843 (v1) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 4843 | base | definizione originale |
| 1 | v5 | 10612 | **sostituisce** | poi per nome, e si crea solo se non ne esiste nessuno. — usa: `isGcalTokenValid`, `calScelto`, `gcalFetch`, `saveGcalTokenToDB` |
| 2 | v10 | 13989 | **sostituisce** | Calendario di scrittura: quello scelto se esiste ancora, altrimenti Lavoro. Mai creato. — usa: `isGcalTokenValid`, `calScelto`, `calendariScrivibili`, `lsScrivi`, `saveGcalTokenToDB` |
| 3 | v13 | 17641 | (chiama _ensureGcalCalendarV13) | --- calendario della cosa: personali sul Privato, se l'account può scriverci --- — usa: `verificaCalPrivato` |

### chiudiBlocco

Definita a riga 10112 (v4) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 10112 | base | definizione originale |
| 1 | v5 | 10969 | (chiama _chiudiBloccoV4) | Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera. — usa: `bloccoEsterno` |
| 2 | v9 | 13733 | (chiama _chiudiBloccoV9) | chiusa: l'avviso si cancella sempre (il blocco di «Blocca in agenda» fa come prima) — usa: `isGcalTokenValid`, `ensureGcalCalendar`, `eAvviso`, `eventoDellApp`, `togliBlocco` |
| 3 | v10 | 14050 | **sostituisce** | chiusa: avviso → cancellato; blocco futuro → cancellato; blocco passato → «✓» davanti al titolo. Solo eventi dell'app. — usa: `bloccoEsterno`, `isGcalTokenValid`, `ensureGcalCalendar`, `eventoDellApp`, `evDellApp` |

### aggiornaTutto

Definita a riga 7751 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7751 | base | definizione originale |
| 1 | v5 | 11129 | (chiama _aggiornaTuttoV4) | 7 giorni fa: esisteva, non era ancora chiusa (updated_at di una chiusa ≈ quando è stata chiusa) e non era in Un giorno — usa: `$`, `modoSemplice`, `htmlAperte` |
| 2 | v25 | 18846 | (chiama _aggiornaTuttoV25) | _(nessun commento; sezione: v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE N)_ — usa: `modoSemplice`, `$`, `nFiltri`, `cicliFiltrati`, `vedi` |
| 3 | v25 | 18870 | (chiama _aggiornaTuttoV25b) | l'armadio usa tutta la larghezza, come la board della settimana — usa: `$`, `v25ArmadioAttivo`, `boardAttiva` |

### openBpReview

Definita a riga 7963 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7963 | base | definizione originale |
| 1 | v5 | 11139 | (chiama _openBpReviewV4) | ══════════════════════════════════════════════════════════════ v5 · CHIUDI LA SETTIMANA: 0. Riporta il foglio · 1. quello che è rimasto · 2. com'è andata ══════════════════════════════════════════════════════════════ — usa: `disegnaReview` |
| 2 | v10 | 15941 | (chiama _openBpReviewPr) | Chiudi la settimana: tempo per il futuro, e «Cosa ti ha tolto la spinta?» (principio 11)  — usa: `caricaRinviate`, `disegnaReview`, `caricaSpintePassate` |
| 3 | v10 | 16615 | (chiama _openBpReviewSn) | i motivi nuovi stanno anche nel passo dettagliato (prima di «Altro…») — usa: `disegnaReview` |

### disegnaReview

Definita a riga 7971 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7971 | base | definizione originale |
| 1 | v5 | 11216 | (chiama _disegnaReviewV4) | _(nessun commento; sezione: v5 · CHIUDI LA SETTIMANA: 0. Riporta il foglio · 1. quello che è rimasto · 2. com'è andata)_ — usa: `disegnaRiporta`, `$`, `revStatQ2` |
| 2 | v10 | 15991 | (chiama _disegnaReviewPr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `$`, `htmlFuturo`, `quotaSettimana`, `htmlSpinta` |
| 3 | v10 | 16623 | (chiama _disegnaReviewSn) | i motivi nuovi stanno anche nel passo dettagliato (prima di «Altro…») — usa: `$`, `disegnaChiudiSnella` |

### render

Definita a riga 6703 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6703 | base | definizione originale |
| 1 | v6 | 12277 | (chiama _renderV9) | il disegno rimandato si fa al rilascio. |
| 2 | v10 | 14879 | (chiama _renderVista) | dopo ogni disegno: Oggi non deve restare vuota — usa: `controllaOggiVuota` |
| 3 | v18 | 18177 | (chiama _renderV18) | il cestino dentro la riga: lo aggiungo dopo ogni disegno (passandoci sopra sul computer, scorrendo sul telefono) — usa: `cestiniEventi` |

### aggiungiFrasi

Definita a riga 13008 (v9) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 13008 | base | definizione originale |
| 1 | v9 | 13843 | (chiama _aggiungiFrasiV9) | dopo il salvataggio: un avviso per ogni cosa con giorno e ora e la spunta attiva — usa: `creaAvviso` |
| 2 | v10 | 14499 | (chiama _aggiungiFrasiDopp) | Quando aggiungi («+», campo del telefono, Ricordami): prima di salvare, una domanda per ogni doppione  — usa: `decidiDoppioni`, `creaPassoDi`, `flipDone`, `creaCosaDaEvento`, `showToast` |
| 3 | v10 | 16408 | (chiama _aggiungiFrasiDopp) | Esegue fn (che legge state.ctx prima di qualsiasi await) con il contesto ctx, poi rimette quello in vista. — usa: `doppioneForte`, `conContesto`, `imparaCtx`, `render`, `dopoIlSalvataggio` |

### showToast

Definita a riga 6578 (v2) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6578 | base | definizione originale |
| 1 | v10 | 16396 | (chiama _showToastSn) | Salvare: subito, ognuna nel suo contesto; poi i doppioni e «Vai a Personale»  |
| 2 | v14 | 17667 | (chiama _showToastV14) | · Fatte: tutte le cose chiuse in un posto, con cerca e Riapri (da Altro e da Cose aperte) ══════════════════════════════════════════════════════════════ messaggi con più tasti e una durata scelta — usa: `$`, `render` |
| 3 | v48 | 21387 | (chiama _st) | i messaggi verdi senza «Annulla» degli spostamenti si tacciono: il messaggio con «Annulla» lo dà v48 |

### eventoDa

Definita a riga 10510 (v5) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 10510 | base | definizione originale |
| 1 | v11 | 17015 | (chiama _eventoDaV11) | --- eventi delle figlie --- — usa: `titoloSenzaFiglie` |
| 2 | v24 | 18630 | (chiama _eventoDaV24) | · Da pianificare: Subito tutte, poi poche Importanti e «Altre N» |
| 3 | v29 | 19818 | (chiama _eventoDaV29) | --- gli eventi sanno chi è esterno --- — usa: `unici` |

### colonnaGiorno

Definita a riga 12187 (v6) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v6 | 12187 | base | definizione originale |
| 1 | v21 | 18340 | (chiama _colonnaGiornoV21) | board (≥ 1100 px) — usa: `v21Tpl`, `v21InTesta`, `v21BtnStampa` |
| 2 | v24 | 18738 | (chiama _colonnaGiornoV24) | le ore del giorno: con altri e tue (eventi con un orario; quelli di tutto il giorno a parte) — usa: `v24OreGiorno`, `dataDelGiorno` |
| 3 | v26 | 18971 | (chiama _colonnaGiornoV26) | nei giorni: in cima «Non si sposta», poi il resto — usa: `v21Tpl`, `v26Raggruppa` |

### caricaEventiNascosti

Definita a riga 17027 (v11) · 3 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v11 | 17027 | base | definizione originale |
| 1 | v24 | 18623 | (chiama _caricaEventiNascostiV24) | · Da pianificare: Subito tutte, poi poche Importanti e «Altre N» — usa: `caricaEventiTipo` |
| 2 | v26 | 19639 | (chiama _caricaEventiNascostiV26) | --- caricamento --- — usa: `v26CaricaFissi`, `v26CaricaObiettivi` |
| 3 | v29.1 | 20201 | (chiama _caricaEventiNascostiV29) | --- avvio: con le altre tabelle degli appuntamenti --- — usa: `v29Carica`, `v29CaricaSettimane` |

### bpwRenderStep2

Definita a riga 6162 (v1) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 6162 | base | definizione originale |
| 1 | v2 | 10321 | (chiama _bpwRenderStep2Base) | Nel wizard, accanto a ogni giorno, il tempo già preso dagli appuntamenti. — usa: `decoraWizard`, `bpwChipGiorni` |
| 2 | v10 | 15454 | (chiama _bpwRenderStep2Pr) | Mete nel piano della settimana: quante Importanti per meta, e quelle ferme da 4 settimane — usa: `disegnaFuturoWizard` |

### openBpWizard

Definita a riga 5917 (v1) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 5917 | base | definizione originale |
| 1 | v5 | 10679 | (chiama _openBpWizardV4) | Quando arrivano gli appuntamenti, i cuscinetti automatici ancora da salvare si rimettono negli spazi veri. — usa: `bpwConEventi` |
| 2 | v10 | 16802 | (chiama _openBpWizardSn) | un cuscinetto al giorno (quello del pomeriggio, se c'è): gli altri automatici si tolgono — usa: `$`, `bpwModifica`, `closeBpWizard`, `lsLeggi`, `caricaEventi` |

### azioneDomani

Definita a riga 7103 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7103 | base | definizione originale |
| 1 | v5 | 10930 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| 2 | v6 | 11857 | (chiama _azioneDomaniV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `ciclo`, `siRipete`, `parseISODate`, `chiediSerie`, `conProtezione` |

### impostaGiorno

Definita a riga 9184 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 9184 | base | definizione originale |
| 1 | v5 | 10932 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| 2 | v6 | 11864 | (chiama _impostaGiornoV5) | _(nessun commento; sezione: v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,)_ — usa: `ciclo`, `siRipete`, `chiediSerie`, `conProtezione`, `spostaSerie` |

### togliBlocco

Definita a riga 10045 (v4) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 10045 | base | definizione originale |
| 1 | v5 | 10959 | (chiama _togliBloccoV4) | Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera. — usa: `bloccoEsterno`, `patchCiclo`, `render`, `showToast` |
| 2 | v10 | 14041 | (chiama _togliBloccoV10) | togli: un evento che non è dell'app non si cancella, si scollega soltanto — usa: `patchCiclo`, `render`, `showToast` |

### aggiornaBlocco

Definita a riga 10101 (v4) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 10101 | base | definizione originale |
| 1 | v5 | 10967 | (chiama _aggiornaBloccoV4) | Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera. — usa: `bloccoEsterno`, `ciclo` |
| 2 | v9 | 13715 | (chiama _aggiornaBloccoV9) | spostata: l'avviso segue la cosa (senza ora → si toglie). Per gli altri eventi resta il comportamento di prima. — usa: `ciclo`, `bloccoEsterno`, `isGcalTokenValid`, `slotAvviso`, `firmaAvviso` |

### revMotiviConteggio

Definita a riga 10198 (v4) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 10198 | base | definizione originale |
| 1 | v5 | 11224 | (chiama _revMotiviConteggioV4) | I conteggi della settimana (Q2 spostate per motivo, deleghe tornate) restano in motivi anche alla chiusura. |
| 2 | v10 | 16011 | (chiama _revMotiviConteggioPr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ |

### disegnaRapido

Definita a riga 9451 (v3) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v3 | 9451 | base | definizione originale |
| 1 | v6 | 11794 | (chiama _disegnaRapidoV5) | «+ Ciclo» di una colonna: il foglio rapido con il giorno già scelto — usa: `$`, `fmtGiorno`, `parseISODate` |
| 2 | v9 | 12978 | (chiama _disegnaRapidoV8) | una correzione nel riepilogo: vale finché la riga del campo resta uguale — usa: `disegnaAnteprima` |

### aggiungiRighe

Definita a riga 9482 (v3) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v3 | 9482 | base | definizione originale |
| 1 | v6 | 11801 | (chiama _aggiungiRigheV5) | «+ Ciclo» di una colonna: il foglio rapido con il giorno già scelto — usa: `inSilenzio`, `pianificaInData`, `ciclo`, `parseISODate`, `render` |
| 2 | v10 | 16554 | (chiama _aggiungiRigheSn) | 3 · Il contesto anche nelle altre strade: righe, foglio riportato, Plaud (per riga) aggiungiRighe legge state.ctx subito: ogni gruppo di righe con il suo contesto — usa: `indovinaContesto`, `conContesto` |

### segnaStampato

Definita a riga 10369 (v5) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 10369 | base | definizione originale |
| 1 | v6 | 12616 | (chiama _segnaStampatoV5) | la checklist si aggiorna con i dati: dopo la chiusura, l'invio, la stampa, l'esercizio Q2 — usa: `render` |
| 2 | v12 | 17389 | (chiama _segnaStampatoV12) | _(nessun commento; sezione: v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare)_ — usa: `segnaNelDb` |

### patchCiclo

Definita a riga 6968 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 6968 | base | definizione originale |
| 1 | v9 | 13752 | (chiama _patchCicloV9) | Ogni spostamento passa da patchCiclo o upsertOverride: dopo un attimo l'evento si allinea (una volta sola) — usa: `seguiCosa` |
| 2 | v30 | 20340 | (chiama _patchCicloV30) | basta toccarla (spostarla, cambiarla, chiuderla) e non è più «da rivedere» — usa: `ciclo` |

### flipDone

Definita a riga 3810 (v1) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v1 | 3810 | base | definizione originale |
| 1 | v9 | 13765 | (chiama _flipDoneV9) | tutte le chiusure passano da flipDone — usa: `ciclo`, `chiudiBlocco` |
| 2 | v42 | 20978 | (chiama _flipV42) | (3) chiusa → via anche dal calendario — usa: `ciclo`, `v42TogliPromemoria` |

### disegnaRiordina

Definita a riga 12382 (v6) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v6 | 12382 | base | definizione originale |
| 1 | v9 | 13886 | (chiama _disegnaRiordinaV9) | _(nessun commento; sezione: v9 · OGGI SUL TELEFONO: «Rimaste indietro» diventa una riga «N indietro · Sistema»)_ — usa: `$`, `recRimasta`, `vuoto`, `ciclo`, `carryData` |
| 2 | v10 | 15307 | (chiama _disegnaRiordinaPr) | Riordina: un'Importante ti avvicina a una meta? Se no: Delega o Lascia stare (dire no)  — usa: `ciclo`, `$`, `metaDi`, `escHtml`, `corta` |

### corpoEvento

Definita a riga 10023 (v4) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v4 | 10023 | base | definizione originale |
| 1 | v10 | 14030 | **sostituisce** | Gli eventi dell'app: titolo «16.45 - titolo», popup all'ora e 10 minuti prima, link all'app, proprietà cicli_aperti — usa: `titoloAvviso`, `toISODate`, `hhmm` |
| 2 | v10 | 16949 | (chiama _corpoEventoSn) | Attiva: il piano si salva con bpAttiva (come prima); poi foglio o invio al coach, e Calendar se spuntato |

### eventoInElenco

Definita a riga 13584 (v9) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 13584 | base | definizione originale |
| 1 | v10 | 14150 | **sostituisce** | già tra le cose da fare: collegata a questo evento, oppure una cosa aperta uguale o molto simile (vedi DOPPIONI) — usa: `eventoPerId`, `cosaDiEvento`, `closeModal`, `apriDettaglio`, `upsertCiclo` |
| 2 | v10 | 14554 | (chiama _eventoInElencoDopp) | «È una cosa da fare»: già aperta → il dettaglio (come prima, ora anche se è scritta un po' diversa); fatta da poco → riapro o nuova  — usa: `eventoPerId`, `cosaDiEvento`, `trovaDoppione`, `chiediDoppione`, `flipDone` |

### apriFoglioEvento

Definita a riga 13564 (v9) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 13564 | base | definizione originale |
| 1 | v10 | 14231 | (chiama _apriFoglioEventoDalCal) | mentre il foglio aspetta la risposta: la X vale «No, lascialo», il tocco fuori non chiude |
| 2 | v15 | 17869 | (chiama _apriFoglioEventoV15) | _(nessun commento; sezione: v15 · 28/10 · APPUNTAMENTI: si spuntano tutti, anche quelli di tutto il giorno, e si chiudono con un feedback)_ |

### voceAnteprimaPlaud

Definita a riga 13220 (v8) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v8 | 13220 | base | definizione originale |
| 1 | v10 | 14547 | (chiama _voceAnteprimaPlaudDopp) | Plaud: le cose che ci sono già partono senza spunta, con «c'è già» (si possono riattivare)  — usa: `etichettaDopp`, `escHtml`, `testoDopp` |
| 2 | v10 | 16587 | (chiama _voceAnteprimaPlaudSn) | Plaud: la madre prende il contesto della riunione; ogni passo il suo (si cambia con l'etichetta) — usa: `ctxPlaud`, `nomeCtx` |

### vistaAltro

Definita a riga 7836 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7836 | base | definizione originale |
| 1 | v10 | 14647 | (chiama _vistaAltroDopp) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `vistaDoppioni`, `gruppiAperti`, `riga`, `plurale` |
| 2 | v10 | 16022 | (chiama _vistaAltroPr) | ══════════════════════════════════════════════════════════════ ALTRO: «Le mie mete» e «Da rendere specifiche» · GUIDA · AVVIO ══════════════════════════════════════════════════════════════ — usa: `vistaMete`, `vistaSpecifiche`, `meteTutte`, `daRendereSpecifiche`, `plurale` |

### vistaImpostazioni

Definita a riga 7884 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7884 | base | definizione originale |
| 1 | v10 | 15001 | (chiama _vistaImpostazioniErr) | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `sezioneErrori` |
| 2 | v26 | 19608 | (chiama _vistaImpostazioniV26) | via «Assegna l'area con Claude»: la sezione la propone già l'app — usa: `v21Tpl`, `esc`, `aree`, `v26RitmoAcceso` |

### rigaDaVoce

Definita a riga 12998 (v9) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 12998 | base | definizione originale |
| 1 | v10 | 15563 | (chiama _rigaDaVocePr) | la durata di 5 minuti la rende una Rapida (≤ 15 min, come prima) — usa: `riga` |
| 2 | v14 | 17710 | (chiama _rigaDaVoceV14) | _(nessun commento; sezione: v14 · 28/10 · FATTA = SPARISCE)_ — usa: `riga` |

### bannerCicliCal

Definita a riga 10837 (v5) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 10837 | base | definizione originale |
| 1 | v10 | 15894 | (chiama _bannerCicliCalPr) | in Oggi: sopra «Da controllare» (o tra i banner); in Tutto → Persone: sotto il nome — usa: `daControllare`, `bannerSera`, `cardMete`, `cardDeleghe` |
| 2 | v42 | 20952 | (chiama _bannerV42) | (2) il banner di Oggi dice la cosa giusta quando ci sono promemoria passati |

### eventoSpuntabile

Definita a riga 13499 (v9) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v9 | 13499 | base | definizione originale |
| 1 | v11 | 17065 | (chiama _eventoSpuntabileV11) | dove si vedono gli appuntamenti: niente nascosti, niente figlie (quelle hanno la loro riga in Oggi) — usa: `eFiglie`, `eNascosto` |
| 2 | v15 | 17773 | **sostituisce** | · «Non è mio» e «Cancella da Google Calendar» sotto «Altro» — usa: `multiGiorno`, `eFiglie`, `eNascosto` |

### vistaFatte

Definita a riga 7853 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7853 | base | definizione originale |
| 1 | v14 | 17726 | **sostituisce** | Fatte: tutte le cose chiuse, con cerca e Riapri — usa: `normTitolo`, `vedi`, `indietro`, `btnAiuto`, `fatteSettimane` |
| 2 | v15 | 17873 | (chiama _vistaFatteV15) | Fatte: anche gli appuntamenti chiusi, con il feedback — usa: `normTitolo`, `escHtml`, `fmtGgMm` |

### vistaTutto

Definita a riga 7736 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7736 | base | definizione originale |
| 1 | v14 | 17760 | (chiama _vistaTuttoV14) | in Cose aperte: il passaggio alle Fatte — usa: `vedi` |
| 2 | v25 | 18838 | (chiama _vistaTuttoV25) | _(nessun commento; sezione: v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE N)_ — usa: `modoSemplice` |

### apriMenu

Definita a riga 7426 (v2) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v2 | 7426 | base | definizione originale |
| 1 | v26 | 19036 | (chiama _apriMenuV26) | il menu ⋯ di una cosa: «Non si sposta» — usa: `ciclo`, `$` |
| 2 | v37 | 20730 | (chiama _apriMenuV37) | il menu è cresciuto: se esce sotto, va sopra — usa: `ciclo`, `$`, `v37Pianificata`, `siRipete`, `isGiornaliero` |

### v25RitmoCard

Definita a riga 18783 (v25) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v25 | 18783 | base | definizione originale |
| 1 | v26 | 19471 | **sostituisce** | --- Oggi: «Adesso tocca a…» in una riga, «Prima di iniziare», la sera «Chiudi la giornata» --- — usa: `v26RitmoAcceso`, `v25Momento`, `toISODate`, `giornoIdxDi`, `oggiData` |
| 2 | v31 | 20460 | **sostituisce** | «Adesso» prende il posto del vecchio riquadro «Adesso tocca a…» e ne porta dentro il suggerimento — usa: `v31Adesso`, `v31Giornata`, `v31Obiettivi` |

### cercaCicliInCalendario

Definita a riga 11242 (v5) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v5 | 11242 | base | definizione originale |
| 1 | v30 | 20243 | **sostituisce** | v42: niente più trasformazione silenziosa: un promemoria passato senza risposta resta una domanda («L'hai fatta?») — usa: `isGcalTokenValid`, `bpSettimanaCorrente`, `parseISODate`, `oggiLocale`, `caricaEventi` |
| 2 | v41 | 20914 | (chiama _cercaV41) | _(nessun commento; sezione: v41 · 10/11 — «mi ritrovo cose che ho già chiuso»)_ — usa: `v41LeggiScelte`, `v41SpingiScelte` |

### v26DisegnaChiudi

Definita a riga 19499 (v26) · 2 strati

| # | Versione | Riga | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| 0 | v26 | 19499 | base | definizione originale |
| 1 | v30 | 20305 | (chiama _v26DisegnaChiudiV30) | la sera, in «Chiudi la giornata» — usa: `$` |
| 2 | v42 | 20996 | (chiama _chiudiV42) | (4) «È già fatta?»: aperte molto simili a una chiusa negli ultimi 7 giorni — usa: `$`, `v42GiaFatte`, `escHtml`, `esc` |

## 2. Funzioni avvolte una volta sola

| Funzione | Base | Strato | Tipo | Cosa aggiunge |
|---|---|---|---|---|
| `renderCatOptions` | v1 · 4131 | v2 · 10297 | (chiama _renderCatOptionsBase) | v2 · AGGANCI ALLA LOGICA E AVVIO ══════════════════════════════════════════════════════════════ Il select categoria mostra solo i nomi e, in fondo, «+ Nuova categoria». — usa: `$`, `catNome` |
| `bpwAggiungiCusc` | v4 · 9790 | v5 · 10663 | **sostituisce** | «+ Cuscinetto a metà / fine giornata» e i cuscinetti automatici: nello spazio libero più lungo di quella mezza giornata. — usa: `postiCuscinetto`, `bpDataGiorno`, `occupatiWizard`, `minDi`, `bpwRenderStep2` |
| `bpwConEventi` | v2 · 8085 | v5 · 10684 | **sostituisce** | Quando arrivano gli appuntamenti, i cuscinetti automatici ancora da salvare si rimettono negli spazi veri. — usa: `caricaEventi`, `$`, `isGcalTokenValid`, `bpwRipiazzaAuto`, `bpwRenderStep2` |
| `bpwBloccoGiorno` | v2 · 9112 | v5 · 10693 | (chiama _bpwBloccoGiornoV4) | Quando arrivano gli appuntamenti, i cuscinetti automatici ancora da salvare si rimettono negli spazi veri. — usa: `giornataPiena`, `bpDataGiorno`, `occupatiWizard` |
| `quandoPiano` | v3 · 9610 | v5 · 10763 | **sostituisce** | ══════════════════════════════════════════════════════════════ v5 · BANNER: è ora del Business Plan · incontro con il coach · esercizio Q2 · appuntamenti che sembrano cicli ═══════════════════════════════════════════════ — usa: `lsLeggi` |
| `bannerPiano` | v3 · 9630 | v5 · 10783 | **sostituisce** | Il prossimo incontro con il coach entro 48 ore (dagli appuntamenti già letti) — usa: `lsLeggi`, `oggiLocale`, `bannerCoach`, `inFinestraPiano`, `caricaPianoProssima` |
| `inviaPianoProssima` | v4 · 10174 | v5 · 10812 | **sostituisce** | Porta Pianifica sulla settimana (w) e poi stampa o invia — usa: `vaiSettimanaE`, `settProssima`, `apriInvia` |
| `bpAttiva` | v1 · 6360 | v5 · 10858 | (chiama _bpAttivaV4) | _(nessun commento; sezione: v5 · FINE DEL WIZARD: «Il piano è pronto» con Stampa il foglio e Invia al coach)_ — usa: `$`, `apriPronto` |
| `bpStampaPdf` | v5 · 8650 | v5 · 10863 | (chiama _bpStampaPdfV4) | _(nessun commento; sezione: v5 · FINE DEL WIZARD: «Il piano è pronto» con Stampa il foglio e Invia al coach)_ — usa: `segnaStampato`, `render`, `$`, `disegnaPronto` |
| `azioneQuando` | v2 · 7140 | v5 · 10931 | (decoratore proteggi()) | _(nessun commento; sezione: v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta))_ — usa: `proteggi` |
| `azioneLascia` | v2 · 7149 | v5 · 10936 | (chiama _azioneLasciaV4) | Lascia stare toglie anche il blocco in agenda: non è più un impegno con te stesso. — usa: `proteggi`, `ciclo`, `bloccoEsterno`, `isGcalTokenValid`, `togliBlocco` |
| `creaBlocco` | v4 · 10036 | v5 · 10950 | (chiama _creaBloccoV4) | Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera. — usa: `ciclo`, `computeEffectiveQ`, `patchCiclo`, `render` |
| `infoPassi` | v4 · 9908 | v5 · 11031 | (chiama _infoPassiV4) | _(nessun commento; sezione: v5 · SVUOTA LA TESTA: una colonna per area, una riga = una cosa)_ — usa: `passiDi`, `eGenerica` |
| `sezionePiano` | v4 · 10246 | v5 · 11563 | (chiama _sezionePianoV4) | Email del coach + in copia (nella sezione v4 «Piano della settimana») — usa: `esc`, `emailCC` |
| `bpwCambiaCusc` | v4 · 9794 | v5 · 11591 | (chiama _bpwCambiaCuscV4) | v5 · AZIONI, CAMPI E AVVIO ══════════════════════════════════════════════════════════════ Un cuscinetto toccato a mano non si sposta più da solo. |
| `inviaPiano` | v4 · 10152 | v5 · 11594 | (chiama _inviaPianoV4) | Dopo l'invio, «Il piano è pronto» mostra la data. — usa: `$`, `disegnaPronto` |
| `pianFondo` | v2 · 7696 | v6 · 12233 | (chiama _pianFondoV5) | sotto i 1100px resta la lista: in più la card del coach, sopra «Da piazzare» — usa: `cardCoach` |
| `salvaDelega` | v3 · 9418 | v6 · 12473 | (chiama _salvaDelegaV5) | la Delega passa dal suo foglio (a chi + quando controlli): quando è salvata, avanti — usa: `$`, `ciclo`, `rioConta`, `rioSalta` |
| `bannerCoach` | v5 · 10773 | v6 · 12599 | (chiama _bannerCoachV5) | Banner in Oggi: 48 ore prima dell'incontro, se una voce è ancora aperta — usa: `coachEvento`, `vociCoach`, `fmtGiorno`, `escHtml` |
| `disconnectGcal` | v1 · 4956 | v7 · 12691 | (chiama _disconnectGcalV6) | scollegando, la copia locale va via — usa: `lsScrivi`, `render` |
| `openPlaudModal` | v1 · 4283 | v8 · 13280 | (chiama _openPlaudModalV8) | _(nessun commento; sezione: v8 · IMPORT PLAUD: un'attività madre per la riunione, le cose da fare come passi)_ |
| `disegnaSpostaEvento` | v6 · 11933 | v9 · 13609 | (chiama _disegnaSpostaEventoV9) | Sposta un appuntamento di tutto il giorno: solo la data (niente ora né durata) — usa: `eventoPerId`, `serveScopeEventi`, `parseISODate`, `toISODate`, `isoWeekParts` |
| `confermaSpostaEvento` | v6 · 12022 | v9 · 13628 | (chiama _confermaSpostaEventoV9) | Sposta un appuntamento di tutto il giorno: solo la data (niente ora né durata) — usa: `eventoPerId`, `$`, `serveScopeEventi`, `oggiLocale`, `parseISODate` |
| `upsertOverride` | v2 · 7073 | v9 · 13758 | (chiama _upsertOverrideV9) | Ogni spostamento passa da patchCiclo o upsertOverride: dopo un attimo l'evento si allinea (una volta sola) — usa: `seguiCosa` |
| `salvaDalFoglio` | v2 · 7282 | v9 · 13773 | (chiama _salvaDalFoglioV9) | dettaglio: giorno e ora nuovi (o cambiati) e nessun evento → avviso — usa: `ciclo`, `chiaveSlot`, `slotAvviso`, `creaAvviso` |
| `confermaPianificazione` | v1 · 5499 | v9 · 13783 | (chiama _confermaPianificazioneV9) | dettaglio: giorno e ora nuovi (o cambiati) e nessun evento → avviso — usa: `ciclo`, `chiaveSlot`, `slotAvviso`, `creaAvviso` |
| `bloccoRimaste` | v2 · 8161 | v9 · 13864 | (chiama _bloccoRimasteV9) | che apre il riordino delle rimaste, una alla volta (le scelte sono quelle del blocco di prima). — usa: `schermoStretto`, `rimasteVisibili`, `carryNascosto` |
| `rioSalva` | v6 · 12348 | v9 · 13884 | (chiama _rioSalvaV9) | _(nessun commento; sezione: v9 · OGGI SUL TELEFONO: «Rimaste indietro» diventa una riga «N indietro · Sistema»)_ |
| `gcalFetch` | v1 · 4863 | v10 · 13954 | (chiama _gcalFetchV10) | ogni PATCH / PUT / DELETE su un evento esistente: prima si legge, e si va avanti solo se è dell'app — usa: `scriviSoloSeDellApp` |
| `loadGcalTokenFromDB` | v1 · 4810 | v10 · 14016 | (chiama _loadGcalTokenFromDBV10) | un id vecchio (localStorage gcal_cal_id o user_tokens.google_calendar_id) che non è quello di scrittura → Lavoro, subito — usa: `normalizzaCalendario` |
| `leggiEventi` | v5 · 10550 | v10 · 14067 | (chiama _leggiEventiV10) | In Oggi e nelle colonne: un evento dell'app collegato a una cosa non compare (si vede la cosa, con la sua ora) — usa: `collegatoACosa` |
| `sincronizzaPromemoria` | v5 · 10734 | v10 · 14107 | **sostituisce** | _(nessun commento; sezione: v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO)_ — usa: `isGcalTokenValid`, `ensureGcalCalendar`, `leggiJson`, `corpoPromemoriaV10`, `gcalFetch` |
| `closeModal` | v1 · 4116 | v10 · 14216 | (chiama _closeModalDalCal) | mentre il foglio aspetta la risposta: la X vale «No, lascialo», il tocco fuori non chiude — usa: `rispondiTogliEvento` |
| `closeModalOnBg` | v1 · 4122 | v10 · 14221 | (chiama _closeModalOnBgDalCal) | mentre il foglio aspetta la risposta: la X vale «No, lascialo», il tocco fuori non chiude |
| `preparaPlaud` | v8 · 13206 | v10 · 14542 | (chiama _preparaPlaudDopp) | Plaud: le cose che ci sono già partono senza spunta, con «c'è già» (si possono riattivare)  — usa: `trovaDoppione`, `forte` |
| `salvaCacheEventi` | v7 · 12659 | v10 · 14897 | (chiama _salvaCacheEventiAgg) | La copia locale si usa solo finché Google non risponde; se ha più di 12 ore la vista lo dice («dati di ieri»). — usa: `leggiJson`, `settimaneDaTenere` |
| `gruppiAperti` | v10 · 14570 | v10 · 15068 | **sostituisce** | una volta: le scelte già fatte su questo dispositivo vanno nella tabella — usa: `doppioniNo`, `gruppiDoppioni`, `coseAperteDopp`, `nomiNoti` |
| `apriNuovo` | v2 · 7230 | v10 · 15280 | (chiama _apriNuovoPr) | Nel dettaglio: «Serve a quale meta?» (si salva subito)  — usa: `$` |
| `navSettimana` | v2 · 7527 | v10 · 15464 | (chiama _navSettimanaPr) | In Settimana: una pillola compatta in testa, tocchi e vedi come lo calcolo — usa: `chipFuturo` |
| `testaBoard` | v6 · 12135 | v10 · 15466 | (chiama _testaBoardPr) | In Settimana: una pillola compatta in testa, tocchi e vedi come lo calcolo — usa: `chipFuturo` |
| `corpoPromemoriaV10` | v10 · 14084 | v10 · 15789 | (chiama _corpoPromemoriaPr) | Promemoria su Google Calendar: «18.45 - Piano di domani (5 minuti)», solo dal tasto  — usa: `toISODate`, `primoFerialeDa`, `calScelto`, `titoloAvviso` |
| `sezioneItime` | v5 · 11541 | v10 · 15801 | (chiama _sezioneItimePr) | Promemoria su Google Calendar: «18.45 - Piano di domani (5 minuti)», solo dal tasto  — usa: `leggiJson`, `isGcalTokenValid`, `escHtml`, `nomeCalScrittura` |
| `tuttoPersone` | v2 · 7814 | v10 · 15899 | (chiama _tuttoPersonePr) | in Oggi: sopra «Da controllare» (o tra i banner); in Tutto → Persone: sotto il nome — usa: `avvisiDeleghe`, `escHtml`, `testoAvvisoDelega`, `tastiDelega`, `chiudiDelega` |
| `rispondiConferma` | v4 · 9986 | v10 · 15913 | (chiama _rispondiConfermaPr) | «Riprendila io» e «Mi è tornata indietro»: prima una domanda (principio 10) |
| `offriFallaOraDopo` | v10 · 15644 | v10 · 16356 | **sostituisce** | «Ci vogliono pochi minuti? Falla ora» dopo il salvataggio: non più (resta il chip nella riga) |
| `unisciGruppo` | v10 · 14606 | v10 · 16496 | **sostituisce** | l'unione di Altro → Doppioni, per un elenco qualsiasi: tiene `tieniId`, chiude le altre come «unita a…» — usa: `gruppiAperti`, `unisciInsieme`, `render`, `showToast`, `annullaUnione` |
| `rigaNuova` | v3 · 9466 | v10 · 16568 | (chiama _rigaNuovaSn) | rigaNuova: titoli con un contesto già scelto (Plaud) o da indovinare (foglio riportato) — usa: `indovinaContesto` |
| `applicaRiporta` | v5 · 11180 | v10 · 16575 | (chiama _applicaRiportaSn) | rigaNuova: titoli con un contesto già scelto (Plaud) o da indovinare (foglio riportato) |
| `importaRiunione` | v8 · 13305 | v10 · 16593 | (chiama _importaRiunioneSn) | Plaud: la madre prende il contesto della riunione; ogni passo il suo (si cambia con l'etichetta) — usa: `ctxMadrePlaud`, `ctxPlaud`, `conContesto` |
| `bpSlotConfirm` | v1 · 6338 | v10 · 16944 | (chiama _bpSlotConfirmSn) | trascinata in un altro giorno: il primo buco libero che la contiene (o senza ora) — usa: `$`, `disegnaSn` |
| `apriPronto` | v5 · 10856 | v10 · 16947 | (chiama _apriProntoSn) | Attiva: il piano si salva con bpAttiva (come prima); poi foglio o invio al coach, e Calendar se spuntato |
| `routineDelGiorno` | v5 · 10590 | v11 · 17062 | (chiama _routineDelGiornoV11) | dove si vedono gli appuntamenti: niente nascosti, niente figlie (quelle hanno la loro riga in Oggi) — usa: `eNascosto` |
| `loadBattlePlan` | v1 · 5719 | v11 · 17141 | (chiama _loadBattlePlanV11) | --- Elimina una cosa, con Annulla --- |
| `azioneElimina` | v2 · 7166 | v11 · 17148 | **sostituisce** | la cosa e i suoi passi — usa: `ciclo`, `removeCiclo`, `render`, `showToast`, `conIPassi` |
| `apriRapidoCon` | v9 · 12981 | v12 · 17244 | **sostituisce** | --- 2. La bozza --- — usa: `apriRapido`, `$`, `bozzaScrivi`, `disegnaAnteprima` |
| `righeCampo` | v9 · 12858 | v12 · 17312 | (chiama _righeCampoV12) | _(nessun commento; sezione: v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare)_ — usa: `spezzaPensieri` |
| `interpretaFrase` | v8 · 12763 | v12 · 17329 | (chiama _interpretaFraseV12) | «Bologna - Tavoli - - Riccardo»: tolta la data, niente trattini doppi |
| `inviati` | v4 · 9744 | v12 · 17368 | (chiama _inviatiV12) | --- 4. Inviato e stampato anche nel database --- |
| `stampati` | v5 · 10367 | v12 · 17374 | (chiama _stampatiV12) | --- 4. Inviato e stampato anche nel database --- |
| `segnaInviato` | v4 · 9746 | v12 · 17387 | (chiama _segnaInviatoV12) | _(nessun commento; sezione: v12 · 26/10 · «Cosa hai in testa?» che non perde niente, e Oggi che dice prima cosa fare)_ — usa: `segnaNelDb` |
| `switchCtx` | v1 · 3843 | v13 · 17579 | **sostituisce** | --- il filtro in alto --- — usa: `render` |
| `rigaSceltaSn` | v10 · 16824 | v13 · 17609 | (chiama _rigaSceltaSnV13) | --- l'etichetta «Personale» --- — usa: `ciclo` |
| `notaCtx` | v10 · 16263 | v13 · 17616 | (chiama _notaCtxV13) | --- aggiungere: con «Tutto» niente «Sei in Lavoro: la metto in Personale» --- |
| `etichettaSalva` | v10 · 16271 | v13 · 17618 | (chiama _etichettaSalvaV13) | --- aggiungere: con «Tutto» niente «Sei in Lavoro: la metto in Personale» --- |
| `dopoIlSalvataggio` | v10 · 16428 | v13 · 17620 | (chiama _dopoIlSalvataggioV13) | --- aggiungere: con «Tutto» niente «Sei in Lavoro: la metto in Personale» --- |
| `segnaEvento` | v9 · 13511 | v15 · 17785 | (chiama _segnaEventoV15) | la spunta salva anche il titolo (per ritrovarla in Fatte) — usa: `eventoPerId` |
| `giorniVisibili` | v6 · 12204 | v21 · 18334 | (chiama _giorniVisibiliV21) | board (≥ 1100 px) — usa: `eSettimanaCorrente`, `v21Da` |
| `pianLargo` | v6 · 12207 | v21 · 18346 | (chiama _pianLargoV21) | board (≥ 1100 px) — usa: `eSettimanaCorrente`, `v21RigaPassati` |
| `pianSettimanaColonne` | v2 · 7610 | v21 · 18355 | (chiama _pianSettimanaColonneV21) | colonne (768–1100 px) — usa: `eSettimanaCorrente`, `v21Tpl`, `v21Da`, `v21InTesta`, `v21BtnStampa` |
| `pianSettimana` | v2 · 7578 | v21 · 18376 | (chiama _pianSettimanaV21) | telefono: i giorni da oggi in poi nella fila in alto — usa: `v21Da`, `v21Tpl`, `riga`, `v21RigaPassati`, `v21InTesta` |
| `rigaSpazio` | v6 · 12183 | v24 · 18744 | (chiama _rigaSpazioV24) | le ore del giorno: con altri e tue (eventi con un orario; quelli di tutto il giorno a parte) |
| `legendaColori` | v6 · 12116 | v24 · 18746 | (chiama _legendaColoriV24) | le ore del giorno: con altri e tue (eventi con un orario; quelli di tutto il giorno a parte) |
| `autoCategoria` | v1 · 4627 | v25 · 18894 | (chiama _autoCategoriaV25) | somiglianza con le cose già smistate: la sezione con più parole in comune — usa: `v25SuggerisciArea`, `showToast`, `apriDettaglio` |
| `orarioEvento` | v4 · 9770 | v26 · 18914 | **sostituisce** | --- «in giornata» al posto di «tutto il giorno» --- |
| `rispondiProteggi` | v5 · 10914 | v26 · 18984 | (chiama _rispondiProteggiV26) | conferma prima di spostare un appuntamento che non si sposta — usa: `$`, `closeModal`, `render`, `showToast` |
| `chiediSpostamento` | v5 · 10900 | v26 · 18994 | (chiama _chiediSpostamentoV26) | conferma prima di spostare un appuntamento che non si sposta — usa: `computeEffectiveQ`, `$` |
| `apriSpostaEvento` | v6 · 11923 | v26 · 19000 | (chiama _apriSpostaEventoV26) | conferma prima di spostare un appuntamento che non si sposta — usa: `eventoPerId`, `v26EventoFisso`, `protezione`, `v26ChiediEvento` |
| `apriWizard` | v2 · 8068 | v26 · 19131 | (chiama _apriWizardV26) | «Prepara la settimana»: primo passo gli obiettivi — usa: `bpSettimanaCorrente`, `v26ObDi`, `settKey`, `v26ApriObiettivi` |
| `testoInvio` | v4 · 10127 | v26 · 19139 | (chiama _testoInvioV26) | la mail a Leo — usa: `v26ObDi` |
| `stampaGiorno` | v21 · 18418 | v26 · 19419 | **sostituisce** | il tasto stampante di Oggi e dei giorni: il foglio nuovo — usa: `oggiData`, `dataDelGiorno`, `v26Stampa` |
| `v25Momento` | v25 · 18772 | v26 · 19464 | (chiama _v25MomentoV26) | --- Oggi: «Adesso tocca a…» in una riga, «Prima di iniziare», la sera «Chiudi la giornata» --- |
| `chiediOrigineSubito` | v5 · 10992 | v27 · 19685 | (chiama _chiediOrigineSubitoV27) | _(nessun commento; sezione: v27 · 3/11 · DOPO UNA «SUBITO»: DUE PASSI CHIARI)_ — usa: `$`, `v27DataBreve`, `v27DisegnaSubito` |
| `creaDaSubito` | v5 · 11003 | v27 · 19705 | **sostituisce** | _(nessun commento; sezione: v27 · 3/11 · DOPO UNA «SUBITO»: DUE PASSI CHIARI)_ — usa: `$`, `v27DataBreve`, `upsertCiclo`, `rigaNuova`, `closeModal` |
| `segnaleMia` | v10 · 16104 | v28 · 19772 | (chiama _segnaleMiaV28) | «Mia» dettata minuscola: «la cresima di mia», «vestito cresima mia» — usa: `testoCtx` |
| `disegnaCalCicli` | v5 · 11263 | v30 · 20288 | (chiama _disegnaCalCicliV30) | il foglio: per i promemoria passati «Già fatta · Mettila tra le cose da fare · Lascia stare» — usa: `oggiLocale`, `esc`, `$`, `escHtml`, `fmtGiorno` |
| `daPianificareFiltrate` | v6 · 12156 | v30 · 20317 | (chiama _daPianificareFiltrateV30) | --- «Da rivedere» in Da pianificare --- |
| `colonnaDaPianificare` | v6 · 12167 | v30 · 20323 | (chiama _colonnaDaPianificareV30) | --- «Da rivedere» in Da pianificare --- — usa: `v30DaRivedere` |
| `cardCoach` | v6 · 12587 | v31 · 20355 | **sostituisce** | Poi la giornata dalle 8 alle 18 (pieno/libero) e gli obiettivi della settimana. · Menu: Settimana → Pianifica, Cicli → Tutte. ══════════════════════════════════════════════════════════════ |
| `v22RigaCoach` | v22 · 18452 | v31 · 20356 | **sostituisce** | · Menu: Settimana → Pianifica, Cicli → Tutte. |
| `v31Ritmo` | v31 · 20395 | v32 · 20497 | (IIFE con orig) | · Pianifica: il titolo non è più coperto dai bottoni; «Piano in bozza» intero. — usa: `v25Momento` |
| `v31Giornata` | v31 · 20436 | v32 · 20500 | (IIFE con orig) | · Pianifica: il titolo non è più coperto dai bottoni; «Piano in bozza» intero. |
| `v31Obiettivi` | v31 · 20450 | v32 · 20503 | (IIFE con orig) | · Pianifica: il titolo non è più coperto dai bottoni; «Piano in bozza» intero. |
| `v26VistaGiorno` | v26 · 19165 | v40 · 20829 | (chiama _vgV40) | _(nessun commento; sezione: v40 · 10/11 — Pianifica › Giorno: a destra (sul telefono sotto la giornata) le Subito e le Importanti)_ — usa: `v40Box`, `dataDelGiorno` |
| `sceltaCalCiclo` | v5 · 11273 | v41 · 20920 | (chiama _sceltaV41) | _(nessun commento; sezione: v41 · 10/11 — «mi ritrovo cose che ho già chiuso»)_ — usa: `v41SpingiScelte` |
| `loadAll` | v1 · 3703 | v42 · 21012 | (chiama _loadV42) | (5) «Aggiornato alle…» — usa: `v42Etichetta` |
| `v40Candidate` | v40 · 20796 | v45 · 21184 | (chiama _candV45) | _(nessun commento; sezione: v45 · 17/11 — «se ho messo una Subito in un giorno e non l'ho chiusa, deve tornare nell'elenco»)_ — usa: `v47Indietro`, `v45SubitoIndietro`, `computeEffectiveQ`, `v45Da` |
| `v44Aggiorna` | v44 · 21076 | v47 · 21338 | (chiama _v44V47) | la barra della v44 sul computer non serve più: la testa resta già in vista — usa: `v44Barra` |
| `bordoSposta` | v6 · 12236 | v48 · 21394 | (chiama _bsV48) | i messaggi verdi senza «Annulla» degli spostamenti si tacciono: il messaggio con «Annulla» lo dà v48 — usa: `ciclo`, `siRipete`, `v48Foto`, `patchCiclo`, `showToast` |
| `openPianificaModal` | v1 · 5361 | v48 · 21446 | (chiama _openPfV48) | _(nessun commento; sezione: v48 · 19/11 · PIÙ PRATICA: «Annulla» anche sugli spostamenti, giorni con un tocco (ore libere), PDF nei colori)_ — usa: `v48Giorni` |
| `v49Lista` | v49 · 21472 | v50 · 21722 | (chiama _listaV50) | Smaltisci: Delega apre il suo foglio e, chiuso quello, si torna a Smaltisci |
| `v49Fai` | v49 · 21530 | v50 · 21724 | (chiama _faiV50) | Smaltisci: Delega apre il suo foglio e, chiuso quello, si torna a Smaltisci — usa: `v49Lista`, `closeModal`, `apriDelega`, `$`, `v50Riprendi` |
| `v49Annulla` | v49 · 21548 | v50 · 21751 | (chiama _annV50) | _(nessun commento; sezione: v50 · 19/11 — sfondo salvia; in Oggi ogni cosa è una scheda a sé (Subito / Importante / Delega si distinguono))_ — usa: `patchCiclo`, `v49Lista`, `render`, `showToast`, `v49Disegna` |

## 3. Strati che sostituiscono (codice morto dentro le catene)

Quando uno strato riscrive la funzione senza richiamare l'alias precedente, la definizione base e gli strati prima di lui non girano più — a meno che qualcuno chiami direttamente un alias vecchio (`_xBase(…)`). Sono candidati sicuri da togliere nel riordino, dopo aver verificato gli alias.

| Funzione | Strato che sostituisce | Strati resi morti sotto di lui |
|---|---|---|
| `caricaEventi` | v5 · riga 10576 | base |
| `eventiDelGiorno` | v5 · riga 10589 | base |
| `rigaEvento` | v5 · riga 10596 | base |
| `ensureGcalCalendar` | v5 · riga 10612 | base |
| `bpwAggiungiCusc` | v5 · riga 10663 | base |
| `bpwConEventi` | v5 · riga 10684 | base |
| `quandoPiano` | v5 · riga 10763 | base |
| `bannerPiano` | v5 · riga 10783 | base |
| `inviaPianoProssima` | v5 · riga 10812 | base |
| `salvaRapido` | v9 · riga 13041 | base |
| `salvaCattura` | v9 · riga 13060 | base |
| `rigaEvento` | v9 · riga 13538 | base + 1 strato |
| `ensureGcalCalendar` | v10 · riga 13989 | base + 1 strato |
| `corpoEvento` | v10 · riga 14030 | base |
| `chiudiBlocco` | v10 · riga 14050 | base + 2 strati |
| `sincronizzaPromemoria` | v10 · riga 14107 | base |
| `eventoInElenco` | v10 · riga 14150 | base |
| `caricaEventi` | v10 · riga 14926 | base + 2 strati |
| `gruppiAperti` | v10 · riga 15068 | base |
| `disegnaAnteprima` | v10 · riga 16276 | base + 3 strati |
| `disegnaAnteprimaCattura` | v10 · riga 16287 | base + 3 strati |
| `offriFallaOraDopo` | v10 · riga 16356 | base |
| `salvaCattura` | v10 · riga 16380 | base + 3 strati |
| `unisciGruppo` | v10 · riga 16496 | base |
| `azioneElimina` | v11 · riga 17148 | base |
| `apriRapidoCon` | v12 · riga 17244 | base |
| `switchCtx` | v13 · riga 17579 | base |
| `vistaFatte` | v14 · riga 17726 | base |
| `eventoSpuntabile` | v15 · riga 17773 | base + 1 strato |
| `disegnaFoglioEvento` | v15 · riga 17829 | base + 1 strato |
| `orarioEvento` | v26 · riga 18914 | base |
| `stampaGiorno` | v26 · riga 19419 | base |
| `v25RitmoCard` | v26 · riga 19471 | base |
| `creaDaSubito` | v27 · riga 19705 | base |
| `cercaCicliInCalendario` | v30 · riga 20243 | base |
| `cardCoach` | v31 · riga 20355 | base |
| `v22RigaCoach` | v31 · riga 20356 | base |
| `v25RitmoCard` | v31 · riga 20460 | base + 1 strato |

## 4. CSS sovrascritto

### 4.1 Le tavolozze (variabili `--…`)

I colori sono stati ridefiniti a ogni cambio di stile: `:root` in v1 (67, 98), v9 (1360), v26 (1912); poi `html:root` / `html[data-theme="light"]` in **v30 (2031, 2256), v43 (2335), v44.1 (2424)** e la versione scura `html:root[data-theme="dark"]` in v30 (2057, 2257), v43 (2358), v44.1 (2431). Vince l'ultima (v44.1 «Roby»), ritoccata in v50 (2605, sfondo salvia). Le tre tavolozze precedenti sono interamente sovrascritte: nel riordino resta **un solo** blocco di token chiaro + uno scuro.

### 4.2 Selettori definiti più volte

Stesso selettore nello stesso contesto (`@media` compreso). «Proprietà sovrascritte» = dichiarate in più di una delle regole (le altre si sommano).

| Selettore | Volte | Dove (versione@riga) | Proprietà sovrascritte | !important |
|---|---|---|---|---|
| `.spazio-riga` | 4 | v6@1258 v6@1259 v24@1889 v30@2276 | border, background |  |
| `.spazio-riga .item-title` | 4 | v6@1260 v6@1265 v24@1890 v30@2277 | color, font-weight |  |
| `body` | 3 | v1@185 v1@369 v1@370 | — |  |
| `.item.p-q1:not(.is-done) .item-row` | 3 | v1@472 v30@2143 v30@2259 | background |  |
| `.board .evt-riga.v24-mio` | 3 | v24@1883 v30@2265 v30@2273 | margin, border-radius, border, box-shadow |  |
| `html:root .board .evt-riga.v24-altri` | 3 | v43@2394 v47@2495 v49@2593 | background, box-shadow | 3 |
| `html:root .board .evt-riga.v24-mio` | 3 | v43@2400 v47@2495 v49@2596 | background, box-shadow | 3 |
| `@media (max-width: 767px) .v49-giorni` | 3 | v49@2553 v49@2558 v49@2559 | padding-left, padding-right |  |
| `html` | 2 | v1@184 v1@369 | — |  |
| `button` | 2 | v1@186 v1@187 | — |  |
| `.t-title` | 2 | v1@195 v30@2088 | font-weight, letter-spacing |  |
| `.btn-primary` | 2 | v1@205 v30@2092 | box-shadow |  |
| `.btn-primary:active` | 2 | v1@206 v30@2093 | transform |  |
| `.check-box` | 2 | v1@239 v30@2091 | border-radius, border |  |
| `.item-row` | 2 | v1@261 v1@471 | — |  |
| `.item-side` | 2 | v1@266 v1@475 | gap |  |
| `.nav button[aria-current="page"] .nav-ico` | 2 | v1@328 v30@2094 | background |  |
| `.sheet-head` | 2 | v1@339 v3@680 | align-items |  |
| `.logo` | 2 | v1@378 v30@2084 | font-family, font-size, letter-spacing, font-weight |  |
| `.logo span` | 2 | v1@379 v30@2086 | color |  |
| `.cattura` | 2 | v1@384 v8@760 | — |  |
| `.top` | 2 | v1@396 v13@1733 | — |  |
| `.top .seg` | 2 | v1@397 v1@399 | — |  |
| `.vh h1` | 2 | v1@437 v30@2087 | font-weight, letter-spacing |  |
| `.list-head` | 2 | v1@442 v30@2089 | font-size, line-height, font-weight, color |  |
| `.list-head .mono` | 2 | v1@444 v30@2090 | color, font-size |  |
| `.riga-link` | 2 | v1@456 v1@458 | — |  |
| `.cols .check` | 2 | v1@527 v1@528 | — |  |
| `.carry-giorni` | 2 | v1@561 v1@565 | — |  |
| `.legenda` | 2 | v3@652 v6@1219 | display, flex-wrap, gap, font-size, color |  |
| `.meta-tag` | 2 | v8@791 v9@1361 | color |  |
| `.guida-body ul` | 2 | v8@859 v8@860 | — |  |
| `.evt-cerchio` | 2 | v4@944 v9@1350 | display |  |
| `.bpw-sotto-h` | 2 | v4@996 v4@997 | color |  |
| `@media print .cattura` | 2 | v5@1213 v6@1337 | display | 1 |
| `.vh-board` | 2 | v6@1226 v22@1811 | — |  |
| `.board .evt-riga[draggable="true"]` | 2 | v6@1244 v6@1266 | — |  |
| `.spazio-riga .evt-ico` | 2 | v6@1265 v30@2277 | color |  |
| `.persona-avviso > .ti` | 2 | v9@1504 v9@1510 | — |  |
| `.sn-q` | 2 | v10@1532 v10@1533 | — |  |
| `.sn-vedi` | 2 | v10@1550 v10@1551 | color |  |
| `.sn-dett` | 2 | v10@1619 v10@1647 | — |  |
| `.v12-head span:first-child` | 2 | v12@1687 v30@2096 | letter-spacing, text-transform, font-size |  |
| `.evt-riga.evt-app.v24-altri` | 2 | v24@1878 v30@2268 | background, box-shadow |  |
| `.evt-riga.evt-app.v24-altri .item-title` | 2 | v24@1879 v30@2269 | color |  |
| `.evt-riga.evt-app.v24-mio` | 2 | v24@1880 v30@2265 | background, box-shadow |  |
| `.evt-riga.evt-app.v24-mio .evt-cerchio` | 2 | v24@1881 v30@2266 | — |  |
| `.spazio-riga .evt-ico .ti` | 2 | v24@1891 v30@2277 | color |  |
| `.v31-ad-ritmo > span` | 2 | v30@2113 v48@2512 | flex | 1 |
| `.v31-ad-ritmo .btn:not(.btn-icon)` | 2 | v30@2114 v48@2513 | flex | 1 |
| `.board .evt-riga.v24-altri` | 2 | v30@2268 v30@2273 | — |  |
| `.v40-dametti` | 2 | v40@2284 v40.2@2311 | gap |  |
| `.v40-gr-h` | 2 | v40@2289 v40.2@2313 | margin-top |  |
| `.v40-riga` | 2 | v40@2291 v40.2@2314 | — |  |
| `.v40-apri` | 2 | v40@2294 v40.2@2315 | padding |  |
| `.v40-apri .t` | 2 | v40@2295 v40.2@2316 | -webkit-line-clamp |  |
| `html:root .item.p-q1:not(.is-done) .item-row` | 2 | v43@2377 v44.1@2438 | background |  |
| `html:root .item.p-q1:not(.is-done) .check-box` | 2 | v43@2379 v44.1@2440 | border-color |  |
| `html:root .item.p-q1:not(.is-done) + .item.p-q1:not(.is-done)` | 2 | v43@2382 v44.1@2439 | border-top |  |
| `html:root .v40-riga.q1` | 2 | v43@2384 v44.1@2443 | background, border-color |  |
| `.v43-metodo .v12-coach li` | 2 | v43@2406 v46@2453 | — |  |
| `.v47-testa` | 2 | v47@2465 v50@2608 | background |  |
| `.v47-indietro > summary` | 2 | v47@2484 v49@2562 | display, align-items, gap | 1 |
| `.v47-testa .vh-board` | 2 | v47@2487 v47@2490 | — |  |
| `.v48-g.we` | 2 | v48@2510 v50@2629 | opacity |  |
| `.v49-sc b` | 2 | v49@2539 v49@2540 | — |  |
| `.v49-sc small` | 2 | v49@2539 v49@2541 | — |  |
| `@media (max-width: 767px) .v49-piede` | 2 | v49@2552 v49@2558 | — |  |
| `@media (max-width: 767px) .v49-dom` | 2 | v49@2558 v49@2559 | padding-left, padding-right |  |
| `@media (max-width: 767px) .v49-scelte` | 2 | v49@2558 v49@2559 | padding-left, padding-right |  |

Molte più sovrascritture sono **indirette** (selettore diverso ma più specifico, es. `html:root .board .evt-riga.v24-mio` contro `.board .evt-riga.v24-mio`): l'analisi per selettore identico non le vede. Il prefisso `html:root` aggiunto da v43 in poi è proprio un trucco di specificità per vincere sulle regole vecchie.

### 4.3 `!important` per versione

| Versione | v1 | v3 | v4 | v6 | v8 | v10 | v18 | v30 | v43 | v47 | v48 | v49 | v50 | Totale |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| N. | 3 | 13 | 3 | 3 | 1 | 2 | 1 | 5 | 2 | 2 | 2 | 35 | 24 | 96 |

Quasi due terzi stanno in v49–v50: sono gli strati che hanno dovuto battere la cascata accumulata. Elenco completo: `grep -n '!important' index.html | awk -F: '$1<2636'`.

## 5. Codice morto

### 5.1 Funzioni mai chiamate

Nessun riferimento nel JavaScript (escluse dichiarazione e alias), nell'HTML, negli attributi `onclick`/`data-act` né in alcuna stringa o template. Verificato anche con `grep`: ogni nome compare solo nella propria dichiarazione.

| Funzione | Riga | Versione | Nota |
|---|---|---|---|
| `formatWeekLabel` | 3631 | v1 | logica legacy rimasta dopo il redesign v2 |
| `catIcona` | 3685 | v1 | logica legacy rimasta dopo il redesign v2 |
| `filterByCat` | 3853 | v1 | logica legacy rimasta dopo il redesign v2 |
| `filterByPersona` | 3860 | v1 | logica legacy rimasta dopo il redesign v2 |
| `dayName` | 4602 | v1 | logica legacy rimasta dopo il redesign v2 |
| `monthName` | 4606 | v1 | logica legacy rimasta dopo il redesign v2 |
| `getMaCssClass` | 4615 | v1 | logica legacy rimasta dopo il redesign v2 |
| `getMaColor` | 4621 | v1 | logica legacy rimasta dopo il redesign v2 |
| `getMaEmoji` | 4622 | v1 | logica legacy rimasta dopo il redesign v2 |
| `retryFailedSyncs` | 4945 | v1 | logica legacy rimasta dopo il redesign v2 |
| `batchSyncAll` | 4965 | v1 | logica legacy rimasta dopo il redesign v2 |
| `openPostponeModal` | 5001 | v1 | logica legacy rimasta dopo il redesign v2 |
| `agendaDayDate` | 5112 | v1 | logica legacy rimasta dopo il redesign v2 |
| `isSameDay` | 5119 | v1 | logica legacy rimasta dopo il redesign v2 |
| `agendaPianificati` | 5233 | v1 | logica legacy rimasta dopo il redesign v2 |
| `agendaDaPianificare` | 5234 | v1 | logica legacy rimasta dopo il redesign v2 |
| `parcheggiaCiclo` | 5323 | v1 | logica legacy rimasta dopo il redesign v2 |
| `bpPctClass` | 5779 | v1 | logica legacy rimasta dopo il redesign v2 |
| `q2PianificaOra` | 6445 | v1 | logica legacy rimasta dopo il redesign v2 |
| `switchView` | 6657 | v2 |  |
| `apriNuovo` | 7230 | v2 | avvolta 1 volta ma mai chiamata: muore tutta la catena |
| `chiudiRapido` | 9464 | v3 |  |
| `v30InDaPianificare` | 20235 | v30 |  |

Non è contata la morte «a cascata» (funzioni chiamate solo da funzioni morte) né le 38 catene troncate della sezione 3: il codice realmente eliminabile è di più.

### 5.2 Classi CSS senza elementi

Classi presenti nel CSS ma mai scritte nell'HTML né in una stringa JS. Escluse le classi composte a runtime che ho verificato (`p-q${q}`, `t-q${q}`, `chip-q${q}`, `v17-q${q}`).

| Classe | Righe CSS |
|---|---|
| `.is-open` | 268, 269, 280, 281 |
| `.tag-q3` | 277 |
| `.tag-q4` | 277 |
| `.item-detail` | 279, 280 |
| `.item-note` | 282 |
| `.facts` | 283 |
| `.fact` | 284, 285 |
| `.item-actions` | 286, 287 |
| `.dense` | 290, 291, 292, 293, 294, 295 |
| `.bar-sm` | 311 |
| `.toast-danger` | 319, 320 |
| `.fab` | 331, 332, 333, 334, 405, 406, 407 |
| `.tab-add` | 404, 407 |
| `.solo-desk` | 453 |
| `.pad` | 661, 662 |
| `.bp-rev-opt` | 705 |
| `.pv-row` | 714 |
| `.q-badge` | 790 |
| `.bp-warn` | 816 |
| `.bp-tip` | 817 |
| `.ptr` | 1211, 1212 |
| `.v25-sezione-chip` | 1876 |
| `.v40-altre` | 2300 |

`tag-q3`/`tag-q4`: nel JS compaiono solo `tag-q1` e `tag-q2` scritti per intero. Nessun id CSS (`#…`) risulta orfano.

## Come rigenerare

Script in `tools/mappa/`: `cd tools/mappa && npm i && node analizza.js ../../index.html > report.json && node genera_mappa.js report.json ../../docs/MAPPA.md $(git rev-parse --short HEAD)`.

**Limiti dell'analisi**: (1) chiamate costruite per nome (`window[nome]()`) non si vedono — controllate a campione, nessun caso trovato tra le funzioni «morte»; (2) «cosa aggiunge» viene dal commento più vicino allo strato, non da una lettura riga per riga; (3) le classi CSS dentro `:not()`/`:has()` contano come usate se compaiono altrove.
