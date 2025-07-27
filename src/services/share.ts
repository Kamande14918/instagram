import { Share, Alert, Clipboard } from 'react-native';

export interface ShareOptions {
  postId: string;
  caption?: string;
  imageUrl?: string;
  username?: string;
}

export const shareService = {
  /**
   * Share post via native sharing
   */
  async sharePost(options: ShareOptions): Promise<boolean> {
    try {
      const { postId, caption, username } = options;
      const postUrl = `https://yourapp.com/post/${postId}`; // Replace with your actual domain
      
      const message = `Check out this post by @${username || 'user'}!\n\n${caption || ''}\n\n${postUrl}`;

      const result = await Share.share({
        message,
        title: 'Instagram Post',
        url: postUrl, // For iOS
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
      return false;
    }
  },

  /**
   * Copy post link to clipboard
   */
  async copyPostLink(postId: string): Promise<boolean> {
    try {
      const postUrl = `https://yourapp.com/post/${postId}`;
      Clipboard.setString(postUrl);
      Alert.alert('Success', 'Link copied to clipboard');
      return true;
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link');
      return false;
    }
  },

  /**
   * Share to Instagram Stories (if possible)
   */
  async shareToInstagramStories(imageUrl: string): Promise<boolean> {
    try {
      // This would require Instagram integration
      // For now, we'll show a placeholder
      Alert.alert(
        'Share to Instagram Stories',
        'This feature requires Instagram app integration. Coming soon!',
        [{ text: 'OK' }]
      );
      return false;
    } catch (error) {
      console.error('Error sharing to Instagram Stories:', error);
      return false;
    }
  },

  /**
   * Show share options modal
   */
  showShareOptions(options: ShareOptions): void {
    Alert.alert(
      'Share Post',
      'Choose how you want to share this post',
      [
        {
          text: 'Share via...',
          onPress: () => this.sharePost(options),
        },
        {
          text: 'Copy Link',
          onPress: () => this.copyPostLink(options.postId),
        },
        {
          text: 'Share to Stories',
          onPress: () => this.shareToInstagramStories(options.imageUrl || ''),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  },

  /**
   * Report post functionality
   */
  reportPost(postId: string, reason: string): void {
    Alert.alert(
      'Report Post',
      'Thank you for your report. We will review this content.',
      [{ text: 'OK' }]
    );
    // Here you would typically send the report to your backend
    console.log('Post reported:', { postId, reason });
  },

  /**
   * Save post to bookmarks (future feature)
   */
  async savePost(postId: string, userId: string): Promise<boolean> {
    try {
      // This would save to a bookmarks/saved_posts table
      Alert.alert('Save Post', 'Post saved to your bookmarks');
      return true;
    } catch (error) {
      console.error('Error saving post:', error);
      return false;
    }
  },
};
