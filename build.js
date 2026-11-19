#!/usr/bin/env node
// Rimette insieme index.html dai file elencati in src/ordine.txt (uno per riga, nell'ordine di esecuzione).
// node build.js           → scrive index.html
// node build.js --check   → non scrive: esce con 1 se index.html non è quello che uscirebbe dai sorgenti
// Codici d'uscita: 0 = fatto / uguale, 1 = index.html diverso, 2 = errore (file mancante, voce ripetuta…)
const fs = require('fs');
const path = require('path');

const RADICE = process.env.RADICE || __dirname;
const SRC = path.join(RADICE, 'src');
const USCITA = path.join(RADICE, 'index.html');
const ESTENSIONI = /\.(html|css|js)$/;

function leggiElenco() {
  const elenco = fs.readFileSync(path.join(SRC, 'ordine.txt'), 'utf8')
    .split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('#'));
  const ripetute = elenco.filter((f, i) => elenco.indexOf(f) !== i);
  if (ripetute.length) throw new Error('Voci ripetute in ordine.txt: ' + [...new Set(ripetute)].join(', '));
  const mancanti = elenco.filter(f => !fs.existsSync(path.join(SRC, f)));
  if (mancanti.length) throw new Error('File in ordine.txt che non esistono: ' + mancanti.join(', '));
  return elenco;
}

// file .html/.css/.js sotto src/ che ordine.txt non elenca: la build li ignorerebbe
function fileNonElencati(elenco) {
  const elencati = new Set(elenco);
  const trovati = [];
  const visita = dir => {
    for (const voce of fs.readdirSync(path.join(SRC, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${voce.name}` : voce.name;
      if (voce.isDirectory()) visita(rel);
      else if (ESTENSIONI.test(voce.name) && !elencati.has(rel)) trovati.push(rel);
    }
  };
  visita('');
  return trovati;
}

function componi() {
  const elenco = leggiElenco();
  const orfani = fileNonElencati(elenco);
  if (orfani.length) console.error('Attenzione: questi file in src/ non sono in ordine.txt e restano fuori da index.html: ' + orfani.join(', '));
  // ogni file finisce già con il suo a-capo: si uniscono così come sono
  return elenco.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('');
}

try {
  const html = componi();
  if (process.argv.includes('--check')) {
    const attuale = fs.existsSync(USCITA) ? fs.readFileSync(USCITA, 'utf8') : '';
    if (attuale !== html) { console.error('index.html non corrisponde a src/: lancia «node build.js»'); process.exit(1); }
    console.log('index.html è aggiornato');
  } else {
    fs.writeFileSync(USCITA, html);
    console.log(`index.html scritto (${html.split('\n').length - 1} righe)`);
  }
} catch (e) {
  console.error('Build fallita: ' + e.message);
  process.exit(2);
}
