import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../config/axios'
import { QRCodeSVG } from 'qrcode.react'

function ClubPanel() {
  const { t, i18n } = useTranslation()
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
  const [showConfig, setShowConfig] = useState(() => {
    const saved = localStorage.getItem('showConfig')
    return saved ? JSON.parse(saved) : false
  })
  const [config, setConfig] = useState({
    court_count: 1,
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'MX',
    currency: 'MXN',
    timezone: 'America/Hermosillo',
    operating_hours_start: '08:00',
    operating_hours_end: '22:00',
    hourly_price_normal: 200,
    hourly_price_peak: 300,
    lesson_1_2_players_price: 800,
    lesson_3_players_price: 1200,
    lesson_4_players_price: 1400,
    tax_id: '',
    tax_address: '',
    tax_condition: '',
    stripe_api_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: ''
  })

  const countryCurrencyMap = {
    'AR': 'ARS',
    'MX': 'MXN',
    'US': 'USD',
    'BR': 'BRL',
    'CO': 'COP',
    'CL': 'CLP',
    'PE': 'PEN',
    'ES': 'EUR',
    'UY': 'UYU',
    'PY': 'PYG',
    'BO': 'BOB',
    'EC': 'USD',
    'CR': 'CRC',
    'PA': 'USD',
    'DO': 'DOP',
    'VE': 'VES'
  }

  const handleCountryChange = (country) => {
    const currency = countryCurrencyMap[country] || 'USD'
    setConfig({...config, country, currency})
  }
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

  useEffect(() => {
    localStorage.setItem('showConfig', JSON.stringify(showConfig))
  }, [showConfig])


  const fetchClubData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch clubs (using first club for demo)
      const clubsResponse = await api.get('/clubs/')
      if (clubsResponse.data.length > 0) {
        const clubId = clubsResponse.data[0].id
        const clubData = clubsResponse.data[0]
        setClub(clubData)
        
        // Cargar datos del club en config
        setConfig({
          court_count: clubData.court_count || 4,
          name: clubData.name || '',
          email: clubData.email || '',
          phone: clubData.phone || '',
          address: clubData.address || '',
          city: clubData.city || '',
          country: clubData.country || 'MX',
          currency: clubData.currency || 'MXN',
          timezone: clubData.timezone || 'America/Hermosillo',
          operating_hours_start: clubData.operating_hours_start || '08:00',
          operating_hours_end: clubData.operating_hours_end || '22:00',
          hourly_price_normal: clubData.hourly_price || 200,
          hourly_price_peak: clubData.premium_hourly_price || 300,
          lesson_1_2_players_price: clubData.lesson_1_player_price || 800,
          lesson_3_players_price: clubData.lesson_3_player_price || 1200,
          lesson_4_players_price: clubData.lesson_4_player_price || 1400
        })
        
        // Change language based on club's language setting
        if (clubData.language) {
          i18n.changeLanguage(clubData.language)
        }
        
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

  const handleSaveConfig = async () => {
    if (!club) return
    
    try {
      // Update club configuration
      await api.put(`/clubs/${club.id}`, {
        country: config.country,
        currency: config.currency,
        timezone: config.timezone,
        operating_hours_start: config.operating_hours_start,
        operating_hours_end: config.operating_hours_end,
        hourly_price: config.hourly_price_normal,
        premium_hourly_price: config.hourly_price_peak,
        lesson_1_player_price: config.lesson_1_2_players_price,
        lesson_2_player_price: config.lesson_1_2_players_price,
        lesson_3_player_price: config.lesson_3_players_price,
        lesson_4_player_price: config.lesson_4_players_price,
        tax_id: config.tax_id,
        tax_address: config.tax_address,
        tax_condition: config.tax_condition,
        stripe_api_key: config.stripe_api_key,
        stripe_secret_key: config.stripe_secret_key,
        stripe_webhook_secret: config.stripe_webhook_secret
      })
      
      // Generate courts automatically
      console.log('Creating courts for club:', club.id, 'count:', config.court_count)
      for (let i = 1; i <= config.court_count; i++) {
        try {
          await api.post('/courts', {
            club_id: club.id,
            name: `Cancha ${i}`,
            number: i,
            surface: 'Sintético',
            is_indoor: false
          })
          console.log('Court created:', i)
        } catch (courtErr) {
          console.log('Court already exists or error creating court:', i, courtErr)
        }
      }
      
      fetchClubData()
      alert('Configuración guardada exitosamente. Las canchas fueron creadas automáticamente.')
    } catch (err) {
      console.error('Error saving config:', err)
      alert('Error al guardar configuración')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#ffffff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '10px', textAlign: 'center' }}>
            {club && (
              <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '5px', display: 'inline-block' }}>
                <QRCodeSVG value={`https://nexasist.com/club/${club.id}`} size={80} />
              </div>
            )}
          </div>
          <h1 style={{ color: '#ffffff' }}>Nexasist - {club ? club.name : 'Panel del Club'}</h1>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Navegación principal */}
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '10px' }}>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inicio</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Profesores</button>
        <button onClick={() => setShowConfig(true)} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Configuración</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Academia</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Torneo</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Pagos</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Calendario</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Reservas</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Socios</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Recompensas</button>
        <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Ayuda</button>
      </nav>

      {showConfig && club ? (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>⚙️ Configuración del Club</h2>
          <p style={{ marginBottom: '25px', color: '#cccccc' }}>Configura tu club. Estos datos son esenciales para el funcionamiento del sistema.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Cantidad de Canchas *</label>
              <input
                type="number"
                value={config.court_count}
                onChange={(e) => setConfig({...config, court_count: parseInt(e.target.value)})}
                min="1"
                max="50"
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>El sistema generará automáticamente la grilla de canchas</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>País *</label>
              <select
                value={config.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              >
                <option value="AR">Argentina</option>
                <option value="MX">México</option>
                <option value="US">Estados Unidos</option>
                <option value="BR">Brasil</option>
                <option value="CO">Colombia</option>
                <option value="CL">Chile</option>
                <option value="PE">Perú</option>
                <option value="ES">España</option>
                <option value="UY">Uruguay</option>
                <option value="PY">Paraguay</option>
                <option value="BO">Bolivia</option>
                <option value="EC">Ecuador</option>
                <option value="CR">Costa Rica</option>
                <option value="PA">Panamá</option>
                <option value="DO">República Dominicana</option>
                <option value="VE">Venezuela</option>
              </select>
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Moneda asignada automáticamente: {config.currency}</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Zona Horaria *</label>
              <select
                value={config.timezone}
                onChange={(e) => setConfig({...config, timezone: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              >
                <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                <option value="America/Argentina/Cordoba">Argentina (Córdoba)</option>
                <option value="America/Argentina/Mendoza">Argentina (Mendoza)</option>
                <option value="America/Mexico_City">México (Ciudad de México)</option>
                <option value="America/Monterrey">México (Monterrey)</option>
                <option value="America/Hermosillo">México (Hermosillo)</option>
                <option value="America/Tijuana">México (Tijuana)</option>
                <option value="America/Sao_Paulo">Brasil (São Paulo)</option>
                <option value="America/Lima">Perú (Lima)</option>
                <option value="America/Bogota">Colombia (Bogotá)</option>
                <option value="America/Santiago">Chile (Santiago)</option>
                <option value="America/Caracas">Venezuela (Caracas)</option>
                <option value="America/New_York">Estados Unidos (New York)</option>
                <option value="America/Los_Angeles">Estados Unidos (Los Angeles)</option>
                <option value="Europe/Madrid">España (Madrid)</option>
                <option value="Europe/Paris">Francia (París)</option>
                <option value="Europe/London">Reino Unido (Londres)</option>
              </select>
            </div>
          </div>


          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>🕐 Horarios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Hora Apertura</label>
              <input
                type="time"
                value={config.operating_hours_start}
                onChange={(e) => setConfig({...config, operating_hours_start: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Hora Cierre</label>
              <input
                type="time"
                value={config.operating_hours_end}
                onChange={(e) => setConfig({...config, operating_hours_end: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
            </div>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>💰 Precios de Cancha</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Precio Hora Normal</label>
              <input
                type="number"
                value={config.hourly_price_normal}
                onChange={(e) => setConfig({...config, hourly_price_normal: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Precio por hora (se multiplica por duración)</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Precio Hora Pico</label>
              <input
                type="number"
                value={config.hourly_price_peak}
                onChange={(e) => setConfig({...config, hourly_price_peak: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Precio por hora en horario pico</p>
            </div>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>🎾 Precios de Clases</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Clase 1-2 Personas</label>
              <input
                type="number"
                value={config.lesson_1_2_players_price}
                onChange={(e) => setConfig({...config, lesson_1_2_players_price: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Precio total por clase</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Clase 3 Personas</label>
              <input
                type="number"
                value={config.lesson_3_players_price}
                onChange={(e) => setConfig({...config, lesson_3_players_price: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Precio total (se divide por persona)</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Clase 4 Personas</label>
              <input
                type="number"
                value={config.lesson_4_players_price}
                onChange={(e) => setConfig({...config, lesson_4_players_price: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Precio total (se divide por persona)</p>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#cccccc', marginTop: '15px', marginBottom: '20px' }}>
            💡 Los precios de clases para 3 y 4 jugadores se dividen automáticamente por persona.
          </p>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>📄 Datos Fiscales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>CUIT / Tax ID</label>
              <input
                type="text"
                value={config.tax_id}
                onChange={(e) => setConfig({...config, tax_id: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Identificación fiscal del club</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Condición Impositiva</label>
              <input
                type="text"
                value={config.tax_condition}
                onChange={(e) => setConfig({...config, tax_condition: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Ej: Responsable Inscripto, Monotributo, etc.</p>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Dirección Fiscal</label>
            <input
              type="text"
              value={config.tax_address}
              onChange={(e) => setConfig({...config, tax_address: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
            />
            <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Dirección completa para facturación</p>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>💳 Configuración Stripe</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Stripe API Key</label>
              <input
                type="text"
                value={config.stripe_api_key}
                onChange={(e) => setConfig({...config, stripe_api_key: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Clave pública de Stripe</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Stripe Secret Key</label>
              <input
                type="password"
                value={config.stripe_secret_key}
                onChange={(e) => setConfig({...config, stripe_secret_key: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Clave secreta de Stripe</p>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Stripe Webhook Secret</label>
            <input
              type="password"
              value={config.stripe_webhook_secret}
              onChange={(e) => setConfig({...config, stripe_webhook_secret: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
            />
            <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>Secreto para verificar webhooks de Stripe</p>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowConfig(false)}
              style={{ padding: '15px 30px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              ❌ Cancelar
            </button>
            <button
              onClick={handleSaveConfig}
              style={{ padding: '15px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              ✅ Guardar Configuración y Crear Canchas
            </button>
          </div>
        </div>
      ) : (
        <div>
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
      </div>
      )}
    </div>
  )
}

export default ClubPanel
