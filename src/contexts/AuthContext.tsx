
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{error: any | null}>;
  signUp: (email: string, password: string, fullName: string) => Promise<{error: any | null}>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(language === 'id' ? 'Gagal masuk: ' + error.message : 'Failed to sign in: ' + error.message);
        return { error };
      }
      
      toast.success(language === 'id' ? 'Berhasil masuk!' : 'Successfully signed in!');
      return { error: null };
    } catch (error: any) {
      toast.error(language === 'id' ? 'Terjadi kesalahan' : 'An error occurred');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        toast.error(language === 'id' ? 'Gagal mendaftar: ' + error.message : 'Failed to sign up: ' + error.message);
        return { error };
      }
      
      toast.success(
        language === 'id'
          ? 'Berhasil mendaftar! Silakan masuk.'
          : 'Successfully registered! Please sign in.'
      );
      return { error: null };
    } catch (error: any) {
      toast.error(language === 'id' ? 'Terjadi kesalahan' : 'An error occurred');
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success(language === 'id' ? 'Berhasil keluar!' : 'Successfully signed out!');
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
