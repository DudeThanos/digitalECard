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
import { QRCodeSVG } from 'qrcode.react';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const SetupTotp = ({ onLogin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    // Get QR data from location state
    if (location.state?.totp) {
      setQrData(location.state.totp);
    } else {
      // If no QR data, redirect back to login
      navigate('/login');
    }
  }, [location.state, navigate]);

  const handleVerifyAndComplete = async () => {
    if (!totpCode.trim()) {
      setError('Please enter the TOTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/complete-totp-setup', {
        totp: totpCode
      });

      if (response.data.message === 'TOTP setup completed successfully') {
        setSetupComplete(true);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete TOTP setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDone = () => {
    // Call onLogin callback to update app state
    if (onLogin) {
      onLogin();
    }
    // Setup is complete, redirect to dashboard and reload
    navigate('/dashboard');
    window.location.reload();
  };

  if (!qrData) {
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
        maxWidth: 500, 
        width: '100%',
        textAlign: 'center',
        boxShadow: 3,
        borderRadius: 2
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#AC212F', fontWeight: 'bold' }}>
          Superuser TOTP Setup
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
          Scan this QR code with your Google Authenticator app to set up two-factor authentication.
        </Typography>

        {!setupComplete ? (
          <>
            {/* QR Code */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3,
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 2
            }}>
              <QRCodeSVG 
                value={qrData.otpauth_url} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </Box>

            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              After scanning, enter the 6-digit code from your authenticator app below:
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyAndComplete(); }}>
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
                disabled={loading || !totpCode.trim()}
                sx={{ 
                  mb: 2,
                  backgroundColor: '#AC212F',
                  '&:hover': { backgroundColor: '#8B1A1A' }
                }}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Verify & Complete Setup'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              TOTP setup completed successfully! Your two-factor authentication is now active.
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
              From now on, you'll need to enter a TOTP code when logging in as superuser.
            </Typography>

            <Button
              variant="contained"
              onClick={handleSetupDone}
              sx={{ 
                backgroundColor: '#34C969',
                '&:hover': { backgroundColor: '#2A9D54' }
              }}
              fullWidth
            >
              Setup Done
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SetupTotp; 