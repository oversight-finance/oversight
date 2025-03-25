import { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * User profile information stored in the database
 */
export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

/**
 * User information used when creating a new user
 */
export type CreateUserData = {
  id: string;
  first_name?: string;
  last_name?: string;
};

/**
 * User metadata for authentication
 */
export type UserMetadata = {
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
};

/**
 * Result of user authentication operations
 */
export type AuthResult = {
  success: boolean;
  message?: string;
  user?: SupabaseUser | null;
};

/**
 * Updates that can be applied to a user profile
 */
export type UserProfileUpdates = Partial<
  Omit<UserProfile, "id" | "created_at">
>;
