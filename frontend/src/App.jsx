import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import OwnerPanel from './pages/OwnerPanel'
import ClubPanel from './pages/ClubPanel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/owner" element={<OwnerPanel />} />
        <Route path="/club" element={<ClubPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
