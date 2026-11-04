// v31 · «Carta di precisione» fase 1: riquadro Adesso, la giornata 8–18, obiettivi, niente scheda coach, menu Pianifica/Tutte
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const ev = (id, summary, d, h1, h2) => ({ id, status: 'confirmed', summary, start: { dateTime: `2026-11-${d}T${h1}:00+01:00` }, end: { dateTime: `2026-11-${d}T${h2}:00+01:00` }, organizer: io, creator: io });
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  ev('soci', 'Riunione soci', '04', '09:00', '11:30'),
  ev('kk', 'Riunione King Kendze', '04', '11:30', '12:15'),
  ev('tb', 'SI Soluzioni Impresa · Two Birds', '04', '15:00', '15:45')
], 'maci81x@gmail.com': [] };
const OUT = process.env.OUT || '/tmp';
(async () => {
  let { browser, page, logs } = await apriApp({ mobile: true, ora: '2026-11-04T09:40:00+01:00', events, attesa: 3500 });
  let r = await page.evaluate(() => {
    const ad = document.querySelector('#view .v31-adesso'), g = document.querySelector('#view .v31-giornata');
    return { primo: document.querySelector('#view .vh').nextElementSibling.className, k: ad && ad.querySelector('.v31-ad-k').textContent, t: ad && ad.querySelector('.v31-ad-t').textContent,
      c: ad && ad.querySelector('.v31-ad-c').textContent, poi: ad && ad.querySelector('.v31-ad-poi').textContent, g: g && g.querySelector('.mono').textContent,
      barre: g && g.querySelectorAll('.v31-g-barra i').length, ob: !!document.querySelector('#view .v31-ob'),
      coach: !!document.querySelector('#view .oggi-coach *'), nav: [...document.querySelectorAll('.tabbar button')].map(b => b.textContent.trim()) };
  });
  a(r.primo === 'v31-adesso', 'Adesso subito sotto il titolo');
  a(r.k === 'Adesso · fino alle 11:30' && r.t === 'Riunione soci' && r.c.startsWith('1:50'), 'in corso: fino alle 11:30, mancano 1:50 ' + JSON.stringify([r.k, r.t, r.c]));
  a(r.poi === 'Poi 11:30 Riunione King Kendze · libero 12:15–15:00', 'poi + primo spazio libero: ' + r.poi);
  a(r.g === "impegni 4h · libere 6h" && r.barre === 2, 'la giornata: ' + r.g + ' barre ' + r.barre);
  a(!r.coach, 'niente scheda «Per il coach»');
  a(r.nav.join('|') === 'Oggi|Pianifica|Tutte|Altro', 'menu: ' + r.nav.join('|'));
  await page.screenshot({ path: OUT + '/v31_oggi_tel.png', fullPage: false });
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); render(); }); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/v31_oggi_tel_scuro.png' });
  // Pianifica: niente riga del coach
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); ui.tab = 'pianifica'; ui.pian = 'settimana'; render(); }); await page.waitForTimeout(400);
  a(!(await page.evaluate(() => /Per il coach/i.test(document.querySelector('#view').innerText))), 'Pianifica: niente «Per il coach»');
  await page.screenshot({ path: OUT + '/v31_pianifica_tel.png' });
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  // tempo libero, computer
  ({ browser, page, logs } = await apriApp({ ora: '2026-11-04T12:30:00+01:00', events, attesa: 3500 }));
  r = await page.evaluate(() => { const ad = document.querySelector('#view .v31-adesso'); return [ad.querySelector('.v31-ad-k').textContent, ad.querySelector('.v31-ad-t').textContent, ad.querySelector('.v31-ad-c').textContent, ad.querySelector('.v31-ad-poi').textContent]; });
  a(r[0] === 'Adesso · tempo libero' && r[1] === 'Libero fino alle 15:00' && r[2].startsWith('2:30') && r[3] === 'Poi 15:00 SI Soluzioni Impresa · Two Birds', 'libero: ' + JSON.stringify(r));
  await page.screenshot({ path: OUT + '/v31_oggi_pc.png' });
  // ogni minuto si aggiorna da solo
  await page.evaluate(() => { const ad = document.querySelector('.v31-adesso'); ad.querySelector('.v31-ad-t').textContent = 'X'; });
  await page.waitForTimeout(61000);
  a(await page.evaluate(() => document.querySelector('.v31-adesso .v31-ad-t').textContent !== 'X'), 'si aggiorna ogni minuto');
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  // sera
  ({ browser, page, logs } = await apriApp({ mobile: true, ora: '2026-11-04T18:40:00+01:00', events, attesa: 3500 }));
  r = await page.evaluate(() => { const ad = document.querySelector('#view .v31-adesso'); return [ad.querySelector('.v31-ad-t').textContent, !!ad.querySelector('[data-act="v26-chiudi-giornata"]')]; });
  a(r[0] === 'La giornata di lavoro è finita' && r[1], 'sera: finita + Chiudi la giornata ' + JSON.stringify(r));
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); render(); }); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/v31_sera_tel.png' });
  await browser.close();

})();
