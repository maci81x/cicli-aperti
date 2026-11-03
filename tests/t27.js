// v27 · dopo una Subito: 1) perché è diventata urgente (nota) 2) cosa la previene (nuova cosa con l'origine in Dettagli)
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ora = '2026-11-03T09:00:00+01:00';
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', macro_area: 'Vendite', done: false, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
(async () => {
  const seed = { cicli: [
    base('s1', 'PAN – confermare a Lucia il 4/11', { q: 1, note: 'nota di prima' }),
    base('s2', 'Chiamare Korab', { q: 1, macro_area: 'Formazione' }),
    base('s3', 'Rispondere ad ASL', { q: 1, macro_area: 'Produzione' }),
    base('v1', 'ho risposto alla mail', { note: 'Per evitare che si ripeta: «PAN – confermare a Lucia Parigi»' })
  ] };
  const { browser, page, logs, db } = await apriApp({ mobile: true, ora, seed, attesa: 2500 });
  const apri = () => page.evaluate(() => $('subitoOverlay').classList.contains('open'));
  // 1. segno fatta la Subito → passo 1
  await page.evaluate(() => azioneFatto('s1')); await page.waitForTimeout(1200);
  let r = await page.evaluate(() => ({ open: $('subitoOverlay').classList.contains('open'), t: $('subito-titolo').textContent, cosa: $('subito-cosa').textContent, passo: document.querySelector('.v27-passo').textContent }));
  a(r.open && /Perché è diventata urgente/.test(r.t) && /PAN/.test(r.cosa) && /1 di 2/.test(r.passo), 'passo 1: ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v27_passo1.png' });
  await page.fill('#subito-testo', "l'invito è arrivato all'ultimo");
  await page.click('[data-act="v27-subito-avanti"]'); await page.waitForTimeout(500);
  const n1 = db.tabelle.cicli.find(x => x.id === 's1').note;
  a(n1 === "nota di prima\nPerché è diventata urgente: l'invito è arrivato all'ultimo", 'motivo salvato come nota sulla cosa fatta: ' + JSON.stringify(n1));
  a(db.tabelle.cicli.length === 4, 'il passo 1 non crea cose');
  r = await page.evaluate(() => ({ t: $('subito-titolo').textContent, m: (document.querySelector('.v27-motivo') || {}).textContent }));
  a(/non ricapiti/.test(r.t) && /arrivato all'ultimo/.test(r.m), 'passo 2: ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v27_passo2.png' });
  // 2. risposta "già fatta" → avviso, non crea
  await page.fill('#subito-testo', 'ho risposto alla mail');
  await page.click('[data-act="subito-crea"]'); await page.waitForTimeout(400);
  a(db.tabelle.cicli.length === 4 && await page.evaluate(() => !$('v27-avviso').hidden), '«ho risposto…» → avviso, niente cosa');
  await page.fill('#subito-testo', 'Fissare le riunioni PAN per tutto il 2027');
  await page.press('#subito-testo', 'Enter'); await page.waitForTimeout(600);
  const nuova = db.tabelle.cicli.find(x => x.title === 'Fissare le riunioni PAN per tutto il 2027');
  a(nuova && nuova.note === "Nasce da: «PAN – confermare a Lucia il 4/11» (Subito, fatta il 3/11)\nPerché era urgente: l'invito è arrivato all'ultimo" && !(await apri()), 'cosa creata con origine: ' + JSON.stringify(nuova && nuova.note));
  // 3. Dettagli mostra da dove nasce
  await page.evaluate(id => apriDettaglio(id), nuova.id); await page.waitForTimeout(400);
  r = await page.evaluate(() => (document.getElementById('det-origine') || {}).innerText || '');
  a(/Nasce da una cosa urgente/.test(r) && /PAN – confermare/.test(r) && /arrivato all'ultimo/.test(r), 'Dettagli: ' + r.replace(/\n/g, ' | '));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v27_dettagli.png' });
  await page.evaluate(() => closeModal('modalOverlay')); await page.waitForTimeout(300);
  // vecchia (v5) mostra comunque l'origine; una cosa normale no
  await page.evaluate(() => apriDettaglio('v1')); await page.waitForTimeout(300);
  r = await page.evaluate(() => (document.getElementById('det-origine') || {}).innerText || '');
  a(/PAN – confermare a Lucia Parigi/.test(r), 'vecchia: origine visibile');
  await page.evaluate(() => { closeModal('modalOverlay'); apriDettaglio('s2'); }); await page.waitForTimeout(300);
  a(await page.evaluate(() => !document.getElementById('det-origine')), 'cosa normale: nessun riquadro');
  await page.evaluate(() => closeModal('modalOverlay')); await page.waitForTimeout(300);
  // 4. seconda volta (altra area): si riapre bene; Salta al passo 1 non scrive niente
  await page.evaluate(() => azioneFatto('s2')); await page.waitForTimeout(1200);
  a(await apri() && await page.evaluate(() => /Chiamare Korab/.test($('subito-cosa').textContent) && /1 di 2/.test(document.querySelector('.v27-passo').textContent)), 'seconda volta: passo 1 con la cosa giusta');
  await page.click('[data-act="subito-salta"]'); await page.waitForTimeout(300);
  a(!(await apri()) && !db.tabelle.cicli.find(x => x.id === 's2').note, 'Salta: nessuna nota');
  // 5. Avanti senza motivo, poi «No, va bene così»
  await page.evaluate(() => azioneFatto('s3')); await page.waitForTimeout(1200);
  await page.click('[data-act="v27-subito-avanti"]'); await page.waitForTimeout(300);
  a(await page.evaluate(() => !document.querySelector('.v27-motivo')), 'senza motivo: niente riga motivo');
  await page.click('[data-act="subito-salta"]'); await page.waitForTimeout(300);
  const n = db.tabelle.cicli.length;
  a(!(await apri()) && n === 5, 'No, va bene così: chiude, nessuna cosa in più ' + JSON.stringify(db.tabelle.cicli.map(x => x.title)));
  const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 2)));
  await browser.close();
})();
