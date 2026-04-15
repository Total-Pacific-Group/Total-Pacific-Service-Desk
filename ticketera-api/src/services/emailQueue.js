const Bull = require('bull');
const nodemailer = require('nodemailer');
require('dotenv').config();

const CATEGORIAS_LABEL = {
  revision_equipos:     'Revisión de equipos',
  requerimiento:        'Requerimiento',
  revision_software:    'Revisión de software',
  accesos_credenciales: 'Accesos / Credenciales',
  reclamo:              'Reclamo',
};

const ESTADOS_LABEL = {
  pendiente:   'Pendiente',
  en_revision: 'En revisión',
  escalado:    'Escalado',
  finalizado:  'Finalizado',
};

const ESCALADO_LABEL = {
  compras:              'Escalado a Compras',
  en_espera_aprobacion: 'En espera de aprobación',
  proveedor:            'Soporte con proveedor',
};

const SEDES_LABEL = {
  manta:     'Manta',
  quito:     'Quito',
  guayaquil: 'Guayaquil',
};

// Conexión Redis
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
};

// Crear cola
const emailQueue = new Bull('emails', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,                     // Máximo 3 intentos
    backoff: {
      type: 'exponential',
      delay: 30000,                  // 30s, 60s, 120s entre reintentos
    },
    removeOnComplete: 100,           // Guarda solo los últimos 100 completados
    removeOnFail: 50,                // Guarda solo los últimos 50 fallidos
    timeout: 15000,                  // Timeout de 15s por intento
  },
  limiter: {
    max: 10,                         // Máximo 10 correos por intervalo
    duration: 60000,                 // Por minuto
  },
});

// Transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Plantilla base de correo
const plantillaBase = (contenido) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
    <div style="background:#1a3a6b;padding:20px;text-align:center">
      <h1 style="color:#FFD700;margin:0;font-size:20px">Total Pacific Service Desk</h1>
    </div>
    <div style="padding:28px;background:#ffffff">${contenido}</div>
    <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:11px;color:#888">
      Este es un correo automático, por favor no responder.
    </div>
  </div>
`;

// Procesador de la cola — aquí se ejecuta cada trabajo
emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  console.log(`[Cola] Procesando correo #${job.id} → ${to} (intento ${job.attemptsMade + 1}/3)`);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html: plantillaBase(html),
  });

  console.log(`[Cola] Correo #${job.id} enviado exitosamente → ${to}`);
});

// Eventos de la cola para monitoreo
emailQueue.on('completed', (job) => {
  console.log(`[Cola] Job #${job.id} completado`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[Cola] Job #${job.id} falló (intento ${job.attemptsMade}/3): ${err.message}`);
});

emailQueue.on('stalled', (job) => {
  console.warn(`[Cola] Job #${job.id} estancado — se reintentará`);
});

// Función para encolar un correo genérico
const encolarCorreo = async ({ to, subject, html }) => {
  try {
    const job = await emailQueue.add({ to, subject, html });
    console.log(`[Cola] Correo encolado #${job.id} → ${to}`);
  } catch (err) {
    console.error(`[Cola] Error al encolar correo para ${to}:`, err.message);
  }
};

// Notificación: nuevo ticket (va a admins)
const notificarNuevoTicket = async (ticket, usuarioNombre, admins) => {
  const destinatarios = admins.map(a => a.correo).join(',');
  await encolarCorreo({
    to: destinatarios,
    subject: `[Ticket #${ticket.id}] Nuevo requerimiento registrado`,
    html: `
      <h2 style="color:#1a3a6b;margin-bottom:16px">Nuevo ticket registrado</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888;width:140px">ID</td>
          <td style="padding:8px 0;font-weight:600">#${ticket.id}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Creado por</td>
          <td style="padding:8px 0;font-weight:600">${usuarioNombre}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Título</td>
          <td style="padding:8px 0;font-weight:600">${ticket.titulo}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Categoría</td>
          <td style="padding:8px 0">${CATEGORIAS_LABEL[ticket.categoria] || ticket.categoria}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Sede</td>
          <td style="padding:8px 0">${SEDES_LABEL[ticket.sede] || ticket.sede}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;vertical-align:top">Descripción</td>
          <td style="padding:8px 0">${ticket.descripcion}</td>
        </tr>
      </table>
      <div style="margin-top:20px;padding:12px 16px;background:#f0f4ff;border-radius:8px;font-size:13px;color:#555">
        Ingresa al sistema para gestionar este ticket.
      </div>
    `,
  });
};

// Notificación: cambio de estado (va al usuario dueño)
const notificarCambioEstado = async (ticket, correoUsuario) => {
  await encolarCorreo({
    to: correoUsuario,
    subject: `[Ticket #${ticket.id}] Actualización de estado`,
    html: `
      <h2 style="color:#1a3a6b;margin-bottom:16px">Tu ticket fue actualizado</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888;width:140px">ID</td>
          <td style="padding:8px 0;font-weight:600">#${ticket.id}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Título</td>
          <td style="padding:8px 0;font-weight:600">${ticket.titulo}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Categoría</td>
          <td style="padding:8px 0">${CATEGORIAS_LABEL[ticket.categoria] || ticket.categoria}</td>
        </tr>
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Nuevo estado</td>
          <td style="padding:8px 0">
            <span style="background:${ticket.estado === 'finalizado' ? '#DCFCE7' : ticket.estado === 'escalado' ? '#FEE2E2' : '#DBEAFE'};
                         color:${ticket.estado === 'finalizado' ? '#166534' : ticket.estado === 'escalado' ? '#991B1B' : '#1E40AF'};
                         padding:3px 10px;border-radius:20px;font-size:13px;font-weight:600">
              ${ESTADOS_LABEL[ticket.estado] || ticket.estado}
            </span>
          </td>
        </tr>
        ${ticket.escalado_a ? `
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888">Escalado a</td>
          <td style="padding:8px 0;color:#D32F2F;font-weight:600">${ESCALADO_LABEL[ticket.escalado_a] || ticket.escalado_a}</td>
        </tr>` : ''}
        ${ticket.descripcion_cambio ? `
        <tr>
          <td style="padding:8px 0;color:#888;vertical-align:top">Comentario</td>
          <td style="padding:8px 0">${ticket.descripcion_cambio}</td>
        </tr>` : ''}
      </table>
      <div style="margin-top:20px;padding:12px 16px;background:#f0f4ff;border-radius:8px;font-size:13px;color:#555">
        Puedes ver el detalle completo ingresando al sistema.
      </div>
    `,
  });
};

// Notificación: usuario creado
const notificarUsuarioCreado = async (usuario, passwordTemporal) => {
  await encolarCorreo({
    to: usuario.correo,
    subject: 'Bienvenido a Total Pacific Service Desk',
    html: `
      <h2 style="color:#1a3a6b;margin-bottom:16px">Tu cuenta ha sido creada</h2>
      <p>Hola <strong>${usuario.nombre}</strong>, tu acceso al sistema ha sido configurado.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
        <tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:8px 0;color:#888;width:140px">Usuario</td>
          <td style="padding:8px 0;font-weight:600">${usuario.correo}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888">Contraseña temporal</td>
          <td style="padding:8px 0;font-weight:600">${passwordTemporal}</td>
        </tr>
      </table>
      <p style="color:#D32F2F;font-size:13px;margin-top:16px">
        Por seguridad, cambia tu contraseña al ingresar por primera vez.
      </p>
      <a href="${process.env.FRONTEND_URL}"
         style="display:inline-block;margin-top:16px;background:#1a3a6b;color:#FFD700;
                padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
        Ingresar al sistema
      </a>
    `,
  });
};

// Estadísticas de la cola (útil para monitoreo futuro)
const estadisticasCola = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
};

module.exports = {
  notificarNuevoTicket,
  notificarCambioEstado,
  notificarUsuarioCreado,
  estadisticasCola,
};