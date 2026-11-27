// v55 · il venerdì «Prepara la settimana» in Oggi apre la settimana PROSSIMA (prima riapriva quella che finisce)
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-27T17:10:00+01:00';   // venerdì, settimana 48
const ora = new Date(ORA).toISOString();
const seedSent = { battle_plan: [{ id: 'bp48', settimana: 48, anno: 2026, stato: 'inviato', creato_at: ora, inviato_at: ora, obiettivi: [] }] };
const O = process.env.OUT || '/tmp';
const ritmo = () => { const r = document.querySelector('.v31-ad-ritmo'); return r ? { t: r.innerText.replace(/\n/g, ' '), act: (r.querySelector('button.btn:not(.btn-icon)') || {}).dataset?.act || '' } : null; };
(async () => {
  for (const [nome, seed] of [['senza piani', {}], ['piano della 48 già mandato', seedSent]]) {
    const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, seed, attesa: 4500 });
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(1200);
    const r = await page.evaluate(ritmo);
    a(r && /prepara la settimana prossima/i.test(r.t) && r.act === 'banner-piano' && /settimana 49/i.test(r.t), nome + ': carta del venerdì per la settimana 49 · ' + JSON.stringify(r));
    await page.click('.v31-ad-ritmo button[data-act="banner-piano"]'); await page.waitForTimeout(900);
    const ob = await page.evaluate(() => ({ aperto: !!document.querySelector('#v26obOverlay.open'), titolo: (document.getElementById('v26ob-titolo') || {}).textContent, sotto: (document.getElementById('v26ob-sotto') || {}).textContent }));
    a(ob.aperto && /settimana prossima/.test(ob.titolo) && /Settimana 49 \(30/.test(ob.sotto), nome + ': gli obiettivi sono della settimana 49 · ' + JSON.stringify(ob));
    if (nome === 'senza piani') await page.screenshot({ path: O + '/v55_obiettivi.png' });
    a(!errori(logs).length, nome + ': console pulita ' + JSON.stringify(errori(logs).slice(0, 3)));
    await browser.close();
  }
  // lunedì la carta B resta sulla settimana in corso
  const { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: '2026-11-30T10:00:00+01:00', attesa: 4500 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(1000);
  await page.evaluate(() => AZIONI.wizard()); await page.waitForTimeout(900);
  const ob = await page.evaluate(() => ({ titolo: (document.getElementById('v26ob-titolo') || {}).textContent, sotto: (document.getElementById('v26ob-sotto') || {}).textContent }));
  a(/questa settimana/.test(ob.titolo) && /Settimana 49/.test(ob.sotto), 'lunedì: «Prepara la settimana» è la settimana in corso · ' + JSON.stringify(ob));
  await browser.close();
})();
