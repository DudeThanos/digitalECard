import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useViewport from './hooks/useViewport';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';
import PermissionRoute from './components/PermissionRoute';
import CardView from './pages/CardView';
import Dashboard from './pages/Dashboard';
import SingleCardCreate from './pages/SingleCardCreate';
import AdminEditCard from './pages/AdminEditCard';
import AdminDeleteCard from './pages/AdminDeleteCard';
import BulkUpload from './pages/BulkUpload';
import ViewAllCards from './pages/ViewAllCards';
import CompanyMaster from './pages/CompanyMaster';
import ChangePassword from './pages/ChangePassword';
import AdminResetPassword from './pages/AdminResetPassword';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BackupSettings from './pages/BackupSettings';
import SuperuserAdminManagement from './pages/SuperuserAdminManagement';
import SuperuserRoute from './components/SuperuserRoute';
import EnterTotp from './pages/EnterTotp';
import SetupTotp from './pages/SetupTotp';
import SuperuserAuditLog from './pages/SuperuserAuditLog';
import SuperuserAdminLogs from './pages/SuperuserAdminLogs';
import AccessDenied from './pages/AccessDenied';
import ShareIcon from '@mui/icons-material/Share';
import Snackbar from '@mui/material/Snackbar';
import AddIcon from '@mui/icons-material/Add';
import ThrowawayCardCreate from './pages/ThrowawayCardCreate';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PrintIcon from '@mui/icons-material/Print';

// Custom theme with red accent, black, and white colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#AC212F', // Primary red
      light: '#C73A4A',
      dark: '#8A1A25',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#DB5D04', // Secondary orange
      light: '#E67E22',
      dark: '#B84A03',
      contrastText: '#ffffff',
    },
    success: {
      main: '#34C969', // Green for success states
      light: '#4CDB7A',
      dark: '#2BA555',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#000000',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Century Gothic Regular',
      'Century Gothic',
    ].join(','),
          h1: {
        fontFamily: 'Century Gothic Bold, Century Gothic Regular, Century Gothic, regular',
        fontWeight: 'bold',
      },
      h2: {
        fontFamily: 'Century Gothic Bold, Century Gothic Regular, Century Gothic, regular',
        fontWeight: 'bold',
      },
      h3: {
        fontFamily: 'Century Gothic Bold, Century Gothic Regular, Century Gothic, regular',
        fontWeight: 'bold',
      },
      h4: {
        fontFamily: 'Century Gothic Bold, Century Gothic Regular, Century Gothic, regular',
        fontWeight: 'bold',
      },
      h5: {
        fontFamily: 'Century Gothic Bold, Century Gothic Regular, Century Gothic, regular',
        fontWeight: 'bold',
      },
      h6: {
        fontFamily: 'Century Gothic Bold, Century Gothic Regular, Century Gothic, regular',
        fontWeight: 'bold',
      },
      body1: {
        fontFamily: 'Century Gothic Regular, regular',
      },
      body2: {
        fontFamily: 'Century Gothic Regular, regular',
      },
      button: {
        fontFamily: 'Century Gothic, Century Gothic Regular, regular',
        fontWeight: 'bold',
      },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          color: '#ffffff',
          backgroundColor: '#AC212F',
          '&:hover': {
            backgroundColor: '#8A1A25',
        },
        },
        outlined: {
          color: '#AC212F',
          borderColor: '#AC212F',
          '&:hover': {
            backgroundColor: '#AC212F',
            color: '#ffffff',
          },
        },
        text: {
          color: '#AC212F',
          '&:hover': {
            backgroundColor: 'rgba(172, 33, 47, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#ffffff',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

function NavigationBar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();
  let userRaw = localStorage.getItem('user');
  if (!userRaw || userRaw === 'undefined') userRaw = '{}';
  const user = JSON.parse(userRaw);
  const isAdmin = user.role === 'admin' || user.role === 'superuser';
  const viewport = useViewport();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Detect if on card view route
  const isCardView = window.location.pathname.startsWith('/card/');
  const isCreateThrowaway = window.location.pathname.startsWith('/create-throwaway');
  const isDashboard = window.location.pathname === '/dashboard';
  const cardLink = window.location.href;
  const handleCreate = () => {
    navigate('/create-throwaway');
  };
  const handleMyCard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.employee_code) {
      navigate(`/card/${user.employee_code}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share && /Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)) {
      // Mobile: Use Web Share API if available
      try {
        await navigator.share({
          title: 'Kaynes Digital Card',
          text: 'View this digital card',
          url: cardLink,
        });
        setShareMsg('Shared!');
      } catch {
        setShareMsg('Share cancelled.');
      }
    } else {
      // Desktop or fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(cardLink);
        setShareMsg('Link copied!');
      } catch {
        setShareMsg('Failed to copy link.');
      }
    }
    setShareOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/');
  };

  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  // Save card to localStorage for offline access (mobile only)
  const handleSaveToHome = () => {
    if (isCardView && isMobile) {
      // Try to get the card data from the CardView localStorage key
      const code = window.location.pathname.split('/card/')[1];
      // If CardView already saved, just show snackbar
      if (localStorage.getItem(`offline_card_${code}`)) {
        setShowSavedMsg(true);
        return;
      }
      // Otherwise, try to fetch and save
      fetch(`/api/card/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.card) {
            localStorage.setItem(`offline_card_${code}`, JSON.stringify(data.card));
            setShowSavedMsg(true);
          }
        });
    }
  };

  const handlePrint = () => {
    if (isCardView) {
      // Hide navbar and other elements for printing
      const navbar = document.querySelector('.MuiAppBar-root');
      const footer = document.querySelector('footer');
      const snackbars = document.querySelectorAll('.MuiSnackbar-root');
      
      if (navbar) navbar.style.display = 'none';
      if (footer) footer.style.display = 'none';
      snackbars.forEach(snackbar => {
        if (snackbar) snackbar.style.display = 'none';
      });

      // Print the page
      window.print();

      // Restore elements after printing
      setTimeout(() => {
        if (navbar) navbar.style.display = 'flex';
        if (footer) footer.style.display = 'block';
        snackbars.forEach(snackbar => {
          if (snackbar) snackbar.style.display = 'block';
        });
      }, 1000);
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ py: 0.5 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <img 
            src="/logo.svg" 
            alt="Kaynes Digital Card" 
            style={{ 
              height: 45, 
              width: 'auto', 
              marginRight: 12,
              cursor: 'pointer'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            onClick={() => window.location.reload()}
          />
        </Box>
        
        <Typography variant="h5" component="div" sx={{ 
          flexGrow: 1, 
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
          display: { xs: 'none', sm: 'block' }
        }}>
          {/* Kaynes Digital Card */}
        </Typography>
        {isLoggedIn ? (
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, ml: 'auto', alignItems: 'center' }}>
            {/* Create button always visible on mobile */}
            {isMobile && (
              <Button
                color="inherit"
                onClick={handleCreate}
                sx={{
                  borderRadius: '50%',
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  px: 0,
                  py: 0,
                  backgroundColor: '#ffffff',
                  color: '#AC212F',
                  mr: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    backgroundColor: '#34C969',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                  }
                }}
                title="Create"
              >
                <AddIcon sx={{ fontSize: 22 }} />
              </Button>
            )}
            {/* Share button always visible on mobile, to the left of hamburger */}
            {isCardView && isMobile && (
              <Button
                color="inherit"
                onClick={handleShare}
                sx={{
                  borderRadius: '50%',
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  px: 0,
                  py: 0,
                  backgroundColor: '#ffffff',
                  color: '#AC212F',
                  mr: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    backgroundColor: '#34C969',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                  }
                }}
                title="Share"
              >
                <ShareIcon sx={{ fontSize: 22 }} />
              </Button>
            )}

            {/* Hamburger menu for mobile, now at far right */}
            {viewport.isMobile && (
              <>
                <Button
                  color="inherit"
                  onClick={() => setDrawerOpen(open => !open)}
                  sx={{ 
                    borderRadius: '50%', 
                    minWidth: 40, 
                    width: 40, 
                    height: 40, 
                    px: 0, 
                    py: 0, 
                    backgroundColor: '#ffffff', 
                    color: '#AC212F', 
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      backgroundColor: '#34C969',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                    } 
                  }}
                  title="Menu"
                >
                  <MenuIcon sx={{ fontSize: 26 }} />
                </Button>
                <Drawer 
                  anchor="right" 
                  open={drawerOpen} 
                  onClose={() => setDrawerOpen(false)}
                  sx={{
                    '& .MuiDrawer-paper': {
                      zIndex: (theme) => theme.zIndex.drawer + 2,
                      marginTop: '64px', // Account for fixed navbar
                      height: 'calc(100vh - 64px)', // Adjust height
                      top: 0,
                    }
                  }}
                >
                  <List sx={{ width: 220, pt: 2 }}>
                    {isCreateThrowaway && (
                      <ListItem button onClick={() => { setDrawerOpen(false); handleMyCard(); }}>
                        <ListItemIcon><ContactPageIcon /></ListItemIcon>
                        <ListItemText primary="My Card" />
                      </ListItem>
                    )}
                    <ListItem button onClick={() => { setDrawerOpen(false); handleCreate(); }}>
                      <ListItemIcon><AddIcon /></ListItemIcon>
                      <ListItemText primary="Create" />
                    </ListItem>
                    {isCardView && (
                      <ListItem button onClick={() => { setDrawerOpen(false); handleShare(); }}>
                        <ListItemIcon><ShareIcon /></ListItemIcon>
                        <ListItemText primary="Share" />
                      </ListItem>
                    )}
                    {isCardView && (
                      <ListItem button onClick={() => { setDrawerOpen(false); handleSaveToHome(); }}>
                        <ListItemIcon><AddToHomeScreenIcon /></ListItemIcon>
                        <ListItemText primary="Save to Home" />
                      </ListItem>
                    )}
                    {isCardView && isAdmin && (
                      <ListItem button onClick={() => { setDrawerOpen(false); handlePrint(); }}>
                        <ListItemIcon><PrintIcon /></ListItemIcon>
                        <ListItemText primary="Print Card" />
                      </ListItem>
                    )}
                    {isAdmin && !isDashboard && (
                      <ListItem button component={Link} to="/dashboard" onClick={() => setDrawerOpen(false)}>
                        <ListItemIcon><DashboardIcon /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                      </ListItem>
                    )}
                    <ListItem button onClick={() => { setDrawerOpen(false); handleLogout(); }}>
                      <ListItemIcon><PowerSettingsNewIcon /></ListItemIcon>
                      <ListItemText primary="Logout" />
                    </ListItem>
                  </List>
                </Drawer>
              </>
            )}
            {/* Desktop view: show all buttons as before */}
            {!viewport.isMobile && (
              <>
                {isCreateThrowaway && (
                  <Button
                    color="inherit"
                    onClick={handleMyCard}
                    sx={{ 
                      borderRadius: 3, 
                      px: 2, 
                      py: 1, 
                      fontWeight: 'bold', 
                      backgroundColor: '#ffffff', 
                      color: '#AC212F', 
                      mx: 1, 
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        backgroundColor: '#34C969',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                      } 
                    }}
                  >
                    MY CARD
                  </Button>
                )}
                <Button
                  color="inherit"
                  onClick={handleCreate}
                  sx={{ 
                    borderRadius: 3, 
                    px: 2, 
                    py: 1, 
                    fontWeight: 'bold', 
                    backgroundColor: '#ffffff', 
                    color: '#AC212F', 
                    mx: 1, 
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      backgroundColor: '#34C969',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                    } 
                  }}
                >
                  CREATE
                </Button>
                {isCardView && (
                  <Button
                    color="inherit"
                    onClick={handleShare}
                    sx={{ 
                      borderRadius: 3, 
                      px: 2, 
                      py: 1, 
                      fontWeight: 'bold', 
                      backgroundColor: '#ffffff', 
                      color: '#AC212F', 
                      mx: 1, 
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        backgroundColor: '#34C969',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                      } 
                    }}
                  >
                    <ShareIcon sx={{ mr: 1 }} />Share
                  </Button>
                )}
                {isCardView && isAdmin && (
                  <Button
                    color="inherit"
                    onClick={handlePrint}
                    sx={{ 
                      borderRadius: 3, 
                      px: 2, 
                      py: 1, 
                      fontWeight: 'bold', 
                      backgroundColor: '#ffffff', 
                      color: '#AC212F', 
                      mx: 1, 
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        backgroundColor: '#34C969',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                      } 
                    }}
                  >
                    <PrintIcon sx={{ mr: 1 }} />Print
                  </Button>
                )}
                {isAdmin && !isDashboard && (
                  <Button
                    color="inherit"
                    component={Link}
                    to="/dashboard"
                    sx={{ 
                      borderRadius: 3, 
                      px: 2, 
                      py: 1, 
                      fontWeight: 'bold', 
                      backgroundColor: '#ffffff', 
                      color: '#AC212F', 
                      mx: 1, 
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        backgroundColor: '#34C969',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                      } 
                    }}
                  >
                    Dashboard
                  </Button>
                )}
                <Button
                  color="inherit"
                  onClick={handleLogout}
                  sx={{ 
                    borderRadius: 3, 
                    px: 2, 
                    py: 1, 
                    fontWeight: 'bold', 
                    backgroundColor: '#ffffff', 
                    color: '#AC212F', 
                    mx: 1, 
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      backgroundColor: '#34C969',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 20px rgba(52, 201, 105, 0.3)'
                    } 
                  }}
                >
                  LOGOUT
                </Button>
              </>
            )}
          </Box>
        ) : null}
      </Toolbar>
      <Snackbar
        open={shareOpen}
        autoHideDuration={2000}
        onClose={() => setShareOpen(false)}
        message={shareMsg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            marginTop: `${theme.mixins.toolbar.minHeight + 8}px`,
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            fontWeight: 'bold'
          }
        }}
      />
      <Snackbar
        open={showSavedMsg}
        autoHideDuration={3000}
        onClose={() => setShowSavedMsg(false)}
        message="Card saved for offline access! Add to Home Screen from browser menu."
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            marginTop: `${theme.mixins.toolbar.minHeight + 8}px`,
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            fontWeight: 'bold'
          }
        }}
      />
    </AppBar>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setMustChangePassword(!!user.must_change_password);
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMustChangePassword(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setMustChangePassword(!!user.must_change_password);
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <NavigationBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
          {/* Add top margin to account for fixed navbar */}
          <Box sx={{ 
            mt: { xs: 8, sm: 9, md: 10 }, 
            minHeight: 'calc(100vh - 80px)'
          }}>
            <Routes>
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/create-throwaway" element={<RequireAuth><ThrowawayCardCreate /></RequireAuth>} />
              {mustChangePassword ? (
                <Route path="*" element={<ChangePassword />} />
              ) : (
                <>
                  <Route path="/" element={<Login onLogin={handleLogin} />} />
                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/bulkupload" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/bulk-upload">
                        <BulkUpload />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/singlecard" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/single-card">
                        <SingleCardCreate />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/admin/edit" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/edit-any-card">
                        <AdminEditCard />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/admin/delete" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/delete-any-card">
                        <AdminDeleteCard />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/dashboard/cards" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/view-all-cards">
                        <ViewAllCards />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/company/master" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/company-master">
                        <CompanyMaster />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/admin/reset-password" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/reset-user-password">
                        <AdminResetPassword />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/admin/backup-settings" element={
                    <RequireAuth>
                      <PermissionRoute permissionEndpoint="/api/auth/permission/backup-settings">
                        <BackupSettings />
                      </PermissionRoute>
                    </RequireAuth>
                  } />
                  <Route path="/su/admins" element={<SuperuserRoute><SuperuserAdminManagement /></SuperuserRoute>} />
                  <Route path="/su/audit-log" element={<SuperuserRoute><SuperuserAuditLog /></SuperuserRoute>} />
                  <Route path="/su/admin-logs" element={<SuperuserRoute><SuperuserAdminLogs /></SuperuserRoute>} />
                  <Route path="/access-denied" element={<AccessDenied />} />
                  <Route path="/card/:employee_code" element={<CardView />} />
                  <Route path="/enter-totp" element={<EnterTotp onLogin={handleLogin} />} />
                  <Route path="/setup-totp" element={<SetupTotp onLogin={handleLogin} />} />
                </>
              )}
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
