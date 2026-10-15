-- Cicli Aperti v3 (2026-10-15): «Le tue 3» e delega con data di controllo.
-- Applicata via MCP il 2026-10-15. Se serve rifarla: SQL Editor di Supabase.
ALTER TABLE battle_plan_items ADD COLUMN IF NOT EXISTS in_focus boolean DEFAULT false;
ALTER TABLE cicli ADD COLUMN IF NOT EXISTS delega_persona_id uuid REFERENCES persone(id) ON DELETE SET NULL;
ALTER TABLE cicli ADD COLUMN IF NOT EXISTS delega_controllo date;
