import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VideoView } from 'expo-video';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
}

export const CreatePostScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'edit' | 'share'>('select');

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (libraryStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to create posts.'
      );
    }
  };

  const handleSelectMedia = () => {
    Alert.alert(
      'Select Media',
      'Choose media source',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaItem: MediaItem = {
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
      };
      setSelectedMedia([mediaItem]);
      setCurrentStep('edit');
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      const mediaItems: MediaItem[] = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
      }));
      setSelectedMedia(mediaItems);
      setCurrentStep('edit');
    }
  };

  const uploadMedia = async (mediaItem: MediaItem): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(mediaItem.uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    
    const fileExt = mediaItem.uri.split('.').pop() || (mediaItem.type === 'video' ? 'mp4' : 'jpg');
    const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, arrayBuffer, {
        contentType: mediaItem.type === 'video' ? `video/${fileExt}` : `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        throw new Error('Storage bucket not configured. Please contact support.');
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleShare = async () => {
    if (!user || selectedMedia.length === 0) return;

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption to your post');
      return;
    }

    setUploading(true);

    try {
      // Upload all media files
      const uploadPromises = selectedMedia.map(media => uploadMedia(media));
      const mediaUrls = await Promise.all(uploadPromises);
      
      const mediaTypes = selectedMedia.map(media => media.type);

      // Create post in database
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim(),
          media_urls: mediaUrls,
          media_types: mediaTypes,
          location: location.trim() || null,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Post shared successfully!', [
        { text: 'OK', onPress: () => {
          // Reset form
          setSelectedMedia([]);
          setCaption('');
          setLocation('');
          setCurrentStep('select');
          // Navigate to profile or home
          navigation.navigate('Home' as never);
        }}
      ]);
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    setSelectedMedia(newMedia);
    if (newMedia.length === 0) {
      setCurrentStep('select');
    }
  };

  const renderMediaPreview = (media: MediaItem, index: number) => {
    return (
      <View key={index} style={styles.mediaPreview}>
        {media.type === 'image' ? (
          <Image source={{ uri: media.uri }} style={styles.previewImage} />
        ) : (
          <VideoView
            player={null}
            style={styles.previewImage}
            contentFit="cover"
            allowsExternalPlayback={false}
            allowsPictureInPicture={false}
          />
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeMedia(index)}
        >
          <Ionicons name="close-circle" size={24} color="#fff" />
        </TouchableOpacity>
        {media.type === 'video' && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  if (currentStep === 'select') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.selectContainer}>
          <Ionicons name="camera-outline" size={80} color="#999" />
          <Text style={styles.selectTitle}>Share a Photo or Video</Text>
          <Text style={styles.selectDescription}>
            Choose from your gallery or take a new photo/video
          </Text>
          
          <TouchableOpacity style={styles.selectButton} onPress={handleSelectMedia}>
            <Text style={styles.selectButtonText}>Select Media</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (currentStep === 'edit') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentStep('select')}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit</Text>
          <TouchableOpacity onPress={() => setCurrentStep('share')}>
            <Text style={styles.nextButton}>Next</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {selectedMedia.map((media, index) => renderMediaPreview(media, index))}
        </ScrollView>

        <View style={styles.editOptions}>
          <TouchableOpacity style={styles.editOption}>
            <Ionicons name="color-filter-outline" size={24} color="#000" />
            <Text style={styles.editOptionText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editOption}>
            <Ionicons name="crop-outline" size={24} color="#000" />
            <Text style={styles.editOptionText}>Adjust</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editOption}>
            <Ionicons name="text-outline" size={24} color="#000" />
            <Text style={styles.editOptionText}>Text</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('edit')}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share</Text>
        <TouchableOpacity
          onPress={handleShare}
          disabled={uploading || !caption.trim()}
          style={[styles.shareButton, (!caption.trim() || uploading) && styles.shareButtonDisabled]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#0095f6" />
          ) : (
            <Text style={[styles.shareButtonText, (!caption.trim() || uploading) && styles.shareButtonTextDisabled]}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.shareContainer}>
        {/* Media Preview */}
        <View style={styles.mediaContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((media, index) => (
              <View key={index} style={styles.shareMediaItem}>
                {media.type === 'image' ? (
                  <Image source={{ uri: media.uri }} style={styles.shareMediaImage} />
                ) : (
                  <VideoView
                    player={null}
                    style={styles.shareMediaImage}
                    contentFit="cover"
                    allowsExternalPlayback={false}
                    allowsPictureInPicture={false}
                  />
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            multiline
            maxLength={2200}
            textAlignVertical="top"
          />
          <Text style={styles.captionCounter}>{caption.length}/2200</Text>
        </View>

        {/* Location Input */}
        <TouchableOpacity style={styles.locationContainer}>
          <Ionicons name="location-outline" size={24} color="#666" />
          <TextInput
            style={styles.locationInput}
            value={location}
            onChangeText={setLocation}
            placeholder="Add location"
            maxLength={100}
          />
        </TouchableOpacity>

        {/* Share Options */}
        <View style={styles.shareOptions}>
          <TouchableOpacity style={styles.shareOption}>
            <Text style={styles.shareOptionLabel}>Tag People</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareOption}>
            <Text style={styles.shareOptionLabel}>Add to Story</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareOption}>
            <Text style={styles.shareOptionLabel}>Advanced Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButton: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButtonTextDisabled: {
    color: '#999',
  },
  selectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  selectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  selectDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  selectButton: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaPreview: {
    width: width,
    height: width * 1.25,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  editOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
  },
  editOption: {
    alignItems: 'center',
  },
  editOptionText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  shareContainer: {
    flex: 1,
  },
  mediaContainer: {
    height: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  shareMediaItem: {
    width: 100,
    height: 100,
    marginRight: 1,
  },
  shareMediaImage: {
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  captionInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  captionCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  shareOptions: {
    paddingHorizontal: 16,
  },
  shareOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  shareOptionLabel: {
    fontSize: 16,
  },
});
