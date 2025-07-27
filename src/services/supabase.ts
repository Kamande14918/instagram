import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

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
    .single();
  
  if (error) throw error;
  return data;
};

export const checkUsernameAvailability = async (username: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username.toLowerCase())
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return !data; // Returns true if username is available
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
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
