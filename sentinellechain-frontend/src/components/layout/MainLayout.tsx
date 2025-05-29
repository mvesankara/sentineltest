"use client"; // Required for useAuth hook

import React from 'react';
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Button } from '@/components/ui/button'; // For logout button
import { LogOut, UserCircle, Building } from 'lucide-react'; // Icons
import { usePathname } from 'next/navigation'; // To hide layout on auth pages


interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  // Don't render layout for login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-6">SentinelleChain</h2>
        <nav className="flex-grow">
          <ul>
            <li className="mb-2">
              <a href="/dashboard" className="text-card-foreground hover:text-primary">Dashboard</a>
            </li>
            <li className="mb-2">
              <a href="/alerts" className="text-card-foreground hover:text-primary">Alerts</a>
            </li>
            <li className="mb-2">
              <a href="/audit-trail" className="text-card-foreground hover:text-primary">Audit Trail</a>
            </li>
            {/* Add other navigation items here */}
            {/* <li className="mb-2">
              <a href="/settings" className="text-card-foreground hover:text-primary">Settings</a>
            </li> */}
          </ul>
        </nav>
        {isAuthenticated && user && (
          <div className="mt-auto pt-4 border-t border-border">
            <div className="flex items-center mb-2">
              <UserCircle className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-sm truncate" title={user.email}>{user.email}</span>
            </div>
            <div className="flex items-center mb-3">
              <Building className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-sm truncate" title={user.companyName}>{user.companyName}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card p-4 shadow flex justify-between items-center">
          {/* Header Title can be dynamic based on page or fixed */}
          <h1 className="text-xl font-semibold">{user ? `${user.companyName} Dashboard` : "SentinelleChain"}</h1>
          <div className="flex items-center gap-4">
            {/* Display user info or login button if not on dashboard context */}
            <ThemeToggle />
            {!isAuthenticated && (pathname !== '/login' && pathname !== '/register') && (
                 <Button asChild variant="outline">
                    <a href="/login">Login</a>
                 </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
