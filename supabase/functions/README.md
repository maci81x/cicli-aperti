# functions

## Overview

Edge Function Supabase (Deno) del progetto, una per cartella. Oggi c'è solo `claude`, che tiene sul server la chiave Anthropic e la usa per conto dell'utente dell'app.

## Subdirectories & Boundaries

- claude: [./claude/README.md](./claude/README.md) - Endpoint `POST /functions/v1/claude` con corpo `{ compito, testo }` (`stato`, `riunione`, `area`); accetta solo l'utente `EMAIL_AMMESSA`, chiama l'API Anthropic con il segreto `ANTHROPIC_API_KEY` e il modello `claude-haiku-5-5`, risponde `{ testo, troncato }` (`riunione`, `area`), `{ pronto, modello }` (`stato`) o `{ errore }` (con `stato` = status HTTP di Anthropic quando `errore` è `anthropic`).
