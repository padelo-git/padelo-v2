import axios from 'axios'

// Configuración centralizada de axios
// Todas las URLs son relativas - nginx se encarga del proxy
const api = axios.create({
  baseURL: '', // URL vacía = usar rutas relativas (nginx proxy)
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
