const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  cargo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  departamento: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  telefono: {
  type: DataTypes.STRING(10),
  allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('admin', 'estandar'),
    allowNull: false,
    defaultValue: 'estandar',
  },
  estado: {
    type: DataTypes.ENUM('activo', 'dado_de_baja'),
    allowNull: false,
    defaultValue: 'activo',
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
});

module.exports = User;