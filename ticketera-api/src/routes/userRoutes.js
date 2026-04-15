const router = require('express').Router();
const { listarUsuarios, crearUsuario, editarUsuario, cambiarPassword } = require('../controllers/userController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.use(verificarToken, soloAdmin);

router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.put('/:id', editarUsuario);
router.patch('/:id/password', cambiarPassword);

module.exports = router;