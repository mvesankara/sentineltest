"use client";

"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation'; // For redirection

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated, loading: authLoading } = useAuth(); // Use login from AuthContext
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated and not loading, redirect to dashboard
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    // setLoading(true); // AuthContext handles its own loading state

    try {
      await login(email, password);
      // router.push('/dashboard'); // AuthContext's login function handles redirection
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      console.error("Login error:", err);
    } 
    // finally { // AuthContext handles its own loading state
    //   setLoading(false);
    // }
  };
  
  // If auth is still loading or user is already authenticated, show minimal UI or loader
  if (authLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p> {/* Or a proper loader component */}
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={authLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm">
          Don&apos;t have an account?&nbsp;
          <Link href="/register" className="underline">
            Register
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
