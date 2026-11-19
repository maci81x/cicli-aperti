# Lettura della posta (tools/posta)

## Overview

`leggi.js` è uno script da console, senza dipendenze e senza manifest, che si
incolla in una scheda di Gmail già aperta sull'account di lavoro (con lo
strumento `javascript_tool` di Claude in Chrome). Serve a leggere thread e
allegati per ricavarne cose da fare per Cicli Aperti, **senza segnare niente
come letto**: non apre i messaggi nell'interfaccia di Gmail, ma scarica con
`fetch` la «vista di stampa» del thread (`view=pt`) e la vista HTML degli
allegati (`disp=vah`). Non apre mai la vista di stampa come pagina, perché
aprirebbe la finestra di stampa e bloccherebbe la scheda.

Lo script è una IIFE che registra l'oggetto globale `window.__posta` e
restituisce una riga di stato (`ik` trovato o mancante, percorso dell'account
`/mail/u/N/`, account della scheda giusto o sbagliato).

## Interface

Tutto passa da `window.__posta` (`P` in `leggi.js`):

- `__posta.lista()` → righe della ricerca mostrata in quel momento in Gmail
  (`tr.zA` visibili): `{ id, nonLetta, da, oggetto, anteprima, data }`. Legge
  solo il DOM della pagina.
- `__posta.leggi(ids, opz)` (async) → per ogni id di thread scarica la vista di
  stampa, divide i messaggi (intestazione `<indirizzo> | G mese AAAA alle ore
  HH:MM`), tiene i messaggi dalla data `opz.da` in poi (e sempre quelli senza una data leggibile) e dei precedenti solo
  l'ultimo come contesto. Mette il testo in `__posta.out` e restituisce la sua
  lunghezza. Opzioni: `da` (data ISO), `ctx` (caratteri del messaggio
  precedente, 500), `maxM` (per messaggio, 3500), `maxR` (riassunto di un
  report, 400).
- `__posta.allegato(idThread, pezzoDelNome, max = 40000)` (async) → testo intero
  di un allegato trovato per pezzo del nome in `__posta.allegati` (se manca,
  rilegge il thread); scrive in `__posta.out`, restituisce la lunghezza o `0`.
- `__posta.mostra(i = 0, n = 45000)` → sostituisce il contenuto della pagina con
  un `<pre>` con la parte `i` di `__posta.out`, da leggere con `get_page_text`.
- `__posta.invito(url)` (async) → riga di riepilogo di un invito di calendario
  `.ics` (data, ora, titolo, luogo, organizzatore; «ANNULLATO» se
  `METHOD:CANCEL`).
- Proprietà: `IK` (chiave di Gmail da `GLOBALS[9]` o dall'HTML), `BASE`
  (origine + `/mail/u/N/` della scheda), `ACCOUNT` (indirizzo letto dal titolo
  della scheda), `out` (ultimo testo prodotto), `allegati` (mappa
  `idThread|nome` → URL).
- Funzioni interne (non esposte): `strip` (HTML → testo, toglie le righe di
  avvertenze legali tramite `RX_VIA`), `data` (date italiane «G mese AAAA alle
  ore HH:MM»), `pulisci` (toglie le parti citate, tranne negli inoltri, massimo
  70 righe di inoltro), `pt`, `urlAllegati`, `vah`.
- Nessuna sottocartella.

## Invariants

- Sola lettura: nessuna chiamata modifica lo stato dei messaggi in Gmail (né
  letto/non letto, né etichette); si usano solo richieste `GET` con
  `credentials: 'same-origin'`.
- La vista di stampa si scarica sempre con `fetch` (`pt`), mai aprendola come
  pagina.
- L'account usato è quello della scheda aperta (`BASE` da `location.pathname`,
  `/mail/u/0/` di riserva); la riga di stato iniziale dice se è quello atteso; l'account atteso è scritto nel codice di `leggi.js` (commento in testa e confronto finale), non è un parametro. Anche il nome di persona e la ragione sociale che `leggi` toglie dagli oggetti sono scritti nel codice.
  Va controllata prima di leggere.
- Gli allegati si leggono una volta per nome (`nomiVisti`) e una volta per
  `attid` + messaggio (`urlAllegati`). Immagini, archivi e firme (`.jpg`,
  `.png`, `.gif`, `.heic`, `.zip`, `.rar`, `.p7m`, `image…`, `Outlook-…`, `PastedGraphic…`) si elencano solo per nome; gli
  allegati più vecchi di `opz.da` sono segnati «(vecchio)» senza testo.
- Riassunti a lunghezza fissa: report (`REPORT`, nome che contiene per esempio
  report, verbale, DVR) `maxR`, offerte/preventivi 700, fogli di calcolo 600,
  altri 300 caratteri.
- Un errore su un thread non ferma gli altri: in `out` compare
  `##### THREAD <id>: ERRORE <messaggio>`.

## Side Effects

- Richieste di rete alla stessa origine di Gmail (vista di stampa, allegati con
  `disp=vah` e `disp=att`), con i cookie della sessione aperta.
- Crea la variabile globale `window.__posta` nella scheda.
- `__posta.mostra()` sostituisce tutto il `body` della pagina di Gmail (per
  tornare all'interfaccia si ricarica la scheda).
- Il testo letto (mittenti, oggetti, contenuti di messaggi e allegati) resta in
  memoria nella scheda (`__posta.out`, `__posta.allegati`) e passa nella
  conversazione con Claude. Non viene scritto su disco né in Supabase.

## Verification

Nessun manifest né test automatico. Prova manuale in una scheda di Gmail
aperta sull'account di lavoro, con `javascript_tool`:

- Run: incollare il contenuto di `leggi.js` → deve rispondere
  `posta pronta · ik ok · /mail/u/N/ · account GIUSTO`
- Run: `__posta.lista()` (sincrona) → righe della ricerca visibile
- Run: `await __posta.leggi(['<id thread>'], { da: '<AAAA-MM-GGT00:00:00>' })`
  poi `__posta.mostra(0)` e `get_page_text`
