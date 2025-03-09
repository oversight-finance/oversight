import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface NavBarProps {
  isSidebarOpen?: boolean;
}

export function NavBar({ isSidebarOpen }: NavBarProps) {
  const { user, signOut, isLoading } = useAuth();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Handle screen size detection
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;

    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth > 768);
    };

    // Set initial value
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Clean up
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Determine if we should add padding based on sidebar state and screen size
  const shouldAddPadding = isSidebarOpen && isLargeScreen;

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="w-full px-8">
        <div className="flex items-center h-16 px-4 sm:px-6 lg:px-8">
          {/* Left side - Logo */}
          <div className={`flex items-center flex-shrink-0 transition-all duration-300 ease-in-out ${shouldAddPadding ? 'ml-64' : ''}`}>
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
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Account
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
