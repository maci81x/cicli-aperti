-- Migration i-Time · PARTE (a): solo aggiunte (2026-10-20)
-- Nessun UPDATE, DELETE o DROP. Ogni istruzione si può rieseguire senza effetti.

ALTER TABLE cicli ADD COLUMN IF NOT EXISTS inderogabile boolean DEFAULT false;
ALTER TABLE cicli ADD COLUMN IF NOT EXISTS ritorni_delega int DEFAULT 0;
ALTER TABLE battle_plan ADD COLUMN IF NOT EXISTS q2_spostate int DEFAULT 0;
ALTER TABLE battle_plan ADD COLUMN IF NOT EXISTS riportato_at timestamptz;

CREATE TABLE IF NOT EXISTS esercizi_q2 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fatto_at timestamptz DEFAULT now(),
  attivita int,
  note text
);
ALTER TABLE esercizi_q2 ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'esercizi_q2' AND policyname = 'anon_all_esercizi_q2') THEN
    CREATE POLICY "anon_all_esercizi_q2" ON esercizi_q2 FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Aree i-Time: ogni area elencherà le sue categorie (chiavi come cicli.cat). Colonna nuova, vuota.
ALTER TABLE macro_aree ADD COLUMN IF NOT EXISTS categorie text[] DEFAULT '{}';
