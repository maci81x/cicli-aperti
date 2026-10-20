# Decisioni — v5, metodo i-Time (2026-10-20)

Undici punti dal metodo i-Time (guida «Metodo Time Management», `metodo I-time & delega.pdf`) e dai calendari veri del 20/10. Lavorato in autonomia; qui le scelte dove la richiesta lasciava spazio.

## Migration: divisa in due, su tua richiesta

- La prima proposta (tutto insieme) l'hai rifiutata perché Supabase la segnalava come distruttiva. Ora:
  - **(a) `supabase_migration_itime_a.sql`, applicata**: solo aggiunte (`cicli.inderogabile`, `cicli.ritorni_delega`, `battle_plan.q2_spostate`, `battle_plan.riportato_at`, tabella `esercizi_q2` con la sua policy, `macro_aree.categorie`). Nessun UPDATE, DELETE o DROP.
  - **(b) `supabase_migration_itime_b.sql`, NON applicata**: rinomina tre aree, toglie «Da Delegare», scrive le categorie di ogni area, aggiorna `cicli.macro_area`. Ogni istruzione ha un WHERE esplicito. Aspetta che tu controlli la mappatura in `STATO.md`.
- Backup prima della (b): `backup_2026-10-20.json` con cicli (114), categorie (5), macro_aree (9), persone (8), ciclo_persone (0) e in più assegnazioni (0). Esportato con l'API REST, conteggi verificati sul database. Il file è nel `.gitignore`: il repository è pubblico (GitHub Pages) e dentro ci sono i tuoi dati.
- Finché la (b) non c'è, l'app usa la stessa mappatura scritta nel codice (`AREE_ITIME`) e legge i vecchi nomi (`R&D`, `Personale`, `HR`) come quelli nuovi. Spostare categorie e aggiungere aree da Impostazioni si accende solo dopo la (b): prima c'è un avviso.

## 0. Ripresa e guida

- Repository pulito, ultimo commit `92c0e73`: niente da committare prima di iniziare.
- La guida i-Time era in `~/Downloads` (il sandbox non la apriva) e nella copia su iCloud: testo estratto con pdftotext. In Altro → Guida c'è «Il metodo i-Time» in sette voci scritte da me (Parkinson, quadranti, pianificare dalle Q2, esercizio Q2, cicli aperti e unità di attenzione, Business Plan settimanale, il 3 %), senza copiare il PDF. La mappa delle parole dice «Business Plan settimanale» al posto di «Battle Plan».

## 1. Aree i-Time

- Riuso la tabella `macro_aree` (come chiesto): le righe 1–5 restano, `R&D` → «Ricerca e sviluppo», `Personale` → «Famiglia / cose personali», `HR` → «Formazione», «Da Delegare» si toglie (la delega è già un tipo di cosa e nessuna cosa la usa). Le categorie di un'area stanno in `macro_aree.categorie` (chiavi come `cicli.cat`).
- **Area di una cosa** (`areaDi`): quella scelta a mano o dall'assegnazione automatica (`cicli.macro_area`), altrimenti quella della sua categoria. Così le 3 cose che avevano già un'area la tengono, e tutte le altre ne hanno una dalla categoria (oggi 98 aperte su 98).
- Mappatura (tabella completa in STATO.md): HR, Delega e SSI - Socio → Management; SSI - Direttore Vendita e SSI - Commerciale → Vendite; Yoga Tribe e tutte le personali → Famiglia; Crescita → Formazione; Idee → Ricerca e sviluppo. «SSI Generale» e «Incassi» non esistono come categorie: non c'era niente da mappare.
- Nel dettaglio di una cosa il campo Area ha «Dalla categoria» come prima voce. L'assegnazione automatica con Claude non parte più quando la categoria scelta ha già un'area; in «+» (inserimento rapido) continua, perché lì la categoria è sempre quella predefinita.
- Spostare una categoria aggiorna anche `cicli.macro_area` di tutte le sue cose (con «Annulla»). Un'area tua si aggiunge in fondo.

## 2. Promemoria del Business Plan

- Impostazioni → «Quando preparo il piano»: giorno, ora, durata (predefiniti venerdì 15:00, 2 ore; prima era venerdì 14:00).
- Un solo evento ricorrente «Prepara il Business Plan» nel calendario di scrittura, con avvisi a 0 e 30 minuti e il link all'app. Lo ritrovo per id (salvato in `localStorage promemoria_cal`) o, da un altro dispositivo, per la proprietà privata `cicli_aperti=bp`: si aggiorna, non si duplica. Si sincronizza all'avvio, al collegamento di Google Calendar e quando cambi giorno, ora o durata.
- Banner «È ora del Business Plan» con [Prepara] [Stampa] [Invia al coach] da quel momento a domenica, finché il piano della settimana dopo non è inviato **o** stampato. Senza piano, Stampa e Invia sono spenti e la frase dice di prepararlo prima.
- «Stampato il …» è salvato su questo dispositivo (`piano_stampato`), come «Inviato il …» nel giro precedente.
- Fine del wizard: foglio «Il piano è pronto» con [Stampa il foglio] e [Invia al coach] grandi e lo stato («Piano inviato il …» / «Stampato il …»).

## 3. Il foglio

- Titolo «Business Plan Settimanale — Roberto Macinai — Settimana N (gg/mm–gg/mm)», si rimpicciolisce fino a stare su una riga. Riquadro giallo chiaro «Settimana (pensaci dopo)», sempre presente, con due righe vuote se non c'è niente.
- Righe: cose con quadratino (spuntato se già fatte; Subito con fondo grigio e in grassetto; «Importante - fissa» se inderogabile), appuntamenti con cerchio e orario inizio–fine, cuscinetti con quadratino tratteggiato, «Cuscinetto: cosa ci hai messo?» e una riga vuota sotto, nota in grigio sotto la cosa. Routine del mattino in una riga sola. Asterisco sugli appuntamenti sovrapposti; «giornata piena: nessun cuscinetto possibile» accanto al giorno.
- Colonna destra con le righe per gli appunti a penna; in fondo «Nuove cose emerse» (8 righe con quadratino) e «Fatte ____ / ____». Legenda sotto il titolo. In bianco e nero il giallo diventa un grigio chiarissimo.
- Su un foglio quando si può: il PDF si costruisce e, se va su due pagine, si rifà con righe più strette fino a 4 mm. Una settimana molto piena va comunque su due pagine.
- Sabato e domenica compaiono solo con una cosa, un cuscinetto o un appuntamento non ricorrente (i promemoria quotidiani non bastano).
- Formato A4 (predefinito) o A5 in Impostazioni → «Formato del foglio». Il nome del file è `business-plan-2026-W43.pdf`.

## 4. Riporta il foglio

- Primo passo di «Chiudi la settimana»: le righe del piano raggruppate come sul foglio (riquadro «Settimana» in giallo, poi i giorni), un tocco = spuntata. Le cose già fatte sono spuntate e bloccate. Sotto, «Cose nuove che hai scritto sul foglio»: una riga = una cosa Importante in Tutto (area dopo, cioè quella della categoria predefinita).
- Le spunte si applicano su «Avanti», tutte insieme, come «Fatto» (ricorrenze comprese) ma senza un toast per riga. Si salva `riportato_at`, poi la review di sempre. «Indietro» dalla review torna al foglio.

## 5. Q2 inderogabili

- Diventa inderogabile un'Importante bloccata a mano («Blocca in agenda» o il foglio Blocca) e ogni attività dell'esercizio Q2. «Metti il piano su Calendar» invece no: altrimenti ogni cosa con un'ora diventerebbe intoccabile. Togliere il blocco la libera. Sulla riga il lucchetto prende il posto dell'icona del calendario.
- Domani, Scegli quando, Lascia stare, trascinamento e anche i chip dei giorni nel dettaglio aprono «È un'attività importante bloccata. La sposti davvero?». [Lasciala] è il bottone principale. Ogni «Sposta comunque» incrementa `q2_spostate` del piano della settimana corrente e conta il motivo in `motivi.q2` (si tiene anche alla chiusura). Senza piano della settimana corrente non si conta.
- Lascia stare su un'inderogabile toglie anche l'evento dal calendario e il lucchetto: non è più un impegno con te stesso. L'«Annulla» del toast rimette la cosa, non l'evento.
- Impostazioni → «Proteggi le attività importanti»: Conferma (predefinito) / Solo avviso (sposta e avvisa, conta lo stesso) / Spento.

## 6. Esercizio Q2

- Altro → «Esercizio Q2 · prossimi 3 mesi» (anche da Impostazioni e dal banner). La lista della guida ha **23** voci, non 24: le ho prese tutte dalla guida, con l'area i-Time di ognuna.
- Passo 1: in cima «Le Q2 che hai già in agenda» (vedi punto 11), poi le voci come chip. Passo 2: una o più attività per voce; avviso «Questa è una categoria…» se il testo è una voce della lista (o il suo inizio) o è fatto di una o due parole generiche, e «Avanti» resta spento finché c'è un avviso. Passo 3: per ogni attività Giornata intera (9–18) / Mattina (9–13) / Pomeriggio (14–18) e un calendario di 14 settimane: tratteggiati i giorni pieni (≥ 5 ore di appuntamenti per la giornata, ≥ 2 ore per la mezza), sottolineati quelli con qualche appuntamento, bordati quelli già presi da un'altra attività. Scelto un giorno si passa da soli all'attività dopo.
- Alla fine: una cosa Importante inderogabile per attività (data, momento, ora e durata), l'evento nel calendario di scrittura, una riga in `esercizi_q2` (`attivita` = quante, `note` = l'elenco in JSON) e l'evento ricorrente «Esercizio Q2» ogni 3 mesi a partire da 90 giorni dopo. Senza Google Calendar le cose si creano lo stesso, senza eventi, e lo dico nel passo 3.
- Banner in Oggi «Esercizio Q2 · prossimi 3 mesi» se non è mai stato fatto (quindi da subito) o se sono passati 90 giorni; si chiude per oggi.

## 7. Svuota la testa

- In Tutto, accanto a «N cose aperte». Telefono: un'area per schermata, si scorre di lato (con ‹ ›); computer: le 8 aree in una griglia 4 × 2. Una riga = una cosa Importante con l'area di quella colonna (Famiglia → ambito personale, le altre → lavoro).
- Generiche (una parola, o che iniziano con gestione / organizzare / recupero / inaugurazione / progetto): mentre scrivi c'è una nota; dopo il salvataggio ognuna ha il bottone «Spacchettala» che apre i Passi. Nelle righe di Tutto la stessa cosa compare come etichetta «Spacchettala».

## 8. Dopo una Subito

- Chiusa una Subito: «Cosa l'ha generata? Evitiamo che si ripeta» con un campo e [Crea attività importante] / [Salta]. La cosa nuova è Importante, stessa categoria e area, con la Subito nella nota. Al massimo una volta al giorno per area (`subito_chiesto`), che tu crei o salti. Non si apre se c'è già un altro foglio aperto.

## 9. Delega che torna indietro

- Sulle Delega l'azione «Delega» del menu e dello swipe diventa «Mi è tornata indietro» («Tornata» nello swipe, che non ha spazio per un bottone in più); c'è anche in «Da controllare». Fa: `q = 2`, `ritorni_delega + 1`, toglie la data di controllo e registra persona e titolo in `motivi.deleghe` del piano corrente. La persona resta sulla cosa, per la storia. La review mostra «Deleghe tornate indietro: N» con i nomi.

## 10. Schede aperte e ordine del wizard

- In cima a Tutto: «N cose aperte» e la differenza con 7 giorni fa, in verde se calano. Sette giorni fa = cose create prima, non ancora chiuse allora (per quelle chiuse uso la data dell'ultima modifica, perché la data di chiusura non c'è) e non in Un giorno. È una stima: la prima settimana può esagerare se in questi giorni hai aggiunto molto.
- Wizard in tre passi: 1. «Le tue Q2 della settimana» (solo Importanti: «In agenda o bloccate» già scelte, poi «Altre Importanti»), 2. «Cicli aperti realistici in 7 giorni» (Subito, Delega, Lascia stare), 3. «Distribuisci nei giorni» (il passo 2 di prima).

## 11. Incrocio con Google Calendar

- Leggo solo «Roberto Macinai - Lavoro» e «Roberto Macinai - Privato» (elenco fisso in `CAL_LETTURA`, mostrato in Impostazioni). Lo stesso invito presente in tutti e due si mostra una volta. Gli eventi che hai rifiutato non compaiono.
- **Coach**: «Invia il piano» va a `l.beretta@osmanagement.it` con `timemanagement@osmanagement.it` in copia, tutti e due modificabili in Impostazioni (la copia si può svuotare). Se avevi salvato timemanagement come destinatario, all'avvio torna il nuovo predefinito.
- **Calendario di scrittura**: cerco prima per id (predefinito `c_4f57b6…@group.calendar.google.com`, modificabile in Impostazioni), poi per nome, e creo solo se non ce n'è nessuno. Il secondo (`c_88d981…`) non lo tocco.
- **Prefisso orario**: «10 - …», «17.45 - …», «8.30 - …» tolti dal titolo in app e nel PDF; se non coincide con l'ora vera, sotto c'è «orario nel titolo diverso (10:00)» (solo in app).
- **Sovrapposizioni**: bordo e icona arancio, «si sovrappone a …» (il primo, più «e altri N»); asterisco nel PDF.
- **Cuscinetti**: nei due spazi liberi più lunghi tra le 9 e le 19 (almeno 45 minuti), uno prima delle 14 e uno dopo, in fondo allo spazio (fanno da cuscinetto dopo il lavoro di quella mezza giornata), di un'ora o meno se lo spazio è più corto. Contano anche le cose del piano con un'ora. Senza spazi: «Giornata piena: nessun cuscinetto possibile» nel wizard e nel PDF. Si ricalcolano quando arrivano gli appuntamenti, finché non li tocchi. Senza Google Calendar restano alle 13:00 e alle 18:00.
- **Routine personali**: gli eventi ricorrenti del Privato che iniziano prima delle 8:30 vanno nella sezione Routine di Oggi (in sola lettura) e nel PDF diventano «Routine del mattino hh:mm–hh:mm»; non contano nel tempo del giorno.
- **Appuntamenti che sembrano cicli**: creati da te, senza invitati, con una delle parole (chiamare, chiamata, scrivere, inviare, mandare, chiedere, recuperare, sentire, controllare, export) o ripetuti ogni giorno da più di 30 giorni. Esclusi routine e incontri con il coach. Li cerco nella settimana corrente una volta per sessione; in Oggi un banner leggero apre il foglio con [Porta in Tutto] / [Porta in Tutto e toglilo dal calendario] / [È un appuntamento]. Togliere chiede conferma e cancella la serie intera (è un promemoria); le scelte si ricordano (`cal_cicli_scelte`). Nella tua settimana vera ce ne sono cinque: un promemoria che si ripete ogni giorno dal gennaio 2025, un export, due messaggi da mandare e una telefonata.
- **Q2 già in agenda** (passo 1 dell'esercizio): eventi ricorrenti di Lavoro creati da te con revisione, obiettivi, controllo settimanale, preparazione, gestione finanziaria, aggiornamento normativo, formazione, allineamento (prossime 4 settimane). [È una Q2] crea un'Importante inderogabile collegata all'evento (`calendar_event_id = 'ext:' + id della serie`) che si ripete come l'evento; se esiste già una cosa con lo stesso titolo, collega quella. Le cose collegate così non toccano mai l'evento del calendario Lavoro: «Sblocca» scollega soltanto, e spostarle o chiuderle non lo modifica.
- **Coach in Pianifica**: etichetta «Coach» sugli eventi con l.beretta. Dal momento in cui mancano 48 ore all'incontro, se il piano della settimana dell'incontro non è inviato, il banner di Oggi diventa «Hai l'incontro con il coach mer 21 ott alle 19:00 — invia il piano» e ha la precedenza sul banner del Business Plan. All'avvio leggo anche gli appuntamenti della settimana dopo, per gli incontri di lunedì.

## Verifica

- 84 controlli automatici a 375px su un browser vero, con il database vero e Google Calendar simulato: eventi costruiti sui casi della tua settimana (prefissi, sovrapposizioni, rifiutati, routine, promemoria quotidiano, coach, giornata piena). Tutti passano; console senza errori; niente scroll orizzontale a 375px (anche col testo al 125 %) e a 1280px.
- Dati di prova solo su cose «[TEST]» e sulla settimana 50; alla fine cancellati per id (piani nuovi, esercizi, cose). Controllato dopo: 114 cose come nel backup, solo il piano vero della settimana 42, `macro_aree` invariata.
- Schermate in `design-screenshots/v4/`, PDF in `design-screenshots/v4-business-plan-A4.pdf` e `-A5.pdf`, risultati in `design-screenshots/v4-test-risultati.json`.
- Corretti dopo la critica di design: avvisi degli appuntamenti su righe proprie in peso normale (prima troncavano l'ora e pesavano troppo); bottoni secondari bianchi nel banner (sul fondo verde chiaro non si vedevano); nota «spacchettala» mentre scrivi senza aspetto da bottone; Q2 in agenda con i bottoni sotto il titolo; «Svuota la testa» su computer in griglia (prima le colonne oltre la quinta erano nascoste); nota del PDF più staccata dal titolo; spazio sopra e sotto nelle righe di Impostazioni con due righe di testo; settimana del wizard su una riga.

## Rimasto aperto

- Parte (b) della migration: aspetta il tuo via dopo la tabella in STATO.md.
- Google Calendar vero non l'ho toccato: la lettura dei due calendari, l'evento ricorrente, i blocchi e la cancellazione di una serie vanno provati una volta con l'account.
- «Stampato il» e «Inviato il» restano su questo dispositivo.
- Le parole che fanno sembrare un evento un ciclo e quelle delle Q2 sono un elenco fisso: se un tuo titolo sfugge, dimmelo.

---

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
