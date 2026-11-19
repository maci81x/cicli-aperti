# tools

## Overview

Strumenti di sviluppo che girano fuori dall'app: nessuno viene caricato da `index.html`. Uno controlla i commit (`hooks`), uno analizza il sorgente dell'app (`mappa`), il terzo si incolla nella console di una scheda Gmail per leggere la posta senza segnarla come letta (`posta`).

## Subdirectories & Boundaries

- hooks: [./hooks/pre-commit](./hooks/pre-commit) - hook git (`#!/bin/sh`): se il commit tocca `index.html`, `src/` o `build.js`, rifiuta i file lasciati fuori dallo staging e lancia `node build.js --check`. Si attiva una volta per copia: `git config core.hooksPath tools/hooks`.
- mappa: [./mappa/README.md](./mappa/README.md) - Node.js: analisi statica di `index.html` (`analizza.js` → `report.json` → `genera_mappa.js`) che scrive `docs/MAPPA.md`. Si lancia con `cd tools/mappa && npm i && npm run mappa`. Legge solo `index.html`, scrive solo la mappa.
- posta: [./posta/README.md](./posta/README.md) - script da console per una scheda Gmail già aperta sull'account di lavoro: crea `window.__posta` (`lista`, `leggi`, `allegato`, `mostra`, `invito`) e scarica la vista di stampa e gli allegati con `fetch` sullo stesso dominio, in sola lettura. Niente su disco né su Supabase.
