import { createClient } from "@/utils/supabase/client";
import { UserProfile, CreateUserData, UserProfileUpdates } from "@/types/User";
import { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Fetches a user's profile from the public.users table
 * @param userId The ID of the user to fetch
 * @returns The user profile or null if not found
 */
export const fetchUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  if (!userId) {
    console.error("No user ID provided to fetchUserProfile");
    return null;
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error("Exception fetching user profile:", error);
    return null;
  }
};

/**
 * Checks if a user exists in the users table
 * @param userId The ID of the user to check
 * @returns True if the user exists, false otherwise
 */
export const checkUserExists = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // PGRST116 is the error code for "no rows returned"
        return false;
      }
      console.error("Error checking if user exists:", error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error("Exception checking if user exists:", error);
    return false;
  }
};

/**
 * Creates a new user in the public.users table
 * @param user The user data to insert
 * @returns True if successful, false otherwise
 */
export const createUser = async (user: CreateUserData): Promise<boolean> => {
  try {
    const supabase = createClient();

    const { error } = await supabase.from("users").insert([
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error creating user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception creating user:", error);
    return false;
  }
};

/**
 * Updates a user's profile in the public.users table
 * @param userId The ID of the user to update
 * @param updates The fields to update
 * @returns True if successful, false otherwise
 */
export const updateUserProfile = async (
  userId: string,
  updates: UserProfileUpdates
): Promise<boolean> => {
  if (!userId) return false;

  try {
    const supabase = createClient();

    // Always update the updated_at field
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("users")
      .update(updatedData)
      .eq("id", userId);

    if (error) {
      console.error("Error updating user profile:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception updating user profile:", error);
    return false;
  }
};

/**
 * Gets the current authenticated user and their profile
 * @returns The Supabase user and profile data in separate objects
 */
export const getCurrentUserWithProfile = async (): Promise<{
  authUser: SupabaseUser | null;
  profile: UserProfile | null;
}> => {
  try {
    const supabase = createClient();

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return { authUser: null, profile: null };
    }

    const profile = await fetchUserProfile(authUser.id);

    return { authUser, profile };
  } catch (error) {
    console.error("Exception getting current user:", error);
    return { authUser: null, profile: null };
  }
};

// /**
//  * Server-side function to get the current user
//  * (Use this in server components)
//  */
// export const getCurrentUserServer = async (): Promise<{
//   user: SupabaseUser | null;
//   profile: UserProfile | null;
// }> => {
//   try {
//     const supabase = await createServerClient();

//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser();

//     if (error || !user) {
//       return { user: null, profile: null };
//     }

//     const { data, error: profileError } = await supabase
//       .from("users")
//       .select("*")
//       .eq("id", user.id)
//       .single();

//     if (profileError) {
//       console.error("Error fetching user profile:", profileError);
//       return { user, profile: null };
//     }

//     return { user, profile: data as UserProfile };
//   } catch (error) {
//     console.error("Exception getting current user server-side:", error);
//     return { user: null, profile: null };
//   }
// };
