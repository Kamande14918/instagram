import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const EnvironmentDebugger: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Environment Variables Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>NODE_ENV:</Text>
        <Text style={styles.value}>{process.env.NODE_ENV || 'undefined'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>EXPO_PUBLIC_SUPABASE_URL:</Text>
        <Text style={styles.value}>
          {process.env.EXPO_PUBLIC_SUPABASE_URL || 'undefined'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>EXPO_PUBLIC_SUPABASE_ANON_KEY:</Text>
        <Text style={styles.value}>
          {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY 
            ? `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
            : 'undefined'
          }
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>All EXPO_PUBLIC_ variables:</Text>
        {Object.entries(process.env)
          .filter(([key]) => key.startsWith('EXPO_PUBLIC_'))
          .map(([key, value]) => (
            <Text key={key} style={styles.envVar}>
              {key}: {value ? 'SET' : 'NOT SET'}
            </Text>
          ))
        }
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 4,
  },
  envVar: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});

export default EnvironmentDebugger;
