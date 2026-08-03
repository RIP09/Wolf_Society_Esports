-- ============================================================
-- WOLF SOCIETY ESPORTS – COMPLETE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP TABLES (in correct order)
-- ============================================================
DROP TABLE IF EXISTS sponsor_metrics CASCADE;
DROP TABLE IF EXISTS team_players CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS scrims CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- CREATE TABLES
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

-- 5. Scrims
CREATE TABLE scrims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    opponent TEXT,
    scheduled_at TIMESTAMPTZ,
    map_score TEXT,
    coach_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Contracts
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

-- 8. Sponsor Metrics
CREATE TABLE sponsor_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
    impressions INT,
    clicks INT,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Team Players
CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_start_time ON matches(start_time);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_scrims_scheduled_at ON scrims(scheduled_at);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'fan'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrims ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));
CREATE POLICY "Staff can update profiles" ON profiles FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin','manager'));
CREATE POLICY "Admin can delete profiles" ON profiles FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Teams
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Staff can manage teams" ON teams FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- Matches
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Staff can modify matches" ON matches FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- News
CREATE POLICY "Anyone can view news" ON news FOR SELECT USING (true);
CREATE POLICY "Staff can modify news" ON news FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- Scrims
CREATE POLICY "Anyone can view scrims" ON scrims FOR SELECT USING (true);
CREATE POLICY "Staff can manage scrims" ON scrims FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- Contracts
CREATE POLICY "Staff can view contracts" ON contracts FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','manager'));
CREATE POLICY "Staff can manage contracts" ON contracts FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- Sponsors
CREATE POLICY "Anyone can view sponsors" ON sponsors FOR SELECT USING (true);
CREATE POLICY "Staff can manage sponsors" ON sponsors FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- Sponsor Metrics
CREATE POLICY "Anyone can view sponsor metrics" ON sponsor_metrics FOR SELECT USING (true);
CREATE POLICY "Staff can manage sponsor metrics" ON sponsor_metrics FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager'));

-- Team Players
CREATE POLICY "Anyone can view team players" ON team_players FOR SELECT USING (true);
CREATE POLICY "Staff can manage team players" ON team_players FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','manager','coach'));

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
    matches, scrims, news, profiles, teams, contracts, sponsors, sponsor_metrics, team_players;

-- ============================================================
-- SAMPLE DATA (optional – remove in production)
-- ============================================================
INSERT INTO teams (name, game_title) VALUES
    ('Divine Wolf', 'Moba Legends 5v5')
ON CONFLICT DO NOTHING;

INSERT INTO news (title, excerpt, category, icon) VALUES
    ('Welcome to Wolf Society', 'The official launch of our esports platform.', 'Announcement', '🐺'),
    ('Divine Wolf Roster Revealed', 'Meet our starting five for the upcoming season.', 'Roster', '👥')
ON CONFLICT DO NOTHING;
