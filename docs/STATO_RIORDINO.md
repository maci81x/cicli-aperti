# Stato del riordino — al 19/11/2026, sera (sessione interrotta durante la fase D)

Piano: [PIANO_RIORDINO.md](PIANO_RIORDINO.md) · mappa: [MAPPA.md](MAPPA.md) · design e review: [egm/fase-a/](egm/fase-a/design_draft.md), [egm/fase-c/](egm/fase-c/design_draft.md), [egm/fase-d/](egm/fase-d/design_draft.md) · strumenti: [tools/riordino/](../tools/riordino/README.md)

## In breve

| Fase | Stato | Dove |
|---|---|---|
| A — `src/` + `build.js` | fatta, pubblicata | `main` (`decc537`) |
| B — cartelle per area | fatta, pubblicata | `main` (`f1b1c12`) |
| Rete di sicurezza (`t51`, `t52`) | fatta | `main` locale (`e2603c4`, **non pubblicato**) e nei rami |
| C — codice morto | **fatta** | ramo `riordino/fase-c` (su GitHub, non unito) |
| D — appiattire le catene | **iniziata**: rete e strumenti pronti, **nessuna catena appiattita** | ramo `riordino/fase-d` (su GitHub, non unito) |
| E — CSS | da fare | — |
| Chiusura (v51, docs, pubblicazione) | da fare, solo dopo «ok pubblica» | — |

`main` su GitHub è ancora `f1b1c12` (fase B): **online non è cambiato niente**. `main` locale ha in più `c768a0e` (README di contratto) e `e2603c4` (rete di sicurezza), entrambi anche nei rami.

## Impronte e righe

| | SHA-256 di `index.html` | righe |
|---|---|---|
| v50 (fasi A e B, `main`) | `e8ef9bc5933465775a5ef10bd14734d23b2d9ac7267e177f85c039028b13aa6b` | 21.798 |
| dopo la fase C (`dc17335`) | cambia (codice tolto): la garanzia è la rete di sicurezza | 20.878 |

## Prove

Criterio: una prova passa solo se esce con 0 **e** non ha righe `FAIL`.

| Momento | Risultato |
|---|---|
| fase B su `main` | 27/27 |
| + rete di sicurezza (`t51`, `t52`) | 29/29 |
| ogni commit della fase C | 29/29, 16 schermate di `t52` a 0,000%, HTML uguale |
| ramo fase D con `t54` | 30/30 (vedi l'ultimo commit) |

Rete di sicurezza:
- `t51-globali` — nomi globali dopo l'avvio contro `tests/riferimento/globali.json` (si aggiorna solo quando si tolgono nomi apposta, con `AGGIORNA=1`, controllando il diff).
- `t52-golden` — HTML di Oggi, Pianifica (Settimana, Giorno), Tutto (Lista, Matrice), Un giorno, Altro, Smaltisci su telefono e computer; 16 schermate (Oggi, Pianifica, Smaltisci, Tutto › Matrice × telefono/computer × chiaro/scuro), soglia 0,1%, immagine delle differenze in `$OUT`. Le schermate dipendono dalla macchina: riferimento preso su questo Mac.
- `t54-caratterizza` (fase D) — anteprima del «+» e del campo «Cosa hai in testa?» mentre si scrive, righe salvate dal campo.

## Fase C — fatta (ramo `riordino/fase-c`)

Ciclo EGM completo (10 revisori; report in `docs/egm/fase-c/`). Commit, ognuno 29/29:

| Commit | Cosa |
|---|---|
| `9fe6f1a` | `t52` esteso a Tutto, Un giorno, Altro (la review aveva trovato che `tag-q3/4` erano vive e nessuna prova le vedeva) |
| `380056b` | design, review e `tools/riordino/` |
| `074a0c0` | commento «file generato» in testa a `index.html` |
| `3f5d840` | 25 funzioni mai chiamate + catena `apriNuovo` (163 righe) |
| `b5f5b02` | strati sostituiti di 33 funzioni: 31 basi, 18 strati, 13 alias (534 righe) |
| `ae0cdf1` | 5 funzioni rimaste senza chiamate dopo gli strati (30 righe) |
| `7a2423c` | 31 assegnazioni rimaste senza base tornate `function` (niente globali implicite) |
| `755ba86` | 74 selettori CSS senza elementi |
| `dc17335` | 252 variabili delle tavolozze sempre coperte (valori calcolati identici in 5 stati) |

Verifiche: copertura V8 all'avvio e 76 trappole `[morto]` con le 29 prove: nessun pezzo tolto veniva eseguito.

**Rinviato dalla fase C** (codice che non è una funzione, rimasto senza uso): `MACRO_AREA_COLORS` e `MACRO_AREA_EMOJIS`; il foglio `#postponeOverlay` con `doPostpone`, `doPostponeCustom`, `_applyPostpone` (lo apriva solo `openPostponeModal`, tolta); `let messe` e il toast nel file v30 dopo `v30InDaPianificare`; file `src/js/altro/000-26-macro-area-helpers.js` e `src/js/core/000-07-navigation.js` rimasti con il solo marcatore.

## Fase D — a che punto è (ramo `riordino/fase-d`)

**Fatto (commit di questa interruzione):**
- `tests/t54-caratterizza.js` + `tests/riferimento/caratterizza.json`, verificata anche al contrario (fallisce se cambia l'anteprima finale).
- `tools/riordino/catene.js`: per ogni pezzo di una catena, file, riga, contenitore e nomi locali usati. Risultato sulle sei catene: l'unico nome locale usato dagli strati è il loro alias → il codice si può spostare nel punto dell'ultimo strato.
- `tools/riordino/appiattisci.js`: genera la funzione unica in due forme esatte (sequenza di passi se ogni strato chiama per prima cosa la versione precedente; forma annidata `passo0…passoN` se qualche strato fa qualcosa prima). Provato in `--prova` su 5 catene: `vistaOggi` (sequenza, 376 righe), `riga` (sequenza), `salvaCattura` (sequenza), `disegna` e `avviaApp` (annidata). **Non ancora applicato a nessuna catena.**
- `docs/egm/fase-d/design_draft.md`: bozza. La review EGM era appena partita ed è stata fermata: **nessun report**.

**Catene:**

| Funzione | Strati | Forma | Stato |
|---|---|---|---|
| `vistaOggi` | base + 15 | sequenza | da fare |
| `disegna` | base + 13 | annidata (`v46` prepara prima di chiamare) | da fare |
| `avviaApp` | base + 7 | annidata (ogni strato legge `_appAvviata` prima) | da fare |
| `disegnaAnteprima` | base catturata + 1 + 3 | togliere base e ascoltatore ridondante, poi sequenza | da fare |
| `salvaCattura` | base + 2 (l'ultimo è una IIFE) | sequenza | da fare |
| `riga` | base + 6 | sequenza | da fare |

**Cose scoperte:**
- `disegnaAnteprima` e `disegnaAnteprimaCattura`: la base v9 è catturata da `addEventListener('input', disegnaAnteprima)` (riga 12318 di `index.html`) e gira a ogni tasto, ma il suo risultato è sempre sovrascritto dall'ascoltatore v9 `() => disegnaAnteprima()` (riga 13101). `t54` lo conferma: alterando solo la base la prova non cambia.
- Strati per nome, invisibili all'analisi per alias: `window[nome] = …(window[nome])` per `bpChiudiSettimana`, `inviaPiano`, `salvaEsercizioQ2`, `bpAttiva` (`src/js/pianifica/063-…js:888`) e `creaPdfSettimana`, `quotaSettimana`, `vociCoach`, `bpwCandidati`, `righePdfGiorno` (`src/js/altro/077-…js:22`).
- Nella forma a sequenza il nome del risultato non può essere `r`: alcuni strati dichiarano una `const r` (corretto nello strumento, sceglie un nome libero).
- La funzione finale non va dichiarata `async` (restituisce quello che restituiva lo strato più esterno).

## Altre cose di questa sessione

- README di contratto (bootstrap EGM) corretti e committati (`c768a0e`, su `main` locale).
- Plugin `agent-memory` (sincronizzato con l'account) **disattivato**: a ogni uso di uno strumento avrebbe salvato un riassunto dell'esito nel suo archivio. Chiamava `python`, che sul Mac non esiste, quindi non ha mai funzionato. I suoi comandi ora chiamano `python3`, nel caso lo si riattivi (`claude plugin enable agent-memory@synced`).
- Skill installate: `working-with-legacy-code` (wondelai, solo testo); EGM c'era già.
- `CLAUDE.md` locale aggiornato alle cartelle per area (si modifica `src/<css|js>/<area>/`, niente strati nuovi).

## Prossimo giro

1. `git checkout riordino/fase-d && git pull`.
2. Ripetere la review EGM della fase D (consolidata) su `docs/egm/fase-d/design_draft.md`, poi `egm-resolve`.
3. Una catena per commit, nell'ordine `vistaOggi`, `disegna`, `avviaApp`, `disegnaAnteprima`, `salvaCattura`, `riga`:
   ```sh
   node tools/riordino/appiattisci.js . vistaOggi --prova > $TMPDIR/vistaOggi.js   # leggere
   node tools/riordino/appiattisci.js . vistaOggi && node build.js
   # 30 prove; t51 deve elencare come tolti solo gli alias della catena → cd tests && AGGIORNA=1 NM="$PWD/node_modules" node t51-globali.js
   git add src index.html tests/riferimento/globali.json && git commit -m "refactor: fase D, vistaOggi in una funzione"
   ```
   Per `disegnaAnteprima`: prima togliere la base catturata e il suo `addEventListener` (riga 12318), trasformare `disegnaAnteprima = function` (v10) in `function disegnaAnteprima`, poi appiattire.
4. Fase E (ramo `riordino/fase-e` da `fase-d`): un selettore definito una volta, una tavolozza, meno `!important`, schermate entro la soglia; `tools/riordino/variabili.js` come controllo dei colori.
5. Chiusura (si ferma per l'ok di Roby): `VERSIONE_APP` «2026-11-xx v51 riordino», `NOTE_LOGICA.md`, `docs/MAPPA.md` rigenerata (e i testi fissi di `genera_mappa.js`), questo file, `/egm:egm-drift-report`. Niente unione su `main` né pubblicazione senza «ok pubblica».

## Comandi per ripartire

```sh
cd ~/Sites/cicli-aperti-roby
git fetch && git checkout riordino/fase-d && git pull --ff-only
git config core.hooksPath tools/hooks            # se è una copia nuova
node build.js --check                             # «index.html è aggiornato»

# dipendenze (una volta, sempre tutte insieme: npm i --no-save toglie quelle non elencate)
cd tests && npm i --no-save playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0 axe-core pngjs@7.0.0 pixelmatch@5.3.0 && npx playwright install chromium && cd ..
cd tools/mappa && npm i && cd ../..

# tutte le prove (criterio stretto)
cd tests && mkdir -p $TMPDIR/prove && for f in smoke.js t*.js; do NM="$PWD/node_modules" OUT=$TMPDIR/prove node "$f" > "$TMPDIR/prove/${f%.js}.log" 2>&1; echo "$f exit=$? FAIL=$(grep -c '^FAIL' $TMPDIR/prove/${f%.js}.log)"; done; cd ..

# analisi
node tools/riordino/catene.js . vistaOggi disegna avviaApp disegnaAnteprima salvaCattura riga
cd tools/mappa && node analizza.js ../../index.html > $TMPDIR/report.json && cd ../..
```
