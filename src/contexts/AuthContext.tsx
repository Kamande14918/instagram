import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '../services/supabase';
import { User as UserProfile } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SIGN_OUT' };

const initialState: AuthState = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload,
        user: action.payload?.user || null,
        loading: false,
      };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SIGN_OUT':
      return {
        ...initialState,
        loading: false,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          dispatch({ type: 'SET_PROFILE', payload: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      dispatch({ type: 'SET_PROFILE', payload: profile });
    } catch (error) {
      console.error('Error loading user profile:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user profile' });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Check if username is available
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
        },
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            username: username,
          });

        if (profileError) throw profileError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'SET_PROFILE', payload: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    await loadUserProfile(state.user.id);
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
