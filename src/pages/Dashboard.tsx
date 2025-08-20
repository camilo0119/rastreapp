import React from 'react';
import {
  Package,
  Truck,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentShipments from '../components/Dashboard/RecentShipments';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { stats, performance, recentShipments, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar el dashboard: {error}</p>
        <button
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vista general del sistema de gestión de transporte</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Envíos"
          value={stats?.totalShipments || 0}
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />

        <StatsCard
          title="En Tránsito"
          value={stats?.inTransit || 0}
          icon={Clock}
          className="border-l-4 border-l-blue-500"
        />

        <StatsCard
          title="Entregados"
          value={stats?.delivered || 0}
          icon={CheckCircle}
          className="border-l-4 border-l-green-500"
        />

        <StatsCard
          title="Vehículos Disponibles"
          value={stats?.availableVehicles || 0}
          icon={Truck}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard
          title="Conductores Activos"
          value={stats?.activeDrivers || 0}
          icon={Users}
        />

        <StatsCard
          title="Entregas a Tiempo"
          value={`${stats?.onTimeDeliveryRate || 0}%`}
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Estado de Envíos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Pendientes</span>
              </div>
              <span className="text-sm font-medium">{stats?.pending || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Retrasados</span>
              </div>
              <span className="text-sm font-medium">{stats?.delayed || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Cancelados</span>
              </div>
              <span className="text-sm font-medium">{stats?.cancelled || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <RecentShipments shipments={recentShipments} />
    </div>
  );
};

export default Dashboard;
