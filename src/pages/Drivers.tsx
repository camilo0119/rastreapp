import React, { useState, useEffect } from 'react';
import { User, Star, CheckCircle, Clock, Coffee, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import apiClient from '../api/client';
import { Driver, Vehicle } from '../types';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [driversResponse, vehiclesResponse] = await Promise.all([
          apiClient.get('/drivers'),
          apiClient.get('/vehicles'),
        ]);
        setDrivers(driversResponse?.data?.drivers || driversResponse?.data || []);
        setVehicles(vehiclesResponse?.data?.vehicles || vehiclesResponse?.data || []);
      } catch (err) {
        setError('Error al cargar los datos de conductores');
        console.error('Error fetching drivers data:', err);
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
      case 'on-delivery':
        return {
          label: 'En entrega',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
        };
      case 'off-duty':
        return {
          label: 'Fuera de turno',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Coffee,
        };
      case 'suspended':
        return {
          label: 'Suspendido',
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

  const getVehiclePlate = (vehicleId?: string) => {
    if (!vehicleId) return 'Sin vehículo';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.plate : 'Desconocido';
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm font-medium text-gray-900 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Cargando conductores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar los conductores: {error}</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Conductores',
      value: drivers.length,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      title: 'Disponibles',
      value: drivers.filter(d => d.status === 'available').length,
      className: 'bg-green-50 border-green-200 text-green-800',
    },
    {
      title: 'En Entrega',
      value: drivers.filter(d => d.status === 'on-delivery').length,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      title: 'Fuera de Turno',
      value: drivers.filter(d => d.status === 'off-duty').length,
      className: 'bg-gray-50 border-gray-200 text-gray-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Conductores</h1>
        <p className="text-gray-600">Administra la información y estado de los conductores</p>
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

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {drivers.map((driver) => {
          const statusConfig = getStatusConfig(driver.status);
          const StatusIcon = statusConfig.icon;
          const onTimeRate = ((driver.onTimeDeliveries / driver.totalDeliveries) * 100).toFixed(1);

          return (
            <div key={driver.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {driver.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Licencia: {driver.license}
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valoración:</span>
                    {renderRating(driver.rating)}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Teléfono:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {driver.phone}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vehículo actual:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getVehiclePlate(driver.currentVehicle)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-gray-900">
                          {driver.totalDeliveries}
                        </div>
                        <div className="text-xs text-gray-600">
                          Total entregas
                        </div>
                      </div>

                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {onTimeRate}%
                        </div>
                        <div className="text-xs text-gray-600">
                          A tiempo
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Ver Detalles
                  </button>
                  {driver.status === 'available' && (
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

      {drivers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay conductores registrados</p>
        </div>
      )}
    </div>
  );
};

export default Drivers;
