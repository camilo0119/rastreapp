import { useState, useEffect } from 'react';
import { DashboardStats } from '../types';
import { getDashboardStats, getPerformanceMetrics, getRecentShipments } from '../api/dashboard';
import { Shipment } from '../types';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsData, performanceData, recentData] = await Promise.all([
          getDashboardStats(),
          getPerformanceMetrics(),
          getRecentShipments(5),
        ]);

        setStats(statsData);
        setPerformance(performanceData);
        setRecentShipments(recentData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, performanceData, recentData] = await Promise.all([
        getDashboardStats(),
        getPerformanceMetrics(),
        getRecentShipments(5),
      ]);

      setStats(statsData);
      setPerformance(performanceData);
      setRecentShipments(recentData);
    } catch (err) {
      console.error('Error refetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Error al recargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    performance,
    recentShipments,
    loading,
    error,
    refetch,
  };
}
