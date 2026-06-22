import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import OwnerPanel from './pages/OwnerPanel'
import ClubPanel from './pages/ClubPanel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/owner" element={<OwnerPanel />} />
        <Route path="/club" element={<ClubPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
