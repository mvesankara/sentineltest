"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

// Définition des types pour les données
interface SeverityData {
  name: string;
  value: number;
}

// Couleurs associées à chaque niveau de sévérité
const SEVERITY_COLORS: { [key: string]: string } = {
  LOW: '#34D399',      // Vert
  MEDIUM: '#FBBF24',   // Ambre
  HIGH: '#F97316',     // Orange
  CRITICAL: '#EF4444', // Rouge
};

const AlertsBySeverityChart = () => {
  const [data, setData] = useState<SeverityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // Accès au token JWT pour les requêtes authentifiées

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

        if (stats.severityStats && stats.severityStats.length > 0) {
          setData(stats.severityStats);
        } else {
          // Afficher un état vide si aucune alerte n'est ouverte
          setData([]);
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
    <div className="bg-card p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">Répartition des Alertes Ouvertes par Sévérité</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value} alerte(s)`, 'Nombre']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Aucune alerte ouverte à afficher.</p>
        </div>
      )}
    </div>
  );
};

export default AlertsBySeverityChart;