import { supabase } from './supabase';
import { Comment } from '../types/database';
import { notificationService } from './notifications';

export interface CommentWithUser extends Comment {
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  liked?: boolean; // Whether current user liked this comment
}

export const commentService = {
  /**
   * Get comments for a specific post
   */
  async getComments(postId: string, userId?: string): Promise<CommentWithUser[]> {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:user_id(id, username, avatar_url, full_name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      const { data: comments, error } = await query;

      if (error) throw error;

      if (!comments) return [];

      // If user is provided, check which comments they've liked
      let likedComments: string[] = [];
      if (userId) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', userId)
          .in('comment_id', comments.map(c => c.id));
        
        likedComments = likes?.map(l => l.comment_id) || [];
      }

      return comments.map(comment => ({
        ...comment,
        user: comment.user || {
          id: comment.user_id,
          username: 'Unknown User',
          avatar_url: null,
          full_name: null,
        },
        liked: likedComments.includes(comment.id),
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  /**
   * Add a new comment to a post
   */
  async addComment(postId: string, userId: string, content: string): Promise<Comment | null> {
    try {
      // Insert the comment
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update post comments count
      await supabase.rpc('increment_post_comments', { post_id: postId });

      // Create notification for post owner
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post && post.user_id !== userId) {
        await notificationService.createCommentNotification(
          postId,
          comment.id,
          userId,
          post.user_id
        );
      }

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  },

  /**
   * Delete a comment (only by comment owner)
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      // First check if user owns the comment
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id, post_id')
        .eq('id', commentId)
        .single();

      if (!comment || comment.user_id !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }

      // Delete the comment
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update post comments count
      await supabase.rpc('decrement_post_comments', { post_id: comment.post_id });

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  },

  /**
   * Like/unlike a comment
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        await supabase.rpc('decrement_comment_likes', { comment_id: commentId });
        return false;
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId,
          });

        await supabase.rpc('increment_comment_likes', { comment_id: commentId });
        return true;
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return false;
    }
  },

  /**
   * Get comment count for a post
   */
  async getCommentCount(postId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  },
};
