# Fase E — casi non risolti dagli script

Generato da `tools/riordino/css_riordina.js`: per ogni modo, cosa resta e perché.

## Selettori ripetuti nello stesso file che restano separati

- `body` (css/core/000-base.css, righe 16 e 177): in mezzo `h1, h2, h3, p` { margin } (css/core/000-base.css:19) e `button, input, select, textarea` { color } (css/core/000-base.css:17)
- `.item-row` (css/core/000-base.css, righe 92 e 273): in mezzo `.item-main` { display } (css/core/000-base.css:93) e `.gcal-dot` { position } (css/core/000-base.css:234)
- `.item-side` (css/core/000-base.css, righe 97 e 277): in mezzo `.tag` { display } (css/core/000-base.css:105) e `.tag` { gap } (css/core/000-base.css:105)
- `.v47-testa .vh-board` (css/pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css, righe 26 e 29): in mezzo `.v47-testa .v22-testa` { flex } (css/pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css:28) e `.v47-testa .v22-testa` { min-width } (css/pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css:28)

## Selettori ripetuti tra file diversi (rinviati: unirli sposterebbe regole tra file)

- `:root`: core/000-tavolozza.css, core/000-base.css
- `.t-title`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.btn-primary`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.btn-primary:active`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.check-box`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.nav button[aria-current="page"] .nav-ico`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.sheet-head`: core/000-base.css, core/001-v3.css
- `.logo`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.logo span`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.cattura`: core/000-base.css, cattura/002-v8-riepilogo-della-frase-sotto-il-campo.css
- `.top`: core/000-base.css, altro/012-v13-una-lista-sola.css
- `.vh h1`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.list-head`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.list-head .mono`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.item.p-q1:not(.is-done) .item-row`: core/000-base.css, calendario/028-v30-da-rivedere.css
- `.legenda`: core/001-v3.css, pianifica/006-v6-colori-priorita-colonne-riordina-coach.css
- `.meta-tag`: cattura/003-v8-import-della-riunione.css, calendario/008-v9-appuntamenti-toccabili-il-cerchio-si-spu.css
- `.evt-cerchio`: pianifica/004-v4-coaching-19-10.css, calendario/008-v9-appuntamenti-toccabili-il-cerchio-si-spu.css
- `@media print :: .cattura`: altro/005-v5-metodo-i-time.css, pianifica/006-v6-colori-priorita-colonne-riordina-coach.css
- `.vh-board`: pianifica/006-v6-colori-priorita-colonne-riordina-coach.css, pianifica/019-v22-pianifica-i-giorni-in-vista.css
- `.bcol-h`: pianifica/006-v6-colori-priorita-colonne-riordina-coach.css, pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css
- `.spazio-riga`: pianifica/006-v6-colori-priorita-colonne-riordina-coach.css, calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.spazio-riga .item-title`: pianifica/006-v6-colori-priorita-colonne-riordina-coach.css, calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.spazio-riga .evt-ico`: pianifica/006-v6-colori-priorita-colonne-riordina-coach.css, calendario/028-v30-da-rivedere.css
- `.v12-head span:first-child`: oggi/011-v12-oggi-prima-di-tutto-e-i-pensieri-divisi.css, calendario/028-v30-da-rivedere.css
- `.evt-riga.evt-app.v24-altri`: calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.evt-riga.evt-app.v24-altri .item-title`: calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.evt-riga.evt-app.v24-mio`: calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.evt-riga.evt-app.v24-mio .evt-cerchio`: calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.board .evt-riga.v24-mio`: calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.spazio-riga .evt-ico .ti`: calendario/022-v24-appuntamenti-con-altre-persone-viola-pie.css, calendario/028-v30-da-rivedere.css
- `.v31-ad-ritmo > span`: calendario/028-v30-da-rivedere.css, pianifica/039-v48-giorni-con-un-tocco-nel-quando-prima-di.css
- `.v31-ad-ritmo .btn:not(.btn-icon)`: calendario/028-v30-da-rivedere.css, pianifica/039-v48-giorni-con-un-tocco-nel-quando-prima-di.css
- `.v40-dametti`: pianifica/030-v40-pianifica-giorno-subito-e-importanti-da.css, pianifica/032-v40-2-giorno-piu-compatto-pagina-larga-al-mass.css
- `.v40-gr-h`: pianifica/030-v40-pianifica-giorno-subito-e-importanti-da.css, pianifica/032-v40-2-giorno-piu-compatto-pagina-larga-al-mass.css
- `.v40-riga`: pianifica/030-v40-pianifica-giorno-subito-e-importanti-da.css, pianifica/032-v40-2-giorno-piu-compatto-pagina-larga-al-mass.css
- `.v40-apri`: pianifica/030-v40-pianifica-giorno-subito-e-importanti-da.css, pianifica/032-v40-2-giorno-piu-compatto-pagina-larga-al-mass.css
- `.v40-apri .t`: pianifica/030-v40-pianifica-giorno-subito-e-importanti-da.css, pianifica/032-v40-2-giorno-piu-compatto-pagina-larga-al-mass.css
- `html:root .item.p-q1:not(.is-done) .item-row`: core/034-v43-17-11-carta-e-salvia-mix-delle-tavolozze.css, core/036-v44-1-roby-subito-rosso-acceso-con-un-velo-ros.css
- `html:root .item.p-q1:not(.is-done) .check-box`: core/034-v43-17-11-carta-e-salvia-mix-delle-tavolozze.css, core/036-v44-1-roby-subito-rosso-acceso-con-un-velo-ros.css
- `html:root .item.p-q1:not(.is-done) + .item.p-q1:not(.is-done)`: core/034-v43-17-11-carta-e-salvia-mix-delle-tavolozze.css, core/036-v44-1-roby-subito-rosso-acceso-con-un-velo-ros.css
- `html:root .v40-riga.q1`: core/034-v43-17-11-carta-e-salvia-mix-delle-tavolozze.css, core/036-v44-1-roby-subito-rosso-acceso-con-un-velo-ros.css
- `html:root .board .evt-riga.v24-altri`: core/034-v43-17-11-carta-e-salvia-mix-delle-tavolozze.css, pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css, pianifica/042-v49-pianifica-schede-separate-stile-14-color.css
- `html:root .board .evt-riga.v24-mio`: core/034-v43-17-11-carta-e-salvia-mix-delle-tavolozze.css, pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css, pianifica/042-v49-pianifica-schede-separate-stile-14-color.css
- `.v43-metodo .v12-coach li`: core/034-v43-17-11-carta-e-salvia-mix-delle-tavolozze.css, core/037-v46-rifiniture-l-etichetta-della-posta-neutr.css
- `.v47-testa`: pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css, core/043-v50-sfondo-salvia-chiarissimo-solo-tema-chia.css
- `.v47-indietro > summary`: pianifica/038-v47-19-11-pianifica-settimana-come-il-foglio.css, smaltisci/040-v49-smaltisci.css
- `.v48-g.we`: pianifica/039-v48-giorni-con-un-tocco-nel-quando-prima-di.css, core/046-v50-accessibilita.css
