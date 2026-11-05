// v35 · foglio del giorno: appuntamenti ora per ora, ore libere vuote per scrivere, sovrapposizioni segnalate
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const ev = (id, summary, h1, h2) => ({ id, status: 'confirmed', summary, start: { dateTime: `2026-11-06T${h1}:00+01:00` }, end: { dateTime: `2026-11-06T${h2}:00+01:00` }, organizer: io, creator: io });
const events = { 'r.macinai@sisoluzioniimpresa.it': [ev('dv', 'DV - Controllo settimanale andamento agenti', '11:00', '13:00'), ev('pg', '13.15 - Pranzo Giova firenze', '13:15', '15:00'), ev('cm', 'Con Marcello', '16:45', '18:30'), ev('bp', '16.45 - Prepara il Business Plan', '16:45', '18:30')], 'maci81x@gmail.com': [] };
(async () => {
  const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: '2026-11-05T18:00:00+01:00', events, attesa: 3500 });
  await page.evaluate(() => v26Stampa([new Date(2026, 10, 6)])); await page.waitForTimeout(1500);
  const t = await page.evaluate(() => window.__v26UltimaStampa.doc.output());
  const has = s => t.includes(s);
  a(has('Appuntamenti, ora per ora'), 'titolo della sezione');
  a(has('08:00') && has('09:00') && has('10:00') && has('15:00') && has('18:00'), 'ore libere stampate come righe');
  a(has('in corso: DV') && has('12:00'), '12:00 occupato da DV');
  a(has('Con Marcello') && has('Prepara il Business Plan'), 'gli appuntamenti ci sono');
  a(/si sovrappone a .{0,4}Prepara il Business Plan/.test(t) && /si sovrappone a .{0,4}Con Marcello/.test(t), 'sovrapposizione segnalata su tutti e due');
  const b64 = await page.evaluate(() => window.__v26UltimaStampa.doc.output('datauristring').split(',')[1]);
  require('fs').writeFileSync((process.env.OUT || '/tmp') + '/v35_foglio.pdf', Buffer.from(b64, 'base64'));
  { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
