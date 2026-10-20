# Decisioni — v4, coaching del 19/10 (2026-10-20)

Sei interventi dalla sessione di coaching, fatti in autonomia. Qui le scelte dove la richiesta lasciava spazio. Le osservazioni sulla registrazione sono in `CALL_19-10_SCHERMATE.md`.

## Ripresa e registrazione

- Nessun lavoro da committare; i due giri precedenti erano completi (vedi `STATO.md`). Migration v3 già applicata.
- La registrazione era in locale (650 MB, 5 minuti). ffmpeg non c'era e Homebrew lo stava compilando da sorgente: ho estratto i fotogrammi con AVFoundation (script Swift), un fotogramma ogni 20 secondi in `/tmp/call-frames`.
- Dalla registrazione ho preso: il blocco «In settimana» **in cima** (Pianifica e PDF), la nota sotto il titolo e le Subito evidenziate nel PDF, l'email del coach predefinita `timemanagement@osmanagement.it` (dalla slide «Invia qui il piano di lavoro»), lo stato «Piano inviato il …» (i-time mostra «Battleplan inviato il 15 ott»).

## Migration v4

- Applicata via MCP (`v4_coaching_passi_cuscinetti_stats`), riuscita. SQL anche in `supabase_migration_v4.sql`, con un indice su `cicli.parent_id`.
- `rilevaColonneV4()` → `state.passiColOk`, `state.cuscColOk`, `state.statsColOk`. Senza colonne: passi, cuscinetti e numeri salvati si spengono, Impostazioni mostra l'avviso con il nome del file.
- **Cuscinetto = riga di `battle_plan_items` con `tipo_slot = 'cuscinetto'` e `ciclo_id` NULL** (la colonna lo permette; l'UNIQUE su `(battle_plan_id, ciclo_id)` non scatta con NULL). Riempirlo scrive `ciclo_id` sulla stessa riga: resta `tipo_slot = 'cuscinetto'`, così la riga dice «nel cuscinetto».
- La versione precedente (`index.legacy.html`) mostra il piano senza errori, ma se si salva il piano da lì cancella i cuscinetti. Non l'ho toccata (regola del progetto).

## 1. Piano = agenda + cose, ora per ora

- Una sola funzione, `sequenzaGiorno(righe, d)`: appuntamenti di Google Calendar + cuscinetti vuoti + cose con un'ora, in ordine di ora (gli appuntamenti di tutto il giorno in cima). Sotto, le cose senza ora: per fascia se almeno una ha una fascia scelta, altrimenti «Senza ora» in fila. La usano Pianifica (telefono e colonne desktop), il wizard, il PDF e Oggi.
- Gli appuntamenti sono righe in sola lettura: icona calendario, «09:00–10:00 · Google Calendar», testo grigio, niente spunta né azioni.
- In Oggi il vecchio blocco «Appuntamenti» è diventato «La giornata» (appuntamenti + cuscinetti in ordine di ora). Le cose restano nelle loro sezioni (Le tue 3, Rapide…) per non mostrarle due volte.
- Su desktop la sequenza sta in cima alla colonna; sotto restano le zone di rilascio per le cose senza ora.
- PDF: il blocco «In settimana» va in cima; appuntamenti con il cerchio e l'orario in grigio, cuscinetti con un quadratino tratteggiato in grigio, cose con il quadratino. Sabato e domenica solo se hanno qualcosa. Titolo «Piano della settimana N - Nome».

## 2. Cuscinetti

- «Cuscinetti automatici» (Impostazioni, acceso se non lo spegni) vale solo per un piano **nuovo** (o in bozza) che non ha ancora cuscinetti: lun–ven alle 13:00 e alle 17:30, un'ora. Modificando un piano non li rimetto, così quelli tolti a mano non tornano.
- Nel wizard, passo 2, ogni giorno ha «+ Cuscinetto a metà giornata» / «+ Cuscinetto a fine giornata»; il bottone sparisce quando quel cuscinetto c'è già (metà = prima delle 15:00). Ora e durata (30 min–2 ore) si cambiano sulla riga.
- In Oggi: [Urgenza arrivata] apre il «+» con Subito acceso e il chip «Nel cuscinetto delle 13:00»: la cosa scritta riempie il cuscinetto. [Riempi] propone al massimo 3 cose del contesto, aperte, che stanno nel tempo (senza durata vale 30 minuti, indicato «stimata»): prima le Subito (per scadenza), poi le Importanti senza data, poi le rapide. Esclude quelle già in programma quel giorno e le cose divise in passi (si propongono i passi).
- Se la cosa scelta era già nel piano della settimana in un altro giorno, la vecchia riga va via: la cosa si sposta nel cuscinetto. Toast con «Annulla».
- Statistiche: i cuscinetti vuoti non contano (`bpItemsValidi` li scarta già). Contano invece nel **totale ore del giorno**: sono tempo prenotato.

## 3. 130 % → 80 %

- Via «Troppo per un giorno» ovunque (Pianifica, colonne, wizard) e anche l'avviso «più di 40 ore»: con il metodo del 130 % il piano è volutamente pieno. Resta il totale ore di ogni giorno (cose + cuscinetti + appuntamenti).
- «Hai scelto»: «Pianificato: N cose / Xh», cuscinetti, appuntamenti, traguardo all'80 %. Sotto: «La settimana scorsa ne hai chiuse M su P (Q%).» e sempre «Pianificane circa il 30% in più di quante pensi di fare.»; «Puoi aggiungerne ancora» se N < P × 1,1.
- La settimana di riferimento è l'ultima con un piano **prima** di quella del wizard, già finita o chiusa (se si prepara la prossima il venerdì, la settimana in corso non vale ancora). Se non è proprio la precedente: «Nella settimana 41 ne hai chiuse…». I numeri sono del contesto attivo (come in Fatte → Settimane); se le cose sono state cancellate, si usano quelli salvati alla chiusura.
- Alla chiusura salvo in `battle_plan` pianificate / completate / percentuale di **tutto il piano** (come il «N su M» della review), più i motivi.
- Fatte → Settimane: trend = differenza di punti percentuali tra le ultime due settimane; barre SVG alte 60px delle ultime 8 (la più recente piena, le altre più chiare), linea tratteggiata all'80 %; tabella Settimana · Pianificate · Fatte · %, tocca la settimana per aprirla.

## 4. Review con il perché

- Un solo perché per cosa (si tocca di nuovo per toglierlo). «Altro…» apre un campo di testo: in `motivi` finisce `{ urgenze: 2, …, altro: 1, altro_note: ["…"] }`.
- Il riassunto «ti hanno rallentato soprattutto» mostra i primi tre motivi per numero. I suggerimenti usano il titolo della cosa come [tema]/[titolo] («Scrivi la procedura o il manuale per «…»»); «Affianca una persona sulle chiamate» compare una volta sola. Al massimo 6. [Aggiungi] crea subito una cosa Importante senza data e diventa «Aggiunta».

## 5. Passi

- Un passo è una cosa con `parent_id`: prende contesto, categoria, area e persone della madre, tipo Importante (Subito se la madre è Subito). Un livello solo: «Scomponi» su un passo apre la cosa intera.
- In Tutto i passi non compaiono da soli (si trovano cercando); la madre mostra «2/5 passi». Nel wizard, in Da piazzare, nelle Rapide e in Riempi compaiono i passi e non la madre finché ha passi aperti. Una madre già nel piano prima di essere divisa resta dov'è.
- Quando l'ultimo passo viene fatto compare un foglio «Tutti i passi sono fatti · Chiudi anche «…»?» [Non ancora] [Sì, chiudila] (non `confirm()`, che blocca la pagina).
- «Grossa: scomponila in passi» da 4 ore in su (`durata_minuti` ≥ 240) senza passi: nella riga, nel wizard e nel dettaglio.
- Corretto un bug che saltava fuori: Invio nel campo del passo salvava e chiudeva il dettaglio (scorciatoia della Parte 1).

## 6. Blocca in agenda e invio al coach

- Telefono, swipe: Fatto · Domani · Quando · Delega · Scomponi · Blocca · Lascia. «Ripeti» è uscito dallo swipe (resta nel dettaglio e nel menu «···» desktop): otto caselle non stavano a 375px. Le caselle ora sono larghe quanto la parola.
- «Blocca in agenda» usa giorno, ora e durata della riga del piano; se manca qualcosa usa la data in agenda e `ora_inizio`/`durata_minuti`; se manca ancora qualcosa apre un foglio (giorno, ora, durata) che scrive anche giorno e ora sulla cosa. L'evento va nel calendario «Cicli Aperti — Battle Plan», l'id in `calendar_event_id` (lo usa già la riconciliazione).
- Modifiche: Domani, cambio giorno nel dettaglio, salvataggio del dettaglio, Riempi e il salvataggio del wizard aggiornano l'evento. Chiusura: se l'appuntamento era ancora da venire lo cancello; se è passato lo lascio con «✓» nel titolo, così il calendario resta un registro di cosa hai fatto. Se su Google l'evento non c'è più, l'id viene tolto.
- Una cosa che si ripete, quando la chiudi, nasce senza `calendar_event_id` (prima si portava dietro quello vecchio).
- «Metti il piano su Google Calendar» crea l'evento per ogni riga con giorno e ora **o aggiorna quello che c'è già** (prima ne creava uno nuovo a ogni tocco). Nel wizard è una casella al passo 2 («Metti su Google Calendar le cose con un'ora»), ricordata tra un piano e l'altro, perché il piano esiste solo dopo «Attiva»; in Chiudi la settimana resta il bottone.
- «Invia il piano» apre un foglio con riepilogo, oggetto ed email del coach (modificabile, salvata). Telefono con condivisione di file: Web Share con il PDF. Altrimenti scarica il PDF e apre `mailto:` con oggetto «Piano settimana N — Roberto Macinai» e il corpo; l'allegato va aggiunto a mano (un `mailto:` non può allegare file). «Il tuo nome» è in Impostazioni (predefinito Roberto Macinai).
- Dopo l'invio, «Piano inviato al coach il 17/10» nel riquadro del piano e «inviato il …» accanto a «Invia il piano» (salvato in `localStorage piano_inviato`, quindi per dispositivo).
- Banner del venerdì: senza piano per la settimana dopo → «Prepara la settimana prossima»; con il piano pronto ma non inviato → «Il piano della prossima settimana è pronto» [Invia il piano] [Modifica]. Un «Invia» senza piano non avrebbe niente da inviare.

## Correzioni trovate durante il lavoro

- Due elementi con id `f-durata` (dettaglio e «Scegli quando»): il modale Pianifica leggeva la durata dal dettaglio. Quello del dettaglio ora è `f-durata-det`.

## Verifica

- `design-screenshots/v3/`: 01 giorno con appuntamenti e cose · 02 cuscinetto in Oggi · 02b Riempi · 03 wizard col 130 % · 03b passo 2 · 04 review con i perché · 04b suggerimento Q2 · 05 dettaglio con Passi · 06 Invia il piano · 07 Fatte → Settimane · 08 swipe · 09–10 desktop · 11 Oggi con testo al 125 %. PDF di esempio: `design-screenshots/v3-piano-settimana.pdf`.
- Test automatici (Playwright, 375px, Google Calendar simulato, dati «[TEST]» cancellati alla fine): 42/42, console senza errori. Risultati in `design-screenshots/v3-test-risultati.json`.
- design-critique su ogni schermata; corretti: azioni dello swipe che uscivano dalla riga, riga del cuscinetto nel wizard (ora illeggibile), cuscinetto troppo in evidenza, «0/3 passi» ripetuto, barre del grafico troppo larghe.
- Nessuno scroll orizzontale a 375px con testo al 125 % (Oggi, Pianifica, Tutto, Fatte, Impostazioni, wizard) né a 1280px.

## Non fatto / da verificare con il calendario vero

- Il test di Google Calendar usa un calendario simulato: con l'account vero va provato una volta «Blocca in agenda» (vedi `STATO.md`).
- Nelle colonne desktop del wizard il totale in testa ai giorni conta solo le cose (è il disegno della Parte 1); il totale completo è nella riga in alto e nella lista.

---

# Decisioni — v3 (2026-10-15)

Dieci interventi fatti in autonomia. Qui le scelte prese dove la richiesta lasciava spazio, e cosa non è stato fatto.

## Migration

- Applicata via MCP (`apply_migration` «v3_focus_delega»): è andata a buon fine. Lo SQL è comunque in `supabase_migration_v3.sql`.
- L'app controlla all'avvio se le colonne ci sono (`rilevaColonneV3` → `state.focusColOk`, `state.delegaColsOk`). Se mancano, «Le tue 3» e la delega con controllo si spengono e Impostazioni mostra un avviso con il nome del file SQL. Il resto funziona.

## 1. Inserimento a un campo

- Il campo è una `textarea`: Invio salva, Maiusc+Invio va a capo, e anche il testo incollato su più righe diventa più cose.
- Il foglio si chiude dopo l'Invio. Per scrivere un'altra cosa si tocca di nuovo «+».
- Categoria predefinita come prima: `management` (Lavoro) o `salute` (Personale). Per Lavoro l'area la cerca Claude in background, come nel foglio completo, ma solo se c'è la chiave API.
- «Oggi» usa la stessa scrittura di «Domani» (`pianificaInData`). «Con…» apre i chip delle persone già in rubrica; le persone nuove si aggiungono da Impostazioni o dal foglio Delega.
- Anche «Aggiungi» su desktop e Cmd+K aprono il foglio a un campo. Il pannello completo si apre da [Dettagli] nel toast o toccando la riga.
- In più: nel dettaglio, sotto «Altre opzioni», c'è il campo «Quanto ci vuole?» (scrive `cicli.durata_minuti`). Serve perché altrimenti nessuna cosa può diventare «Rapida».

## 2. Le tue 3

- Il foglio si apre una sola volta al giorno: `focus_date` viene scritto quando il foglio compare, non alla conferma, così chiuderlo non lo fa riapparire.
- Contano solo le righe del piano (`battle_plan_items`). Le cose che sono in agenda ma non nel piano non possono entrare nelle 3 (non hanno dove salvare `in_focus`) e vanno in «Il resto di oggi».
- Con 3 righe o meno nessuna viene segnata nel database: sono «tutte in focus» al momento del disegno. Toccare una stellina rende la scelta esplicita.
- Se le 3 non sono state scelte (foglio chiuso senza confermare), Oggi mostra la lista com'era prima.
- La quarta stellina non entra: toast «Ne hai già 3: togline una prima».

## 3. Rapide

- Rapida = `durata_prevista` della riga del piano ≤ 15, oppure `durata_minuti` della cosa ≤ 15. Il 30 predefinito del piano non conta (sarebbe ovunque).
- Il chip è un'icona Tabler (`ti-bolt`) + «Rapida», non l'emoji ⚡: le regole del progetto escludono le emoji.
- Le rapide prese da Tutto sono quelle «Da piazzare» (`!haPianificazione`), fino ad arrivare a 3 in tutto.

## 4. Settimana unica

- Su telefono un giorno alla volta, come prima; su desktop le colonne sono le zone di rilascio dell'ex Agenda.
- Un giorno senza fasce ha una sola zona di rilascio. Una cosa trascinata lì prende la fascia «mattina», perché `agenda_override.fascia_oraria` è NOT NULL: da quel momento quel giorno si vede diviso per fasce.
- «Un giorno» sostituisce «In attesa» nell'interfaccia. Nel codice e nel database resta `parcheggiato`.
- Restano «in agenda» solo i commenti del codice e la frase della Guida sui clienti «in attesa» (che è il senso comune della parola).

## 5. Limite di carico

- Il colore è `--warn` (avvisi) e non `--q1`: secondo DESIGN_SYSTEM.md l'arancio è riservato a Subito e ai ritardi.
- Il tempo conta tutte le righe del giorno (anche quelle fatte) + gli appuntamenti; le Subito contano solo quelle non fatte. Senza durata, una riga vale 30 minuti.
- Nel wizard il riepilogo per giorno si colora e sotto compare «Troppo per un giorno: Mar, Gio». La vecchia soglia di 8 ore non c'è più.

## 6. Delega

- Il foglio compare quando: il tipo diventa Delega nel dettaglio (al salvataggio), con l'azione «Delega» (aggiunta allo swipe e al menu «···»). Una cosa che è già Delega e viene salvata di nuovo non riapre il foglio.
- La persona è obbligatoria; il controllo predefinito è «Tra 2 giorni».
- La persona viene aggiunta anche a `persone_menzionate`, così la cosa compare nella vista Persone.
- In «Da controllare» compaiono anche i controlli scaduti nei giorni prima, con «dovevi controllare il …». «Riprendila io» la rimette Importante e toglie persona e data.
- Si usa `c.q === 3` (il tipo scelto), non quello calcolato dalla scadenza.

## 7. Modalità semplice

- Per uscirne: in Oggi compare l'icona Impostazioni (Altro non c'è più nella barra).
- Il dettaglio nasconde tipo, categoria, area e il suggerimento «Importante». Il wizard «Pianifica la settimana» resta quello completo (con i gruppi per tipo): rifarlo semplificato era fuori misura.
- Dopo aver salvato il piano dal wizard si resta in Oggi (Pianifica non c'è).
- Onboarding: quarta pagina «Vuoi la versione semplice o completa?», predefinita Completa. «Salta» non cambia la versione.

## 8. Venerdì

- Impostazioni → «Quando preparo la settimana»: giorno e ora (predefiniti venerdì 14:00). La finestra va da lì a domenica sera. Cambiare l'impostazione riattiva il banner anche se era stato chiuso oggi.
- «Ha un piano» = esiste una riga `battle_plan` per la settimana dopo, in qualsiasi stato.

## 9. Fine giornata

- «Oggi N su M» usa gli stessi numeri della barra di Oggi (routine comprese).
- La serie conta i giorni con almeno l'80 % delle righe del piano completate entro quel giorno (`completato_at` ≤ giorno), nelle ultime 9 settimane. I giorni senza niente in programma non la interrompono. «N giorni di fila» compare da 2 giorni in su.
- Il toast «Le tue 3 sono fatte» parte quando si chiude l'ultima delle 3 ancora aperte (avvolge `azioneFatto`).

## 10. Testo e contrasto

- I token tipografici sono passati da px a rem: scala davvero tutto il testo. Icone, raggi e spaziature restano in px.
- Testo 125 % verificato a 375px su Oggi, Pianifica (Settimana e Mese), Tutto, Un giorno, Altro, Impostazioni, Fatte, Guida, wizard, foglio a un campo, Delega: nessuno scroll orizzontale.
- Impostazioni e contrasto vengono applicati prima del primo disegno (stesso script del tema).

## Correzioni trovate durante i test

- `textarea` e `select` non ereditavano il font (il campo del «+» era monospaziato).
- Un toast lungo usciva dallo schermo: la colonna dei toast ora non si allarga oltre lo schermo.
- Spegnendo la modalità semplice mentre si era su «Cose» il ridisegno rapido trovava la pagina sbagliata e andava in errore.

## Non fatto

- Niente di bloccato: tutti i dieci punti sono fatti e verificati.
