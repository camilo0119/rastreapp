import apiClient, { cachedRequest } from './client';
import { DashboardStats } from '../types';

export interface DashboardStatsResponse extends DashboardStats {
  lastUpdated: string;
}

export interface PerformanceMetrics {
  deliverySuccessRate: number;
  activeShipments: number;
  avgDeliveryTimeHours: number;
  lastUpdated: string;
}

// Obtener estadísticas del dashboard
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const cacheKey = 'dashboard:stats';

  return cachedRequest(cacheKey, async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  });
};

// Obtener métricas de rendimiento
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  const cacheKey = 'dashboard:performance';

  return cachedRequest(cacheKey, async () => {
    const response = await apiClient.get('/dashboard/performance');
    return response.data;
  });
};

// Obtener envíos recientes
export const getRecentShipments = async (limit: number = 5) => {
  const cacheKey = `dashboard:recent-shipments:${limit}`;

  return cachedRequest(cacheKey, async () => {
    const response = await apiClient.get(`/dashboard/recent-shipments?limit=${limit}`);
    return response.data;
  });
};
