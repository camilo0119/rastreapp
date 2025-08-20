import express, { Request, Response, NextFunction } from 'express';
import Driver from '../models/Driver.js';
import { DriverFilters, PaginatedResponse, IDriver, CacheEntry } from '../types/index.js';

const router = express.Router();

// Cache simple en memoria
const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// GET /api/drivers - Obtener todos los conductores
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'rating', sortOrder = 'desc' } = req.query as DriverFilters;

    const cacheKey = `drivers:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    // Construir filtros
    const filters: any = {};
    if (status) filters.status = status;

    // Construir ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Paginación
    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    // Ejecutar consulta
    const [drivers, total] = await Promise.all([
      Driver.find(filters)
        .populate('currentVehicle', 'plate type capacity')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit.toString()))
        .lean(),
      Driver.countDocuments(filters),
    ]);

    const result: PaginatedResponse<IDriver> = {
      drivers,
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

// GET /api/drivers/available - Obtener conductores disponibles
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drivers = await Driver.getAvailable();
    res.json(drivers);
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/:id - Obtener conductor por ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id)
      .populate('currentVehicle', 'plate type capacity')
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// POST /api/drivers - Crear nuevo conductor
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driverData = req.body;
    const driver = new Driver(driverData);
    await driver.save();

    // Limpiar cache relacionado
    cache.clear();

    res.status(201).json(driver);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Licencia o email duplicado',
      });
    }
    next(error);
  }
});

// PUT /api/drivers/:id - Actualizar conductor
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const driver = await Driver.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    ).populate('currentVehicle', 'plate type capacity');

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    // Limpiar cache relacionado
    cache.clear();

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/drivers/:id - Eliminar conductor
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByIdAndDelete(id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    // Limpiar cache relacionado
    cache.clear();

    res.json({
      success: true,
      message: 'Conductor eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/stats/status - Estadísticas por estado
router.get('/stats/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'drivers:stats:status';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const stats = await Driver.getStats();

    cache.set(cacheKey, {
      data: stats,
      timestamp: Date.now(),
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/status/:status - Obtener conductores por estado
router.get('/status/:status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.params;
    const drivers = await Driver.getByStatus(status);
    res.json(drivers);
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/top-rated - Obtener conductores con mejor rating
router.get('/top-rated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query;
    const drivers = await Driver.getTopRated(parseInt(limit.toString()));
    res.json(drivers);
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/experienced - Obtener conductores más experimentados
router.get('/experienced', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query;
    const drivers = await Driver.getMostExperienced(parseInt(limit.toString()));
    res.json(drivers);
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/search/:term - Buscar conductores
router.get('/search/:term', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term } = req.params;
    const drivers = await Driver.search(term);
    res.json(drivers);
  } catch (error) {
    next(error);
  }
});

// PUT /api/drivers/:id/assign-vehicle - Asignar vehículo
router.put('/:id/assign-vehicle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { vehicleId } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    await driver.assignVehicle(vehicleId);

    // Limpiar cache relacionado
    cache.clear();

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// PUT /api/drivers/:id/release - Liberar conductor
router.put('/:id/release', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    await driver.release();

    // Limpiar cache relacionado
    cache.clear();

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// PUT /api/drivers/:id/off-duty - Marcar como off-duty
router.put('/:id/off-duty', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    await driver.markOffDuty();

    // Limpiar cache relacionado
    cache.clear();

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// PUT /api/drivers/:id/suspend - Suspender conductor
router.put('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    await driver.suspend();

    // Limpiar cache relacionado
    cache.clear();

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// PUT /api/drivers/:id/rating - Actualizar rating
router.put('/:id/rating', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    await driver.updateRating(rating);

    // Limpiar cache relacionado
    cache.clear();

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// PUT /api/drivers/:id/record-delivery - Registrar entrega
router.put('/:id/record-delivery', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { onTime } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Conductor no encontrado',
      });
    }

    await driver.recordDelivery(onTime);

    // Limpiar cache relacionado
    cache.clear();

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

export default router;
