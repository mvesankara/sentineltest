"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

// Définition des types pour les données
interface TimeData {
  date: string;
  count: number;
}

const AlertsOverTimeChart = () => {
  const [data, setData] = useState<TimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // Accès au token

  useEffect(() => {
    const fetchChartData = async () => {
      if (!token) {
        setIsLoading(false);
        setError("Authentification requise.");
        return;
      }

      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Échec de la récupération des données du tableau de bord.');
        }

        const stats = await response.json();

        if (stats.timeStats) {
          setData(stats.timeStats);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [token]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Chargement des données...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500"><p>Erreur : {error}</p></div>;
  }

  return (
    <div className="bg-card p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold mb-4 text-center">Volume d'Alertes (7 derniers jours)</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip
              labelFormatter={(label) => `Date : ${label}`}
              formatter={(value) => [`${value} alerte(s)`, 'Nombre']}
            />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="Nombre d'alertes" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Pas de données d'alerte pour les 7 derniers jours.</p>
        </div>
      )}
    </div>
  );
};

export default AlertsOverTimeChart;