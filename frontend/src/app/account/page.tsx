import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { UserProfile } from "@/components/auth/UserProfile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings | Finance Tracker",
  description: "Manage your account settings and preferences",
};

export default async function AccountPage() {
  // Check if user is logged in using server supabase
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login?redirectTo=/account");
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-2xl font-bold text-center mb-8">
          Account Settings
        </h1>
        <UserProfile />
      </div>
    </div>
  );
}
