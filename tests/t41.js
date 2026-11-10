// v41 · le risposte ai promemoria valgono su tutti i dispositivi; rilettura quando l'app torna davanti
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-04T09:20:00+01:00';   // mercoledì
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const ev = (id, summary, d, h1, h2) => ({ id, status: 'confirmed', summary, start: { dateTime: `2026-11-${d}T${h1}:00+01:00` }, end: { dateTime: `2026-11-${d}T${h2}:00+01:00` }, organizer: io, creator: io });
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  ev('anita', 'scrivere ad Anita per pranzo di domani', '02', '19:45', '20:00'),     // già «fatta» su un altro dispositivo
  ev('lisa', 'mandare a Lisa Mori il numero del documento', '02', '10:00', '10:15'), // spuntata come fatta nell'app
  ev('rossi', 'chiamare Rossi per il sopralluogo', '02', '11:00', '11:15'),          // mai decisa: diventa da rivedere
  ev('verdi', 'chiamare Verdi per la firma', '03', '09:00', '09:15')                 // ieri: si chiede
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 45, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [base('c1', 'Cosa aperta altrove')], cal_scelte: [{ chiave: 'anita', scelta: 'fatta' }], eventi_fatti: [{ evento_id: 'lisa', giorno: '2026-11-02' }] };
(async () => {
  const { browser, page, logs, db } = await apriApp({ viewport: { width: 1280, height: 900 }, ora: ORA, events, seed, attesa: 4000 });
  await page.evaluate(() => cercaCicliInCalendario()); await page.waitForTimeout(1000);
  let r = await page.evaluate(() => ({ chiedi: (ui.calCicli || []).map(x => x.e.id), scelte: leggiJson(LS5.CICLI_CAL, {}) }));
  const titoli = db.tabelle.cicli.map(c => c.title);
  a(!titoli.some(t => /Anita/.test(t)), 'decisa altrove: non si ricrea ' + JSON.stringify(titoli));
  a(!titoli.some(t => /Lisa/.test(t)) && r.scelte.lisa === 'fatta', 'spuntata nell\'app: non diventa una cosa ' + JSON.stringify(r.scelte));
  a(titoli.filter(t => /Rossi/.test(t)).length === 1, 'mai decisa: una sola cosa da rivedere');
  a(r.chiedi.join() === 'verdi', 'ieri: si chiede ' + JSON.stringify(r.chiedi));
  const sc = Object.fromEntries(db.tabelle.cal_scelte.map(x => [x.chiave, x.scelta]));
  a(sc.anita === 'fatta' && sc.lisa === 'fatta' && sc.rossi === 'scaduta', 'le scelte sono nel database ' + JSON.stringify(sc));
  // due giri insieme non creano doppioni
  await page.evaluate(() => { localStorage.removeItem(LS5.CICLI_CAL); return Promise.all([cercaCicliInCalendario(), cercaCicliInCalendario()]); }); await page.waitForTimeout(600);
  a(db.tabelle.cicli.filter(c => /Rossi/.test(c.title)).length === 1, 'browser svuotato + due giri: ancora una sola');
  // «Già fatta» va nel database
  await page.evaluate(() => sceltaCalCiclo('verdi', 'fatta')); await page.waitForTimeout(500);
  a(db.tabelle.cal_scelte.some(x => x.chiave === 'verdi' && x.scelta === 'fatta'), '«Già fatta» salvata nel database');
  // chiusa su un altro dispositivo: tornando davanti sparisce
  db.tabelle.cicli.find(c => c.id === 'c1').done = true;
  a(await page.evaluate(() => !ciclo('c1').done), 'prima: la scheda la vede ancora aperta');
  await page.evaluate(() => { V41.ultimo = 0; document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(1200);
  a(await page.evaluate(() => ciclo('c1').done === true), 'tornando in primo piano: chiusa anche qui');
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
