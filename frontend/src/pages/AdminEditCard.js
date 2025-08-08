import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';

const AdminEditCard = () => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [card, setCard] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get current user info and permissions
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userPermissions = currentUser.permissions || {};

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/card/${searchCode}`);
      setCard(res.data.card);
      setForm(res.data.card);
      setSuccess('');
    } catch (err) {
      setError('Card not found');
      setCard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Check permissions before attempting update
    if (currentUser.role === 'superuser') {
      // Superusers can edit any card
    } else if (currentUser.role === 'admin') {
      if (!userPermissions.edit_any_card) {
        setError('You do not have permission to edit cards');
        return;
      }
    } else {
      setError('You do not have permission to edit cards');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/card/${searchCode}/update`, form, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Card updated successfully!');
      // Refresh card data
      const res = await axios.get(`http://localhost:5000/api/card/${searchCode}`);
      setCard(res.data.card);
      setForm(res.data.card);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update card');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" mb={2} color="text.primary">Edit Any Card</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Search Form */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" mb={2} color="text.primary">Search by Employee Code</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Employee Code"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
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

      {/* Edit Form */}
      {card && (
        <>
          {/* Permission Check */}
          {(() => {
            if (currentUser.role === 'superuser') {
              return null; // Show form for superusers
            } else if (currentUser.role === 'admin') {
              if (!userPermissions.edit_any_card) {
                return (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    You do not have permission to edit cards
                  </Alert>
                );
              }
              return null; // Show form for admins with permission
            } else {
              return (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You do not have permission to edit cards
                </Alert>
              );
            }
          })()}
          
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" mb={2}>Edit Card Details</Typography>
          <TextField
            label="Employee Code"
            name="employee_code"
            value={form.employee_code || ''}
            fullWidth
            margin="normal"
            disabled
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="First Name"
              name="first_name"
              value={form.first_name || ''}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Last Name"
              name="last_name"
              value={form.last_name || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Box>
          <TextField
            label="Full Name"
            name="name"
            value={form.name || `${form.first_name || ''} ${form.last_name || ''}`.trim()}
            onChange={handleChange}
            fullWidth
            margin="normal"
            helperText="Auto-generated from First Name + Last Name"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email || ''}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Phone"
            name="phone"
            value={form.phone || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select name="role" value={form.role || 'user'} onChange={handleChange}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Department"
            name="department"
            value={form.department || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Designation"
            name="designation"
            value={form.designation || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Company"
            name="company"
            value={form.company || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Address"
            name="address"
            value={form.address || ''}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select name="status" value={form.status || 'active'} onChange={handleChange}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button variant="contained" color="primary" type="submit">Update Card</Button>
            <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </Box>
                  </form>
        </>
      )}
    </Box>
  );
};

export default AdminEditCard; 