// v50 · sfondo salvia, schede in Oggi, Da controllare sul telefono, Delega torna a Smaltisci + controllo accessibilità (axe, se c'è)
const { apriApp, errori, assertDi } = require('./harness');
const fs = require('fs'), path = require('path');
const a = assertDi();
const ORA = '2026-11-19T08:30:00+01:00';
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  { id: 'co', status: 'confirmed', summary: 'Coach Leo', start: { dateTime: T('19', '10:00') }, end: { dateTime: T('19', '11:00') }, organizer: io, creator: io, attendees: [{ email: 'l@osm.it' }, { ...io }] },
  { id: 'rs', status: 'confirmed', summary: 'Prepara il Business Plan', start: { dateTime: T('20', '14:00') }, end: { dateTime: T('20', '16:00') }, organizer: io, creator: io },
  { id: 'fv', status: 'confirmed', summary: 'Preventivo cliente Rossi', start: { dateTime: T('24', '09:00') }, end: { dateTime: T('24', '10:00') }, organizer: io, creator: io, attendees: [{ email: 'mario@rossi.it' }, { ...io }] }
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { persone: [{ id: 'pn', nome: 'Nicco', ctx: 'lavoro' }], cicli: [
  base('v', 'Chiamare il notaio', { pianificato_data: '2026-11-16' }),
  base('v2', 'Mandare i KPI ai soci', { q: 2, pianificato_data: '2026-11-17' }),
  base('w', 'Report soci', { pianificato_data: '2026-11-19' }),
  base('i', 'Piano formazione 2027', { q: 2, pianificato_data: '2026-11-19' }),
  base('p', 'SSI – report amministrativo', { fonte: 'posta', posta_tipo: 'da_fare', due_date: '2026-11-20' })] };
const O = process.env.OUT || '/tmp';
const AXE = path.join(process.env.NM || '', 'axe-core/axe.min.js');
async function axe(page, nome) {
  if (!fs.existsSync(AXE)) { console.log('---  axe non installato: salto'); return; }
  await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, es: v.nodes.slice(0, 2).map(x => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n').slice(1, 2).join('')) })));
  fs.writeFileSync(O + `/axe_${nome}.json`, JSON.stringify(r, null, 1));
  const gravi = r.filter(v => v.impact === 'critical' || v.impact === 'serious');
  console.log(`axe ${nome}: ${r.length} tipi di problemi, gravi: ${gravi.map(v => v.id + '×' + v.n).join(', ') || 'nessuno'}`);
  return r;
}
(async () => {
  let { browser, page, logs } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, events, seed, attesa: 4500 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(800);
  let r = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const g = document.querySelector('.v12-righe'), it = [...g.querySelectorAll(':scope > .item')];
    const b = it.map(x => x.getBoundingClientRect());
    return { bg, gap: getComputedStyle(g).rowGap, staccate: b.length > 1 && b[1].top - b[0].bottom >= 6, raggio: getComputedStyle(it[0]).borderTopLeftRadius, q1: getComputedStyle(it.find(x => x.classList.contains('p-q1'))).boxShadow };
  });
  a(r.bg === 'rgb(241, 244, 242)', 'sfondo salvia ' + r.bg);
  a(r.gap === '8px' && r.staccate && r.raggio === '12px', 'Oggi: righe staccate, schede ' + JSON.stringify(r));
  a(/217, 45, 32/.test(r.q1), 'Subito con la riga rossa ' + r.q1);
  await page.screenshot({ path: O + '/v50_oggi.png' });
  await axe(page, 'oggi_pc');
  // Smaltisci: Delega e ritorno
  await page.evaluate(() => v49Apri()); await page.waitForTimeout(400);
  await axe(page, 'smaltisci_pc');
  const k = await page.evaluate(async () => { const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }); document.dispatchEvent(ev); await new Promise(r => setTimeout(r, 100)); return document.getElementById('v49Overlay').classList.contains('open'); });
  a(!k, 'Esc chiude Smaltisci');
  await page.evaluate(() => v49Apri()); await page.waitForTimeout(300);
  await page.click('.v49-sc[data-act="v49-delega"]'); await page.waitForTimeout(500);
  a(await page.evaluate(() => document.getElementById('delegaOverlay').classList.contains('open') && !document.getElementById('v49Overlay').classList.contains('open')), 'Delega apre il suo foglio');
  await page.evaluate(() => { const p = document.querySelector('#delega-persone [data-p="pn"]'); if (p) p.click(); }); await page.waitForTimeout(200);
  await page.evaluate(() => { const b = document.querySelector('[data-act="delega-salva"]'); if (b) b.click(); }); await page.waitForTimeout(1500);
  r = await page.evaluate(() => ({ sm: document.getElementById('v49Overlay').classList.contains('open'), n: (document.querySelector('.v49-testa .mono') || {}).textContent, tit: (document.querySelector('.v49-tit') || {}).textContent, del: ciclo('v').delega_persona_id }));
  a(r.sm && r.del === 'pn' && r.n === '2 di 2' && r.tit === 'Mandare i KPI ai soci', 'dopo la delega torna a Smaltisci, alla prossima ' + JSON.stringify(r));
  await page.keyboard.press('z'); await page.waitForTimeout(1200);
  r = await page.evaluate(() => ({ del: ciclo('v').delega_persona_id || null, tit: (document.querySelector('.v49-tit') || {}).textContent }));
  a(r.del === null && r.tit === 'Chiamare il notaio', 'Z annulla la delega ' + JSON.stringify(r));
  await page.evaluate(() => closeModal('v49Overlay'));
  await page.evaluate(() => { ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(900);
  await axe(page, 'pianifica_pc');
  // tema scuro: Pianifica e Oggi si vedono
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); render(); }); await page.waitForTimeout(600);
  await page.screenshot({ path: O + '/v50_pianifica_scuro.png' });
  await axe(page, 'pianifica_scuro');
  await page.evaluate(() => vai('oggi')); await page.waitForTimeout(600);
  await page.screenshot({ path: O + '/v50_oggi_scuro.png' });
  r = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  a(r !== 'rgb(241, 244, 242)', 'scuro: lo sfondo resta scuro ' + r);
  { const e = errori(logs); a(!e.length, 'computer console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  ({ browser, page, logs } = await apriApp({ mobile: true, ora: ORA, events, seed, attesa: 4500 }));
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(700);
  r = await page.evaluate(() => { const c = document.querySelector('.v49-ctl.v50-tel'); return c && { n: c.querySelectorAll(':scope > .v49-r, :scope > .v49-diretto').length, dopoRosso: !!(c.previousElementSibling && (c.previousElementSibling.matches('.v12-griglia, .v12-card'))), banner: document.querySelectorAll('#view .banner-piano:not(.v49-r-corpo *)').length }; });
  a(r && r.n >= 2 && r.banner === 0, 'telefono: Da controllare sotto le cose da chiudere ' + JSON.stringify(r));
  const pic = await page.evaluate(() => [...document.querySelectorAll('#view button, #view [role=button], #view input[type=checkbox] + .check-box, #view summary')].filter(b => b.offsetParent).map(b => { const q = b.getBoundingClientRect(); return { h: Math.round(q.height), w: Math.round(q.width), t: (b.innerText || b.getAttribute('aria-label') || b.className).trim().slice(0, 30) }; }).filter(x => x.h < 32 || x.w < 32));
  console.log('tocchi piccoli (<32px):', JSON.stringify(pic.slice(0, 12)));
  await page.evaluate(() => { const m = document.getElementById('main'); if (m) m.scrollTop = 0; });
  await page.screenshot({ path: O + '/v50_oggi_tel.png', fullPage: false });
  await page.evaluate(() => { const c = document.querySelector('.v49-ctl'); if (c) c.scrollIntoView(); }); await page.waitForTimeout(300);
  await page.screenshot({ path: O + '/v50_oggi_tel_ctl.png' });
  await axe(page, 'oggi_tel');
  { const e = errori(logs); a(!e.length, 'telefono console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
