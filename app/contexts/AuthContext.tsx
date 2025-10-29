import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper functions for manual user data storage
const storeUserData = async (user: User) => {
  try {
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

const checkPreviousLogin = async () => {
  try {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      console.log('Previous user found:', user.email);
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error checking previous login:', error);
    return null;
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        console.log('AuthProvider: Initial session:', session);
        
        if (session) {
          // Session exists - store user data
          await storeUserData(session.user);
          setSession(session);
          setUser(session.user);
        } else {
          const previousUser = await checkPreviousLogin();
          if (previousUser) {
            setUser(previousUser);    // Just Temporarily set user from storage, ----- Remove on Production -----
            // We don't set user/session here since there's no valid session
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session?.user) {
        // Store user data on sign in
        await storeUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        // Clear stored data on sign out
        await AsyncStorage.removeItem('user_data');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        Alert.alert('Success', 'Account created successfully! You can now sign in.');
      }
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await storeUserData(data.user); // Store user data on successful login
      }

      setSession(data.session);
      setUser(data.user);
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Clear stored data first
      await AsyncStorage.removeItem('user_data');
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setSession(null);
      setUser(null);
    } catch (error: any) {
      Alert.alert('Sign Out Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}