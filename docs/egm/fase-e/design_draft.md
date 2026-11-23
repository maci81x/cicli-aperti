# Fase E — CSS: una tavolozza, un selettore una volta, meno `!important`

*   **Author:** Roby
*   **Status:** Fatto (23/11). Esito: tavolozza, classi `rap-*`, 4 unioni dentro i file e 39 dichiarazioni coperte; **nessun `!important` tolto** (col criterio di E4 ognuno dei 95 ha un concorrente) e E3 in un solo commit (le unioni possibili erano 4). Dettagli in [casi.md](casi.md) e in [STATO_RIORDINO.md](../../STATO_RIORDINO.md). Review: [goldfish_review_report.md](goldfish_review_report.md)
*   **Date:** 2026-11-23
*   **Contesto:** [PIANO_RIORDINO.md](../../PIANO_RIORDINO.md) (fase E), [fase C](../fase-c/design_draft.md) (variabili coperte già tolte), [fase D](../fase-d/design_draft.md) (forma del piano), [STATO_RIORDINO.md](../../STATO_RIORDINO.md). Ramo `riordino/fase-e` da `main` a `1bf722d` (v52 + fasi C e D, pubblicato).

--------------------------------------------------------------------------------

## Overview

Il CSS è in 47 file di `src/css/<area>/` (2.058 regole, 6.681 dichiarazioni, 219 KB), scritti a strati come il JavaScript. La fase E lo ordina **senza cambiare l'aspetto**: variabili della tavolozza (`--bg`, `--surface`, `--q1`…) in un posto solo per tema chiaro, scuro e contrasto alto; ogni selettore definito una volta per file e contesto quando unirlo è dimostrabilmente sicuro; `!important` tolto solo dove nessuna regola del foglio potrebbe approfittarne; via le regole delle classi che nessuno disegna più (`.rap-voce`, `.rap-sintesi`, `.rap-passi`).

## Vincoli dati da Roby (23/11)

*   Ramo `riordino/fase-e` da `main`; ciclo EGM; dopo ogni commit tutte le prove, golden e caratterizzazione, schermate entro la soglia.
*   Tavolozza unica di token, tema scuro compreso; un selettore definito una volta; meno `!important`; classi senza disegno (con i due `querySelectorAll` della v17).
*   A fine fase: `VERSIONE_APP` «2026-11-xx v53 riordino», `NOTE_LOGICA.md`, `docs/MAPPA.md`, `docs/STATO_RIORDINO.md`, drift report. Niente unione né pubblicazione senza ok.
*   Semplificazioni dentro `vistaOggi` e le altre catene: solo annotate in STATO.

## Stato di partenza (misurato)

| Cosa | Numero |
|---|---|
| Regole / dichiarazioni | 2.058 / 6.681 |
| Regole della radice con variabili | 16: `core/000-base.css` (`:root` riga 4; `:root, [data-theme="light"]` 34; `[data-theme="dark"]` 39 — queste due con `color-scheme`), `core/001-v3.css` 56-57 (contrasto alto), `calendario/008-v9` 14 (`:root`), `calendario/028-v30` 13, 19, 28, 29 (tavolozza v30 e contrasto), `core/034-v43` 4, 22, `core/036-v44.1` 2, 9, `core/043-v50` 2, `pianifica/023-v26` 16 (dentro `@media (prefers-color-scheme: dark)`) |
| Variabili locali di componenti (restano) | `.futuro`, `.futuro-chip`, `.sn-futuro` e varianti (`calendario/008`, `cattura/009`) |
| Selettori singoli definiti più volte nello stesso contesto | 75 (164 occorrenze), anche tra file diversi (es. `.spazio-riga` ×4) |
| `!important` | 95 (28 in `pianifica/042-v49`, 22 in `oggi/044-v50`, 13 in `core/001-v3`) |
| Classi senza elementi | `.rap-voce`, `.rap-sintesi`, `.rap-passi` |

Ipotesi su cui poggia E2 (verificate): `data-theme` (`light` | `dark`) e `data-contrast` stanno **solo** su `<html>` (`src/testa.html:29,34`, `js/core/003…:49`, `js/altro/034-v3…:7-8`) e `data-theme` è sempre impostato da uno script sincrono prima del CSS; nessuna variabile `--x` è dichiarata su `body`, `#app` o in `@media` di larghezza o stampa. JavaScript scrive sulla radice, come stile in linea, solo `font-size` (scala del testo) e `--v47-h`; cambia a runtime gli attributi `data-theme` e `data-contrast`.

## Rete di sicurezza in più

1.  **`tools/riordino/variabili.js` a 8 stati**: tema chiaro/scuro × contrasto sì/no × tema del sistema chiaro/scuro (`colorScheme` di Playwright); `data-theme` sempre impostato (lo stato «senza attributo» di prima sparisce: non esiste nell'app).
2.  **`tools/riordino/stili.js`** (fatto): con i dati di `tests/dati-golden.js` (seme, ora e viste di `t52`, spostati lì e richiesti da `t52`, che resta uguale) apre **80 scenari** e salva `getComputedStyle` di ogni elemento della pagina (tutte le proprietà dell'elenco del browser; `::before`/`::after` quando hanno `content`, `::placeholder` sui campi con segnaposto, `::marker` sugli elementi `list-item`). Chiave dell'elemento: percorso di indici dei figli da `<html>` (l'HTML non cambia nella fase E) più il tag. Transizioni e animazioni spente con un foglio aggiunto.

    | Gruppo | Dispositivi | Temi | Viste |
    |---|---|---|---|
    | base | telefono (iPhone 13), computer 1440 | chiaro, scuro | le 8 viste di `t52` + dettaglio di `i`, dettaglio del passo `ps` (aggiunto solo qui), «+» con testo, «Quando» di `w` |
    | medio | 900 px (tra 768 e 1100) | chiaro, scuro | oggi, settimana, giorno, lista, dettaglio |
    | contrasto alto | computer / telefono | chiaro, scuro | oggi, settimana, smaltisci, dettaglio / oggi, settimana |
    | sistema scuro | computer | chiaro, scuro | oggi, settimana, dettaglio |
    | testo 125% | telefono | chiaro | oggi, settimana |
    | stampa | computer (`emulateMedia print`) | chiaro | oggi, settimana |

    Formato: `{ liste: [elenchi di proprietà], stili: [stringhe di valori], scenari: { nome: { p, el: { chiave: { t, s } } } } }` (~105 MB, nella cartella temporanea). `--confronta prima.json dopo.json` stampa `scenario chiave <tag> proprietà: «prima» → «dopo»` e `differenze: N`, uscita 1 se N > 0. **Verificato**: due giri su `main` → 0 differenze; un colore cambiato di un'unità in `.v52-madre` (solo tema scuro) → 3 differenze, nei fogli dove la fascia esiste.
3.  Riferimento: `stili.js` e `variabili.js` lanciati su `1bf722d` e salvati in `$T/rif/` (fuori dal repo; si rigenerano in 3 minuti da quel commit).

`stili.js` fotografa stati fermi: non vede `:hover`, `:focus`, animazioni in corso, classi messe da JS in momenti particolari. Per questo E3 ed E4 hanno **regole statiche che non dipendono dagli elementi** (sotto); `stili.js` serve a scoprire errori degli script.

## Technical Plan

### E1 · Classi senza disegno

*   CSS, regola per regola (alcune righe ne hanno due): `css/cattura/002-v8-riepilogo-della-frase-sotto-il-campo.css` righe 3-5 e 9-11, `css/altro/005-v5-metodo-i-time.css` riga 5.
*   JS: `.rap-voce[data-i]` esce dai due `querySelectorAll` di `js/cattura/081-v17-collegate-mentre-scrivi-o-detti-se.js` (passi 1 e 3 di `disegnaAnteprima`); in `js/cattura/066-v9-…js:100` si toglie il ramo di `correggiVoce` che cerca `#rapido-anteprima .rap-voce … .rap-sintesi span` (sempre `null`).
*   Restano: `.rap-edit` (la disegna `editorVoce`, usata da `htmlVoceSn`; la leggono `js/smaltisci/074…:294` e `css/cattura/009-v10`).

### E2 · Una tavolozza

Script `tools/riordino/css_riordina.js tavolozza`:

1.  raccoglie tutte le dichiarazioni `--x` delle 16 regole della radice, con specificità, posizione, contesto (`@media`) e testo del valore;
2.  per ognuno dei 4 stati dell'app (tema × contrasto; la regola `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` di `pianifica/023-v26:16` non vale mai: con il tema scuro perde contro `html:root[data-theme="dark"]` di `036-v44.1:9`, che dichiara le stesse tre variabili, e con il tema chiaro non si applica) calcola **il testo che vince** per ogni variabile, con le regole della cascata;
3.  scrive `src/css/core/000-tavolozza.css` (nuovo, primo dei CSS in `ordine.txt`):
    ```css
    :root { …ogni variabile col testo che vince nel tema chiaro… }
    :root[data-theme="dark"] { …le variabili il cui testo vincente cambia nel tema scuro… }
    :root[data-contrast="alto"] { …quelle che cambiano col contrasto alto, tema chiaro… }
    :root[data-theme="dark"][data-contrast="alto"] { …quelle che con tema scuro + contrasto differiscono da ciò che darebbero i blocchi sopra… }
    ```
    I testi restano quelli dichiarati (`var(--text-2)` resta `var(--text-2)`): i legami tra token documentati in `DESIGN_SYSTEM.md` non si perdono;
4.  toglie le dichiarazioni `--x` dalle 16 regole e la regola `@media` di `023`; le regole rimaste vuote spariscono; `color-scheme` e le altre proprietà restano dove sono.

La posizione del nuovo file non conta: le variabili della radice le dichiarano solo queste regole e tutte colpiscono solo `<html>` (ipotesi sopra). Criterio: `variabili.js` uguale negli 8 stati; `stili.js` 0 differenze.

### E3 · Un selettore definito una volta (dentro lo stesso file)

Script `css_riordina.js unisci`. Per ogni file e ogni contesto (`@media` identici, testo normalizzato), i selettori singoli definiti in più regole:

*   **Dove**: le dichiarazioni della prima occorrenza si spostano nella regola dell'ultima occorrenza (in testa, prima delle sue); se non si può, si prova il contrario (le dichiarazioni dell'ultima in coda alla prima). Una regola con lista di selettori (`a, b { … }`) partecipa solo se tutta la lista è uguale.
*   **Quando è sicuro** (controllo statico, vale per qualsiasi elemento): per ogni dichiarazione spostata, nessuna regola X **in qualsiasi contesto** che stia tra le due posizioni nell'ordine finale del foglio ha una dichiarazione con **stessa importanza**, **stessa specificità** del selettore e **proprietà della stessa famiglia**. Specificità calcolata con `postcss-selector-parser` (`:is`/`:not`/`:has` = massimo degli argomenti, `:where` = 0, pseudo-elementi come tipi). Non si cerca di dimostrare che X colpisce elementi diversi.
*   **Famiglie** (due proprietà interferiscono se hanno la stessa famiglia): `all` interferisce con tutto; variabili `--x` solo con sé stesse; poi famiglia = `margin`, `padding`, `border` (anche `border-radius`, `border-image`), `outline`, `background`, `font` (anche `line-height`), `text` (tutte le `text-*`), `flex`, `grid` (anche `gap`, `row-gap`, `column-gap`), `place` (`align-*`, `justify-*`, `place-*`), `inset` (`top`, `right`, `bottom`, `left`), `transition`, `animation`, `overflow`, `list`, `columns`, `mask`, `scroll`, `inline`/`block` (dimensioni logiche), `min`/`max` con la dimensione (`width`, `min-width`, `max-width` insieme; idem altezza); per le altre il nome stesso. Il prefisso `-webkit-` si ignora.
*   **Ordine** nella regola unita: le dichiarazioni nell'ordine in cui comparivano (prima quelle della prima occorrenza); una proprietà ripetuta identica (stesso nome) resta una volta sola, quella che vinceva (l'ultima a parità di importanza, altrimenti quella `!important`). Longhand e shorthand non si toccano.
*   Un unico giro per file; i casi non unibili restano e vanno nel report `docs/egm/fase-e/casi.md` (selettore, file, regola X che blocca).
*   Tra file diversi **non** si unisce (sarebbe spostare regole tra file, e anticipa la sistemazione per area del PIANO): i selettori ripetuti tra file restano elencati in `casi.md`.

### E4 · Meno `!important`

Script `css_riordina.js importanti`. Togliere `!important` da D (selettore S, proprietà P, specificità s) cambia il risultato solo se un'altra dichiarazione O della stessa famiglia, su un elemento colpito da S, batterebbe D senza `!important` e non con. Si toglie **solo se, nell'intero foglio e in qualsiasi contesto**:

1.  nessuna dichiarazione O normale della stessa famiglia ha specificità > s, o = s e viene dopo;
2.  nessuna dichiarazione O `!important` della stessa famiglia ha specificità < s, o = s e viene prima;
3.  la famiglia di P non è scritta in linea da JavaScript o dai template (`el.style.X`, `style.setProperty`, ogni proprietà di ogni attributo `style="…"` in `src/js` e `src/corpo.html`, anche quelli costruiti con `${…}`: se un attributo non si legge per intero, vale come «tutte le proprietà»);
4.  P (o la sua famiglia) non è animata da nessun `@keyframes` (`!important` batte le animazioni, una dichiarazione normale no: es. `.item.lampo` anima `background-color` e `box-shadow`);
5.  D non sta in `@media print`, `@media (prefers-reduced-motion…)`, né su selettori universali o di stato del documento (`*`, `[hidden]`).

Non dipende dagli scenari. Ne usciranno pochi; gli altri restano con il motivo in `casi.md`. In più, **dichiarazioni che non valgono mai**: D è coperta se esiste O con selettore `html:root S` (che colpisce gli stessi elementi con specificità maggiore), stesso contesto, stessa proprietà e importanza ≥ quella di D, oppure se O ha lo stesso selettore, stessa proprietà, viene dopo e ha importanza ≥ (questo caso lo risolve già E3 dentro un file). Le dichiarazioni coperte si tolgono intere.

## Detailed Implementation Plan

Prerequisiti: `git config core.hooksPath tools/hooks`; `cd tools/mappa && npm i` (acorn, postcss, postcss-selector-parser); dipendenze delle prove in `tests/node_modules`. `$T` = cartella temporanea fuori dal repo. Comando unico delle prove (dalla radice; passa solo con `TOTALE 32/32`):

```sh
cd tests && export NM="$PWD/node_modules" OUT=$T; n=0; ok=0
for f in smoke.js t*.js; do n=$((n+1)); node "$f" > "$T/${f%.js}.log" 2>&1 && ! grep -q '^FAIL' "$T/${f%.js}.log" && ok=$((ok+1)) || echo "NO $f"; done
echo "TOTALE $ok/$n"; cd ..
```

Riferimento (una volta, su `1bf722d`): `node tools/riordino/stili.js . $T/rif/stili.json && node tools/riordino/variabili.js . $T/rif/variabili.json`.

Per ogni commit:

1.  modifica (script o a mano per E1), `node build.js`;
2.  `node tools/riordino/stili.js . $T/dopo.json && node tools/riordino/stili.js --confronta $T/rif/stili.json $T/dopo.json` → `differenze: 0`; `node tools/riordino/variabili.js . $T/var.json && diff $T/rif/variabili.json $T/var.json` → nessuna riga;
3.  prove → `TOTALE 32/32` (`t52` 16 HTML uguali, schermate 0,000%, nessun avviso; `t54` uguale; `t51` uguale);
4.  `git add src index.html [docs/egm/fase-e/casi.md]` e commit.

Se `stili.js` dà differenze: si guarda quale regola tocca l'elemento/proprietà indicati; per E3/E4 lo script ha `--solo <file>` per rifare il giro su un file, e si dimezza per area finché si trova la modifica colpevole; la si esclude (`--escludi <selettore>`), si annota in `casi.md` e si ripete. Nessuna differenza viene accettata.

| # | Commit | Note |
|---|---|---|
| 0 | `tests: dati del golden in un file; stile calcolato e variabili in 8 stati per la fase E` | `tests/dati-golden.js`, `harness.js` (`colorScheme`), `stili.js`, `variabili.js`, `css_riordina.js`; 32/32 |
| 1 | `refactor: fase E, via le classi rap-* senza elementi` | E1 |
| 2 | `refactor: fase E, una tavolozza di token` | E2 |
| 3 | `refactor: fase E, un selettore una volta (<area>)` | E3, un commit per area nell'ordine di `ordine.txt` (core, cattura, pianifica, …), aree senza unioni saltate |
| 4 | `refactor: fase E, meno !important` | E4 + dichiarazioni coperte |
| 5 | `docs: chiusura del riordino (v53)` | `VERSIONE_APP` «2026-11-xx v53 riordino», NOTE_LOGICA, MAPPA rigenerata, STATO, drift report; ci si ferma per l'ok |

## Non-Goals

*   Cambiare un colore, una misura o un comportamento.
*   Spostare regole tra file, rinominare classi, unire file (la sistemazione «un file per area» del PIANO resta per dopo).
*   Toccare le variabili locali dei componenti o gli stili in linea di JavaScript.
*   Le semplificazioni di `vistaOggi` e le ~150 catene: annotate in STATO.

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Stati non fotografati (`:hover`, `:focus`, animazioni, classi messe da JS, fogli rari) | E2 è verificata sulla radice in tutti gli stati; E3 ed E4 hanno regole statiche valide per qualsiasi elemento; `stili.js` controlla gli errori degli script |
| Famiglie di proprietà incomplete | tabella esplicita, prudente (raggruppa più del necessario); `stili.js` |
| Specificità calcolata male | `postcss-selector-parser`; `stili.js` |
| Punti di rottura 768/1100 | scenari a 390 (telefono), 900, 1440 |
| La tavolozza perde i legami tra token | si spostano i testi dichiarati, non i valori calcolati |
| Risultati instabili | due giri su `main` = 0 differenze (verificato) |
| `!important` che serve contro stili in linea o animazioni | condizioni 3 e 4 di E4 |

## Alternatives Considered

### Tavolozza dai valori calcolati
Più semplice da generare, ma trasforma `var(--text-2)` in colori fissi ripetuti per stato: scartata.

### Unire anche tra file
Chiesto da «un selettore definito una volta», ma sposta regole tra file e la sicurezza dipende da più regole in mezzo: rinviato, elencato in `casi.md`.

### E4 basata sugli elementi degli scenari
Rimuoverebbe di più, ma non vede `:hover`, animazioni, classi di stato: scartata per il criterio statico.
