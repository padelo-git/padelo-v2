import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function OwnerPanel() {
  const [user, setUser] = useState(null)
  const [clubs, setClubs] = useState([])
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [businessMetrics, setBusinessMetrics] = useState(null)
  const [activeView, setActiveView] = useState('monitoring')
  const [showCreateClub, setShowCreateClub] = useState(false)
  const [showBackups, setShowBackups] = useState(false)
  const [timezone, setTimezone] = useState('UTC')
  const [newClub, setNewClub] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchUserData()
    fetchClubs()
    fetchSystemMetrics()
    fetchBusinessMetrics()
  }, [navigate])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://18.212.126.125:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchClubs = async () => {
    try {
      const response = await axios.get('http://18.212.126.125:8000/clubs/')
      setClubs(response.data)
    } catch (err) {
      console.error('Error fetching clubs:', err)
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      const response = await axios.get('http://18.212.126.125:8000/admin/system-metrics')
      setSystemMetrics(response.data)
    } catch (err) {
      console.error('Error fetching system metrics:', err)
    }
  }

  const fetchBusinessMetrics = async () => {
    try {
      const response = await axios.get('http://18.212.126.125:8000/admin/business-metrics')
      setBusinessMetrics(response.data)
    } catch (err) {
      console.error('Error fetching business metrics:', err)
    }
  }

  const handleCreateClub = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://18.212.126.125:8000/clubs/', newClub)
      setShowCreateClub(false)
      setNewClub({
        name: '',
        slug: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        city: '',
        country: ''
      })
      fetchClubs()
    } catch (err) {
      console.error('Error creating club:', err)
      alert('Error al crear el club')
    }
  }

  const handleCreateBackup = async () => {
    try {
      await axios.post('http://18.212.126.125:8000/admin/backups')
      alert('Backup creado exitosamente')
    } catch (err) {
      console.error('Error creating backup:', err)
      alert('Error al crear backup')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  const renderContent = () => {
    switch(activeView) {
      case 'monitoring':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Monitoreo en Vivo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#007bff', marginBottom: '5px' }}>{systemMetrics?.cpu_usage || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>CPU</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#28a745', marginBottom: '5px' }}>{systemMetrics?.memory_usage || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Memoria</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '5px' }}>{systemMetrics?.requests_per_sec || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Req/seg</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#ffc107', marginBottom: '5px' }}>{systemMetrics?.active_connections || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Conexiones</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#e74c3c', marginBottom: '5px' }}>{systemMetrics?.disk_usage || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Disco</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#9b59b6', marginBottom: '5px' }}>{systemMetrics?.network_io || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Red I/O</p>
              </div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Estado del Servidor</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '16px' }}>Online</span>
              </div>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Uptime: 99.9%</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Último deploy: Hace 2 horas</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Versión: v2.0.1</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Base de datos: PostgreSQL (AWS RDS)</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <h4 style={{ marginBottom: '15px' }}>Acciones de Reinicio</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Reiniciar Servidor
                </button>
                <button
                  style={{ padding: '10px 20px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Reiniciar Base de Datos
                </button>
                <button
                  style={{ padding: '10px 20px', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Reiniciar Todo
                </button>
              </div>
            </div>
          </div>
        )
      case 'clubs':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Clubes ({clubs.length})</h3>
              <button
                onClick={() => setShowCreateClub(true)}
                style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                + Nuevo Club
              </button>
            </div>
            {clubs.length === 0 ? (
              <p style={{ color: '#bdc3c7' }}>No hay clubs registrados</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {clubs.map(club => (
                  <div key={club.id} style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
                    <h4 style={{ marginBottom: '10px' }}>{club.name}</h4>
                    <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>📧 {club.email}</p>
                    <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>📍 {club.city || 'Sin ciudad'}</p>
                    <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '15px' }}>🌍 {club.country || 'Sin país'}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Activar
                      </button>
                      <button
                        style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Suspender
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 'system':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Métricas del Sistema</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#007bff', marginBottom: '5px' }}>{systemMetrics?.cpu_usage || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>CPU</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#28a745', marginBottom: '5px' }}>{systemMetrics?.memory_usage || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Memoria</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '5px' }}>{systemMetrics?.requests_per_sec || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Req/seg</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#ffc107', marginBottom: '5px' }}>{systemMetrics?.active_connections || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Conexiones</p>
              </div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <h4 style={{ marginBottom: '15px' }}>Estado del Servidor</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '16px' }}>Online</span>
              </div>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Uptime: 99.9%</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Último deploy: Hace 2 horas</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Versión: v2.0.1</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Base de datos: PostgreSQL (AWS RDS)</p>
            </div>
          </div>
        )
      case 'business':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Métricas del Negocio</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#007bff', marginBottom: '5px' }}>{businessMetrics?.total_clubs || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Clubs Activos</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#28a745', marginBottom: '5px' }}>${businessMetrics?.monthly_revenue || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Ingreso Mensual</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '5px' }}>{businessMetrics?.total_matches || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Partidos/Mes</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#ffc107', marginBottom: '5px' }}>${businessMetrics?.transaction_fees || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Comisiones</p>
              </div>
            </div>
          </div>
        )
      case 'backups':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Gestión de Backups</h3>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handleCreateBackup}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Crear Backup Ahora
              </button>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Último backup: Hace 2 horas</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Próximo backup automático: En 22 horas</p>
            </div>
          </div>
        )
      case 'alerts':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Alertas del Sistema</h3>
            <div style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <p style={{ color: '#bdc3c7' }}>No hay alertas activas en este momento.</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Configuración</h3>
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#bdc3c7' }}>Zona Horaria</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #4a5f7f', 
                    borderRadius: '5px', 
                    backgroundColor: '#2c3e50', 
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                  <option value="America/Mexico_City">México (Ciudad de México)</option>
                  <option value="America/New_York">Estados Unidos (New York)</option>
                  <option value="America/Los_Angeles">Estados Unidos (Los Angeles)</option>
                  <option value="Europe/Madrid">España (Madrid)</option>
                  <option value="Europe/Paris">Francia (París)</option>
                  <option value="Europe/London">Reino Unido (Londres)</option>
                  <option value="Asia/Tokyo">Japón (Tokio)</option>
                  <option value="Australia/Sydney">Australia (Sydney)</option>
                  <option value="America/Sao_Paulo">Brasil (São Paulo)</option>
                  <option value="America/Lima">Perú (Lima)</option>
                  <option value="America/Bogota">Colombia (Bogotá)</option>
                  <option value="America/Santiago">Chile (Santiago)</option>
                </select>
              </div>
              <button
                onClick={() => alert('Configuración guardada')}
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )
      case 'subscriptions':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Suscripciones</h3>
            <div style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <p style={{ color: '#bdc3c7' }}>Vista global de todas las suscripciones.</p>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Club</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Plan</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Precio mensual</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Facturación total</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Próximo cobro</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                    <td style={{ padding: '10px', color: 'white' }}>Club Ejemplo (ID: 1)</td>
                    <td style={{ padding: '10px', color: 'white' }}>Basic</td>
                    <td style={{ padding: '10px', color: 'white' }}>ARS $49.00</td>
                    <td style={{ padding: '10px', color: '#22c55e', fontWeight: 'bold' }}>ARS $147.00</td>
                    <td style={{ padding: '10px', color: 'white' }}>2024-07-01</td>
                    <td style={{ padding: '10px', color: '#22c55e' }}>Active</td>
                    <td style={{ padding: '10px' }}>
                      <button style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', marginRight: '5px' }}>Cambiar plan</button>
                      <button style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Suspender</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      case 'activity':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Actividad</h3>
            <div style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <p style={{ color: '#bdc3c7' }}>Actividad reciente del sistema.</p>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #4a5f7f' }}>
                <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>2024-06-22 14:30</p>
                <p style={{ color: 'white' }}>Club "Padelo Buenos Aires" creado</p>
              </div>
              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #4a5f7f' }}>
                <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>2024-06-22 12:15</p>
                <p style={{ color: 'white' }}>Backup de base de datos completado</p>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>2024-06-22 10:00</p>
                <p style={{ color: 'white' }}>Suscripción de Club "Padelo México" renovada</p>
              </div>
            </div>
          </div>
        )
      case 'support':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Soporte</h3>
            <div style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <p style={{ color: '#bdc3c7' }}>Centro de soporte y ayuda.</p>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <h4 style={{ marginBottom: '15px', color: 'white' }}>Contacto</h4>
              <p style={{ color: '#bdc3c7', marginBottom: '10px' }}>Email: support@nexasist.com</p>
              <p style={{ color: '#bdc3c7', marginBottom: '20px' }}>Teléfono: +54 11 1234-5678</p>
              <button
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Enviar mensaje de soporte
              </button>
            </div>
          </div>
        )
      default:
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Monitoreo en Vivo</h3>
            <p style={{ color: '#bdc3c7' }}>Selecciona una opción del menú para ver los detalles.</p>
          </div>
        )
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>
      <header style={{ padding: '20px 30px', backgroundColor: '#2c3e50', borderBottom: '1px solid #34495e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Padelo V2 - Panel del Owner</h1>
          <button
            onClick={handleLogout}
            style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
        {user && (
          <p style={{ marginTop: '10px', color: '#bdc3c7', fontSize: '14px' }}>Bienvenido, {user.full_name || user.email}</p>
        )}
      </header>

      <nav style={{ padding: '20px 30px', backgroundColor: '#2c3e50', borderBottom: '1px solid #34495e' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveView('monitoring')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'monitoring' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 Monitoreo en Vivo
          </button>
          <button
            onClick={() => setActiveView('clubs')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'clubs' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🏟️ Clubes
          </button>
          <button
            onClick={() => setActiveView('business')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'business' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💰 Negocio
          </button>
          <button
            onClick={() => setActiveView('backups')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'backups' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💾 Backups
          </button>
          <button
            onClick={() => setActiveView('alerts')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'alerts' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px',
              position: 'relative'
            }}
          >
            🔔 Alertas
            <span style={{ 
              position: 'absolute', 
              top: '-5px', 
              right: '-5px', 
              width: '20px', 
              height: '20px', 
              backgroundColor: '#e74c3c', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              0
            </span>
          </button>
          <button
            onClick={() => setActiveView('settings')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'settings' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⚙️ Configuración
          </button>
          <button
            onClick={() => setActiveView('subscriptions')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'subscriptions' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💳 Suscripciones
          </button>
          <button
            onClick={() => setActiveView('activity')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'activity' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📈 Actividad
          </button>
          <button
            onClick={() => setActiveView('support')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'support' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🎧 Soporte
          </button>
        </div>
      </nav>

      <main style={{ padding: '30px', overflowY: 'auto' }}>

        {showCreateClub && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '15px' }}>Crear Nuevo Club</h3>
            <form onSubmit={handleCreateClub}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>Nombre del Club *</label>
                  <input
                    type="text"
                    value={newClub.name}
                    onChange={(e) => setNewClub({...newClub, name: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>Slug (URL) *</label>
                  <input
                    type="text"
                    value={newClub.slug}
                    onChange={(e) => setNewClub({...newClub, slug: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>Email *</label>
                  <input
                    type="email"
                    value={newClub.email}
                    onChange={(e) => setNewClub({...newClub, email: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>Contraseña *</label>
                  <input
                    type="password"
                    value={newClub.password}
                    onChange={(e) => setNewClub({...newClub, password: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>Teléfono</label>
                  <input
                    type="text"
                    value={newClub.phone}
                    onChange={(e) => setNewClub({...newClub, phone: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>Ciudad</label>
                  <input
                    type="text"
                    value={newClub.city}
                    onChange={(e) => setNewClub({...newClub, city: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>País</label>
                  <input
                    type="text"
                    value={newClub.country}
                    onChange={(e) => setNewClub({...newClub, country: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#bdc3c7' }}>Dirección</label>
                  <input
                    type="text"
                    value={newClub.address}
                    onChange={(e) => setNewClub({...newClub, address: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #4a5f7f', borderRadius: '5px', backgroundColor: '#34495e', color: 'white' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Crear Club
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateClub(false)}
                  style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  )
}

export default OwnerPanel
