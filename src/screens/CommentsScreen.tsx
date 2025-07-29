import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { commentService, CommentWithUser } from '../services/comments';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CommentsScreenProps {
  route: {
    params: {
      postId: string;
      postCaption?: string;
      postUsername?: string;
    };
  };
}

export const CommentsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { postId, postCaption, postUsername } = route.params as any;
  
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadComments();
    
    // Keyboard event listeners for dynamic height calculation
    const keyboardWillShow = (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
    };
    
    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };
    
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const showSubscription = Keyboard.addListener(showEvent, keyboardWillShow);
    const hideSubscription = Keyboard.addListener(hideEvent, keyboardWillHide);
    
    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await commentService.getComments(postId, user?.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setPosting(true);
      const comment = await commentService.addComment(postId, user.id, newComment);
      
      if (comment) {
        // Add the new comment to the list
        const newCommentWithUser: CommentWithUser = {
          ...comment,
          user: {
            id: user.id,
            username: user.email?.split('@')[0] || 'You', // Fallback username
            avatar_url: null, // Get from user profile if available
            full_name: null,
          },
          liked: false,
        };
        
        setComments([...comments, newCommentWithUser]);
        setNewComment('');
        
        // Scroll to bottom to show new comment
        setTimeout(() => {
          flatListRef.current?.scrollToEnd();
        }, 100);
      } else {
        Alert.alert('Error', 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await commentService.deleteComment(commentId, user.id);
            if (success) {
              setComments(comments.filter(c => c.id !== commentId));
            } else {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    const isLiked = await commentService.toggleCommentLike(commentId, user.id);
    
    // Update local state
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            liked: isLiked,
            likes_count: comment.likes_count + (isLiked ? 1 : -1)
          }
        : comment
    ));
  };

  const renderComment = ({ item: comment }: { item: CommentWithUser }) => (
    <View style={styles.commentContainer}>
      {/* User Avatar */}
      <View style={styles.commentAvatar}>
        {comment.user.avatar_url ? (
          <Image source={{ uri: comment.user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person-circle" size={32} color="#ccc" />
        )}
      </View>

      {/* Comment Content */}
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentUsername}>{comment.user.username}</Text>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>

        {/* Comment Actions */}
        <View style={styles.commentActions}>
          <Text style={styles.commentTime}>
            {getTimeAgo(comment.created_at)}
          </Text>
          
          {comment.likes_count > 0 && (
            <Text style={styles.commentLikes}>
              {comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}
            </Text>
          )}
          
          <TouchableOpacity>
            <Text style={styles.replyButton}>Reply</Text>
          </TouchableOpacity>
          
          {comment.user_id === user?.id && (
            <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Like Button */}
      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => handleLikeComment(comment.id)}
      >
        <Ionicons
          name={comment.liked ? 'heart' : 'heart-outline'}
          size={16}
          color={comment.liked ? '#ed4956' : '#999'}
        />
      </TouchableOpacity>
    </View>
  );

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0095f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity>
            <Ionicons name="paper-plane-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
      <FlatList
        ref={flatListRef}
        style={styles.commentsList}
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: Math.max(20, screenHeight * 0.025) + (keyboardHeight > 0 ? keyboardHeight * 0.2 : 0),
          flexGrow: 1 
        }}
      />

      {/* Comment Input */}
      <View style={[
        styles.inputContainer, 
        { 
          paddingBottom: Math.max(insets.bottom, keyboardHeight > 0 ? 10 : insets.bottom),
          marginBottom: Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight * 0.1 : 0
        }
      ]}>
        <View style={styles.inputAvatar}>
          <Ionicons name="person-circle" size={32} color="#ccc" />
        </View>
        
        <TextInput
          style={styles.textInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[styles.postButton, (!newComment.trim() || posting) && styles.postButtonDisabled]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#0095f6" />
          ) : (
            <Text style={[styles.postButtonText, (!newComment.trim() || posting) && styles.postButtonTextDisabled]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentsList: {
    flex: 1,
  },
  commentContainer: {
    flexDirection: 'row',
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
    alignItems: 'flex-start',
  },
  commentAvatar: {
    marginRight: Math.max(12, screenWidth * 0.03),
  },
  avatarImage: {
    width: Math.max(32, screenWidth * 0.08),
    height: Math.max(32, screenWidth * 0.08),
    borderRadius: Math.max(16, screenWidth * 0.04),
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: Math.max(12, screenWidth * 0.03),
    paddingVertical: Math.max(8, screenHeight * 0.01),
    marginBottom: Math.max(4, screenHeight * 0.005),
  },
  commentUsername: {
    fontSize: Math.max(12, screenWidth * 0.03),
    fontWeight: '600',
    color: '#0095f6',
    marginBottom: Math.max(2, screenHeight * 0.0025),
  },
  commentText: {
    fontSize: Math.max(14, screenWidth * 0.035),
    color: '#000',
    lineHeight: Math.max(18, screenWidth * 0.045),
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(12, screenWidth * 0.03),
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
  },
  commentLikes: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
  },
  replyButton: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
  },
  deleteButton: {
    fontSize: 12,
    color: '#ed4956',
  },
  likeButton: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  inputAvatar: {
    marginRight: Math.max(12, screenWidth * 0.03),
    marginBottom: Math.max(8, screenHeight * 0.01),
  },
  textInput: {
    flex: 1,
    maxHeight: Math.max(80, screenHeight * 0.12),
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    fontSize: Math.max(14, screenWidth * 0.035),
    marginRight: Math.max(12, screenWidth * 0.03),
    minHeight: 40, // Ensure minimum touch target
  },
  postButton: {
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
    minHeight: 44, // Ensure minimum touch target
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#0095f6',
    fontSize: 14,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: '#999',
  },
});
