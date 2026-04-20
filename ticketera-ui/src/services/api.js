import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3008/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authService = {
  login: (datos) => api.post('/auth/login', datos),
  perfil: () => api.get('/auth/perfil'),
};

export const ticketService = {
  listar: (params) => api.get('/tickets', { params }),
  crear: (datos) => api.post('/tickets', datos),
  cambiarEstado: (id, datos) => api.patch(`/tickets/${id}/estado`, datos),
  statsAdmin: () => api.get('/tickets/stats/admin'),
  statsUsuario: () => api.get('/tickets/stats/usuario'),
  // Ver historial de cambios en el ticket
  historial: (id) => api.get(`/tickets/${id}/historial`),
};

export const userService = {
  listar: (params) => api.get('/users', { params }),
  crear: (datos) => api.post('/users', datos),
  editar: (id, datos) => api.put(`/users/${id}`, datos),
  cambiarPassword: (id, datos) => api.patch(`/users/${id}/password`, datos),
};