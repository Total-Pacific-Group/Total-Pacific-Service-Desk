export const DEPTOS = [
  'Sistemas',
  'Administración',
  'Financiero',
  'Operaciones',
  'Recursos Humanos',
  'Gerencia General',
];

export const ESTADOS_LABEL = {
  pendiente:   'Pendiente',
  en_revision: 'En revisión',
  escalado:    'Escalado',
  finalizado:  'Finalizado',
};

export const ESCALADO_LABEL = {
  compras:              'Escalado a Compras',
  en_espera_aprobacion: 'En espera de aprobación',
  proveedor:            'Soporte con proveedor',
};

export const estadoColor = {
  pendiente:   { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  en_revision: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  escalado:    { bg: '#FEE2E2', text: '#991B1B', border: '#D32F2F' },
  finalizado:  { bg: '#DCFCE7', text: '#166534', border: '#16A34A' },
};

export const CATEGORIAS = {
  revision_equipos:     { label: 'Revisión de equipos',   desc: 'Problemas con hardware, periféricos o infraestructura física.' },
  requerimiento:        { label: 'Requerimiento',          desc: 'Solicitud de recursos, herramientas o servicios de TI.' },
  revision_software:    { label: 'Revisión de software',   desc: 'Errores, instalaciones o configuraciones de aplicaciones.' },
  accesos_credenciales: { label: 'Accesos / Credenciales', desc: 'Solicitud o recuperación de accesos y contraseñas.' },
  reclamo:              { label: 'Reclamo',                desc: 'Si consideras que un ticket anterior no fue resuelto correctamente.' },
};

export const calcularTiempoResolucion = (createdAt, ultimo_cambio_estado, estado) => {
  if (estado !== 'finalizado' || !ultimo_cambio_estado) return null;
  const inicio = new Date(createdAt);
  const fin = new Date(ultimo_cambio_estado);
  const diffMs = fin - inicio;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHrs / 24);

  if (diffDias > 0) {
    const hrsRestantes = diffHrs % 24;
    return hrsRestantes > 0 ? `${diffDias}d ${hrsRestantes}h` : `${diffDias}d`;
  }
  if (diffHrs > 0) {
    const minRestantes = diffMin % 60;
    return minRestantes > 0 ? `${diffHrs}h ${minRestantes}m` : `${diffHrs}h`;
  }
  return `${diffMin}m`;
};