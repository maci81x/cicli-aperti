# Stato del riordino — al 19/11/2026, fine sessione

Piano: [PIANO_RIORDINO.md](PIANO_RIORDINO.md) · mappa: [MAPPA.md](MAPPA.md) · design e review della fase A: [egm/fase-a/](egm/fase-a/design_draft.md) · drift report: [egm/2026-11-19_DRIFT_REPORT.md](egm/2026-11-19_DRIFT_REPORT.md)

## Cosa è fatto

| Commit | Cosa |
|---|---|
| `e76082d` | `docs/MAPPA.md`, `docs/PIANO_RIORDINO.md`, `tools/mappa/` (`analizza.js`, `genera_mappa.js`, `npm run mappa`) |
| `decc537` | **Fase A**: `src/` (testa, corpo, coda, 47 CSS, 115 JS, `ordine.txt`, `README.md`), `build.js`, `tools/hooks/pre-commit`, design e review EGM in `docs/egm/fase-a/` |
| (questo commit) | `NOTE_LOGICA.md` (sezione «Riordino · fase A»), questo file, drift report |

- `index.html` non si modifica più a mano: `node build.js` lo riscrive da `src/`. Istruzioni: [src/README.md](../src/README.md).
- Hook attivo **in questa copia** (`git config core.hooksPath tools/hooks`). Su un'altra copia va rilanciato.
- `CLAUDE.md` (solo locale) aggiornato: si modifica `src/`, niente strati nuovi, `src/` e `index.html` nello stesso commit.
- **Non committati, da rivedere** (scritti dal bootstrap EGM): `README.md` in radice (sezioni EGM aggiunte), `supabase/README.md`, `supabase/functions/README.md`, `supabase/functions/claude/README.md`, `tools/README.md`, `tools/mappa/README.md`, `tools/posta/README.md`. `tools/README.md` non elenca ancora `hooks/`.

## Impronte

| | SHA-256 di `index.html` |
|---|---|
| prima (v50, `948aad8`) | `e8ef9bc5933465775a5ef10bd14734d23b2d9ac7267e177f85c039028b13aa6b` |
| dopo la fase A (`decc537`) | `e8ef9bc5933465775a5ef10bd14734d23b2d9ac7267e177f85c039028b13aa6b` |

## Prove (questo Mac: macOS 26.7.1, Node 26.0.0, Playwright 1.65.1, Chromium headless shell 159.0.8154.6)

Prima e dopo la fase A, risultati **identici**: 25 su 27.

| Esito | Prove |
|---|---|
| passano | `smoke`, `t26b`, `t27`, `t28`, `t30`, `t31`, `t32`, `t33`, `t35`, `t36`, `t37`, `t38`, `t39`, `t40`, `t40b`, `t41`, `t42`, `t43`, `t44`, `t45`, `t46`, `t47`, `t48`, `t49`, `t50` (axe: 0 problemi gravi in tutte le viste) |
| si fermano (timeout) | `t26` (dopo 5 `ok`), `t29` (dopo 2 `ok`), sempre allo stesso punto, anche rilanciate |

### Prima indagine su t26 e t29

Roby riferisce che nell'ambiente di riferimento passano 27 su 27 con lo stesso file. Le prove **non sono state riscritte**. Cosa ho misurato qui, aprendo l'app esattamente come le due prove (stessi dati, stessa finestra) e, al posto del clic, ispezionando la pagina:

**t26** (computer, finestra 1440×1000, `deviceScaleFactor` 1, `window.innerWidth` = 1440):
- Il clic cerca `#view .v26-testa .v26-ob-voce[data-i="0"]`. Il pulsante esiste ma sta in `main > div.wide.largo.v47-on > div.v47-testa > div.board.v47-alto > section.v26-obiettivi`: la v47 (`vistaPianifica`, `src/js/110-v47-…`) riscrive la testa di Pianifica › Settimana quando `window.innerWidth >= 1024` e sposta gli obiettivi da `.v26-testa` a `.v47-alto`.
- La stessa prova, poche righe prima, **legge** gli obiettivi con `.v26-testa .v26-obiettivi, .v47-alto .v26-obiettivi` (cioè accetta entrambi i posti), ma per il **clic** cerca solo `.v26-testa`.
- Perché passi altrove, lì la trasformazione v47 non deve avvenire: `innerWidth < 1024`, oppure il blocco `try` della v47 fallisce (in console comparirebbe `[v47] settimana: …`), oppure la vista non contiene `cols board`.

**t29** (telefono, `devices['iPhone 13']`: 390×664, `deviceScaleFactor` 3, `pointer: coarse`):
- Il pulsante `.v29-prep [data-act="v29-min"][data-evt="pan"][data-m="60"]` esiste, ma sta dentro `details.v49-r` **chiuso**, nella sezione v50 «Da controllare sul telefono» (`vistaOggi`, `src/js/113-v50-…`). Il contenuto di un `<details>` chiuso non viene disegnato: `elementFromPoint` al centro del pulsante non restituisce niente e `scrollIntoView` non lo sposta, quindi Playwright lo considera «non visibile».
- Lo stato «aperto» è `ui.v49Aperti`, che vive solo in memoria e parte vuoto: nel codice non c'è niente che dipenda da font, `deviceScaleFactor` o versione del browser.

**Caratteri**: in entrambe le prove `document.fonts` ha caricato solo `tabler-icons`; «Instrument Sans» non viene caricato (l'harness non lo serve), quindi il testo usa il carattere di ripiego del sistema. Non incide sui due punti sopra, che dipendono dal DOM e non dalle misure.

**Ipotesi da verificare nell'ambiente di riferimento** (in ordine di probabilità):
1. che lì giri lo stesso `tests/` di `decc537`: `t26.js` e `t29.js` sono cambiati l'ultima volta con il commit v47 (`5d45faf`, 19/11 08:08), prima che arrivassero la v49 e la v50;
2. che `window.innerWidth` sia davvero 1440 in `t26` (basta `console.log(await page.evaluate(() => innerWidth))` dopo `apriApp`);
3. che in `t29` il `details.v49-r` sia aperto (`document.querySelector('.v29-prep').closest('details').open`).

Sonda usata: una copia di `t26.js`/`t29.js` troncata prima del clic, con `require` verso `tests/harness.js` e una `page.evaluate` che stampa `navigator.userAgent`, `innerWidth`, `devicePixelRatio`, `matchMedia`, font caricati e antenati del pulsante.

## Drift report (sintesi)

Report completo: [egm/2026-11-19_DRIFT_REPORT.md](egm/2026-11-19_DRIFT_REPORT.md). Corretti subito prima del commit della fase A: àncora `$` nell'hook, 2.983 righe di `000-base.js`, codice di build nel PIANO, commenti `#` e `RADICE` in `src/README.md`, `axe-core` in `tests/README.md`.

| Documento | Derive rimaste |
|---|---|
| `docs/egm/fase-a/design_draft.md` | nessuna dopo i commit (citava questo file e il commit, ora fatti) |
| `src/README.md` | il codice 2 vale per ogni errore di build, non solo per voci ripetute e file mancanti |
| `README.md` (bootstrap, non committato) | 10: non citava `src/` (aggiunto), scorciatoie e viste ferme a prima della v2, elenco tabelle e Realtime incompleti, `gcalFetchUtente` può cancellare eventi non dell'app su comando esplicito; la frase «niente email nel repo» era falsa ed è stata corretta |
| `tests/README.md` | `apriApp` restituisce anche `browser`/`context`; `errori`, `assertDi`, `OUT`, `attesa` non documentati; `NM` serve anche per i font |
| `tools/README.md`, `tools/mappa/README.md`, `tools/posta/README.md` (bootstrap) | manca `hooks/`; `verificateDinamiche` non copre `p-q2`/`chip-q4`; dettagli di `leggi.js` |
| `supabase/**/README.md` (bootstrap) | risposte di `stato` non elencate; `claude/README` rimanda a `index.html` invece di `src/js/068-v9-22-10-claude-dal-server.js` |
| `docs/PIANO_RIORDINO.md` | il nome d'esempio `090-v26-il-metodo-di-leo.js` non esiste (è `090-v26-3-11-il-metodo-di-leo-disegni-della-sezi.js`); la regola di taglio non cita `PARTE 2` |

## Aggiornamento 19/11 sera — t26 e t29 sistemate

- Verificato nell'ambiente di riferimento: anche lì t26 e t29 si fermavano (uscita 1); il conteggio di prima guardava solo le righe `FAIL` e non l'esito del processo. Le due prove erano davvero rimaste indietro rispetto all'app, come trovato qui.
- Corrette solo le prove (commit «tests: …»): t26 clicca l'obiettivo sia in `.v26-testa` sia in `.v47-alto`; t29 apre la riga `details.v49-r` che contiene `.v29-prep` prima di ogni clic e legge il riquadro «sparito» con `textContent`.
- Risultato: **27 su 27**, tutte con uscita 0. Da ora una prova conta come passata solo se esce con 0 e non ha righe `FAIL`.
- Il ramo `claude/adoring-ritchie-oxjzlf` (una seconda sessione che ha rifatto solo mappa e piano) è un doppione: non va unito.

## Prossimi passi

0. **Decidere sui README del bootstrap** (sopra): committarli dopo averli rivisti, sistemando le derive elencate.
1. ~~t26/t29~~: fatto (vedi sopra).
2. **Fase B** (cartelle per area, identica byte per byte) — nel PIANO viene prima di C. Una richiesta del 19/11 parlava di «dividere per area»: la fase A fatta divide per strato di versione.
3. **Fasi C, D, E**: **un ramo per fase** (`riordino/fase-c`, `riordino/fase-d`, `riordino/fase-e`), e a ogni passo:
   - tutte le prove di `tests/`, con lo stesso criterio (risultati uguali o migliori di quelli registrati qui);
   - confronto delle schermate prima/dopo: Oggi, Pianifica, Smaltisci × telefono e computer × tema chiaro e scuro (12 immagini), con `seed` e `ora` fissi dell'harness;
   - niente push né pubblicazione senza l'ok di Roby.
   - C: codice morto (MAPPA §3 e §5). D: appiattire le catene, una funzione per commit, partendo da `vistaOggi` (15), `disegna` (13), `avviaApp` (7). E: CSS per area, una tavolozza, meno `!important`.
4. **Ciclo EGM per ogni fase** (in una sessione nuova le skill sono disponibili con `/egm:`):
   - `/egm:egm-draft` → bozza in `docs/egm/fase-X/design_draft.md`
   - `/egm:egm-review docs/egm/fase-X/design_draft.md` (modalità «report consolidato»)
   - `/egm:egm-resolve` sul report → applicare le correzioni approvate
   - a fine fase `/egm:egm-drift-report` su `docs/egm/` e sui README.

## Comandi per ripartire

```sh
cd ~/Sites/cicli-aperti-roby
git pull --ff-only
git config core.hooksPath tools/hooks          # se è una copia nuova
node build.js --check                           # deve dire «index.html è aggiornato»
shasum -a 256 index.html                        # e8ef9bc5… finché non si cambia l'app

# prove (dipendenze una volta sola)
cd tests && npm i playwright @supabase/supabase-js@2 jspdf@2.5.1 @tabler/icons-webfont@3.31.0 axe-core && npx playwright install chromium
for f in smoke.js t*.js; do NM="$PWD/node_modules" OUT=/tmp/prove node "$f" > "/tmp/prove/${f%.js}.log" 2>&1; echo "$f exit=$?"; done   # mkdir -p /tmp/prove prima
cd ..

# mappa aggiornata
cd tools/mappa && npm i && npm run mappa && cd ../..

# modificare l'app
#   1. cambiare il file in src/   2. node build.js   3. git add src index.html && git commit
```
