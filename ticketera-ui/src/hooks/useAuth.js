import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    console.error("AuthContext no está disponible");
    return {};
  }

  return context;
};