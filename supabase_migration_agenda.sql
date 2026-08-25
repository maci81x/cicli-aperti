-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Vista Agenda Settimanale
-- Project: qujxbvootvollmziaqrd
-- ══════════════════════════════════════════════════════════════

ALTER TABLE cicli ADD COLUMN IF NOT EXISTS giorno_settimana text
  CHECK (giorno_settimana IN ('lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'));

ALTER TABLE cicli ADD COLUMN IF NOT EXISTS fascia_oraria text
  CHECK (fascia_oraria IN ('mattina','pomeriggio','sera'));

-- Override settimanali temporanei (drag & drop)
CREATE TABLE IF NOT EXISTS agenda_override (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ciclo_id uuid REFERENCES cicli(id) ON DELETE CASCADE,
  settimana int NOT NULL,
  anno int NOT NULL,
  giorno_settimana text NOT NULL CHECK (giorno_settimana IN ('lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica')),
  fascia_oraria text NOT NULL CHECK (fascia_oraria IN ('mattina','pomeriggio','sera')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(ciclo_id, settimana, anno)
);

ALTER TABLE agenda_override ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_agenda_override" ON agenda_override;
CREATE POLICY "anon_all_agenda_override" ON agenda_override FOR ALL TO anon USING (true) WITH CHECK (true);
