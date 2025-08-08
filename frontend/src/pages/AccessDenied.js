import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';
import { useTheme } from '@mui/material/styles';

const AccessDenied = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 3,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
      <Box sx={{
        maxWidth: 500,
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: 4,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        border: `2px solid ${theme.palette.error.main}`,
      }}>
        <BlockIcon sx={{ 
          fontSize: 80, 
          color: theme.palette.error.main, 
          mb: 2 
        }} />
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: theme.palette.error.main,
          mb: 2
        }}>
          Access Denied
        </Typography>
        
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          You don't have permission to access this page.
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          If you believe this is an error, please contact your administrator.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              fontWeight: 'bold',
              px: 3,
              py: 1.5,
              borderRadius: 2
            }}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
            sx={{ 
              fontWeight: 'bold',
              px: 3,
              py: 1.5,
              borderRadius: 2
            }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AccessDenied; 