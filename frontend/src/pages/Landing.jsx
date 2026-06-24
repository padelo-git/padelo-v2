import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Landing.css'

function Landing() {
  const navigate = useNavigate()
  const [showClubModal, setShowClubModal] = useState(false)
  const [clubForm, setClubForm] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    country: 'Argentina',
    description: ''
  })
  const [error, setError] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const handleClubRegister = async (e) => {
    e.preventDefault()
    setError('')
    console.log('Starting club registration:', clubForm)

    try {
      const response = await axios.post('http://18.212.126.125:8000/clubs/', clubForm)
      console.log('Registration successful:', response.data)
      setShowClubModal(false)
      setShowSuccessMessage(true)
    } catch (err) {
      console.error('Registration error:', err)
      console.error('Error response:', err.response?.data)
      setError(err.response?.data?.detail || 'Error al registrar el club')
    }
  }

  return (
    <div className="landing">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">NexaSist</h1>
          <div className="nav-buttons">
            <button onClick={() => {
              console.log('Registrar mi Club button clicked')
              setShowClubModal(true)
            }} className="btn btn-outline">
              Registrar mi Club
            </button>
            <button onClick={() => navigate('/club-login')} className="btn btn-outline">
              Acceso Clubes
            </button>
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

      {/* Success Message */}
      {showSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            width: '100%',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h2 style={{
              color: '#333',
              marginBottom: '15px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              ¡Gracias por registrarte!
            </h2>
            <p style={{
              color: '#666',
              marginBottom: '10px',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Tu club ha sido registrado exitosamente en NexaSist.com
            </p>
            <p style={{
              color: '#666',
              marginBottom: '30px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              En unos minutos te daremos la activación. Te notificaremos por email cuando tu cuenta esté lista para usar.
            </p>
            <button
              onClick={() => setShowSuccessMessage(false)}
              style={{
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Club Registration Modal */}
      {showClubModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              textAlign: 'center',
              color: '#333',
              marginBottom: '10px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              Registrar mi Club
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#666',
              marginBottom: '30px',
              fontSize: '14px'
            }}>
              Comienza tu prueba gratuita de 30 días
            </p>

            {error && (
              <div style={{
                background: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleClubRegister}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Nombre del Club *
                </label>
                <input
                  type="text"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({...clubForm, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={clubForm.slug}
                  onChange={(e) => setClubForm({...clubForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                  required
                  placeholder="mi-club-padel"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <small style={{ color: '#666', fontSize: '11px' }}>Solo letras, números y guiones</small>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={clubForm.email}
                  onChange={(e) => setClubForm({...clubForm, email: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={clubForm.password}
                  onChange={(e) => setClubForm({...clubForm, password: e.target.value})}
                  required
                  minLength="6"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={clubForm.phone}
                  onChange={(e) => setClubForm({...clubForm, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={clubForm.address}
                  onChange={(e) => setClubForm({...clubForm, address: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Ciudad
                </label>
                <input
                  type="text"
                  value={clubForm.city}
                  onChange={(e) => setClubForm({...clubForm, city: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  País
                </label>
                <select
                  value={clubForm.country}
                  onChange={(e) => setClubForm({...clubForm, country: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Argentina">Argentina</option>
                  <option value="México">México</option>
                  <option value="España">España</option>
                  <option value="Brasil">Brasil</option>
                  <option value="Chile">Chile</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Uruguay">Uruguay</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#333',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Descripción
                </label>
                <textarea
                  value={clubForm.description}
                  onChange={(e) => setClubForm({...clubForm, description: e.target.value})}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Registrar Club
                </button>
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  style={{
                    padding: '12px 20px',
                    background: '#e0e0e0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing
