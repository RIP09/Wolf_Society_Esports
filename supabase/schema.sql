-- ============================================================
-- WOLF SOCIETY ESPORTS – SUPABASE POSTGRESQL SCHEMA (RLS + HELPERS)
-- ============================================================

-- UUID extension is not strictly required because Supabase already supports uuid,
-- but keeping it is harmless if it exists in your environment.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Helper functions (MUST use public.users.auth_user_id)
-- ============================================================

-- Returns the role for the currently authenticated user
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
$$;

-- True if the user is admin
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role = 'admin'
  )
$$;

-- True if the user is manager
CREATE OR REPLACE FUNCTION public.auth_is_manager()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin','manager')
  )
$$;

-- Convenience function: admin OR manager
CREATE OR REPLACE FUNCTION public.auth_is_admin_or_manager()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT public.auth_is_manager()
$$;

-- ============================================================
-- USERS
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = auth_user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Admin/Manager can view all users
CREATE POLICY "Admin/Manager can view all users"
ON public.users
FOR SELECT
USING (public.auth_is_admin_or_manager());

-- Admin can update any user
CREATE POLICY "Admin can update any user"
ON public.users
FOR UPDATE
USING (public.auth_role() IN ('admin','manager'))
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Users can insert themselves (registration/bypass)
CREATE POLICY "Users can register themselves"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- Admin can delete users
CREATE POLICY "Admin can delete users"
ON public.users
FOR DELETE
USING (public.auth_role() = 'admin');

-- ============================================================
-- TEAMS
-- (tables currently: id integer, name, tag, game, logo_url, wins, losses, draws, created_at)
-- ============================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Anyone can view teams
CREATE POLICY "Anyone can view teams"
ON public.teams
FOR SELECT
USING (true);

-- Admin/Manager can create teams
CREATE POLICY "Admin/Manager can create teams"
ON public.teams
FOR INSERT
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin/Manager can update teams
CREATE POLICY "Admin/Manager can update teams"
ON public.teams
FOR UPDATE
USING (public.auth_role() IN ('admin','manager'))
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin can delete teams
CREATE POLICY "Admin can delete teams"
ON public.teams
FOR DELETE
USING (public.auth_role() = 'admin');

-- ============================================================
-- PLAYERS
-- (tables currently: id bigint, player_name, ingame_name, role, country, photo_url, bio,
-- game_title, team_name, join_date, social_link, created_at)
-- Note: there is NO user_id or status column in your schema,
-- so we cannot implement "own player" or "active players" policies.
-- ============================================================

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Anyone can view players
CREATE POLICY "Anyone can view players"
ON public.players
FOR SELECT
USING (true);

-- Admin/Manager can create players
CREATE POLICY "Admin/Manager can create players"
ON public.players
FOR INSERT
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin/Manager can update players
CREATE POLICY "Admin/Manager can update players"
ON public.players
FOR UPDATE
USING (public.auth_role() IN ('admin','manager'))
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin can delete players
CREATE POLICY "Admin can delete players"
ON public.players
FOR DELETE
USING (public.auth_role() = 'admin');

-- ============================================================
-- MATCHES
-- (tables currently: id bigint, team_a text, team_b text, score_a integer, score_b integer,
-- status text, stream_url text, created_at)
-- ============================================================

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Anyone can view matches
CREATE POLICY "Anyone can view matches"
ON public.matches
FOR SELECT
USING (true);

-- Admin/Manager can create matches
CREATE POLICY "Admin/Manager can create matches"
ON public.matches
FOR INSERT
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin/Manager can update matches
CREATE POLICY "Admin/Manager can update matches"
ON public.matches
FOR UPDATE
USING (public.auth_role() IN ('admin','manager'))
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin can delete matches
CREATE POLICY "Admin can delete matches"
ON public.matches
FOR DELETE
USING (public.auth_role() = 'admin');

-- ============================================================
-- ANNOUNCEMENTS
-- (tables currently: id text, title text, content text, date text)
-- Note: there is NO published column in your schema.
-- ============================================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can view announcements
CREATE POLICY "Anyone can view announcements"
ON public.announcements
FOR SELECT
USING (true);

-- Admin/Manager can create announcements
CREATE POLICY "Admin/Manager can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin/Manager can update announcements
CREATE POLICY "Admin/Manager can update announcements"
ON public.announcements
FOR UPDATE
USING (public.auth_role() IN ('admin','manager'))
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin can delete announcements
CREATE POLICY "Admin can delete announcements"
ON public.announcements
FOR DELETE
USING (public.auth_role() = 'admin');

-- ============================================================
-- CONTENT
-- (tables currently: id text, title text, platform text, scheduleddate text, content text)
-- Note: there is NO status or uploader_id column in your schema.
-- ============================================================

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Anyone can view content
CREATE POLICY "Anyone can view content"
ON public.content
FOR SELECT
USING (true);

-- Admin/Manager can create content
CREATE POLICY "Admin/Manager can create content"
ON public.content
FOR INSERT
WITH CHECK (public.auth_role() IN ('admin','manager','content_creator'));

-- Admin/Manager can update content
CREATE POLICY "Admin/Manager can update content"
ON public.content
FOR UPDATE
USING (public.auth_role() IN ('admin','manager'))
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin can delete content
CREATE POLICY "Admin can delete content"
ON public.content
FOR DELETE
USING (public.auth_role() = 'admin');

-- ============================================================
-- CONTRACTS
-- (tables currently: id integer, user_id integer, type text, start_date date, end_date date,
-- value numeric, details jsonb, created_at)
-- Note: contracts.user_id is integer and FK references public.users.id (integer),
-- so we map auth.uid() -> users.id via auth_user_id.
-- ============================================================

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Users can view own contracts OR admin/manager can view all
CREATE POLICY "Users can view own contracts"
ON public.contracts
FOR SELECT
USING (
  public.auth_role() IN ('admin','manager')
  OR user_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1
  )
);

-- Admin/Manager can create contracts
CREATE POLICY "Admin/Manager can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin/Manager can update contracts
CREATE POLICY "Admin/Manager can update contracts"
ON public.contracts
FOR UPDATE
USING (public.auth_role() IN ('admin','manager'))
WITH CHECK (public.auth_role() IN ('admin','manager'));

-- Admin can delete contracts
CREATE POLICY "Admin can delete contracts"
ON public.contracts
FOR DELETE
USING (public.auth_role() = 'admin');
