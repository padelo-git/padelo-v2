import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function OwnerPanel() {
  const [user, setUser] = useState(null)
  const [clubs, setClubs] = useState([])
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [businessMetrics, setBusinessMetrics] = useState(null)
  const [showCreateClub, setShowCreateClub] = useState(false)
  const [showBackups, setShowBackups] = useState(false)
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
      const response = await axios.get('http://localhost:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchClubs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/clubs/')
      setClubs(response.data)
    } catch (err) {
      console.error('Error fetching clubs:', err)
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/system-metrics')
      setSystemMetrics(response.data)
    } catch (err) {
      console.error('Error fetching system metrics:', err)
    }
  }

  const fetchBusinessMetrics = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/business-metrics')
      setBusinessMetrics(response.data)
    } catch (err) {
      console.error('Error fetching business metrics:', err)
    }
  }

  const handleCreateClub = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/clubs/', newClub)
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
      await axios.post('http://localhost:8000/admin/backups')
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

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <h1>Padelo V2 - Panel del Owner</h1>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </header>

      {user && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h2>Bienvenido, {user.full_name || user.email}</h2>
          <p>Email: {user.email}</p>
        </div>
      )}

      {showCreateClub && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Crear Nuevo Club (Suscripción)</h3>
          <form onSubmit={handleCreateClub}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre del Club *</label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) => setNewClub({...newClub, name: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Slug (URL) *</label>
                <input
                  type="text"
                  value={newClub.slug}
                  onChange={(e) => setNewClub({...newClub, slug: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email *</label>
                <input
                  type="email"
                  value={newClub.email}
                  onChange={(e) => setNewClub({...newClub, email: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña *</label>
                <input
                  type="password"
                  value={newClub.password}
                  onChange={(e) => setNewClub({...newClub, password: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Teléfono</label>
                <input
                  type="text"
                  value={newClub.phone}
                  onChange={(e) => setNewClub({...newClub, phone: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Ciudad</label>
                <input
                  type="text"
                  value={newClub.city}
                  onChange={(e) => setNewClub({...newClub, city: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>País</label>
                <input
                  type="text"
                  value={newClub.country}
                  onChange={(e) => setNewClub({...newClub, country: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Dirección</label>
                <input
                  type="text"
                  value={newClub.address}
                  onChange={(e) => setNewClub({...newClub, address: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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

      {showBackups && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Gestión de Backups</h3>
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={handleCreateBackup}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Crear Backup Ahora
            </button>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <p style={{ fontSize: '14px', color: '#666' }}>Último backup: Hace 2 horas</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Próximo backup automático: En 22 horas</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Métricas del Sistema</h3>
          {systemMetrics ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#007bff', marginBottom: '5px' }}>{systemMetrics.cpu_usage}%</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>CPU</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#28a745', marginBottom: '5px' }}>{systemMetrics.memory_usage}%</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Memoria</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#17a2b8', marginBottom: '5px' }}>{systemMetrics.requests_per_sec}</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Req/seg</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#ffc107', marginBottom: '5px' }}>{systemMetrics.active_connections}</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Conexiones</p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>Cargando métricas...</p>
          )}
        </div>

        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Métricas del Negocio</h3>
          {businessMetrics ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#007bff', marginBottom: '5px' }}>{businessMetrics.total_clubs}</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Clubs Activos</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#28a745', marginBottom: '5px' }}>${businessMetrics.monthly_revenue}</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Ingreso Mensual</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#17a2b8', marginBottom: '5px' }}>{businessMetrics.total_matches}</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Partidos/Mes</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '24px', color: '#ffc107', marginBottom: '5px' }}>${businessMetrics.transaction_fees}</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Comisiones</p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>Cargando métricas...</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Clubs Suscriptos ({clubs.length})</h3>
          {clubs.length === 0 ? (
            <p>No hay clubs registrados</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {clubs.map(club => (
                <li key={club.id} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <strong>{club.name}</strong>
                  <p style={{ fontSize: '14px', color: '#666' }}>{club.email}</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>{club.city || 'Sin ciudad'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Estado del Servidor</h3>
          <div style={{ padding: '15px', backgroundColor: '#28a745', borderRadius: '5px', color: 'white', textAlign: 'center' }}>
            <h4 style={{ fontSize: '18px', marginBottom: '5px' }}>● Online</h4>
            <p style={{ fontSize: '14px' }}>Uptime: 99.9%</p>
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            <p>Último deploy: Hace 2 horas</p>
            <p>Versión: v2.0.1</p>
            <p>Base de datos: PostgreSQL (AWS RDS)</p>
            <p>Redis: Activo</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px' }}>Acciones de Administración</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateClub(true)}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Crear Nueva Suscripción
          </button>
          <button
            onClick={() => setShowBackups(true)}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Gestión de Backups
          </button>
          <button
            onClick={() => { fetchSystemMetrics(); fetchBusinessMetrics(); }}
            style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Actualizar Métricas
          </button>
          <button style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Ver Logs
          </button>
        </div>
      </div>
    </div>
  )
}

export default OwnerPanel
