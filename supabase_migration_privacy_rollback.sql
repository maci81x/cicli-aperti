-- ROLLBACK della migration PRIVACY: rimette le policy aperte di prima, identiche.
-- Da usare solo se resti chiuso fuori. Riapre i dati a chiunque abbia la chiave anon.


-- cicli
DROP POLICY IF EXISTS "solo_proprietario" ON public.cicli;
CREATE POLICY "allow_all_cicli" ON public.cicli FOR ALL TO anon USING (true) WITH CHECK (true);

-- persone
DROP POLICY IF EXISTS "solo_proprietario" ON public.persone;
CREATE POLICY "Public access" ON public.persone FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_persone" ON public.persone FOR ALL TO anon USING (true) WITH CHECK (true);

-- categorie
DROP POLICY IF EXISTS "solo_proprietario" ON public.categorie;
CREATE POLICY "Public access" ON public.categorie FOR ALL TO public USING (true) WITH CHECK (true);

-- macro_aree
DROP POLICY IF EXISTS "solo_proprietario" ON public.macro_aree;
CREATE POLICY "anon_all_macro_aree" ON public.macro_aree FOR ALL TO anon USING (true) WITH CHECK (true);

-- agenda_override
DROP POLICY IF EXISTS "solo_proprietario" ON public.agenda_override;
CREATE POLICY "anon_all_agenda_override" ON public.agenda_override FOR ALL TO anon USING (true) WITH CHECK (true);

-- battle_plan
DROP POLICY IF EXISTS "solo_proprietario" ON public.battle_plan;
CREATE POLICY "anon_all_battle_plan" ON public.battle_plan FOR ALL TO anon USING (true) WITH CHECK (true);

-- battle_plan_items
DROP POLICY IF EXISTS "solo_proprietario" ON public.battle_plan_items;
CREATE POLICY "anon_all_battle_plan_items" ON public.battle_plan_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- rituali_completati
DROP POLICY IF EXISTS "solo_proprietario" ON public.rituali_completati;
CREATE POLICY "anon_all_rituali_completati" ON public.rituali_completati FOR ALL TO anon USING (true) WITH CHECK (true);

-- esercizi_q2
DROP POLICY IF EXISTS "solo_proprietario" ON public.esercizi_q2;
CREATE POLICY "anon_all_esercizi_q2" ON public.esercizi_q2 FOR ALL TO anon USING (true) WITH CHECK (true);

-- user_tokens
DROP POLICY IF EXISTS "solo_proprietario" ON public.user_tokens;
CREATE POLICY "anon_all_user_tokens" ON public.user_tokens FOR ALL TO anon USING (true) WITH CHECK (true);

-- assegnazioni
DROP POLICY IF EXISTS "solo_proprietario" ON public.assegnazioni;
CREATE POLICY "anon_all_assegnazioni" ON public.assegnazioni FOR ALL TO anon USING (true) WITH CHECK (true);

-- ciclo_persone
DROP POLICY IF EXISTS "solo_proprietario" ON public.ciclo_persone;
CREATE POLICY "open access" ON public.ciclo_persone FOR ALL TO public USING (true) WITH CHECK (true);

-- note_log
DROP POLICY IF EXISTS "solo_proprietario" ON public.note_log;
CREATE POLICY "open access" ON public.note_log FOR ALL TO public USING (true) WITH CHECK (true);
