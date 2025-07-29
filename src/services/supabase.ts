import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

// Debug environment variables
console.log('🔍 Environment Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EXPO_PUBLIC_SUPABASE_URL exists:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('EXPO_PUBLIC_SUPABASE_URL value:', process.env.EXPO_PUBLIC_SUPABASE_URL);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is missing');
  throw new Error(`
🚨 SUPABASE URL MISSING 🚨

The EXPO_PUBLIC_SUPABASE_URL environment variable is not set.

Current value: ${supabaseUrl}

Please check your .env file and ensure it contains:
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

Make sure:
1. The .env file is in the root directory
2. There are no spaces around the = sign
3. The app has been restarted after .env changes
  `);
}

if (!supabaseAnonKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is missing');
  throw new Error(`
🚨 SUPABASE ANON KEY MISSING 🚨

The EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is not set.

Current value: ${supabaseAnonKey}

Please check your .env file and ensure it contains:
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

Make sure:
1. The .env file is in the root directory
2. There are no spaces around the = sign
3. The app has been restarted after .env changes
  `);
}

// Validate URL format
try {
  new URL(supabaseUrl);
  console.log('✅ Supabase URL format is valid');
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error(`
🚨 INVALID SUPABASE URL FORMAT 🚨

The Supabase URL format is invalid: ${supabaseUrl}

Expected format: https://your-project-id.supabase.co

Please check your .env file and correct the URL.
  `);
}

console.log('✅ Environment variables validated successfully');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database helper functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  
  // If no profile exists, create a basic one
  if (!data) {
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser?.user) {
      const newProfile = {
        id: userId,
        email: authUser.user.email,
        username: authUser.user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
        full_name: authUser.user.user_metadata?.full_name || 'User',
        bio: '',
        avatar_url: null,
        website: null,
        is_private: false,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.warn('Could not create user profile:', createError);
          // Return the basic profile even if insert fails due to RLS
          return newProfile;
        }

        return createdProfile;
      } catch (insertError) {
        console.warn('Insert failed, returning basic profile:', insertError);
        return newProfile;
      }
    }
  }
  
  return data;
};

export const checkUsernameAvailability = async (username: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') throw error;
  return !data; // Returns true if username is available
};

export const updateUserProfile = async (userId: string, updates: any) => {
  // First try to update
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) {
    // If update fails because user doesn't exist, try to create profile first
    if (error.code === 'PGRST116') {
      try {
        const profile = await getUserProfile(userId);
        if (profile) {
          // Retry the update
          const { data: updatedData, error: retryError } = await supabase
            .from('users')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();
          
          if (retryError) throw retryError;
          return updatedData;
        }
      } catch (createError) {
        console.warn('Could not create profile for update:', createError);
      }
    }
    throw error;
  }
  
  return data;
};

export const uploadAvatar = async (userId: string, file: any) => {
  const fileExt = file.uri.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Post-related functions
export const createPost = async (post: Database['public']['Tables']['posts']['Insert']) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getPosts = async (userId?: string) => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      users (
        username,
        full_name,
        avatar_url,
        is_verified
      )
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Social Authentication functions (for future implementation)
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signInWithFacebook = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
};

// Follow-related functions
export const followUser = async (followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: (await supabase.auth.getUser()).data.user?.id!,
      following_id: followingId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const unfollowUser = async (followingId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', (await supabase.auth.getUser()).data.user?.id!)
    .eq('following_id', followingId);
  
  if (error) throw error;
};

export const checkIfFollowing = async (followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', (await supabase.auth.getUser()).data.user?.id!)
    .eq('following_id', followingId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

// Like-related functions
export const likePost = async (postId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id!,
      post_id: postId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const unlikePost = async (postId: string) => {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id!)
    .eq('post_id', postId);
  
  if (error) throw error;
};

// Comment-related functions
export const createComment = async (comment: Database['public']['Tables']['comments']['Insert']) => {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select(`
      *,
      users (
        username,
        full_name,
        avatar_url,
        is_verified
      )
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const getPostComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      users (
        username,
        full_name,
        avatar_url,
        is_verified
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
};
