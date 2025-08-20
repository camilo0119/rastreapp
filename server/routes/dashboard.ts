import express, { Request, Response, NextFunction } from 'express';
import Shipment from '../models/Shipment.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { DashboardStats, PerformanceMetrics, CacheEntry, IShipment } from '../types/index.js';

const router = express.Router();

// Cache on memory
const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos para dashboard

// GET /api/dashboard/stats - Obtener estadísticas del dashboard
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'dashboard:stats';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    // Obtener estadísticas de todas las entidades
    const [shipmentStats, vehicleStats, driverStats] = await Promise.all([
      Shipment.getStats(),
      Vehicle.getStats(),
      Driver.getStats(),
    ]);

    // Combinar estadísticas
    const dashboardStats: DashboardStats = {
      // Estadísticas de envíos
      totalShipments: shipmentStats.totalShipments,
      inTransit: shipmentStats.inTransit,
      delivered: shipmentStats.delivered,
      pending: shipmentStats.pending,
      delayed: shipmentStats.delayed,
      cancelled: shipmentStats.cancelled,

      // Estadísticas de vehículos
      totalVehicles: vehicleStats.totalVehicles,
      availableVehicles: vehicleStats.available,
      inUseVehicles: vehicleStats.inUse,
      maintenanceVehicles: vehicleStats.maintenance,
      offlineVehicles: vehicleStats.offline,

      // Estadísticas de conductores
      totalDrivers: driverStats.totalDrivers,
      availableDrivers: driverStats.available,
      onDeliveryDrivers: driverStats.onDelivery,
      offDutyDrivers: driverStats.offDuty,
      suspendedDrivers: driverStats.suspended,

      // Métricas calculadas
      onTimeDeliveryRate: driverStats.onTimeDeliveryRate,
      avgDriverRating: Math.round(driverStats.avgRating * 10) / 10,

      // Timestamp de la última actualización
      lastUpdated: new Date().toISOString(),
    };

    // Guardar en cache
    cache.set(cacheKey, {
      data: dashboardStats,
      timestamp: Date.now(),
    });

    return res.json(dashboardStats);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/recent-shipments - Obtener envíos recientes
router.get('/recent-shipments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 5 } = req.query;

    const cacheKey = `dashboard:recent-shipments:${limit}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const recentShipments = await Shipment.getRecent(parseInt(limit.toString()));

    // Guardar en cache
    cache.set(cacheKey, {
      data: recentShipments,
      timestamp: Date.now(),
    });

    return res.json(recentShipments);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/performance - Obtener métricas de rendimiento
router.get('/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'dashboard:performance';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    // Calcular métricas de rendimiento
    const [totalDelivered, onTimeDelivered, totalInTransit, avgDeliveryTime] = await Promise.all([
      Shipment.countDocuments({ status: 'delivered' }),
      Shipment.aggregate([
        {
          $match: {
            status: 'delivered',
            actualDelivery: { $exists: true, $ne: null },
            estimatedDelivery: { $exists: true, $ne: null },
          },
        },
        {
          $addFields: {
            isOnTime: { $lte: ['$actualDelivery', '$estimatedDelivery'] },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            onTimeCount: { $sum: { $cond: ['$isOnTime', 1, 0] } },
          },
        },
      ]),
      Shipment.countDocuments({ status: 'in-transit' }),
      Shipment.aggregate([
        { $match: { status: 'delivered', actualDelivery: { $exists: true } } },
        {
          $addFields: {
            deliveryTime: {
              $divide: [
                { $subtract: ['$actualDelivery', '$createdAt'] },
                1000 * 60 * 60, // Convertir a horas
              ],
            },
          },
        },
        { $group: { _id: null, avgTime: { $avg: '$deliveryTime' } } },
      ]),
    ]);

    const onTimeResult = onTimeDelivered.length > 0 ? onTimeDelivered[0] : { count: 0, onTimeCount: 0 };
    
    const performance: PerformanceMetrics = {
      deliverySuccessRate: totalDelivered > 0
        ? Math.round((onTimeResult.onTimeCount / totalDelivered) * 100)
        : 0,
      activeShipments: totalInTransit,
      avgDeliveryTimeHours: avgDeliveryTime.length > 0
        ? Math.round(avgDeliveryTime[0].avgTime * 10) / 10
        : 0,
      lastUpdated: new Date().toISOString(),
    };

    // Guardar en cache
    cache.set(cacheKey, {
      data: performance,
      timestamp: Date.now(),
    });

    return res.json(performance);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/urgent-shipments - Obtener envíos urgentes
router.get('/urgent-shipments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const urgentShipments = await Shipment.getUrgent();
    return res.json(urgentShipments);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/delayed-shipments - Obtener envíos retrasados
router.get('/delayed-shipments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const delayedShipments = await Shipment.getDelayed();
    return res.json(delayedShipments);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/vehicles-maintenance - Obtener vehículos que necesitan mantenimiento
router.get('/vehicles-maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehiclesNeedingMaintenance = await Vehicle.getNeedingMaintenance();
    return res.json(vehiclesNeedingMaintenance);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/top-drivers - Obtener conductores con mejor rating
router.get('/top-drivers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 5 } = req.query;
    const topDrivers = await Driver.getTopRated(parseInt(limit.toString()));
    return res.json(topDrivers);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/available-resources - Obtener recursos disponibles
router.get('/available-resources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [availableVehicles, availableDrivers] = await Promise.all([
      Vehicle.getAvailable(),
      Driver.getAvailable(),
    ]);

    return res.json({
      availableVehicles,
      availableDrivers,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/shipments-by-status - Obtener distribución de envíos por estado
router.get('/shipments-by-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'dashboard:shipments-by-status';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const [pending, inTransit, delivered, delayed, cancelled] = await Promise.all([
      Shipment.countDocuments({ status: 'pending' }),
      Shipment.countDocuments({ status: 'in-transit' }),
      Shipment.countDocuments({ status: 'delivered' }),
      Shipment.countDocuments({ status: 'delayed' }),
      Shipment.countDocuments({ status: 'cancelled' }),
    ]);

    const distribution = {
      pending,
      inTransit,
      delivered,
      delayed,
      cancelled,
      total: pending + inTransit + delivered + delayed + cancelled,
      lastUpdated: new Date().toISOString(),
    };

    // Guardar en cache
    cache.set(cacheKey, {
      data: distribution,
      timestamp: Date.now(),
    });

    return res.json(distribution);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/vehicles-by-type - Obtener distribución de vehículos por tipo
router.get('/vehicles-by-type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'dashboard:vehicles-by-type';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const [trucks, vans, trailers, pickups] = await Promise.all([
      Vehicle.countDocuments({ type: 'truck' }),
      Vehicle.countDocuments({ type: 'van' }),
      Vehicle.countDocuments({ type: 'trailer' }),
      Vehicle.countDocuments({ type: 'pickup' }),
    ]);

    const distribution = {
      truck: trucks,
      van: vans,
      trailer: trailers,
      pickup: pickups,
      total: trucks + vans + trailers + pickups,
      lastUpdated: new Date().toISOString(),
    };

    // Guardar en cache
    cache.set(cacheKey, {
      data: distribution,
      timestamp: Date.now(),
    });

    return res.json(distribution);
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/drivers-by-experience - Obtener distribución de conductores por experiencia
router.get('/drivers-by-experience', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'dashboard:drivers-by-experience';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const [beginners, intermediate, advanced, expert] = await Promise.all([
      Driver.countDocuments({ totalDeliveries: { $lt: 50 } }),
      Driver.countDocuments({ totalDeliveries: { $gte: 50, $lt: 200 } }),
      Driver.countDocuments({ totalDeliveries: { $gte: 200, $lt: 500 } }),
      Driver.countDocuments({ totalDeliveries: { $gte: 500 } }),
    ]);

    const distribution = {
      beginner: beginners,
      intermediate,
      advanced,
      expert,
      total: beginners + intermediate + advanced + expert,
      lastUpdated: new Date().toISOString(),
    };

    // Guardar en cache
    cache.set(cacheKey, {
      data: distribution,
      timestamp: Date.now(),
    });

    return res.json(distribution);
  } catch (error) {
    return next(error);
  }
});

export default router;
