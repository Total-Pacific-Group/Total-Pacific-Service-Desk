import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTickets from './pages/admin/Tickets';
import AdminUsuarios from './pages/admin/Usuarios';
import UserDashboard from './pages/usuario/Dashboard';
import UserTickets from './pages/usuario/Tickets';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<PrivateRoute rol="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/tickets" element={<PrivateRoute rol="admin"><AdminTickets /></PrivateRoute>} />
          <Route path="/admin/usuarios" element={<PrivateRoute rol="admin"><AdminUsuarios /></PrivateRoute>} />
          <Route path="/usuario/dashboard" element={<PrivateRoute rol="estandar"><UserDashboard /></PrivateRoute>} />
          <Route path="/usuario/tickets" element={<PrivateRoute rol="estandar"><UserTickets /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}