# 🚛 RastreApp - Sistema de Gestión de Transporte

Una aplicación moderna y completa de gestión de transporte construida con React, TypeScript, Node.js y MongoDB. Incluye gestión de envíos, flota de vehículos, conductores y dashboard en tiempo real.

## 📋 Tabla de Contenidos

- [🚀 Características](#-características)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📋 Requisitos Previos](#-requisitos-previos)
- [🚀 Instalación Rápida](#-instalación-rápida)
- [🐳 Docker (Recomendado)](#-docker-recomendado)
- [🔧 Instalación Manual](#-instalación-manual)
- [📊 Configuración de Base de Datos](#-configuración-de-base-de-datos)
- [🔧 Scripts Disponibles](#-scripts-disponibles)
- [📡 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [📈 Métricas de Rendimiento](#-métricas-de-rendimiento)
- [🚀 Despliegue](#-despliegue)
- [🤝 Contribución](#-contribución)

## 🚀 Características

### ✨ Funcionalidades Principales
- **Dashboard en tiempo real** con estadísticas y métricas de rendimiento
- **Gestión completa de envíos** con seguimiento de estado y prioridades
- **Búsqueda global** desde el header con navegación automática
- **Filtros avanzados** con debounce y mantenimiento de foco
- **Gestión de flota** de vehículos y conductores
- **API RESTful** con caché inteligente y manejo de errores
- **Base de datos MongoDB** con modelos optimizados

### 🎨 Experiencia de Usuario
- **Interfaz responsiva** construida con Tailwind CSS
- **Navegación fluida** con React Router
- **Búsqueda en tiempo real** con debounce optimizado
- **Mantenimiento de foco** durante actualizaciones de API
- **Estados de carga** y manejo de errores elegante

### 🔧 Calidad de Código
- **TypeScript estricto** para mayor seguridad de tipos
- **ESLint configurado** con reglas estrictas
- **Pruebas unitarias** con Vitest y Testing Library
- **Optimización de rendimiento** con lazy loading y code splitting

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** para build y desarrollo
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **React Router DOM** para navegación
- **Axios** para llamadas a API
- **React Context** para estado global

### Backend
- **Node.js** con Express
- **TypeScript** para tipado estricto
- **MongoDB** con Mongoose ODM
- **Caché en memoria** con TTL configurable
- **Validación de datos** y manejo de errores centralizado
- **Nodemon** para desarrollo con hot reload

### Base de Datos
- **MongoDB 6+** como base de datos principal
- **Mongoose** para modelado de datos
- **Índices optimizados** para consultas rápidas
- **Scripts de seed** para datos de prueba

### Testing
- **Vitest** para pruebas unitarias
- **Testing Library** para pruebas de componentes
- **Cobertura de código** configurada

## 📋 Requisitos Previos

### Para Instalación Manual
- **Node.js 18+** ([Descargar](https://nodejs.org/))
- **MongoDB 6+** ([Instalar MongoDB](https://docs.mongodb.com/manual/installation/))
- **npm 9+** o **yarn 1.22+**

### Para Docker
- **Docker 20+** ([Descargar](https://www.docker.com/products/docker-desktop))
- **Docker Compose 2+** (incluido con Docker Desktop)

## 🚀 Instalación Rápida

### Opción 1: Docker (Recomendado) ⭐
```bash
# Clonar el repositorio
git clone <repository-url>
cd rastreapp

# Levantar todo el stack con Docker
docker-compose up -d

# La aplicación estará disponible en:
# Frontend: http://localhost:3000
# API: http://localhost:3001/api
# MongoDB: localhost:27017
```

### Opción 2: Instalación Manual
```bash
# Clonar el repositorio
git clone <repository-url>
cd rastreapp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env

# Iniciar MongoDB (ver sección de configuración)
# Luego ejecutar:
npm run dev:full
```

## 🐳 Docker (Recomendado)

### Estructura Docker
```
rastreapp/
├── docker-compose.yml          # Stack completo
├── Dockerfile                  # Frontend
├── Dockerfile.server           # Backend
└── docker/
    ├── mongo-init.js           # Inicialización de BD
    └── nginx.conf              # Configuración de proxy
```

### Comandos Docker

```bash
# Levantar todo el stack
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose up -d --build

# Solo levantar base de datos
docker-compose up -d mongodb

# Ejecutar seed de datos
docker-compose exec server npm run seed
```

### Puertos y Servicios
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **MongoDB**: localhost:27017
- **MongoDB Express**: http://localhost:8081 (opcional)

## 🔧 Instalación Manual

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd rastreapp
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Configuración de la base de datos
MONGODB_URI=mongodb://localhost:27017/rastreapp

# Configuración del servidor
PORT=3001
NODE_ENV=development

# Configuración de la API
API_BASE_URL=http://localhost:3001/api
```

### 4. Iniciar MongoDB

#### macOS (Homebrew)
```bash
# Instalar MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Iniciar servicio
brew services start mongodb-community

# Verificar estado
brew services list | grep mongodb
```

#### Ubuntu/Debian
```bash
# Instalar MongoDB
sudo apt update
sudo apt install mongodb

# Iniciar servicio
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar estado
sudo systemctl status mongod
```

#### Windows
```bash
# Instalar MongoDB desde https://www.mongodb.com/try/download/community
# Luego iniciar el servicio:
net start MongoDB
```

### 5. Poblar Base de Datos
```bash
npm run seed
```

### 6. Iniciar Desarrollo

#### Opción A: Todo en un comando
```bash
npm run dev:full
```

#### Opción B: Terminales separadas
```bash
# Terminal 1: Servidor backend
npm run server:dev

# Terminal 2: Frontend
npm run dev
```

### 7. Verificar Instalación
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3001/api/health
- **API Docs**: http://localhost:3001/api

## 📊 Configuración de Base de Datos

### Conectar con DBeaver
1. **Abrir DBeaver**
2. **Nueva Conexión** → **MongoDB**
3. **Configuración**:
   - **Host**: `localhost`
   - **Port**: `27017`
   - **Database**: `rastreapp`
   - **Authentication**: `None` (desarrollo)

### Estructura de la Base de Datos
```
rastreapp/
├── shipments/          # Envíos
├── vehicles/           # Vehículos
├── drivers/            # Conductores
└── system.indexes/     # Índices
```

### Datos de Prueba Incluidos
- **20 envíos** con diferentes estados y prioridades
- **10 vehículos** con estados de mantenimiento
- **8 conductores** con métricas de rendimiento
- **Datos realistas** de rutas colombianas

## 🔧 Scripts Disponibles

### Desarrollo
```bash
npm run dev                 # Frontend en modo desarrollo
npm run server:dev         # Servidor backend con hot reload
npm run dev:full           # Frontend + Backend en paralelo
npm run build              # Construir frontend para producción
npm run preview            # Previsualizar build de producción
```

### Base de Datos
```bash
npm run seed               # Poblar BD con datos de prueba
npm run seed:reset         # Limpiar y repoblar BD
```

### Testing
```bash
npm run test               # Ejecutar todas las pruebas
npm run test:ui            # Pruebas con interfaz visual
npm run test:coverage      # Reporte de cobertura
npm run test:watch         # Pruebas en modo watch
```

### Linting y Formato
```bash
npm run lint               # Ejecutar ESLint
npm run lint:fix           # Corregir errores automáticamente
npm run format             # Formatear código con Prettier
```

### Producción
```bash
npm run server:build       # Compilar servidor TypeScript
npm run server:start       # Iniciar servidor de producción
npm run start              # Iniciar aplicación completa
```

## 📡 API Endpoints

### Envíos (`/api/shipments`)
```http
GET    /api/shipments                    # Listar envíos con filtros
GET    /api/shipments/:id                # Obtener envío por ID
POST   /api/shipments                    # Crear nuevo envío
PUT    /api/shipments/:id                # Actualizar envío
DELETE /api/shipments/:id                # Eliminar envío
GET    /api/shipments/stats/status       # Estadísticas por estado
```

### Vehículos (`/api/vehicles`)
```http
GET    /api/vehicles                     # Listar vehículos
GET    /api/vehicles/available           # Vehículos disponibles
GET    /api/vehicles/:id                 # Obtener vehículo por ID
POST   /api/vehicles                     # Crear nuevo vehículo
PUT    /api/vehicles/:id                 # Actualizar vehículo
DELETE /api/vehicles/:id                 # Eliminar vehículo
```

### Conductores (`/api/drivers`)
```http
GET    /api/drivers                      # Listar conductores
GET    /api/drivers/available            # Conductores disponibles
GET    /api/drivers/:id                  # Obtener conductor por ID
POST   /api/drivers                      # Crear nuevo conductor
PUT    /api/drivers/:id                  # Actualizar conductor
DELETE /api/drivers/:id                  # Eliminar conductor
```

### Dashboard (`/api/dashboard`)
```http
GET    /api/dashboard/stats              # Estadísticas generales
GET    /api/dashboard/recent-shipments   # Envíos recientes
GET    /api/dashboard/performance        # Métricas de rendimiento
```

### Health Check
```http
GET    /api/health                       # Estado del servidor
```

### Parámetros de Consulta
```http
GET /api/shipments?search=TRK-001&status=delivered&priority=high&page=1&limit=20
```

## 🧪 Testing

### Ejecutar Pruebas
```bash
# Todas las pruebas
npm run test

# Con interfaz visual
npm run test:ui

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

### Estructura de Pruebas
```
src/test/
├── components/            # Pruebas de componentes
│   ├── Shipments.test.tsx
│   ├── Dashboard.test.tsx
│   └── ...
├── api/                  # Pruebas de servicios API
│   ├── shipments.test.ts
│   └── ...
└── setup.ts              # Configuración global
```

### Cobertura Mínima
- **Statements**: 80%
- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%

## 📈 Métricas de Rendimiento

### Bundle Analysis
```bash
npm run build
```

**Resultados típicos:**
- **Total Size**: ~550KB (gzipped)
- **JavaScript**: ~200KB
- **CSS**: ~22KB
- **Vendor**: ~313KB

### Optimizaciones Implementadas
- ✅ **Code Splitting** automático por rutas
- ✅ **Lazy Loading** de componentes
- ✅ **Tree Shaking** para eliminar código no usado
- ✅ **Caché en memoria** con TTL de 5 minutos
- ✅ **Debounce** en búsquedas (500ms)
- ✅ **Memoización** de componentes pesados

### Caché Strategy
- **Frontend**: React Query para caché de API
- **Backend**: Caché en memoria con invalidación automática
- **TTL**: 5 minutos para datos estáticos, 1 minuto para datos dinámicos

## 🚀 Despliegue

### Variables de Entorno de Producción
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db:27017/rastreapp
PORT=3001
API_BASE_URL=https://your-api-domain.com/api
```

### Docker Production
```bash
# Construir imágenes de producción
docker-compose -f docker-compose.prod.yml up -d

# Con nginx como proxy reverso
docker-compose -f docker-compose.prod.yml -f docker-compose.nginx.yml up -d
```

### Despliegue Manual
```bash
# Construir aplicación
npm run build

# Compilar servidor
npm run server:build

# Iniciar en producción
npm run start
```

### Monitoreo
- **Health Checks**: `/api/health`
- **Métricas**: `/api/dashboard/stats`
- **Logs**: Winston configurado para producción

## 🤝 Contribución

### Flujo de Contribución
1. **Fork** el proyecto
2. **Crear rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir Pull Request**

### Estándares de Código
- **TypeScript estricto** obligatorio
- **ESLint** debe pasar sin errores
- **Pruebas** para nuevas funcionalidades
- **Documentación** actualizada

### Estructura de Commits
```
feat: agregar búsqueda global en header
fix: corregir pérdida de foco en input de búsqueda
docs: actualizar README con instrucciones Docker
test: agregar pruebas para componente Shipments
```

## 📞 Soporte

### Recursos
- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]
- **Discusiones**: [GitHub Discussions]

### Contacto
- **Email**: soporte@rastreapp.com
- **Slack**: [Canal de soporte]

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

## 🔄 Changelog

### v1.0.0 (2025-01-20)
- ✅ API RESTful completa con MongoDB
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión de envíos, vehículos y conductores
- ✅ Sistema de caché inteligente
- ✅ Búsqueda global con navegación automática
- ✅ Filtros avanzados con debounce
- ✅ Mantenimiento de foco durante actualizaciones
- ✅ Pruebas unitarias completas
- ✅ TypeScript estricto
- ✅ Interfaz responsiva
- ✅ Optimización de rendimiento
- ✅ Docker completo con MongoDB
- ✅ Documentación detallada

---

**¿Necesitas ayuda?** Revisa la [documentación completa](docs/) o [abre un issue](https://github.com/your-repo/rastreapp/issues).