import express, { Request, Response, NextFunction } from 'express';
import Shipment from '../models/Shipment.js';
import { ShipmentFilters, PaginatedResponse, IShipment, CacheEntry } from '../types/index.js';

const router = express.Router();

// Cache simple en memoria
const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para limpiar cache expirado
const cleanExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

// Limpiar cache cada 10 minutos
setInterval(cleanExpiredCache, 10 * 60 * 1000);

// GET /api/shipments - Obtener todos los envíos con filtros
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      priority,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as ShipmentFilters;

    const cacheKey = `shipments:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    // Construir filtros
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    if (search) {
      filters.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { origin: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }

    // Construir ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Paginación
    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    // Ejecutar consulta
    const [shipments, total] = await Promise.all([
      Shipment.find(filters)
        .populate('driver.id', 'name phone email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit.toString()))
        .lean(),
      Shipment.countDocuments(filters),
    ]);

    const result: PaginatedResponse<IShipment> = {
      shipments,
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

// GET /api/shipments/:id - Obtener envío por ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id)
      .populate('driver.id', 'name phone email')
      .lean();

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado',
      });
    }

    res.json(shipment);
  } catch (error) {
    next(error);
  }
});

// POST /api/shipments - Crear nuevo envío
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shipmentData = req.body;
    const shipment = new Shipment(shipmentData);
    await shipment.save();

    // Limpiar cache relacionado
    cache.clear();

    res.status(201).json(shipment);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Número de seguimiento duplicado',
      });
    }
    next(error);
  }
});

// PUT /api/shipments/:id - Actualizar envío
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const shipment = await Shipment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    ).populate('driver.id', 'name phone email');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado',
      });
    }

    // Limpiar cache relacionado
    cache.clear();

    res.json(shipment);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/shipments/:id - Eliminar envío
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findByIdAndDelete(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado',
      });
    }

    // Limpiar cache relacionado
    cache.clear();

    res.json({
      success: true,
      message: 'Envío eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/shipments/stats/status - Estadísticas por estado
router.get('/stats/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'shipments:stats:status';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const stats = await Shipment.getStats();

    cache.set(cacheKey, {
      data: stats,
      timestamp: Date.now(),
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/shipments/search/:term - Buscar envíos
router.get('/search/:term', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term } = req.params;
    const shipments = await Shipment.search(term);
    res.json(shipments);
  } catch (error) {
    next(error);
  }
});

// GET /api/shipments/status/:status - Obtener envíos por estado
router.get('/status/:status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.params;
    const shipments = await Shipment.getByStatus(status);
    res.json(shipments);
  } catch (error) {
    next(error);
  }
});

// GET /api/shipments/urgent - Obtener envíos urgentes
router.get('/urgent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shipments = await Shipment.getUrgent();
    res.json(shipments);
  } catch (error) {
    next(error);
  }
});

// GET /api/shipments/delayed - Obtener envíos retrasados
router.get('/delayed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shipments = await Shipment.getDelayed();
    res.json(shipments);
  } catch (error) {
    next(error);
  }
});

// PUT /api/shipments/:id/status - Actualizar estado de envío
router.put('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado',
      });
    }

    await shipment.updateStatus(status, notes);

    // Limpiar cache relacionado
    cache.clear();

    res.json(shipment);
  } catch (error) {
    next(error);
  }
});

// PUT /api/shipments/:id/deliver - Marcar como entregado
router.put('/:id/deliver', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { actualDeliveryDate } = req.body;

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado',
      });
    }

    const deliveryDate = actualDeliveryDate ? new Date(actualDeliveryDate) : undefined;
    await shipment.markAsDelivered(deliveryDate);

    // Limpiar cache relacionado
    cache.clear();

    res.json(shipment);
  } catch (error) {
    next(error);
  }
});

export default router;
