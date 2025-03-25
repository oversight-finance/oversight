import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { checkUserExists } from "@/database/Users";
import { createUser } from "@/database/Users";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // User is now verified, we don't need to manually create a user record
      // because the trigger in the database will handle this automatically
      // when a new auth.users record is created
      
      // redirect user to specified redirect URL or root of app
      // Check if the user exists in our database, if not create them
      if (data?.user) {
        const userExists = await checkUserExists(data.user.id);
        
        if (!userExists) {
          // Create a new user record in our database
          const userData = {
            id: data.user.id,
            email: data.user.email || "",
            first_name: data.user.user_metadata?.first_name || "",
            last_name: data.user.user_metadata?.last_name || "",
          };
          
          await createUser(userData);
        }
      }
      redirect(next);
    }
  }

  // redirect the user to an error page with some instructions
  redirect("/error");
}
