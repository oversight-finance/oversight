import { createClient } from "@/utils/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type UserProfile = {
  first_name: string | null;
  last_name: string | null;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
};

type UserMetadata = {
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
};

type AuthContextType = AuthState & {
  signUp: (
    email: string,
    password: string,
    metadata?: UserMetadata
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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

  // Fetch user profile from public.users table
  const fetchUserProfile = async (userId: string) => {
    if (!userId) {
      console.error("No user ID provided to fetchUserProfile");
      return null;
    }

    try {
      console.log(`Fetching profile for user ${userId}`);

      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error.message);
        console.error("Error details:", error);

        // Check if user exists in the users table
        const { count, error: countError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("id", userId);

        if (countError) {
          console.error("Error checking if user exists:", countError);
        } else {
          // This expression checks if the user exists in the users table
          // If count is truthy (not null/undefined) and greater than 0, the user exists
          // Otherwise, the user doesn't exist
          const userExists = count && count > 0;
          console.log(
            `User exists in users table: ${userExists ? "YES" : "NO"}`
          );
        }

        return null;
      }

      console.log("Successfully fetched user profile:", data);
      return data as UserProfile;
    } catch (error) {
      console.error("Exception fetching user profile:", error);
      return null;
    }
  };

  // Initialize the auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // Use getUser() instead of getSession() for proper JWT validation
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error validating user session:", error);
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          userProfile: null,
        });
        return;
      }

      let profile = null;
      if (user) {
        profile = await fetchUserProfile(user.id);
      }

      // Get the session after validating user for backward compatibility
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setAuthState({
        user: user,
        session: session,
        isLoading: false,
        userProfile: profile,
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        // For auth changes, directly get and validate the user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let profile = null;
        if (user) {
          profile = await fetchUserProfile(user.id);
        }

        setAuthState({
          user: user,
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
        // Insert the user info into public.users table
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email: email,
            first_name: metadata?.firstName || "",
            last_name: metadata?.lastName || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (insertError) {
          console.error("Error inserting user data:", insertError);
          // Consider what to do if auth succeeds but user table insert fails
          // For now, we'll just log it but still consider signup successful
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
