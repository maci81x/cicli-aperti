# PIANO DI RIORDINO — da un index.html di 21.800 righe a file sorgente per area

> Proposta del 19/11/2026, sul commit `948aad8` (v50). **Stato al 23/11**: fatte le fasi A, B, C, D (pubblicate) ed E (ramo `riordino/fase-e`, v53 riordino); la struttura finale per componenti descritta sotto (`token.css`, `componenti/`, `js/dati/`, `avvio.js`) **non** è stata fatta: i file restano nelle cartelle per area della fase B, la tavolozza è in `src/css/core/000-tavolozza.css`. Cosa è fatto e cosa resta: [STATO_RIORDINO.md](STATO_RIORDINO.md).
> Da leggere insieme a [MAPPA.md](MAPPA.md), che ha i numeri citati qui.

## L'obiettivo, e cosa non deve cambiare

- **Si lavora su file piccoli** (`src/css/…`, `src/js/<area>/…`), divisi per area: oggi, pianifica, smaltisci, calendario, posta, stampa, cattura, altro.
- **Il sito resta un file solo.** GitHub Pages continua a servire `index.html` dalla radice del repo; i test in `tests/` continuano ad aprire `../index.html`. Cambia solo da dove nasce: lo produce `node build.js` mettendo in fila i sorgenti.
- **Nessun cambio di comportamento nelle prime due fasi**: il file ricomposto deve essere *identico byte per byte* a quello di oggi. È verificabile con `cmp`, quindi non c'è niente da collaudare a mano.

## Perché non si può «spostare per area» subito

L'app funziona perché le cose succedono **in un certo ordine**:

| Cosa dipende dall'ordine | Quanto | Esempio |
|---|---|---|
| Strati che avvolgono funzioni (`const _x = fn; fn = function () { … _x() … }`) | 301 riassegnazioni su 161 funzioni, 59 con 2+ strati | `vistaOggi` ha 15 strati da v10 a v50: spostarne uno prima del precedente cambia cosa vede Roby in Oggi |
| Ascoltatori registrati al caricamento (`document.addEventListener` & co.) | 154 chiamate a livello alto | chi si registra prima riceve l'evento prima (`stopPropagation`, `preventDefault`) |
| `const`/`let` usate al caricamento da codice più in basso | 699 dichiarazioni di livello alto | spostare un file prima della `const` che usa = errore TDZ all'avvio |
| Regole CSS con la stessa specificità | 74 selettori ripetuti, 96 `!important`, tre tavolozze sovrascritte | vince l'ultima: cambiare ordine cambia i colori |

Quindi il riordino si fa in due tempi: **prima** si divide il file mantenendo l'ordine esatto (sicuro, meccanico), **poi** si tolgono le dipendenze dall'ordine una alla volta, con i test.

## Struttura finale proposta

```
build.js                     ← ~40 righe, Node puro, nessuna dipendenza
src/
  ordine.txt                 ← l'elenco dei file, nell'ordine in cui finiscono in index.html
  testa.html                 ← <head>, script del tema, CDN (righe 1–63 di oggi)
  corpo.html                 ← </style> … <body> … <script> (righe 2636–3498)
  coda.html                  ← </script></body></html>
  css/
    token.css                ← UNA tavolozza chiara + UNA scura (oggi sono quattro)
    base.css                 ← reset, tipografia, bottoni, campi
    componenti/              ← card, fogli (sheet), toast, chip, nav, menu ···
    oggi.css  pianifica.css  smaltisci.css  calendario.css  posta.css  stampa.css  cattura.css  altro.css
    accessibilita.css        ← v50: focus, contrasto, riduci animazioni
  js/
    core/                    ← config, supabase, state, utils, date, toast, tema, navigazione,
                               disegna(), dispatcher data-act, pila dei fogli, colonne opzionali (v3/v4)
    dati/                    ← cicli (CRUD, realtime), passi, categorie, aree i-Time, doppioni
    oggi/                    ← vistaOggi e i suoi riquadri: Subito, Le tue 3, Rapide, Adesso, Da controllare,
                               fine giornata, routine
    pianifica/               ← settimana, giorno, mese, wizard/Battle Plan, cuscinetti, blocca in agenda,
                               Q2, metodo di Leo, preparare gli appuntamenti, «Scegli tu», trascinamenti
    smaltisci/               ← rimaste indietro, Smaltisci (v49), già fatta? (v41–v42), togliere (v11),
                               chiudi la settimana / riporta il foglio (review)
    calendario/              ← OAuth, lettura dei due calendari, scrittura su Lavoro (v10), riconciliazione,
                               promemoria, appuntamenti toccabili, avviso all'ora detta, eventi nascosti
    posta/                   ← dalla posta di lavoro (v19), «Da rispondere (N)» (v23)
    stampa/                  ← foglio della settimana (i-Time), giornata stampata (v21), PDF al coach
    cattura/                 ← campo «+», «Cosa hai in testa?», ricordami a voce, dettatura, Plaud,
                               Claude dal server, collegate (v17), dopo una Subito (v27)
    altro/                   ← Tutto (Lista/Matrice/Persone), Fatte, Settimane passate, Impostazioni, Guida
    avvio.js                 ← ultimo: avviaApp e tutti gli ascoltatori globali, in un posto solo
tools/mappa/                 ← gli script che generano docs/MAPPA.md («npm run mappa»)
```

Tetto indicativo: 200–400 righe per file, mai oltre 800.

## Lo script di build

Già provato (vedi «Prova fatta»). **Dal 19/11 il codice in vigore è [`build.js`](../build.js) in radice**: rispetto a quello qui sotto ogni pezzo finisce con un a-capo e si uniscono con `join('')`, le voci ripetute in `ordine.txt` danno errore e i file di `src/` non elencati danno un avviso. Legge `src/ordine.txt` e concatena i file con un a-capo tra l'uno e l'altro: nient'altro, così l'uscita è prevedibile.

```js
#!/usr/bin/env node
// Rimette insieme index.html dai file elencati in src/ordine.txt (uno per riga, nell'ordine di esecuzione).
// node build.js           → scrive index.html
// node build.js --check   → esce con 1 se index.html non è quello che uscirebbe dai sorgenti
const fs = require('fs');
const path = require('path');

const RADICE = process.env.RADICE || __dirname;
const SRC = path.join(RADICE, 'src');
const USCITA = path.join(RADICE, 'index.html');

function componi() {
  const elenco = fs.readFileSync(path.join(SRC, 'ordine.txt'), 'utf8')
    .split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('#'));
  const mancanti = elenco.filter(f => !fs.existsSync(path.join(SRC, f)));
  if (mancanti.length) throw new Error('File in ordine.txt che non esistono: ' + mancanti.join(', '));
  return elenco.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
}

try {
  const html = componi();
  if (process.argv.includes('--check')) {
    const attuale = fs.existsSync(USCITA) ? fs.readFileSync(USCITA, 'utf8') : '';
    if (attuale !== html) { console.error('index.html non corrisponde a src/: lancia «node build.js»'); process.exit(1); }
    console.log('index.html è aggiornato');
  } else {
    fs.writeFileSync(USCITA, html);
    console.log(`index.html scritto (${html.split('\n').length} righe)`);
  }
} catch (e) {
  console.error('Build fallita: ' + e.message);
  process.exit(2);
}
```

`ordine.txt` ammette commenti (`# ── oggi ──`), così l'elenco stesso fa da indice dell'app.

**Più avanti, facoltativo**: un'opzione `--marcatori` che mette `/* ── src/js/oggi/adesso.js ── */` all'inizio di ogni pezzo, per ritrovare subito il file sorgente da un errore in console. Non nelle fasi A–B, perché romperebbe l'identità byte per byte.

## Le fasi

### Fase 0 — preparazione (mezz'ora)
1. Far girare tutti i test su `index.html` di oggi e annotare il risultato (è il riferimento).
2. Salvare l'impronta: `shasum -a 256 index.html` → `e8ef9bc5…`.
3. `tools/mappa/` c'è già (commit del 19/11): `cd tools/mappa && npm i && npm run mappa` rigenera MAPPA.md.

### Fase A — taglio meccanico per strato (sicura, ~1 ora) — ✅ fatta il 19/11/2026

> Fatta: 47 file CSS + 115 JS in `src/`, `build.js`, hook `tools/hooks/pre-commit`; `index.html` identico (SHA-256 `e8ef9bc5…aa6b` prima e dopo). Design e review: [docs/egm/fase-a/](egm/fase-a/design_draft.md). Differenze dal testo qui sotto: ogni pezzo finisce con un a-capo e `build.js` li unisce senza separatori; avviso per i file di `src/` non elencati; l'hook controlla anche lo staging.

Un taglio a ogni commento di versione (`// vNN ·` nel JS, `/* … vNN …` nel CSS): **115 file JS + 47 file CSS**, in `src/js/` e `src/css/` con nomi tipo `090-v26-il-metodo-di-leo.js`. `ordine.txt` li elenca nella sequenza di oggi.
- **Verifica**: `node build.js && git diff --exit-code index.html` → nessuna differenza.
- **Cosa si guadagna subito**: si apre il file della versione invece di cercare in 21.800 righe; la storia per versione è leggibile.

### Fase B — cartelle per area, stesso ordine (sicura, ~mezza giornata)
1. I file grandi si tagliano ancora ai loro sotto-titoli (`// ═══…`), sempre a confine di riga:
   - `000-base.js` (2.982 righe, la logica v1) → per le sezioni di NOTE_LOGICA: CONFIG/SUPABASE/STATE, UTILS, CRUD, REALTIME, GOOGLE CALENDAR, BATTLE PLAN…
   - `v10-calendario-di-scrittura` (2.103 righe) → calendario di scrittura · «È una cosa da fare» · doppioni · …
   - `v6` (925), `v10-snella` (957), `v26` (745) allo stesso modo.
2. Ogni file va nella cartella della sua area (tabella sotto). **`ordine.txt` resta nella sequenza storica**: le aree sono cartelle, non blocchi contigui in `index.html`.
- **Verifica**: di nuovo identico byte per byte.
- **Risultato**: chi deve toccare «Oggi» apre `src/js/oggi/` e trova tutti e 15 gli strati di `vistaOggi`, in ordine di nome.

| Area | Sezioni di oggi che ci vanno (versione · titolo) |
|---|---|
| core | v1 config/state/utils/CRUD/realtime/date · v2 linguaggio, toast e tema, navigazione, disegno, eventi data-act, aiuto, chip dei giorni · v3/v4 colonne nuove · v9 pila dei fogli · v20 sempre l'ultima versione · v50 accessibilità (JS) |
| oggi | v2 OGGI · v3 rapide, le tue 3, fine giornata · v9 Oggi sul telefono · v12 Oggi «prima cosa fare» · v25 il menu segue il ritmo · v31 «Adesso» · v32 telefono · v43 · v49 Da controllare · v50 schede |
| pianifica | v1 Battle Plan + wizard · v2 PIANIFICA, prepara la settimana · v4 giorno ora per ora, cuscinetti, blocca in agenda · v5 cuscinetti negli spazi liberi, fine del wizard, Q2 inderogabili, esercizio Q2 · v6 colonne e Riordina · v22 · v26 metodo di Leo · v29 / v29.1 preparare gli appuntamenti · v33 · v37 · v40–v40.2 · v44 · v45 · v46 · v47 · v48 |
| smaltisci | v2 rimaste indietro, chiudi la settimana · v4 / v5 chiudi la settimana · v11 togliere · v14 fatta = sparisce · v16 riporta il foglio · v41 · v42 · v49 Smaltisci · doppioni (v10) |
| calendario | v1 OAuth + sync · v2 appuntamenti (sola lettura), riconciliazione · v5 due calendari, promemoria, appuntamenti che sembrano cicli · v7 · v9 appuntamenti toccabili, avviso all'ora detta · v10 calendario di scrittura = Lavoro · v15 · v18 · v24 · v30 |
| posta | v19 dalla posta di lavoro · v23 «Da rispondere (N)» |
| stampa | v2 stampa la settimana · v5 foglio i-Time · v4 invia al coach · v21 giornata stampata |
| cattura | v1 Plaud · v3 inserimento a un campo · v5 svuota la testa · v8 ricordami a voce, import Plaud · v9 spesa, Claude dal server · v10 snella · v12 cosa hai in testa · v17 collegate · v27 dopo una Subito · v28 dettatura |
| altro | v2 TUTTO, ALTRO, settimane passate, categorie e filtri · v3/v4/v5 impostazioni · v5 aree i-Time, guida · v13 una lista sola |

Dove una sezione mescola due aree (capita in v6, v10, v26) si taglia in due: il taglio è a confine di riga e l'ordine non cambia, quindi l'uscita resta identica.

### Fase C — togliere il codice morto (bassa difficoltà, ~1 giorno, un commit per gruppo)
Da qui `index.html` cambia: ogni commit passa dai test (`tests/`), più il confronto delle schermate (sotto).
1. Le 23 funzioni mai chiamate (MAPPA §5.1), compresa la catena di `apriNuovo`.
2. Le 38 catene troncate (MAPPA §3): base e strati sotto uno strato che **sostituisce**, dopo aver controllato che nessuno chiami l'alias vecchio.
3. Le 23 classi CSS senza elementi (MAPPA §5.2) e le tre tavolozze sovrascritte (v1/v9/v26, v30, v43): resta v44.1 + i ritocchi v50.

### Fase D — appiattire le catene (il lavoro vero, 3–5 giorni a pezzi)
Una funzione alla volta, partendo dalle più lunghe (`vistaOggi` 15, `disegna` 13, `avviaApp` 7, `disegnaAnteprima` 7, `salvaCattura` 6, `riga` 6…):
1. Si scrive **una** `function vistaOggi()` che fa quello che fanno oggi i 15 strati insieme, nel file della sua area.
2. Si cancellano strati e alias `_vistaOggiV12`… .
3. Test + schermate. Un commit per funzione.

Una funzione senza strati è una semplice `function` dichiarata: JavaScript la «solleva», quindi **la sua posizione in `ordine.txt` smette di contare**. Così, catena dopo catena, si conquista la libertà di raggruppare i file per area anche dentro `index.html`.
In parallelo: i 154 ascoltatori globali vanno in `avvio.js`, **nello stesso ordine** in cui si registrano oggi.

### Fase E — CSS per area (2–3 giorni)
Unire i selettori ripetuti (MAPPA §4.2), togliere i prefissi `html:root` usati solo per vincere sulle regole vecchie e, di conseguenza, la maggior parte dei 96 `!important`. Un file per area, poi `ordine.txt` raggruppato: token → base → componenti → aree → accessibilità.

## Come si controlla che non si rompa niente

| Fase | Controllo |
|---|---|
| A, B | `node build.js && git diff --exit-code index.html` — deve uscire 0 |
| C, D, E | tutti i test di `tests/` + **confronto di schermate**: un nuovo test Playwright che fotografa Oggi, Pianifica (Settimana/Giorno/Mese), Smaltisci, Tutto, Altro, tema chiaro e scuro, a 390 px e 1440 px, con `seed` e `ora` fissi dell'harness; si scattano le foto di riferimento prima della fase e si confrontano dopo (`toHaveScreenshot` o `pixelmatch`) |
| sempre | `node build.js --check` prima di ogni commit (hook `pre-commit` locale) e, se si vuole, in una GitHub Action sui push: impedisce di modificare `index.html` a mano e dimenticare i sorgenti |

## Come si lavora dopo

1. Si modifica il file in `src/` (mai più `index.html` a mano).
2. `node build.js`.
3. Si committano **insieme** sorgenti e `index.html` (Pages pubblica quello).
4. Niente più strati nuovi: per cambiare `vistaOggi` si cambia `vistaOggi` nel suo file. La regola «aggiungi JS prima dell'ultimo `</script>` e avvolgi» va tolta da CLAUDE.md e sostituita con questa.
5. NOTE_LOGICA.md e MAPPA.md citano i file invece dei numeri di riga.

## Rischi e come si evitano

| Rischio | Contromisura |
|---|---|
| Qualcuno (o Claude) modifica `index.html` direttamente | `build.js --check` nel pre-commit e nei test; dalla fase C anche un commento in testa a `index.html` («file generato: modifica src/»), non prima perché romperebbe l'identità byte per byte |
| Un file finisce prima della `const` che usa | fasi A–B non cambiano l'ordine; dalla D, i test di avvio (`smoke.js`) lo vedono subito |
| Due ascoltatori cambiano ordine | si spostano solo in `avvio.js`, nello stesso ordine, in un commit dedicato |
| Fase D cambia un dettaglio visivo senza accorgersene | confronto di schermate prima/dopo per ogni funzione appiattita |
| Pages pubblica un `index.html` vecchio | si committa sempre l'uscita di build; nessun passaggio di build lato GitHub, quindi niente di nuovo da configurare |
| Numeri di riga di MAPPA/NOTE_LOGICA superati | si rigenera MAPPA con `tools/mappa/` a fine fase |

## Prova fatta (19/11)

Nello scratchpad, senza toccare il repo: `index.html` (v50) tagliato in **47 file CSS + 115 file JS** ai commenti di versione, poi ricomposto con lo script qui sopra → `cmp` identico, SHA-256 uguale (`e8ef9bc5…`), `build.js --check` → «index.html è aggiornato». La Fase A è quindi pronta da fare quando dai l'ok.

## Stima

| Fase | Tempo | Rischio |
|---|---|---|
| 0 + A | 1–2 ore | nullo (verifica byte per byte) — ✅ fatta il 19/11 |
| B | mezza giornata | nullo (verifica byte per byte) |
| C | 1 giorno | basso |
| D | 3–5 giorni, a pezzi | medio, coperto da test + schermate |
| E | 2–3 giorni | medio (solo aspetto) |

Si può fermarsi dopo B: già lì si lavora su file per area, con zero cambi nell'app.
