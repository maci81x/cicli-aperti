// Lettura della posta di lavoro per Cicli Aperti — si incolla in una scheda di Gmail (mail.google.com/mail/u/0) con javascript_tool.
// NON segna niente come letto: legge la «vista di stampa» (view=pt) e gli allegati «visualizza come HTML» (disp=vah) con fetch.
// Non apre mai la vista di stampa come pagina (aprirebbe la finestra di stampa e bloccherebbe la scheda).
// Uso:
//   await __posta.lista()                       → righe della ricerca mostrata ora in Gmail (id, non letta, mittenti, oggetto, data)
//   await __posta.leggi(['id1','id2'], { da: '2026-10-26T00:00:00' })   → testo dei messaggi nuovi + allegati (riassunti)
//   await __posta.allegato('<id thread>', '<pezzo del nome>', 30000)  → testo intero di un allegato (report)
//   __posta.mostra(0)                           → mette la parte 0 del testo in pagina, da leggere con get_page_text (45.000 caratteri a parte)
(() => {
  const IK = (window.GLOBALS || [])[9] || (document.body.innerHTML.match(/"ik":"([0-9a-f]{6,})"/) || [])[1];
  const BASE = location.origin + '/mail/u/0/';
  const MESI = { gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5, luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11 };
  const RX_VIA = /Le informazioni contenute|destinat[ae] esclusivamente|diffusione, distribuzione|Regulation \(EU\)|All information and attachments|must not share|by mistake|Non permettendo Internet|declina ogni responsabilit|per errore vi preghiamo|G\.D\.P\.R|Posta Certificata|06402320482|SUBM70N|Loc\. Drove|0577 ?-? ?980881|Fax\.? ?0577|Regolamento \(UE\) n\. 2016|^\s*\[Testo tra virgolette nascosto\]\s*$|^_{8,}|of 27 April 2016|delete this message|autorizzazione espressa|^\s*\|\s*$|confidential\/privileged|intended recipient|DueEsseTi S\.r\.l\. opera|AVVISO: Questo documento|DISCLAIMER:/i;
  const strip = h => h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>|<\/li>|<\/h\d>/gi, '\n').replace(/<\/td>/gi, ' | ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n)).replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ')
    .split('\n').filter(l => !RX_VIA.test(l)).join('\n').replace(/\n[ |]*\n+/g, '\n').trim();
  const data = s => { const m = String(s).match(/(\d{1,2}) (\w+) (\d{4}) alle ore (\d{1,2}):(\d{2})/); return m && MESI[m[2]] != null ? new Date(+m[3], MESI[m[2]], +m[1], +m[4], +m[5]) : null; };
  // via le parti citate («Il giorno … ha scritto», «Da: … Inviato:»), tranne negli inoltri
  const pulisci = (t, inoltro) => { const out = []; let taglia = false, fwd = inoltro, n = 0;
    for (const l of t.split('\n')) {
      if (/Inizio messaggio inoltrato|Messaggio Inoltrato|Forwarded message/i.test(l)) fwd = true;
      if (!fwd && /^(Il giorno .{5,90}ha scritto:?|Da: .{3,}|From: .{3,}|-----(Original|Messaggio originale)|On .{5,90} wrote:)/i.test(l.trim())) taglia = true;
      if (taglia) continue; if (fwd && ++n > 70) continue; out.push(l); }
    return out.join('\n'); };
  const REPORT = /report|verbal|sopralluog|relazion|valutazion|check|dvr|duvri|piano|haccp|minuta|questionario|perizia|scheda|analisi|misurazion|rapporto/i;
  const pt = id => fetch(`${BASE}?ik=${IK}&view=pt&search=all&th=${id}`, { credentials: 'same-origin' }).then(r => r.text());
  const urlAllegati = h => { const pos = [...h.matchAll(/\d{1,2} \w+ \d{4} alle ore \d{1,2}:\d{2}/g)].map(m => ({ i: m.index, d: data(m[0]) }));
    const visti = new Set(), out = [];
    for (const m of h.matchAll(/href="([^"]*attid=[^"]*)"/g)) {
      const url = new URL(m[1].replace(/&amp;/g, '&'), BASE).href;
      const key = (url.match(/attid=[\d.]+/) || [''])[0] + '|' + (url.match(/permmsgid=[^&]+|th=[^&]+/) || [''])[0];
      if (visti.has(key)) continue; visti.add(key);
      out.push({ url, d: (pos.filter(p => p.i < m.index).pop() || {}).d || null }); }
    return out; };
  const vah = async url => { const raw = await (await fetch(url.replace(/disp=\w+/, 'disp=vah'), { credentials: 'same-origin' })).text();
    const nome = ((raw.match(/<title>([^<]{1,250})<\/title>/i) || [])[1] || 'allegato').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
    return { nome, testo: strip(raw).replace(/^.*?Scarica l'allegato originale/s, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim() }; };
  const P = window.__posta = { IK, out: '', allegati: {} };
  P.lista = () => [...document.querySelectorAll('tr.zA')].filter(r => r.offsetParent).map(r => ({
    id: (r.querySelector('[data-legacy-thread-id]') || { getAttribute: () => null }).getAttribute('data-legacy-thread-id'),
    nonLetta: r.classList.contains('zE'),
    da: [...r.querySelectorAll('.yW span[email]')].map(x => x.getAttribute('email')).join(','),
    oggetto: (r.querySelector('.bog') || {}).innerText || '',
    anteprima: ((r.querySelector('.y2') || {}).innerText || '').replace(/^\s*-\s*/, '').slice(0, 100),
    data: (r.querySelector('td.xW span[title]') || {}).title || '' }));
  P.leggi = async (ids, opz = {}) => { const da = opz.da ? new Date(opz.da) : new Date(0); let out = '';
    for (const id of ids) { try {
      const h = await pt(id), t = strip(h);
      const HDR = /^.{0,140}<[^>\s]+@[^>\s]+>\s*\|\s*\d{1,2} \w+ \d{4} alle ore \d{1,2}:\d{2}/;
      const msgs = [], testa = []; let cur = null;
      for (const l of t.split('\n')) { if (HDR.test(l)) { cur = { hdr: l, d: data(l), body: [] }; msgs.push(cur); } else if (cur) cur.body.push(l); else testa.push(l); }
      const ogg = testa.slice(1, 3).join(' ').replace(/\| Roberto Macinai.*$/, '').replace(/^Posta di si soluzioni impresa srl - /, '').trim();
      const inoltro = /^(I|Fwd?|R: I|RE: I|Inoltro)\s*:/i.test(ogg);
      const nuovi = msgs.filter(m => !m.d || m.d >= da), vecchi = msgs.filter(m => m.d && m.d < da);
      let s = `\n\n##### THREAD ${id} · ${ogg} · msg ${msgs.length}, nuovi ${nuovi.length}`;
      if (vecchi.length) { const v = vecchi[vecchi.length - 1]; s += `\n[prima: ${vecchi.length} msg; ultimo precedente] ${v.hdr.slice(0, 160)}\n${pulisci(v.body.join('\n')).slice(0, opz.ctx || 500)}`; }
      for (const m of nuovi) s += `\n>>> ${m.hdr.slice(0, 260)}\n${pulisci(m.body.join('\n'), inoltro).replace(/\n\d+ allegat[io][\s\S]*$/, '').slice(0, opz.maxM || 3500)}`;
      const nomiVisti = new Set();
      for (const a of urlAllegati(h)) {
        let x; try { x = await vah(a.url); } catch (e) { s += '\n  · allegato non leggibile'; continue; }
        if (nomiVisti.has(x.nome)) continue; nomiVisti.add(x.nome);
        if (/\.(jpe?g|png|gif|heic|zip|p7m|rar|ics)$/i.test(x.nome) || /^image\d|PastedGraphic|Outlook-/i.test(x.nome)) { s += `\n  · allegato: ${x.nome}`; continue; }
        if (a.d && a.d < da) { s += `\n  · allegato (vecchio): ${x.nome}`; continue; }
        const offerta = /^offerta_|preventiv/i.test(x.nome), rep = REPORT.test(x.nome) && !offerta, foglio = /\.(xlsx?|ods|csv)$/i.test(x.nome);
        const cap = rep ? (opz.maxR || 400) : offerta ? 700 : foglio ? 600 : 300;
        P.allegati[id + '|' + x.nome] = a.url;
        const z = x.testo.replace(/\s+/g, ' ');
        s += `\n  · ALLEGATO ${rep ? '[REPORT?] ' : ''}${x.nome} (${z.length} car.): ${z.slice(0, cap)}${z.length > cap ? '…' : ''}`; }
      out += s;
    } catch (e) { out += `\n\n##### THREAD ${id}: ERRORE ${e.message}`; } }
    P.out = out; return out.length; };
  P.allegato = async (id, pezzo, max = 40000) => { let k = Object.keys(P.allegati).find(k => k.startsWith(id + '|') && k.toLowerCase().includes(String(pezzo).toLowerCase()));
    if (!k) { const h = await pt(id); for (const a of urlAllegati(h)) { const x = await vah(a.url); P.allegati[id + '|' + x.nome] = a.url; } k = Object.keys(P.allegati).find(k => k.startsWith(id + '|') && k.toLowerCase().includes(String(pezzo).toLowerCase())); }
    if (!k) return 0; const x = await vah(P.allegati[k]); P.out = `##### ALLEGATO ${k}\n` + x.testo.slice(0, max); return P.out.length; };
  P.mostra = (i = 0, n = 45000) => { const pre = document.createElement('pre'); pre.textContent = `[parte ${i} di ${Math.max(0, Math.ceil(P.out.length / n) - 1)}]\n` + P.out.slice(i * n, (i + 1) * n); document.body.replaceChildren(pre); return 'ok'; };
  return 'posta pronta · ik ' + (IK ? 'ok' : 'MANCANTE');
})();
