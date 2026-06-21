# Padelo V2

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

```bash
cd backend
python main.py
```

El servidor estará disponible en `http://localhost:8000`

## API Documentation

La documentación interactiva de la API está disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Características

- ✅ Autenticación JWT para usuarios y clubes
- ✅ Arquitectura modular y escalable
- ✅ Base de datos PostgreSQL con SQLAlchemy async
- ✅ Sistema de configuración con Pydantic
- 🚧 Sistema de gestión de clubes
- 🚧 Sistema de reservas de canchas
- 🚧 Sistema de match-making automático
- 🚧 Mensajería interna en tiempo real
- 🚧 Notificaciones push
- 🚧 Sistema de pagos

## Roadmap

- [x] Configuración base del proyecto
- [x] Módulo de autenticación
- [ ] Módulo de gestión de clubes
- [ ] Módulo de gestión de canchas
- [ ] Módulo de match-making
- [ ] Módulo de mensajería
- [ ] Módulo de notificaciones
- [ ] Frontend móvil (React Native)
- [ ] Frontend web admin (React)
- [ ] CI/CD
- [ ] Testing

## Licencia

MIT
