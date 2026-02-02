-- Create households table (shared between partners)
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Baby info
  baby_name TEXT,
  baby_birthday DATE,

  -- Schedule settings
  default_wake_window NUMERIC DEFAULT 1.5,
  default_nap_duration NUMERIC DEFAULT 0.5,
  typical_wake_time TEXT DEFAULT '06:30',
  bedtime TEXT DEFAULT '19:00'
);

-- Create household_members table (links users to households)
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(household_id, user_id)
);

-- Create days table (daily logs)
CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  actual_wake_time TEXT,
  actual_bedtime TEXT,
  skipped_nap_slots INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(household_id, date)
);

-- Create naps table
CREATE TABLE naps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE naps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for households
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their households"
  ON households FOR UPDATE
  USING (id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert households"
  ON households FOR INSERT
  WITH CHECK (true);

-- RLS Policies for household_members
CREATE POLICY "Users can view their household members"
  ON household_members FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert themselves into households"
  ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for days
CREATE POLICY "Users can view their household days"
  ON days FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert days for their households"
  ON days FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update days for their households"
  ON days FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

-- RLS Policies for naps
CREATE POLICY "Users can view naps for their household days"
  ON naps FOR SELECT
  USING (day_id IN (
    SELECT d.id FROM days d
    JOIN household_members hm ON d.household_id = hm.household_id
    WHERE hm.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert naps for their household days"
  ON naps FOR INSERT
  WITH CHECK (day_id IN (
    SELECT d.id FROM days d
    JOIN household_members hm ON d.household_id = hm.household_id
    WHERE hm.user_id = auth.uid()
  ));

CREATE POLICY "Users can update naps for their household days"
  ON naps FOR UPDATE
  USING (day_id IN (
    SELECT d.id FROM days d
    JOIN household_members hm ON d.household_id = hm.household_id
    WHERE hm.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete naps for their household days"
  ON naps FOR DELETE
  USING (day_id IN (
    SELECT d.id FROM days d
    JOIN household_members hm ON d.household_id = hm.household_id
    WHERE hm.user_id = auth.uid()
  ));

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER days_updated_at
  BEFORE UPDATE ON days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER naps_updated_at
  BEFORE UPDATE ON naps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for sync
ALTER PUBLICATION supabase_realtime ADD TABLE days;
ALTER PUBLICATION supabase_realtime ADD TABLE naps;
ALTER PUBLICATION supabase_realtime ADD TABLE households;
