import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import shipmentRoutes from './routes/shipments.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import dashboardRoutes from './routes/dashboard.js';
import { ServerConfig, DatabaseConfig, AppError } from './types/index.js';

dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Configuración del servidor
const serverConfig: ServerConfig = {
  port: PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

// Configuración de la base de datos
const databaseConfig: DatabaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rastreapp',
  options: {
    // MongoDB connection options (deprecated options removed)
  },
};

// Middleware
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(databaseConfig.uri, databaseConfig.options);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Rutas
app.use('/api/shipments', shipmentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de salud
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'RastreApp API funcionando correctamente',
    version: '1.0.0',
    environment: serverConfig.nodeEnv,
  });
});

// Middleware de manejo de errores
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(serverConfig.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// Ruta 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

// Función para iniciar el servidor
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(serverConfig.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${serverConfig.port}`);
      console.log(`📊 API disponible en http://localhost:${serverConfig.port}/api`);
      console.log(`🌍 Entorno: ${serverConfig.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  mongoose.connection.close().then(() => {
    console.log('✅ Conexión a MongoDB cerrada');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  mongoose.connection.close().then(() => {
    console.log('✅ Conexión a MongoDB cerrada');
    process.exit(0);
  });
});

// Iniciar servidor
startServer();
