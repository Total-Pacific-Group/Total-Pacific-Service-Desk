const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password)
    return res.status(400).json({ mensaje: 'Correo y contraseña requeridos' });

  try {
    const usuario = await User.findOne({ where: { correo, estado: 'activo' } });
    if (!usuario)
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido)
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, tipo: usuario.tipo, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipo: usuario.tipo,
        cargo: usuario.cargo,
        departamento: usuario.departamento,
      },
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

const perfil = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.usuario.id, {
      attributes: { exclude: ['password'] },
    });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

module.exports = { login, perfil };