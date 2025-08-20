import express, { Request, Response, NextFunction } from 'express';
import Vehicle from '../models/Vehicle.js';
import { VehicleFilters, PaginatedResponse, IVehicle, CacheEntry } from '../types/index.js';

const router = express.Router();

// Cache simple en memoria
const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// GET /api/vehicles - Obtener todos los vehículos
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query as VehicleFilters;

    const cacheKey = `vehicles:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    // Construir filtros
    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    // Paginación
    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    // Ejecutar consulta
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filters)
        .populate('driver', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit.toString()))
        .lean(),
      Vehicle.countDocuments(filters),
    ]);

    const result: PaginatedResponse<IVehicle> = {
      vehicles,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / parseInt(limit.toString())),
      },
    };

    // Guardar en cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/available - Obtener vehículos disponibles
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicles = await Vehicle.getAvailable();
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/:id - Obtener vehículo por ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id)
      .populate('driver', 'name phone email')
      .lean();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles - Crear nuevo vehículo
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicleData = req.body;
    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    // Limpiar cache relacionado
    cache.clear();

    res.status(201).json(vehicle);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Matrícula duplicada',
      });
    }
    next(error);
  }
});

// PUT /api/vehicles/:id - Actualizar vehículo
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    ).populate('driver', 'name phone email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    // Limpiar cache relacionado
    cache.clear();

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vehicles/:id - Eliminar vehículo
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    // Limpiar cache relacionado
    cache.clear();

    res.json({
      success: true,
      message: 'Vehículo eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/stats/status - Estadísticas por estado
router.get('/stats/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'vehicles:stats:status';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const stats = await Vehicle.getStats();

    cache.set(cacheKey, {
      data: stats,
      timestamp: Date.now(),
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/type/:type - Obtener vehículos por tipo
router.get('/type/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const vehicles = await Vehicle.getByType(type);
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/maintenance - Obtener vehículos que necesitan mantenimiento
router.get('/maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicles = await Vehicle.getNeedingMaintenance();
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/capacity/:min/:max? - Obtener vehículos por capacidad
router.get('/capacity/:min/:max?', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { min, max } = req.params;
    const minCapacity = parseInt(min);
    const maxCapacity = max ? parseInt(max) : undefined;

    const vehicles = await Vehicle.getByCapacity(minCapacity, maxCapacity);
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// PUT /api/vehicles/:id/assign - Asignar conductor
router.put('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    await vehicle.assignDriver(driverId);

    // Limpiar cache relacionado
    cache.clear();

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// PUT /api/vehicles/:id/release - Liberar vehículo
router.put('/:id/release', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    await vehicle.release();

    // Limpiar cache relacionado
    cache.clear();

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// PUT /api/vehicles/:id/maintenance - Enviar a mantenimiento
router.put('/:id/maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    await vehicle.sendToMaintenance();

    // Limpiar cache relacionado
    cache.clear();

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// PUT /api/vehicles/:id/offline - Marcar como offline
router.put('/:id/offline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    await vehicle.markOffline();

    // Limpiar cache relacionado
    cache.clear();

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// PUT /api/vehicles/:id/update-maintenance - Actualizar mantenimiento
router.put('/:id/update-maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado',
      });
    }

    await vehicle.updateMaintenance();

    // Limpiar cache relacionado
    cache.clear();

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

export default router;
