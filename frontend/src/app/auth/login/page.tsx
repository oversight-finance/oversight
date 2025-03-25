import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In | Finance Tracker",
  description: "Sign in to your finance tracker account",
};

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-2xl font-bold text-center mb-8">Welcome Back</h1>
        <Suspense fallback={<div>Logging in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
