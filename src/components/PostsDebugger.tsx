import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export const PostsDebugger: React.FC = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDirectQuery = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing direct Supabase query...');
      
      // Test 1: Basic connection
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Auth test:', { authData: authData?.user?.id, authError });

      // Test 2: Count posts
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      console.log('Posts count test:', { count, countError });

      // Test 3: Simple select
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, caption, created_at, user_id')
        .limit(5);
      console.log('Simple posts query:', { postsData, postsError });

      // Test 4: With user join
      const { data: postsWithUsers, error: joinError } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          created_at,
          user_id,
          users:user_id (
            id,
            username,
            full_name
          )
        `)
        .limit(5);
      console.log('Posts with users query:', { postsWithUsers, joinError });

      // Test 5: Original query format
      const { data: originalFormat, error: originalError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      console.log('Original format query:', { originalFormat, originalError });

      setDebugInfo({
        authTest: { user: authData?.user?.id, error: authError?.message },
        countTest: { count, error: countError?.message },
        simpleQuery: { 
          count: postsData?.length, 
          error: postsError?.message,
          posts: postsData
        },
        joinQuery: { 
          count: postsWithUsers?.length, 
          error: joinError?.message,
          posts: postsWithUsers
        },
        originalQuery: { 
          count: originalFormat?.length, 
          error: originalError?.message,
          posts: originalFormat
        }
      });
    } catch (error) {
      console.error('Debug test error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posts Debugger</Text>
      <Text style={styles.info}>Current User ID: {user?.id || 'Not authenticated'}</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testDirectQuery}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Run Debug Tests'}
        </Text>
      </TouchableOpacity>

      {debugInfo && (
        <ScrollView style={styles.debugOutput}>
          <Text style={styles.debugText}>
            {JSON.stringify(debugInfo, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  debugOutput: {
    maxHeight: 400,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
