import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Loader from './Loader';

const ProtectedRoute: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const location = useLocation();

  // Zobrazit loader, dokud se stav ze store nenačte (hydratace)
  if (!hasHydrated) {
    return <Loader />;
  }

  // Pokud není token, přesměrovat na login a zapamatovat si původní lokaci
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Pokud je token a hydratace proběhla, zobrazit chráněný obsah
  return <Outlet />;
};

export default ProtectedRoute; 