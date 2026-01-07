-- FilmNest Storage Configuration
-- Created: 2025-06-18
-- Author: Marosdee Uma
-- Description: Supabase Storage configuration for FilmNest application

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES
  ('avatars', 'avatars', true, false),
  ('thumbnails', 'thumbnails', true, false),
  ('uploads', 'uploads', false, false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Set up storage policies for thumbnails (public bucket)
CREATE POLICY "Thumbnail images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload their own thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'thumbnails' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'thumbnails' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Set up storage policies for uploads (private bucket)
CREATE POLICY "Users can view their own uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'uploads' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'uploads' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'uploads' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can access all storage objects
CREATE POLICY "Admins can select any object"
  ON storage.objects FOR SELECT
  USING (
    public.get_active_profile_role() = 'admin'::public.profile_role
  );

CREATE POLICY "Admins can insert any object"
  ON storage.objects FOR INSERT
  WITH CHECK (
    public.get_active_profile_role() = 'admin'::public.profile_role
  );

CREATE POLICY "Admins can update any object"
  ON storage.objects FOR UPDATE
  USING (
    public.get_active_profile_role() = 'admin'::public.profile_role
  );

CREATE POLICY "Admins can delete any object"
  ON storage.objects FOR DELETE
  USING (
    public.get_active_profile_role() = 'admin'::public.profile_role
  );

-- Create function to generate signed URLs for private files
CREATE OR REPLACE FUNCTION storage.get_private_url(bucket TEXT, object_path TEXT, expires_in INTEGER DEFAULT 60)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  url TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for getting private URL';
  END IF;

  -- Check if user owns the file or is admin
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE 
      bucket_id = get_private_url.bucket AND
      name = get_private_url.object_path AND
      (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.get_active_profile_role() = 'admin'::public.profile_role
      )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Generate signed URL
  SELECT storage.sign_url(get_private_url.bucket, get_private_url.object_path, get_private_url.expires_in)
  INTO url;

  RETURN url;
END;
$$;
