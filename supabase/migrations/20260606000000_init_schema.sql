-- Create mood_entries table
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  stress_level TEXT NOT NULL CHECK (stress_level IN ('Low', 'Medium', 'High')),
  energy_level TEXT NOT NULL CHECK (energy_level IN ('Low', 'Medium', 'High')),
  sleep_hours NUMERIC(4, 2) NOT NULL CHECK (sleep_hours BETWEEN 0 AND 24),
  study_hours NUMERIC(4, 2) NOT NULL CHECK (study_hours BETWEEN 0 AND 24),
  primary_emotion TEXT NOT NULL CHECK (primary_emotion IN ('Happy', 'Calm', 'Motivated', 'Neutral', 'Overwhelmed', 'Anxious', 'Burnt Out', 'Frustrated', 'Sad')),
  reflection TEXT
);

-- Create stress_triggers table
CREATE TABLE stress_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood_entry_id UUID REFERENCES mood_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  trigger_name TEXT NOT NULL
);

-- Create journal_entries table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  content TEXT NOT NULL,
  sentiment_score NUMERIC(3, 2), -- -1.00 to 1.00
  ai_summary TEXT
);

-- Create ai_insights table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  burnout_score INT NOT NULL CHECK (burnout_score BETWEEN 0 AND 100),
  burnout_level TEXT NOT NULL CHECK (burnout_level IN ('Low Risk', 'Moderate Risk', 'High Risk')),
  recommendation JSONB NOT NULL,
  insight TEXT NOT NULL
);

-- Create indexes for performance optimization
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, created_at DESC);
CREATE INDEX idx_stress_triggers_user_date ON stress_triggers(user_id, created_at DESC);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_ai_insights_user_date ON ai_insights(user_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Since the application is public and has no auth, the client supplies its own anonymous user_id
-- We enable policies that allow public SELECT and INSERT operations
CREATE POLICY "Allow public select on mood_entries" ON mood_entries
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on mood_entries" ON mood_entries
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public select on stress_triggers" ON stress_triggers
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on stress_triggers" ON stress_triggers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public select on journal_entries" ON journal_entries
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on journal_entries" ON journal_entries
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public select on ai_insights" ON ai_insights
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on ai_insights" ON ai_insights
  FOR INSERT TO anon WITH CHECK (true);
