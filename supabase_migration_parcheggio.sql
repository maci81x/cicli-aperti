-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Parcheggio cicli
-- Project: qujxbvootvollmziaqrd
-- ══════════════════════════════════════════════════════════════

ALTER TABLE cicli ADD COLUMN IF NOT EXISTS parcheggiato boolean DEFAULT false;
ALTER TABLE cicli ADD COLUMN IF NOT EXISTS parcheggiato_at timestamptz;
