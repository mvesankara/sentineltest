"use client"; 

import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import MetricWidget from '@/components/dashboard/MetricWidget';
import AlertCard from '@/components/dashboard/AlertCard';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import AlertsBySeverityChart from '@/components/dashboard/AlertsBySeverityChart';
import AlertsOverTimeChart from '@/components/dashboard/AlertsOverTimeChart';

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
  companyId?: string;
}

const DashboardPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [detectedThreats, setDetectedThreats] = useState<number>(0);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token || !user) return;

    const fetchInitialAlerts = async () => {
      try {
        const response = await fetch('/api/alerts', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const initialAlertsData: AlertData[] = await response.json();
          const companyAlerts = initialAlertsData.filter(alert => alert.companyId === user.companyId || !alert.companyId);
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

    const socket: Socket = io('http://localhost:3001');

    socket.on('connect', () => console.log('Connected to Socket.IO server'));
    socket.on('disconnect', () => console.log('Disconnected from Socket.IO server'));

    socket.on('new_alert', (newAlert: AlertData) => {
      if (newAlert.companyId === user.companyId) {
        setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
        setDetectedThreats((prevCount) => prevCount + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard - {user?.companyName}</h1>

      {/* Section des métriques principales */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricWidget
          title="Menaces détectées" 
          value={detectedThreats.toString()} 
          description="Nombre total de menaces identifiées."
        />
        <MetricWidget
          title="Score de sécurité global"
          value="N/A"
          description="Basé sur les dernières analyses."
        />
        <MetricWidget
          title="Incidents ouverts"
          value={alerts.filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED').length.toString()}
          description="Incidents nécessitant une attention."
        />
      </section>

      {/* Section des nouveaux graphiques */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AlertsBySeverityChart />
        <AlertsOverTimeChart />
      </section>

      {/* Section des alertes récentes */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Alertes Récentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.length === 0 ? (
            <p>Aucune alerte pour le moment.</p>
          ) : (
            alerts.slice(0, 4).map((alert) => ( // Affiche seulement les 4 plus récentes
              <AlertCard
                key={alert.id}
                title={alert.log.eventType || "Alerte"}
                severity={alert.severity}
                description={alert.log.content}
                timestamp={new Date(alert.createdAt).toLocaleString()}
                blockchainHash={alert.blockchainHash}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default withAuth(DashboardPage);
