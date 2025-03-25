import { createClient } from "@/utils/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createUser, fetchUserProfile } from "@/database/Users";
import { UserProfile, UserMetadata, CreateUserData } from "@/types/User";

// Export database functions directly so components can use them
export type { UserProfile, UserMetadata, CreateUserData } from "@/types/User";
export * from "@/database/Users";

// Combined user type that merges Supabase User with our UserProfile
export type AuthUser = SupabaseUser & {
  profile?: UserProfile | null;
};

type AuthState = {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
};

type AuthContextType = AuthState & {
  signUp: (
    email: string,
    password: string,
    metadata?: UserMetadata
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  getUserId: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    userProfile: null,
  });
  const router = useRouter();
  const supabase = createClient();

  // Refresh only the user profile from the database without a new auth call
  const refreshUserProfile = async () => {
    try {
      // Only fetch profile if we already have a user
      if (authState.user?.id) {
        const profile = await fetchUserProfile(authState.user.id);

        setAuthState((current) => ({
          ...current,
          user: current.user ? { ...current.user, profile } : null,
          userProfile: profile,
        }));
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  // Initialize the auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Use getSession for UI-related auth checks - more efficient than getUser
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Set initial state with session data
        let initialState: AuthState = {
          user: null,
          session,
          isLoading: false,
          userProfile: null,
        };

        // Only fetch user profile if we have a session
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          initialState = {
            user: { ...session.user, profile },
            session,
            isLoading: false,
            userProfile: profile,
          };
        }

        setAuthState(initialState);

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          // For sign-in and sign-out events, use session data directly
          if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            let newState: AuthState = {
              user: null,
              session,
              isLoading: false,
              userProfile: null,
            };

            // Only fetch profile on SIGNED_IN
            if (event === "SIGNED_IN" && session?.user) {
              const profile = await fetchUserProfile(session.user.id);
              newState = {
                user: { ...session.user, profile },
                session,
                isLoading: false,
                userProfile: profile,
              };
              router.refresh();
            }

            // Just clear state and redirect on SIGNED_OUT
            if (event === "SIGNED_OUT") {
              router.refresh();
              router.push("/auth/login");
            }

            setAuthState(newState);
          }

          // For token refresh events, just update the session
          if (event === "TOKEN_REFRESHED" && session) {
            setAuthState((current) => ({
              ...current,
              session,
            }));
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          userProfile: null,
        });
      }
    };

    initializeAuth();
  }, [router, supabase]);

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    metadata?: UserMetadata
  ) => {
    try {
      // Sign up with auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
          },
        },
      }); 

      if (error) throw error;
      
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error during sign up";
      throw new Error(errorMessage);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Let onAuthStateChange handle the state update
      // No need to call refreshUserProfile separately
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error during sign in";
      throw new Error(errorMessage);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Let onAuthStateChange handle the state update
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error during sign out";
      throw new Error(errorMessage);
    }
  };

  const value = {
    ...authState,
    signUp,
    signIn,
    signOut,
    refreshUserProfile,
    getUserId: () => authState.user?.id || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
