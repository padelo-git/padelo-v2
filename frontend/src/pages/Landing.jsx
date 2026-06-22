import { useNavigate } from 'react-router-dom'
import './Landing.css'

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">NexaSist</h1>
          <div className="nav-buttons">
            <button onClick={() => navigate('/login')} className="btn btn-outline">
              Iniciar Sesión
            </button>
            <button onClick={() => navigate('/register')} className="btn btn-primary">
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Gestión Inteligente de Clubes de Pádel</h1>
          <p className="hero-subtitle">
            La plataforma completa para dueños de clubes y jugadores. 
            Reserva canchas, organiza partidos, gestiona pagos y mucho más.
          </p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/register')} className="btn btn-large btn-primary">
              Soy Jugador
            </button>
            <button onClick={() => navigate('/owner')} className="btn btn-large btn-secondary">
              Soy Dueño de Club
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">¿Por qué NexaSist?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎾</div>
              <h3>Reserva Fácil</h3>
              <p>Reserva canchas en segundos con nuestro sistema intuitivo. Disponibilidad en tiempo real.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Encuentra Jugadores</h3>
              <p>Conecta con otros jugadores de tu nivel y organiza partidos automáticamente.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Pagos Seguros</h3>
              <p>Sistema de pagos integrado con múltiples métodos. Gestión de deudas automática.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Estadísticas</h3>
              <p>Analiza tu rendimiento y el de tu club con reportes detallados en tiempo real.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Clases y Entrenamientos</h3>
              <p>Reserva clases con profesores certificados y mejora tu juego.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Multi-Club</h3>
              <p>Únete a múltiples clubs y gestiona tu actividad en un solo lugar.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2 className="cta-title">¿Listo para empezar?</h2>
          <p className="cta-subtitle">Únete a cientos de clubs y jugadores que ya usan NexaSist</p>
          <button onClick={() => navigate('/register')} className="btn btn-large btn-primary">
            Comenzar Ahora
          </button>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 NexaSist. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
