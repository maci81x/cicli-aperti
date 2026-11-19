# PIANO DI RIORDINO di `index.html`

Proposta, non ancora eseguita. `index.html` (commit `948aad8`, v50, 21 798 righe, 1,47 MB) non è stato toccato.
Si appoggia a `docs/MAPPA.md` (catene degli strati, CSS sovrascritto, codice morto).

## 0. Vincoli che il piano deve rispettare

1. **L'app resta un file solo.** Si apre con doppio clic (`file://`, vedi README) e `tests/harness.js` serve `../index.html`. Quindi `index.html` resta nel repo, **generato e committato**: si lavora in `src/`, poi si lancia il build.
2. **Niente dipendenze, niente bundler.** `build.js` usa solo `fs`, `path`, `crypto` di Node. Niente moduli ES (`<script type="module">` non funziona da `file://`), niente npm per costruire.
3. **L'ordine conta.** Gli strati si avvolgono a vicenda (`const _x = fn; fn = function…`): l'ordine di esecuzione è l'ordine delle righe. Ci sono anche:
   - 3 sezioni di primo livello fuori ordine (v5 a riga 8413 dentro v2, «v2 · Agganci alla logica e avvio» dopo v4, v9 prima di v8: MAPPA §1.3);
   - 27 ritocchi retroattivi dentro strati vecchi (MAPPA §3);
   - `function avviaApp` (riga 14774) dichiarata **dopo** il suo primo avvolgimento (riga 13086): funziona solo grazie all'hoisting, quindi **tutto il JS deve restare in un solo `<script>`**.
   - Lo stesso vale per il CSS: 74 selettori ridefiniti e 96 `!important` dipendono dalla cascata, cioè dall'ordine.
4. **Il file è pulito**: solo LF, niente BOM, niente tabulazioni, nessuna riga con spazi in fondo. Si può tagliare per righe e rimettere insieme byte per byte.

Da qui la scelta di fondo: **due fasi separate**.

| Fase | Cosa cambia | Rischio | Prova di correttezza |
|---|---|---|---|
| **1 · Divisione** | solo *dove sta* il codice: `index.html` tagliato in pezzi contigui, rimessi insieme nello stesso ordine | nullo sul comportamento | `sha256(build) == sha256(index.html attuale)` + test |
| **2 · Riordino** | il codice: si tolgono strati morti, si fondono le catene, si raggruppa per area | reale, va fatto a piccoli passi | test (`tests/`) a ogni passo, più quelli nuovi del §4.3 |

## 1. Struttura proposta

```
build.js                  ← unico script di build (Node, zero dipendenze)
index.html                ← GENERATO da build.js: non si modifica a mano (vedi §2.4)
src/
  ordine.txt              ← l'elenco dei pezzi, nell'ordine in cui vanno incollati
  html/
    00-testa.html         ← righe 1–63: <head>, meta, script del tema e degli errori, librerie, «<style>»
    50-corpo.html         ← righe 2636–3498: «</style></head><body>», tutto l'HTML, «<script>»
    99-coda.html          ← righe 21796–21798: «</script></body></html>»
  css/
    base/                 ← token del design system, impalcatura (v1)
    tema/                 ← tavolozze e colori del giorno (v31, v34, v43, v44.1, v50 salvia)
    oggi/  pianifica/  tutto/  smaltisci/  aggiungi/  calendario/  posta/  stampa/  metodo/  altro/
    accessibilita/
  js/
    base/                 ← CONFIG, stato, utilità, Supabase, realtime, navigazione, disegno, AZIONI, avvio
    cose/                 ← la riga, il foglio dettaglio, azioni rapide, passi, swipe e menu «···»
    oggi/  pianifica/  tutto/  smaltisci/  aggiungi/  calendario/  posta/  stampa/  metodo/  altro/
    accessibilita/
```

### 1.1 Perché un elenco (`ordine.txt`) e non l'ordine alfabetico delle cartelle

Le aree si intrecciano nel tempo: la v10 tocca Oggi, Calendario, Aggiungi e Tutto nello stesso blocco. Se l'ordine venisse dalle cartelle, `oggi/` finirebbe tutto prima di `pianifica/` e le catene si romperebbero. Con `ordine.txt` ogni pezzo sta nella cartella della sua area **ma viene incollato al suo posto originale**.

Nome dei file: `NNNN-vXX-breve.js`, dove `NNNN` è la posizione nell'elenco (passo 10, per poter inserire). Così anche dentro una cartella `ls` mostra l'ordine vero.

`ordine.txt` (una riga per file, `#` commenta):

```
html/00-testa.html
css/base/0010-v1-design-system.css
css/base/0020-v1-app.css
css/aggiungi/0030-v3-campo.css
…
html/50-corpo.html
js/base/0500-v1-config-stato.js
js/base/0510-v1-utils.js
…
html/99-coda.html
```

## 2. `build.js`

### 2.1 Cosa fa

| Comando | Effetto |
|---|---|
| `node build.js` | incolla i file di `src/ordine.txt` e scrive `index.html` |
| `node build.js --verifica` | costruisce in memoria e confronta con l'`index.html` presente: esce con errore se diverso (per i test e prima di ogni commit) |
| `node build.js --dividi tagli.json` | **solo fase 1, una volta**: taglia l'`index.html` attuale nei pezzi descritti da `tagli.json` e scrive `src/` + `ordine.txt` |

Controlli di sicurezza: ogni file in `ordine.txt` deve esistere; ogni file di `src/css|js|html` deve comparire in `ordine.txt` (niente pezzi dimenticati); ogni file deve finire con `\n`; dopo il build stampa righe, byte e sha256.

### 2.2 Bozza (≈ 60 righe)

Provata su una copia (19/11): `--dividi` con 8 tagli → build identico (sha256 `e8ef9bc5…aa6b`, 1 473 428 byte); una riga aggiunta a un pezzo → `--verifica` esce con errore; un file non elencato → il build si ferma.

```js
#!/usr/bin/env node
// Build di Cicli Aperti: incolla i pezzi di src/ nell'ordine di src/ordine.txt e scrive index.html.
//   node build.js              scrive index.html
//   node build.js --verifica   confronta con index.html (esce 1 se diverso)
//   node build.js --dividi tagli.json   (fase 1, una volta) taglia index.html in src/
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const R = __dirname, SRC = path.join(R, 'src'), OUT = path.join(R, 'index.html');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const esci = m => { console.error('✗ ' + m); process.exit(1); };

function elenco() {
  return fs.readFileSync(path.join(SRC, 'ordine.txt'), 'utf8').split('\n')
    .map(s => s.replace(/#.*/, '').trim()).filter(Boolean);
}
function tutti(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) tutti(p, acc); else if (/\.(html|css|js)$/.test(e.name)) acc.push(path.relative(SRC, p).split(path.sep).join('/'));
  }
  return acc;
}
function costruisci() {
  const lista = elenco(), visti = new Set();
  const pezzi = lista.map(f => {
    if (visti.has(f)) esci(`${f} compare due volte in ordine.txt`);
    visti.add(f);
    const p = path.join(SRC, f);
    if (!fs.existsSync(p)) esci(`manca ${f}`);
    const b = fs.readFileSync(p);
    if (b.length && b[b.length - 1] !== 0x0a) esci(`${f} non finisce con un a capo`);
    if (b.includes(0x0d)) esci(`${f} contiene CR (a capo Windows)`);
    return b;
  });
  const orfani = tutti(SRC).filter(f => !visti.has(f));
  if (orfani.length) esci('file non elencati in ordine.txt: ' + orfani.join(', '));
  return Buffer.concat(pezzi);
}
function dividi(fileTagli) {
  // tagli.json: [{ "file": "js/base/0500-v1-config.js", "da": 3499, "a": 3611 }, …] righe 1-based incluse
  const tagli = JSON.parse(fs.readFileSync(fileTagli, 'utf8'));
  const righe = fs.readFileSync(OUT, 'utf8').split('\n'); righe.pop(); // l'ultimo \n
  let atteso = 1;
  for (const t of tagli) {
    if (t.da !== atteso) esci(`buco o sovrapposizione prima di ${t.file}: atteso ${atteso}, trovato ${t.da}`);
    const p = path.join(SRC, t.file); fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, righe.slice(t.da - 1, t.a).join('\n') + '\n');
    atteso = t.a + 1;
  }
  if (atteso !== righe.length + 1) esci(`i tagli finiscono a ${atteso - 1}, il file ha ${righe.length} righe`);
  fs.writeFileSync(path.join(SRC, 'ordine.txt'), tagli.map(t => t.file).join('\n') + '\n');
}

const arg = process.argv.slice(2);
if (arg[0] === '--dividi') { dividi(arg[1]); }
const b = costruisci();
if (arg[0] === '--verifica' || arg[0] === '--dividi') {
  const vecchio = fs.readFileSync(OUT);
  if (!vecchio.equals(b)) esci(`diverso: build ${sha(b)} · index.html ${sha(vecchio)}`);
  console.log(`✓ identico · ${b.length} byte · sha256 ${sha(b)}`);
} else {
  fs.writeFileSync(OUT, b);
  console.log(`✓ index.html · ${b.toString('utf8').split('\n').length - 1} righe · ${b.length} byte · sha256 ${sha(b)}`);
}
```

### 2.3 Integrazione con i test

- In `tests/README.md`: prima riga dei comandi `node ../build.js --verifica` (se `index.html` non corrisponde a `src/`, i test proverebbero la versione sbagliata).
- Facoltativo: un hook git `pre-commit` locale (non committato) che lancia `node build.js --verifica`.
- `.gitattributes` con `* text eol=lf` per non far entrare CR se un giorno si modifica da Windows.

### 2.4 Segnalare che `index.html` è generato

Aggiungere un commento in testa a `index.html` cambierebbe i byte, quindi **non nella fase 1**. Nella fase 2 si può mettere `<!-- GENERATO da build.js: modificare src/ -->` dentro `src/html/00-testa.html`. Fino ad allora basta il README.

## 3. Fase 1 · Divisione (meccanica, byte per byte)

### 3.1 Passi

1. Scrivere `tagli.json` (tabelle sotto: un taglio per ogni sezione `// vN ·` / `/* vN · */`, più i sotto-tagli delle sezioni grandi).
2. `node build.js --dividi tagli.json` → crea `src/` e `ordine.txt`, e controlla subito che il build sia identico.
3. `sha256sum index.html` prima e dopo `node build.js` → deve restare `e8ef9bc5933465775a5ef10bd14734d23b2d9ac7267e177f85c039028b13aa6b`.
4. Tutti i test di `tests/` (vedi README).
5. Un commit solo: «Divisione di index.html in src/ (nessun cambiamento di comportamento)».

**Regola della fase 1: un taglio cade sempre tra due righe, mai dentro una funzione o una regola CSS.** I punti di taglio sono le intestazioni di sezione, che stanno tutte in colonna 0 fuori da qualsiasi blocco. I ritocchi retroattivi (MAPPA §3) restano dentro il loro strato.

### 3.2 HTML

| Righe | File |
|---|---|
| 1–63 | `html/00-testa.html` (finisce con la riga `<style>`) |
| 2636–3498 | `html/50-corpo.html` (da `</style>` alla riga `<script>`) |
| 21796–21798 | `html/99-coda.html` |

Il corpo HTML (≈ 860 righe) per ora resta intero: è un solo albero e i fogli/modali sono già raggruppati. Si può dividere in fase 2 con lo stesso meccanismo (`html/51-barra.html`, `html/52-fogli.html`…).

### 3.3 CSS (righe 64–2635) → `src/css/`

| Righe | Strato | Area | File proposto |
|---|---|---|---|
| 64–365 | v1 | base | `base/0010-v1-design-system.css` |
| 366–573 | v1 | base | `base/0020-v1-app.css` |
| 574–741 | v3 | aggiungi / oggi | `aggiungi/0030-v3-campo-rapide.css` |
| 742–935 | v8 | aggiungi | `aggiungi/0040-v8-ricordami-plaud.css` |
| 936–1056 | v4 | pianifica | `pianifica/0050-v4-giorno-cuscinetti.css` |
| 1057–1213 | v5 | metodo | `metodo/0060-v5-itime.css` |
| 1214–1344 | v6 | pianifica | `pianifica/0070-v6-colonne-riordina.css` |
| 1345–1524 | v9 | calendario / oggi | `calendario/0080-v9-appuntamenti.css` |
| 1525–1676 | v10 | aggiungi | `aggiungi/0090-v10-snella.css` |
| 1677–1976 | v11–v28 (piccole) | varie | un file per strato: `tutto/0100-v11-togliere.css`, `oggi/0110-v12…`, … `aggiungi/0270-v28…` |
| 1977–2023 | v29–v30 | calendario | `calendario/0280-v29-preparare.css`, `calendario/0290-v30-da-rivedere.css` |
| 2024–2250 | v31–v33 | tema / telefono / computer | `tema/0300-v31-carta.css`, `base/0310-v32-telefono.css`, `base/0320-v33-computer.css` |
| 2251–2331 | v34, v39–v42 | tema / pianifica | `tema/0330-v34-colori-giorno.css`, … |
| 2332–2461 | v43, v44, v44.1, v46 | tema / pianifica | `tema/0370-v43-carta-salvia.css`, `pianifica/0380-v44…`, `tema/0390-v44_1…`, … |
| 2462–2604 | v47–v49 | pianifica / smaltisci / oggi | `pianifica/0410-v47-foglio-leo.css`, `aggiungi/0420-v48…`, `smaltisci/0430-v49-smaltisci.css`, `oggi/0440-v49…`, `pianifica/0450-v49…` |
| 2605–2635 | v50 | tema / oggi / accessibilità | `tema/0460-v50-salvia.css`, `oggi/0470-v50-schede.css`, `accessibilita/0480-v50.css` |

(Le righe esatte di inizio di ogni strato sono le intestazioni elencate in MAPPA; `tagli.json` le userà una per una.)

### 3.4 JS (righe 3499–21795) → `src/js/`

Sezioni piccole: un file per sezione `// vN ·`. Sezioni grandi e miste: tagliate ai loro sottotitoli.

| Righe | Sezione | Area |
|---|---|---|
| 3499–6480 | **v1 legacy** (2 982 righe), tagliata ai suoi titoli: CONFIG/INIT/STATE (3504), UTILS (3612), SUPABASE CRUD + REALTIME (3701), NAVIGATION…SIDEBAR (3840), CATEGORIE + PERSONA CHIPS (3922), MODAL CICLO (4044), PLAUD (4279), API KEY…GUIDA (4309), AVVIO (4505), BATTLE PLAN costanti (4535), DATE/MACRO AREA/AUTO-CAT (4581), GOOGLE CALENDAR (4663), viste mobili + posticipa (4978), AGENDA SETTIMANALE (5106), PIANIFICA CICLO, RITUALI, BATTLE PLAN (fino a 6480) | base · aggiungi · calendario · pianifica |
| 6481–6699 | v2 linguaggio, stato UI, toast/tema, navigazione | base |
| 6700–6903 | v2 disegno, righe di un giorno | base · pianifica |
| 6904–6964 | v2 appuntamenti (sola lettura) | calendario |
| 6965–7443 | v2 azioni rapide, foglio dettaglio, categorie e filtri, swipe e menu | cose |
| 7444–7524 | v2 OGGI | oggi |
| 7525–7718 | v2 PIANIFICA | pianifica |
| 7719–7833 | v2 TUTTO | tutto |
| 7834–7948 | v2 ALTRO | altro |
| 7949–8110 | v2 chiudi / prepara la settimana | smaltisci · pianifica |
| 8111–8403 | v2 rimaste indietro, settimane passate | smaltisci · altro |
| 8404–8662 | v2 stampa + **v5 foglio i-Time** (fuori ordine: resta qui) | stampa |
| 8663–8927 | v2 prima apertura, EVENTI (`AZIONI`), aiuto | base · altro |
| 8928–9218 | v2 riconciliazione Calendar, chip dei giorni | calendario · pianifica |
| 9219–9726 | v3 (colonne, rapide, le tue 3, delega, campo «+», venerdì, fine giornata, impostazioni) | oggi · smaltisci · aggiungi · pianifica · altro |
| 9727–10292 | v4 coaching (giorno ora per ora, cuscinetti, passi, blocca in agenda, invia al coach, chiudi la settimana, impostazioni) | pianifica · cose · calendario · stampa · smaltisci · altro |
| 10293–10331 | **v2 agganci e avvio** (fuori ordine: resta qui) | base |
| 10332–11722 | v5 i-Time (metodo, aree, Calendar, cuscinetti, promemoria, banner, Q2, delega, svuota la testa, chiudi la settimana, esercizio Q2, impostazioni, azioni e avvio) | metodo · calendario · pianifica · smaltisci · aggiungi · base |
| 11723–12648 | v6 (926 righe) tagliata ai sottotitoli 3./5a./5b./2./4./7. | aggiungi · cose · calendario · pianifica · tutto · metodo |
| 12649–12693 | v7 appuntamenti visibili | calendario |
| 12694–12853 | v8 «Ricordami» a voce | aggiungi |
| 12854–13096 | v9 «Spesa:» (fuori ordine rispetto a v8: resta qui) | aggiungi |
| 13097–13345 | v8 import Plaud | aggiungi |
| 13346–13461 | v9 Claude dal server, pila dei fogli | base |
| 13462–13855 | v9 appuntamenti toccabili, avviso all'ora detta | calendario |
| 13856–13941 | v9 Oggi sul telefono | oggi |
| 13942–16045 | **v10 calendario di scrittura** (2 104 righe), tagliata a: doppioni (14234), «C'è già» (14431), accesso (14664), appuntamenti riletti (14886), 18 principi (15004), mete (15263), tempo per il futuro (15344), fallo subito (15483), timer (15651), sera/deleghe (15710), altro/guida/avvio (16019) | calendario · tutto · base · metodo · aggiungi · smaltisci · altro |
| 16046–17003 | v10 snella (958 righe), tagliata ai sottotitoli «3 ·», «1 ·», «2 ·», «Passo 2» | aggiungi · tutto · pianifica |
| 17004–18292 | v11–v20, un file per strato | tutto · oggi · cose · calendario · smaltisci · aggiungi · posta (v19) · base (v20) |
| 18293–18764 | v21 settimana da oggi + giornata stampata, v22 giorni in vista, v23 da rispondere, v24 altri/tempo tuo | pianifica · stampa · posta · calendario |
| 18765–18900 | v25 menu col ritmo | base |
| 18901–19646 | **v26 metodo di Leo** (746 righe), tagliata a: non si sposta (18913), obiettivi (19057), mail a Leo (19137), foglio di un giorno (19221), chiudi la giornata (19487) | metodo · calendario · stampa · smaltisci |
| 19647–19798 | v27 dopo una Subito, v28 lavoro/personale e dettatura | aggiungi |
| 19799–20346 | v29 tempo per preparare gli appuntamenti, v30 promemoria | calendario |
| 20347–20689 | v31 carta di precisione, v32 telefono, v33 computer | base · metodo |
| 20690–21033 | v37, v39, v40, v40.1, v40.2, v41, v42 | tutto · base · pianifica · smaltisci |
| 21034–21256 | v43, v44, v45, v46 | oggi · pianifica · smaltisci |
| 21257–21463 | v47 foglio di Leo, v48 più pratica | pianifica · cose · stampa |
| 21464–21674 | v49 Smaltisci, Da controllare, Pianifica a schede | smaltisci · oggi · pianifica |
| 21675–21773 | v50 sfondo salvia, Oggi a schede | oggi |
| 21774–21795 | v50 accessibilità | accessibilita |

Stima: ~45 file CSS, ~150 file JS. Nessun file sopra le ~400 righe.

## 4. Fase 2 · Riordino (dopo che la fase 1 è nel repo)

Ogni passo: un commit, `node build.js`, tutti i test, e — finché non si vuole cambiare il comportamento — nessuna differenza visibile negli screenshot dei test.

### 4.1 Ordine consigliato (dal meno rischioso)

1. **Togliere gli strati sostituiti** (MAPPA §2, 38 casi): il loro corpo non gira più. Per ognuno, prima controllare che nessun alias catturato prima (`_xBase`, `_xV4`…) sia chiamato altrove. Solo cancellazioni.
2. **Togliere le funzioni mai chiamate** (MAPPA §6.1, 22) e l'azione `v40-tutte`; poi rifare l'analisi per trovare quelle morte "di secondo livello".
3. **Togliere le classi CSS senza elementi** (MAPPA §6.3, 19), una regola alla volta, guardando gli screenshot.
4. **CSS: fondere i selettori ripetuti** (MAPPA §4): per ogni selettore tenere una sola regola con i valori che oggi vincono, nel punto dell'ultima definizione. Le tavolozze (`html:root` v31→v34→v43→v44.1) diventano un solo blocco di variabili in `css/tema/`.
5. **Ridurre gli `!important`** (MAPPA §5, 96, quasi tutti da v43 in poi): spesso servono solo a battere una regola vecchia che al punto 4 sparisce.
6. **Fondere le catene di avvolgimenti** (MAPPA §1), una funzione alla volta, partendo dalle corte. Il risultato è una sola definizione, scritta nel file dell'area, nel punto dell'ultimo strato.
   Attenzione prima di fondere: se tra due strati c'è codice che **viene eseguito al caricamento** e chiama la funzione (es. `v42Etichetta();` a livello di file, `render()` all'avvio), quel codice oggi vede la versione intermedia. Va cercato prima di ogni fusione (`grep` del nome a colonna 0 fuori dalle funzioni).
7. **Raggruppare per area**: quando un'area non ha più catene che la attraversano, i suoi file si possono fondere e spostare in blocco in `ordine.txt`.
8. Per ultimo, `avviaApp` e gli altri casi che dipendono dall'hoisting: spostare la dichiarazione sopra il primo uso.

### 4.2 Cosa non fare

- Non passare a moduli ES o a più `<script>`: si rompe `file://` e si rompe l'hoisting di `avviaApp`.
- Non introdurre un bundler (esbuild, Vite…): cambia i byte e il comportamento del codice "sloppy" (variabili globali implicite, `function` dentro blocchi).
- Non riordinare e modificare nello stesso commit: o si sposta, o si cambia.

### 4.3 Reti di sicurezza da aggiungere (prima della fase 2)

- `tests/t-globali.js`: apre l'app e salva l'elenco delle funzioni globali (`Object.keys(window)` di tipo function) e delle chiavi di `AZIONI`; confronta con un elenco atteso salvato nel repo. Un riordino che fa sparire o rinomina un globale lo dice subito.
- `tests/t-catene.js`: per le funzioni più avvolte (`vistaOggi`, `disegna`, `riga`, `avviaApp`, `disegnaAnteprima`…) salva l'HTML prodotto su qualche stato tipico (seed di `harness.js`) e lo confronta prima/dopo la fusione ("golden master").
- Screenshot di riferimento di `smoke.js` (telefono e computer) confrontati pixel per pixel nei passi CSS.
- `node build.js --verifica` come primo comando dei test.

## 5. Rigenerare la mappa

L'analisi che ha prodotto `docs/MAPPA.md` (catene, sostituzioni, ritocchi, CSS ripetuto, `!important`, codice morto) è uno script Node senza dipendenze. Con la fase 1 conviene metterlo nel repo come `tools/mappa/analizza.js` + `tools/mappa/scrivi.js`, adattato a leggere `index.html` generato (i numeri di riga restano quelli del file costruito) e ad aggiungere a ogni riga il file di `src/` da cui viene.
