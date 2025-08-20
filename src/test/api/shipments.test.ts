import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getShipments, getShipmentById, createShipment } from '../../api/shipments';
import apiClient from '../../api/client';

// Mock del cliente de API
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Shipments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getShipments', () => {
    it('should fetch shipments with default filters', async () => {
      const mockResponse = {
        shipments: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await getShipments();

      expect(apiClient.get).toHaveBeenCalledWith('/shipments?');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch shipments with filters', async () => {
      const filters = {
        status: 'in-transit',
        priority: 'high',
        search: 'test',
        page: 2,
        limit: 10,
      };

      const mockResponse = {
        shipments: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await getShipments(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/shipments?status=in-transit&priority=high&search=test&page=2&limit=10&sortBy=createdAt&sortOrder=desc');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getShipments()).rejects.toThrow('API Error');
    });
  });

  describe('getShipmentById', () => {
    it('should fetch a single shipment', async () => {
      const mockShipment = {
        id: '1',
        trackingNumber: 'TMS001234',
        status: 'in-transit',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockShipment });

      const result = await getShipmentById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/shipments/1');
      expect(result).toEqual(mockShipment);
    });
  });

  describe('createShipment', () => {
    it('should create a new shipment', async () => {
      const shipmentData = {
        trackingNumber: 'TMS001234',
        origin: 'Madrid',
        destination: 'Barcelona',
        status: 'pending' as const,
        priority: 'medium' as const,
        weight: 100,
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+1234567890',
        },
        estimatedDelivery: '2025-01-10T10:00:00Z',
        route: {
          distance: 500,
          estimatedTime: 300,
        },
        notes: [],
      };

      const mockResponse = { ...shipmentData, id: '1', createdAt: '2025-01-08T10:00:00Z', updatedAt: '2025-01-08T10:00:00Z' };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await createShipment(shipmentData);

      expect(apiClient.post).toHaveBeenCalledWith('/shipments', shipmentData);
      expect(result).toEqual(mockResponse);
    });
  });
});
