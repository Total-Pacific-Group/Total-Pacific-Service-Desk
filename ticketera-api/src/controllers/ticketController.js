const { Op } = require('sequelize');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { notificarNuevoTicket, notificarCambioEstado } = require('../services/emailQueue');
// Nuevos queries que permiten ver historial de cambios en los tickets
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const TRANSICIONES_VALIDAS = {
  pendiente:    ['en_revision'],
  en_revision:  ['escalado', 'finalizado'],
  escalado:     ['en_revision', 'finalizado'],
  finalizado:   [],
};

const listarTickets = async (req, res) => {
  try {
    const { estado, categoria, sede, fecha_desde, fecha_hasta, solo_activos } = req.query;
    const where = {};

    if (req.usuario.tipo === 'estandar') where.usuario_id = req.usuario.id;
    if (estado) where.estado = estado;
    if (categoria) where.categoria = categoria;
    if (sede) where.sede = sede;
    if (req.query.usuario_id) where.usuario_id = req.query.usuario_id;
    if (solo_activos === 'true') where.estado = { [Op.ne]: 'finalizado' };
    if (fecha_desde || fecha_hasta) {
      where.createdAt = {};
      if (fecha_desde) where.createdAt[Op.gte] = new Date(fecha_desde);
      if (fecha_hasta) where.createdAt[Op.lte] = new Date(fecha_hasta);
    }

    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: User, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'departamento'] },
        { model: User, as: 'asignado', attributes: ['id', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

const crearTicket = async (req, res) => {
  const { titulo, categoria, descripcion, sede, ticket_referencia_id } = req.body;
  if (!titulo || !categoria || !descripcion || !sede)
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });

  try {
    const ticket = await Ticket.create({
      titulo, categoria, descripcion, sede,
      ticket_referencia_id: ticket_referencia_id || null,
      usuario_id: req.usuario.id,
      estado: 'pendiente',
      ultimo_cambio_estado: new Date(),
    });

    // Responde inmediatamente — el correo va en segundo plano
    res.status(201).json(ticket);

    // Intenta notificar sin bloquear la respuesta
    try {
      const admins = await User.findAll({ where: { tipo: 'admin', estado: 'activo' } });
      await notificarNuevoTicket(ticket, req.usuario.nombre, admins);
    } catch (emailErr) {
      console.warn('Notificación de nuevo ticket falló:', emailErr.message);
    }

  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

// Ahora cada cambio de estado se registra en una tabla de historial donde puedes ver los cambios
const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { estado, escalado_a, descripcion_cambio } = req.body;

  try {
    const ticket = await Ticket.findByPk(id, {
      include: [{ model: User, as: 'usuario', attributes: ['correo', 'nombre'] }],
    });
    if (!ticket)
      return res.status(404).json({ mensaje: 'Ticket no encontrado' });

    const permitidos = TRANSICIONES_VALIDAS[ticket.estado];
    if (!permitidos.includes(estado))
      return res.status(400).json({
        mensaje: `No se puede cambiar de "${ticket.estado}" a "${estado}"`,
      });

    if (estado === 'escalado' && !escalado_a)
      return res.status(400).json({ mensaje: 'Debe especificar hacia dónde se escala' });

    const estadoAnterior = ticket.estado;

    await ticket.update({
      estado,
      escalado_a: estado === 'escalado' ? escalado_a : null,
      descripcion_cambio: descripcion_cambio || null,
      asignado_a: req.usuario.id,
      ultimo_cambio_estado: new Date(),
    });

    await sequelize.query(
      `INSERT INTO ticket_historial (ticket_id, usuario_id, estado_anterior, estado_nuevo, escalado_a, comentario)
       VALUES (:ticket_id, :usuario_id, :estado_anterior, :estado_nuevo, :escalado_a, :comentario)`,
      {
        replacements: {
          ticket_id: ticket.id,
          usuario_id: req.usuario.id,
          estado_anterior: estadoAnterior,
          estado_nuevo: estado,
          escalado_a: estado === 'escalado' ? escalado_a : null,
          comentario: descripcion_cambio || null,
        },
        type: QueryTypes.INSERT,
      }
    );

    // Responde antes de intentar el correo
    res.json(ticket);

    // Notificación en segundo plano
    try {
      await notificarCambioEstado(ticket, ticket.usuario.correo);
    } catch (emailErr) {
      console.warn('Notificación de cambio de estado falló:', emailErr.message);
    }

  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

const statsAdmin = async (req, res) => {
  try {
    const ahora = new Date();
    const hace48h = new Date(ahora - 48 * 60 * 60 * 1000);

    const [total, pendientes, enRevision, escalados, finalizados, alertas] = await Promise.all([
      Ticket.count(),
      Ticket.count({ where: { estado: 'pendiente' } }),
      Ticket.count({ where: { estado: 'en_revision' } }),
      Ticket.count({ where: { estado: 'escalado' } }),
      Ticket.count({ where: { estado: 'finalizado' } }),
      Ticket.count({
        where: {
          estado: { [Op.ne]: 'finalizado' },
          ultimo_cambio_estado: { [Op.lte]: hace48h },
        },
      }),
    ]);

    res.json({ total, pendientes, enRevision, escalados, finalizados, alertas });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

const statsUsuario = async (req, res) => {
  try {
    const uid = req.usuario.id;
    const [total, pendientes, enRevision, escalados, finalizados] = await Promise.all([
      Ticket.count({ where: { usuario_id: uid } }),
      Ticket.count({ where: { usuario_id: uid, estado: 'pendiente' } }),
      Ticket.count({ where: { usuario_id: uid, estado: 'en_revision' } }),
      Ticket.count({ where: { usuario_id: uid, estado: 'escalado' } }),
      Ticket.count({ where: { usuario_id: uid, estado: 'finalizado' } }),
    ]);
    res.json({ total, pendientes, enRevision, escalados, finalizados });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
const obtenerHistorialTicket = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Primero buscamos el ticket para saber a quién le pertenece
    const ticket = await Ticket.findByPk(id);
    
    if (!ticket) {
      return res.status(404).json({ mensaje: 'Ticket no encontrado' });
    }
    // Al otorgar acceso al usuario del historial de ticket hay una vulnerabulidad que permite que si el usuario digita otro numero de id
    // del ticker ejemplo /tickets/51/historial cualquier usuario puede ver cualquier ticket sin importar sus permisos
    // 2. VALIDACIÓN DE SEGURIDAD
    // Si el usuario NO es admin Y el usuario_id del ticket NO es el mismo que el del token
    if (req.usuario.tipo !== 'admin' && ticket.usuario_id !== req.usuario.id) {
      // 403 para decir "estás autenticado, pero no tienes permiso para ESTE ticket"
      return res.status(403).json({ mensaje: 'No tienes permiso para ver el historial de este ticket' });
    }

    // Si pasó la validación, ejecutamos la consulta del historial
    const historial = await sequelize.query(
      `SELECT th.*, u.nombre as admin_nombre
       FROM ticket_historial th
       LEFT JOIN usuarios u ON th.usuario_id = u.id
       WHERE th.ticket_id = :ticket_id
       ORDER BY th.createdAt ASC`,
      {
        replacements: { ticket_id: id },
        type: QueryTypes.SELECT,
      }
    );
    
    res.json(historial);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
module.exports = { listarTickets, crearTicket, cambiarEstado, statsAdmin, statsUsuario, obtenerHistorialTicket };