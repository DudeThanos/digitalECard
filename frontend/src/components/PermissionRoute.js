import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import AccessDenied from '../pages/AccessDenied';

const PermissionRoute = ({ children, requiredPermission, permissionEndpoint }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Check permission from backend
        const response = await fetch(permissionEndpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Check if a new token was provided
        const newToken = response.headers.get('X-New-Token');
        if (newToken) {
          localStorage.setItem('token', newToken);
          
          // Immediately sync user data with new token
          fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
          })
          .then(res => res.json())
          .then(userData => {
            if (userData.user) {
              localStorage.setItem('user', JSON.stringify(userData.user));
            }
          })
          .catch(err => console.error('Error syncing user data:', err));
        }

        if (!response.ok) {
          setHasPermission(false);
          setError(true);
        } else {
          const data = await response.json();
          
          // If permission check succeeds, sync localStorage with JWT token permissions
          if (data.hasPermission) {
            // Fetch current user data to get the latest permissions from JWT token
            fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
            .then(res => res.json())
            .then(userData => {
              if (userData.user) {
                localStorage.setItem('user', JSON.stringify(userData.user));
              }
            })
            .catch(err => console.error('Error syncing user data:', err));
          }
          
          setHasPermission(data.hasPermission || false);
        }
      } catch (err) {
        console.error('Permission check failed:', err);
        setHasPermission(false);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permissionEndpoint]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !hasPermission) {
    return <AccessDenied />;
  }

  return children;
};

export default PermissionRoute; 