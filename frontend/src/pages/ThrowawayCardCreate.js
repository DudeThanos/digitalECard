import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import QRCode from 'react-qr-code';

const TemporaryCardCreate = () => {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', company: '' });
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.mobile || !form.email || !form.company) {
      setError('All fields are required.');
      return;
    }
    setCard({ ...form });
  };

  const handleReset = () => {
    setCard(null);
    setForm({ name: '', mobile: '', email: '', company: '' });
    setError('');
  };

  if (!card) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3, boxShadow: 3, borderRadius: 2, background: 'rgba(255,255,255,0.97)' }}>
        <Typography variant="h5" mb={2} fontWeight="bold" color='text.primary'>Create Temporary Card</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required margin="normal" />
          <TextField label="Mobile" name="mobile" value={form.mobile} onChange={handleChange} fullWidth required margin="normal" />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth required margin="normal" />
          <TextField label="Company" name="company" value={form.company} onChange={handleChange} fullWidth required margin="normal" />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, fontWeight: 'bold' }}>Create</Button>
        </form>
      </Box>
    );
  }

  // Generate vCard string
      let firstName = card.first_name || card.name.trim();
    let lastName = card.last_name || '';
    if (!card.first_name && card.name && card.name.trim().includes(' ')) {
    const parts = card.name.trim().split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }
  const vCard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
          `FN:${card.name || `${firstName} ${lastName}`.trim()}`,
    `TEL;TYPE=CELL:${card.mobile}`,
    `EMAIL:${card.email}`,
    `ORG:${card.company}`,
    'END:VCARD'
  ].join('\n');

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 6, p: 3, boxShadow: 3, borderRadius: 2, background: 'rgba(255,255,255,0.97)' }}>
      <Typography variant="h5" mb={2} fontWeight="bold" color='text.primary'>Temporary Digital Card</Typography>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: { xs: 'center', sm: 'center' }, 
        gap: { xs: 2, sm: 3 }, 
        mb: 3 
      }}>
        <QRCode value={vCard} size={{ xs: 180, sm: 120 }} />
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: { xs: 'center', sm: 'flex-start' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
                          <Typography color='text.primary' variant="h6" fontWeight="bold">{card.name || `${card.first_name || ''} ${card.last_name || ''}`.trim()}</Typography>
          <Typography color='text.primary' variant="body1">{card.mobile}</Typography>
          <Typography color='text.primary' variant="body1">{card.email}</Typography>
          <Typography color='text.primary' variant="body1">{card.company}</Typography>
        </Box>
      </Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        This card is temporary. Refreshing or leaving this page will erase it.<br/>
        The QR code is a vCard. Scanning will add this contact to your phone.
      </Alert>
      <Button variant="outlined" color="primary" onClick={handleReset} fullWidth sx={{ fontWeight: 'bold' }}>Create New</Button>
    </Box>
  );
};

export default TemporaryCardCreate; 