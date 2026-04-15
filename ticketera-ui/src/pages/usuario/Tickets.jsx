import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ticketService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ESTADOS_LABEL, estadoColor, CATEGORIAS, calcularTiempoResolucion } from '../../utils/constantes';

const fmtFecha = (fecha) => fecha
  ? new Date(fecha).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

export default function UserTickets() {
  const { usuario } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabEstado, setTabEstado] = useState('activos');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [detalleTicket, setDetalleTicket] = useState(null);
  const [tabDetalle, setTabDetalle] = useState(0);
  const [historialTicket, setHistorialTicket] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [filtros, setFiltros] = useState({ categoria: '', estado: '', fecha_desde: '', fecha_hasta: '', orden: '' });
  const [form, setForm] = useState({ titulo: '', categoria: '', descripcion: '', sede: '', ticket_referencia_id: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      if (tabEstado === 'finalizados') params.estado = 'finalizado';
      const res = await ticketService.listar(params);
      const data = tabEstado === 'activos'
        ? res.data.filter(t => t.estado !== 'finalizado')
        : res.data;
      setTickets(data);
      if (filtros.orden === 'asc') {
        data = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (filtros.orden === 'desc') {
        data = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [tabEstado]);

  const abrirDetalle = (ticket) => {
    setDetalleTicket(ticket);
    setTabDetalle(0);
    setHistorialTicket([]);
  };

  const cargarHistorialUsuario = async (id) => {
    setCargandoHistorial(true);
    try {
      const res = await ticketService.historial(id);
      setHistorialTicket(res.data);
    } catch {
      setHistorialTicket([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleCrear = async () => {
    const { titulo, categoria, descripcion, sede } = form;
    if (!titulo || !categoria || !descripcion || !sede) return setError('Todos los campos son requeridos');
    setGuardando(true);
    setError('');
    try {
      await ticketService.crear({ ...form, ticket_referencia_id: form.ticket_referencia_id || null });
      setExito('Ticket creado. El equipo de TI fue notificado.');
      setForm({ titulo: '', categoria: '', descripcion: '', sede: '', ticket_referencia_id: '' });
      cargar();
      setTimeout(() => { setModalNuevo(false); setExito(''); }, 2000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear ticket');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1a3a6b' }}>Mis Tickets</h1>
            <p className="text-sm text-gray-500">Todos tus requerimientos</p>
          </div>
          <button
            onClick={() => { setModalNuevo(true); setError(''); setExito(''); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#1a3a6b' }}
          >
            + Nuevo ticket
          </button>
        </div>

        {/* Tabs activos / finalizados */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
          {[['activos', 'Activos'], ['finalizados', 'Finalizados']].map(([val, label]) => (
            <button key={val} onClick={() => setTabEstado(val)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: tabEstado === val ? '#1a3a6b' : 'transparent', color: tabEstado === val ? '#FFD700' : '#6b7280' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filtros.estado}
            onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}
          >
            <option value="">Todos los estados</option>
            {(tabEstado === 'activos'
              ? ['pendiente', 'en_revision', 'escalado']
              : ['finalizado']
            ).map(e => (
              <option key={e} value={e}>{ESTADOS_LABEL[e]}</option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filtros.categoria}
            onChange={e => setFiltros(f => ({ ...f, categoria: e.target.value }))}
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIAS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <input type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filtros.fecha_desde}
            onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))} />

          <input type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filtros.fecha_hasta}
            onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))} />

          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filtros.orden}
            onChange={e => setFiltros(f => ({ ...f, orden: e.target.value }))}
          >
            <option value="">Orden por defecto</option>
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguos primero</option>
          </select>

          <button onClick={cargar}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#1a3a6b' }}>
            Filtrar
          </button>
          <button onClick={() => {
            setFiltros({ categoria: '', estado: '', fecha_desde: '', fecha_hasta: '', orden: '' });
            setTimeout(cargar, 100);
          }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200">
            Limpiar
          </button>
          {!cargando && (
            <span className="text-xs text-gray-400 ml-auto">
              {tickets.length} resultado{tickets.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {cargando ? (
            <p className="p-6 text-sm text-gray-400">Cargando...</p>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400 text-sm">
                {tabEstado === 'activos' ? 'No tienes tickets activos.' : 'No tienes tickets finalizados.'}
              </p>
              {tabEstado === 'activos' && (
                <button onClick={() => setModalNuevo(true)}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: '#1a3a6b' }}>
                  Crear un nuevo ticket
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['#ID', 'Título', 'Último comentario de TI', 'Estado', 'Hora ingreso', 'Hora finalizado', 'Tiempo resolución', 'Detalle'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{t.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{t.titulo}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                        {t.descripcion_cambio
                          ? <span className="line-clamp-2">{t.descripcion_cambio}</span>
                          : <span className="text-gray-300 italic">Sin actualizaciones aún</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: estadoColor[t.estado]?.bg, color: estadoColor[t.estado]?.text }}>
                          {ESTADOS_LABEL[t.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtFecha(t.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {t.estado === 'finalizado' ? fmtFecha(t.ultimo_cambio_estado) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {(() => {
                          const tiempo = calcularTiempoResolucion(t.createdAt, t.ultimo_cambio_estado, t.estado);
                          return tiempo
                            ? <span className="px-2 py-1 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#166534' }}>{tiempo}</span>
                            : <span className="text-gray-300">—</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => abrirDetalle(t)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo ticket */}
      {modalNuevo && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="px-6 py-4 sticky top-0" style={{ background: '#1a3a6b' }}>
              <h3 className="font-bold" style={{ color: '#FFD700' }}>Nuevo Ticket</h3>
              <p className="text-sm text-blue-200">Completa todos los campos</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Título del requerimiento</label>
                <input type="text" placeholder="Describe brevemente tu solicitud..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  value={form.titulo} onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Categoría</label>
                <div className="space-y-2">
                  {Object.entries(CATEGORIAS).map(([key, { label, desc }]) => (
                    <button key={key}
                      onClick={() => setForm(v => ({ ...v, categoria: key, ticket_referencia_id: key !== 'reclamo' ? '' : v.ticket_referencia_id }))}
                      className="w-full text-left px-4 py-3 rounded-lg border-2 transition-all"
                      style={{ borderColor: form.categoria === key ? '#1a3a6b' : '#e2e8f0', background: form.categoria === key ? '#e8f0fe' : '#fff' }}>
                      <p className="text-sm font-medium" style={{ color: form.categoria === key ? '#1a3a6b' : '#374151' }}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.categoria === 'reclamo' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">ID del ticket reclamado (opcional)</label>
                  <input type="number" placeholder="Ej: 42"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={form.ticket_referencia_id}
                    onChange={e => setForm(v => ({ ...v, ticket_referencia_id: e.target.value }))} />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Descripción detallada</label>
                <textarea rows={4} placeholder="Explica con detalle tu requerimiento..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                  value={form.descripcion}
                  onChange={e => setForm(v => ({ ...v, descripcion: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Sede</label>
                <div className="flex gap-3">
                  {['manta', 'quito', 'guayaquil'].map(s => (
                    <button key={s} onClick={() => setForm(v => ({ ...v, sede: s }))}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border-2 capitalize transition-all"
                      style={{ borderColor: form.sede === s ? '#1a3a6b' : '#e2e8f0', background: form.sede === s ? '#1a3a6b' : '#fff', color: form.sede === s ? '#FFD700' : '#6b7280' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                Tu correo <strong>{usuario?.correo}</strong> será incluido automáticamente.
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {exito && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{exito}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalNuevo(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600">
                  Cancelar
                </button>
                <button onClick={handleCrear} disabled={guardando}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: '#1a3a6b' }}>
                  {guardando ? 'Enviando...' : 'Crear ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalleTicket && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="px-6 py-4 flex-shrink-0" style={{ background: '#1a3a6b' }}>
              <h3 className="font-bold" style={{ color: '#FFD700' }}>Ticket #{detalleTicket.id}</h3>
              <p className="text-sm text-blue-200 truncate">{detalleTicket.titulo}</p>
            </div>

            <div className="flex border-b border-gray-200 flex-shrink-0">
              {['Detalle', 'Historial de cambios'].map((tab, idx) => (
                <button key={tab} onClick={() => {
                  setTabDetalle(idx);
                  if (idx === 1 && historialTicket.length === 0) cargarHistorialUsuario(detalleTicket.id);
                }}
                  className="flex-1 py-3 text-sm font-medium transition-colors"
                  style={{ borderBottom: tabDetalle === idx ? '2px solid #1a3a6b' : '2px solid transparent', color: tabDetalle === idx ? '#1a3a6b' : '#9ca3af' }}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {tabDetalle === 0 && (
                <div className="p-6 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-400">Categoría</span>
                      <p className="font-medium">{CATEGORIAS[detalleTicket.categoria]?.label}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Sede</span>
                      <p className="font-medium capitalize">{detalleTicket.sede}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Estado</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium ml-1"
                        style={{ background: estadoColor[detalleTicket.estado]?.bg, color: estadoColor[detalleTicket.estado]?.text }}>
                        {ESTADOS_LABEL[detalleTicket.estado]}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Hora ingreso</span>
                      <p className="font-medium text-xs">{fmtFecha(detalleTicket.createdAt)}</p>
                    </div>
                    {detalleTicket.estado === 'finalizado' && (
                      <div>
                        <span className="text-xs text-gray-400">Hora finalizado</span>
                        <p className="font-medium text-xs">{fmtFecha(detalleTicket.ultimo_cambio_estado)}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Descripción</span>
                    <p className="mt-1 text-gray-700 bg-gray-50 rounded-lg p-3">{detalleTicket.descripcion}</p>
                  </div>
                  {detalleTicket.descripcion_cambio && (
                    <div>
                      <span className="text-xs text-gray-400">Último comentario de TI</span>
                      <p className="mt-1 text-gray-700 bg-blue-50 rounded-lg p-3">{detalleTicket.descripcion_cambio}</p>
                    </div>
                  )}
                  <button onClick={() => setDetalleTicket(null)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 mt-2">
                    Cerrar
                  </button>
                </div>
              )}

              {tabDetalle === 1 && (
                <div className="p-6">
                  {cargandoHistorial ? (
                    <p className="text-sm text-gray-400 text-center py-8">Cargando historial...</p>
                  ) : historialTicket.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin cambios registrados aún.</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background: '#e2e8f0' }} />
                      <div className="space-y-5">
                        {historialTicket.map((h, idx) => (
                          <div key={h.id} className="flex gap-4 relative">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold"
                              style={{ background: estadoColor[h.estado_nuevo]?.bg || '#f1f5f9', color: estadoColor[h.estado_nuevo]?.text || '#64748b', border: `2px solid ${estadoColor[h.estado_nuevo]?.border || '#cbd5e1'}` }}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {h.estado_anterior && (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                      style={{ background: estadoColor[h.estado_anterior]?.bg || '#f1f5f9', color: estadoColor[h.estado_anterior]?.text || '#64748b' }}>
                                      {ESTADOS_LABEL[h.estado_anterior]}
                                    </span>
                                    <span className="text-gray-300 text-xs">→</span>
                                  </>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ background: estadoColor[h.estado_nuevo]?.bg || '#f1f5f9', color: estadoColor[h.estado_nuevo]?.text || '#64748b' }}>
                                  {ESTADOS_LABEL[h.estado_nuevo]}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{fmtFecha(h.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}