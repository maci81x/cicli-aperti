# tools/riordino

Strumenti del riordino (fase C, codice morto). Non fanno parte dell'app. Usano `acorn`/`postcss` di `tools/mappa/node_modules` (`cd tools/mappa && npm i`) e `playwright` di `tests/node_modules`.

| Script | Cosa fa |
|---|---|
| `candidati.js` | funzioni mai chiamate (punto fisso), catene mai chiamate, strati sostituiti, con letture al caricamento e alias usati altrove |
| `css_candidati.js` | selettori che richiedono una classe che nessun elemento ha (prefissi costruiti con `${…}` esclusi), variabili `--x` della radice sempre coperte |
| `pezzi.js` | toglie i pezzi JS (`funzioni`, `strati`), trasforma in dichiarazioni le assegnazioni rimaste senza base (`dichiara`), o mette trappole `[morto]` per le prove (`trappole`) |
| `togli_css.js` | toglie selettori o variabili con postcss lasciando invariato il resto |
| `variabili.js` | valori calcolati delle variabili `--x` in 5 stati, da confrontare prima e dopo |
| `copertura.js` | copertura V8 all'avvio: i pezzi candidati non devono essere eseguiti |
| `inventario.js` | scrive `docs/egm/fase-c/candidati.md` dai due JSON |

Ogni passo parte da `index.html` allineato a `src/` (`node build.js --check`) e rigenera i candidati: dopo un taglio le righe cambiano. Design e motivazioni: [docs/egm/fase-c/design_draft.md](../../docs/egm/fase-c/design_draft.md).
