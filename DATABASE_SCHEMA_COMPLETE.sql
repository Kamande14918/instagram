-- ========================================
-- INSTAGRAM CLONE - COMPLETE DATABASE SCHEMA
-- ========================================
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- ========================================
-- NOTIFICATIONS TABLE WITH PROPER SCHEMA
-- ========================================

-- Drop and recreate notifications table with proper columns
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'mention', 'post_tag'
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);

-- ========================================
-- ENABLE RLS ON NOTIFICATIONS
-- ========================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- Create RLS policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- ========================================
-- FUNCTIONS FOR AUTOMATIC NOTIFICATIONS
-- ========================================

-- Function to create like notifications
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if the liker is not the post owner
    IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
        INSERT INTO notifications (
            recipient_id,
            actor_id,
            type,
            post_id,
            title,
            body,
            data
        ) VALUES (
            (SELECT user_id FROM posts WHERE id = NEW.post_id),
            NEW.user_id,
            'like',
            NEW.post_id,
            'New like on your post',
            (SELECT username FROM users WHERE id = NEW.user_id) || ' liked your post',
            jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create comment notifications
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if the commenter is not the post owner
    IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
        INSERT INTO notifications (
            recipient_id,
            actor_id,
            type,
            post_id,
            comment_id,
            title,
            body,
            data
        ) VALUES (
            (SELECT user_id FROM posts WHERE id = NEW.post_id),
            NEW.user_id,
            'comment',
            NEW.post_id,
            NEW.id,
            'New comment on your post',
            (SELECT username FROM users WHERE id = NEW.user_id) || ' commented on your post',
            jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create follow notifications
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        recipient_id,
        actor_id,
        type,
        title,
        body,
        data
    ) VALUES (
        NEW.following_id,
        NEW.follower_id,
        'follow',
        'New follower',
        (SELECT username FROM users WHERE id = NEW.follower_id) || ' started following you',
        jsonb_build_object('follower_id', NEW.follower_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ========================================

-- Trigger for like notifications
DROP TRIGGER IF EXISTS like_notification_trigger ON public.likes;
CREATE TRIGGER like_notification_trigger
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- Trigger for comment notifications
DROP TRIGGER IF EXISTS comment_notification_trigger ON public.comments;
CREATE TRIGGER comment_notification_trigger
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- Trigger for follow notifications
DROP TRIGGER IF EXISTS follow_notification_trigger ON public.follows;
CREATE TRIGGER follow_notification_trigger
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- ========================================
-- SEED SOME SAMPLE NOTIFICATIONS (OPTIONAL)
-- ========================================

-- Note: This will only work if you have existing users
-- You can run this after creating some test users and posts

-- Example: Create a welcome notification for all existing users
-- INSERT INTO notifications (recipient_id, actor_id, type, title, body, data)
-- SELECT 
--     id,
--     id,
--     'welcome',
--     'Welcome to Instagram!',
--     'Start by creating your first post or following some users',
--     '{"type": "welcome"}'
-- FROM users;

-- ========================================
-- HELPFUL QUERIES FOR TESTING
-- ========================================

-- View all notifications for a specific user
-- SELECT 
--     n.*,
--     actor.username as actor_username,
--     recipient.username as recipient_username
-- FROM notifications n
-- JOIN users actor ON n.actor_id = actor.id
-- JOIN users recipient ON n.recipient_id = recipient.id
-- WHERE n.recipient_id = 'YOUR_USER_ID'
-- ORDER BY n.created_at DESC;

-- Mark all notifications as read for a user
-- UPDATE notifications 
-- SET is_read = true 
-- WHERE recipient_id = 'YOUR_USER_ID' AND is_read = false;

-- Count unread notifications for a user
-- SELECT COUNT(*) as unread_count 
-- FROM notifications 
-- WHERE recipient_id = 'YOUR_USER_ID' AND is_read = false;
