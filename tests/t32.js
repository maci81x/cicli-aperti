// v32 · il telefono: menu con microfono e +, «Tutto ▾», barra che si riduce, Oggi più corta, routine passate chiuse, Pianifica senza sovrapposizioni
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true }, priv = { email: 'maci81x@gmail.com', self: true };
const ev = (id, summary, h1, h2, who = io) => ({ id, status: 'confirmed', summary, start: { dateTime: `2026-11-05T${h1}:00+01:00` }, end: { dateTime: `2026-11-05T${h2}:00+01:00` }, organizer: who, creator: who });
const events = { 'r.macinai@sisoluzioniimpresa.it': [ev('fb', 'Feedback CRM post test - SiS', '09:30', '10:30'), ev('rev', 'Revisione periodica degli obiettivi', '09:45', '12:00')],
  'maci81x@gmail.com': [{ ...ev('sv', 'Sveglia', '04:30', '05:00', priv), recurringEventId: 'rsv' }, { ...ev('pal', 'Palestra', '05:30', '07:30', priv), recurringEventId: 'rpal' }] };
const ora = new Date('2026-11-05T09:39:00+01:00').toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 45, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [
  base('c1', "CRM SiS (Essetech, Amerigo Marcelli): call di feedback sui test gio 5/11 ore 9:30–10:30 su Teams – rispondi all'invito e prepara le segnalazioni dei test", { pianificato_data: '2026-11-05' }),
  base('c2', 'Mandare ai commerciali lo schema che gli serve come obiettivo di venduto/incassato sul mese fatto in riunione', {}),
  base('c3', 'Sollecitare SOCI per invio loro KPI per indicatori del mese di Ottobre, grafici e avanzamento', {}),
  base('c4', 'Tempo per Meditazione', { q: 2, ctx: 'personale', ricorrente: true, ricorrenza: 'giornaliera', routine: true })] };
const OUT = process.env.OUT || '/tmp';
(async () => {
  const { browser, page, logs, db } = await apriApp({ mobile: true, ora: '2026-11-05T09:39:00+01:00', events, seed, attesa: 3500 });
  let r = await page.evaluate(() => ({
    pill: !!document.querySelector('.tabbar .v32-pill .v32-piu'), cattura: getComputedStyle($('cattura')).display,
    coppia: !!document.querySelector('#view .v32-coppia .v31-giornata') && !!document.querySelector('#view .v32-coppia .v31-ob'),
    ritmo: !!document.querySelector('#view .v31-ad-ritmo'), chip: document.querySelector('.v32-ctx-btn').innerText.trim(), seg: getComputedStyle(document.querySelector('.top-ctx')).display,
    bg: (() => { const x = document.querySelector('#view .item.p-q1 .item-row'); return x && getComputedStyle(x).backgroundColor; })(),
    alto: document.querySelector('.top').offsetHeight }));
  a(r.pill && r.cattura === 'none', 'menu con microfono e +, campo chiuso ' + JSON.stringify([r.pill, r.cattura]));
  a(r.coppia, 'giornata e obiettivi affiancati');
  a(!r.ritmo, 'di giorno niente «Aggiungi una cosa» dentro Adesso');
  a(r.chip === 'Tutto' && r.seg === 'none', '«Tutto ▾» al posto dei tre bottoni');
  a(r.bg === 'rgb(255, 252, 245)', 'Subito senza sfondo rosso ' + r.bg);
  await page.screenshot({ path: OUT + '/v32_oggi.png' });
  // Tutto ▾
  await page.click('.v32-ctx-btn'); await page.waitForTimeout(150);
  a(await page.evaluate(() => getComputedStyle(document.querySelector('.top-ctx')).display === 'grid'), 'tocco: si apre la scelta');
  await page.screenshot({ path: OUT + '/v32_ctx.png' });
  await page.click('#ctx-lavoro'); await page.waitForTimeout(400);
  r = await page.evaluate(() => [state.filtro, document.querySelector('.v32-ctx-btn').innerText.trim(), getComputedStyle(document.querySelector('.top-ctx')).display]);
  a(r[0] === 'lavoro' && r[1] === 'Lavoro' && r[2] === 'none', 'Lavoro scelto, menu chiuso ' + JSON.stringify(r));
  await page.click('.v32-ctx-btn'); await page.click('#ctx-tutto'); await page.waitForTimeout(400);
  // barra che si riduce
  const h0 = await page.evaluate(() => document.querySelector('.top').offsetHeight);
  await page.evaluate(() => { $('main').scrollTop = 400; $('main').dispatchEvent(new Event('scroll')); }); await page.waitForTimeout(350);
  r = await page.evaluate(() => [document.body.classList.contains('v32-giu'), document.querySelector('.v32-top-tit').innerText, document.querySelector('.top').offsetHeight]);
  a(r[0] && r[1] === 'Oggi · GIO 5 NOV' && r[2] < h0, 'scorrendo: barra ridotta col titolo ' + JSON.stringify([r, h0]));
  await page.screenshot({ path: OUT + '/v32_scorri.png' });
  // routine passate chiuse
  await page.evaluate(() => { ui.aperti.add('routine'); render(); }); await page.waitForTimeout(300);
  r = await page.evaluate(() => { const d = document.querySelector('#view .v32-passate'); return d && [d.open, d.querySelectorAll('.evt-riga').length, d.querySelector('summary').innerText]; });
  a(r && !r[0] && r[1] === 2, 'routine già passate in una riga chiusa ' + JSON.stringify(r));
  // + : si apre il campo, si salva, si chiude
  await page.evaluate(() => { $('main').scrollTop = 0; });
  await page.click('.v32-piu'); await page.waitForTimeout(200);
  r = await page.evaluate(() => [getComputedStyle($('cattura')).display, document.activeElement && document.activeElement.id, !$('v32Scrim').hidden]);
  a(r[0] === 'flex' && r[1] === 'cattura-testo' && r[2], '+ apre il campo, pronto per scrivere ' + JSON.stringify(r));
  await page.fill('#cattura-testo', 'Chiamare Rossi per il preventivo'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/v32_campo.png' });
  await page.press('#cattura-testo', 'Enter'); await page.waitForTimeout(1200);
  r = await page.evaluate(() => [document.body.classList.contains('v32-cat'), getComputedStyle($('cattura')).display]);
  a(db.tabelle.cicli.some(c => c.title === 'Chiamare Rossi per il preventivo') && !r[0] && r[1] === 'none', 'salvata, il campo si chiude ' + JSON.stringify(r));
  // fuori: tocco sullo sfondo chiude
  await page.click('.v32-piu'); await page.waitForTimeout(150);
  await page.mouse.click(195, 150); await page.waitForTimeout(150);
  a(!(await page.evaluate(() => document.body.classList.contains('v32-cat'))), 'tocco fuori: si chiude');
  // Pianifica
  await page.evaluate(() => { ui.tab = 'pianifica'; ui.pian = 'settimana'; render(); }); await page.waitForTimeout(400);
  r = await page.evaluate(() => { const h = document.querySelector('#view .v22-vh h1').getBoundingClientRect(), s = document.querySelector('#view .v22-seg').getBoundingClientRect(), t = document.querySelector('#view .v22-piano .v22-testo');
    return { sopra: h.bottom <= s.top + 1, largo: Math.round(s.width), testo: t && t.scrollWidth <= t.clientWidth + 1 }; });
  a(r.sopra && r.largo > 340 && r.testo, 'Pianifica: titolo sopra, bottoni larghi, piano intero ' + JSON.stringify(r));
  await page.screenshot({ path: OUT + '/v32_pianifica.png' });
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
