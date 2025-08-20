// Script de inicialización de MongoDB para Docker
// Este script se ejecuta automáticamente cuando se crea el contenedor

// Crear la base de datos y usuario
db = db.getSiblingDB('rastreapp');

// Crear usuario para la aplicación
db.createUser({
  user: 'rastreapp_user',
  pwd: 'rastreapp_password',
  roles: [
    {
      role: 'readWrite',
      db: 'rastreapp'
    }
  ]
});

// Crear colecciones con índices
db.createCollection('shipments');
db.createCollection('vehicles');
db.createCollection('drivers');

// Crear índices para optimizar consultas
db.shipments.createIndex({ "trackingNumber": 1 }, { unique: true });
db.shipments.createIndex({ "status": 1 });
db.shipments.createIndex({ "priority": 1 });
db.shipments.createIndex({ "createdAt": -1 });
db.shipments.createIndex({ "customer.name": "text", "origin": "text", "destination": "text" });

db.vehicles.createIndex({ "plate": 1 }, { unique: true });
db.vehicles.createIndex({ "status": 1 });
db.vehicles.createIndex({ "type": 1 });

db.drivers.createIndex({ "email": 1 }, { unique: true });
db.drivers.createIndex({ "status": 1 });
db.drivers.createIndex({ "vehicle": 1 });

print('✅ Base de datos rastreapp inicializada correctamente');
print('✅ Usuario rastreapp_user creado');
print('✅ Colecciones e índices creados');
