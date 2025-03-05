import { createClient } from '@/utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
}

type AuthContextType = AuthState & {
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  })
  const router = useRouter()
  const supabase = createClient()

  // Initialize the auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      })

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
        })

        if (event === 'SIGNED_IN') {
          router.refresh()
        }
        if (event === 'SIGNED_OUT') {
          router.refresh()
          router.push('/auth/login')
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    initializeAuth()
  }, [router, supabase])

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Error during sign up')
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Error during sign in')
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Error during sign out')
    }
  }

  const value = {
    ...authState,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 