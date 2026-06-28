import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/axios'

// Owner Panel - Updated with delete club button
function OwnerPanel() {
  const [user, setUser] = useState(null)
  const [clubs, setClubs] = useState([])
  const [pendingClubs, setPendingClubs] = useState([])
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [businessMetrics, setBusinessMetrics] = useState(null)
  const [activeView, setActiveView] = useState('monitoring')
  const [alertsViewed, setAlertsViewed] = useState(false)
  const [clubsViewed, setClubsViewed] = useState(false)
  const [showCreateClub, setShowCreateClub] = useState(false)
  const [showBackups, setShowBackups] = useState(false)
  const [timezone, setTimezone] = useState(() => localStorage.getItem('timezone') || 'UTC')
  const [alerts, setAlerts] = useState([])
  const [backups, setBackups] = useState([])
  const [healthStatus, setHealthStatus] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pendingClubsCount, setPendingClubsCount] = useState(0)
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
      navigate('/admin-login')
      return
    }

    fetchUserData()
    fetchClubs()
    fetchPendingClubs()
    fetchSystemMetrics()
    fetchBusinessMetrics()
    fetchAlerts()
    fetchBackups()
    fetchHealthStatus()
    fetchPendingClubsCount()
    
    // Refresh metrics every 5 seconds
    const interval = setInterval(() => {
      fetchSystemMetrics()
      fetchHealthStatus()
    }, 5000)
    
    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => {
      clearInterval(interval)
      clearInterval(clockInterval)
    }
  }, [navigate])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs/')
      setClubs(response.data)
    } catch (err) {
      console.error('Error fetching clubs:', err)
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Fetching system metrics with token:', token ? 'present' : 'missing')
      // Try public endpoint first (temporary fix)
      const response = await api.get('/admin-panel/metrics/public')
      console.log('System metrics response:', response.data)
      setSystemMetrics(response.data)
    } catch (err) {
      console.error('Error fetching system metrics:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
    }
  }

  const fetchBusinessMetrics = async () => {
    try {
      const response = await api.get('/admin/business-metrics')
      setBusinessMetrics(response.data)
    } catch (err) {
      console.error('Error fetching business metrics:', err)
    }
  }

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token')
      // Try public endpoint first (temporary fix)
      const response = await api.get('/admin-panel/alerts/public')
      console.log('Alerts response:', response.data)
      setAlerts(response.data)
    } catch (err) {
      console.error('Error fetching alerts:', err)
      console.error('Error response:', err.response?.data)
    }
  }

  // Auto-generate alert for pending clubs
  const generatePendingClubAlert = () => {
    if (pendingClubsCount > 0) {
      const alert = {
        id: `pending-club-${Date.now()}`,
        type: 'club',
        severity: 'high',
        message: `${pendingClubsCount} club${pendingClubsCount > 1 ? 'es' : ''} pendiente${pendingClubsCount > 1 ? 's' : ''} de activación`,
        created_at: new Date().toISOString()
      }
      // Add to alerts if not already present
      if (!alerts.some(a => a.type === 'club' && a.message.includes('pendiente'))) {
        setAlerts([alert, ...alerts])
      }
    }
  }

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('token')
      // Try public endpoint first (temporary fix)
      const response = await api.get('/admin-panel/backups/public')
      console.log('Backups response:', response.data)
      setBackups(response.data.backups || [])
    } catch (err) {
      console.error('Error fetching backups:', err)
      console.error('Error response:', err.response?.data)
    }
  }

  const fetchHealthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get('/admin-panel/health', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHealthStatus(response.data)
    } catch (err) {
      console.error('Error fetching health status:', err)
    }
  }

  const fetchPendingClubsCount = async () => {
    try {
      const response = await api.get('/clubs/pending/count')
      setPendingClubsCount(response.data.pending_count || 0)
      generatePendingClubAlert()
    } catch (err) {
      console.error('Error fetching pending clubs count:', err)
    }
  }

  const fetchPendingClubs = async () => {
    try {
      const response = await api.get('/clubs/pending')
      setPendingClubs(response.data)
    } catch (err) {
      console.error('Error fetching pending clubs:', err)
    }
  }

  const handleActivateClub = async (clubId) => {
    try {
      const token = localStorage.getItem('token')
      await api.put(`/clubs/${clubId}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Club activado exitosamente')
      fetchPendingClubs()
      fetchClubs()
      fetchPendingClubsCount()
    } catch (err) {
      console.error('Error activating club:', err)
      alert('Error al activar club')
    }
  }

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm('¿Estás seguro de eliminar este club? Esta acción eliminará todos los datos del club y no se puede deshacer.')) {
      return
    }
    try {
      const token = localStorage.getItem('token')
      await api.delete(`/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Club eliminado exitosamente')
      fetchClubs()
      fetchPendingClubs()
      fetchPendingClubsCount()
    } catch (err) {
      console.error('Error deleting club:', err)
      alert('Error al eliminar club')
    }
  }

  const handleCreateClub = async (e) => {
    e.preventDefault()
    try {
      await api.post('/clubs/', newClub)
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
      const token = localStorage.getItem('token')
      await api.post('/admin-panel/backups/create', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Backup creado exitosamente')
      fetchBackups()
    } catch (err) {
      console.error('Error creating backup:', err)
      alert('Error al crear backup')
    }
  }

  const handleRestart = async (service) => {
    try {
      const token = localStorage.getItem('token')
      await api.post('/admin-panel/restart', { service }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`${service} reiniciado exitosamente`)
    } catch (err) {
      console.error('Error restarting service:', err)
      alert('Error al reiniciar servicio')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  const handleViewChange = (view) => {
    setActiveView(view)
    if (view === 'alerts') {
      setAlertsViewed(true)
    }
    if (view === 'clubs') {
      setClubsViewed(true)
    }
  }

  const renderContent = () => {
    switch(activeView) {
      case 'monitoring':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Monitoreo en Vivo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: (systemMetrics?.cpu_percent || 0) > 80 ? '#e74c3c' : (systemMetrics?.cpu_percent || 0) > 50 ? '#ffc107' : '#28a745', marginBottom: '5px' }}>{systemMetrics?.cpu_percent?.toFixed(1) || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>CPU</p>
                <p style={{ fontSize: '11px', color: '#6c757d' }}>Uso del procesador</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: (systemMetrics?.memory_percent || 0) > 85 ? '#e74c3c' : (systemMetrics?.memory_percent || 0) > 60 ? '#ffc107' : '#28a745', marginBottom: '5px' }}>{systemMetrics?.memory_percent?.toFixed(1) || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Memoria</p>
                <p style={{ fontSize: '11px', color: '#6c757d' }}>{systemMetrics?.memory_used || '--'} / {systemMetrics?.memory_total || '--'}</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: (systemMetrics?.connections || 0) > 300 ? '#e74c3c' : (systemMetrics?.connections || 0) > 100 ? '#ffc107' : '#28a745', marginBottom: '5px' }}>{systemMetrics?.connections || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Conexiones</p>
                <p style={{ fontSize: '11px', color: '#6c757d' }}>Conexiones de red activas</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: (systemMetrics?.disk_percent || 0) > 80 ? '#e74c3c' : (systemMetrics?.disk_percent || 0) > 60 ? '#ffc107' : '#28a745', marginBottom: '5px' }}>{systemMetrics?.disk_percent?.toFixed(1) || '--'}%</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Disco</p>
                <p style={{ fontSize: '11px', color: '#6c757d' }}>{systemMetrics?.disk_used || '--'} / {systemMetrics?.disk_total || '--'}</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#9b59b6', marginBottom: '5px' }}>{systemMetrics?.uptime || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Uptime</p>
                <p style={{ fontSize: '11px', color: '#6c757d' }}>Tiempo encendido</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', textAlign: 'center', border: '1px solid #4a5f7f' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '5px' }}>{systemMetrics?.network_io?.bytes_sent || '--'}</h4>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Red (enviado)</p>
                <p style={{ fontSize: '11px', color: '#6c757d' }}>Datos enviados</p>
              </div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Estado del Servidor</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '16px' }}>Online</span>
              </div>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Uptime: 99.9%</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>Versión: v2.0.1</p>
              <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Base de datos: PostgreSQL (AWS RDS)</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <h4 style={{ marginBottom: '15px' }}>Acciones de Reinicio</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRestart('server')}
                  style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Reiniciar Servidor
                </button>
                <button
                  onClick={() => handleRestart('database')}
                  style={{ padding: '10px 20px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Reiniciar Base de Datos
                </button>
                <button
                  onClick={() => handleRestart('all')}
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

            {/* Pending Clubs Section */}
            {pendingClubs.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ color: '#ffc107', marginBottom: '15px' }}>
                  ⏳ Pendientes de Activación ({pendingClubs.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {pendingClubs.map(club => (
                    <div key={club.id} style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '2px solid #ffc107' }}>
                      <h4 style={{ marginBottom: '10px' }}>{club.name}</h4>
                      <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>📧 {club.email}</p>
                      <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>📍 {club.city || 'Sin ciudad'}</p>
                      <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>🌍 {club.country || 'Sin país'}</p>
                      <p style={{ fontSize: '12px', color: '#ffc107', marginBottom: '15px' }}>
                        Registrado: {new Date(club.created_at).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleActivateClub(club.id)}
                        style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                      >
                        ✅ Activar Club
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Clubs Section */}
            <div>
              <h4 style={{ color: '#28a745', marginBottom: '15px' }}>
                ✅ Clubes Activos ({clubs.filter(c => c.is_active).length})
              </h4>
              {clubs.filter(c => c.is_active).length === 0 ? (
                <p style={{ color: '#bdc3c7' }}>No hay clubs activos</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {clubs.filter(c => c.is_active).map(club => (
                    <div key={club.id} style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
                      <h4 style={{ marginBottom: '10px' }}>{club.name}</h4>
                      <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>📧 {club.email}</p>
                      <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>📍 {club.city || 'Sin ciudad'}</p>
                      <p style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '15px' }}>🌍 {club.country || 'Sin país'}</p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          style={{ padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Ver Detalles
                        </button>
                        <button
                          style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Suspender
                        </button>
                        <button
                          onClick={() => handleDeleteClub(club.id)}
                          style={{ padding: '6px 12px', backgroundColor: '#c82333', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              <h4 style={{ marginBottom: '15px', color: 'white' }}>Backups Disponibles</h4>
              {backups.length === 0 ? (
                <p style={{ color: '#bdc3c7' }}>No hay backups disponibles</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Archivo</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Tamaño</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Fecha</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.id} style={{ borderBottom: '1px solid #4a5f7f' }}>
                        <td style={{ padding: '10px', color: 'white' }}>{backup.filename}</td>
                        <td style={{ padding: '10px', color: 'white' }}>{backup.size}</td>
                        <td style={{ padding: '10px', color: 'white' }}>{new Date(backup.created_at).toLocaleString()}</td>
                        <td style={{ padding: '10px', color: '#22c55e' }}>{backup.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {healthStatus?.last_backup && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
                <p style={{ fontSize: '14px', color: '#bdc3c7' }}>Último backup: {healthStatus.last_backup}</p>
              </div>
            )}
          </div>
        )
      case 'alerts':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Alertas del Sistema</h3>
            {alerts.length === 0 ? (
              <div style={{ padding: '15px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
                <p style={{ color: '#bdc3c7' }}>No hay alertas activas en este momento.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '15px',
                      backgroundColor: alert.severity === 'high' ? '#e74c3c' : alert.severity === 'warning' ? '#ffc107' : '#34495e',
                      borderRadius: '5px',
                      border: '1px solid #4a5f7f',
                      color: alert.severity === 'high' || alert.severity === 'warning' ? '#000' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        {alert.type === 'github' ? '🔧 GitHub' : '⚙️ Sistema'}
                      </span>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', margin: 0 }}>{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 'settings':
        return (
          <div style={{ padding: '20px', backgroundColor: '#2c3e50', borderRadius: '5px', border: '1px solid #34495e' }}>
            <h3 style={{ marginBottom: '20px' }}>Configuración</h3>
            
            {/* Zona Horaria */}
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: 'white' }}>Zona Horaria</h4>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#bdc3c7' }}>Zona Horaria</label>
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value)
                    localStorage.setItem('timezone', e.target.value)
                  }}
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
                  <option value="America/Argentina/Cordoba">Argentina (Córdoba)</option>
                  <option value="America/Argentina/Mendoza">Argentina (Mendoza)</option>
                  <option value="America/Mexico_City">México (Ciudad de México)</option>
                  <option value="America/Hermosillo">México (Hermosillo)</option>
                  <option value="America/Monterrey">México (Monterrey)</option>
                  <option value="America/Tijuana">México (Tijuana)</option>
                  <option value="America/Mazatlan">México (Mazatlán)</option>
                  <option value="America/Chihuahua">México (Chihuahua)</option>
                  <option value="America/Merida">México (Mérida)</option>
                  <option value="America/Cancun">México (Cancún)</option>
                  <option value="America/New_York">Estados Unidos (New York)</option>
                  <option value="America/Los_Angeles">Estados Unidos (Los Angeles)</option>
                  <option value="America/Chicago">Estados Unidos (Chicago)</option>
                  <option value="America/Denver">Estados Unidos (Denver)</option>
                  <option value="America/Phoenix">Estados Unidos (Phoenix)</option>
                  <option value="Europe/Madrid">España (Madrid)</option>
                  <option value="Europe/Paris">Francia (París)</option>
                  <option value="Europe/London">Reino Unido (Londres)</option>
                  <option value="Europe/Berlin">Alemania (Berlín)</option>
                  <option value="Europe/Rome">Italia (Roma)</option>
                  <option value="Asia/Tokio">Japón (Tokio)</option>
                  <option value="Asia/Shanghai">China (Shanghai)</option>
                  <option value="Asia/Seoul">Corea del Sur (Seúl)</option>
                  <option value="Asia/Singapore">Singapur</option>
                  <option value="Asia/Dubai">Emiratos Árabes (Dubai)</option>
                  <option value="Australia/Sydney">Australia (Sydney)</option>
                  <option value="Australia/Melbourne">Australia (Melbourne)</option>
                  <option value="Pacific/Auckland">Nueva Zelanda (Auckland)</option>
                  <option value="America/Sao_Paulo">Brasil (São Paulo)</option>
                  <option value="America/Rio_Branco">Brasil (Rio Branco)</option>
                  <option value="America/Manaus">Brasil (Manaus)</option>
                  <option value="America/Lima">Perú (Lima)</option>
                  <option value="America/Bogota">Colombia (Bogotá)</option>
                  <option value="America/Santiago">Chile (Santiago)</option>
                  <option value="America/Caracas">Venezuela (Caracas)</option>
                  <option value="America/Quito">Ecuador (Quito)</option>
                  <option value="America/La_Paz">Bolivia (La Paz)</option>
                  <option value="America/Montevideo">Uruguay (Montevideo)</option>
                  <option value="America/Asuncion">Paraguay (Asunción)</option>
                  <option value="America/Panama">Panamá (Panamá)</option>
                  <option value="America/Costa_Rica">Costa Rica (San José)</option>
                  <option value="America/El_Salvador">El Salvador (San Salvador)</option>
                  <option value="America/Guatemala">Guatemala (Ciudad de Guatemala)</option>
                  <option value="America/Managua">Nicaragua (Managua)</option>
                  <option value="America/Tegucigalpa">Honduras (Tegucigalpa)</option>
                  <option value="America/Santo_Domingo">República Dominicana (Santo Domingo)</option>
                  <option value="America/Havana">Cuba (La Habana)</option>
                  <option value="America/Jamaica">Jamaica (Kingston)</option>
                  <option value="America/Port-au-Prince">Haití (Puerto Príncipe)</option>
                </select>
              </div>
              <button
                onClick={() => alert('Configuración guardada')}
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Guardar Configuración
              </button>
            </div>

            {/* Planes */}
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: 'white' }}>Planes</h4>
              <p style={{ color: '#bdc3c7', marginBottom: '15px' }}>Crear y editar planes, precios y límites.</p>
              <button
                onClick={() => alert('Crear Plan')}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px' }}
              >
                Crear Plan
              </button>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Nombre</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Precio</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Límite Canchas</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>WhatsApp Premium</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                    <td style={{ padding: '10px', color: 'white' }}>Basic</td>
                    <td style={{ padding: '10px', color: 'white' }}>$49.00</td>
                    <td style={{ padding: '10px', color: 'white' }}>5</td>
                    <td style={{ padding: '10px', color: 'white' }}>No</td>
                    <td style={{ padding: '10px' }}>
                      <button style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                    <td style={{ padding: '10px', color: 'white' }}>Pro</td>
                    <td style={{ padding: '10px', color: 'white' }}>$99.00</td>
                    <td style={{ padding: '10px', color: 'white' }}>15</td>
                    <td style={{ padding: '10px', color: 'white' }}>Sí</td>
                    <td style={{ padding: '10px' }}>
                      <button style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', color: 'white' }}>Enterprise</td>
                    <td style={{ padding: '10px', color: 'white' }}>$199.00</td>
                    <td style={{ padding: '10px', color: 'white' }}>Ilimitado</td>
                    <td style={{ padding: '10px', color: 'white' }}>Sí</td>
                    <td style={{ padding: '10px' }}>
                      <button style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagos */}
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: 'white' }}>Pagos</h4>
              <p style={{ color: '#bdc3c7', marginBottom: '15px' }}>Métodos de pago e integraciones.</p>
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ marginBottom: '10px', color: 'white' }}>Métodos de Pago</h5>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#bdc3c7' }}>
                    <input type="checkbox" checked style={{ marginRight: '10px' }} /> Tarjeta de crédito/débito
                  </label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#bdc3c7' }}>
                    <input type="checkbox" checked style={{ marginRight: '10px' }} /> MercadoPago
                  </label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#bdc3c7' }}>
                    <input type="checkbox" style={{ marginRight: '10px' }} /> Transferencia bancaria
                  </label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#bdc3c7' }}>
                    <input type="checkbox" style={{ marginRight: '10px' }} /> Efectivo
                  </label>
                </div>
              </div>
              <div>
                <h5 style={{ marginBottom: '10px', color: 'white' }}>Integraciones</h5>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Stripe</span>
                  <span style={{ color: '#22c55e', marginLeft: '10px' }}> - Configurado</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>MercadoPago</span>
                  <span style={{ color: '#f59e0b', marginLeft: '10px' }}> - No configurado</span>
                </div>
              </div>
            </div>

            {/* Administración */}
            <div style={{ padding: '20px', backgroundColor: '#34495e', borderRadius: '5px', border: '1px solid #4a5f7f' }}>
              <h4 style={{ marginBottom: '15px', color: 'white' }}>Administración</h4>
              <p style={{ color: '#bdc3c7', marginBottom: '15px' }}>Usuarios internos y roles.</p>
              <button
                onClick={() => alert('Agregar Usuario')}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px' }}
              >
                Agregar Usuario
              </button>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Email</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Rol</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Fecha Creación</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #4a5f7f' }}>
                    <td style={{ padding: '10px', color: 'white' }}>davidgctd@gmail.com</td>
                    <td style={{ padding: '10px', color: 'white' }}>Owner</td>
                    <td style={{ padding: '10px', color: 'white' }}>2024-01-01</td>
                    <td style={{ padding: '10px' }}>
                      <button style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', color: 'white' }}>lucianaliriarte@gmail.com</td>
                    <td style={{ padding: '10px', color: 'white' }}>Owner</td>
                    <td style={{ padding: '10px', color: 'white' }}>2024-01-01</td>
                    <td style={{ padding: '10px' }}>
                      <button style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              padding: '10px 20px', 
              backgroundColor: '#34495e', 
              borderRadius: '5px', 
              border: '1px solid #4a5f7f',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              🕐 {currentTime.toLocaleTimeString('es-ES', { timeZone: timezone })}
            </div>
            <button
              onClick={handleLogout}
              style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
        {user && (
          <p style={{ marginTop: '10px', color: '#bdc3c7', fontSize: '14px' }}>Bienvenido, {user.full_name || user.email}</p>
        )}
      </header>

      <nav style={{ padding: '20px 30px', backgroundColor: '#2c3e50', borderBottom: '1px solid #34495e' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleViewChange('monitoring')}
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
            onClick={() => handleViewChange('clubs')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeView === 'clubs' ? '#34495e' : 'transparent', 
              color: 'white', 
              border: '1px solid #34495e', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '14px',
              position: 'relative'
            }}
          >
            🏟️ Clubes
            {pendingClubsCount > 0 && !clubsViewed && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {pendingClubsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleViewChange('business')}
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
            onClick={() => handleViewChange('backups')}
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
            onClick={() => handleViewChange('alerts')}
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
            {alerts.length > 0 && !alertsViewed && (
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
                {alerts.length}
              </span>
            )}
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
