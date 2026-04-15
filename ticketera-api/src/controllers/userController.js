const bcrypt = require('bcrypt');
const User = require('../models/User');
const { notificarUsuarioCreado } = require('../services/emailQueue');

const listarUsuarios = async (req, res) => {
  try {
    const { departamento, correo, estado } = req.query;
    const where = {};
    if (departamento) where.departamento = departamento;
    if (correo) where.correo = correo;
    if (estado) where.estado = estado;

    const usuarios = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

const crearUsuario = async (req, res) => {
  //  Anexo de 'telefono' aquí para recibirlo del front
  const { nombre, cargo, departamento, correo, password, tipo, telefono } = req.body;
  
  if (!nombre || !cargo || !departamento || !correo || !password)
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });

  try {
    const existe = await User.findOne({ where: { correo } });
    if (existe)
      return res.status(409).json({ mensaje: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    
    // Inclusion en la db
    const usuario = await User.create({
      nombre, 
      cargo, 
      departamento, 
      correo, 
      telefono,
      password: hash,
      tipo: tipo || 'estandar',
      estado: 'activo',
    });

    await notificarUsuarioCreado(usuario, password);

    const { password: _, ...datos } = usuario.toJSON();
    res.status(201).json(datos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

const editarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, cargo, departamento, correo, telefono, tipo, estado } = req.body;

  try {
    const usuario = await User.findByPk(id);
    if (!usuario)
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    await usuario.update({ nombre, cargo, departamento, correo, telefono, tipo, estado});
    const { password: _, ...datos } = usuario.toJSON();
    res.json(datos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

const cambiarPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password)
    return res.status(400).json({ mensaje: 'La nueva contraseña es requerida' });

  try {
    const usuario = await User.findByPk(id);
    if (!usuario)
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const hash = await bcrypt.hash(password, 10);
    await usuario.update({ password: hash });
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

module.exports = { listarUsuarios, crearUsuario, editarUsuario, cambiarPassword };