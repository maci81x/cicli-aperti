// v46 · rifiniture: posta neutra, traccia nel giorno passato, coach compatto; telefono Pianifica
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-17T15:30:00+01:00';
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  { id: 'co', status: 'confirmed', summary: 'Coach Leo', start: { dateTime: T('18', '18:30') }, end: { dateTime: T('18', '19:30') }, organizer: io, creator: io, attendees: [{ email: 'l.beretta@osmanagement.it' }, { ...io }] },
  { id: 'x2', status: 'confirmed', summary: 'chiamata responsabili Xrun', start: { dateTime: T('17', '18:15') }, end: { dateTime: T('17', '18:45') }, organizer: io, creator: io, attendees: [{ email: 'p.russi@x.it' }, { ...io }] }
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const seed = { cicli: [base('v', 'Chiamare il notaio', { pianificato_data: '2026-11-16' }), base('p', 'SSI – report amministrativo', { fonte: 'posta', posta_tipo: 'da_fare', due_date: '2026-11-20' }), base('i', 'Piano formazione 2027', { q: 2, pianificato_data: '2026-11-18' }), base('s2', 'Preventivo Cellese', {})] };
(async () => {
  let { browser, page, logs } = await apriApp({ viewport: { width: 1660, height: 1000 }, ora: ORA, events, seed, attesa: 4500 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(700);
  let r = await page.evaluate(() => { const t = document.querySelector('.tag-posta'); return t && getComputedStyle(t).color; });
  a(r && r !== 'rgb(29, 95, 168)', 'etichetta posta neutra ' + r);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v46_oggi.png' });
  await page.evaluate(() => { ui.pian = 'settimana'; ui.v21Passati = true; vai('pianifica'); }); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ traccia: !!document.querySelector('.bzona[data-zona="lunedi"] .item.v46-traccia[data-id="v"]'), testo: (document.querySelector('.bzona[data-zona="lunedi"] .item[data-id="v"] .ritardo') || {}).innerText, inDp: !!document.querySelector('#dp-lista .item[data-id="v"]') }));
  a(r.traccia && /Da pianificare/.test(r.testo || '') && r.inDp, 'lunedì: traccia; in cima a Da pianificare ' + JSON.stringify(r));
  await page.evaluate(() => { const b = document.querySelector('.bt-mostra-passati, [data-act="mostra-passati"]'); if (b) b.click(); }); await page.waitForTimeout(300);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v46_pianifica.png' });
  // spuntare una cosa in fondo all'elenco non lo riporta in cima
  const sp = await page.evaluate(async () => {
    const l = document.querySelector('#dp-lista'); if (!l) return null;
    for (let i = 0; i < 40; i++) state.cicli.push({ id: 'z' + i, title: 'Riempitivo ' + i, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrenza: 'nessuna', created_at: new Date().toISOString(), persone_menzionate: [] });
    render(); await new Promise(r => setTimeout(r, 300));
    const L = document.querySelector('#dp-lista'); L.scrollTop = 900; const prima = L.scrollTop;
    render(); await new Promise(r => setTimeout(r, 300));
    return { prima, dopo: document.querySelector('#dp-lista').scrollTop, alt: L.scrollHeight };
  });
  a(sp && sp.prima > 0 && Math.abs(sp.dopo - sp.prima) < 3, 'ridisegnando, Da pianificare resta dov\'era ' + JSON.stringify(sp));
  const sp2 = await page.evaluate(async () => {
    const L = document.querySelector('#dp-lista'); L.scrollTop = 600; const prima = L.scrollTop;
    const items = [...L.querySelectorAll('.item')]; const mid = items.find(it => it.getBoundingClientRect().top > L.getBoundingClientRect().top + 40);
    const cb = mid && mid.querySelector('input[type=checkbox]'); if (!cb) return { nocb: true };
    cb.click(); await new Promise(r => setTimeout(r, 1500));
    return { prima, dopo: document.querySelector('#dp-lista').scrollTop };
  });
  a(sp2 && !sp2.nocb && sp2.dopo > sp2.prima - 120, 'spuntando a metà elenco, resta lì ' + JSON.stringify(sp2));
  { const e = errori(logs); a(!e.length, 'computer console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
  ({ browser, page, logs } = await apriApp({ mobile: true, ora: ORA, events, seed, attesa: 4500 }));
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(800);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v46_pianifica_tel.png', fullPage: true });
  await page.evaluate(async () => { for (let i = 0; i < 25; i++) state.cicli.push({ id: 't' + i, title: 'Cosa di oggi ' + i, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrenza: 'nessuna', pianificato_data: '2026-11-17', created_at: new Date().toISOString(), persone_menzionate: [] }); ui.giorno = 1; render(); });
  await page.waitForTimeout(500);
  await page.evaluate(() => { const m = document.getElementById('main'); if (m) m.scrollTop = 2500; window.scrollTo(0, 2500); }); await page.waitForTimeout(400);
  const bt = await page.evaluate(() => { v44Aggiorna(); const b = document.querySelector('#v44-testa'); return { su: b.classList.contains('su'), giorni: b.querySelectorAll('.day').length }; });
  a(bt.su && bt.giorni >= 5, 'telefono: scorrendo resta la settimana con i giorni ' + JSON.stringify(bt));
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v46_barra_tel.png' });
  if (bt.su) { await page.click('#v44-testa .day[data-i="3"]'); await page.waitForTimeout(700); a(await page.evaluate(() => ui.giorno === 3), 'telefono: tocco giovedì nella barra'); }
  await page.evaluate(() => { vai('oggi'); }); await page.waitForTimeout(600);
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/v46_oggi_tel.png', fullPage: true });
  { const e = errori(logs); a(!e.length, 'telefono console ' + JSON.stringify(e.slice(0, 3))); }
  await browser.close();
})();
