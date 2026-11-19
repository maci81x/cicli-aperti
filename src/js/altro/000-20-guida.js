// ══════════════════════════════════════════════════════════════
// GUIDA
// ══════════════════════════════════════════════════════════════
const GUIDA_SECTIONS = [
  {
    icon: '',
    title: 'Cos\'è CICLI APERTI',
    content: `
      <p>Un <strong>ciclo aperto</strong> è qualsiasi cosa incompiuta che tiene occupata la tua mente: una promessa fatta, un'email da rispondere, una decisione in sospeso, un progetto avviato ma non concluso.</p>
      <p>Secondo la metodologia <strong>OSM</strong>, ogni ciclo aperto consuma energia mentale — anche quando non ci stai pensando consciamente. Raccoglierli in un unico sistema libera la mente e permette di agire con chiarezza.</p>
      <p>L'obiettivo non è avere zero cicli, ma avere <strong>cicli consapevoli</strong>: sai cosa hai aperto, quando lo chiudi e perché.</p>
    `
  },
  {
    icon: '',
    title: 'La Matrice di Eisenhower',
    content: `
      <p>Ogni ciclo va collocato in uno dei 4 quadranti in base a <strong>urgenza</strong> e <strong>priorità</strong>:</p>
      <div class="guida-q-grid">
        <span class="guida-q-badge q1">Q1 </span><span><strong>Crisi — FA SUBITO.</strong> Urgente e prioritario: clienti in attesa, scadenze oggi, emergenze.</span>
        <span class="guida-q-badge q2">Q2 </span><span><strong>Qualità — PIANIFICA.</strong> Prioritario ma non urgente: strategia, formazione, relazioni importanti. È il quadrante della crescita.</span>
        <span class="guida-q-badge q3">Q3 </span><span><strong>Inganno — DELEGA.</strong> Urgente ma non prioritario: interruzioni, alcune riunioni, compiti di altri.</span>
        <span class="guida-q-badge q4">Q4 </span><span><strong>Spreco — ELIMINA.</strong> Né urgente né prioritario. Valuta se vale davvero la pena tenerlo aperto.</span>
      </div>
    `
  },
  {
    icon: '',
    title: 'Escalation automatica',
    content: `
      <p>L'app monitora le scadenze e riclassifica i cicli automaticamente:</p>
      <ul>
        <li>Un ciclo in <strong>Q2</strong> con scadenza entro <strong>30 giorni</strong> → passa a Q1 (diventa urgente)</li>
        <li>Un ciclo in <strong>Q4</strong> con scadenza entro <strong>14 giorni</strong> → passa a Q3 (diventa urgente)</li>
      </ul>
      <p>Visivamente: la barra laterale arancione segnala <em>"presto"</em> (30gg), quella rossa <em>"critico"</em> (14gg). All'apertura dell'app ricevi un avviso se ci sono cicli auto-escalati.</p>
    `
  },
  {
    icon: '',
    title: 'Navigazione settimanale',
    content: `
      <p>I cicli sono organizzati per <strong>settimana di riferimento</strong>. Usa le frecce <span class="guida-kbd">←</span> <span class="guida-kbd">→</span> nell'header (o da tastiera) per navigare tra le settimane.</p>
      <p>La settimana di un ciclo indica <em>quando intendi occupartene</em>, non necessariamente la sua scadenza. Puoi spostare un ciclo a una settimana futura modificandolo.</p>
      <p>La vista <strong>Storico</strong> raccoglie tutte le settimane passate e i cicli completati.</p>
    `
  },
  {
    icon: '',
    title: 'Con chi — rubrica persone',
    content: `
      <p>Ogni ciclo può avere una o più <strong>persone coinvolte</strong>. Aggiungile nel campo "Persone coinvolte" del modale, separate da virgola.</p>
      <p>La vista <strong>Persone</strong> raggruppa tutti i cicli aperti per persona — utilissima prima di una riunione: vedi in un colpo d'occhio tutto ciò di cui parlare con un collaboratore.</p>
      <p>L'import da Plaud estrae automaticamente i nomi delle persone menzionate nella registrazione.</p>
    `
  },
  {
    icon: '',
    title: 'Log note progressive',
    content: `
      <p>Il campo <strong>Note / Dettagli</strong> di ogni ciclo è il posto giusto per tenere un log progressivo degli aggiornamenti.</p>
      <p>Esempio:</p>
      <ul>
        <li><em>2024-03-10: chiamato Mario, in attesa di preventivo</em></li>
        <li><em>2024-03-15: preventivo ricevuto, da approvare</em></li>
        <li><em>2024-03-18: approvato, inviato a ufficio acquisti</em></li>
      </ul>
      <p>In questo modo il ciclo diventa anche un <strong>diario delle azioni</strong> e puoi recuperare il contesto anche dopo settimane.</p>
    `
  },
  {
    icon: '',
    title: 'Import da Plaud',
    content: `
      <p>Plaud è un dispositivo che trascrive le riunioni. Con questo import puoi trasformare una trascrizione in cicli aperti in 3 clic:</p>
      <ul>
        <li><strong>1.</strong> Premi <span class="guida-kbd"> Plaud</span> in header o <span class="guida-kbd">Cmd+P</span></li>
        <li><strong>2.</strong> Incolla il testo della trascrizione</li>
        <li><strong>3.</strong> Claude (AI) estrae automaticamente tutti gli impegni, promesse e task</li>
        <li><strong>4.</strong> Rivedi l'elenco, modifica le scadenze, deseleziona quelli da non importare</li>
        <li><strong>5.</strong> Premi "Importa selezionati"</li>
      </ul>
      <p>Richiede una <strong>Claude API Key</strong> (gratuita per uso personale limitato). Configurala premendo  in header.</p>
    `
  },
  {
    icon: '',
    title: 'Storico',
    content: `
      <p>Lo <strong>Storico</strong> raccoglie tutti i cicli completati (spunta verde) e i cicli di settimane passate, organizzati per settimana.</p>
      <p>Puoi <strong>riaprire</strong> un ciclo completato cliccando sulla spunta verde — tornerà nella settimana corrente come ciclo attivo.</p>
      <p>Lo storico è utile per i <strong>check-in settimanali</strong>: guarda cos'hai chiuso la settimana scorsa e cosa è rimasto in sospeso.</p>
    `
  },
  {
    icon: '',
    title: 'Scorciatoie tastiera',
    content: `
      <ul>
        <li><span class="guida-kbd">Cmd+K</span> / <span class="guida-kbd">Ctrl+K</span> — Nuovo ciclo</li>
        <li><span class="guida-kbd">Cmd+F</span> / <span class="guida-kbd">Ctrl+F</span> — Ricerca globale</li>
        <li><span class="guida-kbd">Cmd+P</span> / <span class="guida-kbd">Ctrl+P</span> — Import Plaud</li>
        <li><span class="guida-kbd">←</span> / <span class="guida-kbd">→</span> — Settimana precedente / successiva</li>
        <li><span class="guida-kbd">Escape</span> — Chiudi modale aperto</li>
        <li><span class="guida-kbd">Enter</span> — Salva ciclo (quando il modale è aperto)</li>
      </ul>
    `
  }
];



