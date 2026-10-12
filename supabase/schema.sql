-- Flowboard Supabase Production Schema
-- Run this in the Supabase SQL Editor to initialize all tables, indexes, and RLS policies.

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Boards Table
CREATE TABLE IF NOT EXISTS boards (
  id            TEXT PRIMARY KEY,
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Main Board',
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Versioned Board States Table (Event Sourcing / Snapshot History)
CREATE TABLE IF NOT EXISTS board_states (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id      TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL DEFAULT 1,
  canvas_data   JSONB NOT NULL,
  chat_data     JSONB,
  summary       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Generated Artifacts Table
CREATE TABLE IF NOT EXISTS artifacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id      TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  filename      TEXT NOT NULL,
  language      TEXT NOT NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_board_states_active ON board_states(board_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_board_states_version ON board_states(board_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_board ON artifacts(board_id);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous/authenticated read & write during initial deployment
-- (Can be tightened to auth.uid() = user_id once Supabase Auth UI is hooked up)
CREATE POLICY "Allow public read/write for boards"
  ON boards FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read/write for board states"
  ON board_states FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read/write for artifacts"
  ON artifacts FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Automatic RLS Event Trigger
-- Automatically enables Row Level Security on any new table created in the public schema
CREATE OR REPLACE FUNCTION public.enable_rls_on_new_tables()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT * 
    FROM pg_event_trigger_ddl_commands() 
    WHERE command_tag = 'CREATE TABLE' 
      AND schema_name = 'public'
      AND NOT in_extension
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', rec.object_identity);
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS trg_enable_rls_on_new_tables;

CREATE EVENT TRIGGER trg_enable_rls_on_new_tables
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION public.enable_rls_on_new_tables();
