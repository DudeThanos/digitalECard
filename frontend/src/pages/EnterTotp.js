import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const EnterTotp = ({ onLogin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    // Get user type from location state
    if (location.state?.userType) {
      setUserType(location.state.userType);
    } else {
      // If no user type, redirect back to login
      navigate('/login');
    }
  }, [location.state, navigate]);

  const handleVerifyTotp = async () => {
    if (!totpCode.trim()) {
      setError('Please enter the TOTP code');
      return;
    }

    if (totpCode.length !== 6) {
      setError('TOTP code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/verify-totp', {
        totp: totpCode,
        userType: userType
      });

      if (response.data.token) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Call onLogin callback to update app state
        if (onLogin) {
          onLogin();
        }
        
        // Navigate to dashboard and reload to ensure navbar state is updated
        navigate('/dashboard');
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid TOTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!userType) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
      p: 2
    }}>
      <Paper sx={{ 
        p: 4, 
        maxWidth: 400, 
        width: '100%',
        textAlign: 'center',
        boxShadow: 3,
        borderRadius: 2
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#AC212F', fontWeight: 'bold' }}>
          Two-Factor Authentication
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
          Enter the 6-digit code from your Google Authenticator app.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleVerifyTotp(); }}>
          <TextField
            fullWidth
            label="TOTP Code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="Enter 6-digit code"
            inputProps={{ 
              maxLength: 6,
              pattern: '[0-9]*'
            }}
            sx={{ mb: 3 }}
            autoFocus
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading || totpCode.length !== 6}
            sx={{ 
              mb: 2,
              backgroundColor: '#AC212F',
              '&:hover': { backgroundColor: '#8B1A1A' }
            }}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Verify & Login'}
          </Button>
        </form>

        <Button
          variant="outlined"
          onClick={handleBackToLogin}
          sx={{ 
            borderColor: '#AC212F',
            color: '#AC212F',
            '&:hover': { 
              borderColor: '#8B1A1A',
              backgroundColor: 'rgba(172, 33, 47, 0.04)'
            }
          }}
          fullWidth
        >
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
};

export default EnterTotp; 