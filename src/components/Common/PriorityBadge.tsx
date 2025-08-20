import React from 'react';
import { Shipment } from '../../types';

interface PriorityBadgeProps {
  priority: Shipment['priority'];
  size?: 'sm' | 'md';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const getPriorityConfig = (priority: Shipment['priority']) => {
    switch (priority) {
      case 'low':
        return {
          label: 'Baja',
          className: 'bg-gray-100 text-gray-700 border-gray-200',
        };
      case 'medium':
        return {
          label: 'Media',
          className: 'bg-blue-100 text-blue-700 border-blue-200',
        };
      case 'high':
        return {
          label: 'Alta',
          className: 'bg-orange-100 text-orange-700 border-orange-200',
        };
      case 'urgent':
        return {
          label: 'Urgente',
          className: 'bg-red-100 text-red-700 border-red-200',
        };
      default:
        return {
          label: 'Sin prioridad',
          className: 'bg-gray-100 text-gray-700 border-gray-200',
        };
    }
  };

  const config = getPriorityConfig(priority);
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

export default PriorityBadge;
