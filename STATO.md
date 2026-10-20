# Stato del progetto

## Giro «metodo i-Time» (20/10/2026) — mappatura delle aree DA CONTROLLARE

La migration è divisa in due:
- **(a) `supabase_migration_itime_a.sql`**: solo aggiunte (colonne `inderogabile`, `ritorni_delega`, `q2_spostate`, `riportato_at`, `macro_aree.categorie`, tabella `esercizi_q2` con la sua policy). Nessun dato toccato.
- **(b) `supabase_migration_itime_b.sql`**: rinomina le aree, assegna le categorie e aggiorna `cicli.macro_area`. **Non è applicata**: aspetta che tu controlli la tabella qui sotto.

Backup fatto prima di tutto: `backup_2026-10-20.json` (cicli 114, categorie 5, macro_aree 9, persone 8, ciclo_persone 0, assegnazioni 0; conteggi verificati sul database). Il file è nel `.gitignore`: il repository è pubblico, i dati restano solo sul Mac.

### Le 8 aree i-Time (dalle 9 macro aree di prima)

| Area i-Time | Riga di prima in `macro_aree` | Cosa cambia |
|---|---|---|
| Management | Management (id 1) | niente |
| Marketing | Marketing (id 2) | niente |
| Vendite | Vendite (id 3) | niente |
| Amministrazione | Amministrazione (id 4) | niente |
| Produzione | Produzione (id 5) | niente |
| Ricerca e sviluppo | R&D (id 7) | rinominata |
| Famiglia / cose personali | Personale (id 8) | rinominata |
| Formazione | HR (id 6) | rinominata (HR va sotto Management come categoria) |
| — | Da Delegare (id 9) | tolta: la delega è già un tipo di cosa; nessuna cosa la usa |

### Categorie → area

| Categoria | Ambito | Area i-Time | Cose (aperte / totali) |
|---|---|---|---|
| Management | lavoro | Management | 33 / 39 (1 chiusa aveva area «Vendite», diventa Management) |
| SSI - Socio | lavoro | Management | 3 / 3 |
| HR | lavoro | Management | 0 / 1 |
| Delega (`da-delegare`) | lavoro | Management | 0 / 0 |
| Marketing | lavoro | Marketing | 0 / 0 |
| SSI - Direttore Vendita | lavoro | Vendite | 21 / 21 |
| SSI - Commerciale | lavoro | Vendite | 4 / 4 |
| Vendite | lavoro | Vendite | 2 / 5 |
| Amm. (`amministrazione`) | lavoro | Amministrazione | 0 / 0 |
| Produzione | lavoro | Produzione | 0 / 0 |
| R&D (`rnd`) | lavoro | Ricerca e sviluppo | 0 / 0 |
| Idee | lavoro e personale | Ricerca e sviluppo | 0 / 0 |
| Yoga Tribe | lavoro | Famiglia / cose personali | 4 / 4 |
| Da Fare Personale | personale | Famiglia / cose personali | 26 / 26 |
| Salute | personale | Famiglia / cose personali | 4 / 4 |
| Relazioni | personale | Famiglia / cose personali | 1 / 2 |
| Casa | personale | Famiglia / cose personali | 0 / 4 |
| Hobbies | personale | Famiglia / cose personali | 0 / 1 |
| Finanze | personale | Famiglia / cose personali | 0 / 0 |
| Spiritualità | personale | Famiglia / cose personali | 0 / 0 |
| Crescita | personale | Formazione | 0 / 0 |

«SSI Generale» e «Incassi» non esistono tra le categorie: non c'è niente da mappare. Se le crei, l'app ti chiede l'area (oppure la sposti da Impostazioni → Aree).

Dubbi da guardare tu: **Yoga Tribe** (è una categoria «lavoro» ma va in Famiglia, come hai chiesto), **Finanze** (personale: Famiglia o Amministrazione?), **Idee** (Ricerca e sviluppo).
Quando la tabella va bene, dimmelo e ti propongo la parte (b). Fino ad allora l'app usa questa stessa mappatura scritta nel codice, senza toccare il database.

### Online (GitHub Pages, dopo il push)
- **Aree i-Time**: le 8 aree in filtri, «Raggruppa per», campo Area («Dalla categoria») e Impostazioni → Aree. Spostare categorie e aggiungere aree si accende dopo la parte (b).
- **Business Plan**: «Quando preparo il piano» (venerdì 15:00, 2 ore) con l'evento ricorrente «Prepara il Business Plan» su Google Calendar (avvisi a 30 e 0 minuti). Banner «È ora del Business Plan» con [Prepara] [Stampa] [Invia al coach]. A fine wizard, «Il piano è pronto» con Stampa il foglio e Invia al coach.
- **Il foglio** nel formato i-Time: riquadro giallo «Settimana (pensaci dopo)», quadratini, cerchi con orario, cuscinetti con riga vuota, note, appunti a destra, «Nuove cose emerse», «Fatte __ / __». A4 o A5. Esempio: `design-screenshots/v4-business-plan-A4.pdf`.
- **Riporta il foglio**, primo passo di Chiudi la settimana: spunte e cose nuove scritte a penna.
- **Q2 inderogabili**: lucchetto sulla riga; spostarle chiede «La sposti davvero?» e si conta («Q2 spostate questa settimana: N» nella review).
- **Esercizio Q2 · prossimi 3 mesi** (Altro, banner in Oggi): le Q2 già in agenda, le 23 voci della guida, l'avviso sulle categorie, i giorni pieni, gli eventi su Calendar e il promemoria ogni 3 mesi.
- **Svuota la testa** in Tutto, con «Spacchettala»; in cima a Tutto «N cose aperte» e la differenza con 7 giorni fa.
- **Dopo una Subito**: «Cosa l'ha generata?». **Delega**: «Mi è tornata indietro», contata nella review.
- **Wizard** nell'ordine i-Time: le Q2 della settimana, i cicli aperti realistici in 7 giorni, distribuisci nei giorni.
- **Google Calendar**: leggo Lavoro e Privato; titoli senza orario davanti; avvisi su sovrapposizioni e orari del titolo diversi; routine del mattino in Routine; cuscinetti negli spazi liberi («Giornata piena» se non ce ne sono); appuntamenti che sembrano cicli da portare in Tutto; etichetta «Coach» e banner 48 ore prima dell'incontro. Scrivo solo nel primo «Cicli Aperti — Battle Plan».
- **Invia il piano** a l.beretta@osmanagement.it, in copia timemanagement@osmanagement.it.
- Guida: «Il metodo i-Time» in sette voci.
- Test: 84 su 84 automatici a 375px, console pulita, niente scroll orizzontale a 375px (anche col testo al 125 %) e a 1280px. Schermate in `design-screenshots/v4/`.

### Cosa devi controllare tu
1. **La mappatura delle aree qui sopra.** Se va bene (o dimmi cosa cambiare), ti propongo la parte (b) della migration.
2. Collega Google Calendar e guarda Oggi:
   - che compaiano gli appuntamenti di Lavoro e Privato;
   - che la routine del mattino stia in Routine.
3. Nel calendario «Cicli Aperti — Battle Plan» (il primo, `c_4f57b6…`) deve comparire «Prepara il Business Plan» ogni venerdì alle 15. Il secondo calendario lo puoi cancellare: l'app non lo usa.
4. Il foglio «Questi sembrano cicli»: decidi tu cosa portare in Tutto. Dal calendario tolgo una serie solo se tocchi «Porta in Tutto e toglilo dal calendario» e confermi.
5. Fai l'esercizio Q2 (il banner in Oggi c'è finché non lo fai) e prova a spostare una delle attività create: deve chiedere conferma.
6. Venerdì: prepara il piano, stampa il foglio e invialo. A fine settimana, «Chiudi la settimana» → «Riporta il foglio».

### Rimasto aperto
- Parte (b) della migration: in attesa del tuo controllo.
- Google Calendar nei test era simulato con eventi costruiti sulla tua settimana vera: va provato una volta con l'account.
- «Stampato il» e «Inviato il» restano su questo dispositivo.
- Le parole che fanno riconoscere un ciclo o una Q2 negli eventi sono un elenco fisso (in DECISIONI.md): dimmi se ne manca qualcuna.

## Ripresa (20/10/2026, prima del giro «coaching 19/10»)

1. Repository pulito su `main`, ultimo commit `f3bfd9a`: nessun lavoro da committare, entrambi i giri precedenti sono online.
2. **a) Piani di qualsiasi settimana** — completo: wizard con ‹ settimana ›, modalità modifica, `cardPiano`, Rimaste indietro (`caricaRimaste` / `carrySposta` / «Porta tutte a oggi»), Riepilogo in Pianifica, Fatte → Settimane.
3. **b) 10 punti** — completi: «+» a un campo con dettatura, Le tue 3, Rapide, settimana unica con rinomina Da piazzare / Un giorno, limite di carico (che questo giro sostituisce), delega con controllo, modalità semplice, banner del venerdì, fine giornata, testo e contrasto.
4. Migration v3 (`in_focus`, `delega_persona_id`, `delega_controllo`) già applicata sul database; applicata ora anche la v4 (`parent_id`, `tipo_slot`, `pianificate`/`completate`/`percentuale`/`motivi`).
5. Trovato un bug preesistente: due campi con id `f-durata` (dettaglio e «Scegli quando»), così il modale Pianifica leggeva la durata sbagliata. Corretto in questo giro.

## Fine giro «coaching 19/10» (20/10/2026)

### Online (GitHub Pages, dopo il push)
- **Il giorno ora per ora**: in Pianifica, nel wizard e nel PDF gli appuntamenti di Google Calendar stanno in mezzo alle cose, in ordine di ora; le cose senza ora sotto. In cima alla settimana «In settimana, senza giorno», come nel piano del coach. In Oggi il blocco «La giornata».
- **Cuscinetti**: automatici alle 13:00 e 17:30 (Impostazioni), «+ Cuscinetto» nel wizard, in Oggi [Urgenza arrivata] e [Riempi].
- **130 % → 80 %**: niente più «Troppo per un giorno»; riepilogo «Pianificato: N cose / Xh» con il confronto della settimana scorsa; la chiusura salva percentuale e motivi; Fatte → Settimane con trend, grafico e tabella.
- **Review con il perché** e suggerimenti Importanti da aggiungere con un tocco.
- **Passi** nel dettaglio, azione «Scomponi», la cosa intera si chiude (con conferma) quando l'ultimo passo è fatto.
- **Blocca in agenda** (evento su «Cicli Aperti — Battle Plan», segue gli spostamenti) e «Metti il piano su Google Calendar» che non duplica più.
- **Invia il piano**: PDF condiviso dal telefono, oppure PDF scaricato + email al coach già scritta; «inviato il …» nel piano; il banner del venerdì propone l'invio quando il piano è pronto.
- Test: 42/42 automatici a 375px, console pulita, niente scroll orizzontale anche col testo al 125 % e a 1280px. Schermate in `design-screenshots/v3/`.

### Rimasto aperto
- Google Calendar nei test era simulato: «Blocca in agenda» e «Metti il piano su Calendar» vanno provati una volta con l'account vero.
- La versione precedente (`index.legacy.html`), se usata per salvare un piano, cancella i cuscinetti di quel piano.
- L'invio da computer non può allegare il PDF da solo (`mailto:` non lo permette): il PDF si scarica e va allegato a mano.
- «Inviato il …» è salvato su questo dispositivo, non nel database.

### Cosa devi fare tu
1. Apri l'app e ricarica la pagina (anche sul telefono, se è installata come app).
2. Impostazioni → Piano della settimana: controlla l'email del coach (ho messo timemanagement@osmanagement.it, quella della slide) e il tuo nome.
3. Collega Google Calendar se non è collegato, poi prova «Blocca in agenda» su una cosa con un'ora e guarda che l'evento compaia nel calendario «Cicli Aperti — Battle Plan».
4. Venerdì prepara il piano della prossima settimana e prova «Invia il piano».
