import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { User, Post } from '../types/database';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 3) / 3;

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigation = useNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPosts();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setUserProfile(data);
      } else {
        // Create a basic profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.email?.split('@')[0] || 'User',
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const loadPosts = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadPosts()]);
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'Settings screen will be implemented in the next update',
      [{ text: 'OK' }]
    );
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost' as never);
  };

  const renderPost = (post: Post, index: number) => {
    const imageUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null;
    
    return (
      <TouchableOpacity
        key={post.id}
        style={styles.postItem}
        onPress={() => {
          // Navigate to post detail
          Alert.alert('Post', 'Post detail view will be implemented');
        }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.postImage} />
        ) : (
          <View style={[styles.postImage, styles.placeholderPost]}>
            <Ionicons name="image-outline" size={40} color="#999" />
          </View>
        )}
        {post.media_types && post.media_types.includes('video') && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!user || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.username}>{userProfile.username}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCreatePost}>
            <Ionicons name="add-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
            <Ionicons name="menu-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.profileImageContainer}>
          {userProfile.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Details */}
      <View style={styles.profileDetails}>
        <Text style={styles.displayName}>{userProfile.full_name || userProfile.username}</Text>
        {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
        {userProfile.website && (
          <Text style={styles.website}>{userProfile.website}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Story Highlights Placeholder */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.highlightsContainer}
      >
        <TouchableOpacity style={styles.newHighlight}>
          <View style={styles.highlightCircle}>
            <Ionicons name="add" size={24} color="#999" />
          </View>
          <Text style={styles.highlightText}>New</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Posts Grid */}
      <View style={styles.postsHeader}>
        <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
          <Ionicons name="grid-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="play-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="bookmark-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="person-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={80} color="#999" />
          <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
          <Text style={styles.emptyStateText}>
            When you share photos and videos, they'll appear on your profile.
          </Text>
          <TouchableOpacity style={styles.firstPostButton} onPress={handleCreatePost}>
            <Text style={styles.firstPostButtonText}>Share your first photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.postsGrid}>
          {posts.map((post, index) => renderPost(post, index))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileDetails: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  website: {
    fontSize: 14,
    color: '#003569',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginLeft: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlightsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  newHighlight: {
    alignItems: 'center',
    marginRight: 16,
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 12,
    color: '#666',
  },
  postsHeader: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
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
  firstPostButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 4,
  },
  firstPostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 0.5,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPost: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
