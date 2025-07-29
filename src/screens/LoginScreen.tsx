import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, resetPassword, error } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
    } catch (err) {
      Alert.alert('Login Failed', error || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert(
        'Forgot Password',
        'Please enter your email address first, then tap "Forgot Password?"',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset email to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await resetPassword(email);
              Alert.alert(
                'Success',
                'Password reset email sent! Please check your inbox.',
                [{ text: 'OK' }]
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to send password reset email');
            }
          },
        },
      ]
    );
  };

  const handleFacebookLogin = () => {
    Alert.alert(
      'Facebook Login',
      'Facebook authentication is coming soon! For now, please use email login.',
      [
        {
          text: 'OK',
          style: 'default',
        },
        {
          text: 'Use Email Instead',
          style: 'default',
          onPress: () => {
            console.log('Focusing on email login form');
          },
        },
      ]
    );
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'Google Login',
      'Google authentication is coming soon! For now, please use email login.',
      [
        {
          text: 'OK',
          style: 'default',
        },
        {
          text: 'Use Email Instead',
          style: 'default',
          onPress: () => {
            console.log('Focusing on email login form');
          },
        },
      ]
    );
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#405DE6', '#5851DB', '#833AB4', '#C13584', '#E1306C', '#FD1D1D']}
          style={styles.gradient}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContainer,
              { minHeight: screenHeight - insets.top - insets.bottom }
            ]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Instagram</Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Signing In...' : 'Log In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              activeOpacity={0.8}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            </View>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleFacebookLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.socialButtonText}>Continue with Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToSignUp} activeOpacity={0.8}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.05),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Math.max(40, screenHeight * 0.06),
  },
  logoText: {
    fontSize: Math.max(28, screenWidth * 0.08),
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Billabong' : 'serif',
  },
  formContainer: {
    marginBottom: Math.max(25, screenHeight * 0.035),
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: Math.max(15, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
    marginBottom: Math.max(12, screenHeight * 0.018),
    fontSize: Math.max(16, screenWidth * 0.04),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 44, // Ensure minimum touch target
  },
  button: {
    backgroundColor: '#3897f0',
    borderRadius: 8,
    paddingVertical: Math.max(12, screenHeight * 0.015),
    alignItems: 'center',
    marginBottom: Math.max(12, screenHeight * 0.018),
    minHeight: 44, // Ensure minimum touch target
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: Math.max(12, screenHeight * 0.015),
    alignItems: 'center',
    marginBottom: Math.max(12, screenHeight * 0.018),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 44, // Ensure minimum touch target
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Math.max(20, screenHeight * 0.025),
    paddingHorizontal: Math.max(20, screenWidth * 0.05),
    marginTop: Math.max(20, screenHeight * 0.025),
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  footerLink: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
