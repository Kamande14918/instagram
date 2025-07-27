-- ========================================
-- SAMPLE NOTIFICATIONS FOR TESTING
-- ========================================
-- Run this after setting up the main database schema
-- This will create some sample notifications to test the ActivityScreen

-- First, let's create some sample notifications
-- Replace 'YOUR_USER_ID' with an actual user ID from your users table

-- Example: Create different types of notifications
-- You can get user IDs by running: SELECT id, username FROM users LIMIT 5;

-- ========================================
-- TEMPLATE QUERIES (Replace USER_IDs with actual values)
-- ========================================

-- 1. Like notification
INSERT INTO notifications (recipient_id, actor_id, type, title, body, data, post_id)
VALUES (
    'RECIPIENT_USER_ID',  -- The user who receives the notification
    'ACTOR_USER_ID',      -- The user who performed the action
    'like',
    'New like on your post',
    'Someone liked your post',
    '{"type": "like", "post_id": "POST_ID"}',
    'POST_ID'  -- Replace with actual post ID
);

-- 2. Comment notification
INSERT INTO notifications (recipient_id, actor_id, type, title, body, data, post_id)
VALUES (
    'RECIPIENT_USER_ID',
    'ACTOR_USER_ID',
    'comment',
    'New comment on your post',
    'Someone commented on your post',
    '{"type": "comment", "post_id": "POST_ID"}',
    'POST_ID'
);

-- 3. Follow notification
INSERT INTO notifications (recipient_id, actor_id, type, title, body, data)
VALUES (
    'RECIPIENT_USER_ID',
    'ACTOR_USER_ID',
    'follow',
    'New follower',
    'Someone started following you',
    '{"type": "follow"}'
);

-- 4. Welcome notification (self-notification)
INSERT INTO notifications (recipient_id, actor_id, type, title, body, data)
VALUES (
    'YOUR_USER_ID',
    'YOUR_USER_ID',
    'welcome',
    'Welcome to Instagram!',
    'Start by creating your first post or following some users',
    '{"type": "welcome"}'
);

-- ========================================
-- AUTOMATED SAMPLE CREATION (If you have existing data)
-- ========================================

-- Create welcome notifications for all existing users
-- INSERT INTO notifications (recipient_id, actor_id, type, title, body, data)
-- SELECT 
--     id,
--     id,
--     'welcome',
--     'Welcome to Instagram!',
--     'Start by creating your first post or following some users',
--     '{"type": "welcome"}'
-- FROM users
-- WHERE id NOT IN (
--     SELECT recipient_id FROM notifications WHERE type = 'welcome'
-- );

-- ========================================
-- USEFUL TESTING QUERIES
-- ========================================

-- View all notifications for debugging
-- SELECT 
--     n.type,
--     n.title,
--     n.body,
--     n.created_at,
--     recipient.username as recipient,
--     actor.username as actor
-- FROM notifications n
-- JOIN users recipient ON n.recipient_id = recipient.id
-- JOIN users actor ON n.actor_id = actor.id
-- ORDER BY n.created_at DESC;

-- Count notifications by type
-- SELECT type, COUNT(*) as count
-- FROM notifications
-- GROUP BY type
-- ORDER BY count DESC;

-- Find users with notifications
-- SELECT DISTINCT u.username, u.id
-- FROM users u
-- JOIN notifications n ON u.id = n.recipient_id
-- ORDER BY u.username;
