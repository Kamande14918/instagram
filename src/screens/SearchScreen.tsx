import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, Post } from '../types/database';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 3) / 3;

interface SearchResult {
  users: User[];
  posts: Post[];
}

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ users: [], posts: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'accounts' | 'tags' | 'places'>('top');

  useEffect(() => {
    loadTrending();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults({ users: [], posts: [] });
    }
  }, [searchQuery]);

  const loadTrending = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(username, avatar_url)
        `)
        .order('likes_count', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTrending(data || []);
    } catch (error) {
      console.error('Error loading trending posts:', error);
    }
  };

  const loadRecentSearches = async () => {
    // In a real app, this would be stored in AsyncStorage
    setRecentSearches(['travel', 'photography', 'food', 'fitness']);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      // Search users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (usersError) throw usersError;

      // Search posts by caption
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(username, avatar_url)
        `)
        .ilike('caption', `%${query}%`)
        .limit(30);

      if (postsError) throw postsError;

      setSearchResults({
        users: users || [],
        posts: posts || [],
      });

      // Add to recent searches
      addToRecentSearches(query);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToRecentSearches = (query: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, 10);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleUserPress = (user: User) => {
    Alert.alert('User Profile', `Navigate to ${user.username}'s profile`);
  };

  const handlePostPress = (post: Post) => {
    Alert.alert('Post', 'Navigate to post detail');
  };

  const renderUserResult = (user: User) => (
    <TouchableOpacity
      key={user.id}
      style={styles.userResult}
      onPress={() => handleUserPress(user)}
    >
      <View style={styles.userAvatar}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarImage, styles.placeholderAvatar]}>
            <Ionicons name="person" size={20} color="#999" />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.fullName}>{user.full_name}</Text>
        {user.is_verified && (
          <Ionicons name="checkmark-circle" size={16} color="#0095f6" style={styles.verifiedIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPostGrid = (posts: Post[]) => (
    <View style={styles.postsGrid}>
      {posts.map((post, index) => {
        const imageUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null;
        
        return (
          <TouchableOpacity
            key={post.id}
            style={styles.postItem}
            onPress={() => handlePostPress(post)}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.postImage} />
            ) : (
              <View style={[styles.postImage, styles.placeholderPost]}>
                <Ionicons name="image-outline" size={30} color="#999" />
              </View>
            )}
            {post.media_types && post.media_types.includes('video') && (
              <View style={styles.videoIndicator}>
                <Ionicons name="play" size={12} color="white" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderRecentSearch = (search: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recentSearchItem}
      onPress={() => setSearchQuery(search)}
    >
      <Ionicons name="time-outline" size={20} color="#666" />
      <Text style={styles.recentSearchText}>{search}</Text>
      <TouchableOpacity
        onPress={() => setRecentSearches(prev => prev.filter(item => item !== search))}
      >
        <Ionicons name="close" size={16} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor="#999"
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {loading && <ActivityIndicator size="small" color="#999" />}
        </View>
      </View>

      {searchQuery.trim() ? (
        <>
          {/* Search Tabs */}
          <View style={styles.searchTabs}>
            {[
              { key: 'top', label: 'Top' },
              { key: 'accounts', label: 'Accounts' },
              { key: 'tags', label: 'Tags' },
              { key: 'places', label: 'Places' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.searchTab, activeTab === tab.key && styles.activeSearchTab]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[styles.searchTabText, activeTab === tab.key && styles.activeSearchTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Results */}
          <ScrollView style={styles.searchResults}>
            {activeTab === 'top' && (
              <>
                {searchResults.users.length > 0 && (
                  <View style={styles.resultsSection}>
                    <Text style={styles.sectionTitle}>Accounts</Text>
                    {searchResults.users.slice(0, 3).map(renderUserResult)}
                    {searchResults.users.length > 3 && (
                      <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => setActiveTab('accounts')}
                      >
                        <Text style={styles.seeAllText}>See all accounts</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {searchResults.posts.length > 0 && (
                  <View style={styles.resultsSection}>
                    <Text style={styles.sectionTitle}>Posts</Text>
                    {renderPostGrid(searchResults.posts)}
                  </View>
                )}
              </>
            )}

            {activeTab === 'accounts' && (
              <View style={styles.resultsSection}>
                {searchResults.users.map(renderUserResult)}
              </View>
            )}

            {activeTab === 'tags' && (
              <View style={styles.resultsSection}>
                <Text style={styles.emptyStateText}>Tag search coming soon</Text>
              </View>
            )}

            {activeTab === 'places' && (
              <View style={styles.resultsSection}>
                <Text style={styles.emptyStateText}>Place search coming soon</Text>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView style={styles.discoverContent}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map(renderRecentSearch)}
            </View>
          )}

          {/* Trending */}
          <View style={styles.trendingSection}>
            <Text style={styles.sectionTitle}>Discover</Text>
            {renderPostGrid(trending)}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#000',
  },
  searchTabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  searchTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeSearchTab: {
    borderBottomColor: '#000',
  },
  searchTabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeSearchTabText: {
    color: '#000',
  },
  searchResults: {
    flex: 1,
  },
  discoverContent: {
    flex: 1,
  },
  resultsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  placeholderAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  fullName: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  seeAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeAllText: {
    color: '#0095f6',
    fontSize: 14,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
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
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSection: {
    paddingVertical: 10,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  clearAllText: {
    color: '#0095f6',
    fontSize: 14,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  trendingSection: {
    paddingVertical: 10,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    paddingVertical: 40,
  },
});
