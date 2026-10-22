-- 22/10 · Spunte degli appuntamenti di Google Calendar (fatto / non fatto), salvate nell'app.
-- Solo aggiunte: una tabella nuova, nessun dato esistente toccato.
-- Senza questa tabella l'app tiene le spunte in questo browser (localStorage «eventi_fatti»);
-- appena c'è, le legge e le scrive qui (e ci porta una volta quelle del browser).
CREATE TABLE IF NOT EXISTS public.eventi_fatti (
  evento_id  text PRIMARY KEY,            -- id dell'evento (per i ripetuti: l'id della singola volta)
  giorno     date NOT NULL,               -- giorno dell'appuntamento
  fatto_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS eventi_fatti_giorno ON public.eventi_fatti (giorno);

ALTER TABLE public.eventi_fatti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solo_proprietario" ON public.eventi_fatti
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');
