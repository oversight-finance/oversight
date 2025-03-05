'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function UserProfile() {
  const { user, signOut } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signOut()
    } catch (error: any) {
      setError(error.message || 'Failed to sign out')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>
          Manage your account settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
          <p className="mt-1 text-base">{user.email}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">User ID</h3>
          <p className="mt-1 text-base text-gray-700">{user.id}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
          <p className="mt-1 text-base">
            {new Date(user.created_at!).toLocaleDateString()}
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </Button>
        <Button
          variant="destructive"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </CardFooter>
    </Card>
  )
} 