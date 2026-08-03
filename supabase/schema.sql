-- ============================================================
--  WOLF SOCIETY ESPORTS – COMPLETE DATABASE SCHEMA
--  Supabase (PostgreSQL) with RLS and Realtime
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
--  TABLES
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'fan' CHECK (role IN ('fan','player','coach','manager','admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_title TEXT NOT NULL DEFAULT 'Moba Legends 5v5',
  logo_url TEXT,
  captain_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Matches
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

-- 4. News
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  icon TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Scrims (practice matches)
CREATE TABLE scrims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  opponent TEXT,
  scheduled_at TIMESTAMPTZ,
  map_score TEXT,
  coach_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Contracts (player contracts)
CREATE TABLE contracts (
  player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  salary NUMERIC,
  end_date DATE,
  substitute BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Sponsors
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Sponsor Metrics (impressions, clicks)
CREATE TABLE sponsor_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  impressions INT,
  clicks INT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Team Players (many‑to‑many between teams and profiles)
CREATE TABLE team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  INDEXES (for performance)
-- ============================================================
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_start_time ON matches(start_time);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_scrims_scheduled_at ON scrims(scheduled_at);

-- ============================================================
--  ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrims ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- ============================================================
--  PROFILES POLICIES
-- ============================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Staff (admin, manager, coach) can view all profiles
CREATE POLICY "Staff can view all profiles" ON profiles
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- Only admin and manager can update profiles (except role changes)
CREATE POLICY "Staff can update profiles" ON profiles
  FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- Only admin can delete profiles (or we can disallow)
CREATE POLICY "Admin can delete profiles" ON profiles
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
--  TEAMS POLICIES
-- ============================================================
-- Anyone can view teams
CREATE POLICY "Anyone can view teams" ON teams
  FOR SELECT USING (true);

-- Staff can insert, update, delete teams
CREATE POLICY "Staff can manage teams" ON teams
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- ============================================================
--  MATCHES POLICIES
-- ============================================================
-- Anyone can view matches
CREATE POLICY "Anyone can view matches" ON matches
  FOR SELECT USING (true);

-- Staff can insert, update, delete matches
-- CORRECTED: use FOR ALL instead of listing operations
CREATE POLICY "Staff can modify matches" ON matches
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- ============================================================
--  NEWS POLICIES
-- ============================================================
-- Anyone can view news
CREATE POLICY "Anyone can view news" ON news
  FOR SELECT USING (true);

-- Staff (admin, manager, coach) can insert, update, delete
CREATE POLICY "Staff can modify news" ON news
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- ============================================================
--  SCRIMS POLICIES
-- ============================================================
-- Anyone can view scrims (maybe restrict to staff? but we allow all)
CREATE POLICY "Anyone can view scrims" ON scrims
  FOR SELECT USING (true);

-- Staff can manage scrims
CREATE POLICY "Staff can manage scrims" ON scrims
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- ============================================================
--  CONTRACTS POLICIES
-- ============================================================
-- Only staff can view contracts (sensitive)
CREATE POLICY "Staff can view contracts" ON contracts
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- Only admin/manager can insert/update/delete
CREATE POLICY "Staff can manage contracts" ON contracts
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- ============================================================
--  SPONSORS POLICIES
-- ============================================================
-- Anyone can view sponsors
CREATE POLICY "Anyone can view sponsors" ON sponsors
  FOR SELECT USING (true);

-- Staff can manage sponsors
CREATE POLICY "Staff can manage sponsors" ON sponsors
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- ============================================================
--  SPONSOR METRICS POLICIES
-- ============================================================
-- Anyone can view metrics (or restrict to staff)
CREATE POLICY "Anyone can view sponsor metrics" ON sponsor_metrics
  FOR SELECT USING (true);

-- Staff can insert/update metrics
CREATE POLICY "Staff can manage sponsor metrics" ON sponsor_metrics
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- ============================================================
--  TEAM PLAYERS POLICIES
-- ============================================================
-- Anyone can view team-player associations
CREATE POLICY "Anyone can view team players" ON team_players
  FOR SELECT USING (true);

-- Staff can manage team players
CREATE POLICY "Staff can manage team players" ON team_players
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- ============================================================
--  REALTIME PUBLICATION
-- ============================================================
-- Add tables to the publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE 
  matches,
  scrims,
  news,
  profiles,
  teams,
  contracts,
  sponsors,
  sponsor_metrics,
  team_players;

-- ============================================================
--  OPTIONAL: INSERT SAMPLE DATA (for development)
-- ============================================================
-- (Remove or comment out in production)
INSERT INTO profiles (id, username, full_name, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teams (name, game_title) VALUES 
  ('Divine Wolf', 'Moba Legends 5v5')
ON CONFLICT DO NOTHING;
