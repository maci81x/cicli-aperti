-- Migration PRIVACY (2026-10-20): solo sicurezza, nessun dato toccato.
-- Prima: chiunque abbia la chiave anon (è in index.html, repository pubblico) legge e scrive tutto.
-- Dopo: solo un utente collegato con Supabase Auth e con email maci81x@gmail.com.
-- Tocca SOLO le 13 tabelle di Cicli Aperti. NON tocca compensi_snapshots né compensi_stato
-- (sono di un altro strumento) né altre tabelle.
-- Da applicare DOPO aver pubblicato index.html con il login e aver fatto il primo accesso.
-- Per tornare indietro: supabase_migration_privacy_rollback.sql


-- cicli
ALTER TABLE public.cicli ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cicli" ON public.cicli;
CREATE POLICY "solo_proprietario" ON public.cicli
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- persone
ALTER TABLE public.persone ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.persone;
DROP POLICY IF EXISTS "allow_all_persone" ON public.persone;
CREATE POLICY "solo_proprietario" ON public.persone
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- categorie
ALTER TABLE public.categorie ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.categorie;
CREATE POLICY "solo_proprietario" ON public.categorie
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- macro_aree
ALTER TABLE public.macro_aree ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_macro_aree" ON public.macro_aree;
CREATE POLICY "solo_proprietario" ON public.macro_aree
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- agenda_override
ALTER TABLE public.agenda_override ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_agenda_override" ON public.agenda_override;
CREATE POLICY "solo_proprietario" ON public.agenda_override
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- battle_plan
ALTER TABLE public.battle_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_battle_plan" ON public.battle_plan;
CREATE POLICY "solo_proprietario" ON public.battle_plan
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- battle_plan_items
ALTER TABLE public.battle_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_battle_plan_items" ON public.battle_plan_items;
CREATE POLICY "solo_proprietario" ON public.battle_plan_items
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- rituali_completati
ALTER TABLE public.rituali_completati ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_rituali_completati" ON public.rituali_completati;
CREATE POLICY "solo_proprietario" ON public.rituali_completati
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- esercizi_q2
ALTER TABLE public.esercizi_q2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_esercizi_q2" ON public.esercizi_q2;
CREATE POLICY "solo_proprietario" ON public.esercizi_q2
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_user_tokens" ON public.user_tokens;
CREATE POLICY "solo_proprietario" ON public.user_tokens
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- assegnazioni
ALTER TABLE public.assegnazioni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_assegnazioni" ON public.assegnazioni;
CREATE POLICY "solo_proprietario" ON public.assegnazioni
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- ciclo_persone
ALTER TABLE public.ciclo_persone ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open access" ON public.ciclo_persone;
CREATE POLICY "solo_proprietario" ON public.ciclo_persone
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');

-- note_log
ALTER TABLE public.note_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open access" ON public.note_log;
CREATE POLICY "solo_proprietario" ON public.note_log
  FOR ALL TO authenticated
  USING      (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com')
  WITH CHECK (lower((SELECT auth.jwt() ->> 'email')) = 'maci81x@gmail.com');
