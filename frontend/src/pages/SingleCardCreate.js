import React, { useState, useEffect } from 'react';
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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import useViewport from '../hooks/useViewport';

const INT_PREFIX = 'HR-EMP-';
const EXT_PREFIX = 'EX-THP-';

const SingleCardCreate = () => {
  const navigate = useNavigate();
  const viewport = useViewport();
  const [series, setSeries] = useState('INT'); // INT or EXT
  const [form, setForm] = useState({
    employee_code_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    department: '',
    designation: '',
    company: '',
    branch: '',
    address: '',
    status: 'active'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastCodes, setLastCodes] = useState({ nextInternalCode: '', nextExternalCode: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [createdUser, setCreatedUser] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Set role based on user permissions
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.role !== 'superuser') {
      setForm(f => ({ ...f, role: 'user' }));
    }
  }, []);

  useEffect(() => {
    axios.get('/api/card/last-employee-codes')
      .then(res => {
        setLastCodes(res.data);
        // Auto-load the next number for the current series
        const nextCode = series === 'EXT' ? res.data.nextExternalCode : res.data.nextInternalCode;
        const nextNumber = nextCode.replace(series === 'EXT' ? EXT_PREFIX : INT_PREFIX, '');
        setForm(f => ({
          ...f,
          employee_code_number: nextNumber
        }));
      })
      .catch(() => setLastCodes({ nextInternalCode: '', nextExternalCode: '' }));
  }, [series]);

  const handleSeriesChange = (e) => {
    const newSeries = e.target.checked ? 'EXT' : 'INT';
    setSeries(newSeries);
    
    // Auto-load the next available number for the selected series
    const nextCode = newSeries === 'EXT' ? lastCodes.nextExternalCode : lastCodes.nextInternalCode;
    const nextNumber = nextCode.replace(newSeries === 'EXT' ? EXT_PREFIX : INT_PREFIX, '');
    
    setForm(f => ({
      ...f,
      employee_code_number: nextNumber
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only allow numbers
      if (!/^\d*$/.test(value)) return;
    }
    if (name === 'employee_code_number') {
      // Only allow numbers
      if (!/^\d*$/.test(value)) return;
    }
    setForm({ ...form, [name]: value });
  };

  const getPrefix = () => (series === 'INT' ? INT_PREFIX : EXT_PREFIX);
  const getFullEmployeeCode = () => getPrefix() + (form.employee_code_number || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const employee_code = getFullEmployeeCode();
    if (!form.employee_code_number) {
      setError('Please enter the employee code number.');
      return;
    }
    if (!form.phone) {
      setError('Phone is required.');
      return;
    }
    if (!/^\d+$/.test(form.phone)) {
      setError('Phone must be numbers only.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/card/create', { ...form, employee_code }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess(`Card created successfully! Employee Code: ${res.data.user.employee_code}`);
      setCreatedUser({
        username: res.data.user.email,
        password: form.password,
        employee_code: res.data.user.employee_code
      });
      setModalOpen(true);
      setForm({
        employee_code_number: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
        department: '',
        designation: '',
        company: '',
        branch: '',
        address: '',
        status: 'active'
      });
      // Refresh last codes
      axios.get('/api/card/last-employee-codes')
        .then(res => setLastCodes(res.data))
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create card');
    }
  };

  const handleCopy = () => {
    const text = `Username: ${createdUser.username}\nPassword: ${createdUser.password}\nEmployee Code: ${createdUser.employee_code}`;
    navigator.clipboard.writeText(text).then(() => setCopySuccess(true));
    setTimeout(() => setCopySuccess(false), 1500);
  };

  return (
    <Box sx={{ 
      maxWidth: viewport.isMobile ? 600 : 1200, 
      mx: 'auto', 
      mt: 6, 
      p: 3, 
      boxShadow: 3, 
      borderRadius: 2 
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" color="text.primary">Create Single Card</Typography>
        <FormControlLabel
          control={<Switch checked={series === 'EXT'} onChange={handleSeriesChange} color="primary" />}
          label={series === 'EXT' ? 'External' : 'Internal'}
          labelPlacement="start"
          sx={{ 
            ml: 2,
            '& .MuiFormControlLabel-label': {
              color: 'text.primary',
              fontWeight: 'bold'
            }
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Alert severity="info" sx={{ flex: 1 }}>
          Next Internal: <b>{lastCodes.nextInternalCode}</b><br/>
          Next External: <b>{lastCodes.nextExternalCode}</b>
        </Alert>
      </Box>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        {/* Employee Code Section - Full Width */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TextField
            label="Employee Code Prefix"
            value={getPrefix()}
            disabled
            sx={{ width: 120 }}
          />
          <TextField
            label="Number"
            name="employee_code_number"
            value={form.employee_code_number}
            disabled
            sx={{ flex: 1 }}
          />
        </Box>
        
        {/* Two Column Layout for Desktop */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: viewport.isMobile ? '1fr' : '1fr 1fr',
          gap: 3,
          mb: 2
        }}>
          {/* Left Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                fullWidth
              />
            </Box>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
            />
            {/* Role field - only show for superuser */}
            {(() => {
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              if (currentUser.role === 'superuser') {
                return (
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select name="role" value={form.role} onChange={handleChange}>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                );
              } else {
                // For non-superusers, force role to 'user' and hide the field
                return (
                  <TextField
                    label="Role"
                    value="User"
                    disabled
                    fullWidth
                    helperText="Only superuser can create admin accounts"
                  />
                );
              }
            })()}
          </Box>
          
          {/* Right Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Company"
              name="company"
              value={form.company}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Branch"
              name="branch"
              value={form.branch}
              onChange={handleChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select name="status" value={form.status} onChange={handleChange}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {/* Address Section - Full Width */}
        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="contained" color="primary" type="submit">Create Card</Button>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>
      </form>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>New User Credentials</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Username: <b>{createdUser.username}</b></Typography>
          <Typography gutterBottom>Password: <b>{createdUser.password}</b></Typography>
          <Typography gutterBottom>Employee Code: <b>{createdUser.employee_code}</b></Typography>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{ mt: 2 }}
            variant="outlined"
          >
            {copySuccess ? 'Copied!' : 'Copy Details'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SingleCardCreate; 