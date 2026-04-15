const router = require('express').Router();
const { listarTickets, crearTicket, cambiarEstado, statsAdmin, statsUsuario, obtenerHistorialTicket } = require('../controllers/ticketController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/stats/admin', soloAdmin, statsAdmin);
router.get('/stats/usuario', statsUsuario);
router.get('/', listarTickets);
router.post('/', crearTicket);
router.patch('/:id/estado', soloAdmin, cambiarEstado);
router.get('/:id/historial', obtenerHistorialTicket);

module.exports = router;