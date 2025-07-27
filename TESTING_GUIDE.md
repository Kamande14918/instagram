# Testing Guide - Comments & Share Functionality

## Overview
This guide provides comprehensive testing procedures for the newly implemented comments and share functionality in your Instagram Clone app.

## Pre-Testing Setup

### 1. Ensure Database is Ready
- [ ] Run `PRODUCTION_DATABASE_SETUP.sql` in Supabase SQL Editor
- [ ] Verify all tables exist in Supabase Table Editor
- [ ] Check that RLS policies are enabled
- [ ] Confirm triggers and functions are created

### 2. Environment Configuration
- [ ] `.env` file configured with Supabase credentials
- [ ] All dependencies installed (`npm install`)
- [ ] Navigation properly configured (see `NAVIGATION_SETUP.md`)
- [ ] App builds without errors (`npx expo start`)

### 3. Test Data Setup
Create test users and posts for comprehensive testing:

```sql
-- Insert test users (run in Supabase SQL Editor)
INSERT INTO public.users (id, username, email, full_name, avatar_url) VALUES
('11111111-1111-1111-1111-111111111111', 'testuser1', 'test1@example.com', 'Test User 1', 'https://via.placeholder.com/150'),
('22222222-2222-2222-2222-222222222222', 'testuser2', 'test2@example.com', 'Test User 2', 'https://via.placeholder.com/150'),
('33333333-3333-3333-3333-333333333333', 'testuser3', 'test3@example.com', 'Test User 3', 'https://via.placeholder.com/150');

-- Insert test posts
INSERT INTO public.posts (id, user_id, caption, media_urls, media_types) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Test post for comments', ARRAY['https://via.placeholder.com/400'], ARRAY['image']),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Another test post', ARRAY['https://via.placeholder.com/400'], ARRAY['image']);
```

## Comments Functionality Testing

### Test Case 1: View Comments Screen
**Objective**: Verify comments screen loads correctly

**Steps**:
1. Open the app and navigate to HomeScreen
2. Find a post with comments
3. Tap the comment icon/button
4. Verify CommentsScreen opens

**Expected Results**:
- [ ] CommentsScreen loads without errors
- [ ] Post details are displayed at the top
- [ ] Comments list is visible (may be empty initially)
- [ ] Comment input field is present at the bottom
- [ ] Send button is visible and enabled when text is entered

### Test Case 2: Add New Comment
**Objective**: Test comment creation functionality

**Steps**:
1. Navigate to CommentsScreen for any post
2. Type a test comment in the input field
3. Tap the send button
4. Verify comment appears immediately

**Expected Results**:
- [ ] Comment appears in the list instantly
- [ ] Comment shows correct username and timestamp
- [ ] Input field clears after sending
- [ ] Comments count updates in the post
- [ ] Database shows the new comment

**Database Verification**:
```sql
-- Check comments were created
SELECT c.*, u.username 
FROM comments c 
JOIN users u ON c.user_id = u.id 
ORDER BY c.created_at DESC;
```

### Test Case 3: Real-time Comment Loading
**Objective**: Verify comments load in real-time

**Steps**:
1. Have two devices/browsers open the same post's comments
2. Add a comment from device 1
3. Check if comment appears on device 2

**Expected Results**:
- [ ] New comments appear automatically on all devices
- [ ] Comments are ordered by creation time
- [ ] User avatars and names display correctly
- [ ] Timestamps are formatted properly

### Test Case 4: Comment Likes
**Objective**: Test comment like/unlike functionality

**Steps**:
1. Navigate to CommentsScreen with existing comments
2. Tap the heart icon on a comment
3. Verify like count increases
4. Tap heart again to unlike
5. Verify like count decreases

**Expected Results**:
- [ ] Heart icon changes appearance when liked
- [ ] Like count updates immediately
- [ ] Database reflects like changes
- [ ] Heart animation plays smoothly

**Database Verification**:
```sql
-- Check comment likes
SELECT cl.*, c.content, u.username 
FROM comment_likes cl 
JOIN comments c ON cl.comment_id = c.id 
JOIN users u ON cl.user_id = u.id;
```

### Test Case 5: Comment Notifications
**Objective**: Verify notifications are created for comments

**Steps**:
1. User A comments on User B's post
2. Check User B's notifications

**Expected Results**:
- [ ] Notification is created for post owner
- [ ] Notification has correct type ('comment')
- [ ] Notification includes commenter's username
- [ ] Notification appears in ActivityScreen

**Database Verification**:
```sql
-- Check notifications were created
SELECT n.*, u.username as actor_username 
FROM notifications n 
JOIN users u ON n.actor_id = u.id 
WHERE n.type = 'comment' 
ORDER BY n.created_at DESC;
```

### Test Case 6: Comments Error Handling
**Objective**: Test error scenarios

**Steps**:
1. Try to submit empty comment
2. Try to comment while offline
3. Try to like comment while offline

**Expected Results**:
- [ ] Empty comments are not submitted
- [ ] Appropriate error messages display
- [ ] App doesn't crash on network errors
- [ ] Actions retry when connection is restored

## Share Functionality Testing

### Test Case 7: Native Share Integration
**Objective**: Test native share functionality

**Steps**:
1. Navigate to HomeScreen
2. Find any post
3. Tap the share icon/button
4. Verify native share sheet appears

**Expected Results**:
- [ ] Native share sheet opens
- [ ] Share options are available (Messages, Email, etc.)
- [ ] Post content is properly formatted for sharing
- [ ] Share completes successfully

### Test Case 8: Copy Link Functionality
**Objective**: Test link copying feature

**Steps**:
1. Tap share button on a post
2. Select "Copy Link" option
3. Paste in another app to verify

**Expected Results**:
- [ ] Link is copied to clipboard
- [ ] Success message appears
- [ ] Copied link is properly formatted
- [ ] Link contains post ID for future deep linking

### Test Case 9: Share Options Modal
**Objective**: Test custom share options

**Steps**:
1. Tap share button on a post
2. Verify share options modal appears
3. Test each share option

**Expected Results**:
- [ ] Modal displays with multiple options
- [ ] "Share Post" opens native share
- [ ] "Copy Link" copies to clipboard
- [ ] "Cancel" closes the modal
- [ ] Modal has proper styling and animations

### Test Case 10: Share Error Handling
**Objective**: Test share error scenarios

**Steps**:
1. Try to share while offline
2. Try to share on device without share capabilities
3. Test with malformed post data

**Expected Results**:
- [ ] Appropriate error messages display
- [ ] App doesn't crash on share failures
- [ ] Fallback options work properly
- [ ] User is informed of any issues

## Performance Testing

### Test Case 11: Comments Loading Performance
**Objective**: Test performance with many comments

**Steps**:
1. Create a post with 50+ comments
2. Open CommentsScreen
3. Measure loading time and scroll performance

**Expected Results**:
- [ ] Comments load within 2 seconds
- [ ] Smooth scrolling performance
- [ ] No memory leaks or crashes
- [ ] Pagination works if implemented

**Load Test Data**:
```sql
-- Insert many test comments
INSERT INTO public.comments (post_id, user_id, content)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Test comment #' || generate_series(1, 50);
```

### Test Case 12: Memory Usage
**Objective**: Monitor memory usage during testing

**Steps**:
1. Open app and monitor initial memory
2. Navigate through comments screens
3. Add/like multiple comments
4. Check for memory leaks

**Expected Results**:
- [ ] Memory usage remains stable
- [ ] No significant memory leaks detected
- [ ] App doesn't crash due to memory issues
- [ ] Images are properly cached and released

## Integration Testing

### Test Case 13: Navigation Integration
**Objective**: Test navigation flow between screens

**Steps**:
1. Start from HomeScreen
2. Navigate to CommentsScreen
3. Return to HomeScreen
4. Navigate to ProfileScreen
5. Return to comments

**Expected Results**:
- [ ] Navigation works smoothly
- [ ] Back buttons function properly
- [ ] Screen state is preserved appropriately
- [ ] No navigation errors or crashes

### Test Case 14: Authentication Integration
**Objective**: Test features with different auth states

**Steps**:
1. Test comments while logged in
2. Test comments while logged out
3. Test share functionality in both states

**Expected Results**:
- [ ] Comments require authentication
- [ ] Appropriate messages for unauthenticated users
- [ ] Share works regardless of auth state
- [ ] Login prompts appear when needed

### Test Case 15: Cross-Platform Testing
**Objective**: Test on different platforms

**Steps**:
1. Test on iOS device/simulator
2. Test on Android device/emulator
3. Test on web (if applicable)

**Expected Results**:
- [ ] Features work consistently across platforms
- [ ] UI elements display properly on all screens
- [ ] Platform-specific features work (native share)
- [ ] No platform-specific crashes

## Regression Testing

### Test Case 16: Existing Functionality
**Objective**: Ensure existing features still work

**Steps**:
1. Test post creation
2. Test post likes
3. Test user profile viewing
4. Test authentication flow

**Expected Results**:
- [ ] All existing features work as before
- [ ] No performance degradation
- [ ] UI remains consistent
- [ ] No new bugs introduced

## Bug Reporting Template

When you find issues during testing, use this template:

```
**Bug Report**
- **Test Case**: [Test case number and name]
- **Device/Platform**: [iOS/Android/Web]
- **Steps to Reproduce**: 
  1. Step 1
  2. Step 2
  3. Step 3
- **Expected Result**: [What should happen]
- **Actual Result**: [What actually happened]
- **Screenshots**: [If applicable]
- **Console Errors**: [Any error messages]
- **Severity**: [Low/Medium/High/Critical]
```

## Testing Checklist Summary

### Comments Functionality
- [ ] Comments screen loads properly
- [ ] Can add new comments
- [ ] Real-time comment updates work
- [ ] Comment likes function correctly
- [ ] Notifications are created
- [ ] Error handling works

### Share Functionality
- [ ] Native share opens correctly
- [ ] Copy link works
- [ ] Share options modal functions
- [ ] Error handling works

### Performance & Integration
- [ ] Good performance with many comments
- [ ] Memory usage is stable
- [ ] Navigation works properly
- [ ] Authentication integration works
- [ ] Cross-platform compatibility
- [ ] No regression in existing features

## Post-Testing Actions

After completing all tests:

1. **Document Issues**: Record all bugs found
2. **Prioritize Fixes**: Rank issues by severity
3. **Performance Metrics**: Document load times and memory usage
4. **User Feedback**: Gather feedback from test users
5. **Code Review**: Review implementation for improvements
6. **Deployment Ready**: Confirm all critical tests pass

## Automated Testing (Optional)

For ongoing quality assurance, consider implementing:

```typescript
// Example Jest test for comments service
describe('Comments Service', () => {
  test('should add comment successfully', async () => {
    const result = await commentService.addComment(
      'test-post-id',
      'test-user-id',
      'Test comment'
    );
    expect(result.success).toBe(true);
    expect(result.data.content).toBe('Test comment');
  });

  test('should handle empty comment', async () => {
    const result = await commentService.addComment(
      'test-post-id',
      'test-user-id',
      ''
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Comment cannot be empty');
  });
});
```

Your comprehensive testing is now ready to ensure the comments and share functionality works perfectly!
