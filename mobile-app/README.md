# Padelo Mobile App - PWA para Jugadores

App móvil Progressive Web App (PWA) para jugadores de pádel con interfaz estilo WhatsApp/Telegram.

## Características

### UI/UX
- **Diseño estilo WhatsApp/Telegram**: Interfaz de chat con mensajes del sistema
- **Timestamps por fecha**: Agrupación de mensajes por "Hoy", "Ayer", o fecha específica
- **8 botones de navegación**: 
  - Izquierda: Ver Disponibilidad, Quiero Jugar, Mis Partidos, Ayuda
  - Derecha: Reservar, Quiero Clase, Invitar Amigo, Cancelar
- **Diseño moderno**: Gradientes, animaciones, sombras, colores atractivos

### Flujos Implementados

#### Registro por QR/Link
1. Escaneo QR o clic en link de invitación (NexaSist.com)
2. Nombre y apellido
3. Correo electrónico
4. Contraseña
5. Género (Masculino/Femenino)
6. Días disponibles (Lun-Dom + botón "Listo")
7. Rango horario (Mañana/Mediodía/Tarde/Noche)
8. Lado (Derecha/Revés/Ambos)
9. Categoría (1ra-9na)

#### Ver Disponibilidad
- Día: hoy/mañana/pasado + campo de texto
- Horarios disponibles
- Selección de cancha libre

#### Reservar
- Día: hoy/mañana/pasado + campo de texto
- Horarios disponibles
- Duración: 1h, 1.5h, 2h, 2.5h, 3h, 4h
- Selección de cancha

#### Quiero Jugar
- Búsqueda automática de 3 jugadores
- Por lado y categoría
- Armado de partido rápido

#### Mis Partidos
- Listado de partidos
- Bajarse de partidos
- Sistema de penalización (pendiente implementación)

#### Quiero Clase
- Selección de profesor (David Greco/Agustín Greco)
- Día
- Hora (1 hora fija)

#### Invitar Amigo
- Generar link NexaSist.com
- Copiar al portapapeles
- Compartir por WhatsApp

#### Cancelar Operación
- Cancelar reserva/clase en curso

#### Ayuda
- Tutorial de uso de botones

## Instalación

```bash
cd mobile-app
npm install
npm run dev
```

## Desarrollo

- Puerto: 3000
- Proxy API: http://localhost:8002
- PWA: Soporte para instalación en móvil

## Pendientes

- Sistema de penalización (12h=0%, 12h-6h=50% de su parte, ≤6h=100% de cancha)
- Sistema de login con email y contraseña
- Sistema de recuperación de contraseña
- Integración con backend API
- Testing real en dispositivo móvil
