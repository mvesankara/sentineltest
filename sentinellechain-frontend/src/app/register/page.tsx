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

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { register, isAuthenticated, loading: authLoading } = useAuth(); // Use register from AuthContext
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

    if (password.length < 6) { // Basic password length validation
        setError("Password must be at least 6 characters long.");
        return;
    }
    
    try {
      await register(email, password, companyName);
      // router.push('/login'); // AuthContext's register function handles redirection or messaging
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
      console.error("Registration error:", err);
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
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>Create a new account for your company.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Your Company Inc."
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={authLoading}
              />
            </div>
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
              {authLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm">
          Already have an account?&nbsp;
          <Link href="/login" className="underline">
            Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
