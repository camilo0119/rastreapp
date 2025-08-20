import React from 'react';
import { Shipment } from '../../types';

interface StatusBadgeProps {
  status: Shipment['status'];
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: Shipment['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      case 'in-transit':
        return {
          label: 'En tránsito',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'delivered':
        return {
          label: 'Entregado',
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'delayed':
        return {
          label: 'Retrasado',
          className: 'bg-orange-100 text-orange-800 border-orange-200',
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      default:
        return {
          label: 'Desconocido',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1 text-sm';

  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${config.className} ${sizeClasses}
    `}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
