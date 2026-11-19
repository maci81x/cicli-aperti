# src — i sorgenti di index.html

`index.html` in radice è il file che GitHub Pages pubblica, ma **non si modifica più a mano**: lo scrive `build.js` mettendo in fila i file di questa cartella nell'ordine di `ordine.txt`.

## Come si modifica l'app

1. Si cambia il file giusto qui dentro (`css/…`, `js/…`, `testa.html`, `corpo.html`, `coda.html`). Per una funzione avvolta a strati si modifica **lo strato più alto**, nel suo file: la catena degli strati è in [docs/MAPPA.md](../docs/MAPPA.md). Niente strati nuovi (`const _x = fn; fn = function () { … }`).
2. Dalla radice del repo: `node build.js`.
3. Si committano **insieme** i file di `src/` e `index.html`.

In `ordine.txt` i percorsi sono relativi a `src/`; le righe vuote e quelle che iniziano con `#` sono commenti. Un file nuovo va aggiunto a `ordine.txt` nel punto giusto: se manca, `build.js` avvisa (solo per `.html`, `.css`, `.js`) e il file resta fuori da `index.html`. Per provare la build su una copia: `RADICE=/percorso/copia node build.js`. L'ordine conta (strati, ascoltatori registrati al caricamento, cascata CSS): non riordinare senza aver letto [docs/PIANO_RIORDINO.md](../docs/PIANO_RIORDINO.md).

## Controlli

- `node build.js --check` — non scrive niente; esce con 1 se `index.html` non è quello che uscirebbe da `src/`, con 2 se `ordine.txt` ha voci ripetute o file che non esistono.
- Hook prima del commit (`tools/hooks/pre-commit`): rifiuta un commit che porta `index.html`, `src/` o `build.js` non allineati, o con modifiche lasciate fuori dallo staging. Si attiva **una volta per copia del repo**:

  ```
  git config core.hooksPath tools/hooks
  ```

## Com'è fatta la cartella

| File | Cosa contiene |
|---|---|
| `ordine.txt` | l'elenco dei file, nell'ordine in cui finiscono in `index.html` |
| `testa.html` | da `<!DOCTYPE>` a `<style>`: meta, script del tema, librerie dai CDN |
| `css/<area>/NNN-….css` | il CSS, per area (47 file) |
| `corpo.html` | da `</style>` a `<script>`: tutto l'HTML del body |
| `js/<area>/NNN-….js` | il JavaScript, per area (167 file) |
| `coda.html` | `</script></body></html>` |

## Le aree (fase B, 19/11)

| Cartella | Cosa c'è |
|---|---|
| `core` | configurazione, stato, utilità, Supabase, disegno, navigazione, azioni `data-act`, toast e tema, avvio, aggiornamento versione, accessibilità |
| `oggi` | la vista Oggi: Adesso, giornata, «Oggi: N cose da chiudere», Da controllare, la sera per domani, routine |
| `pianifica` | Pianifica settimana/giorno/mese, Battle Plan e wizard, cuscinetti, obiettivi, metodo di Leo, preparazione appuntamenti, «Quando» e spostamenti |
| `smaltisci` | rimaste indietro, chiudi la settimana, togliere, fatta = sparisce, doppioni e «già chiuse», Smaltisci |
| `calendario` | Google Calendar: accesso, lettura, promemoria, appuntamenti, cestino, scelte del calendario |
| `posta` | dalla posta di lavoro, «Da rispondere» |
| `stampa` | PDF della settimana e del giorno, invio al coach |
| `cattura` | aggiungere: campo unico, Plaud, voce, Claude dal server, svuota la testa, collegate |
| `altro` | Tutte, Altro, impostazioni, categorie e aree, guida, mete |

`NNN` è la posizione nella sequenza storica (i pezzi dei file grandi hanno `NNN-kk-`): dentro una cartella i file sono già in ordine di esecuzione. **L'ordine vero è quello di `ordine.txt`**, che resta storico: le aree sono cartelle, non blocchi contigui in `index.html`. Ogni file finisce con un a-capo; `build.js` li unisce così come sono. Dove sta uno strato di una funzione: [docs/MAPPA.md](../docs/MAPPA.md) (numeri di sezione = `NNN`).
