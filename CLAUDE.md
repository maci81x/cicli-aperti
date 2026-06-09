# CICLI APERTI — Contesto Progetto

## Cos'è
App web per gestione cicli aperti OSM con matrice Eisenhower.
URL live: https://maci81x.github.io/cicli-aperti/
File locale: /Users/admin/Sites/cicli-aperti-roby/index.html

## Stack
- Frontend: HTML single-file, CSS puro, JS vanilla
- Backend: Supabase progetto ID qujxbvootvollmziaqrd (region eu-west-1)
- Hosting: GitHub Pages → repo https://github.com/maci81x/cicli-aperti
- Font: Syne + Inter + JetBrains Mono via Google Fonts

## Deploy
cd /Users/admin/Sites/cicli-aperti-roby && git add . && git commit -m "messaggio" && git push origin main
GitHub Pages si aggiorna in 60 secondi dopo il push.

## Tabelle Supabase
- cicli (id, titolo, contesto, categoria_id, quadrante, scadenza, settimana, anno, stato, chiuso_at, ricorrenza, ricorrenza_parent_id, da_plaud)
- persone (id, nome, colore, ruolo)
- ciclo_persone (ciclo_id, persona_id)
- note_log (id, ciclo_id, testo, created_at)
- categorie (id, nome, contesto, icona, colore, ordine)

## Funzionalità
- Matrice Eisenhower 4 quadranti — mostra TUTTI i cicli senza filtro settimana
- Escalation automatica: Q2 scadenza ≤30gg → Q1, Q4 ≤14gg → Q3
- Ricorrenza: settimanale/mensile/trimestrale/annuale
- Vista per persona: clicca persona → tutti i suoi cicli aperti
- Ricerca globale su titolo/note/persone/categorie
- Dark/light mode (localStorage cicli_theme)
- Import da Plaud via Claude API (key in localStorage cicli_claude_key)
- Categorie personalizzabili da sidebar

## Note importanti
- Versione stabile di riferimento: commit aac3d6b
- NON riscrivere il file da zero — modificare sempre quello esistente
- Dopo ogni modifica fare sempre git push
