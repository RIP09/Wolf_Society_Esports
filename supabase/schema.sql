-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'fan' CHECK (role IN ('fan','player','coach','manager','admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_title TEXT NOT NULL DEFAULT 'Moba Legends 5v5',
  logo_url TEXT,
  captain_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished','cancelled')),
  start_time TIMESTAMPTZ,
  time_elapsed TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- News
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  icon TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scrims (practice)
CREATE TABLE scrims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  opponent TEXT,
  scheduled_at TIMESTAMPTZ,
  map_score TEXT,
  coach_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));
CREATE POLICY "Staff can update profiles" ON profiles FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin','manager'));

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Staff can modify matches" ON matches FOR INSERT, UPDATE, DELETE USING (auth.jwt() ->> 'role' IN ('admin','manager'));

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view news" ON news FOR SELECT USING (true);
CREATE POLICY "Staff can modify news" ON news FOR INSERT, UPDATE, DELETE USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE matches, scrims, news, profiles;
