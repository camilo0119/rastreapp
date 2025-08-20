import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { Shipment } from '../../types';
import StatusBadge from '../Common/StatusBadge';
import PriorityBadge from '../Common/PriorityBadge';

interface RecentShipmentsProps {
  shipments: Shipment[];
}

const RecentShipments: React.FC<RecentShipmentsProps> = ({ shipments }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Envíos Recientes</h3>
        <p className="text-sm text-gray-600">Últimas actualizaciones del sistema</p>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {shipment.trackingNumber}
                  </h4>
                  <StatusBadge status={shipment.status} size="sm" />
                  <PriorityBadge priority={shipment.priority} size="sm" />
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{shipment.origin} → {shipment.destination}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{shipment.customer.name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Actualizado: {formatDate(shipment.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <p className="text-lg font-bold text-gray-900">
                  {shipment.weight} kg
                </p>
                <p className="text-sm text-gray-500">
                  {shipment.route.distance} km
                </p>
              </div>
            </div>
          </div>
        ))}

        {shipments.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay envíos recientes
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentShipments;
