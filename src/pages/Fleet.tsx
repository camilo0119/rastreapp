import React, { useState, useEffect } from 'react';
import { Truck, Wrench, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import apiClient from '../api/client';
import { Vehicle, Driver } from '../types';

const Fleet: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesResponse, driversResponse] = await Promise.all([
          apiClient.get('/vehicles'),
          apiClient.get('/drivers'),
        ]);
        setVehicles(vehiclesResponse?.data?.vehicles);
        setDrivers(driversResponse?.data?.drivers);
      } catch (err) {
        setError('Error al cargar los datos de la flota');
        console.error('Error fetching fleet data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'Disponible',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
        };
      case 'in-use':
        return {
          label: 'En uso',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Truck,
        };
      case 'maintenance':
        return {
          label: 'Mantenimiento',
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Wrench,
        };
      case 'offline':
        return {
          label: 'Fuera de servicio',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
        };
      default:
        return {
          label: 'Desconocido',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: XCircle,
        };
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      truck: 'Camión',
      van: 'Furgoneta',
      trailer: 'Tráiler',
      pickup: 'Pick-up',
    };
    return types[type] || type;
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'Sin asignar';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Desconocido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Cargando flota...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar la flota: {error}</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Vehículos',
      value: vehicles?.length,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      title: 'Disponibles',
      value: vehicles?.filter(v => v.status === 'available').length,
      className: 'bg-green-50 border-green-200 text-green-800',
    },
    {
      title: 'En Uso',
      value: vehicles?.filter(v => v.status === 'in-use').length,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      title: 'Mantenimiento',
      value: vehicles?.filter(v => v.status === 'maintenance').length,
      className: 'bg-orange-50 border-orange-200 text-orange-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Flota</h1>
        <p className="text-gray-600">Administra vehículos y su estado de mantenimiento</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className={`rounded-lg border p-4 ${stat.className}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => {
          const statusConfig = getStatusConfig(vehicle.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vehicle.plate}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getVehicleTypeLabel(vehicle.type)}
                      </p>
                    </div>
                  </div>

                  <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                    ${statusConfig.className}
                  `}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Capacidad:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {vehicle.capacity} kg
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conductor:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getDriverName(vehicle.driver)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Último mantenimiento:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(vehicle.lastMaintenance).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Próximo mantenimiento:</span>
                      <span className={`text-sm font-medium ${
                        new Date(vehicle.nextMaintenance) < new Date()
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}>
                        {new Date(vehicle.nextMaintenance).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Ver Detalles
                  </button>
                  {vehicle.status === 'available' && (
                    <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Asignar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay vehículos registrados</p>
        </div>
      )}
    </div>
  );
};

export default Fleet;
