// v54 · in Oggi la testa «La giornata» non si taglia quando ci sono appuntamenti finiti e il tasto «Mostra»
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-23T19:00:00+01:00';
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const ev = [];
for (let i = 0; i < 10; i++) { const h = String(8 + i).padStart(2, '0'); ev.push({ id: 'e' + i, status: 'confirmed', summary: 'Appuntamento ' + i, start: { dateTime: `2026-11-23T${h}:00:00+01:00` }, end: { dateTime: `2026-11-23T${h}:30:00+01:00` }, organizer: io, creator: io }); }
const events = { 'r.macinai@sisoluzioniimpresa.it': ev, 'maci81x@gmail.com': [] };
const O = process.env.OUT || '/tmp';
const testa = () => {
  const h = [...document.querySelectorAll('p.list-head')].find(x => /La giornata/.test(x.textContent));
  if (!h) return null;
  const t = h.querySelector('span:first-child'), b = h.querySelector('.v12-mostra');
  const r = h.getBoundingClientRect(), rb = b ? b.getBoundingClientRect() : null;
  return { titolo: t.textContent, tagliato: t.scrollWidth > t.clientWidth + 1, testo: h.innerText.replace(/\n/g, ' '), tasto: !!b, dentro: rb ? rb.right <= r.right + 1 && rb.left >= r.left - 1 : false, larga: Math.round(r.width) };
};
(async () => {
  for (const [nome, vp] of [['computer', { width: 1440, height: 900 }], ['900', { width: 900, height: 900 }], ['telefono', null]]) {
    const { browser, page, logs } = await apriApp({ ...(vp ? { viewport: vp } : { mobile: true }), ora: ORA, events, attesa: 4500 });
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(900);
    const r = await page.evaluate(testa);
    a(r && r.titolo === 'La giornata' && !r.tagliato, nome + ': il titolo «La giornata» si legge intero · ' + JSON.stringify(r));
    a(r && r.tasto && r.dentro && /tutti e 10 finiti/.test(r.testo) && !/appuntamenti/.test(r.testo), nome + ': conteggio e tasto «Mostra» dentro la testa · ' + JSON.stringify(r));
    const h = await page.$('p.list-head:has(.v12-mostra)'); if (h) await h.screenshot({ path: O + '/v54_testa_' + nome + '.png' });
    a(!errori(logs).length, nome + ': nessun errore in console ' + JSON.stringify(errori(logs)));
    await browser.close();
  }
  // a metà giornata, sul telefono: 4 finiti su 10
  { const { browser, page, logs } = await apriApp({ mobile: true, ora: '2026-11-23T11:45:00+01:00', events, attesa: 4500 });
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(900);
    const r = await page.evaluate(testa);
    a(r && !r.tagliato && r.dentro && /10 appuntamenti · 4 finiti/.test(r.testo), 'telefono a metà giornata: titolo intero, «10 appuntamenti · 4 finiti» · ' + JSON.stringify(r));
    const h = await page.$('p.list-head:has(.v12-mostra)'); if (h) await h.screenshot({ path: O + '/v54_testa_meta.png' });
    await browser.close(); }
})();
