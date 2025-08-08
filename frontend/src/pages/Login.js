import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Footer from '../components/Footer';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [pendingCreds, setPendingCreds] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && user) {
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else if (user.employee_code) {
        navigate(`/card/${user.employee_code}`);
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      // Handle TOTP setup for superuser (fresh installation)
      if (res.data.requireTotpSetup) {
        navigate('/setup-totp', { state: { totp: res.data.totp } });
        return;
      }
      
      // Handle TOTP verification for superuser (after setup)
      if (res.data.requireTotp) {
        navigate('/enter-totp', { state: { userType: res.data.userType } });
        return;
      }
      
      // Regular login (no TOTP required)
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      } else {
        localStorage.removeItem('token');
      }
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        localStorage.removeItem('user');
      }
      
      const decoded = parseJwt(res.data.token);
      if (decoded && decoded.role === 'admin') {
        onLogin && onLogin();
        navigate('/dashboard');
      } else if (decoded && decoded.role === 'superuser') {
        onLogin && onLogin();
        navigate('/dashboard');
      } else if (decoded && decoded.employee_code) {
        onLogin && onLogin();
        navigate(`/card/${decoded.employee_code}`);
      } else {
        setError('Invalid user role or token');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundImage: 'url(/login.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      marginTop: '-64px', // Start background behind navbar
      paddingTop: '64px', // Push content below navbar
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(21, 20, 20, 0.39)',
        zIndex: 1,
      }
    }}>
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
      <Box sx={{ 
        maxWidth: 450, 
        width: '90%',
        mx: 'auto', 
        p: 4, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)', 
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        border: `2px solid ${theme.palette.primary.main}`,
        position: 'relative',
        zIndex: 2,
        backdropFilter: 'blur(15px)',
        transform: 'translateY(0)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }
      }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 1.5, sm: 3 } }}>
          <img 
            src="/logo.svg" 
            alt="Kaynes Logo" 
            style={{ 
              width: '180px', 
              height: 'auto',
              marginBottom: '1px',
              marginLeft: '17px',
              objectFit: 'contain',
              objectPosition: 'center'
            }} 
          />
          <Typography variant="h4" sx={{ 
            color: "text.primary", 
            textAlign: 'center',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            marginBottom: '2px'
          }}>
            Digital Card
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.primary.light, 
            textAlign: 'center',
            fontSize: '1.1rem'
          }}>
            Sign in to access your digital card
          </Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '&:hover fieldset': {
                  borderColor: theme.palette.secondary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '&:hover fieldset': {
                  borderColor: theme.palette.secondary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((show) => !show)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ 
              mt: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              fontWeight: 'bold',
              borderRadius: 4,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.secondary.main,
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(231, 76, 60, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Sign In
          </Button>
        </form>
      </Box>
      </Box>
      <Footer showDeveloper={false} />
    </Box>
  );
};

export default Login; 