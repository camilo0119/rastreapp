import mongoose, { Schema, Model } from 'mongoose';
import { IDriver, IDriverModel, DriverStats } from '../types/index.js';

const driverSchema = new Schema<IDriver>({
  name: {
    type: String,
    required: true,
  },
  license: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['available', 'on-delivery', 'off-duty', 'suspended'],
    default: 'available',
  },
  currentVehicle: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  onTimeDeliveries: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Índices para optimizar consultas
driverSchema.index({ status: 1 });
driverSchema.index({ rating: -1 });

// Método para obtener conductores disponibles
driverSchema.statics.getAvailable = function() {
  return this.find({ status: 'available' }).populate('currentVehicle');
};

// Método para obtener estadísticas de conductores
driverSchema.statics.getStats = async function(): Promise<DriverStats> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalDrivers: { $sum: 1 },
        available: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] },
        },
        onDelivery: {
          $sum: { $cond: [{ $eq: ['$status', 'on-delivery'] }, 1, 0] },
        },
        offDuty: {
          $sum: { $cond: [{ $eq: ['$status', 'off-duty'] }, 1, 0] },
        },
        suspended: {
          $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] },
        },
        avgRating: { $avg: '$rating' },
        totalDeliveries: { $sum: '$totalDeliveries' },
        onTimeDeliveries: { $sum: '$onTimeDeliveries' },
      },
    },
  ]);

  const result = stats[0] || {
    totalDrivers: 0,
    available: 0,
    onDelivery: 0,
    offDuty: 0,
    suspended: 0,
    avgRating: 0,
    totalDeliveries: 0,
    onTimeDeliveries: 0,
  };

  // Calcular porcentaje de entregas a tiempo
  result.onTimeDeliveryRate = result.totalDeliveries > 0
    ? Math.round((result.onTimeDeliveries / result.totalDeliveries) * 100)
    : 0;

  return result;
};

// Método para obtener conductores por estado
driverSchema.statics.getByStatus = function(status: string) {
  return this.find({ status }).populate('currentVehicle');
};

// Método para obtener conductores con mejor rating
driverSchema.statics.getTopRated = function(limit: number = 10) {
  return this.find()
    .sort({ rating: -1 })
    .limit(limit)
    .populate('currentVehicle');
};

// Método para obtener conductores más experimentados
driverSchema.statics.getMostExperienced = function(limit: number = 10) {
  return this.find()
    .sort({ totalDeliveries: -1 })
    .limit(limit)
    .populate('currentVehicle');
};

// Método para buscar conductores
driverSchema.statics.search = function(searchTerm: string) {
  return this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { license: { $regex: searchTerm, $options: 'i' } },
    ],
  }).populate('currentVehicle');
};

// Método para asignar vehículo
driverSchema.methods.assignVehicle = function(vehicleId: string) {
  this.currentVehicle = vehicleId;
  this.status = 'on-delivery';
  this.updatedAt = new Date();
  return this.save();
};

// Método para liberar conductor
driverSchema.methods.release = function() {
  this.currentVehicle = undefined;
  this.status = 'available';
  this.updatedAt = new Date();
  return this.save();
};

// Método para marcar como off-duty
driverSchema.methods.markOffDuty = function() {
  this.currentVehicle = undefined;
  this.status = 'off-duty';
  this.updatedAt = new Date();
  return this.save();
};

// Método para suspender conductor
driverSchema.methods.suspend = function() {
  this.currentVehicle = undefined;
  this.status = 'suspended';
  this.updatedAt = new Date();
  return this.save();
};

// Método para actualizar rating
driverSchema.methods.updateRating = function(newRating: number) {
  this.rating = Math.max(0, Math.min(5, newRating));
  this.updatedAt = new Date();
  return this.save();
};

// Método para registrar entrega
driverSchema.methods.recordDelivery = function(onTime: boolean) {
  this.totalDeliveries += 1;
  if (onTime) {
    this.onTimeDeliveries += 1;
  }
  this.updatedAt = new Date();
  return this.save();
};

// Método para calcular porcentaje de entregas a tiempo
driverSchema.methods.getOnTimeDeliveryRate = function(): number {
  if (this.totalDeliveries === 0) return 0;
  return Math.round((this.onTimeDeliveries / this.totalDeliveries) * 100);
};

// Método para verificar si es conductor experimentado
driverSchema.methods.isExperienced = function(): boolean {
  return this.totalDeliveries >= 100;
};

// Método para verificar si es conductor confiable
driverSchema.methods.isReliable = function(): boolean {
  return this.rating >= 4.5 && this.getOnTimeDeliveryRate() >= 90;
};

// Virtual para calcular porcentaje de entregas a tiempo
driverSchema.virtual('onTimeDeliveryRate').get(function(): number {
  if (this.totalDeliveries === 0) return 0;
  return Math.round((this.onTimeDeliveries / this.totalDeliveries) * 100);
});

// Virtual para obtener nivel de experiencia
driverSchema.virtual('experienceLevel').get(function(): string {
  if (this.totalDeliveries >= 500) return 'Experto';
  if (this.totalDeliveries >= 200) return 'Avanzado';
  if (this.totalDeliveries >= 50) return 'Intermedio';
  return 'Principiante';
});

// Virtual para obtener estado de confiabilidad
driverSchema.virtual('reliabilityStatus').get(function(): string {
  if (this.rating >= 4.5 && this.onTimeDeliveryRate >= 90) return 'Excelente';
  if (this.rating >= 4.0 && this.onTimeDeliveryRate >= 80) return 'Bueno';
  if (this.rating >= 3.5 && this.onTimeDeliveryRate >= 70) return 'Regular';
  return 'Necesita mejorar';
});

// Virtual para obtener información de contacto
driverSchema.virtual('contactInfo').get(function(): string {
  return `${this.name} - ${this.phone} (${this.email})`;
});

const Driver: IDriverModel = mongoose.model<IDriver, IDriverModel>('Driver', driverSchema);

export default Driver;
