export interface Shipment {
  id: string;
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
  estimatedDelivery: string;
  actualDelivery?: string;
  route: {
    distance: number;
    estimatedTime: number;
  };
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: 'truck' | 'van' | 'trailer' | 'pickup';
  capacity: number;
  status: 'available' | 'in-use' | 'maintenance' | 'offline';
  driver?: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface Driver {
  id: string;
  name: string;
  license: string;
  phone: string;
  email: string;
  status: 'available' | 'on-delivery' | 'off-duty' | 'suspended';
  currentVehicle?: string;
  rating: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
}

export interface DashboardStats {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  pending: number;
  delayed: number;
  cancelled: number;
  availableVehicles: number;
  activeDrivers: number;
  onTimeDeliveryRate: number;
}

export interface FilterState {
  status: string;
  priority: string;
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  };
}
