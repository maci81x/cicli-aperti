// v42 · chiusa → via dal calendario; «Già fatte?» la sera; «Aggiornato alle…»
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-10T19:00:00+01:00';
const io = { email: 'maci81x@gmail.com', self: true };
const events = { 'r.macinai@sisoluzioniimpresa.it': [], 'maci81x@gmail.com': [
  { id: 'lisaev', status: 'confirmed', summary: 'Figlie: mandare a Lisa Mori il numero del documento', start: { date: '2026-11-06' }, end: { date: '2026-11-07' }, organizer: io, creator: io },
  { id: 'conospite', status: 'confirmed', summary: 'chiamare Rossi', start: { date: '2026-11-06' }, end: { date: '2026-11-07' }, organizer: io, creator: io, attendees: [{ email: 'rossi@x.it' }] }
] };
const ora = new Date(ORA).toISOString(), ieri = new Date('2026-11-09T12:00:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'personale', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 46, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [
  base('lisa', 'mandare a Lisa Mori il numero del documento per il camp3', { da_rivedere: true, note: 'Promemoria del calendario Privato del ven 6/11, mai deciso: è ancora da fare? [cal:lisaev]' }),
  base('rossi', 'chiamare Rossi', { da_rivedere: true, note: 'Promemoria del calendario Privato del ven 6/11, mai deciso: è ancora da fare? [cal:conospite]' }),
  base('preventivo', 'Mandare il preventivo a Bianchi', { ctx: 'lavoro' }),
  base('preventivo-chiuso', 'Mandare il preventivo a Bianchi', { ctx: 'lavoro', done: true, chiuso_at: ieri }),
  base('altra', 'Comprare il pane', {})
] };
(async () => {
  const { browser, page, logs, db, cal } = await apriApp({ viewport: { width: 1280, height: 900 }, ora: ORA, events, seed, attesa: 4000 });
  await page.evaluate(() => flipDone('lisa', false)); await page.waitForTimeout(1200);
  a(!cal.state.events['maci81x@gmail.com'].some(e => e.id === 'lisaev') && cal.state.writes.some(w => w.method === 'DELETE' && /lisaev/.test(w.url)), 'chiusa: promemoria tolto dal calendario');
  await page.evaluate(() => flipDone('rossi', false)); await page.waitForTimeout(1200);
  a(cal.state.events['maci81x@gmail.com'].some(e => e.id === 'conospite'), 'con invitati: resta sul calendario');
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); return AZIONI['v26-chiudi-giornata'](); }); await page.waitForTimeout(800);
  let r = await page.evaluate(() => [...document.querySelectorAll('#v26cg-corpo .v42-dopp b')].map(x => x.innerText));
  a(r.join('|') === 'Mandare il preventivo a Bianchi', 'Chiudi la giornata: «Già fatte?» ' + JSON.stringify(r));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v42_chiudi.png' });
  await page.click('#v26cg-corpo [data-act="v42-gia-fatta"]'); await page.waitForTimeout(900);
  a(db.tabelle.cicli.find(c => c.id === 'preventivo').done === true && await page.evaluate(() => !document.querySelector('#v26cg-corpo .v42-dopp')), 'È già fatta: chiusa e sparita dall\'elenco');
  r = await page.evaluate(() => { const b = document.querySelector('.top .v42-agg'); return b && { t: b.innerText, vecchio: b.classList.contains('vecchio') }; });
  a(r && /Aggiornato alle/.test(r.t) && !r.vecchio, 'in alto: Aggiornato alle… ' + JSON.stringify(r));
  r = await page.evaluate(() => { V42.letto = Date.now() - 7 * 60000; v42Etichetta(); const b = document.querySelector('.top .v42-agg'); return { t: b.innerText, vecchio: b.classList.contains('vecchio') }; });
  a(r.vecchio && /7 min fa/.test(r.t), 'dati vecchi: arancione ' + JSON.stringify(r));
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
