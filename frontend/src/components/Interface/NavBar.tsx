import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const { user, signOut, isLoading } = useAuth();

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="mx-auto flex items-center justify-between px-8 md:px-12 max-w-screen-2xl">
        <div className="flex items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Oversight
          </Link>
        </div>

        <nav className="flex items-center space-x-5">
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center space-x-5">
                  <Link
                    href="/dashboard"
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/account"
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    Account
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-5">
                  <Link
                    href="/auth/login"
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
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
  );
}
