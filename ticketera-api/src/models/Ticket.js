const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const ESTADOS_VALIDOS = ['pendiente', 'en_revision', 'escalado', 'finalizado'];
const CATEGORIAS = [
  'revision_equipos',
  'requerimiento',
  'revision_software',
  'accesos_credenciales',
  'reclamo',
];

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.ENUM(...CATEGORIAS),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sede: {
    type: DataTypes.ENUM('manta', 'quito', 'guayaquil'),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM(...ESTADOS_VALIDOS),
    allowNull: false,
    defaultValue: 'pendiente',
  },
  escalado_a: {
    type: DataTypes.ENUM('compras', 'en_espera_aprobacion', 'proveedor'),
    allowNull: true,
    defaultValue: null,
  },
  descripcion_cambio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ticket_referencia_id: {
    // para reclamos, referencia al ticket anterior
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
  asignado_a: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'usuarios', key: 'id' },
  },
  ultimo_cambio_estado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tickets',
  timestamps: true,
});

Ticket.belongsTo(User, { as: 'usuario', foreignKey: 'usuario_id' });
Ticket.belongsTo(User, { as: 'asignado', foreignKey: 'asignado_a' });
User.hasMany(Ticket, { foreignKey: 'usuario_id' });

module.exports = Ticket;