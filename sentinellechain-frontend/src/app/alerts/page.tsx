"use client";

"use client";

import React, { useEffect, useState } from 'react';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Alert as AlertType } from '@/types/alert'; // Corrected import path
import AlertsTable from '@/components/alerts/AlertsTable'; 
// import { Button } from '@/components/ui/button'; // Not used yet
import { io, Socket } from 'socket.io-client';

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token || !user) {
      setLoading(false); // Stop loading if no token/user
      return;
    }

    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/alerts', { 
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch alerts');
        }
        const data: AlertType[] = await response.json();
        setAlerts(data);
      } catch (err: any) {
        console.error("Error fetching alerts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    const socket: Socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('AlertsPage: Connected to Socket.IO server');
    });

    socket.on('new_alert', (newAlert: AlertType) => {
      console.log('AlertsPage: Received new_alert via socket:', newAlert);
      // Ensure user and user.companyId are available before comparing
      if (user && newAlert.companyId === user.companyId) {
        setAlerts((prevAlerts) => {
          if (prevAlerts.find(a => a.id === newAlert.id)) {
            return prevAlerts.map(a => a.id === newAlert.id ? newAlert : a);
          }
          return [newAlert, ...prevAlerts];
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('AlertsPage: Disconnected from Socket.IO server');
    });

    return () => {
      socket.disconnect();
    };

  }, [token, user]); // user dependency added for companyId check in socket handler

  if (loading) {
    return <div className="p-6">Loading alerts...</div>; 
  }

  if (error) {
    return <div className="p-6 text-destructive">Error fetching alerts: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Alerts</h1>
      </div>
      <AlertsTable alerts={alerts} setAlerts={setAlerts} />
    </div>
  );
};

export default withAuth(AlertsPage);
// Removed inline type definitions as they are now in src/types/alert.ts
