import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function NavBar() {
  const { user, userProfile, signOut, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState<string>("User");

  // Update display name when user or profile changes
  useEffect(() => {
    if (userProfile?.first_name && userProfile?.last_name) {
      setDisplayName(`${userProfile.first_name} ${userProfile.last_name}`);
    } else if (userProfile?.first_name) {
      setDisplayName(userProfile.first_name);
    } else if (userProfile?.last_name) {
      setDisplayName(userProfile.last_name);
    } else if (user?.email) {
      setDisplayName(user.email.split("@")[0]);
    } else {
      setDisplayName("User");
    }
  }, [user, userProfile]);

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="w-full px-8">
        <div className="flex items-center h-16 px-4 sm:px-6 lg:px-8">
          {/* Left side - Logo */}
          <div className={`flex items-center flex-shrink-0 transition-all duration-300 ease-in-out`}>
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 whitespace-nowrap"
            >
              Oversight
            </Link>
          </div>
          
          {/* Flexible space between */}
          <div className="flex-grow"></div>
          
          {/* Right side - Navigation */}
          {!isLoading && (
            <div className="flex items-center flex-shrink-0">
              {user ? (
                <div className="flex items-center gap-6">
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors hidden md:block"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/account"
                    className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
                  >
                    {displayName}
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => signOut()}
                    className="font-medium"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="font-medium">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
