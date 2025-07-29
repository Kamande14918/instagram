import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabase';

export const NetworkDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const results: any = {};

    try {
      console.log('🔧 Running network diagnostics...');

      // Test 1: Basic connection
      results.connection = 'Testing...';
      setTestResults({ ...results });

      const startTime = Date.now();
      
      // Test simple query first
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const connectionTime = Date.now() - startTime;
      
      if (testError) {
        results.connection = `❌ Failed: ${testError.message}`;
      } else {
        results.connection = `✅ Success (${connectionTime}ms)`;
      }

      // Test 2: Posts table access
      results.postsAccess = 'Testing...';
      setTestResults({ ...results });

      const postsStartTime = Date.now();
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, created_at')
        .limit(5);

      const postsTime = Date.now() - postsStartTime;

      if (postsError) {
        results.postsAccess = `❌ Failed: ${postsError.message}`;
      } else {
        results.postsAccess = `✅ Found ${postsData?.length || 0} posts (${postsTime}ms)`;
      }

      // Test 3: Complex join query (same as HomeScreen)
      results.joinQuery = 'Testing...';
      setTestResults({ ...results });

      const joinStartTime = Date.now();
      const { data: joinData, error: joinError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(*)
        `)
        .limit(3);

      const joinTime = Date.now() - joinStartTime;

      if (joinError) {
        results.joinQuery = `❌ Failed: ${joinError.message}`;
      } else {
        results.joinQuery = `✅ Success with ${joinData?.length || 0} posts (${joinTime}ms)`;
      }

      // Test 4: Auth status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        results.auth = `❌ Auth error: ${authError.message}`;
      } else {
        results.auth = user ? `✅ Authenticated: ${user.id.slice(0, 8)}...` : '❌ Not authenticated';
      }

      setTestResults(results);
      console.log('🔧 Diagnostics completed:', results);

    } catch (error: any) {
      console.error('🔧 Diagnostics failed:', error);
      results.error = `❌ Unexpected error: ${error.message}`;
      setTestResults(results);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Network Diagnostics</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={runDiagnostics}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Running Tests...' : 'Run Diagnostics'}
        </Text>
      </TouchableOpacity>

      {Object.keys(testResults).length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>Test Results:</Text>
          
          {testResults.connection && (
            <Text style={styles.result}>Connection: {testResults.connection}</Text>
          )}
          
          {testResults.auth && (
            <Text style={styles.result}>Authentication: {testResults.auth}</Text>
          )}
          
          {testResults.postsAccess && (
            <Text style={styles.result}>Posts Access: {testResults.postsAccess}</Text>
          )}
          
          {testResults.joinQuery && (
            <Text style={styles.result}>Join Query: {testResults.joinQuery}</Text>
          )}
          
          {testResults.error && (
            <Text style={styles.result}>Error: {testResults.error}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#495057',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  results: {
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#495057',
  },
  result: {
    fontSize: 12,
    marginBottom: 3,
    fontFamily: 'monospace',
    color: '#495057',
  },
});
