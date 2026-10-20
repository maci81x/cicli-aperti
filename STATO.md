# Stato del progetto

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
