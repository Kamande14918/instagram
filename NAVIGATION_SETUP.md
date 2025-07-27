# 🧭 Navigation Setup for Comments and Share Features

## 📋 **Required Navigation Configuration**

To complete the implementation, you need to add the new screens to your navigation stack.

### 1. **Install Navigation Dependencies** (if not already installed)

```bash
npm install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
```

### 2. **Update Navigation Types**

Create or update `src/types/navigation.ts`:

```typescript
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Search: undefined;
  Activity: undefined;
  CreatePost: undefined;
  Comments: {
    postId: string;
    postCaption?: string;
    postUsername?: string;
  };
  UserProfile: {
    userId: string;
    username?: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### 3. **Update Main Navigator**

Update your main navigation file (e.g., `src/navigation/AppNavigator.tsx`):

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your screens
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CommentsScreen } from '../screens/CommentsScreen';

import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Search') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === 'CreatePost') {
          iconName = focused ? 'add-circle' : 'add-circle-outline';
        } else if (route.name === 'Activity') {
          iconName = focused ? 'heart' : 'heart-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: 'gray',
      tabBarShowLabel: false,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="CreatePost" component={CreatePostScreen} />
    <Tab.Screen name="Activity" component={ActivityScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main Stack Navigator
export const AppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="MainTabs" component={TabNavigator} />
    <Stack.Screen 
      name="Comments" 
      component={CommentsScreen}
      options={{
        headerShown: true,
        presentation: 'modal',
      }}
    />
  </Stack.Navigator>
);
```

### 4. **Update HomeScreen Navigation**

Now update the HomeScreen to properly navigate to comments:

```typescript
// In HomeScreen.tsx, replace the handleCommentPress function:

const handleCommentPress = (post: PostWithUser) => {
  navigation.navigate('Comments', {
    postId: post.id,
    postCaption: post.caption,
    postUsername: post.users.username,
  });
};

// And update the handleViewComments function:
const handleViewComments = (postId: string) => {
  navigation.navigate('Comments', {
    postId,
  });
};
```

### 5. **Add Navigation Hook Type**

Update your navigation imports in screens:

```typescript
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Then in your component:
const navigation = useNavigation<NavigationProp>();
```

## 🎯 **Quick Implementation Steps**

1. **Create the navigation types file**
2. **Update your main navigator to include CommentsScreen**
3. **Update HomeScreen navigation calls**
4. **Test the navigation flow**

## 🧪 **Testing Navigation**

After setup, test these flows:
- ✅ Tap comment button → Opens CommentsScreen
- ✅ Tap "View all X comments" → Opens CommentsScreen
- ✅ Tap "Add a comment" → Opens CommentsScreen
- ✅ Back button works from CommentsScreen
- ✅ Share functionality works independently

## 🚨 **Troubleshooting**

If you encounter navigation errors:

1. **Check imports**: Ensure all screens are properly imported
2. **Verify types**: Make sure navigation types match your structure
3. **Stack order**: Ensure CommentsScreen is in the correct navigator
4. **Parameters**: Verify parameter types match navigation calls

This setup will complete the integration of the comments system with your existing navigation structure.
