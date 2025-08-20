import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Package,
  Truck,
  Users,
  Clock,
} from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatsCard from '../components/Dashboard/StatsCard';
import apiClient from '../api/client';
import { Shipment, Vehicle, Driver } from '../types';

const Reports: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [shipmentsResponse, vehiclesResponse, driversResponse] = await Promise.all([
          apiClient.get('/shipments'),
          apiClient.get('/vehicles'),
          apiClient.get('/drivers'),
        ]);
        setShipments(shipmentsResponse?.data?.shipments || shipmentsResponse?.data || []);
        setVehicles(vehiclesResponse?.data?.vehicles || vehiclesResponse?.data || []);
        setDrivers(driversResponse?.data?.drivers || driversResponse?.data || []);
      } catch (err) {
        setError('Error al cargar los datos para reportes');
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const reportData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filtrar envíos del mes actual
    const currentMonthShipments = shipments.filter(shipment => {
      const shipmentDate = new Date(shipment.createdAt);
      return shipmentDate.getMonth() === currentMonth &&
             shipmentDate.getFullYear() === currentYear;
    });

    // Calcular estadísticas por estado
    const statusStats = {
      delivered: shipments.filter(s => s.status === 'delivered').length,
      inTransit: shipments.filter(s => s.status === 'in-transit').length,
      pending: shipments.filter(s => s.status === 'pending').length,
      delayed: shipments.filter(s => s.status === 'delayed').length,
      cancelled: shipments.filter(s => s.status === 'cancelled').length,
    };

    // Calcular estadísticas por prioridad
    const priorityStats = {
      urgent: shipments.filter(s => s.priority === 'urgent').length,
      high: shipments.filter(s => s.priority === 'high').length,
      medium: shipments.filter(s => s.priority === 'medium').length,
      low: shipments.filter(s => s.priority === 'low').length,
    };

    // Calcular rendimiento de conductores
    const driverPerformance = drivers.map(driver => ({
      ...driver,
      onTimePercentage: driver.totalDeliveries > 0
        ? Math.round((driver.onTimeDeliveries / driver.totalDeliveries) * 100)
        : 0,
    })).sort((a, b) => b.onTimePercentage - a.onTimePercentage);

    // Calcular utilización de flota
    const fleetUtilization = {
      inUse: vehicles.filter(v => v.status === 'in-use').length,
      available: vehicles.filter(v => v.status === 'available').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      offline: vehicles.filter(v => v.status === 'offline').length,
    };

    return {
      currentMonthShipments,
      statusStats,
      priorityStats,
      driverPerformance,
      fleetUtilization,
    };
  }, [shipments, vehicles, drivers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Generando reportes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al generar reportes: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes y Analytics</h1>
          <p className="text-gray-600">Análisis de rendimiento y estadísticas operacionales</p>
        </div>

        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Filtrar Periodo</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Envíos Este Mes"
          value={reportData.currentMonthShipments.length}
          icon={Package}
          trend={{ value: 15, isPositive: true }}
        />

        <StatsCard
          title="Tasa de Entregas"
          value={`${Math.round((reportData.statusStats.delivered / shipments.length) * 100)}%`}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />

        <StatsCard
          title="Utilización Flota"
          value={`${Math.round((reportData.fleetUtilization.inUse / vehicles.length) * 100)}%`}
          icon={Truck}
          trend={{ value: 5, isPositive: true }}
        />

        <StatsCard
          title="Conductores Activos"
          value={drivers.filter(d => d.status !== 'suspended' && d.status !== 'off-duty').length}
          icon={Users}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de Envíos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Estado de Envíos</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {Object.entries(reportData.statusStats).map(([status, count]) => {
              const percentage = Math.round((count / shipments.length) * 100);
              const statusColors: { [key: string]: string } = {
                delivered: 'bg-green-500',
                inTransit: 'bg-blue-500',
                pending: 'bg-yellow-500',
                delayed: 'bg-orange-500',
                cancelled: 'bg-red-500',
              };
              const statusLabels: { [key: string]: string } = {
                delivered: 'Entregados',
                inTransit: 'En Tránsito',
                pending: 'Pendientes',
                delayed: 'Retrasados',
                cancelled: 'Cancelados',
              };

              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${statusColors[status]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Utilización de Flota */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Utilización de Flota</h3>
            <Truck className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {Object.entries(reportData.fleetUtilization).map(([status, count]) => {
              const percentage = Math.round((count / vehicles.length) * 100);
              const statusColors: { [key: string]: string } = {
                inUse: 'bg-blue-500',
                available: 'bg-green-500',
                maintenance: 'bg-orange-500',
                offline: 'bg-red-500',
              };
              const statusLabels: { [key: string]: string } = {
                inUse: 'En Uso',
                available: 'Disponibles',
                maintenance: 'Mantenimiento',
                offline: 'Fuera de Servicio',
              };

              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${statusColors[status]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rendimiento de Conductores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Conductores por Rendimiento</h3>
          <p className="text-sm text-gray-600">Basado en tasa de entregas a tiempo</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conductor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Entregas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  A Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tasa Éxito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.driverPerformance.slice(0, 8).map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                    <div className="text-sm text-gray-500">{driver.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.totalDeliveries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.onTimeDeliveries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      driver.onTimePercentage >= 90
                        ? 'bg-green-100 text-green-800'
                        : driver.onTimePercentage >= 75
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.onTimePercentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.rating.toFixed(1)} ⭐
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
