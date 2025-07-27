import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { User } from '../types/database';
import { supabase } from '../services/supabase';

export const EditProfileScreen: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Partial<User>>({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    avatar_url: '',
  });

  useEffect(() => {
    loadProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Sorry, we need camera roll permissions to change your profile picture.'
      );
    }
  };

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
        setProfile({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          website: data.website || '',
          avatar_url: data.avatar_url || '',
        });
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
        
        setProfile({
          full_name: newProfile.full_name || '',
          username: newProfile.username || '',
          bio: newProfile.bio || '',
          website: newProfile.website || '',
          avatar_url: newProfile.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!profile.username?.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (!profile.full_name?.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name.trim(),
          username: profile.username.trim(),
          bio: profile.bio?.trim() || null,
          website: profile.website?.trim() || null,
          avatar_url: profile.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update the auth context
      await updateProfile();

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.code === '23505') {
        Alert.alert('Error', 'Username is already taken');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    setUploading(true);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setProfile(prev => ({ ...prev, avatar_url: '' }))
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Picture Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.changePhotoButton} 
          onPress={handleImagePicker}
          disabled={uploading}
        >
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </TouchableOpacity>
        
        {profile.avatar_url && (
          <TouchableOpacity 
            style={styles.removePhotoButton} 
            onPress={handleRemovePhoto}
          >
            <Text style={styles.removePhotoText}>Remove Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={profile.full_name}
            onChangeText={(text) => setProfile(prev => ({ ...prev, full_name: text }))}
            placeholder="Enter your full name"
            maxLength={50}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={profile.username}
            onChangeText={(text) => setProfile(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9._]/g, '') }))}
            placeholder="Enter username"
            autoCapitalize="none"
            maxLength={30}
          />
          <Text style={styles.helperText}>
            Username can only contain letters, numbers, periods, and underscores
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio}
            onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            maxLength={150}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {profile.bio?.length || 0}/150
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={profile.website}
            onChangeText={(text) => setProfile(prev => ({ ...prev, website: text }))}
            placeholder="https://yourwebsite.com"
            autoCapitalize="none"
            keyboardType="url"
            maxLength={100}
          />
        </View>
      </View>

      {/* Privacy Settings */}
      <View style={styles.privacySection}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>
        
        <TouchableOpacity style={styles.privacyOption}>
          <View style={styles.privacyOptionContent}>
            <Ionicons name="lock-closed-outline" size={24} color="#666" />
            <View style={styles.privacyOptionText}>
              <Text style={styles.privacyOptionTitle}>Private Account</Text>
              <Text style={styles.privacyOptionDescription}>
                Only followers can see your posts
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.privacyOption}>
          <View style={styles.privacyOptionContent}>
            <Ionicons name="eye-outline" size={24} color="#666" />
            <View style={styles.privacyOptionText}>
              <Text style={styles.privacyOptionTitle}>Story Settings</Text>
              <Text style={styles.privacyOptionDescription}>
                Control who can see your stories
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Professional Account */}
      <View style={styles.professionalSection}>
        <TouchableOpacity style={styles.professionalOption}>
          <View style={styles.professionalContent}>
            <Ionicons name="briefcase-outline" size={24} color="#0095f6" />
            <View style={styles.professionalText}>
              <Text style={styles.professionalTitle}>Switch to Professional Account</Text>
              <Text style={styles.professionalDescription}>
                Get tools to help you grow your business
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    marginBottom: 8,
  },
  changePhotoText: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  removePhotoButton: {
    marginTop: 4,
  },
  removePhotoText: {
    color: '#ed4956',
    fontSize: 14,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  privacySection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  professionalSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
  },
  professionalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  professionalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  professionalText: {
    marginLeft: 16,
    flex: 1,
  },
  professionalTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  professionalDescription: {
    fontSize: 14,
    color: '#666',
  },
  saveSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
  },
  saveButton: {
    backgroundColor: '#0095f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#b3d9ff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
