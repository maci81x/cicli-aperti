# Stato del riordino — al 23/11/2026: fase E pubblicata, riordino concluso (v53 riordino)

Piano: [PIANO_RIORDINO.md](PIANO_RIORDINO.md) · mappa: [MAPPA.md](MAPPA.md) · design e review: [egm/fase-a/](egm/fase-a/design_draft.md), [egm/fase-c/](egm/fase-c/design_draft.md), [egm/fase-d/](egm/fase-d/design_draft.md), [egm/fase-e/](egm/fase-e/design_draft.md) · drift report: [egm/2026-11-23_DRIFT_REPORT.md](egm/2026-11-23_DRIFT_REPORT.md) · strumenti: [tools/riordino/](../tools/riordino/README.md)

## In breve

| Fase | Stato | Dove |
|---|---|---|
| A — `src/` + `build.js` | fatta, pubblicata | `main` |
| B — cartelle per area | fatta, pubblicata | `main` (`f1b1c12`) |
| Rete di sicurezza (`t51`, `t52`, `t54`) | fatta | `main` (`t51`, `t52`); `t54` e gli avvisi in console nel ramo fase D |
| C — codice morto | **fatta, pubblicata il 23/11** (riallineata a v51 e v52, unita su `main` in avanti veloce) | `main` (`f22f7c7`) |
| D — appiattire le catene | **fatta, pubblicata il 23/11** | `main` (`1bf722d`) |
| E — CSS | **fatta, pubblicata il 23/11**: tavolozza unica, classi `rap-*` via, 4 unioni, 39 dichiarazioni coperte via; `!important` tutti rimasti (vedi sotto) | `main` (`03bff65`, avanti veloce) |
| Chiusura (v53 riordino, docs) | **fatta e pubblicata il 23/11**. Riordino concluso | `main` |

Online c'è `03bff65` (v52 + fasi C, D, E): `VERSIONE_APP` «2026-11-23 v53 riordino». Verifica del 23/11 dopo la pubblicazione: la pagina servita da GitHub Pages è uguale byte per byte a `index.html` di `main`; Oggi, Pianifica (Settimana, Giorno, Mese), Smaltisci, Tutte e Altro si aprono su telefono e computer senza errori in console (dati finti); il sito vero, aperto senza dati, arriva alla schermata di accesso con la console vuota.

## Righe di `index.html`

| | righe |
|---|---|
| v51 (`d745419`) | 21.817 |
| v52 (`64abcf8`) | 21.836 |
| v52 + fase C (`f22f7c7`, online) | 20.916 |
| + fase D (`1bf722d`, online) | 20.978 (le funzioni appiattite hanno indice dei passi ed etichette; lo scopo della D è la struttura, non le righe) |
| + fase E (`03bff65`, online) | 21.049 (la tavolozza è scritta una variabile per riga; il CSS ha 191 dichiarazioni di variabili e 39 dichiarazioni coperte in meno) |

## Prove

Criterio: una prova passa solo se esce con 0 **e** non ha righe `FAIL`.

| Momento | Risultato |
|---|---|
| fase B su `main` | 27/27 |
| fase C riallineata alla v52 | 31/31 (con `t53` della v51 e `t55` della v52); contro la v52 pulita di `main`: 16 HTML identici, 16 schermate 0,000% |
| ogni commit della fase D | 32/32 (in più `t54`), 16 schermate 0,000%, HTML uguale, nessun avviso in console |
| ogni commit della fase E | 32/32, schermate 0,000%; stile calcolato di ogni elemento in 80 scenari: 0 differenze; variabili della radice uguali negli 8 stati |

Rete di sicurezza:
- `t51-globali` — nomi globali dopo l'avvio contro `tests/riferimento/globali.json` (si aggiorna solo quando si tolgono nomi apposta, con `AGGIORNA=1`, controllando il diff).
- `t52-golden` — HTML di Oggi, Pianifica (Settimana, Giorno), Tutto (Lista, Matrice), Un giorno, Altro, Smaltisci su telefono e computer; avvisi in console uguali al riferimento (oggi nessuno); 16 schermate, soglia 0,1%. Il seme ha due cose chiuse (17/11 e 19/11) dalla v51. Le schermate dipendono dalla macchina: riferimento preso su questo Mac.
- `t54-caratterizza` — anteprima del «+» e del campo «Cosa hai in testa?» mentre si scrive, righe salvate dal campo, avvisi in console.
- Fuori dalle prove: la fascia «Passo di …» del dettaglio e i fogli PDF della v52 li copre `t55`, non `t52`.

## Fase C — fatta e pubblicata

Ciclo EGM completo (report in `docs/egm/fase-c/`). Riallineata due volte (v51, v52) senza conflitti; nessun nome tolto è usato dal codice nuovo. Commit su `main`: `33768d5` funzioni e catene mai chiamate (25 + `apriNuovo`), `9c122c5` strati sostituiti (33 funzioni), `25b6724` cascata (5), `1099023` dichiarazioni (31), `cbd84d6` selettori CSS (74), `56996a5` variabili delle tavolozze (252). In tutto −920 righe di `index.html`.

**Rinviato dalla fase C** (codice che non è una funzione, rimasto senza uso): `MACRO_AREA_COLORS` e `MACRO_AREA_EMOJIS`; il foglio `#postponeOverlay` con `doPostpone`, `doPostponeCustom`, `_applyPostpone`; `let messe` e il toast nel file v30 dopo `v30InDaPianificare`; file `src/js/altro/000-26-macro-area-helpers.js` e `src/js/core/000-07-navigation.js` rimasti con il solo marcatore.

## Fase D — fatta e pubblicata

Review EGM consolidata (design, codebase, readiness, zoom-out; [report](egm/fase-d/goldfish_review_report.md)): nessun cambio di comportamento; corretti strumento e piano (15 correzioni).

| Commit | Funzione | Da | A |
|---|---|---|---|
| `246c906` | `vistaOggi` | base + 15 strati in 15 file | una funzione in sequenza (file v50 Oggi) |
| `584b344` | `disegna` | base + 13 in 14 file | annidata (file v50 accessibilità) |
| `1f13c2a` | `avviaApp` | base + 7 in 8 file | annidata (file v15) |
| `e7a2879` | `disegnaAnteprima` | base catturata + v10 + 3 | tolti base v9 e il suo ascoltatore (sempre sovrascritti), poi sequenza (file v17) |
| `bf1fe25` | `salvaCattura` | base async + 2 | sequenza di passi async (file v32) |
| `9109036` | `riga` | base + 6 in 7 file | sequenza (file v45) |

Altri commit: `0b3af9c` avvisi in console in `t52`/`t54`; `15e0136` design e strumento dopo la review; `ed1835e` correzione dello strumento (vedi sotto). Tolti 45 alias e 10 blocchi `{ }` rimasti vuoti.

**Trovato durante la fase:** al commit di `riga` `t52` ha visto HTML diverso con schermate identiche: lo strumento rientrava anche le righe dentro i template literal su più righe (spazi nell'HTML prodotto). Corretto (`ed1835e`, gli a capo dei template sono esclusi dai rientri) e aggiunto `tools/riordino/testi.js`, che confronta i testi di template e stringhe tra due versioni: zero differenze su tutti i commit della fase (in `disegnaAnteprima` mancano solo i testi della base tolta).

**Controlli di fine fase:** nessun `const _x = f;` né `f = …` rimasto per le sei funzioni; nella MAPPA rigenerata non sono più catene.

**Candidati per dopo:**
- Semplificazioni dentro `vistaOggi` (fuori dalla D, che è solo meccanica): più passi inseriscono HTML dopo `.vh` (v23, v25, v29), v49 e v50 si somigliano, una decina di giri template → `innerHTML`.
- Le altre ~150 catene della MAPPA con lo stesso strumento (ora si ferma da solo sui casi dubbi).

## Fase E — fatta e pubblicata

Review EGM (design, codebase, readiness, zoom-out; [report](egm/fase-e/goldfish_review_report.md)): 17 correzioni, tra cui tavolozza dal testo dichiarato (non dai valori calcolati), unioni solo dentro un file, criterio per `!important` indipendente dagli elementi.

| Commit | Cosa |
|---|---|
| `bb13208` | rete: `tests/dati-golden.js` (seme e viste di `t52`), `stili.js` (stile calcolato di ogni elemento in 80 scenari: stabile e sensibile), `variabili.js` a 8 stati, `css_riordina.js` |
| `545f106` | via `.rap-voce`, `.rap-sintesi`, `.rap-passi` (7 regole) e i punti del JS che le cercavano |
| `d3353c0` | **tavolozza**: 104 variabili da 16 regole di 8 file → `src/css/core/000-tavolozza.css` (chiaro 104, scuro 63, contrasto 6, scuro + contrasto 5), `var()` conservati |
| `473a864` | 4 selettori ripetuti nello stesso file uniti; 4 coppie restano separate (regola in mezzo con stessa specificità e famiglia) |
| `4b23c0d` | 39 dichiarazioni che non vincevano mai (gemelle `html:root S` delle v43/v44.1/v46) |
| chiusura | `VERSIONE_APP` «2026-11-23 v53 riordino», NOTE_LOGICA, MAPPA rigenerata (testi fissi di `genera_mappa.js` aggiornati), questo file, drift report |

**Cosa non si è potuto fare con sicurezza** (elenchi in [egm/fase-e/casi.md](egm/fase-e/casi.md)):
- **`!important`: 0 tolti su 95.** Il criterio del design li toglie solo se nessuna dichiarazione della stessa famiglia, in tutto il foglio, potrebbe batterli senza `!important`, se la proprietà non è scritta in linea da JavaScript o dai template e se non è animata. Ognuno dei 95 ha almeno un concorrente (73 anche per gli stili in linea, 10 per le animazioni). Toglierne qualcuno richiede di sapere quali elementi colpisce ogni selettore: si può fare con gli scenari di `stili.js`, ma senza garanzie su `:hover`, animazioni e classi messe da JavaScript.
- **48 selettori ripetuti tra file diversi** (es. `.t-title`, `.check-box`, `.list-head` in `core/000-base` e nella v30): non uniti, perché vorrebbe dire spostare regole tra file (la sistemazione «un file per area» del PIANO).

## Lavoro futuro (annotato, non fatto)

- **Semplificazioni dentro `vistaOggi`**: più passi inseriscono HTML dopo `.vh` (v23, v25, v29), v49 e v50 si somigliano, una decina di giri template → `innerHTML`. Sono cambi di logica (non meccanici): vanno fatti uno alla volta con `t52`, `stili.js` e i testi controllati.
- **Le altre ~150 catene** della MAPPA (44 funzioni avvolte due o più volte, 89 una volta): stesso strumento (`appiattisci.js`, che si ferma da solo sui casi dubbi) e stessa procedura della fase D.
- **CSS**: i codici rimasti senza uso rinviati dalla fase C. (`!important` e selettori tra file: lasciati come sono per decisione del 23/11.)

## Altre cose di questa sessione (23/11)

- Hook «python: command not found»: era il file annidato `plugin/hooks/hooks.json` del plugin sincronizzato `agent-memory` (disattivato, ma l'hook girava lo stesso); ora chiama `python3`.
- Fasi C e D unite su `main` e pubblicate (`f22f7c7`, poi `1bf722d`), verificate online.

## Riordino concluso (23/11)

Le fasi A–E sono su `main` e online. Per decisione di Roby (23/11) **gli `!important` e i 48 selettori ripetuti tra file restano come sono**: non fanno parte del riordino, che è chiuso. Il «Lavoro futuro» sopra resta solo come nota, da riaprire solo su richiesta.

## Comandi per ripartire

```sh
cd ~/Sites/cicli-aperti-roby
git fetch && git checkout main && git pull --ff-only
git config core.hooksPath tools/hooks            # se è una copia nuova
node build.js --check                             # «index.html è aggiornato»

# dipendenze (una volta, sempre tutte insieme: npm i --no-save toglie quelle non elencate)
cd tests && npm i --no-save playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0 axe-core pngjs@7.0.0 pixelmatch@5.3.0 && npx playwright install chromium && cd ..
cd tools/mappa && npm i && cd ../..

# tutte le prove (criterio stretto; deve dare 32 righe senza FAIL e con exit=0)
cd tests && mkdir -p $TMPDIR/prove && for f in smoke.js t*.js; do NM="$PWD/node_modules" OUT=$TMPDIR/prove node "$f" > "$TMPDIR/prove/${f%.js}.log" 2>&1; echo "$f exit=$? FAIL=$(grep -c '^FAIL' $TMPDIR/prove/${f%.js}.log)"; done; cd ..

# analisi
node tools/riordino/catene.js . <funzione> …
node tools/riordino/appiattisci.js . <funzione> --prova
node tools/riordino/testi.js HEAD WORK              # «testi diversi: 0»
# CSS (fase E): riferimento dal commit di partenza, poi confronto dopo la modifica
node tools/riordino/stili.js . $TMPDIR/stili_prima.json && node tools/riordino/variabili.js . $TMPDIR/var_prima.json
node tools/riordino/stili.js . $TMPDIR/stili_dopo.json && node tools/riordino/stili.js --confronta $TMPDIR/stili_prima.json $TMPDIR/stili_dopo.json   # «differenze: 0»
cd tools/mappa && node analizza.js ../../index.html > $TMPDIR/report.json && cd ../..
```
