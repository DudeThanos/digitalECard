import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const SuperuserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();
  if (user.role !== 'superuser') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};

export default SuperuserRoute; 