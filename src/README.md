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
| `css/NNN-vX-….css` | il CSS, un file per ogni sezione di versione (47) |
| `corpo.html` | da `</style>` a `<script>`: tutto l'HTML del body |
| `js/NNN-vX-….js` | il JavaScript, un file per ogni sezione di versione (115) |
| `coda.html` | `</script></body></html>` |

`NNN` è solo la posizione, `vX` la versione che ha introdotto la sezione. Ogni file finisce con un a-capo; `build.js` li unisce così come sono. La divisione per area (oggi, pianifica, smaltisci…) è la fase B del piano.
