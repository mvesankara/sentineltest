"use client"; 

import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import MetricWidget from '@/components/dashboard/MetricWidget';
import AlertCard from '@/components/dashboard/AlertCard';
import withAuth from '@/components/auth/withAuth'; // Import the HOC
import { useAuth } from '@/contexts/AuthContext'; // To get token for socket connection

interface AlertData {
  id: string;
  logId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  aiConfidence: number | null;
  blockchainHash: string | null;
  status: string;
  createdAt: string; 
  log: { 
    id: string;
    timestamp: string; 
    source: string;
    eventType: string;
    content: string;
    hash: string | null;
    severity: string | null; 
  };
  companyId?: string; // Added companyId for potential client-side filtering if needed
}

const DashboardPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [detectedThreats, setDetectedThreats] = useState<number>(0);
  const { token, user } = useAuth(); // Get token and user info

  // Mock alerts are removed as we'll fetch or receive real-time ones
  // If you want to fetch initial alerts, you'd do it here, including the auth token

  useEffect(() => {
    if (!token || !user) return; // Don't connect if not authenticated

    // Fetch initial alerts for the company
    const fetchInitialAlerts = async () => {
      try {
        const response = await fetch('/api/alerts', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const initialAlertsData: AlertData[] = await response.json();
          // Filter alerts for the current company if backend isn't strictly filtering
          // (though backend should already filter by companyId from token)
          const companyAlerts = initialAlertsData.filter(alert => alert.companyId === user.companyId || !alert.companyId); // Looser check if companyId might be missing on old alerts
          setAlerts(companyAlerts);
          setDetectedThreats(companyAlerts.length);
        } else {
          console.error('Failed to fetch initial alerts:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching initial alerts:', error);
      }
    };

    fetchInitialAlerts();

    // Socket.io connection with auth token (optional, depending on backend socket auth)
    // For this subtask, backend socket.io is not explicitly protected by JWT,
    // but if it were, you'd pass the token here.
    const socket: Socket = io('http://localhost:3001'
    //,{ auth: { token } } // Example if socket server expects token
    );

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('new_alert', (newAlert: AlertData) => {
      console.log('Received new_alert:', newAlert);
      // Only add alert if it belongs to the current user's company
      if (newAlert.companyId === user.companyId) {
        setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
        setDetectedThreats((prevCount) => prevCount + 1);
      } else {
        console.log('Received alert for different company, ignoring:', newAlert.companyId, 'Current company:', user.companyId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]); // Re-run effect if token or user changes

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard - {user?.companyName}</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricWidget
          title="Menaces détectées" 
          value={detectedThreats.toString()} 
          description="Nombre total de menaces identifiées."
        />
        <MetricWidget
          title="Score de sécurité global"
          value="N/A" // Placeholder, real calculation needed
          description="Basé sur les dernières analyses."
        />
        <MetricWidget
          title="Incidents ouverts"
          value={alerts.filter(a => a.status === 'NEW').length.toString()} 
          description="Incidents nécessitant une attention."
        />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Alertes Récentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.length === 0 && <p>Aucune alerte pour le moment.</p>}
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              title={alert.log.eventType || "Alerte"}
              severity={alert.severity}
              description={alert.log.content}
              timestamp={new Date(alert.createdAt).toLocaleString()}
              blockchainHash={alert.blockchainHash} 
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default withAuth(DashboardPage); // Wrap DashboardPage with withAuth HOC
