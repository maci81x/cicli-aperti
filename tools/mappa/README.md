# tools/mappa

## Overview

Strumento di sviluppo (Node.js, fuori dall'app) che fa un'**analisi statica** di
`index.html` e ne ricava `docs/MAPPA.md`: le funzioni avvolte a strati
(`const _x = fn; fn = …`), gli strati che sostituiscono senza richiamare il
precedente, i selettori CSS ripetuti, i `!important` per versione, le funzioni
mai chiamate e le classi CSS senza elementi. Serve come base per il riordino
descritto in [`docs/PIANO_RIORDINO.md`](../../docs/PIANO_RIORDINO.md).

La pipeline ha due passi:

1. `analizza.js` legge `index.html` e stampa su stdout un JSON (`report.json`).
2. `genera_mappa.js` legge `report.json` e scrive il Markdown di `docs/MAPPA.md`.

Non fa parte del codice dell'app: non viene caricato da `index.html` e non
tocca Supabase.

## Interface

- `package.json` — pacchetto privato `cicli-aperti-mappa`; dipendenze `acorn`,
  `acorn-walk`, `postcss`; script `mappa`:
  `node analizza.js ../../index.html > report.json && node genera_mappa.js report.json ../../docs/MAPPA.md $(git rev-parse --short HEAD)`.
- `analizza.js` — CLI: `node analizza.js <file.html> > report.json`.
  - `blocchi(tagOpen, tagClose)`: trova i blocchi `<script>` / `<style>` inline
    (tag da soli su una riga).
  - `versioneDi(line)`: versione (`vNN`) dall'ultimo marcatore di sezione
    `// vNN` (o `// ║ PARTE 1`) a colonna 0 prima della riga.
  - `commentoSopra(line)`, `commentoDentro(node)`, `commentoVicino(line)`:
    estraggono il commento usato come «cosa aggiunge» di uno strato.
  - `identificatoriUsati(node)`: insieme degli identificatori usati in un nodo AST.
  - Output JSON (chiavi top-level): `blocchi`, `marcatori`, `nFunzioni`,
    `nAlias`, `nRiassegnazioni`, `cateneMulti`, `doppie`, `morte`,
    `css` (`regole`, `important`, `importantPerVer`, `ripetuti`, `classiMorte`, `idMorti`).
- `genera_mappa.js` — CLI: `node genera_mappa.js <report.json> <out.md> <commit>`;
  scrive `out.md` con le sezioni «In breve», 1–5 e «Come rigenerare».
  - `md(s)`: escape per celle di tabella Markdown (`|`, a capo, linee `─`).
  - `cosa(s)`, `tipoBreve(t)`: formattano la colonna «Cosa aggiunge» e «Tipo».
  - `verificateDinamiche`: elenco fisso di classi composte a runtime, verificate a mano (`p-q1`, `p-q3`, `p-q4`, `chip-q1`…`chip-q3`, `t-q1`…`t-q4`, `v17-q1`…`v17-q4`), escluse dalle «classi CSS senza elementi». Una classe nuova costruita con `${…}` va aggiunta qui a mano.

## Collegamento con src/

`docs/MAPPA.md` dà i numeri di riga di `index.html` (generato). Per trovare il file da modificare: la versione indicata nella mappa corrisponde al file `src/js/<area>/NNN-vX-….js` della stessa versione (cartella per area dalla fase B); in alternativa `grep -rn "nomeFunzione = \|function nomeFunzione" src/js/`. L'analisi si fa su `index.html` perché è il file che gira davvero.

## Invariants

- Il JavaScript analizzato è il blocco `<script>` **più lungo** (`mainJs`); il CSS
  è il **primo** blocco `<style>` (`styles[0]`). I tag `<script>`/`</script>` e
  `<style>`/`</style>` devono stare da soli su una riga, altrimenti `blocchi()`
  non li vede.
- Il JS viene parsato con `acorn` (`ecmaVersion: 'latest'`, `sourceType: 'script'`):
  un errore di sintassi in `index.html` fa fallire `analizza.js`.
- Le versioni dipendono dai commenti marcatore a colonna 0 (`// vNN …`,
  `// --- … (vNN)`, `/* … vNN … */` nel CSS): cambiarne il formato cambia
  l'attribuzione delle versioni nella mappa.
- Una funzione è «morta» se non ha riferimenti JS reali (esclusi dichiarazione e
  alias `const _x = fn`) e il suo nome non compare nell'HTML né in alcuna stringa
  o template JS. Chiamate costruite per nome (`window[nome]()`) non sono viste.
- `genera_mappa.js` esce con codice `2` se mancano `report.json` o il percorso di
  output.
- `genera_mappa.js` contiene testo e numeri fissi riferiti a una versione precisa
  di `index.html` (data «19/11/2026», «v50, 21.798 righe», righe «HTML 2638–3497»,
  righe delle tavolozze in §4.1, filtro `awk -F: '$1<2636'`): vanno aggiornati a
  mano se `index.html` cambia in modo sostanziale.
- `genera_mappa.js` legge `r.blocchi.scripts[1]` come script principale: presume
  che in `index.html` ci siano almeno due blocchi `<script>` inline.

## Side Effects

- `analizza.js`: legge il file HTML passato (`fs.readFileSync`) e scrive solo su
  stdout (nello script `mappa` reindirizzato in `tools/mappa/report.json`).
- `genera_mappa.js`: legge `report.json` e **sovrascrive** il file di output
  (`fs.writeFileSync`), di norma `docs/MAPPA.md`; stampa su stdout
  `scritto <file> <n> righe`.
- Lo script `npm run mappa` esegue `git rev-parse --short HEAD` (richiede di
  trovarsi in un repository git).
- Nessuna chiamata di rete a runtime; `npm i` scarica le dipendenze in
  `node_modules/`.
- `node_modules/`, `report.json` e `package-lock.json` sono ignorati da git
  (`.gitignore` locale).

## Verification

- Run: `cd tools/mappa && npm i && npm run mappa`
- Controllo: `docs/MAPPA.md` rigenerato e `git diff docs/MAPPA.md` coerente con le
  modifiche fatte a `index.html`.
