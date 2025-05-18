import { User, Session } from '@supabase/supabase-js';

export interface UserMetadata {
  full_name: string;
  role: 'student' | 'parent' | 'admin';
  avatar_url?: string;
}

export interface ExtendedUser extends User {
  user_metadata: UserMetadata;
  accountType: 'student' | 'parent' | 'teacher';
}

export interface AuthState {
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  isAuthReady: boolean;
  userRole: 'parent' | 'student' | 'admin' | null;
}

export interface AuthContextProps {
  user: ExtendedUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{error: any | null}>;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'parent') => Promise<{error: any | null}>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthReady: boolean;
  userRole: 'parent' | 'student' | 'admin' | null;
  isParent: boolean;
  isStudent: boolean;
} 