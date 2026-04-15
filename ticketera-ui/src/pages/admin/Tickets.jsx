import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ticketService, userService } from '../../services/api';
import { DEPTOS, ESTADOS_LABEL, ESCALADO_LABEL, estadoColor, CATEGORIAS, calcularTiempoResolucion } from '../../utils/constantes';

const TRANSICIONES = {
  pendiente:   ['en_revision'],
  en_revision: ['escalado', 'finalizado'],
  escalado:    ['en_revision', 'finalizado'],
  finalizado:  [],
};

const fmtFecha = (fecha) => fecha
  ? new Date(fecha).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabEstado, setTabEstado] = useState('activos');
  const [usuariosFiltro, setUsuariosFiltro] = useState([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tabActiva, setTabActiva] = useState(0);
  const [historialTicket, setHistorialTicket] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [filtros, setFiltros] = useState({ estado: '', usuario_id: '', departamento: '', fecha_desde: '', fecha_hasta: '', orden: '' });
  const [formCambio, setFormCambio] = useState({ estado: '', escalado_a: '', descripcion_cambio: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargarTickets = async () => {
    setCargando(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filtros).filter(([k, v]) => v && k !== 'departamento')
      );
      if (tabEstado === 'finalizados') params.estado = 'finalizado';
      const res = await ticketService.listar(params);
      let data = tabEstado === 'activos'
        ? res.data.filter(t => t.estado !== 'finalizado')
        : res.data;
      if (filtros.departamento)
        data = data.filter(t => t.usuario?.departamento === filtros.departamento);
      if (filtros.orden === 'asc') {
          data = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (filtros.orden === 'desc') {
          data = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      setTickets(data);
    } catch { }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarTickets(); }, [tabEstado]);

  useEffect(() => {
    userService.listar({ estado: 'activo' })
      .then(res => setUsuariosFiltro(res.data))
      .catch(console.error);
  }, []);

  const abrirModal = (ticket) => {
    setTicketSeleccionado(ticket);
    setFormCambio({ estado: ticket.estado, escalado_a: ticket.escalado_a || '', descripcion_cambio: '' });
    setTabActiva(0);
    setHistorialTicket([]);
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTicketSeleccionado(null);
    setTabActiva(0);
    setHistorialTicket([]);
  };

  const cargarHistorial = async (id) => {
    setCargandoHistorial(true);
    try {
      const res = await ticketService.historial(id);
      setHistorialTicket(res.data);
    } catch { setHistorialTicket([]); }
    finally { setCargandoHistorial(false); }
  };

  const handleCambiarEstado = async () => {
    if (!formCambio.estado) return setError('Selecciona un estado');
    if (formCambio.estado === 'escalado' && !formCambio.escalado_a) return setError('Especifica hacia dónde se escala');
    if (!formCambio.descripcion_cambio.trim()) return setError('El comentario es obligatorio');
    setGuardando(true);
    try {
      await ticketService.cambiarEstado(ticketSeleccionado.id, formCambio);
      cerrarModal();
      cargarTickets();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado');
    } finally { setGuardando(false); }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a3a6b' }}>Tickets</h1>
          <p className="text-sm text-gray-500">Gestión de todos los requerimientos</p>
        </div>

        {/* Tabs */}
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
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}>
              <option value="">Todos los estados</option>
              {(tabEstado === 'activos'
                ? ['pendiente', 'en_revision', 'escalado']
                : ['finalizado']
              ).map(e => (
                <option key={e} value={e}>{ESTADOS_LABEL[e]}</option>
              ))}
            </select>

            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={filtros.departamento} onChange={e => setFiltros(f => ({ ...f, departamento: e.target.value }))}>
              <option value="">Todos los departamentos</option>
              {DEPTOS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-40"
              value={filtros.usuario_id} onChange={e => setFiltros(f => ({ ...f, usuario_id: e.target.value }))}>
              <option value="">Todos los usuarios</option>
              {usuariosFiltro.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>

            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={filtros.orden}
              onChange={e => setFiltros(f => ({ ...f, orden: e.target.value }))}
            >
              <option value="">Orden por defecto</option>
              <option value="desc">Más recientes primero</option>
              <option value="asc">Más antiguos primero</option>
            </select>

            <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={filtros.fecha_desde} onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))} />
            <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={filtros.fecha_hasta} onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))} />

            <button onClick={cargarTickets} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#1a3a6b' }}>
              Filtrar
            </button>
            <button onClick={() => {
              setFiltros({ estado: '', usuario_id: '', departamento: '', fecha_desde: '', fecha_hasta: '', orden: '' });
              setTimeout(cargarTickets, 100);
            }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200">
              Limpiar
            </button>
          </div>
          {!cargando && (
            <p className="text-xs text-gray-400 mt-3">
              {tickets.length} resultado{tickets.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {cargando ? (
            <p className="p-6 text-sm text-gray-400">Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No hay tickets en esta sección.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['#ID', 'Título', 'Usuario', 'Asignado a', 'Estado', 'Hora de Ingreso', 'Hora de Cierre', 'Tiempo de resolución', 'Detalle'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{t.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{t.titulo}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {t.usuario?.nombre}
                        <br /><span className="text-xs text-gray-400">{t.usuario?.correo}</span>
                      </td>
                      <td className="px-4 py-3">
                        {t.asignado?.nombre
                          ? <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: '#e8f0fe', color: '#1a3a6b' }}>{t.asignado.nombre}</span>
                          : <span className="text-xs text-gray-400">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: estadoColor[t.estado]?.bg, color: estadoColor[t.estado]?.text }}>
                          {ESTADOS_LABEL[t.estado]}
                        </span>
                        {t.escalado_a && <p className="text-xs text-gray-400 mt-0.5">{ESCALADO_LABEL[t.escalado_a]}</p>}
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
                        <button onClick={() => abrirModal(t)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                          style={{ background: '#1a3a6b' }}>
                          {t.estado === 'finalizado' ? 'Ver' : 'Gestionar'}
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

      {/* Modal */}
      {modalAbierto && ticketSeleccionado && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

            <div className="px-6 py-4 flex-shrink-0" style={{ background: '#1a3a6b' }}>
              <h3 className="font-bold" style={{ color: '#FFD700' }}>Ticket #{ticketSeleccionado.id}</h3>
              <p className="text-sm text-blue-200 truncate">{ticketSeleccionado.titulo}</p>
            </div>

            <div className="flex border-b border-gray-200 flex-shrink-0">
              {['Detalle', 'Historial de cambios'].map((tab, idx) => (
                <button key={tab} onClick={() => {
                  setTabActiva(idx);
                  if (idx === 1 && historialTicket.length === 0) cargarHistorial(ticketSeleccionado.id);
                }}
                  className="flex-1 py-3 text-sm font-medium transition-colors"
                  style={{ borderBottom: tabActiva === idx ? '2px solid #1a3a6b' : '2px solid transparent', color: tabActiva === idx ? '#1a3a6b' : '#9ca3af' }}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {tabActiva === 0 && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400 text-xs">Usuario</span><p className="font-medium">{ticketSeleccionado.usuario?.nombre}</p></div>
                    <div><span className="text-gray-400 text-xs">Categoría</span><p className="font-medium">{CATEGORIAS[ticketSeleccionado.categoria]?.label}</p></div>
                    <div><span className="text-gray-400 text-xs">Sede</span><p className="font-medium capitalize">{ticketSeleccionado.sede}</p></div>
                    <div>
                      <span className="text-gray-400 text-xs">Estado actual</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium ml-1"
                        style={{ background: estadoColor[ticketSeleccionado.estado]?.bg, color: estadoColor[ticketSeleccionado.estado]?.text }}>
                        {ESTADOS_LABEL[ticketSeleccionado.estado]}
                      </span>
                    </div>
                    <div><span className="text-gray-400 text-xs">Hora ingreso</span><p className="font-medium text-xs">{fmtFecha(ticketSeleccionado.createdAt)}</p></div>
                    {ticketSeleccionado.estado === 'finalizado' && (
                      <div><span className="text-gray-400 text-xs">Hora finalizado</span><p className="font-medium text-xs">{fmtFecha(ticketSeleccionado.ultimo_cambio_estado)}</p></div>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-400 text-xs">Descripción</span>
                    <p className="mt-1 text-gray-700 bg-gray-50 rounded-lg p-3">{ticketSeleccionado.descripcion}</p>
                  </div>

                  {ticketSeleccionado.estado !== 'finalizado' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Cambiar estado a</label>
                        <div className="flex flex-wrap gap-2">
                          {TRANSICIONES[ticketSeleccionado.estado].map(e => (
                            <button key={e} onClick={() => setFormCambio(f => ({ ...f, estado: e, escalado_a: '' }))}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all"
                              style={{
                                borderColor: formCambio.estado === e ? estadoColor[e]?.border : '#e2e8f0',
                                background: formCambio.estado === e ? estadoColor[e]?.bg : '#fff',
                                color: formCambio.estado === e ? estadoColor[e]?.text : '#6b7280',
                              }}>
                              {ESTADOS_LABEL[e]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {formCambio.estado === 'escalado' && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Escalar hacia</label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(ESCALADO_LABEL).map(([op, label]) => (
                              <button key={op} onClick={() => setFormCambio(f => ({ ...f, escalado_a: op }))}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all"
                                style={{
                                  borderColor: formCambio.escalado_a === op ? '#D32F2F' : '#e2e8f0',
                                  background: formCambio.escalado_a === op ? '#FEE2E2' : '#fff',
                                  color: formCambio.escalado_a === op ? '#991B1B' : '#6b7280',
                                }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          Comentario <span className="text-red-500">*</span>
                        </label>
                        <textarea rows={3}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                          placeholder="Describe la acción tomada..."
                          value={formCambio.descripcion_cambio}
                          onChange={e => setFormCambio(f => ({ ...f, descripcion_cambio: e.target.value }))}
                        />
                      </div>

                      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                      <div className="flex gap-3 pt-2">
                        <button onClick={cerrarModal} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600">
                          Cancelar
                        </button>
                        <button onClick={handleCambiarEstado} disabled={guardando}
                          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white" style={{ background: '#1a3a6b' }}>
                          {guardando ? 'Guardando...' : 'Confirmar cambio'}
                        </button>
                      </div>
                    </>
                  )}

                  {ticketSeleccionado.estado === 'finalizado' && (
                    <button onClick={cerrarModal} className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600">
                      Cerrar
                    </button>
                  )}
                </div>
              )}

              {tabActiva === 1 && (
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
                                {h.escalado_a && (
                                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                                    {ESCALADO_LABEL[h.escalado_a]}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mb-1">
                                Por <span className="font-medium text-gray-600">{h.admin_nombre}</span>
                                {' · '}{fmtFecha(h.createdAt)}
                              </p>
                              {h.comentario && (
                                <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mt-1">{h.comentario}</p>
                              )}
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