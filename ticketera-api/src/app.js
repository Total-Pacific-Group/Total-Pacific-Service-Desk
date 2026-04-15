require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

require('./models/User');
require('./models/Ticket');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;

// Monitoreo de la cola — solo accesible para admins en producción
const { estadisticasCola } = require('./services/emailQueue');

app.get('/api/admin/email-queue', async (req, res) => {
  try {
    const stats = await estadisticasCola();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => console.error('Error conectando DB:', err));