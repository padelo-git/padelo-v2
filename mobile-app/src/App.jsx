import React, { useState, useEffect, useRef } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

function App() {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [showButtons, setShowButtons] = useState(true)
  const [currentFlow, setCurrentFlow] = useState(null)
  const [registrationData, setRegistrationData] = useState({})
  const [isTyping, setIsTyping] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (text, type = 'system', timestamp = new Date()) => {
    setMessages(prev => [...prev, { id: Date.now(), text, type, timestamp }])
  }

  const simulateTyping = async (callback) => {
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsTyping(false)
    callback()
  }

  const formatTimestamp = (timestamp) => {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp
    const time = format(date, 'HH:mm', { locale: es })
    
    if (isToday(date)) {
      return time
    } else if (isYesterday(date)) {
      return `Ayer ${time}`
    } else {
      return format(date, 'dd/MM HH:mm', { locale: es })
    }
  }

  const groupMessagesByDate = (msgs) => {
    const groups = {}
    msgs.forEach(msg => {
      const date = typeof msg.timestamp === 'string' ? parseISO(msg.timestamp) : msg.timestamp
      const dateKey = format(date, 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(msg)
    })
    return groups
  }

  const handleInputChange = (e) => {
    setInputText(e.target.value)
    if (e.target.value.length > 0) {
      setShowButtons(false)
    } else {
      setShowButtons(true)
    }
  }

  const handleInputSubmit = () => {
    if (inputText.trim()) {
      addMessage(inputText, 'user')
      setInputText('')
      setShowButtons(true)
      processUserInput(inputText)
    }
  }

  const processUserInput = (input) => {
    simulateTyping(() => {
      if (currentFlow === 'registration') {
        handleRegistrationFlow(input)
      } else if (currentFlow === 'login') {
        handleLoginFlow(input)
      } else if (currentFlow === 'availability') {
        handleAvailabilityFlow(input)
      } else if (currentFlow === 'reserve') {
        handleReserveFlow(input)
      } else if (currentFlow === 'wantToPlay') {
        handleWantToPlayFlow(input)
      } else if (currentFlow === 'wantClass') {
        handleWantClassFlow(input)
      } else {
        addMessage('No entendí tu mensaje. Por favor usa los botones de navegación.', 'system')
      }
    })
  }

  const handleRegistrationFlow = (input) => {
    const data = { ...registrationData }
    
    if (!data.name) {
      data.name = input
      setRegistrationData(data)
      addMessage('¿Cuál es tu correo electrónico?', 'system')
    } else if (!data.email) {
      data.email = input
      setRegistrationData(data)
      addMessage('Crea una contraseña para tu cuenta:', 'system')
    } else if (!data.password) {
      data.password = input
      setRegistrationData(data)
      setCurrentFlow('registration_gender')
      addMessage('¿Cuál es tu género?', 'system')
      setShowButtons(false)
    }
  }

  const handleLoginFlow = (input) => {
    const data = { ...registrationData }
    
    if (!data.email) {
      data.email = input
      setRegistrationData(data)
      addMessage('Ingresa tu contraseña:', 'system')
    } else if (!data.password) {
      data.password = input
      setRegistrationData(data)
      simulateTyping(() => {
        // Simular login exitoso
        setUser({ email: data.email, name: 'Juan Pérez' })
        setIsLoggedIn(true)
        setCurrentFlow(null)
        addMessage('¡Bienvenido de nuevo! 🎉', 'system')
        addMessage('¿Qué deseas hacer hoy?', 'system')
      })
    }
  }

  const handleAvailabilityFlow = (input) => {
    const data = { ...registrationData }
    
    if (!data.day) {
      data.day = input
      setRegistrationData(data)
      simulateTyping(() => {
        addMessage('Horarios disponibles:', 'system')
        addMessage('🕐 09:00 - 10:00', 'system')
        addMessage('🕐 10:00 - 11:00', 'system')
        addMessage('🕐 11:00 - 12:00', 'system')
        addMessage('🕐 14:00 - 15:00', 'system')
        addMessage('🕐 15:00 - 16:00', 'system')
        addMessage('Selecciona un horario:', 'system')
      })
    } else if (!data.time) {
      data.time = input
      setRegistrationData(data)
      simulateTyping(() => {
        addMessage('Canchas disponibles:', 'system')
        addMessage('🏟️ Cancha 1', 'system')
        addMessage('🏟️ Cancha 2', 'system')
        addMessage('🏟️ Cancha 3', 'system')
        addMessage('Selecciona una cancha:', 'system')
      })
    } else if (!data.court) {
      data.court = input
      setRegistrationData(data)
      setCurrentFlow(null)
      simulateTyping(() => {
        addMessage(`¡Disponibilidad confirmada! Día: ${data.day}, Horario: ${data.time}, Cancha: ${data.court}`, 'system')
      })
    }
  }

  const handleReserveFlow = (input) => {
    const data = { ...registrationData }
    
    if (!data.day) {
      data.day = input
      setRegistrationData(data)
      simulateTyping(() => {
        addMessage('Horarios disponibles:', 'system')
        addMessage('🕐 09:00 - 10:00', 'system')
        addMessage('🕐 10:00 - 11:00', 'system')
        addMessage('🕐 11:00 - 12:00', 'system')
        addMessage('Selecciona un horario:', 'system')
      })
    } else if (!data.time) {
      data.time = input
      setRegistrationData(data)
      setCurrentFlow('reserve_duration')
      addMessage('¿Cuánto tiempo quieres reservar?', 'system')
      setShowButtons(false)
    }
  }

  const handleWantToPlayFlow = (input) => {
    simulateTyping(() => {
      addMessage('🔍 Buscando jugadores disponibles...', 'system')
      setTimeout(() => {
        addMessage('✅ Encontré 3 jugadores compatibles:', 'system')
        addMessage('👤 Carlos - Derecha - 3ra categoría', 'system')
        addMessage('👤 María - Revés - 3ra categoría', 'system')
        addMessage('👤 Pedro - Ambos - 3ra categoría', 'system')
        addMessage('🎉 Partido armado para hoy a las 15:00', 'system')
        setCurrentFlow(null)
      }, 2000)
    })
  }

  const handleWantClassFlow = (input) => {
    const data = { ...registrationData }
    
    if (!data.professor) {
      data.professor = input
      setRegistrationData(data)
      simulateTyping(() => {
        addMessage('¿Para qué día quieres la clase?', 'system')
        addMessage('📅 Hoy', 'system')
        addMessage('📅 Mañana', 'system')
        addMessage('📅 Pasado', 'system')
      })
    } else if (!data.day) {
      data.day = input
      setRegistrationData(data)
      simulateTyping(() => {
        addMessage('Horarios disponibles:', 'system')
        addMessage('🕐 09:00 - 10:00', 'system')
        addMessage('🕐 10:00 - 11:00', 'system')
        addMessage('🕐 11:00 - 12:00', 'system')
        addMessage('Selecciona un horario:', 'system')
      })
    } else if (!data.time) {
      data.time = input
      setRegistrationData(data)
      setCurrentFlow(null)
      simulateTyping(() => {
        addMessage(`¡Clase reservada! Profesor: ${data.professor}, Día: ${data.day}, Horario: ${data.time} (1 hora)`, 'system')
      })
    }
  }

  const handleButtonClick = (action) => {
    switch (action) {
      case 'availability':
        setCurrentFlow('availability')
        setRegistrationData({})
        addMessage('¿Para qué día quieres ver disponibilidad?', 'system')
        addMessage('📅 Hoy', 'system')
        addMessage('📅 Mañana', 'system')
        addMessage('📅 Pasado', 'system')
        addMessage('O escribe la fecha:', 'system')
        break

      case 'wantToPlay':
        setCurrentFlow('wantToPlay')
        setRegistrationData({})
        addMessage('🎯 Buscando jugadores para armar partido...', 'system')
        handleWantToPlayFlow()
        break

      case 'myMatches':
        setCurrentFlow('myMatches')
        addMessage('🏆 Tus partidos:', 'system')
        addMessage('🎮 Partido 1 - Hoy 15:00 - Cancha 2', 'system')
        addMessage('🎮 Partido 2 - Miércoles 18:00 - Cancha 1', 'system')
        addMessage('🎮 Partido 3 - Viernes 20:00 - Cancha 3', 'system')
        addMessage('Selecciona un partido para ver detalles o bajarte:', 'system')
        break

      case 'help':
        addMessage('📖 Guía de uso:', 'system')
        addMessage('📅 Ver Disponibilidad: Consulta horarios y canchas libres', 'system')
        addMessage('🎮 Quiero Jugar: Sistema busca jugadores y arma partido', 'system')
        addMessage('🏆 Mis Partidos: Ver partidos y bajarse', 'system')
        addMessage('❓ Ayuda: Esta guía', 'system')
        addMessage('🎯 Reservar: Reserva cancha por duración', 'system')
        addMessage('📚 Quiero Clase: Reserva clase con profesor', 'system')
        addMessage('👥 Invitar Amigo: Compartir link por WhatsApp', 'system')
        addMessage('❌ Cancelar: Cancelar operación actual', 'system')
        break

      case 'reserve':
        setCurrentFlow('reserve')
        setRegistrationData({})
        addMessage('¿Para qué día quieres reservar?', 'system')
        addMessage('📅 Hoy', 'system')
        addMessage('📅 Mañana', 'system')
        addMessage('📅 Pasado', 'system')
        addMessage('O escribe la fecha:', 'system')
        break

      case 'wantClass':
        setCurrentFlow('wantClass')
        setRegistrationData({})
        addMessage('¿Con qué profesor quieres la clase?', 'system')
        addMessage('👨‍🏫 David Greco', 'system')
        addMessage('👨‍🏫 Agustín Greco', 'system')
        break

      case 'inviteFriend':
        const inviteLink = 'https://nexasist.com/invite/abc123'
        addMessage(`🔗 Link de invitación: ${inviteLink}`, 'system')
        addMessage('Copia este link y compártelo por WhatsApp', 'system')
        navigator.clipboard.writeText(inviteLink)
        addMessage('✅ Link copiado al portapapeles', 'system')
        break

      case 'cancel':
        setCurrentFlow(null)
        setRegistrationData({})
        addMessage('❌ Operación cancelada', 'system')
        addMessage('¿Qué deseas hacer?', 'system')
        break

      case 'gender_male':
        const dataMale = { ...registrationData, gender: 'masculino' }
        setRegistrationData(dataMale)
        setCurrentFlow('registration_days')
        addMessage('¿Días disponibles?', 'system')
        setShowButtons(false)
        break

      case 'gender_female':
        const dataFemale = { ...registrationData, gender: 'femenino' }
        setRegistrationData(dataFemale)
        setCurrentFlow('registration_days')
        addMessage('¿Días disponibles?', 'system')
        setShowButtons(false)
        break

      case 'days_done':
        const dataDays = { ...registrationData }
        setCurrentFlow('registration_time')
        addMessage('¿Rango horario?', 'system')
        setShowButtons(false)
        break

      case 'time_morning':
        const dataMorning = { ...registrationData, timeRange: 'mañana' }
        setRegistrationData(dataMorning)
        setCurrentFlow('registration_side')
        addMessage('¿De qué lado juegas?', 'system')
        setShowButtons(false)
        break

      case 'time_midday':
        const dataMidday = { ...registrationData, timeRange: 'mediodía' }
        setRegistrationData(dataMidday)
        setCurrentFlow('registration_side')
        addMessage('¿De qué lado juegas?', 'system')
        setShowButtons(false)
        break

      case 'time_afternoon':
        const dataAfternoon = { ...registrationData, timeRange: 'tarde' }
        setRegistrationData(dataAfternoon)
        setCurrentFlow('registration_side')
        addMessage('¿De qué lado juegas?', 'system')
        setShowButtons(false)
        break

      case 'time_night':
        const dataNight = { ...registrationData, timeRange: 'noche' }
        setRegistrationData(dataNight)
        setCurrentFlow('registration_side')
        addMessage('¿De qué lado juegas?', 'system')
        setShowButtons(false)
        break

      case 'side_right':
        const dataRight = { ...registrationData, side: 'derecha' }
        setRegistrationData(dataRight)
        setCurrentFlow('registration_category')
        addMessage('¿Categoría?', 'system')
        setShowButtons(false)
        break

      case 'side_backhand':
        const dataBackhand = { ...registrationData, side: 'revés' }
        setRegistrationData(dataBackhand)
        setCurrentFlow('registration_category')
        addMessage('¿Categoría?', 'system')
        setShowButtons(false)
        break

      case 'side_both':
        const dataBoth = { ...registrationData, side: 'ambos' }
        setRegistrationData(dataBoth)
        setCurrentFlow('registration_category')
        addMessage('¿Categoría?', 'system')
        setShowButtons(false)
        break

      case 'category_1':
      case 'category_2':
      case 'category_3':
      case 'category_4':
      case 'category_5':
      case 'category_6':
      case 'category_7':
      case 'category_8':
      case 'category_9':
        const category = action.replace('category_', '')
        const finalData = { ...registrationData, category: `${category}ra` }
        setRegistrationData(finalData)
        setCurrentFlow(null)
        simulateTyping(() => {
          addMessage('¡Registro completado! 🎉', 'system')
          addMessage('Bienvenido a Padelo', 'system')
          setUser(finalData)
          setIsLoggedIn(true)
        })
        break

      case 'duration_1h':
      case 'duration_1.5h':
      case 'duration_2h':
      case 'duration_2.5h':
      case 'duration_3h':
      case 'duration_4h':
        const duration = action.replace('duration_', '').replace('h', 'h')
        const reserveData = { ...registrationData, duration }
        setRegistrationData(reserveData)
        simulateTyping(() => {
          addMessage('Canchas disponibles:', 'system')
          addMessage('🏟️ Cancha 1', 'system')
          addMessage('🏟️ Cancha 2', 'system')
          addMessage('🏟️ Cancha 3', 'system')
          addMessage('Selecciona una cancha:', 'system')
        })
        break

      case 'professor_david':
        handleWantClassFlow('David Greco')
        break

      case 'professor_agustin':
        handleWantClassFlow('Agustín Greco')
        break

      default:
        addMessage('Acción no reconocida', 'system')
    }
  }

  const renderQuickButtons = () => {
    if (currentFlow === 'registration_gender') {
      return (
        <div className="quick-buttons">
          <button className="quick-button" onClick={() => handleButtonClick('gender_male')}>Masculino</button>
          <button className="quick-button" onClick={() => handleButtonClick('gender_female')}>Femenino</button>
        </div>
      )
    }

    if (currentFlow === 'registration_days') {
      return (
        <div className="quick-buttons">
          <button className="quick-button" onClick={() => {
            const data = { ...registrationData, days: [...(registrationData.days || []), 'lunes'] }
            setRegistrationData(data)
          }}>Lunes</button>
          <button className="quick-button" onClick={() => {
            const data = { ...registrationData, days: [...(registrationData.days || []), 'martes'] }
            setRegistrationData(data)
          }}>Martes</button>
          <button className="quick-button" onClick={() => {
            const data = { ...registrationData, days: [...(registrationData.days || []), 'miércoles'] }
            setRegistrationData(data)
          }}>Miércoles</button>
          <button className="quick-button" onClick={() => {
            const data = { ...registrationData, days: [...(registrationData.days || []), 'jueves'] }
            setRegistrationData(data)
          }}>Jueves</button>
          <button className="quick-button" onClick={() => {
            const data = { ...registrationData, days: [...(registrationData.days || []), 'viernes'] }
            setRegistrationData(data)
          }}>Viernes</button>
          <button className="quick-button" onClick={() => {
            const data = { ...registrationData, days: [...(registrationData.days || []), 'sábado'] }
            setRegistrationData(data)
          }}>Sábado</button>
          <button className="quick-button" onClick={() => {
            const data = { ...registrationData, days: [...(registrationData.days || []), 'domingo'] }
            setRegistrationData(data)
          }}>Domingo</button>
          <button className="quick-button selected" onClick={() => handleButtonClick('days_done')}>✓ Listo</button>
        </div>
      )
    }

    if (currentFlow === 'registration_time') {
      return (
        <div className="quick-buttons">
          <button className="quick-button" onClick={() => handleButtonClick('time_morning')}>Mañana</button>
          <button className="quick-button" onClick={() => handleButtonClick('time_midday')}>Mediodía</button>
          <button className="quick-button" onClick={() => handleButtonClick('time_afternoon')}>Tarde</button>
          <button className="quick-button" onClick={() => handleButtonClick('time_night')}>Noche</button>
        </div>
      )
    }

    if (currentFlow === 'registration_side') {
      return (
        <div className="quick-buttons">
          <button className="quick-button" onClick={() => handleButtonClick('side_right')}>Derecha</button>
          <button className="quick-button" onClick={() => handleButtonClick('side_backhand')}>Revés</button>
          <button className="quick-button" onClick={() => handleButtonClick('side_both')}>Ambos</button>
        </div>
      )
    }

    if (currentFlow === 'registration_category') {
      return (
        <div className="quick-buttons">
          <button className="quick-button" onClick={() => handleButtonClick('category_1')}>1ra</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_2')}>2da</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_3')}>3ra</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_4')}>4ta</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_5')}>5ta</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_6')}>6ta</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_7')}>7ma</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_8')}>8va</button>
          <button className="quick-button" onClick={() => handleButtonClick('category_9')}>9na</button>
        </div>
      )
    }

    if (currentFlow === 'reserve_duration') {
      return (
        <div className="quick-buttons">
          <button className="quick-button" onClick={() => handleButtonClick('duration_1h')}>1 hora</button>
          <button className="quick-button" onClick={() => handleButtonClick('duration_1.5h')}>1.5 horas</button>
          <button className="quick-button" onClick={() => handleButtonClick('duration_2h')}>2 horas</button>
          <button className="quick-button" onClick={() => handleButtonClick('duration_2.5h')}>2.5 horas</button>
          <button className="quick-button" onClick={() => handleButtonClick('duration_3h')}>3 horas</button>
          <button className="quick-button" onClick={() => handleButtonClick('duration_4h')}>4 horas</button>
        </div>
      )
    }

    if (currentFlow === 'wantClass' && !registrationData.professor) {
      return (
        <div className="quick-buttons">
          <button className="quick-button" onClick={() => handleButtonClick('professor_david')}>David Greco</button>
          <button className="quick-button" onClick={() => handleButtonClick('professor_agustin')}>Agustín Greco</button>
        </div>
      )
    }

    return null
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-title">🎾 Padelo</div>
        {isLoggedIn && <div className="header-title" style={{ fontSize: '14px' }}>{user?.name}</div>}
      </div>

      <div className="chat-container">
        {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
          <div key={dateKey}>
            <div className="date-divider">
              <span>
                {isToday(parseISO(dateKey)) ? 'Hoy' : 
                 isYesterday(parseISO(dateKey)) ? 'Ayer' : 
                 format(parseISO(dateKey), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
            {msgs.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div>{msg.text}</div>
                <div className="message-timestamp">{formatTimestamp(msg.timestamp)}</div>
              </div>
            ))}
          </div>
        ))}
        
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {renderQuickButtons()}

      <div className="input-container">
        <input
          type="text"
          className="input-field"
          placeholder="Escribe un mensaje..."
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
        />
      </div>

      {showButtons && (
        <div className="buttons-container">
          <div className="button-column">
            <button className="nav-button" onClick={() => handleButtonClick('availability')}>
              📅 Ver Disponibilidad
            </button>
            <button className="nav-button secondary" onClick={() => handleButtonClick('wantToPlay')}>
              🎮 Quiero Jugar
            </button>
            <button className="nav-button secondary" onClick={() => handleButtonClick('myMatches')}>
              🏆 Mis Partidos
            </button>
            <button className="nav-button secondary" onClick={() => handleButtonClick('help')}>
              ❓ Ayuda
            </button>
          </div>
          <div className="button-column">
            <button className="nav-button" onClick={() => handleButtonClick('reserve')}>
              🎯 Reservar
            </button>
            <button className="nav-button secondary" onClick={() => handleButtonClick('wantClass')}>
              📚 Quiero Clase
            </button>
            <button className="nav-button secondary" onClick={() => handleButtonClick('inviteFriend')}>
              👥 Invitar Amigo
            </button>
            <button className="nav-button danger" onClick={() => handleButtonClick('cancel')}>
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
