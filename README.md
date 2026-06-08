# Cicli Aperti — Roby

Gestione visuale dei cicli aperti (impegni, promesse, task) con Matrice Eisenhower, sincronizzazione Supabase e import da Plaud.

## Come aprirla

```
open /Users/admin/Sites/cicli-aperti-roby/index.html
```

Oppure doppio clic sul file `index.html`. Funziona direttamente nel browser, senza server.

## Supabase

- **Progetto**: cicli-aperti-roby
- **URL**: https://qujxbvootvollmziaqrd.supabase.co
- Tabelle: `cicli`, `persone`
- Realtime attivo: aggiornamenti live tra finestre/dispositivi

## Import da Plaud (richiede Claude API Key)

1. Premi **🎙 Plaud** in alto a destra (o `Cmd+P`)
2. Incolla la trascrizione dalla app Plaud
3. Claude (modello Haiku) estrae automaticamente tutti i cicli aperti
4. Rivedi i cicli estratti, modifica le scadenze, deseleziona quelli da non importare
5. Premi **Importa selezionati** → salvati su Supabase con tag `🎙 Plaud`

### Aggiungere la Claude API Key

1. Premi il pulsante **⚙️** in alto a destra
2. Incolla la tua chiave (inizia con `sk-ant-`)
3. Ottienila su [console.anthropic.com](https://console.anthropic.com) → API Keys
4. La chiave è salvata solo nel browser (localStorage), mai inviata a server propri

## Shortcut da tastiera

| Tasto | Azione |
|-------|--------|
| `Cmd+K` / `Ctrl+K` | Nuovo ciclo |
| `Cmd+P` / `Ctrl+P` | Import Plaud |
| `←` / `→` | Naviga settimana precedente/successiva |
| `Escape` | Chiudi modale aperto |
| `Enter` | Salva ciclo (nel modale) |

## Viste

- **🔲 Matrice** — Matrice Eisenhower 2×2 per la settimana corrente
- **📋 Lista** — Lista ordinata per priorità della settimana corrente
- **👥 Persone** — Cicli raggruppati per persone menzionate
- **🕐 Storico** — Cicli completati e settimane passate

## Quadranti Eisenhower

| Quadrante | Tipo | Azione |
|-----------|------|--------|
| Q1 🔥 Crisi | Urgente + Prioritario | **FA SUBITO** |
| Q2 📌 Qualità | Prioritario, non urgente | **PIANIFICA** |
| Q3 📋 Inganno | Urgente, non prioritario | **DELEGA** |
| Q4 🗑 Spreco | Non urgente, non prioritario | **ELIMINA** |

## Escalation automatica

I cicli vengono automaticamente riclassificati in base alla scadenza:
- **30 giorni** dalla scadenza → barra arancione, segnalazione
- **14 giorni** dalla scadenza → barra rossa, etichetta `⚠ CRITICO`
- Q2 con scadenza imminente → escalation automatica a Q1
- Q4 con scadenza critica → escalation automatica a Q3

## Categorie

**Lavoro**: Management · HR · Marketing · Vendite · Amministrazione · Produzione · R&D · Da Delegare · Idee

**Personale**: Salute & Fitness · Relazioni · Finanze · Crescita · Hobbies · Spiritualità · Casa & Famiglia · Idee

## Contesti

- **💼 Lavoro** — cicli professionali
- **🌿 Personale** — cicli della vita privata

Ogni contesto ha categorie dedicate e colori distinti (blu vs viola).

## Mobile

Su schermo < 768px: navigazione bottom bar, modale come bottom sheet con drag.
