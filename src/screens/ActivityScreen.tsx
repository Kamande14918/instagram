import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Notification, User } from '../types/database';
import { supabase } from '../services/supabase';

interface ActivityItem extends Notification {
  user?: User;
  content?: string; // Add content property for comment/mention notifications
}

export const ActivityScreen: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'following' | 'you'>('you');

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, activeTab]);

  const loadActivities = async () => {
    try {
      if (!user) return;

      // First, get notifications for the current user
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeTab === 'you') {
        // Try both possible column names for receiving notifications
        query = query.or(`recipient_id.eq.${user.id},user_id.eq.${user.id}`);
      } else {
        // For 'following' tab, we'd need to get notifications from users we follow
        // This is a simplified version
        query = query.or(`recipient_id.eq.${user.id},user_id.eq.${user.id}`);
      }

      const { data: notifications, error: notificationsError } = await query;

      if (notificationsError) {
        console.error('Notifications query error:', notificationsError);
        throw notificationsError;
      }

      if (!notifications || notifications.length === 0) {
        setActivities([]);
        return;
      }

      // Get unique user IDs from notifications (the user who performed the action)
      const userIds = [...new Set(
        notifications.map(n => n.user_id || n.actor_id || n.from_user_id).filter(Boolean)
      )];
      
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, avatar_url, full_name')
          .in('id', userIds);

        if (usersError) {
          console.warn('Error loading users:', usersError);
        } else {
          usersData = users || [];
        }
      }

      // Create a map of users by their ID for quick lookup
      const usersMap = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Combine notifications with user data
      const activitiesWithUsers = notifications.map(notification => {
        const actorUserId = notification.user_id || notification.actor_id || notification.from_user_id;
        return {
          ...notification,
          user: usersMap[actorUserId] || {
            id: actorUserId,
            username: 'Unknown User',
            avatar_url: null,
            full_name: 'Unknown User'
          },
        };
      });

      setActivities(activitiesWithUsers);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Don't show alert for empty results, just log
      if (error?.code !== 'PGRST116') {
        Alert.alert('Error', 'Failed to load activities');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleActivityPress = (activity: ActivityItem) => {
    // Handle different types of activities
    switch (activity.type) {
      case 'like':
        Alert.alert('Like', 'Navigate to post');
        break;
      case 'comment':
        Alert.alert('Comment', 'Navigate to post comments');
        break;
      case 'follow':
        Alert.alert('Follow', `Navigate to ${activity.user?.username}'s profile`);
        break;
      case 'mention':
        Alert.alert('Mention', 'Navigate to post');
        break;
      default:
        break;
    }
  };

  const handleFollowBack = async (userId: string) => {
    try {
      if (!user || !userId) return;

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'You are now following this user');
      loadActivities(); // Refresh to update button states
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={20} color="#ed4956" />;
      case 'comment':
        return <Ionicons name="chatbubble-outline" size={20} color="#666" />;
      case 'follow':
        return <Ionicons name="person-add" size={20} color="#0095f6" />;
      case 'mention':
        return <Ionicons name="at" size={20} color="#666" />;
      default:
        return <Ionicons name="notifications-outline" size={20} color="#666" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const username = activity.user?.username || 'Unknown User';
    const timeAgo = getTimeAgo(activity.created_at);

    switch (activity.type) {
      case 'like':
        return `${username} liked your photo. ${timeAgo}`;
      case 'comment':
        return `${username} commented: "${activity.content || ''}" ${timeAgo}`;
      case 'follow':
        return `${username} started following you. ${timeAgo}`;
      case 'mention':
        return `${username} mentioned you in a comment. ${timeAgo}`;
      default:
        return `${username} ${activity.content || 'interacted with your content'}. ${timeAgo}`;
    }
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

  const renderActivityItem = (activity: ActivityItem) => {
    const isFollowActivity = activity.type === 'follow';
    
    return (
      <TouchableOpacity
        key={activity.id}
        style={styles.activityItem}
        onPress={() => handleActivityPress(activity)}
      >
        <View style={styles.activityContent}>
          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            {activity.user?.avatar_url ? (
              <Image source={{ uri: activity.user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
            <View style={styles.activityIcon}>
              {getActivityIcon(activity.type)}
            </View>
          </View>

          {/* Activity Text */}
          <View style={styles.activityTextContainer}>
            <Text style={styles.activityText}>
              {getActivityText(activity)}
            </Text>
          </View>

          {/* Action Button or Post Thumbnail */}
          <View style={styles.activityAction}>
            {isFollowActivity ? (
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => handleFollowBack(activity.user_id || activity.actor_id || activity.from_user_id)}
              >
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            ) : (
              activity.post_id && (
                <View style={styles.postThumbnail}>
                  <Ionicons name="image-outline" size={24} color="#999" />
                </View>
              )
            )}
          </View>
        </View>

        {!activity.is_read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  const renderSuggestedUsers = () => (
    <View style={styles.suggestionsSection}>
      <Text style={styles.sectionTitle}>Suggested for you</Text>
      
      {/* Mock suggested users */}
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.suggestionItem}>
          <View style={styles.suggestionAvatar}>
            <Ionicons name="person" size={20} color="#999" />
          </View>
          <View style={styles.suggestionInfo}>
            <Text style={styles.suggestionUsername}>suggested_user_{item}</Text>
            <Text style={styles.suggestionText}>Suggested for you</Text>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>
      ))}
      
      <TouchableOpacity style={styles.seeAllButton}>
        <Text style={styles.seeAllText}>See All Suggestions</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && activities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'you' && styles.activeTab]}
          onPress={() => setActiveTab('you')}
        >
          <Text style={[styles.tabText, activeTab === 'you' && styles.activeTabText]}>
            You
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'following' ? (
          <>
            {renderSuggestedUsers()}
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={60} color="#999" />
              <Text style={styles.emptyStateTitle}>No Recent Activity</Text>
              <Text style={styles.emptyStateText}>
                When people you follow share photos and videos, you'll see them here.
              </Text>
            </View>
          </>
        ) : (
          <>
            {activities.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={60} color="#999" />
                <Text style={styles.emptyStateTitle}>Activity On Your Posts</Text>
                <Text style={styles.emptyStateText}>
                  When someone likes or comments on one of your posts, you'll see it here.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.recentSection}>
                  <Text style={styles.sectionTitle}>This Week</Text>
                  {activities
                    .filter(activity => {
                      const activityDate = new Date(activity.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return activityDate >= weekAgo;
                    })
                    .map(renderActivityItem)}
                </View>

                <View style={styles.olderSection}>
                  <Text style={styles.sectionTitle}>Earlier</Text>
                  {activities
                    .filter(activity => {
                      const activityDate = new Date(activity.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return activityDate < weekAgo;
                    })
                    .map(renderActivityItem)}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
  },
  content: {
    flex: 1,
  },
  activityItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  placeholderAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  activityTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  activityText: {
    fontSize: 14,
    lineHeight: 18,
  },
  activityAction: {
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postThumbnail: {
    width: 44,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 8,
    top: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0095f6',
    transform: [{ translateY: -2 }],
  },
  suggestionsSection: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionText: {
    fontSize: 12,
    color: '#666',
  },
  seeAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  seeAllText: {
    color: '#0095f6',
    fontSize: 14,
    fontWeight: '600',
  },
  recentSection: {
    paddingVertical: 16,
  },
  olderSection: {
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
