import { Request, Response, NextFunction } from 'express';
import { Document, Model } from 'mongoose';

// Tipos base para las entidades
export interface IShipment extends Document {
  trackingNumber: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  weight: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
  };
  estimatedDelivery: Date;
  actualDelivery?: Date;
  route: {
    distance: number;
    estimatedTime: number;
  };
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos de instancia
  updateStatus(newStatus: string, notes?: string): Promise<void>;
  markAsDelivered(): Promise<void>;
}

// Interfaz para el modelo de Shipment con métodos estáticos
export interface IShipmentModel extends Model<IShipment> {
  getStats(): Promise<ShipmentStats>;
  getByStatus(status: string): Promise<IShipment[]>;
  search(searchTerm: string): Promise<IShipment[]>;
  getRecent(limit?: number): Promise<IShipment[]>;
  getByDriver(driverId: string): Promise<IShipment[]>;
  getByDateRange(startDate: Date, endDate: Date): Promise<IShipment[]>;
  getUrgent(): Promise<IShipment[]>;
  getDelayed(): Promise<IShipment[]>;
}

export interface IVehicle extends Document {
  plate: string;
  type: 'truck' | 'van' | 'trailer' | 'pickup';
  capacity: number;
  status: 'available' | 'in-use' | 'maintenance' | 'offline';
  driver?: string;
  lastMaintenance: Date;
  nextMaintenance: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos de instancia
  assignDriver(driverId: string): Promise<IVehicle>;
  release(): Promise<IVehicle>;
  sendToMaintenance(): Promise<IVehicle>;
  markOffline(): Promise<IVehicle>;
  updateMaintenance(): Promise<IVehicle>;
  
  // Propiedades virtuales
  daysUntilMaintenance: number;
  needsMaintenanceSoon: boolean;
  daysSinceLastMaintenance: number;
  capacityInfo: string;
}

// Interfaz para el modelo de Vehicle con métodos estáticos
export interface IVehicleModel extends Model<IVehicle> {
  getStats(): Promise<VehicleStats>;
  getByStatus(status: string): Promise<IVehicle[]>;
  getNeedingMaintenance(): Promise<IVehicle[]>;
  getAvailable(): Promise<IVehicle[]>;
  getByType(type: string): Promise<IVehicle[]>;
  getByCapacity(minCapacity: number, maxCapacity?: number): Promise<IVehicle[]>;
}

export interface IDriver extends Document {
  name: string;
  license: string;
  phone: string;
  email: string;
  status: 'available' | 'on-delivery' | 'off-duty' | 'suspended';
  currentVehicle?: string;
  rating: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Propiedades virtuales
  onTimeDeliveryRate: number;
  experienceLevel: string;
  reliabilityStatus: string;
  contactInfo: string;
  
  // Métodos de instancia
  assignVehicle(vehicleId: string): Promise<IDriver>;
  release(): Promise<IDriver>;
  markOffDuty(): Promise<IDriver>;
  suspend(): Promise<IDriver>;
  updateRating(newRating: number): Promise<IDriver>;
  recordDelivery(onTime: boolean): Promise<IDriver>;
  getOnTimeDeliveryRate(): number;
  isExperienced(): boolean;
  isReliable(): boolean;
}

// Interfaz para el modelo de Driver con métodos estáticos
export interface IDriverModel extends Model<IDriver> {
  getStats(): Promise<DriverStats>;
  getByStatus(status: string): Promise<IDriver[]>;
  getTopRated(limit?: number): Promise<IDriver[]>;
  getAvailable(): Promise<IDriver[]>;
  getMostExperienced(limit?: number): Promise<IDriver[]>;
  search(searchTerm: string): Promise<IDriver[]>;
}

// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Tipos para los filtros
export interface ShipmentFilters {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface DriverFilters {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos para las estadísticas
export interface ShipmentStats {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  pending: number;
  delayed: number;
  cancelled: number;
}

export interface VehicleStats {
  totalVehicles: number;
  available: number;
  inUse: number;
  maintenance: number;
  offline: number;
}

export interface DriverStats {
  totalDrivers: number;
  available: number;
  onDelivery: number;
  offDuty: number;
  suspended: number;
  avgRating: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  onTimeDeliveryRate: number;
}

export interface DashboardStats {
  // Estadísticas de envíos
  totalShipments: number;
  inTransit: number;
  delivered: number;
  pending: number;
  delayed: number;
  cancelled: number;

  // Estadísticas de vehículos
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  offlineVehicles: number;

  // Estadísticas de conductores
  totalDrivers: number;
  availableDrivers: number;
  onDeliveryDrivers: number;
  offDutyDrivers: number;
  suspendedDrivers: number;

  // Métricas calculadas
  onTimeDeliveryRate: number;
  avgDriverRating: number;

  // Timestamp
  lastUpdated: string;
}

export interface PerformanceMetrics {
  deliverySuccessRate: number;
  activeShipments: number;
  avgDeliveryTimeHours: number;
  lastUpdated: string;
}

// Tipos para el caché
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Tipos para los middlewares
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Tipos para errores personalizados
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Tipos para configuración
export interface DatabaseConfig {
  uri: string;
  options: Record<string, any>;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
}

export interface CacheConfig {
  duration: number;
  cleanupInterval: number;
}
