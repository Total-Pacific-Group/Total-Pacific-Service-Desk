import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { userService } from '../../services/api';
import { DEPTOS } from '../../utils/constantes';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalPass, setModalPass] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [verDadosDeBaja, setVerDadosDeBaja] = useState(false);
  const [filtros, setFiltros] = useState({ departamento: '', correo: '' });
  const [form, setForm] = useState({ nombre: '', cargo: '', departamento: '', correo: '', telefono: '', password: '', tipo: 'estandar' });
  const [nuevaPass, setNuevaPass] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtros.departamento) params.departamento = filtros.departamento;
      if (filtros.correo) params.correo = filtros.correo;
      params.estado = verDadosDeBaja ? 'dado_de_baja' : 'activo';
      const res = await userService.listar(params);
      setUsuarios(res.data);
    } catch { setError('Error cargando usuarios'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, [verDadosDeBaja]);

  const abrirCrear = () => {
    setUsuarioSeleccionado(null);
    setForm({ nombre: '', cargo: '', departamento: '', correo: '', telefono: '', password: '', tipo: 'estandar' });
    setError(''); setExito('');
    setModalAbierto(true);
  };

  const abrirEditar = (u) => {
    setUsuarioSeleccionado(u);
    setForm({ nombre: u.nombre, cargo: u.cargo, departamento: u.departamento, correo: u.correo, telefono: u.telefono || '', password: '', tipo: u.tipo })
    setError(''); setExito('');
    setModalAbierto(true);
  };

  const abrirCambiarPass = (u) => {
    setUsuarioSeleccionado(u);
    setNuevaPass('');
    setError(''); setExito('');
    setModalPass(true);
  };

  const handleGuardar = async () => {
    const { nombre, cargo, departamento, correo, telefono, password, tipo } = form;
    if (!nombre || !cargo || !departamento || !correo) return setError('Todos los campos son requeridos');
    if (!usuarioSeleccionado && !password) return setError('La contraseña es requerida para nuevos usuarios');
    setGuardando(true); setError('');
    try {
      if (usuarioSeleccionado) {
        await userService.editar(usuarioSeleccionado.id, { nombre, cargo, departamento, correo, telefono: form.telefono, tipo });
        setExito('Usuario actualizado correctamente');
      } else {
        await userService.crear({ nombre, cargo, departamento, telefono, correo, password, tipo });
        setExito('Usuario creado y notificado por correo');
      }
      cargar();
      setTimeout(() => { setModalAbierto(false); setExito(''); }, 1500);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar');
    } finally { setGuardando(false); }
  };

  const handleCambiarEstado = async (u) => {
    const nuevoEstado = u.estado === 'activo' ? 'dado_de_baja' : 'activo';
    try {
      await userService.editar(u.id, { ...u, estado: nuevoEstado });
      cargar();
    } catch { setError('Error al cambiar estado'); }
  };

  const handleCambiarPass = async () => {
    if (!nuevaPass) return setError('Ingresa la nueva contraseña');
    setGuardando(true); setError('');
    try {
      await userService.cambiarPassword(usuarioSeleccionado.id, { password: nuevaPass });
      setExito('Contraseña actualizada');
      setTimeout(() => { setModalPass(false); setExito(''); }, 1500);
    } catch { setError('Error al cambiar contraseña'); }
    finally { setGuardando(false); }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1a3a6b' }}>Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500">Administra los accesos al sistema</p>
          </div>
          <button onClick={abrirCrear} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#1a3a6b' }}>
            + Nuevo usuario
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filtros.departamento} onChange={e => setFiltros(f => ({ ...f, departamento: e.target.value }))}>
            <option value="">Todos los departamentos</option>
            {DEPTOS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="email" placeholder="Buscar por correo..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56"
            value={filtros.correo} onChange={e => setFiltros(f => ({ ...f, correo: e.target.value }))} />
          <button onClick={cargar} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#1a3a6b' }}>Filtrar</button>
          <button onClick={() => { setFiltros({ departamento: '', correo: '' }); setTimeout(cargar, 100); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200">Limpiar</button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Ver dados de baja</span>
            <button onClick={() => setVerDadosDeBaja(v => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: verDadosDeBaja ? '#D32F2F' : '#cbd5e1' }}>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{ transform: verDadosDeBaja ? 'translateX(22px)' : 'translateX(4px)' }} />
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {cargando ? <p className="p-6 text-sm text-gray-400">Cargando...</p> : usuarios.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No hay usuarios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['#ID', 'Nombre', 'Cargo', 'Departamento', 'Correo', 'Tipo', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{u.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                      <td className="px-4 py-3 text-gray-600">{u.cargo}</td>
                      <td className="px-4 py-3 text-gray-600">{u.departamento}</td>
                      <td className="px-4 py-3 text-gray-600">{u.correo}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: u.tipo === 'admin' ? '#1a3a6b' : '#e8f0fe', color: u.tipo === 'admin' ? '#FFD700' : '#1a3a6b' }}>
                          {u.tipo === 'admin' ? 'Admin' : 'Estándar'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: u.estado === 'activo' ? '#DCFCE7' : '#FEE2E2', color: u.estado === 'activo' ? '#166534' : '#991B1B' }}>
                          {u.estado === 'activo' ? 'Activo' : 'Dado de baja'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => abrirEditar(u)} className="px-2 py-1 rounded text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">Editar</button>
                          <button onClick={() => abrirCambiarPass(u)} className="px-2 py-1 rounded text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50">Clave</button>
                          <button onClick={() => handleCambiarEstado(u)}
                            className="px-2 py-1 rounded text-xs font-medium border"
                            style={{ borderColor: u.estado === 'activo' ? '#fca5a5' : '#86efac', color: u.estado === 'activo' ? '#D32F2F' : '#16A34A' }}>
                            {u.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear/editar usuario */}
      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4" style={{ background: '#1a3a6b' }}>
              <h3 className="font-bold" style={{ color: '#FFD700' }}>
                {usuarioSeleccionado ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Nombre completo', key: 'nombre', type: 'text', placeholder: 'Juan Pérez' },
                  { label: 'Cargo', key: 'cargo', type: 'text', placeholder: 'Analista TI' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Departamento</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.departamento} onChange={e => setForm(v => ({ ...v, departamento: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {DEPTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Correo electrónico</label>
                <input type="email" placeholder="usuario@empresa.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={form.correo} onChange={e => setForm(v => ({ ...v, correo: e.target.value }))} />
              </div>
              <div>   
              <label className="text-xs font-semibold text-gray-600 block mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="0991234567"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={form.telefono}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setForm(v => ({ ...v, telefono: val }));
                  }}/>
              </div>
              {!usuarioSeleccionado && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Contraseña inicial</label>
                  <input type="password" placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Tipo de usuario</label>
                <div className="flex gap-3">
                  {['estandar', 'admin'].map(t => (
                    <button key={t} onClick={() => setForm(v => ({ ...v, tipo: t }))}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all"
                      style={{
                        borderColor: form.tipo === t ? '#1a3a6b' : '#e2e8f0',
                        background: form.tipo === t ? '#1a3a6b' : '#fff',
                        color: form.tipo === t ? '#FFD700' : '#6b7280',
                      }}>
                      {t === 'admin' ? 'Administrador' : 'Estándar'}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {exito && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{exito}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalAbierto(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600">Cancelar</button>
                <button onClick={handleGuardar} disabled={guardando}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: '#1a3a6b' }}>
                  {guardando ? 'Guardando...' : usuarioSeleccionado ? 'Actualizar' : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal cambiar contraseña */}
      {modalPass && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-4" style={{ background: '#1a3a6b' }}>
              <h3 className="font-bold" style={{ color: '#FFD700' }}>Cambiar contraseña</h3>
              <p className="text-sm text-blue-200">{usuarioSeleccionado?.nombre}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nueva contraseña</label>
                <input type="password" placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={nuevaPass} onChange={e => setNuevaPass(e.target.value)} />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {exito && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{exito}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalPass(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600">Cancelar</button>
                <button onClick={handleCambiarPass} disabled={guardando}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: '#1a3a6b' }}>
                  {guardando ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}