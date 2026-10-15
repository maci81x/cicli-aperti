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
