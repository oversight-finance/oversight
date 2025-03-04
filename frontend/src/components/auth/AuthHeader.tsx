import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function AuthHeader() {
  const { user, signOut, isLoading } = useAuth()

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="container mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center">
          {/* <Link href="/" className="text-xl font-bold text-gray-900">
            FinanceTracker
          </Link> */}
        </div>
        
        <nav className="flex items-center space-x-4">
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="text-sm text-gray-700 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link href="/account" className="text-sm text-gray-700 hover:text-gray-900">
                    Account
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/auth/login" className="text-sm text-gray-700 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
} 