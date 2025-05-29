"use client";

import React, { ComponentType, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThreeDots } from 'react-loader-spinner'; // Or any loader you prefer

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const ComponentWithAuth = (props: P) => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.replace('/login'); // Redirect to login if not authenticated and not loading
      }
    }, [isAuthenticated, loading, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <ThreeDots 
            height="80" 
            width="80" 
            radius="9"
            color="hsl(var(--primary))" 
            ariaLabel="three-dots-loading"
            wrapperStyle={{}}
            visible={true}
          />
        </div>
      );
    }

    if (!isAuthenticated) {
      // This will likely not be shown as the useEffect above will redirect.
      // However, it's a fallback.
      return null; 
    }

    // Pass companyId to the wrapped component if it's part of the user object
    // This is just an example of how you might pass additional props
    const enhancedProps = { ...props, companyId: user?.companyId };


    return <WrappedComponent {...enhancedProps} />;
  };

  // Assign a display name for easier debugging
  ComponentWithAuth.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithAuth;
}
