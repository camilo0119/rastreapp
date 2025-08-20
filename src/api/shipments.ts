import apiClient, { cachedRequest, clearCache } from './client';
import { Shipment } from '../types';

export interface ShipmentsResponse {
  shipments: Shipment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ShipmentsFilters {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Obtener todos los envíos con filtros
export const getShipments = async (filters: ShipmentsFilters = {}): Promise<ShipmentsResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const cacheKey = `shipments:${params.toString()}`;

  return cachedRequest(cacheKey, async () => {
    const response = await apiClient.get(`/shipments?${params.toString()}`);
    return response.data;
  });
};

// Obtener envío por ID
export const getShipmentById = async (id: string): Promise<Shipment> => {
  const cacheKey = `shipment:${id}`;

  return cachedRequest(cacheKey, async () => {
    const response = await apiClient.get(`/shipments/${id}`);
    return response.data;
  });
};

// Crear nuevo envío
export const createShipment = async (shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shipment> => {
  const response = await apiClient.post('/shipments', shipmentData);

  // Limpiar cache relacionado
  clearCache('shipments');

  return response.data;
};

// Actualizar envío
export const updateShipment = async (id: string, shipmentData: Partial<Shipment>): Promise<Shipment> => {
  const response = await apiClient.put(`/shipments/${id}`, shipmentData);

  // Limpiar cache relacionado
  clearCache('shipments');
  clearCache(`shipment:${id}`);

  return response.data;
};

// Eliminar envío
export const deleteShipment = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/shipments/${id}`);

  // Limpiar cache relacionado
  clearCache('shipments');
  clearCache(`shipment:${id}`);

  return response.data;
};

// Obtener estadísticas de envíos
export const getShipmentStats = async () => {
  const cacheKey = 'shipments:stats';

  return cachedRequest(cacheKey, async () => {
    const response = await apiClient.get('/shipments/stats/status');
    return response.data;
  });
};

// Obtener envíos recientes para el dashboard
export const getRecentShipments = async (limit: number = 5): Promise<Shipment[]> => {
  const cacheKey = `recent-shipments:${limit}`;

  return cachedRequest(cacheKey, async () => {
    const response = await apiClient.get(`/dashboard/recent-shipments?limit=${limit}`);
    return response.data;
  });
};
