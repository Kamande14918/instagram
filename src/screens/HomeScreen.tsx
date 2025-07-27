import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const HomeScreen: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Instagram</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to Instagram Clone!</Text>
        
        {profile && (
          <View style={styles.profileInfo}>
            <Text style={styles.profileText}>Full Name: {profile.full_name}</Text>
            <Text style={styles.profileText}>Username: @{profile.username}</Text>
            <Text style={styles.profileText}>Email: {user?.email}</Text>
            {profile.bio && <Text style={styles.profileText}>Bio: {profile.bio}</Text>}
            <Text style={styles.profileText}>Followers: {profile.followers_count}</Text>
            <Text style={styles.profileText}>Following: {profile.following_count}</Text>
            <Text style={styles.profileText}>Posts: {profile.posts_count}</Text>
            <Text style={styles.profileText}>Verified: {profile.is_verified ? 'Yes' : 'No'}</Text>
            <Text style={styles.profileText}>Private: {profile.is_private ? 'Yes' : 'No'}</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Coming Soon:</Text>
          <Text style={styles.featureItem}>• Photo & Video Sharing</Text>
          <Text style={styles.featureItem}>• Stories</Text>
          <Text style={styles.featureItem}>• Direct Messaging</Text>
          <Text style={styles.featureItem}>• Explore Page</Text>
          <Text style={styles.featureItem}>• Reels</Text>
          <Text style={styles.featureItem}>• Live Streaming</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  profileInfo: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  featuresContainer: {
    backgroundColor: '#e8f4f8',
    padding: 20,
    borderRadius: 10,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
});
