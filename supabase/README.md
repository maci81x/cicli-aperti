# supabase

## Overview

Codice che gira su Supabase e non nel browser. Oggi contiene solo le Edge Function. Le migration del database stanno ancora nella radice del repo (`supabase_migration_*.sql`, vedi il [README principale](../README.md#local-interface--invariants)).

## Subdirectories & Boundaries

- functions: [./functions/README.md](./functions/README.md) - le Edge Function, una per cartella. Oggi c'è solo `claude`: `POST /functions/v1/claude` con `{ compito, testo }`, accetta solo l'utente dell'app, chiama l'API Anthropic con il segreto `ANTHROPIC_API_KEY`. Non scrive sul database.
