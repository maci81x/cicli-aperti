// v49 · Smaltisci, Oggi «Da controllare», Pianifica a schede (stile 14, colori 15)
const { apriApp, errori, assertDi } = require('./harness');
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
const seed = { cicli: [
  base('v', 'Chiamare il notaio', { pianificato_data: '2026-11-16' }),
  base('v2', 'Mandare i KPI ai soci', { q: 2, pianificato_data: '2026-11-17' }),
  base('v3', 'Ordinare la carta', { q: 2, pianificato_data: '2026-11-18' }),
  base('w', 'Report soci', { pianificato_data: '2026-11-19' }),
  base('p', 'SSI – report amministrativo', { fonte: 'posta', posta_tipo: 'da_fare', due_date: '2026-11-20' }),
  base('i', 'Piano formazione 2027', { q: 2, pianificato_data: '2026-11-20' })] };
const O = process.env.OUT || '/tmp';
(async () => {
  let { browser, page, logs, db } = await apriApp({ viewport: { width: 1440, height: 900 }, ora: ORA, events, seed, attesa: 4500 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(800);
  // Oggi: Da controllare
  let r = await page.evaluate(() => { const c = document.querySelector('.v33-dx .v49-ctl'); return c && { n: c.querySelectorAll(':scope > .v49-r, :scope > .v49-diretto').length, testi: [...c.querySelectorAll(':scope > .v49-r summary b, :scope > .v49-diretto b')].map(x => x.textContent.trim()), centro: [...document.querySelectorAll('.v33-centro .banner-piano, .v33-centro .v29-prep, .v33-centro .v23-posta')].length, metodo: !!document.querySelector('.v33-sx .v43-metodo .v12-card') }; });
  a(r && r.n >= 2 && r.centro === 0 && !r.metodo, 'Oggi: un solo riquadro Da controllare ' + JSON.stringify(r));
  a(r && r.testi.some(t => /Obiettivi/.test(t)) && r.testi.some(t => /Da rispondere/.test(t)), 'dentro: obiettivi e posta ' + JSON.stringify(r && r.testi));
  const smOggi = await page.evaluate(() => { const b = document.querySelector('.v49-oggi'); return b && b.textContent.trim(); });
  a(/Smaltisci le 3 rimaste indietro/.test(smOggi || ''), 'Oggi: bottone Smaltisci ' + smOggi);
  // si apre una riga e resta aperta dopo un nuovo disegno
  const det = await page.evaluate(async () => { const d = document.querySelector('.v49-ctl details.v49-r'); if (!d) return 'nessuna'; d.querySelector('summary').click(); await new Promise(r => setTimeout(r, 100)); render(); await new Promise(r => setTimeout(r, 300)); const k = d.dataset.v49; return document.querySelector(`.v49-ctl details[data-v49="${k}"]`).open; });
  a(det === true, 'riga aperta resta aperta ' + det);
  await page.screenshot({ path: O + '/v49_oggi.png' });
  // Smaltisci
  await page.click('.v49-oggi'); await page.waitForTimeout(500);
  r = await page.evaluate(() => ({ open: document.getElementById('v49Overlay').classList.contains('open'), t: document.querySelector('.v49-tit').textContent, n: document.querySelector('.v49-testa .mono').textContent }));
  a(r.open && r.t === 'Chiamare il notaio' && r.n === '1 di 3', 'Smaltisci: prima la Subito, 1 di 3 ' + JSON.stringify(r));
  await page.screenshot({ path: O + '/v49_smaltisci.png' });
  await page.keyboard.press('1'); await page.waitForTimeout(1200);
  r = await page.evaluate(() => ({ d: ciclo('v').pianificato_data, t: document.querySelector('.v49-tit') && document.querySelector('.v49-tit').textContent, n: document.querySelector('.v49-testa .mono').textContent }));
  a(r.d === '2026-11-19' && r.n === '2 di 3', 'tasto 1: oggi, e passa alla prossima ' + JSON.stringify(r));
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
  const saltata = await page.evaluate(() => document.querySelector('.v49-tit').textContent);
  await page.keyboard.press('4'); await page.waitForTimeout(1200);
  r = await page.evaluate(t => ({ chiusa: state.cicli.find(c => c.title === t).done }), saltata);
  a(r.chiusa, 'tasto 4: chiusa ' + saltata);
  await page.keyboard.press('z'); await page.waitForTimeout(1500);
  r = await page.evaluate(t => ({ chiusa: state.cicli.find(c => c.title === t).done, tit: document.querySelector('.v49-tit') && document.querySelector('.v49-tit').textContent }), saltata);
  a(!r.chiusa && r.tit === saltata, 'Z: riaperta e torna lì ' + JSON.stringify(r));
  await page.click('.v49-sc[data-act="v49-settimana"]'); await page.waitForTimeout(1300);
  r = await page.evaluate(t => { const c = state.cicli.find(x => x.title === t); return { it: state.bpItems.find(i => i.ciclo_id === c.id), fine: document.querySelector('.v49-fine-t, .v49-tit').textContent }; }, saltata);
  a(r.it && r.it.giorno === 'settimana', 'Pensaci dopo: in settimana ' + JSON.stringify(r));
  // ne resta una saltata
  a(/Le hai viste tutte|Mandare/.test(r.fine), 'dopo Pensaci dopo non resta tra le rimaste: ' + r.fine);
  await page.evaluate(() => closeModal('v49Overlay'));
  // Pianifica: schede, appuntamenti viola, orario a sinistra
  await page.evaluate(() => { ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(900);
  r = await page.evaluate(() => {
    const z = document.querySelector('.bzona[data-zona="giovedi"]'); const cs = z && getComputedStyle(z);
    const co = document.querySelector('.board .evt-riga.v24-altri'); const mio = document.querySelector('.board .evt-riga.v24-mio');
    return { gap: cs && cs.rowGap, bg: cs && cs.backgroundColor, coBg: co && getComputedStyle(co).backgroundColor, coOre: co && (co.querySelector('.v49-ore') || {}).innerText, mioBg: mio && getComputedStyle(mio).backgroundColor, pill: (document.querySelector('.v47-pill') || {}).textContent, btn: !!document.querySelector('.v50-sm-riga'), lib: (document.querySelector('.board .spazio-riga .item-title') || {}).innerText, sx: document.documentElement.scrollWidth <= window.innerWidth };
  });
  a(r.gap === '8px' && /rgba\(0, 0, 0, 0\)|transparent/.test(r.bg), 'giorni: schede separate ' + JSON.stringify(r));
  a(r.coBg === 'rgb(91, 90, 142)' && /10:00\s*11:00/.test(r.coOre || ''), 'con altri: viola pieno, orario a sinistra ' + JSON.stringify(r));
  a(r.mioBg === 'rgb(239, 239, 247)', 'tuo: viola chiaro ' + r.mioBg);
  a(/Libero dalle/.test(r.lib || ''), 'spazio libero in una riga ' + r.lib);
  a(r.btn && r.sx, 'Smaltisci nel gruppo, niente scorrimento di lato');
  await page.screenshot({ path: O + '/v49_pianifica.png' });
  await page.click('.v47-pill'); await page.waitForTimeout(400);
  a(await page.evaluate(() => document.getElementById('v49Overlay').classList.contains('open')), 'il bollino apre Smaltisci');
  await page.evaluate(() => closeModal('v49Overlay'));
  { const e = errori(logs); a(!e.length, 'computer console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  ({ browser, page, logs } = await apriApp({ mobile: true, ora: ORA, events, seed, attesa: 4500 }));
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(600);
  await page.evaluate(() => v49Apri()); await page.waitForTimeout(500);
  r = await page.evaluate(() => { const b = document.querySelector('.v49-giorni .v49-big'); const s = document.querySelector('.v49-sm'); const W = s.getBoundingClientRect().right; return { bw: b.getBoundingClientRect().width, bh: b.getBoundingClientRect().height, over: s.scrollWidth > s.clientWidth + 1, chi: [...s.querySelectorAll('*')].filter(x => x.getBoundingClientRect().right > W + 1).map(x => x.className).slice(0, 4) }; });
  a(r.bw > 150 && r.bh >= 70 && !r.over, 'telefono: Oggi e Domani grandi ' + JSON.stringify(r));
  await page.screenshot({ path: O + '/v49_smaltisci_tel.png' });
  await page.click('.v49-giorni .v49-big[data-iso="2026-11-20"]'); await page.waitForTimeout(1200);
  a(await page.evaluate(() => ciclo('v').pianificato_data === '2026-11-20'), 'telefono: Domani con un tocco');
  { const e = errori(logs); a(!e.length, 'telefono console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
