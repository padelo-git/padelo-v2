import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ClubPanel() {
  const [club, setClub] = useState(null)
  const [courts, setCourts] = useState([])
  const [reservations, setReservations] = useState([])
  const [showCreateCourt, setShowCreateCourt] = useState(false)
  const [newCourt, setNewCourt] = useState({
    name: '',
    number: '',
    surface: '',
    is_indoor: false
  })
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchClubData()
  }, [navigate])

  const fetchClubData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch clubs (using first club for demo)
      const clubsResponse = await axios.get('http://localhost:8000/clubs/')
      if (clubsResponse.data.length > 0) {
        const clubId = clubsResponse.data[0].id
        setClub(clubsResponse.data[0])
        
        // Fetch courts for this club
        const courtsResponse = await axios.get(`http://localhost:8000/clubs/${clubId}/courts`)
        setCourts(courtsResponse.data)
        
        // Fetch reservations (mock for now)
        setReservations([])
      }
    } catch (err) {
      console.error('Error fetching club data:', err)
    }
  }

  const handleCreateCourt = async (e) => {
    e.preventDefault()
    if (!club) return
    
    try {
      await axios.post(`http://localhost:8000/clubs/${club.id}/courts`, {
        ...newCourt,
        number: parseInt(newCourt.number)
      })
      setShowCreateCourt(false)
      setNewCourt({
        name: '',
        number: '',
        surface: '',
        is_indoor: false
      })
      fetchClubData()
    } catch (err) {
      console.error('Error creating court:', err)
      alert('Error al crear la cancha')
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
        <h1>Padelo V2 - Panel del Club</h1>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </header>

      {club && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h2>{club.name}</h2>
          <p>Email: {club.email}</p>
          <p>Ciudad: {club.city || 'Sin ciudad'}</p>
          <p>País: {club.country || 'Sin país'}</p>
        </div>
      )}

      {showCreateCourt && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Crear Nueva Cancha</h3>
          <form onSubmit={handleCreateCourt}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre de la Cancha *</label>
                <input
                  type="text"
                  value={newCourt.name}
                  onChange={(e) => setNewCourt({...newCourt, name: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Número *</label>
                <input
                  type="number"
                  value={newCourt.number}
                  onChange={(e) => setNewCourt({...newCourt, number: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Superficie</label>
                <select
                  value={newCourt.surface}
                  onChange={(e) => setNewCourt({...newCourt, surface: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Césped">Césped</option>
                  <option value="Cemento">Cemento</option>
                  <option value="Sintético">Sintético</option>
                  <option value="Cristal">Cristal</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={newCourt.is_indoor}
                    onChange={(e) => setNewCourt({...newCourt, is_indoor: e.target.checked})}
                    style={{ marginRight: '10px' }}
                  />
                  Techada
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Crear Cancha
              </button>
              <button
                type="button"
                onClick={() => setShowCreateCourt(false)}
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
          <h3 style={{ marginBottom: '15px' }}>Canchas ({courts.length})</h3>
          {courts.length === 0 ? (
            <p>No hay canchas registradas</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {courts.map(court => (
                <li key={court.id} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <strong>{court.name}</strong>
                  <p style={{ fontSize: '14px', color: '#666' }}>Número: {court.number}</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>Superficie: {court.surface || 'Sin especificar'}</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>{court.is_indoor ? 'Techada' : 'Al aire libre'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Reservas ({reservations.length})</h3>
          {reservations.length === 0 ? (
            <p>No hay reservas pendientes</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {reservations.map(reservation => (
                <li key={reservation.id} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <strong>Reserva #{reservation.id}</strong>
                  <p style={{ fontSize: '14px', color: '#666' }}>{reservation.date} - {reservation.start_time}</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>Precio: ${reservation.price || 'N/A'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px' }}>Gestión del Club</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateCourt(true)}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Agregar Cancha
          </button>
          <button style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Ver Calendario
          </button>
          <button style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Ver Reportes
          </button>
          <button style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Editar Perfil
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClubPanel
