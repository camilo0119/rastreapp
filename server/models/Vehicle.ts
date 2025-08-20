import mongoose, { Schema, Model } from 'mongoose';
import { IVehicle, IVehicleModel, VehicleStats } from '../types/index.js';

const vehicleSchema = new Schema<IVehicle>({
  plate: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['truck', 'van', 'trailer', 'pickup'],
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance', 'offline'],
    default: 'available',
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
  },
  lastMaintenance: {
    type: Date,
    required: true,
  },
  nextMaintenance: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Índices para optimizar consultas
vehicleSchema.index({ status: 1, type: 1 });
vehicleSchema.index({ nextMaintenance: 1 });

// Método para obtener vehículos disponibles
vehicleSchema.statics.getAvailable = function() {
  return this.find({ status: 'available' }).populate('driver');
};

// Método para obtener estadísticas de vehículos
vehicleSchema.statics.getStats = async function(): Promise<VehicleStats> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalVehicles: { $sum: 1 },
        available: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] },
        },
        inUse: {
          $sum: { $cond: [{ $eq: ['$status', 'in-use'] }, 1, 0] },
        },
        maintenance: {
          $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] },
        },
        offline: {
          $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || {
    totalVehicles: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    offline: 0,
  };
};

// Método para obtener vehículos por tipo
vehicleSchema.statics.getByType = function(type: string) {
  return this.find({ type }).populate('driver');
};

// Método para obtener vehículos que necesitan mantenimiento
vehicleSchema.statics.getNeedingMaintenance = function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return this.find({
    nextMaintenance: { $lte: thirtyDaysFromNow },
  }).populate('driver');
};

// Método para obtener vehículos por capacidad
vehicleSchema.statics.getByCapacity = function(minCapacity: number, maxCapacity?: number) {
  const query: any = { capacity: { $gte: minCapacity } };
  if (maxCapacity) {
    query.capacity.$lte = maxCapacity;
  }
  return this.find(query).populate('driver');
};

// Método para asignar conductor
vehicleSchema.methods.assignDriver = function(driverId: string) {
  this.driver = driverId;
  this.status = 'in-use';
  this.updatedAt = new Date();
  return this.save();
};

// Método para liberar vehículo
vehicleSchema.methods.release = function() {
  this.driver = undefined;
  this.status = 'available';
  this.updatedAt = new Date();
  return this.save();
};

// Método para enviar a mantenimiento
vehicleSchema.methods.sendToMaintenance = function() {
  this.status = 'maintenance';
  this.driver = undefined;
  this.updatedAt = new Date();
  return this.save();
};

// Método para marcar como offline
vehicleSchema.methods.markOffline = function() {
  this.status = 'offline';
  this.driver = undefined;
  this.updatedAt = new Date();
  return this.save();
};

// Método para actualizar mantenimiento
vehicleSchema.methods.updateMaintenance = function() {
  this.lastMaintenance = new Date();
  this.nextMaintenance = new Date();
  this.nextMaintenance.setMonth(this.nextMaintenance.getMonth() + 6); // 6 meses
  this.status = 'available';
  this.updatedAt = new Date();
  return this.save();
};

// Virtual para calcular días hasta próximo mantenimiento
vehicleSchema.virtual('daysUntilMaintenance').get(function(): number {
  const now = new Date();
  const diffTime = this.nextMaintenance.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual para verificar si necesita mantenimiento pronto
vehicleSchema.virtual('needsMaintenanceSoon').get(function(): boolean {
  return this.daysUntilMaintenance <= 30;
});

// Virtual para calcular días desde último mantenimiento
vehicleSchema.virtual('daysSinceLastMaintenance').get(function(): number {
  const now = new Date();
  const diffTime = now.getTime() - this.lastMaintenance.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual para obtener información de capacidad
vehicleSchema.virtual('capacityInfo').get(function(): string {
  const capacityInTons = this.capacity / 1000;
  return `${capacityInTons.toFixed(1)} toneladas`;
});

const Vehicle: IVehicleModel = mongoose.model<IVehicle, IVehicleModel>('Vehicle', vehicleSchema);

export default Vehicle;
