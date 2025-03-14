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
import { createUser, getCurrentUserWithProfile } from "@/database/Users";
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

  // Refresh the user profile from the database
  const refreshUserProfile = async () => {
    try {
      // Use the utility function to get user with profile in one call
      const { authUser, profile } = await getCurrentUserWithProfile();

      if (authUser) {
        setAuthState((current) => ({
          ...current,
          user: { ...authUser, profile },
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
        // Use getCurrentUserWithProfile to get both auth user and profile in one call
        const { authUser, profile } = await getCurrentUserWithProfile();

        // Get the session for backward compatibility
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setAuthState({
          user: authUser ? { ...authUser, profile } : null,
          session: session,
          isLoading: false,
          userProfile: profile,
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          // For auth changes, get user with profile in one call
          const { authUser, profile } = await getCurrentUserWithProfile();

          setAuthState({
            user: authUser ? { ...authUser, profile } : null,
            session: session,
            isLoading: false,
            userProfile: profile,
          });

          if (event === "SIGNED_IN") {
            router.refresh();
          }
          if (event === "SIGNED_OUT") {
            router.refresh();
            router.push("/auth/login");
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

      // If sign up successful and user exists, insert into public.users table
      if (data.user) {
        // Create a properly typed user object for the database
        const userData: CreateUserData = {
          id: data.user.id,
          email: email,
          first_name: metadata?.firstName || "",
          last_name: metadata?.lastName || "",
        };

        // Use the utility function to create user
        const success = await createUser(userData);

        if (!success) {
          console.error("Error inserting user data");
        }
      }
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

      // After sign in, refresh the user profile
      await refreshUserProfile();
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
