import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Configuración del cliente de API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Cache simple en memoria
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para limpiar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

// Limpiar cache cada 10 minutos
setInterval(cleanExpiredCache, 10 * 60 * 1000);

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    // Agregar timestamp para debugging
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calcular tiempo de respuesta
    const endTime = new Date();
    const startTime = response.config.metadata?.startTime;
    const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;

    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);

    return response;
  },
  (error) => {
    // Manejo de errores
    const endTime = new Date();
    const startTime = error.config?.metadata?.startTime;
    const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;

    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'} (${duration}ms)`, error);

    // Manejo específico de errores
    if (error.response?.status === 404) {
      console.error('Recurso no encontrado');
    } else if (error.response?.status === 500) {
      console.error('Error interno del servidor');
    } else if (!error.response) {
      console.error('Error de conexión - Verificar que el servidor esté ejecutándose');
    }

    return Promise.reject(error);
  },
);

// Función helper para hacer requests con cache
export const cachedRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>,
  useCache: boolean = true,
): Promise<T> => {
  if (useCache) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const data = await requestFn();

    if (useCache) {
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });
    }

    return data;
  } catch (error) {
    console.error(`Error en cached request (${key}):`, error);
    throw error;
  }
};

// Función para limpiar cache específico
export const clearCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

export default apiClient;
