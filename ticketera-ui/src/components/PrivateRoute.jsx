import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children, rol }) => {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.tipo !== rol) return <Navigate to="/login" replace />;
  return children;
};

export default PrivateRoute;