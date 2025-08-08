import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const AdminResetPassword = () => {
  const [empCode, setEmpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();

  const handleShowConfirm = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/card/${empCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserDetails(res.data.card);
      setShowConfirm(true);
    } catch (err) {
      setError('User not found');
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };
  const handleReset = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/card/${empCode}/admin-reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Password for ${empCode} reset to Kaynescard@123. User will be forced to change password on next login.`);
      setEmpCode('');
      setShowConfirm(false);
      setUserDetails(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" mb={2} color="text.primary">Admin: Reset User Password</Typography>
      <Typography variant="body2" mb={2} color="text.primary">
        Enter the employee code to reset their password to{' '}
        <Typography component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Kaynescard@123
        </Typography>
        .<br/>
        The user will be forced to change their password on next login.
      </Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Employee Code"
        value={empCode}
        onChange={e => setEmpCode(e.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth 
        sx={{ mt: 2 }}
        onClick={handleShowConfirm}
        disabled={loading || !empCode.trim()}
      >
        {loading ? 'Checking...' : 'Reset Password'}
      </Button>
      <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogTitle>Confirm User Details</DialogTitle>
        <DialogContent>
          {userDetails ? (
            <Box sx={{ mb: 2 }}>
              <Typography><strong>Employee Code:</strong> {userDetails.employee_code}</Typography>
              <Typography><strong>Name:</strong> {userDetails.name}</Typography>
              <Typography><strong>Email:</strong> {userDetails.email}</Typography>
              <Typography><strong>Mobile:</strong> {userDetails.phone || 'N/A'}</Typography>
              <Typography><strong>Role:</strong> {userDetails.role}</Typography>
              <Typography><strong>Department:</strong> {userDetails.department || 'N/A'}</Typography>
              <Typography><strong>Designation:</strong> {userDetails.designation || 'N/A'}</Typography>
              <Typography><strong>Company:</strong> {userDetails.company || 'N/A'}</Typography>
              <Typography><strong>Branch:</strong> {userDetails.branch || 'N/A'}</Typography>
              <Typography><strong>Status:</strong> {userDetails.status}</Typography>
            </Box>
          ) : (
            <Typography color="error">User details not found.</Typography>
          )}
          <Typography color="error" sx={{ mt: 1 }}>
            Are you sure you want to reset the password for this user?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirm(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleReset} color="error" variant="contained" disabled={!userDetails}>
            Yes, Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminResetPassword; 