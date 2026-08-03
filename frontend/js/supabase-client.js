import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://tdfkebgapncswtvbtaqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmtlYmdhcG5jc3d0dmJ0YXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg3MzUsImV4cCI6MjA5NjMzNDczNX0.Aj-GtD5sPCtuHWmZ5ZClSStwa3-b6ENtXr0uYaV-UzQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
