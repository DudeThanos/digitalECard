import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import useViewport from '../hooks/useViewport';
import Footer from '../components/Footer';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import TextField from '@mui/material/TextField';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const theme = useTheme();
  const viewport = useViewport();
  const isSuperuser = user.role === 'superuser';
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Fetch latest user/admin info from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        // Use a generic endpoint for current user info (adjust as needed)
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (e) {
        // fallback: do nothing
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleResetDb = async () => {
    setResetting(true);
    setResetError('');
    try {
      const token = localStorage.getItem('token');
      
      // First, check if backup is enabled and perform backup if so
      try {
        const backupRes = await fetch('/api/csv/backup-config', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (backupRes.ok) {
          const backupConfig = await backupRes.json();
          if (backupConfig.backupDir) {
            // Perform backup before reset
            const backupApiRes = await fetch('/api/csv/backup', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (backupApiRes.ok) {
              const backupData = await backupApiRes.json();
              console.log('Backup completed successfully before reset:', backupData.file);
            } else {
              console.warn('Backup failed before reset, but continuing with reset...');
            }
          }
        }
      } catch (backupErr) {
        console.warn('Could not perform backup before reset:', backupErr);
        // Continue with reset even if backup fails
      }
      
      // Now proceed with database reset
      const res = await fetch('/api/auth/su/reset-db', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: resetPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResetError(data.message || 'Failed to reset database.');
        setResetting(false);
        return;
      }
      setResetDialogOpen(false);
      setResetSuccess(true);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setResetError('Failed to reset database.');
    } finally {
      setResetting(false);
      setResetPassword('');
    }
  };

  // Map dashboard features to permission keys
  const FEATURE_PERMISSIONS = {
    '📊 Bulk CSV Upload': 'bulk_upload',
    '➕ Single Card Creation': 'single_card',
    '👥 View All Cards': 'view_all_cards',
    '✏️ Edit Any Card': 'edit_any_card',
    '🗑️ Delete Any Card': 'delete_any_card',
    '🏢 Company Master': 'company_master',
    '🔑 Reset User Password': 'reset_user_password',
    '🗄️ Backup Settings': 'backup_settings',
    '👤 View My Card': null, // always show
    '🚪 Logout': null // always show
  };

  return (
    <>
            <Box sx={{
        minHeight: '100vh',
        backgroundImage: 'url(/dashboard.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginTop: '-64px', // Start background behind navbar
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingTop: { xs: 9, sm: 2, md: 2 },
        boxSizing: 'border-box',
        overflow: { xs: 'auto', sm: 'hidden' }, // Allow scrolling on mobile only
        minHeight: { xs: 'auto', sm: '100vh' }, // Allow content to expand on mobile
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(72, 72, 72, 0.38)',
          zIndex: 1,
        }
      }}>
      <Box sx={{
        width: '100%',
        maxWidth: viewport.isMobile ? '100%' : (isSuperuser ? '1200px' : '700px'),
        boxShadow: isSuperuser ? 'none' : '0 25px 50px rgba(0,0,0,0.3)',
        borderRadius: isSuperuser ? 0 : 6,
        backgroundColor: isSuperuser ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        border: isSuperuser ? 'none' : `2px solid ${theme.palette.primary.main}`,
        position: 'relative',
        zIndex: 2,
        backdropFilter: 'blur(20px)',
        transform: 'translateY(0)',
        transition: 'all 0.3s ease',
        p: viewport.isMobile ? 1 : (isSuperuser ? 4 : 3),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxHeight: { xs: 'none', md: 'calc(90vh - 120px)' },
        overflow: { xs: 'auto', sm: 'hidden' },
        my: { xs: 0, sm: 2, md: 4 }, // Add vertical margin for better centering
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%', justifyContent: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexDirection: viewport.isMobile ? 'column' : 'row',
            gap: viewport.isMobile ? 1 : 0
          }}>
            {!viewport.isMobile && (
              <Box
                component="img"
                src="/business-card.png"
                alt="Business Card"
                sx={{ 
                  width: 45, 
                  height: 45, 
                  mr: 3,
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            )}
            {viewport.isMobile ? (
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <Box
                    component="img"
                    src="/business-card.png"
                    alt="Business Card"
                    sx={{ 
                      width: 30, 
                      height: 30, 
                      mr: 1,
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#000000', 
                      fontWeight: 'bold', 
                      letterSpacing: '0.5px'
                    }}
                  >
                    Kaynes
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: '#000000', 
                    fontWeight: 'bold', 
                    letterSpacing: '0.5px'
                  }}
                >
                  Digital Card
                </Typography>
              </Box>
            ) : (
              <Typography 
                variant="h3" 
                sx={{ 
                  color: '#000000', 
                  fontWeight: 'bold', 
                  letterSpacing: '0.5px',
                  textAlign: 'center'
                }}
              >
              {isSuperuser ? 'Superuser Dashboard' : 'Kaynes Digital Card'}
            </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="h5" mb={3} sx={{ color: theme.palette.primary.light, textAlign: 'center', fontStyle: 'italic', fontWeight: 300 }}>
          Hello, {user.name || user.email || 'Administrator'}
        </Typography>
        {viewport.isMobile ? (
          <Stack spacing={2}>
            {/* Superuser mobile restriction */}
            {isSuperuser && viewport.isMobile ? (
              <>
                <Alert severity="warning" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                  Superuser mode not allowed from mobile devices, please login from desktop.
                </Alert>
                <Button 
                  variant="contained" 
                  onClick={handleLogout} 
                  sx={{ 
                    py: 1.5, 
                    px: 2, 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold', 
                    borderRadius: 4,
                    backgroundColor: '#AC212F',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#DB5D04',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 30px rgba(219, 93, 4, 0.4)'
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  🚪 Logout
                </Button>
              </>
            ) : (
              <>
                {/* Superuser-only features (desktop only) */}
                {isSuperuser && !viewport.isMobile && (
              <>
                <Button variant="contained" onClick={() => navigate('/su/audit-log')} sx={{ py: 1.5, px: 2, fontSize: '0.9rem', fontWeight: 'bold', borderRadius: 4, backgroundColor: theme.palette.primary.main, '&:hover': { backgroundColor: theme.palette.secondary.main, transform: 'translateY(-3px)', boxShadow: '0 10px 30px rgba(219, 93, 4, 0.3)' }, transition: 'all 0.3s ease', }}>📝 View SU Audit Logs</Button>
                <Button variant="contained" onClick={() => navigate('/su/admin-logs')} sx={{ py: 1.5, px: 2, fontSize: '0.9rem', fontWeight: 'bold', borderRadius: 4, backgroundColor: theme.palette.primary.main, '&:hover': { backgroundColor: theme.palette.secondary.main, transform: 'translateY(-3px)', boxShadow: '0 10px 30px rgba(219, 93, 4, 0.3)' }, transition: 'all 0.3s ease', }}>📋 View Admin Logs</Button>
                <Button variant="contained" onClick={() => navigate('/su/admins')} sx={{ py: 1.5, px: 2, fontSize: '0.9rem', fontWeight: 'bold', borderRadius: 4, backgroundColor: theme.palette.primary.main, '&:hover': { backgroundColor: theme.palette.secondary.main, transform: 'translateY(-3px)', boxShadow: '0 10px 30px rgba(219, 93, 4, 0.3)' }, transition: 'all 0.3s ease', }}>🛡️ Admin Permissions</Button>
                <Button variant="contained" onClick={() => setResetDialogOpen(true)} sx={{ py: 1.5, px: 2, fontSize: '0.9rem', fontWeight: 'bold', borderRadius: 4, boxShadow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeleteForeverIcon sx={{ fontSize: 22 }} /> Reset Database
                </Button>
              </>
            )}
            {/* Conditionally render admin feature buttons by permission */}
            {[
              { label: '📊 Bulk CSV Upload', onClick: () => navigate('/bulkupload') },
              { label: '➕ Single Card Creation', onClick: () => navigate('/singlecard') },
              { label: '👥 View All Cards', onClick: () => navigate('/dashboard/cards') },
              { label: '✏️ Edit Any Card', onClick: () => navigate('/admin/edit') },
              { label: '🗑️ Delete Any Card', onClick: () => navigate('/admin/delete') },
              { label: '🏢 Company Master', onClick: () => navigate('/company/master') },
              { label: '🔑 Reset User Password', onClick: () => navigate('/admin/reset-password') },
              { label: '🗄️ Backup Settings', onClick: () => navigate('/admin/backup-settings') },
              { label: '👤 View My Card', onClick: () => navigate(`/card/${user.employee_code}`), variant: 'contained', red: true },
              { label: '🚪 Logout', onClick: handleLogout, variant: 'contained', red: true }
            ].filter(btn => {
                  // Hide "View My Card" and "Logout" for superusers
                  if (isSuperuser && (btn.label.includes('View My Card') || btn.label.includes('Logout'))) {
                    return false;
                  }
              if (isSuperuser) return true;
              const permKey = FEATURE_PERMISSIONS[btn.label];
              if (!permKey) return true; // always show if no permission required
              return user.permissions && user.permissions[permKey];
            })
            .map((btn, idx) => (
              <Button
                key={btn.label}
                variant={btn.variant || 'contained'}
                onClick={btn.onClick}
                sx={{
                  py: 1.5, px: 2, fontSize: '0.9rem', fontWeight: 'bold', borderRadius: 4,
                  backgroundColor: btn.red ? '#AC212F' : (btn.variant === 'outlined' ? 'transparent' : '#000000'),
                  color: '#ffffff',
                  borderColor: btn.variant === 'outlined' ? '#000000' : undefined,
                  borderWidth: btn.variant === 'outlined' ? 2 : undefined,
                  boxShadow: 1,
                  display: 'flex', alignItems: 'center', gap: 1,
                  '&:hover': {
                    backgroundColor: btn.orange ? '#DB5D04' : '#DB5D04',
                    color: '#ffffff',
                    borderColor: btn.variant === 'outlined' ? '#DB5D04' : undefined,
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 30px rgba(219, 93, 4, 0.4)'
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                    {btn.label}
              </Button>
            ))}
              </>
            )}
          </Stack>
        ) : (
          <Grid container spacing={isSuperuser ? 2 : 3} sx={{ width: '100%', m: 0 }}>
            {/* Superuser-only features */}
            {isSuperuser && (
              <>
                <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button fullWidth variant="contained" onClick={() => navigate('/su/audit-log')} sx={{ 
                    minHeight: isSuperuser ? 50 : 64, 
                    maxWidth: isSuperuser ? 280 : 320, 
                    fontSize: isSuperuser ? '0.9rem' : '1.1rem', 
                    fontWeight: 'bold', 
                    borderRadius: 4, 
                    backgroundColor: '#000000', 
                    color: '#ffffff', 
                    boxShadow: 2, 
                    '&:hover': { backgroundColor: '#AC212F', color: '#ffffff', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(172, 33, 47, 0.3)' }, 
                    transition: 'all 0.2s ease' 
                  }}>
                    📝 View SU Audit Logs
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button fullWidth variant="contained" onClick={() => navigate('/su/admin-logs')} sx={{ 
                    minHeight: isSuperuser ? 50 : 64, 
                    maxWidth: isSuperuser ? 280 : 320, 
                    fontSize: isSuperuser ? '0.9rem' : '1.1rem', 
                    fontWeight: 'bold', 
                    borderRadius: 4, 
                    backgroundColor: '#000000', 
                    color: '#ffffff', 
                    boxShadow: 2, 
                    '&:hover': { backgroundColor: '#AC212F', color: '#ffffff', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(172, 33, 47, 0.3)' }, 
                    transition: 'all 0.2s ease' 
                  }}>
                    📋 View Admin Logs
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button fullWidth variant="contained" onClick={() => navigate('/su/admins')} sx={{ 
                    minHeight: isSuperuser ? 50 : 64, 
                    maxWidth: isSuperuser ? 280 : 320, 
                    fontSize: isSuperuser ? '0.9rem' : '1.1rem', 
                    fontWeight: 'bold', 
                    borderRadius: 4, 
                    backgroundColor: '#000000', 
                    color: '#ffffff', 
                    boxShadow: 2, 
                    '&:hover': { backgroundColor: '#AC212F', color: '#ffffff', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(172, 33, 47, 0.3)' }, 
                    transition: 'all 0.2s ease' 
                  }}>
                    🛡️ Admin Permissions
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button fullWidth variant="contained" onClick={() => setResetDialogOpen(true)} sx={{ 
                    minHeight: isSuperuser ? 50 : 64, 
                    maxWidth: isSuperuser ? 280 : 320, 
                    fontSize: isSuperuser ? '0.9rem' : '1.1rem', 
                    fontWeight: 'bold', 
                    borderRadius: 4, 
                    boxShadow: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1 
                  }}>
                    <DeleteForeverIcon sx={{ fontSize: isSuperuser ? 18 : 22 }} /> Reset Database
                  </Button>
                </Grid>
              </>
            )}
            {/* Conditionally render admin feature buttons by permission */}
            {[
              { label: '📊 Bulk CSV Upload', onClick: () => navigate('/bulkupload') },
              { label: '➕ Single Card Creation', onClick: () => navigate('/singlecard') },
              { label: '👥 View All Cards', onClick: () => navigate('/dashboard/cards') },
              { label: '✏️ Edit Any Card', onClick: () => navigate('/admin/edit') },
              { label: '🗑️ Delete Any Card', onClick: () => navigate('/admin/delete') },
              { label: '🏢 Company Master', onClick: () => navigate('/company/master') },
              { label: '🔑 Reset User Password', onClick: () => navigate('/admin/reset-password') },
              { label: '🗄️ Backup Settings', onClick: () => navigate('/admin/backup-settings') },
              { label: '👤 View My Card', onClick: () => navigate(`/card/${user.employee_code}`), variant: 'contained', red: true },
              { label: '🚪 Logout', onClick: handleLogout, variant: 'contained', red: true }
            ].filter(btn => {
              if (isSuperuser) return true;
              const permKey = FEATURE_PERMISSIONS[btn.label];
              if (!permKey) return true; // always show if no permission required
              return user.permissions && user.permissions[permKey];
            })
            .map((btn, idx) => (
              <Grid item xs={12} sm={6} md={isSuperuser ? 4 : 6} key={btn.label} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  fullWidth
                  variant={btn.variant || 'contained'}
                  onClick={btn.onClick}
                  sx={{
                    minHeight: isSuperuser ? 50 : 64,
                    maxWidth: isSuperuser ? 280 : 320,
                    fontSize: isSuperuser ? '0.9rem' : '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 4,
                    backgroundColor: btn.red ? '#AC212F' : (btn.variant === 'outlined' ? 'transparent' : '#000000'),
                    color: '#ffffff',
                    borderColor: btn.variant === 'outlined' ? '#000000' : undefined,
                    borderWidth: btn.variant === 'outlined' ? 2 : undefined,
                    boxShadow: 2,
                    display: 'flex', alignItems: 'center', gap: 1,
                    '&:hover': {
                      backgroundColor: btn.orange ? '#DB5D04' : '#DB5D04',
                      color: '#ffffff',
                      borderColor: btn.variant === 'outlined' ? '#DB5D04' : undefined,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 18px rgba(219, 93, 4, 0.3)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {btn.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={resetDialogOpen} onClose={() => { setResetDialogOpen(false); setResetPassword(''); setResetError(''); }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Confirm Database Reset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will <b>delete all card and admin data</b> from the database. <br/>
            <b>This action cannot be undone.</b> The superuser account will remain.<br/><br/>
            <b>Note:</b> If backup settings are configured, an automatic backup will be created before the reset.<br/><br/>
            Please enter your password to confirm.
          </DialogContentText>
          <TextField
            label="Superuser Password"
            type="password"
            fullWidth
            margin="normal"
            value={resetPassword}
            onChange={e => setResetPassword(e.target.value)}
            disabled={resetting}
            autoFocus
          />
          {resetError && <Alert severity="error" sx={{ mt: 1 }}>{resetError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setResetDialogOpen(false); setResetPassword(''); setResetError(''); }} disabled={resetting}>Cancel</Button>
          <Button onClick={handleResetDb} color="error" variant="contained" disabled={resetting || !resetPassword} sx={{ fontWeight: 'bold' }}>Yes, Reset</Button>
        </DialogActions>
      </Dialog>
      {resetSuccess && (
        <Box sx={{ position: 'fixed', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1300 }}>
          <Alert severity="success" sx={{ minWidth: 300, fontWeight: 'bold' }}>Database reset successful! Reloading...</Alert>
        </Box>
      )}
    </Box>
    <Footer showDeveloper={true} />
    </>
  );
};

export default Dashboard; 