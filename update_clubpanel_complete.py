with open('frontend/src/pages/ClubPanel.jsx', 'r') as f:
    content = f.read()

# Actualizar config state
old_config = """  const [config, setConfig] = useState({
    court_count: 1,
    country: 'MX',
    currency: 'MXN',
    timezone: 'America/Hermosillo'
  })"""

new_config = """  const [config, setConfig] = useState({
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
    lesson_4_players_price: 1400
  })"""

content = content.replace(old_config, new_config)

# Actualizar handleSaveConfig
old_handle = """  const handleSaveConfig = async () => {
    if (!club) return
    
    try {
      // Update club configuration
      await api.put(`/clubs/${club.id}`, {
        country: config.country,
        currency: config.currency,
        timezone: config.timezone
      })
      
      // Generate courts automatically
      for (let i = 1; i <= config.court_count; i++) {
        await api.post(`/courts`, {
          name: `Cancha ${i}`,
          number: i,
          surface: 'Sintético',
          is_indoor: false
        })
      }"""

new_handle = """  const handleSaveConfig = async () => {
    if (!club) return
    
    try {
      // Update club configuration with all fields
      await api.put(`/clubs/${club.id}`, {
        name: config.name,
        email: config.email,
        phone: config.phone,
        address: config.address,
        city: config.city,
        country: config.country,
        currency: config.currency,
        timezone: config.timezone,
        operating_hours_start: config.operating_hours_start,
        operating_hours_end: config.operating_hours_end,
        hourly_price: config.hourly_price_normal,
        lesson_1_player_price: config.lesson_1_2_players_price,
        lesson_2_player_price: config.lesson_1_2_players_price,
        lesson_3_player_price: config.lesson_3_players_price,
        lesson_4_player_price: config.lesson_4_players_price
      })
      
      // Generate courts automatically
      for (let i = 1; i <= config.court_count; i++) {
        await api.post(`/clubs/${club.id}/courts`, {
          name: `Cancha ${i}`,
          number: i,
          surface: 'Sintético',
          is_indoor: false
        })
      }"""

content = content.replace(old_handle, new_handle)

# Agregar campos de configuración en el formulario
old_form = """          <p style={{ fontSize: '14px', color: '#cccccc', marginTop: '15px', marginBottom: '20px' }}>
            💡 Los precios, horarios y otros ajustes se pueden configurar después en la sección "Configuración" del panel.
          </p>"""

new_form = """          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>📧 Datos del Club</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Nombre del Club</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({...config, name: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Email</label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({...config, email: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Teléfono</label>
              <input
                type="tel"
                value={config.phone}
                onChange={(e) => setConfig({...config, phone: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Ciudad</label>
              <input
                type="text"
                value={config.city}
                onChange={(e) => setConfig({...config, city: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>Dirección</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig({...config, address: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', backgroundColor: '#1a1a1a', color: '#ffffff' }}
            />
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
          </p>"""

content = content.replace(old_form, new_form)

with open('frontend/src/pages/ClubPanel.jsx', 'w') as f:
    f.write(content)

print("ClubPanel.jsx actualizado correctamente")
