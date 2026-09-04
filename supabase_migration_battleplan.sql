-- Battle Plan — piano di battaglia settimanale
-- Esegui su https://supabase.com/dashboard/project/qujxbvootvollmziaqrd/sql/new

CREATE TABLE IF NOT EXISTS battle_plan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  settimana int NOT NULL,
  anno int NOT NULL,
  stato text DEFAULT 'bozza' CHECK (stato IN ('bozza','attivo','chiuso')),
  note text,
  creato_at timestamptz DEFAULT now(),
  chiuso_at timestamptz,
  UNIQUE(settimana, anno)
);

CREATE TABLE IF NOT EXISTS battle_plan_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_plan_id uuid REFERENCES battle_plan(id) ON DELETE CASCADE,
  ciclo_id uuid REFERENCES cicli(id) ON DELETE CASCADE,
  giorno text CHECK (giorno IN ('lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica','settimana')),
  fascia text CHECK (fascia IN ('mattina','pomeriggio','sera')),
  ora_prevista time,
  durata_prevista int DEFAULT 30,
  completato boolean DEFAULT false,
  completato_at timestamptz,
  ordine int DEFAULT 0,
  note_item text,
  UNIQUE(battle_plan_id, ciclo_id)
);

ALTER TABLE battle_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_battle_plan" ON battle_plan;
CREATE POLICY "anon_all_battle_plan" ON battle_plan FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_battle_plan_items" ON battle_plan_items;
CREATE POLICY "anon_all_battle_plan_items" ON battle_plan_items FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_bp_items_plan  ON battle_plan_items(battle_plan_id);
CREATE INDEX IF NOT EXISTS idx_bp_items_ciclo ON battle_plan_items(ciclo_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE battle_plan;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_plan_items;
