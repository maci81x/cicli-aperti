// v48 · «Annulla» sugli spostamenti, giorni con un tocco nel «Quando» (ore libere), «Prima di iniziare» a tutta larghezza
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-19T08:30:00+01:00';
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  { id: 'co', status: 'confirmed', summary: 'Coach Leo', start: { dateTime: T('19', '10:00') }, end: { dateTime: T('19', '11:00') }, organizer: io, creator: io, attendees: [{ email: 'l@x.it' }, { ...io }] },
  { id: 'rs', status: 'confirmed', summary: 'Riunione soci', start: { dateTime: T('19', '14:00') }, end: { dateTime: T('19', '18:00') }, organizer: io, creator: io, attendees: [{ email: 'p@x.it' }, { ...io }] },
  { id: 'fv', status: 'confirmed', summary: 'Fiera', start: { dateTime: T('20', '08:00') }, end: { dateTime: T('20', '17:50') }, organizer: io, creator: io, attendees: [{ email: 'p@x.it' }, { ...io }] }
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [base('v', 'Chiamare il notaio', { pianificato_data: '2026-11-16' }), base('w', 'Report soci', { pianificato_data: '2026-11-19' }), base('i', 'Piano formazione 2027', { q: 2, pianificato_data: '2026-11-19' }), base('s2', 'Preventivo Cellese', { q: 2 })] };
const O = process.env.OUT || '/tmp';
const toastTesto = page => page.evaluate(() => [...document.querySelectorAll('#toast-container .toast')].map(t => t.innerText).join(' | '));
(async () => {
  let { browser, page, logs, db } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, events, seed, attesa: 4500 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(700);
  // «Prima di iniziare»: il testo occupa la larghezza del riquadro
  const rit = await page.evaluate(() => { const r = document.querySelector('.v31-ad-ritmo'); if (!r) return null; const s = r.querySelector(':scope > span'); return { r: r.getBoundingClientRect().width, s: s.getBoundingClientRect().width }; });
  a(rit && rit.s > rit.r * 0.9, '«Prima di iniziare» a tutta larghezza ' + JSON.stringify(rit));
  await page.screenshot({ path: O + '/v48_oggi.png' });
  // (1) Pianifica: spostare con il trascinamento dà «Annulla»
  await page.evaluate(() => { ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(800);
  await page.evaluate(() => bordoSposta('s2', 'venerdi')); await page.waitForTimeout(800);
  let t = await toastTesto(page);
  a(/Spostata a venerd/i.test(t) && /Annulla/.test(t), 'spostando: messaggio con Annulla ' + t);
  a(!/^Spostata a venerdì$/m.test(t.split(' | ')[0] || ''), 'un solo messaggio');
  let r = await page.evaluate(() => ({ d: ciclo('s2').pianificato_data, it: !!(state.bp && state.bpItems.find(i => i.ciclo_id === 's2')) }));
  a(r.d === '2026-11-20', 'spostata a venerdì ' + JSON.stringify(r));
  await page.evaluate(() => { const b = [...document.querySelectorAll('#toast-container .toast-action')].filter(x => x.textContent === 'Annulla').pop(); b.click(); }); await page.waitForTimeout(1200);
  r = await page.evaluate(() => ({ d: ciclo('s2').pianificato_data || null, it: !!(state.bp && state.bpItems.find(i => i.ciclo_id === 's2')), ov: state.agendaOverrides.filter(o => o.ciclo_id === 's2').length }));
  a(r.d === null && !r.it && r.ov === 0, 'Annulla: torna senza giorno e fuori dal piano ' + JSON.stringify(r));
  const dbs2 = db.tabelle.cicli.find(c => c.id === 's2');
  a(!dbs2.pianificato_data, 'Annulla scritto anche nel database ' + dbs2.pianificato_data);
  // (2) «Quando»: i giorni con un tocco e le ore libere
  await page.evaluate(() => openPianificaModal('w')); await page.waitForTimeout(600);
  const g = await page.evaluate(() => { const b = document.getElementById('v48-giorni'); return { vis: b && !b.hidden, n: b.querySelectorAll('.v48-g').length, testi: [...b.querySelectorAll('.v48-g')].map(x => x.innerText.replace(/\s+/g, ' ').trim()) }; });
  a(g.vis && g.n === 8, '8 giorni nel Quando ' + JSON.stringify(g));
  a(/Oggi 19 4h30/.test(g.testi[0]), 'oggi: libere 4h30 (8:30–18 meno 5 ore) ' + g.testi[0]);
  a(/Domani 20 pieno/.test(g.testi[1]), 'domani pieno (fiera) ' + g.testi[1]);
  a(/sab 21 weekend/i.test(g.testi[2]), 'sabato weekend ' + g.testi[2]);
  await page.screenshot({ path: O + '/v48_quando_pc.png' });
  await page.click('#v48-giorni .v48-g[data-iso="2026-11-20"]'); await page.waitForTimeout(900);
  r = await page.evaluate(() => ({ d: ciclo('w').pianificato_data, aperto: document.getElementById('pianificaOverlay').classList.contains('open') }));
  a(r.d === '2026-11-20' && !r.aperto, 'un tocco: domani e si chiude ' + JSON.stringify(r));
  t = await toastTesto(page); a(/Annulla/.test(t), 'con Annulla ' + t);
  // la settimana dopo (fuori dal piano di questa settimana)
  await page.evaluate(() => openPianificaModal('i')); await page.waitForTimeout(500);
  await page.click('#v48-giorni .v48-g[data-iso="2026-11-24"]'); await page.waitForTimeout(900);
  r = await page.evaluate(() => ciclo('i').pianificato_data); a(r === '2026-11-24', 'martedì prossimo ' + r);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#toast-container .toast-action')].filter(x => x.textContent === 'Annulla').pop(); b.click(); }); await page.waitForTimeout(1200);
  r = await page.evaluate(() => ciclo('i').pianificato_data); a(r === '2026-11-19', 'Annulla: torna a oggi ' + r);
  // le ricorrenti non hanno i giorni veloci (chiedono «solo questa o tutte»)
  await page.evaluate(() => { state.cicli.push({ id: 'rr', title: 'Report settimanale', q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrenza: 'nessuna', pianificato_ripetizione: 'settimanale', ricorrente: true, giorno_settimana: 'lunedi', created_at: new Date().toISOString(), persone_menzionate: [] }); openPianificaModal('rr'); }); await page.waitForTimeout(400);
  a(await page.evaluate(() => document.getElementById('v48-giorni').hidden), 'ricorrente: niente giorni veloci');
  await page.evaluate(() => closePianificaModal());
  { const e = errori(logs); a(!e.length, 'computer console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  ({ browser, page, logs } = await apriApp({ mobile: true, ora: ORA, events, seed, attesa: 4500 }));
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(600);
  await page.screenshot({ path: O + '/v48_oggi_tel.png' });
  await page.evaluate(() => openPianificaModal('w')); await page.waitForTimeout(600);
  const tel = await page.evaluate(() => { const b = document.querySelector('#v48-giorni .v48-giorni'); const q = b.getBoundingClientRect(); return { w: q.width, sw: b.scrollWidth, cw: b.clientWidth, alt: [...b.children].map(x => x.getBoundingClientRect().height)[0] }; });
  a(tel.sw <= tel.cw + 1 && tel.alt >= 44, 'telefono: giorni senza uscire, tocco comodo ' + JSON.stringify(tel));
  await page.screenshot({ path: O + '/v48_quando_tel.png' });
  { const e = errori(logs); a(!e.length, 'telefono console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
