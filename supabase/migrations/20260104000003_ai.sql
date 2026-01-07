-- AI Content Creator Schema
-- Created: 2026-01-04
-- Author: Marosdee Uma
-- Description: Database schema for AI Content Creator application
-- NOTE: Content types use master data (code) instead of DB table for performance

-- ============================================================================
-- CONTENTS TABLE (Main Table)
-- ============================================================================
-- NOTE: content_type_id is stored as TEXT, validated by application code
-- using master data from src/data/master/contentTypes.ts
CREATE TABLE IF NOT EXISTS public.ai_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type_id TEXT NOT NULL, -- Validated by app using master data
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prompt TEXT,
  time_slot TEXT CHECK (time_slot IN ('morning', 'lunch', 'afternoon', 'evening')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  -- New fields for unified Content entity
  comments INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  emoji TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_contents_profile_id ON public.ai_contents(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_contents_status ON public.ai_contents(status);
CREATE INDEX IF NOT EXISTS idx_ai_contents_time_slot ON public.ai_contents(time_slot);
CREATE INDEX IF NOT EXISTS idx_ai_contents_created_at ON public.ai_contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_contents_scheduled_at ON public.ai_contents(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ai_contents_content_type_id ON public.ai_contents(content_type_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at trigger for ai_contents
CREATE TRIGGER update_ai_contents_updated_at
  BEFORE UPDATE ON public.ai_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.ai_contents ENABLE ROW LEVEL SECURITY;

-- Contents: Users can read their own or published
CREATE POLICY "ai_contents_select_own_or_published" ON public.ai_contents
  FOR SELECT USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR status = 'published'
  );

-- Contents: Users can insert their own
CREATE POLICY "ai_contents_insert_own" ON public.ai_contents
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

-- Contents: Users can update their own
CREATE POLICY "ai_contents_update_own" ON public.ai_contents
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

-- Contents: Users can delete their own
CREATE POLICY "ai_contents_delete_own" ON public.ai_contents
  FOR DELETE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

-- Contents: Admins can do everything
CREATE POLICY "ai_contents_admin_all" ON public.ai_contents
  FOR ALL USING (
    public.get_active_profile_role() = 'admin'::public.profile_role
  );

-- ============================================================================
-- CREATE AI CONTENTS STORAGE BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('ai-contents', 'ai-contents', true, false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ai-contents bucket
CREATE POLICY "AI content images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-contents');

CREATE POLICY "Users can upload AI content images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-contents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their AI content images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ai-contents' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their AI content images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-contents' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
