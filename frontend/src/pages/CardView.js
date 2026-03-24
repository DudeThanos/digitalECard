import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import EditIcon from '@mui/icons-material/Edit';
import useViewport from '../hooks/useViewport';
import Footer from '../components/Footer';
import ShareIcon from '@mui/icons-material/Share';
import Snackbar from '@mui/material/Snackbar';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';
import pwaService from '../services/pwaService';

const API_BASE = '/api';

// Add print styles to the document head
const addPrintStyles = () => {
  if (document.getElementById('print-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.textContent = `
    @media print {
      /* Reset body for printing */
      body {
        margin: 0 !important;
        padding: 0 !important;
        height: 100vh !important;
        overflow: hidden !important;
      }
      
      /* Hide all elements except the card */
      body * {
        visibility: hidden;
      }
      
      /* Show only the card container */
      .print-card-container {
        visibility: visible !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 480px !important;
        height: 300px !important;
        margin: 0 !important;
        padding: 24px !important;
        background: white !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
      }
      
      /* Ensure card content is visible */
      .print-card-container * {
        visibility: visible !important;
      }
      
      /* Remove background image for printing */
      .print-card-container {
        background-image: none !important;
      }
      
      /* Ensure proper page setup */
      @page {
        margin: 0.5in;
        size: A4;
      }
      
      /* Force single page layout */
      .print-card-container {
        max-width: 100% !important;
        max-height: 100% !important;
      }
      
      /* Hide any remaining UI elements */
      .MuiAppBar-root,
      footer,
      .MuiSnackbar-root {
        display: none !important;
      }
      
      /* Ensure no page breaks within the card */
      .print-card-container,
      .print-card-container * {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Prevent any additional content from creating pages */
      html {
        height: 100% !important;
        overflow: hidden !important;
      }
    }
  `;
  document.head.appendChild(style);
};

const CardView = () => {
  const { employee_code } = useParams();
  const [card, setCard] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef();
  const theme = useTheme();
  const viewport = useViewport();
  const [lastEditorName, setLastEditorName] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false);
  const [offline, setOffline] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);

  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!token;
  const isOwner = isAuthenticated && user.employee_code === employee_code;
  const isAdmin = isAuthenticated && user.role === 'admin';
  const isSuperuser = user.role === 'superuser';

  // Get employee_code from localStorage if not in URL
  const code = employee_code || user.employee_code;

  // Determine if this is an external series card
  const isExternal = card && card.employee_code && card.employee_code.startsWith('EX-THP-');

  const fetchCard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/card/${code}`);
      setCard(res.data.card);
      setForm(res.data.card);
      setQrUrl(`${API_BASE}/card/${code}/qrcode`);
      // Save to localStorage for offline access
      if (isMobile) {
        localStorage.setItem(`offline_card_${code}`, JSON.stringify(res.data.card));
      }
      setOffline(false);
      // Fetch last editor name if last_edited_by is present and not a name
      if (res.data.card.last_edited_by && res.data.card.last_edited_by.startsWith('hr-emp-')) {
        try {
          const editorRes = await axios.get(`${API_BASE}/card/${res.data.card.last_edited_by}`);
          setLastEditorName(editorRes.data.card.name || res.data.card.last_edited_by);
        } catch {
          setLastEditorName(res.data.card.last_edited_by);
        }
      } else if (res.data.card.last_edited_by) {
        setLastEditorName(res.data.card.last_edited_by);
      } else {
        setLastEditorName('');
      }
      // Show photo prompt if user is viewing their own card and has no photo_url
      if (res.data.card && isOwner && !res.data.card.photo_url) {
        setShowPhotoPrompt(true);
      } else {
        setShowPhotoPrompt(false);
      }
      setLoading(false);
    } catch (err) {
      // If offline or fetch fails, try localStorage
      const saved = localStorage.getItem(`offline_card_${code}`);
      if (saved) {
        setCard(JSON.parse(saved));
        setForm(JSON.parse(saved));
        setOffline(true);
      } else {
        setError('Could not load card data');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
    addPrintStyles();
    // eslint-disable-next-line
  }, [code]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    // Only allow edit if authenticated and is owner or admin
    if (!isAuthenticated) {
      setError('Please login to edit this card');
      return;
    }
    if (!isOwner && !isAdmin) {
      setError('You can only edit your own card');
      return;
    }
    setEdit(true);
    setSuccess('');
    setError('');
  };



  const handleCancel = () => {
    setEdit(false);
    setForm(card);
    setPhotoFile(null);
    setSuccess('');
    setError('');
  };

  const handlePhotoChange = e => {
    if (e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      let photo_url = form.photo_url;
      // If new photo selected, upload it
      if (photoFile) {
        const data = new FormData();
        data.append('photo', photoFile);
        const uploadRes = await axios.post(`${API_BASE}/card/${code}/photo`, data, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        photo_url = uploadRes.data.photo_url;
      }
      // Update card details
      await axios.put(`${API_BASE}/card/${code}/update`, { ...form, photo_url }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowSavedMsg(true);
      setEdit(false);
      setPhotoFile(null);
      
      // Wait for snackbar to show, then reload page for QR update
      setTimeout(() => {
        window.location.reload();
      }, 2000); // 2 seconds delay to show the success message
    } catch (err) {
      setError('Failed to update card.');
    }
  };

  const handleShare = async () => {
    // Use current URL directly - no need to reconstruct
    const currentUrl = window.location.href;
    if (navigator.share && /Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)) {
      // Mobile: Use Web Share API if available
      try {
        await navigator.share({
          title: `${card.name} - Kaynes Digital Card`,
          text: `View the digital card for ${card.name}`,
          url: currentUrl,
        });
        setShareMsg('Shared!');
      } catch {
        setShareMsg('Share cancelled.');
      }
    } else {
      // Desktop or fallback: Copy to clipboard with multiple fallback methods
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(currentUrl);
          setShareMsg('Link copied!');
        } else {
          // Fallback to document.execCommand for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = currentUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            setShareMsg('Link copied!');
          } else {
            // Last resort: show URL in alert for manual copy
            alert(`Please copy this URL manually:\n\n${currentUrl}`);
            setShareMsg('URL shown in alert');
          }
        }
      } catch (error) {
        console.error('Clipboard copy failed:', error);
        // Last resort: show URL in alert for manual copy
        alert(`Please copy this URL manually:\n\n${currentUrl}`);
        setShareMsg('URL shown in alert');
      }
    }
    setShareOpen(true);
  };

  const handleSaveToHome = async () => {
    if (!card) return;
    
    try {
      const result = await pwaService.handleSaveToHome(card);
      setShowSavedMsg(true);
      
      // Show appropriate message based on result
      if (result.success) {
        setShareMsg(result.message);
        
        // If install dialog is shown, show success message
        if (result.showInstallDialog) {
          setShareMsg('📱 Install dialog opened! Click "Install Now" to add to home screen.');
          setShareOpen(true);
        }
      } else {
        setShareMsg(result.message);
      }
      setShareOpen(true);
    } catch (error) {
      console.error('Save to home failed:', error);
      setShareMsg('Failed to save card');
      setShareOpen(true);
    }
  };

  const handleRefresh = () => {
    fetchCard();
  };

  if (loading) return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/cardView.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <CircularProgress sx={{ color: 'white' }} />
    </Box>
  );
  
  if (error) return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/cardView.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <Alert severity="error" sx={{ maxWidth: 400 }}>{error}</Alert>
    </Box>
  );
  
  if (card && card.status === 'inactive' && !(isAdmin || isSuperuser)) return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/cardView.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      zIndex: 2,
    }}>
      <Box sx={{
        maxWidth: 400,
        width: '100%',
        p: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 240, 207, 0.97)',
        boxShadow: '0 8px 32px rgba(44,62,80,0.18)',
        textAlign: 'center',
        border: '2px solid #e74c3c',
      }}>
        <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 'bold', mb: 2 }}>
          Card inactive. Please contact HR or Admin.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2, fontWeight: 'bold', borderRadius: 3, px: 4, py: 1.5 }}
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location = '/';
          }}
        >
          Go to Login
        </Button>
      </Box>
    </Box>
  );
  
  if (!card) return null;

  return (
    <>
                  <Box sx={{
        minHeight: '100vh',
        backgroundImage: 'url(/cardView.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        marginTop: '-64px', // Start background behind navbar
        paddingTop: '64px', // Push content below navbar
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(172, 33, 47, 0.3)',
          zIndex: 1,
        }
      }}>
        {/* Main Card Container - Centered and Flexible */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 2,
        }}>
          <Box 
            className="print-card-container"
            sx={{ 
              width: '100%',
              maxWidth: '480px',
              height: { xs: '500px', sm: '300px' },
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)', 
              borderRadius: 3,
              backgroundColor: '#fffefa',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 4, sm: 3.5 }
            }}
          >
        {/* Show inactive status warning for admins and superuser */}
        {card && card.status === 'inactive' && (isAdmin || isSuperuser) && (
            <Alert severity="warning" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.9rem', borderRadius: 1 }}>
              This card is <b>inactive</b>.
          </Alert>
        )}
          
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{error}</Alert>}
          
          {/* Business Card Layout */}
        <Box sx={{ 
          display: { xs: 'flex', sm: 'flex' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          height: '100%',
          position: 'relative'
        }}>
          {/* Mobile Layout - Vertical Stack */}
          <Box sx={{ 
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            justifyContent: 'space-between',
            py: 2
          }}>
            {/* Logo - Centered */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3
            }}>
              <img 
                src={card.company_logo ? `${card.company_logo}` : '/logo.svg'}
                alt="Company Logo"
                style={{ 
                  width: '300px', 
                  height: '67px', 
                  objectFit: 'contain',
                  objectPosition: 'center',
                  margin: '0 0 0 8%',
                  padding: 0,
                  display: 'block'
                }}
                onError={(e) => { e.target.src = '/logo.svg'; }}
              />
            </Box>

            {/* Photo and QR Code - Side by Side, Same Size, Small Gap */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3,
              gap: 2
            }}>
              {/* Photo */}
              <Box sx={{ 
                position: 'relative',
                '&:hover .edit-icon': {
                  opacity: 1
                },
                '&:hover .overlay': {
                  opacity: 1
                }
              }}>
                <Avatar
                  src={photoFile ? URL.createObjectURL(photoFile) : 
                        (card.photo_url && card.photo_url.startsWith('/') 
                          ? `${card.photo_url}` 
                          : card.photo_url)} 
                  sx={{ 
                    width: 117, 
                    height: 117, 
                    border: '3px solid #AC212F',
                    borderRadius: '50%',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                    cursor: (isOwner || isAdmin) ? 'pointer' : 'default',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: (isOwner || isAdmin) ? 'scale(1.05)' : 'none',
                      boxShadow: (isOwner || isAdmin) ? '0 6px 20px rgba(0,0,0,0.25)' : '0 4px 15px rgba(0,0,0,0.15)',
                    }
                  }}
                  onClick={() => {
                    if ((isOwner || isAdmin) && !edit) setEdit(true);
                  }}
                />
                
                {/* Photo Upload Input for Edit Mode */}
                {edit && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 15
                    }}
                  />
                )}
                
                {/* Grey Overlay on Hover */}
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(128, 128, 128, 0.3)',
                    borderRadius: '50%',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                />
                
                {/* Edit Icon - Show on hover for authorized users */}
                {(isOwner || isAdmin) && !edit && (
                  <Box
                    className="edit-icon"
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                  >
                    <EditIcon sx={{ color: '#000', fontSize: 20 }} />
                  </Box>
                )}
              </Box>

              {/* QR Code */}
              <img src={qrUrl} alt="QR Code" style={{ 
                width: '117px', 
                height: '117px'
              }} />
            </Box>

            {/* Personal Info - Centered */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                color: '#000', 
                mb: 1,
                fontSize: '1.1rem',
                lineHeight: 1.2,
                textTransform: 'uppercase'
              }}>
                {form.name || `${form.first_name || ''} ${form.last_name || ''}`.trim()}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#000', 
                mb: 2,
                fontSize: '0.9rem',
                textTransform: 'uppercase'
              }}>
                {form.designation || 'Software Developer'} - {form.department || 'IT'}
              </Typography>
              
              {/* Contact Info with Icons - Centered, Phone First */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                {/* Phone Number */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="#000" strokeWidth="2" fill="none"/>
                      <line x1="12" y1="18" x2="12.01" y2="18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#000', fontSize: '0.8rem' }}>
                    {form.phone || 'N/A'}
                  </Typography>
                </Box>
                {/* Email */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#000" strokeWidth="2" fill="none"/>
                      <path d="M22 6L12 13L2 6" stroke="#000" strokeWidth="2" fill="none"/>
                    </svg>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#000', fontSize: '0.8rem' }}>
                    {form.email || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Company Info - Centered */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'normal', color: '#000', mb: 0.5, fontSize: '0.9rem' }}>
                {form.company || 'Kaynes Technology'}, {form.branch || 'Mysore'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.8rem', mb: 1 }}>
                {form.address || '23-25 Belagola Food Industrial Estate'}
              </Typography>
            </Box>

            {/* Website - Last Item */}
            {card.employee_code && card.employee_code.startsWith('HR-EMP-') && (
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2" fill="none"/>
                      <path d="M2 12h20" stroke="#000" strokeWidth="2"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#000" strokeWidth="2" fill="none"/>
                    </svg>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#000', fontSize: '0.8rem' }}>
                    www.kaynestechnology.co.in
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Desktop Layout - Original Horizontal Layout */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' },
            width: '100%',
            height: '100%'
          }}>
            {/* Left Side - Company Logo, Photo, and Personal Info */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '60%',
              pr: 2,
              height: '100%'
            }}>
              {/* Group: Logo + Avatar */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0
              }}>
                {/* Logo */}
                <Box sx={{ 
                  mb: 0,
                  pb: 0,
                  lineHeight: 0,
                  fontSize: 0,
                  height: 'fit-content',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <img 
                    src={card.company_logo ? `${card.company_logo}` : '/logo.svg'}
                    alt="Company Logo"
                    style={{ 
                      width: '207px', 
                      height: '46px', 
                      objectFit: 'contain',
                      objectPosition: 'left top',
                      margin: 0,
                      padding: 0,
                      display: 'block',
                      verticalAlign: 'top'
                    }}
                    onError={(e) => { e.target.src = '/logo.svg'; }}
                  />
                </Box>

                {/* Avatar */}
                <Box sx={{ 
                  position: 'relative',
                  mt: 0,
                  pt: 0,
                  '&:hover .edit-icon': {
                    opacity: 1
                  },
                  '&:hover .overlay': {
                    opacity: 1
                  }
                }}>
                  <Avatar
                    src={photoFile ? URL.createObjectURL(photoFile) : 
                          (card.photo_url && card.photo_url.startsWith('/') 
                            ? `${card.photo_url}` 
                            : card.photo_url)} 
                    sx={{ 
                      width: 88, 
                      height: 88, 
                      border: '3px solid #AC212F',
                      borderRadius: '50%',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                      cursor: (isOwner || isAdmin) ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: (isOwner || isAdmin) ? 'scale(1.05)' : 'none',
                        boxShadow: (isOwner || isAdmin) ? '0 6px 20px rgba(0,0,0,0.25)' : '0 4px 15px rgba(0,0,0,0.15)',
                      }
                    }}
                    onClick={() => {
                      if ((isOwner || isAdmin) && !edit) setEdit(true);
                    }}
                  />
                  
                  {/* Photo Upload Input for Edit Mode */}
                  {edit && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 15
                      }}
                    />
                  )}
                  
                  {/* Grey Overlay on Hover */}
                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(128, 128, 128, 0.3)',
                      borderRadius: '50%',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none',
                      zIndex: 5
                    }}
                  />
                  
                  {/* Edit Icon - Show on hover for authorized users */}
                  {(isOwner || isAdmin) && !edit && (
                    <Box
                      className="edit-icon"
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      <EditIcon sx={{ color: '#000', fontSize: 20 }} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Personal Info - Bottom aligned */}
              <Box sx={{ textAlign: 'left', mb: 0 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: '#000', 
                  mb: 0.5,
                  fontSize: '1rem',
                  lineHeight: 1.2
                }}>
                  {form.name || `${form.first_name || ''} ${form.last_name || ''}`.trim()}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#666', 
                  mb: 0.5,
                  fontSize: '0.8rem'
                }}>
                  {form.designation || 'Software Developer'} - {form.department || 'IT'}
                </Typography>
                
                {/* Contact Info with Icons */}
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      mr: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#000" strokeWidth="2" fill="none"/>
                        <path d="M22 6L12 13L2 6" stroke="#000" strokeWidth="2" fill="none"/>
                      </svg>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#000', fontSize: '0.7rem' }}>
                      {form.email || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      mr: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="#000" strokeWidth="2" fill="none"/>
                        <line x1="12" y1="18" x2="12.01" y2="18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#000', fontSize: '0.7rem' }}>
                      {form.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            {/* Right Side - QR Code and Company Info */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '40%',
              pl: 1
            }}>
              {/* Top - QR Code */}
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                mb: 2,
                pt: 0.5
              }}>
                <img src={qrUrl} alt="QR Code" style={{ 
                  width: '128px', 
                  height: '128px'
                }} />
              </Box>
              
              {/* Bottom - Company Info */}
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 'normal', color: '#000', mb: 0.5 }}>
                  {form.company || 'Kaynes Technology'}, {form.branch || 'Mysore'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.7rem', mb: 0.5 }}>
                  {form.address || '23-25 Belagola Food Industrial Estate'}
                </Typography>
                {/* Website URL - Internal employees only */}
                {card.employee_code && card.employee_code.startsWith('HR-EMP-') && (
                  <Typography variant="caption" sx={{ color: '#000', fontSize: '0.7rem' }}>
                    www.kaynestechnology.co.in
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
          
          {/* Edit Modal */}
          {edit && (
            <Box sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
              zIndex: 9999, // Higher z-index to appear above everything
              p: 2
            }}>
              <Box sx={{
                backgroundColor: 'white',
                borderRadius: 3,
                p: { xs: 2, sm: 4 },
                width: '95%',
                maxWidth: 1200,
                maxHeight: { xs: '90vh', sm: '95vh' },
                overflow: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                // pt: { xs: `${theme.mixins.toolbar.minHeight + 8}px`, sm: 4 }
                mt: { xs: '60px', sm: 0 } // Add top margin on mobile to avoid navbar
              }}>
                {/* Header with Photo and Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  mb: 4,
                  // Mobile: Stack vertically with photo on right
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'flex-start' }
                }}>
                  {/* Title - Left side on mobile, center on desktop */}
                  <Typography variant="h5" sx={{ 
                    color: '#AC212F', 
                    fontWeight: 'bold',
                    textAlign: { xs: 'left', sm: 'center' },
                    mb: { xs: 2, sm: 0 }
                  }}>
                    {viewport.isMobile ? 'Edit Card' : 'Edit Business Card'}
                  </Typography>

                  {/* Photo Upload Section - Right side on mobile, left on desktop */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    order: { xs: 2, sm: 1 }
                  }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar 
                        src={photoFile ? URL.createObjectURL(photoFile) : 
                              (card.photo_url && card.photo_url.startsWith('/') 
                                ? `${card.photo_url}` 
                                : card.photo_url)} 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          border: '3px solid #AC212F',
                          borderRadius: '50%',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                          }
                        }}
                      />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          borderRadius: '50%'
                        }}
                />
              </Box>
                    <Typography variant="caption" sx={{ color: '#666', mt: 1, fontSize: '0.7rem' }}>
                      Click to upload
                    </Typography>
          </Box>

                  {/* Action Buttons - Hidden on mobile (will be at bottom) */}
                  <Box sx={{ 
                    display: { xs: 'none', sm: 'flex' }, 
                    gap: 1,
                    order: { xs: 3, sm: 2 }
                  }}>
                    <Button 
                      variant="contained" 
                      onClick={handleSave}
                      sx={{
                        py: 1,
                        px: 2,
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        backgroundColor: '#34C969',
                        color: 'black',
                        '&:hover': {
                          backgroundColor: '#FF8C00',
                        },
                      }}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleCancel}
                      sx={{
                        py: 1,
                        px: 2,
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        backgroundColor: '#AC212F',
                        color: 'black',
                        '&:hover': {
                          backgroundColor: '#FF8C00',
                        },
                      }}
                    >
                      Cancel
                    </Button>
          </Box>
        </Box>
        
                {/* Form Fields - Single Column on Mobile, 2 Columns on Desktop */}
                <Box sx={{ 
                  display: { xs: 'block', sm: 'flex' }, 
                  gap: 3 
                }}>
                  {/* Left Column */}
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: { xs: 1.5, sm: 2 },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
            <TextField 
              name="name" 
                      label="Full Name"
              value={form.name || ''} 
              onChange={handleChange} 
                      variant="outlined"
                      size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                  '&:hover fieldset': {
                            borderColor: '#AC212F',
                  },
                  '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                  },
                },
              }}
            />
            <TextField 
                      name="designation"
                      label="Designation"
                      value={form.designation || ''}
              onChange={handleChange} 
                      variant="outlined"
                      size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                  '&:hover fieldset': {
                            borderColor: '#AC212F',
                  },
                  '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                  },
                },
              }}
            />
                <TextField 
                  name="department" 
                      label="Department"
                  value={form.department || ''} 
                  onChange={handleChange} 
                      variant="outlined"
                      size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                      '&:hover fieldset': {
                            borderColor: '#AC212F',
                      },
                      '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                      },
                    },
                  }}
                />
                <TextField 
                      name="phone"
                      label="Phone Number"
                      value={form.phone || ''}
                  onChange={handleChange} 
                      variant="outlined"
                      size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                      '&:hover fieldset': {
                            borderColor: '#AC212F',
                      },
                      '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                      },
                    },
                  }}
                />
                  </Box>

                  {/* Right Column */}
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: { xs: 1.5, sm: 2 },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                <TextField 
                      name="email"
                      label="Email Address"
                      value={form.email || ''}
                  onChange={handleChange} 
                      variant="outlined"
                      size="small"
                  sx={{
                    mt: { xs: 1.5, sm: 0 },
                    '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                      '&:hover fieldset': {
                            borderColor: '#AC212F',
                      },
                      '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                      },
                    },
                  }}
                />
            <TextField 
                      name="company"
                      label="Company Name"
                      value={form.company || ''}
              onChange={handleChange} 
                      variant="outlined"
                      size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                  '&:hover fieldset': {
                            borderColor: '#AC212F',
                  },
                  '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                  },
                },
              }}
            />
            <TextField 
                      name="branch"
                      label="Branch/Location"
                      value={form.branch || ''}
              onChange={handleChange} 
                      variant="outlined"
                      size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                  '&:hover fieldset': {
                            borderColor: '#AC212F',
                  },
                  '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                  },
                },
              }}
            />
        <TextField 
          name="address" 
                      label="Address"
          value={form.address || ''} 
          onChange={handleChange} 
                      variant="outlined"
                      size="small"
                      multiline
                      rows={2}
          sx={{
            '& .MuiOutlinedInput-root': {
                          color: '#000',
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
              '&:hover fieldset': {
                            borderColor: '#AC212F',
              },
              '&.Mui-focused fieldset': {
                            borderColor: '#AC212F',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#AC212F',
                          },
                        },
                      }}
                    />
            </Box>
        </Box>
            
            {/* Mobile Action Buttons - Bottom of Form */}
            <Box sx={{ 
              display: { xs: 'flex', sm: 'none' }, 
              gap: 2, 
              mt: 3,
              justifyContent: 'center'
            }}>
              <Button 
                variant="contained" 
                onClick={handleSave}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  backgroundColor: '#34C969',
                  color: 'black',
                  minWidth: 120,
                  '&:hover': {
                    backgroundColor: '#FF8C00',
                  },
                }}
              >
                Save
              </Button>
              <Button 
                variant="contained" 
                onClick={handleCancel}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  backgroundColor: '#AC212F',
                  color: 'black',
                  minWidth: 120,
                  '&:hover': {
                    backgroundColor: '#FF8C00',
                  },
                }}
              >
                Cancel
              </Button>
            </Box>
            
            </Box>
          </Box>
        )}
          </Box>
        </Box>
        
        {/* Last Edited Information - Between Card and Footer */}
        {!edit && lastEditorName && card.last_edited_at && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 1,
            px: 2,
            position: 'relative',
            zIndex: 10
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#f2f1f0', 
                fontStyle: 'italic',
                fontSize: '0.75rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              Last edited by {lastEditorName} on {new Date(card.last_edited_at).toLocaleDateString()}
            </Typography>
          </Box>
        )}
      </Box>
      
      <Footer showDeveloper={false} />
    <Snackbar
      open={showPhotoPrompt}
      autoHideDuration={6000}
      onClose={() => setShowPhotoPrompt(false)}
      message="Tap on profile picture to personalize your card!"
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            marginTop: `${theme.mixins.toolbar.minHeight + 8}px`,
            backgroundColor: 'white',
            color: '#333',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            border: '1px solid #ddd'
          }
        }}
    />
    <Snackbar
      open={showSavedMsg}
      autoHideDuration={3000}
      onClose={() => setShowSavedMsg(false)}
        message="Card updated successfully!"
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            marginTop: `${theme.mixins.toolbar.minHeight + 8}px`,
            backgroundColor: 'white',
            color: '#333',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            border: '1px solid #ddd'
          }
        }}
    />
    </>
  );
};

export default CardView; 