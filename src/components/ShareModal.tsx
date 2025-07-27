import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shareService, ShareOptions } from '../services/share';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  shareOptions: ShareOptions;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  shareOptions,
}) => {
  const handleShareOption = async (option: string) => {
    switch (option) {
      case 'share':
        await shareService.sharePost(shareOptions);
        break;
      case 'copy':
        await shareService.copyPostLink(shareOptions.postId);
        break;
      case 'instagram':
        await shareService.shareToInstagramStories(shareOptions.imageUrl || '');
        break;
      case 'save':
        await shareService.savePost(shareOptions.postId, 'current-user-id'); // You'd pass the actual user ID
        break;
      default:
        break;
    }
    onClose();
  };

  const shareOptionsList = [
    {
      id: 'share',
      title: 'Share via...',
      icon: 'share-outline',
      description: 'Share to other apps',
    },
    {
      id: 'copy',
      title: 'Copy Link',
      icon: 'copy-outline',
      description: 'Copy post link to clipboard',
    },
    {
      id: 'instagram',
      title: 'Share to Story',
      icon: 'camera-outline',
      description: 'Add to Instagram Story',
    },
    {
      id: 'save',
      title: 'Save Post',
      icon: 'bookmark-outline',
      description: 'Save to your bookmarks',
    },
    {
      id: 'report',
      title: 'Report',
      icon: 'flag-outline',
      description: 'Report this post',
      danger: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Share Post</Text>
          </View>

          {/* Post Preview */}
          <View style={styles.postPreview}>
            {shareOptions.imageUrl && (
              <Image 
                source={{ uri: shareOptions.imageUrl }} 
                style={styles.previewImage} 
              />
            )}
            <View style={styles.postInfo}>
              <Text style={styles.username}>@{shareOptions.username}</Text>
              <Text style={styles.caption} numberOfLines={2}>
                {shareOptions.caption}
              </Text>
            </View>
          </View>

          {/* Share Options */}
          <ScrollView style={styles.optionsList}>
            {shareOptionsList.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => handleShareOption(option.id)}
              >
                <View style={styles.optionIcon}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={option.danger ? '#ed4956' : '#000'}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, option.danger && styles.dangerText]}>
                    {option.title}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  postPreview: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  caption: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  dangerText: {
    color: '#ed4956',
  },
  closeButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e1e1e1',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#0095f6',
    fontWeight: '500',
  },
});
