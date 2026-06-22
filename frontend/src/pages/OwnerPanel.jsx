import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function OwnerPanel() {
  const [user, setUser] = useState(null)
  const [clubs, setClubs] = useState([])
  const [courts, setCourts] = useState([])
  const [matches, setMatches] = useState([])
  const [showCreateClub, setShowCreateClub] = useState(false)
  const [showCreateMatch, setShowCreateMatch] = useState(false)
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
  const [newMatch, setNewMatch] = useState({
    club_id: '',
    court_id: '',
    date: '',
    start_time: '',
    end_time: '',
    category: '',
    gender: '',
    price: ''
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
    fetchMatches()
  }, [navigate])

  useEffect(() => {
    if (newMatch.club_id) {
      fetchCourtsForClub(newMatch.club_id)
    }
  }, [newMatch.club_id])

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

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:8000/matches/')
      setMatches(response.data)
    } catch (err) {
      console.error('Error fetching matches:', err)
    }
  }

  const fetchCourtsForClub = async (clubId) => {
    try {
      const response = await axios.get(`http://localhost:8000/clubs/${clubId}/courts`)
      setCourts(response.data)
    } catch (err) {
      console.error('Error fetching courts:', err)
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

  const handleCreateMatch = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:8000/matches/', {
        ...newMatch,
        court_id: parseInt(newMatch.court_id),
        price: newMatch.price ? parseInt(newMatch.price) : null,
        created_by: user?.id || 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowCreateMatch(false)
      setNewMatch({
        club_id: '',
        court_id: '',
        date: '',
        start_time: '',
        end_time: '',
        category: '',
        gender: '',
        price: ''
      })
      fetchMatches()
    } catch (err) {
      console.error('Error creating match:', err)
      alert('Error al crear el partido')
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
          <h3 style={{ marginBottom: '15px' }}>Crear Nuevo Club</h3>
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

      {showCreateMatch && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Crear Nuevo Partido</h3>
          <form onSubmit={handleCreateMatch}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Club *</label>
                <select
                  value={newMatch.club_id}
                  onChange={(e) => setNewMatch({...newMatch, club_id: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value="">Seleccionar club...</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cancha *</label>
                <select
                  value={newMatch.court_id}
                  onChange={(e) => setNewMatch({...newMatch, court_id: e.target.value})}
                  required
                  disabled={!newMatch.club_id}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value="">Seleccionar cancha...</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Fecha *</label>
                <input
                  type="date"
                  value={newMatch.date}
                  onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora Inicio *</label>
                <input
                  type="time"
                  value={newMatch.start_time}
                  onChange={(e) => setNewMatch({...newMatch, start_time: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora Fin *</label>
                <input
                  type="time"
                  value={newMatch.end_time}
                  onChange={(e) => setNewMatch({...newMatch, end_time: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Categoría *</label>
                <select
                  value={newMatch.category}
                  onChange={(e) => setNewMatch({...newMatch, category: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Profesional">Profesional</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Género *</label>
                <select
                  value={newMatch.gender}
                  onChange={(e) => setNewMatch({...newMatch, gender: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="mixed">Mixto</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Precio</label>
                <input
                  type="number"
                  value={newMatch.price}
                  onChange={(e) => setNewMatch({...newMatch, price: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Crear Partido
              </button>
              <button
                type="button"
                onClick={() => setShowCreateMatch(false)}
                style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Mis Clubs ({clubs.length})</h3>
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
          <h3 style={{ marginBottom: '15px' }}>Partidos ({matches.length})</h3>
          {matches.length === 0 ? (
            <p>No hay partidos programados</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {matches.slice(0, 5).map(match => (
                <li key={match.id} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <strong>{match.category}</strong>
                  <p style={{ fontSize: '14px', color: '#666' }}>{match.date} - {match.start_time}</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>Estado: {match.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px' }}>Acciones Rápidas</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateClub(true)}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Crear Nuevo Club
          </button>
          <button
            onClick={() => setShowCreateMatch(true)}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Crear Partido
          </button>
          <button style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Ver Estadísticas
          </button>
        </div>
      </div>
    </div>
  )
}

export default OwnerPanel
