// v47 · Pianifica › Settimana come il foglio di Leo
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-19T07:50:00+01:00';
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  { id: 'e1', status: 'confirmed', summary: 'Mattina con area Manetti', start: { dateTime: T('20', '10:00') }, end: { dateTime: T('20', '12:00') }, organizer: io, creator: io, attendees: [{ email: 'x@y.it' }, { ...io }] },
  { id: 'e2', status: 'confirmed', summary: 'Webinar', start: { dateTime: T('19', '15:00') }, end: { dateTime: T('19', '16:00') }, organizer: io, creator: io }
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 2, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const cicli = [
  base('r1', 'Controllare tutti MAU ordini rimasti da incassare', { q: 1, pianificato_data: '2026-11-11' }),
  base('r2', 'Definire tempo per gestione incassi dei commerciali', { pianificato_data: '2026-11-11' }),
  base('r3', 'Recuperare clienti da database per i commerciali nuovi', { pianificato_data: '2026-11-13' }),
  base('d1', 'Preventivo Ferroli + sds', { q: 1 }), base('d2', 'Scrivere su claude', {}),
  base('g1', 'Caricare BP', { q: 1, pianificato_data: '2026-11-19' }), base('g2', 'Chiamare Laura Franci', { pianificato_data: '2026-11-19' }),
  base('g3', 'Preventivo Rosseti', { pianificato_data: '2026-11-20' })
];
for (let i = 0; i < 18; i++) cicli.push(base('v' + i, 'Cosa di venerdì ' + i, { pianificato_data: '2026-11-20' }));
const seed = { cicli, battle_plan: [{ id: 'bp47', settimana: 47, anno: 2026, stato: 'bozza', creato_at: ora }], battle_plan_items: [{ id: 'it1', battle_plan_id: 'bp47', ciclo_id: 'd2', giorno: 'settimana', ordine: 0 }] };
(async () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 2000, height: 1050 }]) {
    const { browser, page, logs } = await apriApp({ viewport: vp, ora: ORA, events, seed, attesa: 4500 });
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); ui.pian = 'settimana'; vai('pianifica'); }); await page.waitForTimeout(900);
    let r = await page.evaluate(() => {
      const cols = document.querySelector('.cols.board'), sc = document.querySelector('.board-scorri');
      return { testa: !!document.querySelector('.v47-testa'), giallo: !!document.querySelector('.v47-alto .bcol-sett .bzona[data-zona="settimana"]'), blu: !!document.querySelector('.v47-alto .v26-obiettivi'),
        carry: !!document.querySelector('section.carry'), pill: (document.querySelector('.v47-pill') || {}).innerText, ind: [...document.querySelectorAll('#v47-indietro .item-title')].map(x => x.innerText.trim()),
        scorriLato: sc ? sc.scrollWidth - sc.clientWidth : -1, colonne: cols ? [...cols.children].filter(x => x.classList.contains('bcol')).length : 0 };
    });
    a(r.testa && r.giallo && r.blu && !r.carry, vp.width + ': in alto giallo e blu, niente blocco grande ' + JSON.stringify(r));
    a(r.ind.length === 3 && /3 rimaste indietro/.test(r.pill || ''), vp.width + ': rimaste indietro in cima a Da pianificare ' + JSON.stringify(r.ind));
    a(r.scorriLato <= 2, vp.width + ': tutti i giorni in vista senza scorrere di lato ' + r.scorriLato);
    await page.screenshot({ path: (process.env.OUT || '/tmp') + `/v47_${vp.width}.png` });
    await page.evaluate(() => { const m = document.getElementById('main'); m.scrollTop = 900; }); await page.waitForTimeout(400);
    r = await page.evaluate(() => { const t = document.querySelector('.v47-testa').getBoundingClientRect(), h = document.querySelector('.cols.board > .bcol.oggi > .bcol-h'); const q = h && h.getBoundingClientRect(); return { testaTop: Math.round(t.top), testaBottom: Math.round(t.bottom), giornoTop: q ? Math.round(q.top) : null, scroll: document.getElementById('main').scrollTop }; });
    a(r.scroll > 100 && r.testaTop <= 80 && r.giornoTop !== null && Math.abs(r.giornoTop - r.testaBottom) < 30, vp.width + ': scorrendo la testa e i giorni restano in alto ' + JSON.stringify(r));
    await page.screenshot({ path: (process.env.OUT || '/tmp') + `/v47_${vp.width}_scorso.png` });
    // trascinare dal giallo a un giorno funziona ancora
    await page.evaluate(() => { document.getElementById('main').scrollTop = 0; }); await page.waitForTimeout(300);
    if (vp.width === 1440) {
      await page.dragAndDrop('.v47-alto .item[data-id="d2"]', '.cols.board .bzona[data-zona="sabato"]'); await page.waitForTimeout(1200);
      a(await page.evaluate(() => ciclo('d2').pianificato_data === '2026-11-21'), 'dal giallo al sabato con il trascinamento');
    }
    { const e = errori(logs); a(!e.length, 'console ' + JSON.stringify(e.slice(0, 3))); }
    await browser.close();
  }
})();
