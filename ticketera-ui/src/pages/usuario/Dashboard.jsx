import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { ticketService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ESTADOS_LABEL, estadoColor, CATEGORIAS } from '../../utils/constantes';

// Y elimina las definiciones locales de estadoColor y CATEGORIAS que ya no se necesitan

export default function UserDashboard() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      ticketService.statsUsuario(),
      ticketService.listar({ solo_activos: true }),
    ])
      .then(([statsRes, ticketsRes]) => {
        setStats(statsRes.data);
        setTickets(ticketsRes.data);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const estadoColor = {
    pendiente: '#F59E0B',
    en_revision: '#3B82F6',
    escalado: '#D32F2F',
    finalizado: '#16A34A',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a3a6b' }}>
            Bienvenido, {usuario?.nombre}
          </h1>
          <p className="text-sm text-gray-500">Resumen de tus requerimientos</p>
        </div>

        {cargando ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <StatCard label="Total mis tickets" valor={stats?.total} color="#1a3a6b" icono="📋" />
              <StatCard label="Pendientes" valor={stats?.pendientes} color="#F59E0B" icono="⏳" />
              <StatCard label="En revisión" valor={stats?.enRevision} color="#3B82F6" icono="🔍" />
              <StatCard label="Finalizados" valor={stats?.finalizados} color="#16A34A" icono="✔" />
            </div>

            {/* Tickets activos tipo calendario */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#1a3a6b' }}>
                Tickets
              </h2>
              {tickets.length === 0 ? (
                <p className="text-sm text-gray-400">No tienes tickets activos.</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-4 py-3 rounded-lg"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400">#{t.id}</span>
                        <span className="text-sm font-medium text-gray-700">{t.titulo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(t.createdAt).toLocaleDateString('es-EC')}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${estadoColor[t.estado]}20`,
                            color: estadoColor[t.estado],
                          }}
                        >
                          {ESTADOS_LABEL[t.estado]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}