# Battle Plan — Guida Utente

Estensione di Cicli Aperti con planning mobile-first, Google Calendar sync e macro aree SSI.

## Login Google Calendar

1. Apri l'app su https://maci81x.github.io/cicli-aperti/
2. Premi il pulsante **📅 Connetti** nell'header
3. Nella modale clicca **🔗 Connetti Google**
4. Si apre un popup Google → accedi con `r.macinai@sisoluzioniimpresa.it`
5. Concedi i permessi per Google Calendar
6. Il pulsante diventa **📅 GCal ✓** (verde) — sei connesso

Il calendario **"Cicli Aperti — Battle Plan"** viene creato automaticamente nel tuo account Google.

### Cosa viene sincronizzato

- Ogni ciclo con **data pianificata** crea un evento nel calendario dedicato
- Titolo evento: `[Macro Area] Titolo ciclo`
- Descrizione: note + persone assegnate + link diretto al ciclo
- Modifica ciclo → aggiorna evento
- Ciclo completato → titolo aggiornato con `[DONE]` → evento eliminato
- Ciclo posticipato → evento spostato alla nuova data

### Se il sync fallisce

Un'icona ⚠️ appare sul ciclo. Il sistema ritenta automaticamente ogni 5 minuti.
Per forzare un ri-sync completo: **📅 GCal ✓** → **🔄 Ri-sincronizza tutti**.

---

## Come funziona lo Swipe

Le card nella vista **Oggi** e **Settimana** supportano i gesti touch:

| Gesto | Azione |
|-------|--------|
| **Swipe destra** | ✅ Segna come completato (anima fuori a destra, verde) |
| **Swipe sinistra** | 📅 Apre il modal "Posticipa" |
| **Long press (600ms)** | ✏️ Apre il modal di modifica completa |
| **Tap** | 📋 Apre il modal di modifica completa |

La soglia di swipe è **80px**. Uno swipe più corto non fa nulla.

---

## Come spostare un ciclo (Posticipa)

**Metodo 1 — Swipe sinistra:**
1. Swipa a sinistra su qualsiasi card mobile
2. Scegli: Domani / Dopodomani / +1 settimana
3. Oppure inserisci una data personalizzata e premi **Sposta**

**Metodo 2 — Modifica ciclo:**
1. Tocca la card (o long press) per aprire il modal
2. Cambia il campo **📅 Data pianificata**
3. Premi **Salva**

Il ciclo viene aggiornato con `execution_status: 'postponed'` e l'evento Google Calendar viene spostato automaticamente.

---

## Come funziona la Macro Area auto-classifica

Quando crei un nuovo ciclo di tipo **Lavoro**:

1. Digita il titolo del ciclo
2. Fai clic altrove (blur) o passa al campo successivo
3. Claude Haiku analizza titolo + note e suggerisce automaticamente una delle 9 macro aree SSI
4. Il campo **🏢 Macro Area** si pre-compila con il suggerimento
5. Puoi modificare la selezione a piacere prima di salvare

**Macro aree disponibili:**
| Area | Emoji | Colore |
|------|-------|--------|
| Management | 👑 | Viola |
| Marketing | 📣 | Rosa |
| Vendite | 📈 | Verde |
| Amministrazione | 📋 | Giallo |
| Produzione | 🏭 | Blu |
| HR | 👥 | Rosso |
| R&D | 🔬 | Ciano |
| Personale | ❤️ | Lavanda |
| Da Delegare | ➡️ | Grigio |

> **Nota**: per la classificazione automatica serve una Claude API Key configurata (⚙️ in header).

### Assegna macro aree ai cicli esistenti

Nella sidebar desktop → **🏢 Assegna Macro Aree**

Il sistema prende i cicli `lavoro` senza macro area (max 50 alla volta), li classifica tramite Claude, e li aggiorna. Rate limit: 5 req/sec.

---

## Navigazione mobile (5 tab)

| Tab | Vista | Descrizione |
|-----|-------|-------------|
| ☀️ Oggi | Oggi | Tutti i cicli pianificati per oggi |
| 📅 Settimana | Settimana | Cicli per giorno nella settimana |
| 🗓 Mese | Mese | Calendario mensile con dot colorati |
| 🔲 Matrice | Matrice Eisenhower | Quadranti 2×2 (desktop default) |
| 🏢 Aree | Macro Aree | Griglia 9 colonne per settimana |

Il **+** centrale (FAB) apre sempre il modal "Nuovo Ciclo".

---

## Vista Aree — Excel delle macro aree

La vista **🏢 Aree** mostra una griglia con:
- **9 colonne** = le 9 macro aree SSI
- **Righe** = cicli della settimana selezionata
- **Scroll orizzontale** fluido su mobile
- **Header sticky** con nome area, emoji e conteggio

Naviga tra settimane con le frecce ‹ ›.
Tocca un ciclo per aprire il modal di modifica.

---

## Shortcut tastiera (desktop)

| Tasto | Azione |
|-------|--------|
| `Cmd+K` / `Ctrl+K` | Nuovo ciclo |
| `Cmd+P` / `Ctrl+P` | Import Plaud |
| `Cmd+F` / `Ctrl+F` | Ricerca globale |
| `←` / `→` | Naviga settimana |
| `Escape` | Chiudi modal |
| `Enter` | Salva ciclo (modal aperto) |

---

## ⚔️ Vista Battle Plan (settimanale)

Il **Battle Plan** è il piano della settimana: prendi i cicli aperti
dall'armadio, li assegni ai giorni e li spunti man mano che li chiudi.

Lo trovi come **prima voce** nella sidebar e nella barra delle viste
(su mobile: menu ≡ → Vista → ⚔️ Battle Plan).

### Creare il piano

Alla prima apertura di una settimana senza piano si apre il wizard.

**Step 1 — Seleziona i cicli**
- A sinistra i cicli aperti raggruppati per quadrante (Q1 → Q4), con ricerca
  e filtro categoria.
- I cicli già pianificati in agenda per quella settimana sono già spuntati e
  mostrano il badge **📅 Già in agenda**.
- A destra il riepilogo: quanti cicli, quante ore stimate, l'avviso se superi
  le 40 ore.

> 💡 Seleziona il **130%** di quello che pensi di fare: l'obiettivo è chiudere
> l'**80%**, non il 100%.

**Step 2 — Assegna ai giorni**
- Trascina un ciclo dalla lista di sinistra sul giorno desiderato (desktop),
  oppure **toccalo** per scegliere giorno, fascia, ora e durata (mobile).
- La colonna **📋 SETT.** raccoglie i cicli da chiudere entro la settimana ma
  senza un giorno preciso. Quello che non assegni finisce lì.
- Sotto ogni giorno vedi il tempo totale pianificato.

**Step 3** — *Attiva il Battle Plan*. Fatto.

### Durante la settimana

- Spunta la casella su una card: la card si barra, la barra di avanzamento si
  aggiorna e il ciclo viene chiuso (se è un ciclo "una volta sola").
- I cicli **ricorrenti** (settimanali, mensili, rituali quotidiani) restano
  aperti: la spunta vale solo per il piano di questa settimana.
- **📄 Stampa PDF** genera un A4 da appendere: checkbox da barrare a mano,
  righe tratteggiate per le note, spazio note generali in fondo.
- **✏️ Modifica piano** riapre il wizard senza perdere le spunte già fatte.

### Chiudere la settimana

**✅ Chiudi settimana** apre la review:
- quanto hai completato e il verdetto (🏆 ≥80% / 👍 ≥50% / ⚠️ <50%)
- per ogni ciclo non fatto scegli: **📅 prossima settimana**, **📦 rimetti
  nell'armadio**, **🗑 chiudi comunque**
- una nota di riflessione libera

Alla conferma il piano va in archivio e si apre subito il wizard della
settimana successiva, con i cicli rinviati già selezionati.

### Storico

Con le frecce **‹ ›** in header navighi alle settimane passate: i piani chiusi
si vedono in sola lettura, con percentuale finale e note della review.
