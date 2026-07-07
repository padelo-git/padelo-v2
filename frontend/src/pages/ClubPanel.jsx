import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../config/axios'
import { QRCodeSVG } from 'qrcode.react'

function ClubPanel() {
  const { t, i18n } = useTranslation()
  const [club, setClub] = useState(null)
  const [courts, setCourts] = useState([])
  const [courtsById, setCourtsById] = useState({})
  const [reservations, setReservations] = useState([])
  const [reservationsBySlot, setReservationsBySlot] = useState({})
  const [statistics, setStatistics] = useState(null)
  const [payments, setPayments] = useState([])
  const [debts, setDebts] = useState([])
  const [cashRegisters, setCashRegisters] = useState([])
  const [showCreateCourt, setShowCreateCourt] = useState(false)
  const [showCreateReservation, setShowCreateReservation] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab')
    return saved ? JSON.parse(saved) : 'inicio'
  })
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
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
    hourly_price: 200,
    premium_hourly_price: 300,
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

  const countryTaxIdMap = {
    'AR': 'CUIT',
    'MX': 'RFC',
    'US': 'EIN / Tax ID',
    'BR': 'CNPJ / CPF',
    'CO': 'NIT',
    'CL': 'RUT',
    'PE': 'RUC',
    'ES': 'NIF / CIF',
    'UY': 'RUT',
    'PY': 'RUC',
    'BO': 'NIT',
    'EC': 'RUC',
    'CR': 'Cédula Jurídica',
    'PA': 'RUC',
    'DO': 'RNC',
    'VE': 'RIF'
  }

  const countryTaxConditionMap = {
    'AR': 'Responsable Inscripto / Monotributo / Exento',
    'MX': 'Persona Moral / Persona Física',
    'US': 'LLC / Corporation / Sole Proprietor',
    'BR': 'Pessoa Jurídica / Pessoa Física',
    'CO': 'Persona Jurídica / Persona Natural',
    'CL': 'Empresa / Persona Natural',
    'PE': 'Persona Jurídica / Persona Natural',
    'ES': 'Autónomo / Empresa',
    'UY': 'Persona Jurídica / Persona Física',
    'PY': 'Persona Jurídica / Persona Física',
    'BO': 'Persona Jurídica / Persona Natural',
    'EC': 'Persona Jurídica / Persona Natural',
    'CR': 'Persona Jurídica / Persona Física',
    'PA': 'Persona Jurídica / Persona Natural',
    'DO': 'Persona Jurídica / Persona Física',
    'VE': 'Persona Jurídica / Persona Natural'
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
  const [dragStartY, setDragStartY] = useState(null)
  const [dragCurrentY, setDragCurrentY] = useState(null)
  const courtRefs = useRef([])
  const navigate = useNavigate()
  
  // Estado para mantener la selección visible mientras el modal está abierto
  const [showSelectionOverlay, setShowSelectionOverlay] = useState(false)

  // Estado para el tooltip hover
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    reservation: null
  })
  
  // Estado para el modal de reserva
  const [reservationType, setReservationType] = useState('normal')
  const [players, setPlayers] = useState([
    { name: '', paymentMethod: 'pendiente' },
    { name: '', paymentMethod: 'pendiente' },
    { name: '', paymentMethod: 'pendiente' },
    { name: '', paymentMethod: 'pendiente' }
  ])
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [selectedReservation, setSelectedReservation] = useState(null)

  // Función para calcular el precio según las reglas del usuario
  const calculatePrice = () => {
    if (!dragStart || !dragEnd) return 0

    const startHour = parseInt(config.operating_hours_start) + Math.floor(dragStart.hourIndex / 2)
    const endHour = parseInt(config.operating_hours_start) + Math.floor(dragEnd.hourIndex / 2)
    const startMin = dragStart.hourIndex % 2 === 0 ? 0 : 30
    const endMin = dragEnd.hourIndex % 2 === 0 ? 0 : 30

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    const durationHours = durationMinutes / 60

    if (reservationType === 'clases') {
      // Para clases: precio fijo según número de jugadores (usando config del club)
      const activePlayers = players.filter(p => p.name.trim() !== '').length
      if (activePlayers <= 2) {
        return config.lesson_1_2_players_price || 800
      } else if (activePlayers === 3) {
        return config.lesson_3_players_price || 1200
      } else if (activePlayers === 4) {
        return config.lesson_4_players_price || 1400
      }
      return config.lesson_1_2_players_price || 800
    } else {
      // Para reservas normales: precio según hora (usando config del club)
      // Determinar si es hora peak (después de las 5PM o antes de las 6AM)
      const isPeakHour = startHour >= 17 || startHour < 6
      const hourlyRate = isPeakHour ? (config.hourly_price_peak || 400) : (config.hourly_price_normal || 220)
      return Math.round(hourlyRate * durationHours)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchClubData()
  }, [navigate])

  // Actualizar precio calculado cuando cambie el tipo de reserva o los jugadores
  useEffect(() => {
    const price = calculatePrice()
    setCalculatedPrice(price)
  }, [reservationType, players, dragStart, dragEnd])

  useEffect(() => {
    localStorage.setItem('activeTab', JSON.stringify(activeTab))
  }, [activeTab])

  // Initialize selectedDate with local timezone
  useEffect(() => {
    const getLocalDate = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    setSelectedDate(getLocalDate())
  }, [])

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Load reservations when selected date changes or club is loaded
  useEffect(() => {
    console.log('=== useEffect for reservations ===')
    console.log('selectedDate:', selectedDate)
    console.log('club:', club)
    console.log('club.id:', club?.id)
    if (selectedDate && club && club.id) {
      console.log('Calling fetchReservationsForDate')
      fetchReservationsForDate(selectedDate)
    } else {
      console.log('Not calling fetchReservationsForDate - missing data')
    }
  }, [selectedDate, club])

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
          hourly_price: clubData.hourly_price || 200,
          premium_hourly_price: clubData.premium_hourly_price || 300,
          lesson_1_2_players_price: clubData.lesson_1_player_price || 800,
          lesson_3_players_price: clubData.lesson_3_player_price || 1200,
          lesson_4_players_price: clubData.lesson_4_player_price || 1400,
          tax_id: clubData.tax_id || '',
          tax_address: clubData.tax_address || '',
          tax_condition: clubData.tax_condition || '',
          stripe_api_key: clubData.stripe_public_key || '',
          stripe_secret_key: clubData.stripe_secret_key || '',
          stripe_webhook_secret: clubData.stripe_webhook_secret || ''
        })
        
        // Change language based on club's language setting
        if (clubData.language) {
          i18n.changeLanguage(clubData.language)
        }
        
        // Fetch courts for this club
        const courtsResponse = await api.get(`/clubs/${clubId}/courts`)
        setCourts(courtsResponse.data)
        
        // Create a map of courts by ID for robust lookup
        const courtsMap = {}
        courtsResponse.data.forEach(court => {
          courtsMap[court.id] = court
        })
        setCourtsById(courtsMap)

        // Reservations are now loaded separately by fetchReservationsForDate
      }
    } catch (err) {
      console.error('Error fetching club data:', err)
    }
  }

  const fetchReservationsForDate = async (date) => {
    try {
      if (!club || !club.id) {
        return
      }
      const dateStr = typeof date === 'string' ? date : (date.toISOString ? date.toISOString().split('T')[0] : date)
      const reservationsResponse = await api.get(`/clubs/${club.id}/reservations-by-date?date=${dateStr}`)
      const allReservations = reservationsResponse.data
      setReservations(allReservations)

      // Usar arquitectura del sistema viejo: mapear reservas por minutos absolutos
      const slotMap = {}
      const day0 = parseInt(config.operating_hours_start) * 60
      const day1 = parseInt(config.operating_hours_end) * 60
      const slot = 30 // 30 minutos por slot

      allReservations.forEach(r => {
        const s = parseHM(r.start_time)
        const e = parseHM(r.end_time)
        if (s == null || e == null || e <= s) return

        // Calcular slotIndex desde minutos absolutos (como en el sistema viejo)
        const startSlotIndex = Math.floor((s - day0) / slot)
        const endSlotIndex = Math.floor((e - day0) / slot)

        // Incluir todos los slots desde startSlotIndex hasta endSlotIndex - 1
        for (let slotIdx = startSlotIndex; slotIdx < endSlotIndex; slotIdx++) {
          const key = `${r.court_id}-${slotIdx}`
          slotMap[key] = r
        }
      })
      setReservationsBySlot(slotMap)
    } catch (err) {
      console.error('Error fetching reservations:', err)
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

  // Helper functions del sistema viejo para conversión de tiempo
  const parseHM = (s) => {
    const parts = String(s || "").trim().split(":")
    if (parts.length !== 2) return null
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    if (h === 24 && m === 0) return 24 * 60
    if (h < 0 || h > 23 || m < 0 || m > 59) return null
    return h * 60 + m
  }

  const formatHM = (mins) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0")
  }

  const minsFromEvent = (ev, containerRef) => {
    if (!containerRef) return null
    const rect = containerRef.getBoundingClientRect()
    const clientY = ev.clientY
    const ratio = (clientY - rect.top) / rect.height
    const day0 = parseInt(config.operating_hours_start) * 60
    const day1 = parseInt(config.operating_hours_end) * 60
    const range = day1 - day0
    const slot = 30 // 30 minutos por slot
    let mins = day0 + ratio * range
    mins = Math.round(mins / slot) * slot
    if (mins < day0) mins = day0
    if (mins > day1) mins = day1
    return mins
  }

  const handleSlotMouseDown = (courtIndex, hourIndex, e) => {
    // Usar minsFromEvent del sistema viejo para calcular minutos desde posición del mouse
    const containerRef = courtRefs.current[courtIndex]
    const mins = minsFromEvent(e, containerRef)
    if (mins == null) return

    const dayStartMin = parseInt(config.operating_hours_start) * 60
    const slot = 30 // 30 minutos por slot
    const calculatedHourIndex = Math.floor((mins - dayStartMin) / slot)

    setIsDragging(true)
    setDragStart({ courtIndex, hourIndex: calculatedHourIndex, mins })
    setDragEnd(null)
    setSelectedCourt(courtIndex)
    setDragStartY(e.clientY)
    setDragCurrentY(e.clientY)
  }

  const handleSlotMouseMove = (courtIndex, hourIndex, e) => {
    if (isDragging && selectedCourt === courtIndex) {
      // Usar minsFromEvent del sistema viejo para calcular minutos desde posición del mouse
      const containerRef = courtRefs.current[courtIndex]
      const mins = minsFromEvent(e, containerRef)
      if (mins == null) return

      const dayStartMin = parseInt(config.operating_hours_start) * 60
      const slot = 30 // 30 minutos por slot
      const calculatedHourIndex = Math.floor((mins - dayStartMin) / slot)

      setDragEnd({ courtIndex, hourIndex: calculatedHourIndex, mins })
      setDragCurrentY(e.clientY)
    }
  }

  const handleSlotMouseUp = (courtIndex, slotIndex) => {
    const courtId = courts[courtIndex]?.id
    const reservation = courtId ? reservationsBySlot[`${courtId}-${slotIndex}`] : null

    if (isDragging && dragStart && dragEnd) {
      // Es un drag para crear nueva reserva
      setIsDragging(false)
      setShowSelectionOverlay(true)
      setShowReservationModal(true)
    } else if (reservation && dragStart && dragStart.hourIndex === slotIndex) {
      // Es un click simple en una reserva existente
      setSelectedReservation(reservation)
      setShowReservationModal(true)
    }
  }

  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation)
    setShowReservationModal(true)
  }

  const handleReservationMouseEnter = (e, reservation) => {
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      reservation
    })
  }

  const handleReservationMouseMove = (e) => {
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        x: e.clientX,
        y: e.clientY
      }))
    }
  }

  const handleReservationMouseLeave = () => {
    setTooltip({
      visible: false,
      x: 0,
      y: 0,
      reservation: null
    })
  }

  const calculatePriceForTooltip = (reservation) => {
    const type = reservation.reservation_type || (reservation.notes && reservation.notes.includes('Clase') ? 'class' : 'normal')
    const playerCount = reservation.players ? reservation.players.filter(p => p && p.trim() !== '').length : 0

    console.log('=== DEBUG PRICE CALCULATION ===')
    console.log('reservation:', reservation)
    console.log('type:', type)
    console.log('playerCount:', playerCount)
    console.log('config.hourly_price_normal:', config.hourly_price_normal)

    if (type === 'class') {
      // Precio de clase según configuración
      if (playerCount <= 2) return config.lesson_1_2_players_price || 800
      if (playerCount === 3) return config.lesson_3_players_price || 900
      if (playerCount >= 4) return config.lesson_4_players_price || 1000
      return 0
    } else {
      // Precio de reserva normal
      const s = parseHM(reservation.start_time)
      const e = parseHM(reservation.end_time)
      if (s == null || e == null) return 0

      const durationHours = (e - s) / 60
      const hourlyPrice = config.hourly_price_normal || 1000
      const totalPrice = hourlyPrice * durationHours
      const pricePerPlayer = playerCount > 0 ? totalPrice / playerCount : totalPrice

      console.log('s (minutes):', s)
      console.log('e (minutes):', e)
      console.log('durationHours:', durationHours)
      console.log('hourlyPrice:', hourlyPrice)
      console.log('totalPrice:', totalPrice)
      console.log('pricePerPlayer:', pricePerPlayer)
      console.log('=== END DEBUG ===')

      return pricePerPlayer
    }
  }

  const isSlotSelected = (courtIndex, hourIndex) => {
    // Usar showSelectionOverlay cuando el modal está abierto
    if (!isDragging && !showSelectionOverlay) {
      return false
    }
    if (!dragStart || !dragEnd || selectedCourt !== courtIndex) {
      return false
    }
    const startIndex = dragStart.hourIndex
    const endIndex = dragEnd.hourIndex
    // No seleccionar si solo se hizo click sin arrastrar
    if (startIndex === endIndex) {
      return false
    }
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    return hourIndex >= minIndex && hourIndex <= maxIndex
  }

  const getReservationForSlot = (courtId, slotIndex) => {
    if (!reservations || !courtId) return null
    
    const hour = parseInt(config.operating_hours_start) + Math.floor(slotIndex / 2)
    const isHalfHour = slotIndex % 2 === 1
    
    // Find reservation for this court, date, and time
    const found = reservations.find(r => {
      if (r.court_id !== courtId) return false
      
      // Check if the reservation date matches the selected date
      const reservationDate = new Date(r.date)
      const selectedDateObj = new Date(selectedDate)
      const dateMatches = reservationDate.toDateString() === selectedDateObj.toDateString()
      if (!dateMatches) return false
      
      // Check if the reservation covers this time slot
      const resStartHour = parseInt(r.start_time.split(':')[0])
      const resStartMin = parseInt(r.start_time.split(':')[1])
      const resEndHour = parseInt(r.end_time.split(':')[0])
      const resEndMin = parseInt(r.end_time.split(':')[1])
      
      const slotMinutes = hour * 60 + (isHalfHour ? 30 : 0)
      const resStartMinutes = resStartHour * 60 + resStartMin
      const resEndMinutes = resEndHour * 60 + resEndMin
      
      const timeMatches = slotMinutes >= resStartMinutes && slotMinutes < resEndMinutes
      return timeMatches
    })
    
    return found
  }

  const getDragOverlayStyle = (courtIndex, containerRef) => {
    // Mostrar overlay tanto durante drag como cuando el modal está abierto
    if (!isDragging && !showSelectionOverlay) {
      return { display: 'none' }
    }
    if (!dragStartY || !dragCurrentY || selectedCourt !== courtIndex || !containerRef) {
      return { display: 'none' }
    }
    const rect = containerRef.getBoundingClientRect()
    const relativeStartY = dragStartY - rect.top
    const relativeCurrentY = dragCurrentY - rect.top
    const height = Math.abs(relativeCurrentY - relativeStartY)
    const top = Math.min(relativeStartY, relativeCurrentY)
    return {
      position: 'absolute',
      top: `${top}px`,
      left: '0',
      right: '0',
      height: `${height}px`,
      backgroundColor: 'rgba(245, 158, 11, 0.5)',
      pointerEvents: 'none',
      zIndex: 10
    }
  }

  const closeModal = () => {
    setShowReservationModal(false)
    setShowSelectionOverlay(false)
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
    setSelectedCourt(null)
    setDragStartY(null)
    setDragCurrentY(null)
    setReservationType('normal')
    setPlayers([
      { name: '', paymentMethod: 'pendiente' },
      { name: '', paymentMethod: 'pendiente' },
      { name: '', paymentMethod: 'pendiente' },
      { name: '', paymentMethod: 'pendiente' }
    ])
    setSelectedReservation(null)
  }

  const handleCreateReservation = async () => {
    if (!club || !dragStart || !dragEnd) {
      alert('Error: Faltan datos requeridos')
      closeModal()
      return
    }

    if (selectedCourt === null || selectedCourt === undefined) {
      alert('Error: No se seleccionó ninguna cancha')
      closeModal()
      return
    }
    
    try {
      // Usar arquitectura del sistema viejo: usar formatHM para conversión de tiempos
      console.log('=== DEBUG TIME CALCULATION ===')
      console.log('dragStart.mins:', dragStart.mins)
      console.log('dragEnd.mins:', dragEnd.mins)

      const startTime = formatHM(dragStart.mins)
      const endTime = formatHM(dragEnd.mins)

      console.log('Calculated time:', `${startTime} - ${endTime}`)
      console.log('=== END DEBUG ===')

      // La hora de fin es exactamente el slot seleccionado, sin ajustes
      // Usar el precio calculado por la función calculatePrice
      const price = calculatedPrice

      // Obtener court_id de la cancha seleccionada
      const court = courts[selectedCourt]
      if (!court) {
        alert(`Error: No se encontró la cancha en el índice ${selectedCourt}. Por favor, recarga la página.`)
        closeModal()
        return
      }

      const token = localStorage.getItem('token')

      const reservationData = {
        club_id: club.id,
        court_id: court.id,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        reservation_type: reservationType === 'clases' ? 'class' : 'normal',
        price: Math.round(price),
        notes: reservationType === 'clases' ? 'Clase' : 'Reserva normal',
        players: players.filter(p => p.name.trim() !== '').map(p => p.name)
      }

      const response = await api.post('/clubs/reservations', reservationData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Reserva creada exitosamente')
      closeModal()

      // Recargar reservas para mostrar la nueva reserva
      fetchReservationsForDate(selectedDate)
    } catch (err) {
      console.error('Error creating reservation:', err)

      // Build detailed error message
      let errorDetails = 'Error al crear la reserva:\n\n'
      errorDetails += `Status: ${err.response?.status}\n`
      errorDetails += `StatusText: ${err.response?.statusText}\n`
      errorDetails += `Message: ${err.message}\n`
      if (err.response?.data) {
        errorDetails += `Data: ${JSON.stringify(err.response.data, null, 2)}\n`
      }

      // Show in alert
      alert(errorDetails)

      closeModal()
    }
  }

  const handleDeleteReservation = async (reservationId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta reserva?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await api.delete(`/clubs/reservations/${reservationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Reserva eliminada exitosamente')
      closeModal()
      fetchReservationsForDate(selectedDate)
    } catch (err) {
      console.error('Error deleting reservation:', err)
      console.error('Error response:', err.response)
      console.error('Error status:', err.response?.status)
      console.error('Error data:', err.response?.data)
      alert(`Error al eliminar la reserva: ${err.response?.data?.detail || err.message}`)
    }
  }

  const handleGeneratePayments = async (reservation) => {
    try {
      const token = localStorage.getItem('token')
      
      // Generar pagos para cada jugador
      if (reservation.players && reservation.players.length > 0) {
        for (const playerName of reservation.players) {
          await api.post(`/clubs/${club.id}/payments`, {
            user_id: null, // TODO: Implementar sistema de usuarios
            amount: reservation.price / reservation.players.length,
            method: 'sistema',
            description: `Pago de reserva: ${playerName}`
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        }
      }
      
      alert('Pagos generados exitosamente')
      closeModal()
      fetchPayments()
    } catch (err) {
      console.error('Error generating payments:', err)
      alert('Error al generar los pagos')
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
        stripe_public_key: config.stripe_api_key,
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
      setActiveTab('inicio')
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
              <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '5px', display: 'inline-block' }}>
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
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '0px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '10px' }}>
        <button onClick={() => setActiveTab('inicio')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'inicio' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inicio</button>
        <button onClick={() => setActiveTab('profesores')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'profesores' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Profesores</button>
        <button onClick={() => setActiveTab('configuracion')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'configuracion' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Configuración</button>
        <button onClick={() => setActiveTab('academia')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'academia' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Academia</button>
        <button onClick={() => setActiveTab('torneo')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'torneo' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Torneo</button>
        <button onClick={() => setActiveTab('pagos')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'pagos' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Pagos</button>
        <button onClick={() => setActiveTab('calendario')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'calendario' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Calendario</button>
        <button onClick={() => setActiveTab('reservas')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'reservas' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Reservas</button>
        <button onClick={() => setActiveTab('socios')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'socios' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Socios</button>
        <button onClick={() => setActiveTab('recompensas')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'recompensas' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Recompensas</button>
        <button onClick={() => setActiveTab('ayuda')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'ayuda' ? '#0056b3' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Ayuda</button>
      </nav>

      {activeTab === 'configuracion' && (
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>{countryTaxIdMap[config.country] || 'Tax ID'}</label>
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
              <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '5px' }}>{countryTaxConditionMap[config.country] || 'Condición fiscal'}</p>
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
              onClick={() => setActiveTab('inicio')}
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
      )}


      {showCreateCourt && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Número *</label>
                <input
                  type="number"
                  value={newCourt.number}
                  onChange={(e) => setNewCourt({...newCourt, number: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Superficie</label>
                <select
                  value={newCourt.surface}
                  onChange={(e) => setNewCourt({...newCourt, surface: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
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
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Crear Nueva Reserva</h3>
          <form onSubmit={handleCreateReservation}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cancha *</label>
                <select
                  value={newReservation.court_id}
                  onChange={(e) => setNewReservation({...newReservation, court_id: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
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
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora Inicio *</label>
                <input
                  type="time"
                  value={newReservation.start_time}
                  onChange={(e) => setNewReservation({...newReservation, start_time: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora Fin *</label>
                <input
                  type="time"
                  value={newReservation.end_time}
                  onChange={(e) => setNewReservation({...newReservation, end_time: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Precio</label>
                <input
                  type="number"
                  value={newReservation.price}
                  onChange={(e) => setNewReservation({...newReservation, price: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px' }}
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

      {activeTab === 'calendario' && (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {/* Header con navegación de fechas, reloj y leyenda */}
          <div style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', backgroundColor: '#1a1a1a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  const date = new Date(selectedDate + 'T00:00:00')
                  date.setDate(date.getDate() - 1)
                  const year = date.getFullYear()
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const day = String(date.getDate()).padStart(2, '0')
                  setSelectedDate(`${year}-${month}-${day}`)
                }}
                style={{ padding: '8px 12px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '5px', cursor: 'pointer' }}
              >
                ←
              </button>
              <button
                onClick={() => {
                  const now = new Date()
                  const year = now.getFullYear()
                  const month = String(now.getMonth() + 1).padStart(2, '0')
                  const day = String(now.getDate()).padStart(2, '0')
                  setSelectedDate(`${year}-${month}-${day}`)
                }}
                style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Hoy
              </button>
              <button
                onClick={() => {
                  const date = new Date(selectedDate + 'T00:00:00')
                  date.setDate(date.getDate() + 1)
                  const year = date.getFullYear()
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const day = String(date.getDate()).padStart(2, '0')
                  setSelectedDate(`${year}-${month}-${day}`)
                }}
                style={{ padding: '8px 12px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '5px', cursor: 'pointer' }}
              >
                →
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '8px', border: '1px solid #444', borderRadius: '5px' }}
              />
              {/* Reloj */}
              <div style={{ padding: '8px 12px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                🕐 {currentTime}
              </div>
            </div>
            
            {/* Leyenda de colores */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#3B82F6', borderRadius: '4px', border: '2px solid #2563eb' }}></div>
                <span>Partido</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#8B5CF6', borderRadius: '4px', border: '2px solid #7c3aed' }}></div>
                <span>Clases</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#F97316', borderRadius: '4px', border: '2px solid #ea580c' }}></div>
                <span>Manual / App móvil</span>
              </div>
            </div>
          </div>

          {/* Grilla de canchas */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', backgroundColor: '#1a1a1a' }}>
            <div style={{ minWidth: '60px', borderRight: '1px solid #333', backgroundColor: '#1a1a1a' }}>
              {/* Header vacío para alinear con header de canchas */}
              <div style={{ padding: '15px', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}></div>
              {/* Columna de horarios - posición porcentual como sistema viejo */}
              <div style={{ position: 'relative', height: `${(parseInt(config.operating_hours_end) - parseInt(config.operating_hours_start)) * 60}px` }}>
                {Array.from({ length: parseInt(config.operating_hours_end) - parseInt(config.operating_hours_start) }, (_, i) => {
                  const hour = parseInt(config.operating_hours_start) + i
                  const day0 = parseInt(config.operating_hours_start) * 60
                  const day1 = parseInt(config.operating_hours_end) * 60
                  const range = day1 - day0
                  const hourMins = hour * 60
                  const top = ((hourMins - day0) / range) * 100
                  const height = (60 / range) * 100
                  return (
                    <div key={hour} style={{ position: 'absolute', top: `${top}%`, height: `${height}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                      {hour}:00
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${config.court_count}, 1fr)`, backgroundColor: '#2d2d2d' }}>
              {/* Header con nombres de canchas alineado con header de horarios */}
              <div style={{ gridColumn: `1 / -1`, display: 'grid', gridTemplateColumns: `repeat(${config.court_count}, 1fr)`, padding: '15px', borderBottom: '1px solid #333', backgroundColor: '#2d2d2d' }}>
                {Array.from({ length: config.court_count }, (_, courtIndex) => (
                  <div key={courtIndex} style={{ textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>
                    Cancha {courtIndex + 1}
                  </div>
                ))}
              </div>
              {/* Columnas de canchas */}
              {Array.from({ length: config.court_count }, (_, courtIndex) => (
                <div
                  key={courtIndex}
                  style={{ borderRight: courtIndex < config.court_count - 1 ? '3px solid #555' : 'none', backgroundColor: '#2d2d2d' }}
                >
                  {/* Contenedor de slots con overlay - altura fija como sistema viejo */}
                  <div
                    ref={(el) => courtRefs.current[courtIndex] = el}
                    style={{ position: 'relative', backgroundColor: '#2d2d2d', height: `${(parseInt(config.operating_hours_end) - parseInt(config.operating_hours_start)) * 60}px`, borderTop: '3px solid #555' }}
                  >
                    {/* Overlay de iluminación progresiva */}
                    <div style={getDragOverlayStyle(courtIndex, courtRefs.current[courtIndex])}></div>
                    {/* Grid de slots para interacción - posición porcentual como sistema viejo */}
                    {Array.from({ length: (parseInt(config.operating_hours_end) - parseInt(config.operating_hours_start)) * 2 }, (_, slotIndex) => {
                    const day0 = parseInt(config.operating_hours_start) * 60
                    const day1 = parseInt(config.operating_hours_end) * 60
                    const range = day1 - day0
                    const slot = 30 // 30 minutos por slot
                    const slotMins = day0 + slotIndex * slot
                    const top = ((slotMins - day0) / range) * 100
                    const height = (slot / range) * 100
                    const isHalfHour = slotIndex % 2 === 1
                    const isSelected = isSlotSelected(courtIndex, slotIndex)
                    return (
                      <div
                        key={`${courtIndex}-${slotIndex}`}
                        onMouseDown={(e) => handleSlotMouseDown(courtIndex, slotIndex, e)}
                        onMouseMove={(e) => handleSlotMouseMove(courtIndex, slotIndex, e)}
                        onMouseUp={() => handleSlotMouseUp(courtIndex, slotIndex)}
                        style={{
                          position: 'absolute',
                          top: `${top}%`,
                          height: `${height}%`,
                          left: 0,
                          right: 0,
                          borderBottom: isHalfHour ? '3px solid #555' : '1px solid #333',
                          borderRight: 'none',
                          cursor: 'pointer',
                          backgroundColor: '#2d2d2d',
                          WebkitTapHighlightColor: 'transparent',
                          WebkitUserSelect: 'none',
                          userSelect: 'none',
                          zIndex: 1
                        }}
                      />
                    )
                  })}
                    {/* Renderizar reservas usando posición porcentual como el sistema viejo */}
                    {reservations.filter(r => r.court_id === courts[courtIndex]?.id).map(r => {
                      const s = parseHM(r.start_time)
                      const e = parseHM(r.end_time)
                      if (s == null || e == null || e <= s) return null

                      const day0 = parseInt(config.operating_hours_start) * 60
                      const day1 = parseInt(config.operating_hours_end) * 60
                      const range = day1 - day0

                      // Usar cálculo exacto del sistema viejo
                      const top = ((Math.max(s, day0) - day0) / range) * 100
                      const bottom = ((Math.min(e, day1) - day0) / range) * 100
                      const h = Math.max(0, bottom - top)

                      // Debug log para ver los valores calculados
                      if (r.start_time === '10:00' && r.end_time === '11:00') {
                        console.log('=== DEBUG RESERVATION 10:00-11:00 ===')
                        console.log('start_time:', r.start_time)
                        console.log('end_time:', r.end_time)
                        console.log('s (minutes):', s)
                        console.log('e (minutes):', e)
                        console.log('day0:', day0)
                        console.log('day1:', day1)
                        console.log('range:', range)
                        console.log('top (%):', top)
                        console.log('bottom (%):', bottom)
                        console.log('height (%):', h)
                        console.log('reservation_type:', r.reservation_type)
                        console.log('notes:', r.notes)
                        console.log('=== END DEBUG ===')
                      }

                      const type = r.reservation_type || (r.notes && r.notes.includes('Clase') ? 'class' : 'normal')
                      const backgroundColor = type === 'class' ? '#8B5CF6' : type === 'auto_match' ? '#3B82F6' : '#F97316'

                      return (
                        <div
                          key={r.id}
                          onClick={() => handleViewReservation(r)}
                          onMouseEnter={(e) => handleReservationMouseEnter(e, r)}
                          onMouseMove={handleReservationMouseMove}
                          onMouseLeave={handleReservationMouseLeave}
                          style={{
                            position: 'absolute',
                            top: `${top}%`,
                            height: `${h}%`,
                            left: 0,
                            right: 0,
                            backgroundColor,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            color: '#fff',
                            fontWeight: 'bold',
                            padding: '2px',
                            WebkitTapHighlightColor: 'transparent',
                            WebkitUserSelect: 'none',
                            userSelect: 'none',
                            zIndex: 10
                          }}
                        >
                          {r.players && r.players.length > 0 ? r.players.join(', ') : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tooltip.visible && tooltip.reservation && (
        <div
          style={{
            position: 'fixed',
            top: `${tooltip.y + 10}px`,
            left: `${tooltip.x + 10}px`,
            backgroundColor: '#fff',
            color: '#000',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            zIndex: 2000,
            maxWidth: '250px',
            fontSize: '12px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {tooltip.reservation.start_time} - {tooltip.reservation.end_time}
          </div>
          {tooltip.reservation.players && tooltip.reservation.players.length > 0 ? (
            <div>
              {tooltip.reservation.players.map((player, index) => {
                const pricePerPlayer = calculatePriceForTooltip(tooltip.reservation)
                return (
                  <div key={index} style={{ marginBottom: '3px' }}>
                    {player || '-'} - ${Math.round(pricePerPlayer)}
                  </div>
                )
              })}
            </div>
          ) : (
            <div>Sin jugadores</div>
          )}
          <div style={{ marginTop: '5px', fontSize: '11px', color: '#666' }}>
            {tooltip.reservation.notes || ''}
          </div>
          <div style={{ marginTop: '5px', fontSize: '11px', color: tooltip.reservation.payment_status === 'paid' ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
            {tooltip.reservation.payment_status === 'paid' ? 'Pagado' : 'No pagado'}
          </div>
        </div>
      )}

      {showReservationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '500px', border: '1px solid #333' }}>
            <h3 style={{ marginBottom: '20px', color: '#fff' }}>
              {selectedReservation ? 'Editar Reserva' : 'Crear Reserva'}
            </h3>
            
            {selectedReservation ? (
              // Vista de reserva existente
              <div>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#2d2d2d', borderRadius: '5px', border: '1px solid #444' }}>
                  <p style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>
                    <strong>Horario:</strong> {selectedReservation.start_time} - {selectedReservation.end_time}
                  </p>
                  <p style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>
                    <strong>Jugadores:</strong> {selectedReservation.players && selectedReservation.players.length > 0 
                      ? selectedReservation.players.join(', ') 
                      : (selectedReservation.notes || 'Sin jugadores')}
                  </p>
                  <p style={{ color: '#fff', fontSize: '14px' }}>
                    <strong>Notas:</strong> {selectedReservation.notes || 'Sin notas'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    onClick={closeModal}
                    style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => handleDeleteReservation(selectedReservation.id)}
                    style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    🗑️ Eliminar Reserva
                  </button>
                  <button
                    onClick={() => handleGeneratePayments(selectedReservation)}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    💳 Generar Pagos
                  </button>
                </div>
              </div>
            ) : (
              // Vista de crear nueva reserva
              <div>
                {dragStart && dragEnd && (
                  <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '5px', border: '1px solid #444' }}>
                    <span style={{ color: '#fff', fontSize: '14px' }}>
                      {(() => {
                        const startHour = parseInt(config.operating_hours_start) + Math.floor(dragStart.hourIndex / 2)
                        const startMin = dragStart.hourIndex % 2 === 0 ? '00' : '30'
                        const endHour = parseInt(config.operating_hours_start) + Math.floor(dragEnd.hourIndex / 2)
                        const endMin = dragEnd.hourIndex % 2 === 0 ? '00' : '30'
                        // La hora de fin es exactamente el slot seleccionado, sin ajustes
                        return `${startHour}:${startMin} - ${endHour}:${endMin}`
                      })()}
                    </span>
                    <span style={{ color: '#28a745', fontSize: '16px', fontWeight: 'bold', marginLeft: '10px' }}>
                      ${calculatedPrice}
                    </span>
                  </div>
                )}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Tipo de Reserva</label>
                  <select 
                    style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '5px', color: '#fff' }}
                    value={reservationType}
                    onChange={(e) => setReservationType(e.target.value)}
                  >
                    <option value="normal">Reserva normal</option>
                    <option value="clases">Clases</option>
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Jugadores</label>
                  {players.map((player, index) => (
                    <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder={`Nombre del jugador ${index + 1}`}
                        value={player.name}
                        onChange={(e) => {
                          const newPlayers = [...players]
                          newPlayers[index].name = e.target.value
                          setPlayers(newPlayers)
                        }}
                        style={{ flex: 1, padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '5px', color: '#fff' }}
                      />
                      <select 
                        style={{ padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '5px', color: '#fff', fontSize: '12px', minWidth: '120px' }}
                        value={player.paymentMethod}
                        onChange={(e) => {
                          const newPlayers = [...players]
                          newPlayers[index].paymentMethod = e.target.value
                          setPlayers(newPlayers)
                        }}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="club">Club</option>
                        <option value="sistema">Sistema</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeModal}
                    style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateReservation}
                    style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Crear Reserva
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'estadisticas' && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#fff' }}>Estadísticas del Club</h3>
          {!statistics ? (
            <button
              onClick={fetchStatistics}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Cargar Estadísticas
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#2d2d2d', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#007bff', marginBottom: '10px' }}>{statistics.total_courts}</h4>
                <p style={{ fontSize: '14px', color: '#ccc' }}>Total Canchas</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#2d2d2d', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#28a745', marginBottom: '10px' }}>{statistics.total_matches}</h4>
                <p style={{ fontSize: '14px', color: '#ccc' }}>Total Partidos</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#2d2d2d', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#17a2b8', marginBottom: '10px' }}>{statistics.completed_matches}</h4>
                <p style={{ fontSize: '14px', color: '#ccc' }}>Partidos Completados</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#2d2d2d', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#ffc107', marginBottom: '10px' }}>{statistics.pending_matches}</h4>
                <p style={{ fontSize: '14px', color: '#ccc' }}>Partidos Pendientes</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#2d2d2d', borderRadius: '5px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '32px', color: '#6c757d', marginBottom: '10px' }}>{statistics.completion_rate}%</h4>
                <p style={{ fontSize: '14px', color: '#ccc' }}>Tasa de Completitud</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showQRCode && club && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#fff' }}>Código QR del Club</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: '#2d2d2d', border: '2px solid #444', borderRadius: '10px' }}>
              <QRCodeSVG 
                value={`https://nexasist.com/club/${club.slug}`}
                size={200}
                level="H"
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '10px' }}>{club.name}</h4>
              <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '15px' }}>
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
            <div style={{ padding: '15px', backgroundColor: '#2d2d2d', borderRadius: '5px', fontSize: '14px', color: '#ccc' }}>
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

      {activeTab === 'pagos' && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Gestión de Pagos</h3>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
            <h4 style={{ marginBottom: '10px' }}>Registrar Nuevo Pago</h4>
            <form onSubmit={handleCreatePayment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Usuario ID</label>
                  <input
                    type="text"
                    value={newPayment.user_id}
                    onChange={(e) => setNewPayment({...newPayment, user_id: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #444', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Monto</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #444', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Método</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #444', borderRadius: '5px' }}
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
                  style={{ width: '100%', padding: '8px', border: '1px solid #444', borderRadius: '5px' }}
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
              <p style={{ color: '#ccc' }}>No hay pagos registrados</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {payments.map(payment => (
                  <li key={payment.id} style={{ padding: '10px', marginBottom: '5px', backgroundColor: '#2d2d2d', borderRadius: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>${payment.amount}</strong>
                      <p style={{ fontSize: '12px', color: '#ccc' }}>{payment.method === 'card' ? 'Tarjeta' : payment.method === 'cash' ? 'Efectivo' : 'Transferencia'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '12px', color: '#ccc' }}>{payment.description || 'Sin descripción'}</p>
                      <p style={{ fontSize: '12px', color: '#ccc' }}>{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'deudas' && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px' }}>Gestión de Deudas</h3>
          
          <div style={{ padding: '15px', backgroundColor: '#dc3545', color: 'white', borderRadius: '5px', textAlign: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '32px', marginBottom: '5px' }}>${debts.filter(d => !d.paid).reduce((sum, d) => sum + d.amount, 0)}</h4>
            <p style={{ fontSize: '14px' }}>Total Deuda Pendiente</p>
          </div>

          <div>
            <h4 style={{ marginBottom: '10px' }}>Deudores</h4>
            {debts.length === 0 ? (
              <p style={{ color: '#ccc' }}>No hay deudas registradas</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {debts.filter(d => !d.paid).map(debt => (
                  <li key={debt.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: '#2d2d2d', borderRadius: '5px', border: '1px solid #444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{debt.user_name || 'Usuario #' + debt.user_id}</strong>
                        <p style={{ fontSize: '14px', color: '#dc3545', fontWeight: 'bold' }}>${debt.amount}</p>
                        <p style={{ fontSize: '12px', color: '#ccc' }}>{debt.description || 'Sin descripción'}</p>
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

      {activeTab === 'profesores' && (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>👨‍🏫 Profesores</h2>
          <p style={{ color: '#cccccc' }}>Gestión de profesores del club.</p>
        </div>
      )}

      {activeTab === 'academia' && (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>🎓 Academia</h2>
          <p style={{ color: '#cccccc' }}>Gestión de clases y programas de la academia.</p>
        </div>
      )}

      {activeTab === 'torneo' && (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>🏆 Torneos</h2>
          <p style={{ color: '#cccccc' }}>Gestión de torneos y competencias.</p>
        </div>
      )}

      {activeTab === 'reservas' && (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>📅 Reservas</h2>
          <p style={{ color: '#cccccc' }}>Gestión de reservas de canchas.</p>
        </div>
      )}

      {activeTab === 'socios' && (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>👥 Socios</h2>
          <p style={{ color: '#cccccc' }}>Gestión de socios del club.</p>
        </div>
      )}

      {activeTab === 'recompensas' && (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>🎁 Recompensas</h2>
          <p style={{ color: '#cccccc' }}>Sistema de recompensas y puntos.</p>
        </div>
      )}

      {activeTab === 'ayuda' && (
        <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>❓ Ayuda</h2>
          <p style={{ color: '#cccccc' }}>Centro de ayuda y soporte.</p>
        </div>
      )}

      {activeTab === 'inicio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px' }}>Canchas ({courts.length})</h3>
            {courts.length === 0 ? (
              <p>No hay canchas registradas</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {courts.map(court => (
                  <li key={court.id} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
                    <strong>{court.name}</strong>
                    <p style={{ fontSize: '14px', color: '#ccc' }}>Número: {court.number}</p>
                    <p style={{ fontSize: '14px', color: '#ccc' }}>Superficie: {court.surface || 'Sin especificar'}</p>
                    <p style={{ fontSize: '14px', color: '#ccc' }}>{court.is_indoor ? 'Techada' : 'Al aire libre'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px' }}>Reservas ({reservations.length})</h3>
            {reservations.length === 0 ? (
              <p>No hay reservas pendientes</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {reservations.map(reservation => (
                  <li key={reservation.id} style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
                    <strong>Reserva #{reservation.id}</strong>
                    <p style={{ fontSize: '14px', color: '#ccc' }}>{reservation.date} - {reservation.start_time}</p>
                    <p style={{ fontSize: '14px', color: '#ccc' }}>Precio: ${reservation.price || 'N/A'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubPanel
