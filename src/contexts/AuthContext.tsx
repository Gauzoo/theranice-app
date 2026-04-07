'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  nom?: string;
  prenom?: string;
  telephone?: string;
  account_status?: string;
  activite_exercee?: string | null;
  carte_identite_url?: string | null;
  kbis_url?: string | null;
  rc_pro_url?: string | null;
  carte_identite_status?: string | null;
  kbis_status?: string | null;
  rc_pro_status?: string | null;
  documents_submitted_at?: string | null;
  validation_notes?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const hasRecoveryParams = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      return searchParams.has('code')
        || searchParams.get('type') === 'recovery'
        || (searchParams.has('token_hash') && searchParams.get('type') === 'recovery')
        || hashParams.get('type') === 'recovery'
        || (hashParams.has('access_token') && hashParams.get('type') === 'recovery');
    };

    const redirectToResetPassword = () => {
      if (
        pathname === '/reset-password'
        || pathname === '/mot-de-passe-oublie'
        || pathname.startsWith('/auth/')
        || !hasRecoveryParams()
      ) {
        return false;
      }

      const nextUrl = `/reset-password${window.location.search}${window.location.hash}`;
      router.replace(nextUrl);
      return true;
    };

    const getProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (mounted && data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    // Vérification initiale de la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (redirectToResetPassword()) {
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          getProfile(session.user.id);
        }
        setLoading(false);
      }
    });

    // Écoute les changements d'état (connexion, déconnexion, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if ((event === 'PASSWORD_RECOVERY' || hasRecoveryParams()) && redirectToResetPassword()) {
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // On ne recharge le profil que si l'utilisateur a changé
          if (session.user.id !== user?.id) {
            getProfile(session.user.id);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, user?.id]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
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
