import { SignupForm } from '@/components/auth/SignupForm'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account | Finance Tracker',
  description: 'Create a new finance tracker account',
}

export default async function SignupPage() {
  // Check if user is already logged in using client supabase
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // If user is logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-2xl font-bold text-center mb-8">Create an Account</h1>
        <SignupForm />
      </div>
    </div>
  )
} 