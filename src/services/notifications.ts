import { supabase } from './supabase';

export interface CreateNotificationParams {
  recipientId: string;
  actorId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post_tag' | 'welcome';
  title: string;
  body?: string;
  postId?: string;
  commentId?: string;
  data?: any;
}

export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams) {
    try {
      // Don't create notification if actor and recipient are the same
      if (params.actorId === params.recipientId && params.type !== 'welcome') {
        return null;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: params.recipientId,
          actor_id: params.actorId,
          type: params.type,
          title: params.title,
          body: params.body,
          post_id: params.postId,
          comment_id: params.commentId,
          data: params.data || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id(id, username, avatar_url, full_name),
          post:post_id(id, caption, media_urls)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  },

  /**
   * Create like notification
   */
  async createLikeNotification(postId: string, likerId: string, postOwnerId: string) {
    if (likerId === postOwnerId) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', likerId)
      .single();

    const username = userData?.username || 'Someone';

    return this.createNotification({
      recipientId: postOwnerId,
      actorId: likerId,
      type: 'like',
      title: 'New like on your post',
      body: `${username} liked your post`,
      postId,
      data: { post_id: postId, liker_id: likerId }
    });
  },

  /**
   * Create comment notification
   */
  async createCommentNotification(postId: string, commentId: string, commenterId: string, postOwnerId: string) {
    if (commenterId === postOwnerId) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', commenterId)
      .single();

    const username = userData?.username || 'Someone';

    return this.createNotification({
      recipientId: postOwnerId,
      actorId: commenterId,
      type: 'comment',
      title: 'New comment on your post',
      body: `${username} commented on your post`,
      postId,
      commentId,
      data: { post_id: postId, comment_id: commentId, commenter_id: commenterId }
    });
  },

  /**
   * Create follow notification
   */
  async createFollowNotification(followerId: string, followingId: string) {
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', followerId)
      .single();

    const username = userData?.username || 'Someone';

    return this.createNotification({
      recipientId: followingId,
      actorId: followerId,
      type: 'follow',
      title: 'New follower',
      body: `${username} started following you`,
      data: { follower_id: followerId }
    });
  },

  /**
   * Create welcome notification for new users
   */
  async createWelcomeNotification(userId: string) {
    return this.createNotification({
      recipientId: userId,
      actorId: userId,
      type: 'welcome',
      title: 'Welcome to Instagram!',
      body: 'Start by creating your first post or following some users',
      data: { type: 'welcome' }
    });
  }
};
