-- ========================================
-- COMMENT SYSTEM DATABASE FUNCTIONS
-- ========================================
-- Additional functions needed for the comment system

-- ========================================
-- COMMENT LIKES TABLE
-- ========================================

-- Create comment_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON public.comment_likes(user_id);

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comment_likes
DROP POLICY IF EXISTS "Users can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can manage own comment likes" ON public.comment_likes;

CREATE POLICY "Users can view comment likes" ON public.comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own comment likes" ON public.comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- STORED FUNCTIONS FOR COUNTERS
-- ========================================

-- Function to increment post comments count
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts 
    SET comments_count = comments_count + 1,
        updated_at = NOW()
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post comments count
CREATE OR REPLACE FUNCTION decrement_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts 
    SET comments_count = GREATEST(comments_count - 1, 0),
        updated_at = NOW()
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comment likes count
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE comments 
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comment likes count
CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE comments 
    SET likes_count = GREATEST(likes_count - 1, 0),
        updated_at = NOW()
    WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS FOR AUTOMATIC COMMENT COUNTING
-- ========================================

-- Trigger to automatically update comments count when comments are added/removed
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts 
        SET comments_count = comments_count + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET comments_count = GREATEST(comments_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;
CREATE TRIGGER comments_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ========================================
-- USEFUL QUERIES FOR TESTING COMMENTS
-- ========================================

-- Get comments with user information
-- SELECT 
--     c.*,
--     u.username,
--     u.avatar_url
-- FROM comments c
-- JOIN users u ON c.user_id = u.id
-- WHERE c.post_id = 'YOUR_POST_ID'
-- ORDER BY c.created_at ASC;

-- Get comment count for a post
-- SELECT COUNT(*) as comment_count 
-- FROM comments 
-- WHERE post_id = 'YOUR_POST_ID';

-- Get posts with comment counts
-- SELECT 
--     p.id,
--     p.caption,
--     p.comments_count,
--     u.username
-- FROM posts p
-- JOIN users u ON p.user_id = u.id
-- ORDER BY p.created_at DESC;

-- Get most commented posts
-- SELECT 
--     p.*,
--     u.username,
--     COUNT(c.id) as actual_comment_count
-- FROM posts p
-- JOIN users u ON p.user_id = u.id
-- LEFT JOIN comments c ON p.id = c.post_id
-- GROUP BY p.id, u.username
-- ORDER BY actual_comment_count DESC
-- LIMIT 10;
