// v43 · 17/11 — sul computer (tre colonne) Coach e «Settimana senza piano» vanno a sinistra, sotto la giornata,
// come «Il metodo · da fare»; al centro resta solo «Oggi: N cose da chiudere», a tutta larghezza.
// ══════════════════════════════════════════════════════════════
{
  const _vistaOggiV43 = vistaOggi;
  vistaOggi = function () {
    let h = _vistaOggiV43.apply(this, arguments);
    if (!/v33-tre/.test(h)) return h;
    try {
      const tpl = document.createElement('template'); tpl.innerHTML = h;
      const f = tpl.content, sx = f.querySelector('.v33-sx'), gr = f.querySelector('.v33-centro .v12-griglia');
      if (!sx || !gr) return h;
      const altre = [...gr.children].filter(x => x.classList.contains('v12-card') && !x.classList.contains('v12-rosso'));
      if (!altre.length) return h;
      const box = document.createElement('section');
      box.className = 'v43-metodo'; box.setAttribute('aria-label', 'Il metodo: da fare');
      box.innerHTML = `<p class="list-head"><span>Il metodo · da fare</span><span class="mono">${altre.length}</span></p>`;
      altre.forEach(x => box.appendChild(x));
      sx.appendChild(box);
      gr.classList.add('v43-sola');
      const head = f.querySelector('.v33-centro .v12-head');
      if (head && !gr.children.length) head.remove();
      else if (head) head.remove();   // il titolo lo dà già la scheda «Oggi: N cose da chiudere»
      const d = document.createElement('div'); d.appendChild(f); h = d.innerHTML;
    } catch (e) { console.warn('[v43] oggi:', e.message); }
    return h;
  };
}

// ══════════════════════════════════════════════════════════════
