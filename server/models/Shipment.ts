import mongoose, { Schema, Model } from 'mongoose';
import { IShipment, IShipmentModel, ShipmentStats } from '../types/index.js';

const shipmentSchema = new Schema<IShipment>({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delivered', 'delayed', 'cancelled'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  weight: {
    type: Number,
    required: true,
  },
  customer: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  driver: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    name: String,
    phone: String,
    vehicle: String,
  },
  estimatedDelivery: {
    type: Date,
    required: true,
  },
  actualDelivery: {
    type: Date,
  },
  route: {
    distance: {
      type: Number,
      required: true,
    },
    estimatedTime: {
      type: Number,
      required: true,
    },
  },
  notes: [{
    type: String,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Índices para optimizar consultas
shipmentSchema.index({ createdAt: -1 });
shipmentSchema.index({ status: 1, priority: 1 });
shipmentSchema.index({ 'customer.name': 'text', 'customer.email': 'text' });

// Método para calcular estadísticas
shipmentSchema.statics.getStats = async function(): Promise<ShipmentStats> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalShipments: { $sum: 1 },
        inTransit: {
          $sum: { $cond: [{ $eq: ['$status', 'in-transit'] }, 1, 0] },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        delayed: {
          $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || {
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    delayed: 0,
    cancelled: 0,
  };
};

// Método para obtener envíos por estado
shipmentSchema.statics.getByStatus = function(status: string) {
  return this.find({ status }).populate('driver.id', 'name phone email');
};

// Método para buscar envíos
shipmentSchema.statics.search = function(searchTerm: string) {
  return this.find({
    $or: [
      { trackingNumber: { $regex: searchTerm, $options: 'i' } },
      { 'customer.name': { $regex: searchTerm, $options: 'i' } },
      { origin: { $regex: searchTerm, $options: 'i' } },
      { destination: { $regex: searchTerm, $options: 'i' } },
    ],
  }).populate('driver.id', 'name phone email');
};

// Método para obtener envíos recientes
shipmentSchema.statics.getRecent = function(limit: number = 10) {
  return this.find()
    .populate('driver.id', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Método para obtener envíos por conductor
shipmentSchema.statics.getByDriver = function(driverId: string) {
  return this.find({ 'driver.id': driverId }).populate('driver.id', 'name phone email');
};

// Método para obtener envíos por rango de fechas
shipmentSchema.statics.getByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).populate('driver.id', 'name phone email');
};

// Método para obtener envíos urgentes
shipmentSchema.statics.getUrgent = function() {
  return this.find({ priority: 'urgent' }).populate('driver.id', 'name phone email');
};

// Método para obtener envíos retrasados
shipmentSchema.statics.getDelayed = function() {
  return this.find({
    status: 'delayed',
    estimatedDelivery: { $lt: new Date() },
  }).populate('driver.id', 'name phone email');
};

// Método para actualizar estado de envío
shipmentSchema.methods.updateStatus = function(newStatus: string, notes?: string) {
  this.status = newStatus;
  if (notes) {
    this.notes.push(notes);
  }
  this.updatedAt = new Date();
  return this.save();
};

// Método para marcar como entregado
shipmentSchema.methods.markAsDelivered = function(actualDeliveryDate?: Date) {
  this.status = 'delivered';
  this.actualDelivery = actualDeliveryDate || new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Método para calcular tiempo de entrega
shipmentSchema.methods.getDeliveryTime = function(): number | null {
  if (this.actualDelivery && this.createdAt) {
    return this.actualDelivery.getTime() - this.createdAt.getTime();
  }
  return null;
};

// Método para verificar si está a tiempo
shipmentSchema.methods.isOnTime = function(): boolean {
  if (this.actualDelivery && this.estimatedDelivery) {
    return this.actualDelivery <= this.estimatedDelivery;
  }
  return false;
};

// Virtual para calcular días de retraso
shipmentSchema.virtual('daysDelayed').get(function(): number {
  if (this.status === 'delayed' && this.estimatedDelivery) {
    const now = new Date();
    const diffTime = now.getTime() - this.estimatedDelivery.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual para calcular tiempo restante
shipmentSchema.virtual('timeRemaining').get(function(): number | null {
  if (this.status === 'in-transit' && this.estimatedDelivery) {
    const now = new Date();
    const diffTime = this.estimatedDelivery.getTime() - now.getTime();
    return Math.max(0, diffTime);
  }
  return null;
});

const Shipment: IShipmentModel = mongoose.model<IShipment, IShipmentModel>('Shipment', shipmentSchema);

export default Shipment;
