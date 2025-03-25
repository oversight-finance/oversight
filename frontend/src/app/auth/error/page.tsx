import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication Error | Finance Tracker',
  description: 'An error occurred during authentication',
}

export default function AuthErrorPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-2xl font-bold text-center mb-4">Authentication Error</h1>
        <p className="text-center text-gray-600 mb-8">
          There was a problem with your authentication request. This could be due to an expired or invalid link.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 