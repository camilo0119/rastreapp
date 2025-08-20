import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Shipment from '../models/Shipment.js';
import { IShipment, IVehicle, IDriver } from '../types/index.js';

dotenv.config();

// Datos de prueba para conductores
const driversData: Partial<IDriver>[] = [
  {
    name: 'Carlos Mendoza',
    license: 'DL-123456',
    phone: '+57 300 123 4567',
    email: 'carlos.mendoza@rastreapp.com',
    status: 'available',
    rating: 4.8,
    totalDeliveries: 245,
    onTimeDeliveries: 238,
  },
  {
    name: 'Ana Rodríguez',
    license: 'DL-789012',
    phone: '+57 300 987 6543',
    email: 'ana.rodriguez@rastreapp.com',
    status: 'on-delivery',
    rating: 4.9,
    totalDeliveries: 189,
    onTimeDeliveries: 185,
  },
  {
    name: 'Luis García',
    license: 'DL-345678',
    phone: '+57 300 555 1234',
    email: 'luis.garcia@rastreapp.com',
    status: 'available',
    rating: 4.6,
    totalDeliveries: 156,
    onTimeDeliveries: 148,
  },
  {
    name: 'María López',
    license: 'DL-901234',
    phone: '+57 300 777 8888',
    email: 'maria.lopez@rastreapp.com',
    status: 'off-duty',
    rating: 4.7,
    totalDeliveries: 203,
    onTimeDeliveries: 195,
  },
  {
    name: 'Juan Pérez',
    license: 'DL-567890',
    phone: '+57 300 444 5555',
    email: 'juan.perez@rastreapp.com',
    status: 'available',
    rating: 4.5,
    totalDeliveries: 98,
    onTimeDeliveries: 92,
  },
];

// Datos de prueba para vehículos
const vehiclesData: Partial<IVehicle>[] = [
  {
    plate: 'ABC-123',
    type: 'truck',
    capacity: 5000,
    status: 'available',
    lastMaintenance: new Date('2024-01-15'),
    nextMaintenance: new Date('2024-07-15'),
  },
  {
    plate: 'XYZ-789',
    type: 'van',
    capacity: 1500,
    status: 'in-use',
    lastMaintenance: new Date('2024-02-20'),
    nextMaintenance: new Date('2024-08-20'),
  },
  {
    plate: 'DEF-456',
    type: 'trailer',
    capacity: 8000,
    status: 'available',
    lastMaintenance: new Date('2024-03-10'),
    nextMaintenance: new Date('2024-09-10'),
  },
  {
    plate: 'GHI-789',
    type: 'pickup',
    capacity: 800,
    status: 'maintenance',
    lastMaintenance: new Date('2024-01-30'),
    nextMaintenance: new Date('2024-07-30'),
  },
  {
    plate: 'JKL-012',
    type: 'truck',
    capacity: 6000,
    status: 'available',
    lastMaintenance: new Date('2024-02-15'),
    nextMaintenance: new Date('2024-08-15'),
  },
];

// Función para generar datos de envíos
const generateShipmentsData = (drivers: any[], vehicles: any[]): Partial<IShipment>[] => {
  const origins = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'];
  const destinations = ['Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Villavicencio'];
  const customers = [
    { name: 'Empresa ABC', email: 'contacto@empresaabc.com', phone: '+57 1 234 5678' },
    { name: 'Comercio XYZ', email: 'info@comercioxyz.com', phone: '+57 1 345 6789' },
    { name: 'Distribuidora 123', email: 'ventas@distribuidora123.com', phone: '+57 1 456 7890' },
    { name: 'Logística Pro', email: 'admin@logisticapro.com', phone: '+57 1 567 8901' },
    { name: 'Transporte Express', email: 'servicio@transporteexpress.com', phone: '+57 1 678 9012' },
  ];
  const statuses: Array<'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled'> = [
    'pending', 'in-transit', 'delivered', 'delayed', 'cancelled',
  ];
  const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = [
    'low', 'medium', 'high', 'urgent',
  ];

  const shipments: Partial<IShipment>[] = [];

  for (let i = 1; i <= 25; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const destination = destinations[Math.floor(Math.random() * destinations.length)];

    // Solo asignar conductor y vehículo si está en tránsito o entregado
    const hasDriver = status === 'in-transit' || status === 'delivered';
    const driver = hasDriver ? drivers[Math.floor(Math.random() * drivers.length)] : undefined;
    const vehicle = hasDriver ? vehicles[Math.floor(Math.random() * vehicles.length)] : undefined;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 7) + 1);

    const actualDelivery = status === 'delivered' ? new Date(estimatedDelivery.getTime() + (Math.random() > 0.7 ? 24 * 60 * 60 * 1000 : 0)) : undefined;

    const shipment: Partial<IShipment> = {
      trackingNumber: `TRK-${String(i).padStart(6, '0')}`,
      origin,
      destination,
      status,
      priority,
      weight: Math.floor(Math.random() * 2000) + 100,
      customer,
      estimatedDelivery,
      actualDelivery,
      route: {
        distance: Math.floor(Math.random() * 500) + 50,
        estimatedTime: Math.floor(Math.random() * 8) + 2,
      },
      notes: status === 'delayed' ? ['Envío retrasado por condiciones climáticas'] : [],
    };

    if (driver && vehicle) {
      shipment.driver = {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicle: vehicle.plate,
      };
    }

    shipments.push(shipment);
  }

  return shipments;
};

// Función principal para poblar la base de datos
const seedDatabase = async (): Promise<void> => {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rastreapp';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colecciones existentes
    await Promise.all([
      Driver.deleteMany({}),
      Vehicle.deleteMany({}),
      Shipment.deleteMany({}),
    ]);
    console.log('🧹 Colecciones limpiadas');

    // Insertar conductores
    const drivers = await Driver.insertMany(driversData);
    console.log(`👥 ${drivers.length} conductores insertados`);

    // Insertar vehículos
    const vehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`🚛 ${vehicles.length} vehículos insertados`);

    // Generar y insertar envíos
    const shipmentsData = generateShipmentsData(drivers, vehicles);
    const shipments = await Shipment.insertMany(shipmentsData);
    console.log(`📦 ${shipments.length} envíos insertados`);

    // Mostrar estadísticas básicas
    const stats = await Shipment.getStats();
    console.log('\n📊 Estadísticas de envíos:');
    console.log(`   Total: ${stats.totalShipments}`);
    console.log(`   Pendientes: ${stats.pending}`);
    console.log(`   En tránsito: ${stats.inTransit}`);
    console.log(`   Entregados: ${stats.delivered}`);
    console.log(`   Retrasados: ${stats.delayed}`);
    console.log(`   Cancelados: ${stats.cancelled}`);

    console.log('\n✅ Base de datos poblada exitosamente');
    console.log('🎯 Puedes iniciar el servidor con: npm run server:dev');

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
};

// Ejecutar seed
seedDatabase();
