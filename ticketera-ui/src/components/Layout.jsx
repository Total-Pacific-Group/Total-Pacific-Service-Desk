import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const menuAdmin = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/admin/tickets', label: 'Tickets', icon: '◉' },
  { path: '/admin/usuarios', label: 'Usuarios', icon: '◈' },
];

const menuUsuario = [
  { path: '/usuario/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/usuario/tickets', label: 'Mis Tickets', icon: '◉' },
];
export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menu = usuario?.tipo === 'admin' ? menuAdmin : menuUsuario;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f4f8' }}>

      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300"
        style={{
          width: collapsed ? '64px' : '230px',
          background: '#0f2248',
          minHeight: '100vh',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          {!collapsed && (
  <div>
    <div style={{ lineHeight: 1 }}>
      <span style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        color: '#ffffff',
      }}>
        TOTAL
      </span>
      <span style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '13px',
        fontWeight: '400',
        letterSpacing: '0.08em',
        color: '#FFD700',
      }}>
        {' '}PACIFIC
      </span>
    </div>
    <div style={{
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '10px',
      fontWeight: '600',
      letterSpacing: '0.2em',
      color: '#e2e8f0',
      marginTop: '2px',
    }}>
      SERVICE DESK
    </div>
    <div style={{
      borderTop: '1px solid rgba(255,215,0,0.3)',
      marginTop: '5px',
      paddingTop: '4px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '8px',
      letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.4)',
      fontStyle: 'italic',
    }}>
      by Total Pacific Group
    </div>
  </div>
)}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white opacity-60 hover:opacity-100 transition-opacity text-lg"
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'font-semibold'
                    : 'text-blue-100 hover:bg-white/10'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: '#1a56db', color: '#FFD700' }
                  : {}
              }
              title={collapsed ? item.label : ''}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Usuario + Logout */}
        <div
          className="px-3 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          {!collapsed && (
            <div className="mb-3 px-1">
              <p className="text-xs font-semibold text-white truncate">{usuario?.nombre}</p>
              <p className="text-xs truncate" style={{ color: '#FFD700' }}>
                {usuario?.tipo === 'admin' ? 'Administrador' : 'Usuario estándar'}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-900/30 transition-colors"
          >
            <span>⏻</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-3 shadow-sm"
          style={{ background: '#ffffff', borderBottom: '3px solid #1a3a6b' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#1a3a6b' }}>
            Total Pacific Service Desk
          </h2>
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                background: usuario?.tipo === 'admin' ? '#1a3a6b' : '#e8f0fe',
                color: usuario?.tipo === 'admin' ? '#FFD700' : '#1a3a6b',
              }}
            >
              {usuario?.tipo === 'admin' ? 'Administrador' : 'Usuario estándar'}
            </span>
            <span className="text-sm text-gray-600">{usuario?.correo}</span>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}