-- v4 (2026-10-20): coaching 19/10 — passi, cuscinetti, statistiche della settimana
-- Applicata via MCP (apply_migration «v4_coaching_passi_cuscinetti_stats»).
ALTER TABLE cicli ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES cicli(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS cicli_parent_id_idx ON cicli(parent_id);
ALTER TABLE battle_plan_items ADD COLUMN IF NOT EXISTS tipo_slot text CHECK (tipo_slot IN ('cosa','cuscinetto')) DEFAULT 'cosa';
ALTER TABLE battle_plan ADD COLUMN IF NOT EXISTS pianificate int, ADD COLUMN IF NOT EXISTS completate int, ADD COLUMN IF NOT EXISTS percentuale int, ADD COLUMN IF NOT EXISTS motivi jsonb;
-- Un cuscinetto è una riga di battle_plan_items con tipo_slot = 'cuscinetto' e ciclo_id NULL.
-- Quando viene riempito, ciclo_id punta alla cosa scelta (tipo_slot resta 'cuscinetto').
