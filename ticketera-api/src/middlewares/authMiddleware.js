const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(403).json({ mensaje: 'Token inválido o expirado' });
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario.tipo !== 'admin')
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  next();
};

module.exports = { verificarToken, soloAdmin };