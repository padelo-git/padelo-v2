import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function OwnerPanel() {
  const [user, setUser] = useState(null)
  const [clubs, setClubs] = useState([])
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [businessMetrics, setBusinessMetrics] = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
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
      case 'clubs':
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
              <p style={{ color: '#666' }}>No hay clubs registrados</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {clubs.map(club => (
                  <div key={club.id} style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                    <h4 style={{ marginBottom: '10px' }}>{club.name}</h4>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>📧 {club.email}</p>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>📍 {club.city || 'Sin ciudad'}</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>🌍 {club.country || 'Sin país'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 'system':
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>Métricas del Sistema</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#007bff', marginBottom: '5px' }}>{systemMetrics?.cpu_usage || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>CPU</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#28a745', marginBottom: '5px' }}>{systemMetrics?.memory_usage || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Memoria</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '5px' }}>{systemMetrics?.requests_per_sec || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Req/seg</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#ffc107', marginBottom: '5px' }}>{systemMetrics?.active_connections || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Conexiones</p>
              </div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
              <h4 style={{ marginBottom: '15px' }}>Estado del Servidor</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '16px' }}>Online</span>
              </div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Uptime: 99.9%</p>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Último deploy: Hace 2 horas</p>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Versión: v2.0.1</p>
              <p style={{ fontSize: '14px', color: '#666' }}>Base de datos: PostgreSQL (AWS RDS)</p>
            </div>
          </div>
        )
      case 'business':
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>Métricas del Negocio</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#007bff', marginBottom: '5px' }}>{businessMetrics?.total_clubs || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Clubs Activos</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#28a745', marginBottom: '5px' }}>${businessMetrics?.monthly_revenue || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Ingreso Mensual</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '5px' }}>{businessMetrics?.total_matches || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Partidos/Mes</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center', border: '1px solid #ddd' }}>
                <h4 style={{ fontSize: '32px', color: '#ffc107', marginBottom: '5px' }}>${businessMetrics?.transaction_fees || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Comisiones</p>
              </div>
            </div>
          </div>
        )
      case 'backups':
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>Gestión de Backups</h3>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handleCreateBackup}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Crear Backup Ahora
              </button>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Último backup: Hace 2 horas</p>
              <p style={{ fontSize: '14px', color: '#666' }}>Próximo backup automático: En 22 horas</p>
            </div>
          </div>
        )
      default:
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>Dashboard</h3>
            <p style={{ color: '#666' }}>Selecciona una opción del menú para ver los detalles.</p>
          </div>
        )
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <aside style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '30px', fontSize: '20px' }}>Padelo V2</h2>
        <nav style={{ flex: 1 }}>
          <button
            onClick={() => setActiveView('dashboard')}
            style={{ 
              width: '100%', 
              padding: '12px 15px', 
              backgroundColor: activeView === 'dashboard' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              textAlign: 'left',
              marginBottom: '5px',
              fontSize: '14px'
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveView('clubs')}
            style={{ 
              width: '100%', 
              padding: '12px 15px', 
              backgroundColor: activeView === 'clubs' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              textAlign: 'left',
              marginBottom: '5px',
              fontSize: '14px'
            }}
          >
            🏟️ Clubes
          </button>
          <button
            onClick={() => setActiveView('system')}
            style={{ 
              width: '100%', 
              padding: '12px 15px', 
              backgroundColor: activeView === 'system' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              textAlign: 'left',
              marginBottom: '5px',
              fontSize: '14px'
            }}
          >
            ⚙️ Sistema
          </button>
          <button
            onClick={() => setActiveView('business')}
            style={{ 
              width: '100%', 
              padding: '12px 15px', 
              backgroundColor: activeView === 'business' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              textAlign: 'left',
              marginBottom: '5px',
              fontSize: '14px'
            }}
          >
            💰 Negocio
          </button>
          <button
            onClick={() => setActiveView('backups')}
            style={{ 
              width: '100%', 
              padding: '12px 15px', 
              backgroundColor: activeView === 'backups' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              textAlign: 'left',
              marginBottom: '5px',
              fontSize: '14px'
            }}
          >
            💾 Backups
          </button>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #34495e' }}>
          <button
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '12px 15px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Panel del Owner</h1>
          {user && (
            <p style={{ color: '#666' }}>Bienvenido, {user.full_name || user.email}</p>
          )}
        </header>

        {showCreateClub && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px' }}>Crear Nuevo Club</h3>
            <form onSubmit={handleCreateClub}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nombre del Club *</label>
                  <input
                    type="text"
                    value={newClub.name}
                    onChange={(e) => setNewClub({...newClub, name: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Slug (URL) *</label>
                  <input
                    type="text"
                    value={newClub.slug}
                    onChange={(e) => setNewClub({...newClub, slug: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email *</label>
                  <input
                    type="email"
                    value={newClub.email}
                    onChange={(e) => setNewClub({...newClub, email: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Contraseña *</label>
                  <input
                    type="password"
                    value={newClub.password}
                    onChange={(e) => setNewClub({...newClub, password: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Teléfono</label>
                  <input
                    type="text"
                    value={newClub.phone}
                    onChange={(e) => setNewClub({...newClub, phone: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Ciudad</label>
                  <input
                    type="text"
                    value={newClub.city}
                    onChange={(e) => setNewClub({...newClub, city: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>País</label>
                  <input
                    type="text"
                    value={newClub.country}
                    onChange={(e) => setNewClub({...newClub, country: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Dirección</label>
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

        {renderContent()}
      </main>
    </div>
  )
}

export default OwnerPanel
