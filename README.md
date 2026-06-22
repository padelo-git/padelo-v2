# Padelo V2
Sistema de gestión de pádel con deploy automático a AWS via GitHub Actions

Sistema de gestión de clubes de pádel - Versión 2

## Arquitectura

Este proyecto es una reescritura completa del sistema Padelo con una arquitectura limpia y modular, diseñada para escalar mundialmente.

### Stack Tecnológico

- **Backend:** FastAPI (Python 3.9+)
- **Base de datos:** PostgreSQL
- **Cache/Colas:** Redis
- **Autenticación:** JWT
- **Mensajería:** WebSocket (Socket.io)
- **Notificaciones:** Firebase Cloud Messaging

### Estructura del Proyecto

```
padelo-v2/
├── backend/
│   ├── app/
│   │   ├── auth/          (autenticación, JWT)
│   │   ├── users/         (usuarios, perfiles)
│   │   ├── clubs/         (gestión de clubes)
│   │   ├── courts/        (canchas, reservas)
│   │   ├── matches/       (match-making, partidos)
│   │   ├── messaging/     (mensajería interna)
│   │   ├── payments/      (pagos, suscripciones)
│   │   ├── notifications/ (push notifications)
│   │   └── api/           (endpoints REST)
│   ├── core/              (config, db, security)
│   └── main.py
├── frontend-mobile/       (React Native - pendiente)
├── frontend-web/          (React - pendiente)
└── deploy/                (scripts, docker, nginx - pendiente)
```

## Instalación

### Prerrequisitos

- Python 3.9+
- PostgreSQL
- Redis

### Configuración

1. Clonar el repositorio
2. Crear entorno virtual: `python -m venv venv`
3. Activar entorno virtual: `source venv/bin/activate`
4. Instalar dependencias: `pip install -r backend/requirements.txt`
5. Configurar variables de entorno: `cp backend/.env.example backend/.env`
6. Editar `backend/.env` con tus credenciales

### Ejecución

#### Opción 1: Ejecución local

```bash
cd backend
python main.py
```

El servidor estará disponible en `http://localhost:8000`

#### Opción 2: Docker Compose (recomendado)

```bash
docker-compose up
```

Esto iniciará:
- Backend FastAPI en `http://localhost:8000`
- PostgreSQL en `localhost:5432`
- Redis en `localhost:6379`

## API Documentation

La documentación interactiva de la API está disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

### Ejecutar tests localmente

```bash
cd backend
./run_tests.sh
```

O manualmente:

```bash
cd backend
pytest --cov=app --cov-report=html --cov-report=term-missing -v
```

### CI/CD

Los tests se ejecutan automáticamente en cada push/PR a través de GitHub Actions.

## Deployment

### Deployment en servidor

```bash
./deploy.sh
```

Este script:
1. Detiene los servicios existentes
2. Pull del último código desde GitHub
3. Build y start de los servicios con Docker Compose
4. Ejecuta migraciones (si es necesario)

### Deployment manual con Docker

```bash
# Build la imagen
docker build -t padelo-v2 ./backend

# Ejecutar el contenedor
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379/0 \
  padelo-v2
```

## Características

- ✅ Autenticación JWT para usuarios y clubes
- ✅ Arquitectura modular y escalable
- ✅ Base de datos PostgreSQL con SQLAlchemy async
- ✅ Sistema de configuración con Pydantic
- ✅ Sistema de gestión de clubes
- ✅ Sistema de gestión de canchas
- ✅ Sistema de match-making automático
- ✅ Mensajería interna con WebSocket
- ✅ Sistema de notificaciones push
- ✅ Redis para colas y cache
- ✅ Tests automáticos con pytest
- ✅ CI/CD con GitHub Actions
- ✅ Docker para deployment consistente

## Roadmap

- [x] Configuración base del proyecto
- [x] Módulo de autenticación
- [x] Módulo de gestión de clubes
- [x] Módulo de gestión de canchas
- [x] Módulo de match-making
- [x] Módulo de mensajería
- [x] Módulo de notificaciones
- [x] Tests automáticos
- [x] CI/CD con GitHub Actions
- [x] Docker para deployment
- [ ] Frontend móvil (React Native)
- [ ] Frontend web admin (React)
- [ ] Deploy en servidor AWS
- [ ] Migración de datos del sistema viejo

## Licencia

MIT
