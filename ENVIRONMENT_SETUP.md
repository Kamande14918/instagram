# Environment Configuration Guide

## Overview
This guide helps you configure your Instagram Clone app environment for development and production deployment.

## Environment Variables Setup

### 1. Create Environment File
Create a `.env` file in your project root:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
EXPO_PUBLIC_APP_NAME=Instagram Clone
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=development

# Social Login (Optional)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id

# Push Notifications (Optional)
EXPO_PUBLIC_PUSH_NOTIFICATION_KEY=your_expo_push_token

# Analytics (Optional)
EXPO_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### 2. Update app.config.js
Create or update your `app.config.js`:

```javascript
export default {
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME || "Instagram Clone",
    slug: "instagram-clone",
    version: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.instagramclone"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourcompany.instagramclone"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos to share them with your friends.",
          cameraPermission: "Allow $(PRODUCT_NAME) to use your camera to take photos to share with your friends."
        }
      ],
      "expo-secure-store",
      "expo-notifications"
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || "development"
    }
  }
};
```

## Supabase Configuration

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready
4. Get your project URL and anon key from Settings → API

### 2. Setup Database
1. Open Supabase SQL Editor
2. Copy and paste the entire `PRODUCTION_DATABASE_SETUP.sql` file
3. Click "Run" to execute all commands
4. Verify all tables are created in the Table Editor

### 3. Configure Storage
```sql
-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads', 'user-uploads', true);

-- Set up storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all files" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## Dependencies Installation

### Required Dependencies
```bash
# Core dependencies
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install expo-image-picker expo-media-library
npm install expo-clipboard expo-sharing
npm install expo-secure-store
npm install react-native-gesture-handler
npm install react-native-reanimated

# UI Components
npm install react-native-elements react-native-vector-icons
npm install @expo/vector-icons

# Additional utilities
npm install date-fns
npm install react-native-keyboard-aware-scroll-view
```

### Development Dependencies
```bash
npm install --save-dev @types/react @types/react-native
npm install --save-dev typescript
```

## Authentication Setup

### 1. Enable Auth Providers in Supabase
1. Go to Authentication → Settings in your Supabase dashboard
2. Configure your preferred providers:
   - Email/Password (enabled by default)
   - Google OAuth
   - Facebook OAuth
   - Apple OAuth (for iOS)

### 2. Configure Social Login URLs
Add these URLs to your OAuth provider settings:
- **Development**: `exp://localhost:19000/--/auth/callback`
- **Production**: `yourapp://auth/callback`

## Push Notifications Setup (Optional)

### 1. Configure Expo Push Notifications
```bash
# Install push notifications
expo install expo-notifications expo-device expo-constants
```

### 2. Update Notification Service
```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotifications = async () => {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }
  
  return token;
};
```

## Development vs Production

### Development Environment
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Clear cache if needed
npx expo start --clear
```

### Production Build
```bash
# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify your URL and anon key in `.env`
   - Check if your IP is whitelisted in Supabase
   - Ensure RLS policies are properly configured

2. **Navigation Issues**
   - Make sure React Navigation is properly installed
   - Check that all screens are registered in the navigator
   - Verify screen names match exactly

3. **Image Upload Issues**
   - Check storage bucket permissions
   - Verify expo-image-picker is installed
   - Ensure proper file upload permissions

4. **Authentication Issues**
   - Check OAuth provider configuration
   - Verify redirect URLs are correct
   - Ensure auth context is properly wrapped

### Performance Tips

1. **Image Optimization**
   - Use appropriate image sizes
   - Implement image caching
   - Consider using compressed formats

2. **Database Optimization**
   - Use proper indexes (included in setup script)
   - Implement pagination for large datasets
   - Use RLS policies for security

3. **State Management**
   - Minimize unnecessary re-renders
   - Use React.memo for expensive components
   - Implement proper loading states

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] Supabase RLS policies are enabled and tested
- [ ] File upload validation is implemented
- [ ] Input sanitization is in place
- [ ] HTTPS is enforced in production
- [ ] User sessions are handled securely
- [ ] API keys are properly secured

## Next Steps

1. Configure your environment variables
2. Run the database setup script in Supabase
3. Install all required dependencies
4. Test the authentication flow
5. Add your app-specific branding and assets
6. Test all features thoroughly
7. Deploy to app stores

Your Instagram Clone is now ready for development and deployment!
