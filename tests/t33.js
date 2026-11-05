// v33 · computer: Oggi a tre colonne, Pianifica con la testa su una riga e i giorni vuoti stretti, Tutte su due colonne
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true }, priv = { email: 'maci81x@gmail.com', self: true };
const ev = (id, summary, d, h1, h2, who = io, extra = {}) => ({ id, status: 'confirmed', summary, start: { dateTime: `2026-11-${d}T${h1}:00+01:00` }, end: { dateTime: `2026-11-${d}T${h2}:00+01:00` }, organizer: who, creator: who, ...extra });
const events = { 'r.macinai@sisoluzioniimpresa.it': [ev('fb', 'Feedback CRM post test - SiS', '05', '09:30', '10:30', io, { attendees: [{ email: 'fsaviori@essetech.net' }, { ...io }] }), ev('rev', 'Revisione periodica degli obiettivi', '05', '11:00', '13:15'), ev('mar', 'Con Marcello', '05', '16:45', '18:30'),
  ev('dv', 'DV - Controllo settimanale andamento agenti', '06', '11:00', '13:00'), ev('cr', 'Cresima di Giacomo, Badia a Ruoti', '08', '16:00', '17:30')],
  'maci81x@gmail.com': [{ ...ev('sv', 'Sveglia', '05', '04:30', '05:00', priv), recurringEventId: 'rsv' }] };
const ora = new Date('2026-11-05T11:55:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 45, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [
  base('c1', "CRM SiS (Essetech, Amerigo Marcelli): call di feedback sui test gio 5/11 ore 9:30–10:30 su Teams – rispondi all'invito e prepara le segnalazioni dei test", { pianificato_data: '2026-11-05', fonte: 'posta', posta_tipo: 'da_fare', due_date: '2026-11-05' }),
  base('c2', 'Mandare ai commerciali lo schema che gli serve come obiettivo di venduto/incassato sul mese fatto in riunione', {}),
  base('c3', 'Riunione con Giovanna', { q: 2 }), base('c4', 'Prenotare visita dentista', { q: 2, ctx: 'personale' })] };
const OUT = process.env.OUT || '/tmp';
(async () => {
  let { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: '2026-11-05T11:55:00+01:00', events, seed, attesa: 3500 });
  let r = await page.evaluate(() => {
    const g = document.querySelector('#view .v33-tre'); if (!g) return null;
    const w = s => Math.round(g.querySelector(s).getBoundingClientRect().width);
    return { sx: w('.v33-sx'), c: w('.v33-centro'), dx: w('.v33-dx'),
      adesso: !!g.querySelector('.v33-sx .v31-adesso'), gio: !!g.querySelector('.v33-sx .group.giornata'), vh: !!g.querySelector('.v33-sx .vh'),
      prima: !!g.querySelector('.v33-centro .v12-prima'), posta: !!g.querySelector('.v33-dx .v23-posta'), ob: !!g.querySelector('.v33-dx .v31-ob'),
      routine: !!g.querySelector('.v33-dx .acc-head[data-k="routine"]'), view: Math.round(document.querySelector('#view').getBoundingClientRect().width) };
  });
  a(r && r.sx >= 300 && r.c >= 500 && r.dx >= 280, 'Oggi: tre colonne ' + JSON.stringify(r));
  a(r && r.adesso && r.gio && r.vh, 'sinistra: titolo, Adesso, appuntamenti');
  a(r && r.prima, 'centro: Prima di tutto');
  a(r && r.posta && r.ob && r.routine, 'destra: Da rispondere, obiettivi, routine');
  await page.screenshot({ path: OUT + '/v33_oggi.png' });
  // Pianifica
  await page.evaluate(() => { ui.tab = 'pianifica'; ui.pian = 'settimana'; render(); }); await page.waitForTimeout(500);
  r = await page.evaluate(() => { const vh = document.querySelector('#view .vh-board'), ob = document.querySelector('#view .v26-testa .v26-obiettivi'), cols = document.querySelector('#view .cols.board');
    return { vh: Math.round(vh.getBoundingClientRect().height), ob: ob && Math.round(ob.getBoundingClientRect().height), tpl: cols.style.gridTemplateColumns,
      larg: [...cols.children].filter(x => x.classList.contains('bcol')).map(x => (x.querySelector('.bcol-h') || x).innerText.split('\n')[0] + ':' + Math.round(x.getBoundingClientRect().width)) }; });
  a(r.vh <= 60, 'Pianifica: testa su una riga ' + r.vh);
  a(r.ob && r.ob <= 60, 'obiettivi in una riga sottile ' + r.ob);
  a(/\.7fr/.test(r.tpl) && /1fr/.test(r.tpl), 'giorni vuoti più stretti ' + JSON.stringify(r.larg));
  await page.screenshot({ path: OUT + '/v33_pianifica.png' });
  // Tutte
  await page.evaluate(() => { ui.tab = 'tutto'; ui.tutto = 'lista'; render(); }); await page.waitForTimeout(500);
  r = await page.evaluate(() => { const d = document.querySelector('#view .v33-due'); return d && [...d.children].map(c => [...c.querySelectorAll('.list-head > span:first-child')].map(s => s.innerText.trim()).join('+') + ':' + Math.round(c.getBoundingClientRect().width)); });
  a(r && r.length === 2 && r[0].startsWith('Subito') && r[1].startsWith('Importante'), 'Tutte: Subito e Importante affiancati ' + JSON.stringify(r));
  await page.screenshot({ path: OUT + '/v33_tutte.png' });
  // più stretto: niente colonne
  await page.setViewportSize({ width: 1100, height: 900 }); await page.waitForTimeout(400);
  await page.evaluate(() => { ui.tab = 'oggi'; render(); }); await page.waitForTimeout(400);
  a(!(await page.evaluate(() => !!document.querySelector('#view .v33-tre'))), 'a 1100 px Oggi resta una colonna');
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
