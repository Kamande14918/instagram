-- ========================================
-- INSTAGRAM CLONE - STORAGE BUCKET SETUP
-- ========================================
-- Run this SQL in your Supabase SQL Editor to create the required storage policies

-- IMPORTANT: First create the buckets manually in Supabase Dashboard > Storage:
-- 1. Create 'posts' bucket (make it PUBLIC)
-- 2. Create 'avatars' bucket (make it PUBLIC)
-- Then run this SQL script

-- ========================================
-- STORAGE POLICIES SETUP (Using Supabase Functions)
-- ========================================

-- Note: In Supabase, storage policies are typically managed through the dashboard
-- or using the storage.create_policy() function if available
-- For now, we'll focus on the users table policies which are the main issue

-- If you need to create storage policies, do it through the Supabase Dashboard:
-- Go to Storage > Your Bucket > Policies tab > Add Policy

-- ========================================
-- USERS TABLE RLS POLICIES (This is the main fix needed)
-- ========================================

-- 3. Fix the users table RLS policy to allow inserts
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create new policy to allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow everyone to view user profiles
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- FINAL INSTRUCTIONS:
-- ========================================
-- 1. First, go to Supabase Dashboard > Storage
-- 2. Create these buckets manually:
--    - 'posts' (for post images and videos) - Make PUBLIC
--    - 'avatars' (for profile pictures) - Make PUBLIC  
-- 3. For storage policies, go to each bucket > Policies tab and add:
--    
--    For 'posts' bucket:
--    - Policy Name: "Allow authenticated uploads"
--    - Policy: INSERT for authenticated users
--    - SQL: (bucket_id = 'posts' AND auth.role() = 'authenticated')
--    
--    - Policy Name: "Allow public viewing" 
--    - Policy: SELECT for all users
--    - SQL: (bucket_id = 'posts')
--
-- 4. For 'avatars' bucket:
--    - Policy Name: "Allow avatar uploads"
--    - Policy: INSERT for authenticated users  
--    - SQL: (bucket_id = 'avatars' AND auth.role() = 'authenticated')
--    
--    - Policy Name: "Allow public avatar viewing"
--    - Policy: SELECT for all users
--    - SQL: (bucket_id = 'avatars')
--
-- 5. Run ONLY the users table SQL above in the SQL Editor
-- 6. Test your app - post creation should now work!
-- ========================================

-- Alternative: If buckets are PUBLIC, you might not need policies at all!
-- Just make sure the buckets are set to PUBLIC in the Storage dashboard
