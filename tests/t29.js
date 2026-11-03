// v29 · appuntamenti da preparare: riconosce, propone, trova lo spazio, crea cosa + blocco, segue spostamenti
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-03T09:00:00+01:00';   // martedì
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const ev = (id, summary, d, h1, h2, att, extra) => ({ id, status: 'confirmed', summary, start: { dateTime: T(d, h1) }, end: { dateTime: T(d, h2) }, organizer: io, creator: io,
  attendees: att ? [...att.map(email => ({ email })), { ...io, organizer: true }] : undefined, ...extra });
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  ev('pan', 'Riunione periodica PAN', '10', '14:30', '16:00', ['lucia.parigi@pan.it']),
  ev('int', 'Allineamento', '04', '10:00', '11:00', ['francesco@sisoluzioniimpresa.it']),
  ev('prev', 'Rossi – presentazione', '05', '10:00', '11:00', ['mario@rossi.it']),
  ev('pieno', 'Corso tutto il giorno', '04', '08:00', '18:00'),
  ev('soci', 'Riunione soci', '06', '09:00', '11:00', ['marco@sisoluzioniimpresa.it'], { recurringEventId: 'soci' }),
  ev('cant', 'Sopralluogo cantiere Bianchi', '12', '09:00', '10:00', ['geom@bianchi.it'])
], 'maci81x@gmail.com': [] };
(async () => {
  const { browser, page, logs, db, cal } = await apriApp({ mobile: true, ora: ORA, events, seed: { prep_appuntamenti: [] }, attesa: 3500 });
  await page.evaluate(() => { ui.tab = 'oggi'; render(); }); await page.waitForTimeout(500);
  let r = await page.evaluate(() => ({ t: (document.querySelector('.v29-prep .v29-t') || {}).textContent, voci: [...document.querySelectorAll('.v29-prep .v29-tit')].map(x => x.textContent), perche: [...document.querySelectorAll('.v29-prep .v29-perche')].map(x => x.textContent) }));
  a(r.t === '3 appuntamenti da preparare?' && r.voci.join('|') === 'Rossi – presentazione|Riunione periodica PAN|Sopralluogo cantiere Bianchi', 'riquadro: ' + JSON.stringify(r));
  a(/invitati esterni/.test(r.perche[0]) && /sopralluogo/.test(r.perche[2]), 'perché: ' + JSON.stringify(r.perche));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v29_oggi.png' });
  // PAN: 1h → lun 9/11 alle 8
  await page.click('.v29-prep [data-act="v29-min"][data-evt="pan"][data-m="60"]'); await page.waitForTimeout(300);
  r = await page.evaluate(() => [...document.querySelectorAll('.v29-prep .v29-slot')].map(x => x.textContent).join('|'));
  a(/lun 9\/11 · 08:00–09:00/.test(r), 'PAN slot: ' + r);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v29_scelta.png' });
  await page.click('.v29-prep [data-act="v29-ok"][data-evt="pan"]'); await page.waitForTimeout(1500);
  let c = db.tabelle.cicli.find(x => /^Preparare: Riunione periodica PAN/.test(x.title));
  a(c && c.scheduled_date === '2026-11-09' && c.scheduled_time === '08:00' && c.ctx === 'lavoro', 'cosa PAN: ' + JSON.stringify(c && [c.title, c.scheduled_date, c.scheduled_time, c.ctx]));
  const blocco = cal.state.writes.find(w => w.method === 'POST' && /Preparare/.test((w.body || {}).summary || ''));
  a(blocco && /^8 - Preparare: Riunione periodica PAN/.test(blocco.body.summary) && /T08:00:00/.test(blocco.body.start.dateTime) && /T09:00:00/.test(blocco.body.end.dateTime), 'blocco su Calendar: ' + JSON.stringify(blocco && [blocco.body.summary, blocco.body.start, blocco.body.end]));
  const righe = db.tabelle.prep_appuntamenti;
  a(righe.some(x => x.chiave === 'evt:pan' && x.minuti === 60 && x.stato === 'fatta' && x.ciclo_id === c.id) && righe.some(x => x.chiave === 'dom:pan.it' && x.minuti === 60), 'salvato + memoria cliente: ' + JSON.stringify(righe.map(x => x.chiave)));
  // Rossi: 2h → mercoledì pieno → oggi dalle 9:15
  await page.click('.v29-prep [data-act="v29-min"][data-evt="prev"][data-m="120"]'); await page.waitForTimeout(300);
  r = await page.evaluate(() => (document.querySelector('.v29-prep .v29-slot') || {}).textContent || '');
  a(/mar 3\/11 · 09:15–11:15/.test(r) && /mer 4\/11 è pieno/.test(r), 'giorno prima pieno → prima ancora: ' + r);
  // Scegli tu: i giorni fino all'appuntamento, con appuntamenti e spazi liberi
  await page.click('.v29-prep [data-act="v29-scegli"][data-evt="prev"]'); await page.waitForTimeout(300);
  r = await page.evaluate(() => ({ giorni: [...document.querySelectorAll('#v29Overlay .v29-g-h')].map(x => x.textContent), dur: (document.querySelector('#v29Overlay [data-act="v29-sc-dur"][aria-pressed="true"]') || {}).textContent, cal: (document.querySelector('#v29Overlay .v29-sc-cal') || {}).href || '' }));
  a(r.giorni.length === 2 && /mar 3\/11/.test(r.giorni[0]) && /mer 4\/11.*nessuno spazio da 2h/.test(r.giorni[1]) && r.dur === '2h', 'Scegli tu, solo i giorni prima: ' + JSON.stringify(r.giorni) + ' ' + r.dur);
  a(/calendar\.google\.com\/calendar\/r\/eventedit\?/.test(r.cal) && /text=Preparare/.test(r.cal) && /dates=20261103T091500%2F20261103T111500/.test(r.cal), 'link Calendar: ' + r.cal.slice(0, 160));
  r = await page.evaluate(() => [...document.querySelectorAll('#v29Overlay .v29-g')].map(g => [...g.querySelectorAll('li')].map(li => li.innerText.replace(/\s+/g, ' ').trim()).join(' / ')));
  a(/Corso tutto il giorno/.test(r[1]) && r.length === 2, 'appuntamenti nei giorni: ' + JSON.stringify(r).slice(0, 300));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v29_scegli.png' });
  await page.click('#v29Overlay [data-act="v29-sc-dur"][data-m="30"]'); await page.waitForTimeout(200);
  r = await page.evaluate(() => [...document.querySelectorAll('#v29Overlay [data-act="v29-sc-qui"]')].map(b => b.dataset.d));
  a(r.length && r.every(d => d === '2026-11-03'), 'si tocca solo prima del giorno dell\'appuntamento: ' + [...new Set(r)].join());
  // a mano: dopo l'appuntamento no
  await page.click('#v29Overlay .v29-sc-altro summary');
  r = await page.evaluate(() => [...$('v29-sc-data').options].map(o => o.value));
  a(r.join() === '2026-11-03,2026-11-04', 'a mano: solo i giorni prima ' + r.join());
  await page.click('#v29Overlay [data-act="v29-sc-qui"][data-d="2026-11-03"][data-o="09:45"]'); await page.waitForTimeout(1500);
  c = db.tabelle.cicli.find(x => /^Preparare: Rossi/.test(x.title));
  a(c && c.scheduled_date === '2026-11-03' && c.scheduled_time === '09:45' && c.durata_minuti === 30, 'tocco su 9:45 oggi: ' + JSON.stringify(c && [c.scheduled_date, c.scheduled_time, c.durata_minuti]));
  // Sopralluogo: Niente
  await page.click('.v29-prep [data-act="v29-min"][data-evt="cant"][data-m="0"]'); await page.waitForTimeout(600);
  a(db.tabelle.prep_appuntamenti.some(x => x.chiave === 'evt:cant' && x.stato === 'niente') && await page.evaluate(() => !document.querySelector('.v29-prep')), 'Niente: salvato, riquadro sparito');
  // l'appuntamento PAN si sposta all'11/11 → la preparazione va al 10/11
  await page.evaluate(() => { const e = eventoPerId('pan'); e.giorno = '2026-11-11'; e.inizioMs = new Date('2026-11-11T14:30:00+01:00').getTime(); _v29Ultimo = 0; return v29Controlla(); }); await page.waitForTimeout(800);
  c = db.tabelle.cicli.find(x => /^Preparare: Riunione periodica PAN/.test(x.title));
  a(c && c.scheduled_date === '2026-11-10' && /mer 11\/11/.test(c.title), 'spostato: la preparazione segue ' + JSON.stringify(c && [c.title, c.scheduled_date, c.scheduled_time]));
  a(cal.state.writes.some(w => w.method === 'PATCH' && /T08:00:00/.test(((w.body || {}).start || {}).dateTime || '') && /2026-11-10/.test(((w.body || {}).start || {}).dateTime || '')), 'blocco spostato su Calendar');
  // sparisce Rossi
  await page.evaluate(() => { for (const k of Object.keys(ui.eventi)) ui.eventi[k] = ui.eventi[k].filter(e => e.id !== 'prev'); Object.keys(ui.eventi).forEach(k => { ui.eventiLetti[k] = Date.now(); ui.eventiDaCache.delete(k); }); _v29Ultimo = 0; return v29Controlla(); }); await page.waitForTimeout(600);
  await page.evaluate(() => render()); await page.waitForTimeout(300);
  r = await page.evaluate(() => (document.querySelector('.v29-sparito') || {}).innerText || '');
  a(/Rossi – presentazione/.test(r) && /non è più in calendario/.test(r), 'sparito: ' + r.replace(/\n/g, ' | '));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v29_sparito.png' });
  await page.click('[data-act="v29-sparito-togli"]'); await page.waitForTimeout(800);
  a(!db.tabelle.cicli.some(x => /^Preparare: Rossi/.test(x.title)) && !db.tabelle.prep_appuntamenti.some(x => x.chiave === 'evt:prev'), 'tolta la preparazione');
  const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3)));
  await browser.close();
})();
