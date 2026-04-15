import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth() || {};
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await authService.login({ correo, password });
      if (login) {
        login(res.data.token, res.data.usuario);
      }
      if (res.data.usuario.tipo === 'admin') navigate('/admin/dashboard');
      else navigate('/usuario/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f2248' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#1a3a6b' }}>
            Total Pacific
          </h1>
          <p className="text-lg font-semibold" style={{ color: '#D32F2F' }}>
            Service Desk
          </p>
          <p className="text-sm text-gray-500 mt-1">Sistema de gestión de requerimientos TI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#1a3a6b' }}
              placeholder="usuario@empresa.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
            style={{ background: '#1a3a6b', color: '#FFD700' }}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
} 