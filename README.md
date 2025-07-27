# Instagram Clone - React Native + Supabase

A comprehensive Instagram clone built with React Native, Expo, and Supabase backend. This app implements a complete authentication system and database schema ready for all Instagram features.

## 🚀 Features Implemented

### ✅ Authentication System
- **Email/Password Registration & Login**
- **User Profile Creation** with username validation  
- **Secure Authentication** with Supabase Auth
- **Session Management** with persistent login
- **Password Reset** functionality
- **Social Login** UI (Google, Facebook - ready for OAuth setup)

### ✅ Database Schema
- **Users Table** - Complete user profiles with followers/following counts
- **Posts Table** - Media posts with support for multiple media types
- **Stories Table** - Temporary content with expiration
- **Comments & Likes** - Full interaction system
- **Follows Table** - User relationship management
- **Messages & Conversations** - Direct messaging system
- **Notifications** - Push notification system
- **Story Views** - Story view tracking

### ✅ App Architecture
- **Context-based State Management** for authentication
- **React Navigation** setup with auth flow
- **TypeScript Support** with comprehensive type definitions
- **Component-based Architecture**
- **Supabase Integration** with complete database schema

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Navigation**: React Navigation v6
- **State Management**: React Context + useReducer
- **Authentication**: Supabase Auth with RLS policies
- **Database**: PostgreSQL with Row Level Security
- **Storage**: Supabase Storage (avatars, posts, stories, messages)
- **Styling**: StyleSheet with Linear Gradients
- **Media**: Expo Image Picker, Camera, Media Library

## 📱 App Structure

### Database Schema
The app uses a comprehensive database schema with these main tables:
- `users` - User profiles and metadata (followers_count, posts_count, etc.)
- `posts` - Photo/video posts with media_urls and media_types arrays
- `stories` - Temporary content with expiration dates
- `comments` - Post comments with likes_count
- `likes` - Like system for both posts and comments
- `follows` - User relationships with unique constraints
- `conversations` & `messages` - Complete messaging system
- `notifications` - Push notification management
- `story_views` - Story view tracking

### Authentication Flow
1. **Sign Up**: Email, password, full name, and unique username
2. **Profile Creation**: Automatic user profile creation in database
3. **Login**: Secure session management with AsyncStorage
4. **Session Persistence**: Automatic login on app restart
5. **Profile Updates**: Ready for avatar uploads and bio updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Instagram

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli
```

### 2. Supabase Setup

1. **Create a Supabase Project**
   - Go to [Supabase](https://app.supabase.com)
   - Create a new project
   - Copy your project URL and anon key

2. **Configure Environment Variables**
   ```bash
   # Update .env file with your Supabase credentials
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Set Up Database**
   - Follow the detailed instructions in `SUPABASE_SETUP.md`
   - Run the SQL scripts to create tables and policies
   - Set up storage buckets for media files

### 3. Run the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android

# Run in web browser
npm run web
```

### 4. Test Authentication

1. Open the app
2. Try creating a new account
3. Test login functionality
4. Verify profile creation in Supabase dashboard

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── navigation/         # Navigation setup
├── screens/           # App screens
│   ├── LoginScreen.tsx
│   ├── SignUpScreen.tsx
│   └── HomeScreen.tsx
├── services/          # API and external services
│   └── supabase.ts
├── types/             # TypeScript type definitions
│   └── database.ts
└── utils/             # Utility functions
```

## 🔜 Next Steps - Feature Implementation Roadmap

### Phase 1: Core Content Features
- [ ] **Photo Upload & Sharing**
  - Camera integration
  - Image picker
  - Image filters and editing
  - Post creation with captions

### Phase 2: Social Features
- [ ] **Follow System**
  - Follow/unfollow users
  - Follower/following lists
  - Following activity feed

- [ ] **Engagement Features**
  - Like posts
  - Comment system with threading
  - Share posts
  - Save posts

### Phase 3: Advanced Content
- [ ] **Stories Implementation**
  - 24-hour temporary content
  - Story creation with stickers
  - Story viewing with progress bars
  - Story highlights

### Phase 4: Messaging
- [ ] **Direct Messages**
  - One-on-one messaging
  - Group conversations
  - Media sharing in messages
  - Message reactions

### Phase 5: Discovery
- [ ] **Explore Page**
  - Content discovery algorithm
  - Search functionality
  - Trending hashtags
  - Location-based content

### Phase 6: Advanced Features
- [ ] **Reels (Short Videos)**
- [ ] **Live Streaming**
- [ ] **Shopping Integration**
- [ ] **Business Profiles**
- [ ] **Analytics Dashboard**

## 🗄️ Database Schema

The app uses a comprehensive PostgreSQL schema with the following main tables:

- **profiles**: User profile information
- **posts**: Photo/video posts with metadata
- **follows**: User relationship management
- **likes**: Post engagement tracking
- **comments**: Threaded comment system

See `SUPABASE_SETUP.md` for complete schema details.

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **Authentication required** for all user actions
- **Input validation** on frontend and database level
- **Secure file uploads** with proper permissions
- **Privacy controls** for user profiles

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Instagram for design inspiration
- Supabase for the amazing backend platform
- React Native and Expo teams for the development framework
- Open source community for various packages used

## 📞 Support

If you encounter any issues or have questions:

1. Check the `SUPABASE_SETUP.md` for backend setup
2. Review the error messages in the console
3. Ensure all environment variables are properly set
4. Verify Supabase project configuration

---

**Ready to build the next social media app? Start with this solid foundation! 🚀**
