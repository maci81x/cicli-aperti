# Comprehension Report — Fase C, stadio 6

**Target:** `docs/egm/fase-c/design_draft.md` (solo il documento) · **Reviewer:** `egm-comprehension` completed · Nessun Blocker.

**Parafrasi del revisore:** la fase C toglie da `src/` il codice che non può mai girare, in 4 commit (25 funzioni mai chiamate, strati sostituiti di 33 funzioni salvo 2 basi catturate, 41 selettori CSS, 252 variabili coperte), trovato con acorn, postcss e una copertura V8 all'avvio; dopo ogni commit 29 prove su 29, `t51` aggiornato solo per i nomi tolti, `t52` identico, variabili confrontate in 5 stati.

| # | Severità | Rilievo |
|---|---|---|
| C1 | Major | Numeri non riconciliati (MAPPA 23/38/23/«tre tavolozze» contro 25/33/41/252; «76 pezzi», «106 variabili» senza origine) |
| C2 | Major | «Impronta» e «rete di sicurezza» non definite (SHA-256 di `index.html`; le 29 prove) |
| C3 | Major | Modello a strati non spiegato: base, alias, strato che richiama, strato che sostituisce, decoratore; serve un esempio minimo |
| C4 | Major | Criterio delle variabili coperte solo nell'inventario esterno; esclusione del tema di sistema poco chiara rispetto ai 5 stati verificati |
| C5 | Major | Copertura su «4 schede» contro le 5 sezioni del CUJ 1; perché la base di `vistaOggi` risulta eseguita |
| C6 | Major | «§3» indica due documenti diversi (MAPPA e candidati.md); comando per rigenerare la MAPPA assente |
| C7 | Nit | Perché `t51` elenca come tolti solo gli alias |
| C8 | Nit | Percorso di `t51` incoerente |
| C9 | Nit | «passo 6 di Roby», «chiusura», «v51» non definiti |
| C10 | Nit | `build.js --check`, `variabili.js`, script dell'inventario non spiegati |
| C11 | Nit | Prefissi `'…-' +` citati nei rischi ma non nel criterio; i 4 casi verificati a mano non nominati |
| C12 | Nit | Righe 12976 e 13059 senza il file (`index.html`) |
