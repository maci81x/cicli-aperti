-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Rituali quotidiani (ripetizione giornaliera)
-- Project: qujxbvootvollmziaqrd
-- ══════════════════════════════════════════════════════════════

ALTER TABLE cicli ADD COLUMN IF NOT EXISTS ora_inizio time;
ALTER TABLE cicli ADD COLUMN IF NOT EXISTS durata_minuti int;

ALTER TABLE cicli DROP CONSTRAINT IF EXISTS cicli_pianificato_ripetizione_check;
ALTER TABLE cicli ADD CONSTRAINT cicli_pianificato_ripetizione_check
  CHECK (pianificato_ripetizione IN ('nessuna','giornaliera','settimanale','mensile','trimestrale'));

CREATE TABLE IF NOT EXISTS rituali_completati (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ciclo_id uuid REFERENCES cicli(id) ON DELETE CASCADE,
  data_completamento date NOT NULL,
  completato_at timestamptz DEFAULT now(),
  UNIQUE(ciclo_id, data_completamento)
);

ALTER TABLE rituali_completati ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_rituali_completati" ON rituali_completati;
CREATE POLICY "anon_all_rituali_completati" ON rituali_completati FOR ALL TO anon USING (true) WITH CHECK (true);
