-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Pianificazione avanzata (mini-modale Pianifica)
-- Project: qujxbvootvollmziaqrd
-- ══════════════════════════════════════════════════════════════

ALTER TABLE cicli ADD COLUMN IF NOT EXISTS pianificato_data date;

ALTER TABLE cicli ADD COLUMN IF NOT EXISTS pianificato_ripetizione text
  CHECK (pianificato_ripetizione IN ('nessuna','settimanale','mensile','trimestrale'))
  DEFAULT 'nessuna';
