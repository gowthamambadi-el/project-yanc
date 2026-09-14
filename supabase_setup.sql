-- ============================================================
-- YANC Team CMS & Storage Setup Script
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'advisory-board',
        'executive-management',
        'cohort-founders',
        'cohort-ambassadors',
        'cohort-members',
        'cross-borders'
    )),
    bio TEXT DEFAULT '',
    initials TEXT DEFAULT '',
    photo_url TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read all team members
DROP POLICY IF EXISTS "Public can read team members" ON public.team_members;
CREATE POLICY "Public can read team members"
ON public.team_members
FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users (admin) can insert, update, delete
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
CREATE POLICY "Admins can insert team members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
CREATE POLICY "Admins can update team members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;
CREATE POLICY "Admins can delete team members"
ON public.team_members
FOR DELETE
TO authenticated
USING (true);

-- 3. Create Storage bucket for Team Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team_photos', 'team_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Public can view photos in team_photos bucket
DROP POLICY IF EXISTS "Public can view team photos" ON storage.objects;
CREATE POLICY "Public can view team photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team_photos');

-- Policy: Authenticated users can upload photos
DROP POLICY IF EXISTS "Authenticated users can upload team photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload team photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team_photos');

-- Policy: Authenticated users can update/delete photos
DROP POLICY IF EXISTS "Authenticated users can update team photos" ON storage.objects;
CREATE POLICY "Authenticated users can update team photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'team_photos');

DROP POLICY IF EXISTS "Authenticated users can delete team photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete team photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'team_photos');

-- 4. Create index for fast retrieval by category and sort_order
CREATE INDEX IF NOT EXISTS idx_team_members_category ON public.team_members(category, sort_order ASC);
