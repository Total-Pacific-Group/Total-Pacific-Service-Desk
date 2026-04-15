import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { ticketService } from '../../services/api';
import { ESTADOS_LABEL } from '../../utils/constantes';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    ticketService.statsAdmin()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a3a6b' }}>Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen general del sistema</p>
        </div>

        {/* Alerta 48h */}
        {stats?.alertas > 0 && (
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404' }}
          >
            <span className="text-lg">⚠</span>
            <span>
              {stats.alertas} ticket{stats.alertas > 1 ? 's' : ''} sin actualización en más de 48 horas
            </span>
          </div>
        )}

        {/* Stats cards */}
        {cargando ? (
          <p className="text-sm text-gray-400">Cargando estadísticas...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <StatCard label="Total tickets" valor={stats?.total} color="#1a3a6b" icono="📋" />
            <StatCard label="Pendientes" valor={stats?.pendientes} color="#F59E0B" icono="⏳" />
            <StatCard label="En revisión" valor={stats?.enRevision} color="#3B82F6" icono="🔍" />
            <StatCard label="Escalados" valor={stats?.escalados} color="#D32F2F" icono="🔺" />
            <StatCard label="Finalizados" valor={stats?.finalizados} color="#16A34A" icono="✔" />
          </div>
        )}

        {/* Gráfico de barras simple */}
        {stats && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1a3a6b' }}>
              Distribución por estado
            </h2>
            <div className="space-y-3">
              {[
                // Busca y reemplaza cada label en el array del gráfico:
                { label: 'Pendientes',   valor: stats.pendientes, color: '#F59E0B' },
                { label: 'En revisión',  valor: stats.enRevision, color: '#3B82F6' },
                { label: 'Escalados',    valor: stats.escalados,  color: '#D32F2F' },
                { label: 'Finalizados',  valor: stats.finalizados, color: '#16A34A' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-4 rounded-full transition-all duration-500"
                      style={{
                        width: stats.total > 0 ? `${(item.valor / stats.total) * 100}%` : '0%',
                        background: item.color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right">{item.valor}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}