-- 25/10 · Togliere le cose: «Elimina» con Annulla, e appuntamenti nascosti dall'app.
-- Solo aggiunte: una colonna nuova e una tabella nuova, nessun dato esistente toccato.

-- Una cosa eliminata dall'app resta nel database con la data: l'app non la mostra più
-- e «Annulla» la rimette com'era (con i suoi passi, le note e il piano).
ALTER TABLE public.cicli ADD COLUMN IF NOT EXISTS eliminato_at timestamptz;

-- Appuntamenti di Google Calendar che non sono di Roby (es. delle figlie, inviti altrui):
-- nascosti solo nell'app, il calendario resta com'è. chiave = id dell'evento, o «serie:<id>» per tutta la serie.
CREATE TABLE IF NOT EXISTS public.eventi_nascosti (
  chiave       text PRIMARY KEY,
  titolo       text,
  nascosto_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eventi_nascosti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solo_proprietario" ON public.eventi_nascosti
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- 26/10 · Piano inviato al coach e stampato: anche nel database, così si vede da tutti i dispositivi.
ALTER TABLE public.battle_plan ADD COLUMN IF NOT EXISTS inviato_at timestamptz;
ALTER TABLE public.battle_plan ADD COLUMN IF NOT EXISTS stampato_at timestamptz;

-- 27/10 · Su quale calendario è l'evento della cosa (le personali sul Privato).
ALTER TABLE public.cicli ADD COLUMN IF NOT EXISTS calendar_event_cal text;
