import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useViewport from '../hooks/useViewport';

const Footer = ({ showDeveloper = false }) => {
  const theme = useTheme();
  const viewport = useViewport();

  return (
    <Box sx={{
      backgroundColor: '#000000',
      borderTop: `1px solid #AC212F`,
      py: viewport.isMobile ? 1 : 1.5,
      px: 2,
      textAlign: 'center',
      mt: 'auto',
      position: 'relative',
      zIndex: 3 // Ensure footer appears above background overlay
    }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: viewport.isMobile ? '0.7rem' : '0.8rem',
          fontWeight: 300,
          letterSpacing: '0.5px'
        }}
      >
        © Kaynes Technology India Limited
        {showDeveloper && (
          <span style={{ marginLeft: '10px', opacity: 0.7, color: 'rgba(255, 255, 255, 0.8)' }}>
            • Developed by Avishek
          </span>
        )}
      </Typography>
    </Box>
  );
};

export default Footer; 