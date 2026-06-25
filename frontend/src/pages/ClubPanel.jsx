import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/axios'
import { QRCodeSVG } from 'qrcode.react'

function ClubPanel() {
  const [club, setClub] = useState(null)
  const [courts, setCourts] = useState([])
  const [reservations, setReservations] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [payments, setPayments] = useState([])
  const [debts, setDebts] = useState([])
  const [cashRegisters, setCashRegisters] = useState([])
  const [showCreateCourt, setShowCreateCourt] = useState(false)
  const [showCreateReservation, setShowCreateReservation] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const [showDebts, setShowDebts] = useState(false)
  const [showCashRegisters, setShowCashRegisters] = useState(false)
  const [newCourt, setNewCourt] = useState({
    name: '',
    number: '',
    surface: '',
    is_indoor: false
  })
  const [newReservation, setNewReservation] = useState({
    court_id: '',
    date: '',
    start_time: '',
    end_time: '',
    price: ''
  })
  const [newPayment, setNewPayment] = useState({
    user_id: '',
    amount: '',
    method: 'card', // card, cash, transfer
    description: ''
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
      const clubsResponse = await api.get('/clubs/')
      if (clubsResponse.data.length > 0) {
        const clubId = clubsResponse.data[0].id
        setClub(clubsResponse.data[0])
        
        // Fetch courts for this club
        const courtsResponse = await api.get(`/clubs/${clubId}/courts`)
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
      await api.post(`/clubs/${club.id}/courts`, {
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

  const handleCreateReservation = async (e) => {
    e.preventDefault()
    if (!club) return
    
    try {
      const token = localStorage.getItem('token')
      await api.post(`/clubs/${club.id}/reservations`, {
        ...newReservation,
        court_id: parseInt(newReservation.court_id),
        price: newReservation.price ? parseInt(newReservation.price) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowCreateReservation(false)
      setNewReservation({
        court_id: '',
        date: '',
        start_time: '',
        end_time: '',
        price: ''
      })
      fetchClubData()
    } catch (err) {
      console.error('Error creating reservation:', err)
      alert('Error al crear la reserva')
    }
  }

  const fetchReservationsForDate = async (date) => {
    try {
      const response = await api.get(`/clubs/${club.id}/reservations?date=${date}`)
      setReservations(response.data)
    } catch (err) {
      console.error('Error fetching reservations:', err)
    }
  }

  const fetchStatistics = async () => {
    if (!club) return
    try {
      const response = await api.get(`/clubs/${club.id}/statistics`)
      setStatistics(response.data)
    } catch (err) {
      console.error('Error fetching statistics:', err)
    }
  }

  const fetchPayments = async () => {
    if (!club) return
    try {
      const response = await api.get(`/clubs/${club.id}/payments`)
      setPayments(response.data)
    } catch (err) {
      console.error('Error fetching payments:', err)
    }
  }

  const fetchDebts = async () => {
    if (!club) return
    try {
      const response = await api.get(`/clubs/${club.id}/debts`)
      setDebts(response.data)
    } catch (err) {
      console.error('Error fetching debts:', err)
    }
  }

  const handleCreatePayment = async (e) => {
    e.preventDefault()
    if (!club) return
    
    try {
      const token = localStorage.getItem('token')
      await api.post(`/clubs/${club.id}/payments`, {
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowPayments(false)
      setNewPayment({
        user_id: '',
        amount: '',
        method: 'card',
        description: ''
      })
      fetchPayments()
    } catch (err) {
      console.error('Error creating payment:', err)
      alert('Error al registrar pago')
    }
  }

  const handleMarkDebtPaid = async (debtId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://18.212.126.125:8000/clubs/${club.id}/debts/${debtId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchDebts()
    } catch (err) {
      console.error('Error marking debt as paid:', err)
      alert('Error al marcar deuda como pagada')
    }
  }

  const fetchCashRegisters = async () => {
    if (!club) return
    try {
      const response = await axios.get(`http://18.212.126.125:8000/clubs/${club.id}/cash-registers`)
      setCashRegisters(response.data)
    } catch (err) {
      console.error('Error fetching cash registers:', err)
    }
  }

  const handleCreateCashRegister = async (name, registerType) => {
    if (!club) return
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://18.212.126.125:8000/clubs/${club.id}/cash-registers`, {
        name,
        register_type: registerType,
        balance: 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchCashRegisters()
    } catch (err) {
      console.error('Error creating cash register:', err)
      alert('Error al crear caja')
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

      {showCreateReservation && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Crear Nueva Reserva</h3>
          <form onSubmit={handleCreateReservation}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cancha *</label>
                <select
                  value={newReservation.court_id}
                  onChange={(e) => setNewReservation({...newReservation, court_id: e.target.value})}
                  required
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
                  value={newReservation.date}
                  onChange={(e) => setNewReservation({...newReservation, date: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora Inicio *</label>
                <input
                  type="time"
                  value={newReservation.start_time}
                  onChange={(e) => setNewReservation({...newReservation, start_time: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora Fin *</label>
                <input
                  type="time"
                  value={newReservation.end_time}
                  onChange={(e) => setNewReservation({...newReservation, end_time: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Precio</label>
                <input
                  type="number"
                  value={newReservation.price}
                  onChange={(e) => setNewReservation({...newReservation, price: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Crear Reserva
              </button>
              <button
                type="button"
                onClick={() => setShowCreateReservation(false)}
                style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showCalendar && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Calendario de Reservas</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Seleccionar Fecha</label>
            <input
              type="date"
              onChange={(e) => {
                if (e.target.value && club) {
                  fetchReservationsForDate(e.target.value)
                }
              }}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {courts.map(court => (
              <div key={court.id} style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                <h4 style={{ marginBottom: '10px' }}>{court.name}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Número: {court.number}</p>
                <p style={{ fontSize: '14px', color: '#666' }}>Superficie: {court.surface || 'N/A'}</p>
                <div style={{ marginTop: '10px' }}>
                  <strong style={{ fontSize: '12px' }}>Reservas del día:</strong>
                  {reservations.filter(r => r.court_id === court.id).length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#28a745' }}>Disponible</p>
                  ) : (
                    <ul style={{ fontSize: '12px', listStyle: 'none', padding: 0 }}>
                      {reservations.filter(r => r.court_id === court.id).map(res => (
                        <li key={res.id} style={{ padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                          {res.start_time} - {res.end_time}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showStatistics && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Estadísticas del Club</h3>
          {!statistics ? (
            <button
              onClick={fetchStatistics}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Cargar Estadísticas
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#007bff', marginBottom: '10px' }}>{statistics.total_courts}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Total Canchas</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#28a745', marginBottom: '10px' }}>{statistics.total_matches}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Total Partidos</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '10px' }}>{statistics.completed_matches}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Partidos Completados</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#ffc107', marginBottom: '10px' }}>{statistics.pending_matches}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Partidos Pendientes</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#6c757d', marginBottom: '10px' }}>{statistics.completion_rate}%</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Tasa de Completitud</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showQRCode && club && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Código QR del Club</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', border: '2px solid #ddd', borderRadius: '10px' }}>
              <QRCodeSVG 
                value={`https://nexasist.com/club/${club.slug}`}
                size={200}
                level="H"
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '10px' }}>{club.name}</h4>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                Escanea este código QR para registrarte como socio
              </p>
              <button
                onClick={() => {
                  const canvas = document.querySelector('canvas')
                  if (canvas) {
                    const link = document.createElement('a')
                    link.download = `qr-${club.slug}.png`
                    link.href = canvas.toDataURL()
                    link.click()
                  }
                }}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Descargar QR
              </button>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', fontSize: '14px', color: '#666' }}>
              <p><strong>Instrucciones:</strong></p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>Imprime este código QR</li>
                <li>Ponlo en la recepción del club</li>
                <li>Los jugadores pueden escanearlo para registrarse</li>
                <li>El código enlaza a: https://nexasist.com/club/{club.slug}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showPayments && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Gestión de Pagos</h3>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ marginBottom: '10px' }}>Registrar Nuevo Pago</h4>
            <form onSubmit={handleCreatePayment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Usuario ID</label>
                  <input
                    type="text"
                    value={newPayment.user_id}
                    onChange={(e) => setNewPayment({...newPayment, user_id: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Monto</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Método</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
                  >
                    <option value="card">Tarjeta</option>
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Descripción</label>
                <input
                  type="text"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <button
                type="submit"
                style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Registrar Pago
              </button>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px', textAlign: 'center' }}>
              <h4 style={{ fontSize: '24px', marginBottom: '5px' }}>${payments.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0)}</h4>
              <p style={{ fontSize: '14px' }}>Tarjeta</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#28a745', color: 'white', borderRadius: '5px', textAlign: 'center' }}>
              <h4 style={{ fontSize: '24px', marginBottom: '5px' }}>${payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0)}</h4>
              <p style={{ fontSize: '14px' }}>Efectivo</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#17a2b8', color: 'white', borderRadius: '5px', textAlign: 'center' }}>
              <h4 style={{ fontSize: '24px', marginBottom: '5px' }}>${payments.filter(p => p.method === 'transfer').reduce((sum, p) => sum + p.amount, 0)}</h4>
              <p style={{ fontSize: '14px' }}>Transferencia</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#6c757d', color: 'white', borderRadius: '5px', textAlign: 'center' }}>
              <h4 style={{ fontSize: '24px', marginBottom: '5px' }}>${payments.filter(p => p.description && p.description.includes('automática')).reduce((sum, p) => sum + p.amount, 0)}</h4>
              <p style={{ fontSize: '14px' }}>Sistema</p>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '10px' }}>Historial de Pagos</h4>
            {payments.length === 0 ? (
              <p style={{ color: '#666' }}>No hay pagos registrados</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {payments.map(payment => (
                  <li key={payment.id} style={{ padding: '10px', marginBottom: '5px', backgroundColor: '#f8f9fa', borderRadius: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>${payment.amount}</strong>
                      <p style={{ fontSize: '12px', color: '#666' }}>{payment.method === 'card' ? 'Tarjeta' : payment.method === 'cash' ? 'Efectivo' : 'Transferencia'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '12px', color: '#666' }}>{payment.description || 'Sin descripción'}</p>
                      <p style={{ fontSize: '12px', color: '#666' }}>{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showDebts && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Gestión de Deudas</h3>
          
          <div style={{ padding: '15px', backgroundColor: '#dc3545', color: 'white', borderRadius: '5px', textAlign: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '32px', marginBottom: '5px' }}>${debts.filter(d => !d.paid).reduce((sum, d) => sum + d.amount, 0)}</h4>
            <p style={{ fontSize: '14px' }}>Total Deuda Pendiente</p>
          </div>

          <div>
            <h4 style={{ marginBottom: '10px' }}>Deudores</h4>
            {debts.length === 0 ? (
              <p style={{ color: '#666' }}>No hay deudas registradas</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {debts.filter(d => !d.paid).map(debt => (
                  <li key={debt.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{debt.user_name || 'Usuario #' + debt.user_id}</strong>
                        <p style={{ fontSize: '14px', color: '#dc3545', fontWeight: 'bold' }}>${debt.amount}</p>
                        <p style={{ fontSize: '12px', color: '#666' }}>{debt.description || 'Sin descripción'}</p>
                      </div>
                      <button
                        onClick={() => handleMarkDebtPaid(debt.id)}
                        style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                      >
                        Marcar Pagado
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showCashRegisters && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Sistema de Cajas</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => handleCreateCashRegister('Caja Principal', 'main')}
              style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
            >
              + Caja Principal
            </button>
            <button
              onClick={() => handleCreateCashRegister('Caja Efectivo', 'cash')}
              style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
            >
              + Caja Efectivo
            </button>
            <button
              onClick={() => handleCreateCashRegister('Caja Tarjeta', 'card')}
              style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
            >
              + Caja Tarjeta
            </button>
            <button
              onClick={() => handleCreateCashRegister('Caja Transferencia', 'transfer')}
              style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              + Caja Transferencia
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {cashRegisters.length === 0 ? (
              <p style={{ color: '#666' }}>No hay cajas registradas</p>
            ) : (
              cashRegisters.map(register => (
                <div key={register.id} style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '2px solid #ddd' }}>
                  <h4 style={{ marginBottom: '10px' }}>{register.name}</h4>
                  <p style={{ fontSize: '24px', color: '#007bff', fontWeight: 'bold', marginBottom: '5px' }}>${register.balance}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>Tipo: {register.register_type}</p>
                </div>
              ))
            )}
          </div>
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
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px', fontWeight: 'bold' }}>Operaciones</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreateReservation(true)}
              style={{ padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              📅 Nueva Reserva
            </button>
            <button
              onClick={() => setShowCalendar(true)}
              style={{ padding: '12px 24px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              📆 Calendario
            </button>
            <button
              onClick={() => setShowCreateCourt(true)}
              style={{ padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              🏟️ Agregar Cancha
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px', fontWeight: 'bold' }}>Finanzas</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setShowPayments(true); fetchPayments(); }}
              style={{ padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              💰 Pagos
            </button>
            <button
              onClick={() => { setShowDebts(true); fetchDebts(); }}
              style={{ padding: '12px 24px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              📋 Deudas
            </button>
            <button
              onClick={() => { setShowCashRegisters(true); fetchCashRegisters(); }}
              style={{ padding: '12px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              🏦 Cajas
            </button>
          </div>
        </div>

        <div>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px', fontWeight: 'bold' }}>Configuración</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowStatistics(true)}
              style={{ padding: '12px 24px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              📊 Estadísticas
            </button>
            <button
              onClick={() => setShowQRCode(true)}
              style={{ padding: '12px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              📱 Código QR
            </button>
            <button style={{ padding: '12px 24px', backgroundColor: '#343a40', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              ⚙️ Editar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClubPanel
