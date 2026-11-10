// v30 · promemoria del calendario: la sera o il giorno dopo; poi «Da pianificare · da rivedere»
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-04T09:20:00+01:00';   // mercoledì
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const ev = (id, summary, d, h1, h2) => ({ id, status: 'confirmed', summary, start: { dateTime: `2026-11-${d}T${h1}:00+01:00` }, end: { dateTime: `2026-11-${d}T${h2}:00+01:00` }, organizer: io, creator: io });
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  ev('anita', 'scrivere ad Anita per pranzo di domani', '02', '19:45', '20:00'),
  ev('rossi', 'chiamare Rossi per il sopralluogo', '03', '10:00', '10:15'),
  ev('bianchi', 'mandare offerta Bianchi', '04', '15:00', '15:15'),
  ev('verdi', 'chiamare Verdi', '05', '09:00', '09:15'),
  ev('idr1', 'chiedere preventivo idraulico', '03', '11:00', '11:15'),
  ev('idr2', 'chiedere preventivo idraulico', '06', '11:00', '11:15'),
  ev('lucia', 'scrivere a Lucia Parigi', '03', '12:00', '12:15'),
  ev('cena', 'Cena a La Bottega dell\'Abate (orario da chiedere) [da confermare]', '02', '20:00', '22:00')
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const seed = { cicli: [{ id: 'c-lucia', title: 'Scrivere a Lucia Parigi', q: 2, ctx: 'lavoro', cat: 'management', done: false, created_at: ora, updated_at: ora, persone_menzionate: [] },
  { id: 'c-riv', title: 'Scrivere a Paolo per il preventivo', q: 2, ctx: 'lavoro', cat: 'management', done: false, da_rivedere: true, note: 'Promemoria del calendario Lavoro del lun 26/10, mai deciso: è ancora da fare? [cal:paolo]', created_at: ora, updated_at: ora, persone_menzionate: [] }] };
(async () => {
  const { browser, page, logs, db } = await apriApp({ mobile: true, ora: ORA, events, seed, attesa: 4000 });
  await page.evaluate(() => cercaCicliInCalendario()); await page.waitForTimeout(800);
  let r = await page.evaluate(() => ({ chiedi: (ui.calCicli || []).map(x => x.e.id + (x.passata ? ':passata' : '')), scelte: leggiJson(LS5.CICLI_CAL, {}) }));
  a(r.chiedi.join() === 'anita:passata,rossi:passata', 'v42: si chiedono quelli passati (anche Anita, scaduta): ' + JSON.stringify(r.chiedi));
  a(r.scelte.idr1 === 'riprogrammata' && r.scelte.lucia === 'gia-tra-le-cose' && !r.scelte.anita && !r.scelte.bianchi && !r.scelte.verdi, 'riprogrammato / già tra le cose / scaduto / non ancora: ' + JSON.stringify(r.scelte));
  a(!db.tabelle.cicli.some(c => /Anita/.test(c.title)), 'v42: un promemoria passato senza risposta non diventa una cosa');
  a(!db.tabelle.cicli.some(c => /Bottega/.test(c.title)), 'una cena con «(orario da chiedere)» è un appuntamento, non una cosa');
  // di nuovo: non la ricrea (anche se le scelte locali si perdono, es. altro dispositivo)
  await page.evaluate(() => { localStorage.removeItem(LS5.CICLI_CAL); return cercaCicliInCalendario(); }); await page.waitForTimeout(600);
  a(!db.tabelle.cicli.some(c => /Anita/.test(c.title)), 'altro dispositivo: ancora nessuna cosa');
  // il foglio: per quello passato «Già fatta»
  await page.evaluate(() => apriCalCicli()); await page.waitForTimeout(300);
  r = await page.evaluate(() => [...document.querySelectorAll('#calc-lista .chip')].map(b => b.textContent.trim()));
  a(r.slice(0, 3).join('|') === 'Già fatta|Mettila tra le cose da fare|Lascia stare', 'scelte per un promemoria passato: ' + r.join('|'));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v30_foglio.png' });
  await page.click('#calc-lista [data-act="v30-calc-fatta"]'); await page.waitForTimeout(600);
  a(await page.evaluate(() => leggiJson(LS5.CICLI_CAL, {}).anita === 'fatta' && (ui.calCicli || []).length === 1), 'Già fatta: non si chiede più');
  // Da pianificare: chip e riga
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.tab = 'pianifica'; ui.pian = 'settimana'; render(); }); await page.waitForTimeout(500);
  r = await page.evaluate(() => { const t = document.createElement('div'); t.innerHTML = colonnaDaPianificare(); return { chip: (t.querySelector('[data-act="v30-dp-rivedere"]') || {}).textContent, prima: (t.querySelector('#dp-lista .item-title') || {}).textContent, tag: !!t.querySelector('#dp-lista .tag-v30') }; });
  a(/Da rivedere\s*1/.test(r.chip || '') && /Paolo/.test(r.prima || '') && r.tag, 'Da pianificare: chip, in cima, etichetta ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v30_dp.png' });
  // la sera alle 17:30 si chiede quello di oggi; toccata la cosa non è più da rivedere
  await page.evaluate(id => patchCiclo(id, { q: 1 }), 'c-riv'); await page.waitForTimeout(300);
  a(db.tabelle.cicli.find(c => c.id === 'c-riv').da_rivedere === false, 'toccata: non più da rivedere');
  r = await page.evaluate(() => { const e = Object.values(ui.eventi).flat().find(x => x.id === 'bianchi'); return v30Finestra(e); });
  a(r === 'presto', 'oggi prima delle 17:30 non si chiede');
  const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3)));
  await browser.close();
})();
