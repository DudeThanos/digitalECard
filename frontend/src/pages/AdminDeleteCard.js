import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const AdminDeleteCard = () => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Get current user info and permissions
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userPermissions = currentUser.permissions || {};
  const userEmployeeCode = currentUser.employee_code;

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/card/${searchCode}`);
      setCard(res.data.card);
      setSuccess('');
    } catch (err) {
      setError('Card not found');
      setCard(null);
    } finally {
      setLoading(false);
    }
  };

  // Clear card data when search field changes
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchCode(newValue);
    
    // Clear card data if search field is modified
    if (card && newValue !== card.employee_code) {
      setCard(null);
      setError('');
      setSuccess('');
    }
  };

  const handleDelete = async () => {
    setError('');
    setSuccess('');
    
    // Check permissions before attempting delete
    if (currentUser.role === 'superuser') {
      // Superusers can delete any card
    } else if (currentUser.role === 'admin') {
      if (!userPermissions.delete_any_card) {
        setError('You do not have permission to delete cards');
        setShowConfirm(false);
        return;
      }
      
      if (!searchCode || searchCode === userEmployeeCode) {
        setError('You cannot delete your own card');
        setShowConfirm(false);
        return;
      }
    } else {
      setError('You do not have permission to delete cards');
      setShowConfirm(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/card/${searchCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Card deleted successfully!');
      setCard(null);
      setSearchCode('');
      setShowConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete card');
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleNo = () => {
    setShowConfirm(false);
    setCard(null);
    setSearchCode('');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" mb={2} color="text.primary">Delete Any Card</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Search Form */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" mb={2} color="text.primary">Search by Employee Code</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Employee Code"
            value={searchCode}
            onChange={handleSearchChange}
            placeholder="e.g., HR-EMP-00001"
            fullWidth
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Search'}
          </Button>
        </Box>
      </Box>

      {/* Card Details */}
      {card && (
        <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
          <Typography variant="h6" mb={2}>Card Details</Typography>
          <Typography><strong>Employee Code:</strong> {card.employee_code}</Typography>
                          <Typography><strong>Name:</strong> {card.name || `${card.first_name || ''} ${card.last_name || ''}`.trim()}</Typography>
          <Typography><strong>Email:</strong> {card.email}</Typography>
          <Typography><strong>Phone:</strong> {card.phone || 'N/A'}</Typography>
          <Typography><strong>Role:</strong> {card.role}</Typography>
          <Typography><strong>Department:</strong> {card.department || 'N/A'}</Typography>
          <Typography><strong>Designation:</strong> {card.designation || 'N/A'}</Typography>
          <Typography><strong>Company:</strong> {card.company || 'N/A'}</Typography>
          <Typography><strong>Branch:</strong> {card.branch || 'N/A'}</Typography>
          <Typography><strong>Status:</strong> {card.status}</Typography>
          {(() => {
            // Check if user can delete this specific card
            if (currentUser.role === 'superuser') {
              return (
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={() => setShowConfirm(true)}
                  sx={{ mt: 2 }}
                >
                  Delete This Card
                </Button>
              );
            } else if (currentUser.role === 'admin') {
              if (userPermissions.delete_any_card && searchCode && searchCode !== userEmployeeCode) {
                return (
                  <Button 
                    variant="contained" 
                    color="error" 
                    onClick={() => setShowConfirm(true)}
                    sx={{ mt: 2 }}
                  >
                    Delete This Card
                  </Button>
                );
              } else {
                return (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {!userPermissions.delete_any_card 
                      ? 'You do not have permission to delete cards' 
                      : searchCode === userEmployeeCode
                      ? 'You cannot delete your own card'
                      : 'Please search for a valid employee code'
                    }
                  </Alert>
                );
              }
            } else {
              return (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You do not have permission to delete cards
                </Alert>
              );
            }
          })()}
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onClose={handleCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the card for <strong>{card?.name}</strong> ({card?.employee_code})?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNo} color="primary">
            No
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default AdminDeleteCard; 