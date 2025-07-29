import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Post, User } from '../types/database';
import { supabase } from '../services/supabase';
import { shareService } from '../services/share';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PostWithUser extends Post {
  users: User;
  liked?: boolean;
}

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch posts with user data
      const { data: queryData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading feed:', error);
        throw error;
      }

      let data = queryData;

      if (!data || data.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Batch check likes for all posts
      const postIds = data.map(post => post.id);
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);

      const postsWithLikes = data.map(post => ({
        ...post,
        liked: likedPostIds.has(post.id),
      }));

      setPosts(postsWithLikes);
      
    } catch (error: any) {
      console.error('Error loading feed:', error.message || error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(false);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (!user) return;

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId,
          });

        if (error) throw error;
      }

      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, liked: !isLiked, likes_count: post.likes_count + (isLiked ? -1 : 1) }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleCommentPress = (post: PostWithUser) => {
    (navigation as any).navigate('Comments', {
      postId: post.id,
      postCaption: post.caption,
      postUsername: post.users.username,
    });
  };

  const handleSharePress = (post: PostWithUser) => {
    const imageUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : undefined;
    
    shareService.showShareOptions({
      postId: post.id,
      caption: post.caption || '',
      imageUrl,
      username: post.users.username,
    });
  };

  const handleViewComments = (postId: string) => {
    try {
      (navigation as any).navigate('Comments', {
        postId,
      });
    } catch (error) {
      Alert.alert('Comments', 'Comments feature will be available soon!');
    }
  };

  const renderPost = (post: PostWithUser) => {
    const imageUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null;
    
    return (
      <View key={post.id} style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {post.users.avatar_url ? (
                <Image source={{ uri: post.users.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={20} color="#999" />
              )}
            </View>
            <Text style={styles.username}>{post.users.username}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Post Image */}
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.postImage}
              onError={(error) => {
                console.log('Image failed to load:', error.nativeEvent.error);
                console.log('Image URL:', imageUrl);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageUrl);
              }}
            />
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={40} color="#999" />
            <Text style={styles.noImageText}>No image available</Text>
          </View>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLike(post.id, post.liked || false)}
            >
              <Ionicons 
                name={post.liked ? "heart" : "heart-outline"} 
                size={24} 
                color={post.liked ? "#ed4956" : "#000"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCommentPress(post)}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSharePress(post)}
            >
              <Ionicons name="paper-plane-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Post Info */}
        <View style={styles.postInfo}>
          <Text style={styles.likesCount}>
            {post.likes_count || 0} {(post.likes_count || 0) === 1 ? 'like' : 'likes'}
          </Text>
          
          {post.caption && (
            <View style={styles.captionContainer}>
              <Text style={styles.caption}>
                <Text style={styles.captionUsername}>{post.users.username}</Text>
                {' '}{post.caption}
              </Text>
            </View>
          )}

          {/* Comments Preview */}
          {post.comments_count > 0 && (
            <TouchableOpacity 
              style={styles.viewCommentsButton}
              onPress={() => handleViewComments(post.id)}
            >
              <Text style={styles.viewCommentsText}>
                View all {post.comments_count} comments
              </Text>
            </TouchableOpacity>
          )}

          {/* Add a comment quick action */}
          <TouchableOpacity 
            style={styles.addCommentButton}
            onPress={() => handleCommentPress(post)}
          >
            <Text style={styles.addCommentText}>Add a comment...</Text>
          </TouchableOpacity>
          
          <Text style={styles.timeAgo}>
            {getTimeAgo(post.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return `${Math.floor(diffInMinutes / 10080)}w`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="camera-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.logo}>Instagram</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="heart-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="paper-plane-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView
        style={styles.feed}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Debug Info - Remove in production
        {__DEV__ && (
          <View style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 10 }}>
            <Text>🐛 Debug Info:</Text>
            <Text>Loading: {loading.toString()}</Text>
            <Text>Posts count: {posts.length}</Text>
            <Text>User: {user?.id?.slice(0, 8) || 'No user'}</Text>
            <Text>Refreshing: {refreshing.toString()}</Text>
          </View>
        )} */}

        {posts.length === 0 && loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>🔄 Loading posts...</Text>
            <Text style={styles.loadingSubtext}>
              This may take a few seconds if you have many posts
            </Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={80} color="#999" />
            <Text style={styles.emptyStateTitle}>
              {loading ? 'Loading posts...' : 'Welcome to Instagram!'}
            </Text>
            <Text style={styles.emptyStateText}>
              {loading 
                ? 'Please wait while we fetch your feed...' 
                : 'Create your first post to get started, or find people to follow.'
              }
            </Text>
          </View>
        ) : (
          posts.map((post) => renderPost(post))
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(10, screenHeight * 0.012),
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  logo: {
    fontSize: Math.max(24, screenWidth * 0.06),
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: Math.max(16, screenWidth * 0.04),
  },
  feed: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: Math.max(32, screenWidth * 0.08),
    height: Math.max(32, screenWidth * 0.08),
    borderRadius: Math.max(16, screenWidth * 0.04),
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Math.max(12, screenWidth * 0.03),
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: screenWidth,
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  postInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  captionContainer: {
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  viewCommentsButton: {
    marginTop: 4,
    marginBottom: 4,
  },
  viewCommentsText: {
    fontSize: 12,
    color: '#999',
  },
  addCommentButton: {
    marginTop: 4,
    marginBottom: 4,
  },
  addCommentText: {
    fontSize: 12,
    color: '#999',
  },
  postText: {
    fontSize: 14,
    lineHeight: 18,
  },
});
