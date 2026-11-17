// v43 · Carta e salvia: niente rosa pieno; sul computer il metodo a sinistra e le cose da chiudere larghe
const { apriApp, errori, assertDi } = require('./harness');
const a = assertDi();
const ORA = '2026-11-17T15:30:00+01:00';
const io = { email: 'r.macinai@sisoluzioniimpresa.it', self: true };
const T = (d, h) => `2026-11-${d}T${h}:00+01:00`;
const ev = (id, s, d, h1, h2, extra) => ({ id, status: 'confirmed', summary: s, start: { dateTime: T(d, h1) }, end: { dateTime: T(d, h2) }, organizer: io, creator: io, ...extra });
const events = { 'r.macinai@sisoluzioniimpresa.it': [
  ev('x1', 'Allineamento samu/roby', '17', '09:30', '12:00', { attendees: [{ email: 's.corti@sisoluzioniimpresa.it' }, { ...io }] }),
  ev('x2', 'chiamata responsabili Xrun', '17', '18:15', '18:45', { attendees: [{ email: 'p.russi@x.it' }, { ...io }] }),
  ev('x3', 'Capelli', '17', '16:00', '16:30'),
  ev('co', 'Coach Leo', '18', '18:30', '19:30', { attendees: [{ email: 'l.beretta@osmanagement.it' }, { ...io }] })
], 'maci81x@gmail.com': [] };
const ora = new Date(ORA).toISOString();
const base = (id, title, extra) => ({ id, title, q: 1, ctx: 'lavoro', cat: 'management', done: false, ricorrente: false, ricorrenza: 'nessuna', week: 47, year: 2026, created_at: ora, updated_at: ora, persone_menzionate: [], ...extra });
const titoli = ["SSI – report amministrativo sett. 46 (Martini): entro ven 20/11 decidi con lo studio sull'IVA di ottobre", "Rosseti – Poggibonsi: integrazioni chieste dall'ASL – organizza con Cristofori DVR, notturno, ATEX", "Arillo – piscina Villa Terrabianca: rivedi l'analisi di Ale con Giovi e girala ad Alberto Fusi", 'Termopoint: controllare gli accordi e mandare i dati del condominio Lazzeretto', 'Mandare ai commerciali l\'andamento dei loro obiettivi e il Battle Plan', 'Oppiano – fissare un appuntamento con Giulio per aggiornamento HACCP', 'Preventivo Biondi Santi – messaggio/mail Nicco', 'Preventivo Cellese + conferma RID'];
const seed = { cicli: [...titoli.map((t, i) => base('s' + i, t, i < 3 ? { fonte: 'posta', posta_tipo: 'da_fare', due_date: i === 0 ? '2026-11-20' : null } : {})), base('i1', 'Preparare il piano formazione 2027', { q: 2, pianificato_data: '2026-11-17' })] };
(async () => {
  for (const vp of [{ viewport: { width: 1660, height: 1000 } }, { mobile: true }]) {
    const tag = vp.mobile ? 'telefono' : 'computer';
    const { browser, page, logs } = await apriApp({ ...vp, ora: ORA, events, seed, attesa: 4500 });
    await page.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open')); vai('oggi'); }); await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const sub = document.querySelector('.item.p-q1:not(.is-done) .item-row');
      const metodo = document.querySelector('.v33-sx .v43-metodo');
      const centro = document.querySelector('.v33-centro .v12-card.v12-rosso');
      return { bgSub: sub && getComputedStyle(sub).backgroundColor, metodo: metodo ? [...metodo.querySelectorAll('.v12-card h3')].map(x => x.innerText) : null,
        larghezzaCentro: centro ? Math.round(centro.getBoundingClientRect().width) : 0, bg: getComputedStyle(document.body).backgroundColor };
    });
    a(r.bgSub === 'rgba(0, 0, 0, 0)', tag + ': Subito senza riquadro rosa ' + r.bgSub);
    if (!vp.mobile) a(r.metodo && r.metodo.length >= 1 && r.larghezzaCentro > 600, 'computer: metodo a sinistra, cose da chiudere larghe ' + JSON.stringify(r));
    await page.screenshot({ path: (process.env.OUT || '/tmp') + `/v43_${tag}.png`, fullPage: !vp.mobile });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; }); await page.waitForTimeout(300);
    await page.screenshot({ path: (process.env.OUT || '/tmp') + `/v43_${tag}_scuro.png` });
    { const e = errori(logs); a(!e.length, tag + ' console ' + JSON.stringify(e.slice(0, 3))); }
    await browser.close();
  }
})();
