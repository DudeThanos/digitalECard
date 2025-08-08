import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Alert, CircularProgress, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import Footer from '../components/Footer';
import useViewport from '../hooks/useViewport';

const frequencies = [
  { value: 'manual', label: 'Manual Only' },
  { value: 'everyday', label: 'Everyday (3am)' },
  { value: 'weekly', label: 'Weekly (Sunday 3am)' },
  { value: 'monthly', label: 'Monthly (1st, 3am)' },
  { value: 'yearly', label: 'Yearly (Dec 31, 3am)' },
];

const BackupSettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupDir, setBackupDir] = useState('');
  const [frequency, setFrequency] = useState('manual');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [manualBackupLoading, setManualBackupLoading] = useState(false);
  const [lastBackupFile, setLastBackupFile] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const theme = useTheme();
  const viewport = useViewport();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/csv/backup-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(res.data);
      setBackupDir(res.data.backupDir || '');
      setFrequency(res.data.frequency || 'manual');
      setStatus(res.data.cronRunning ? 'Scheduled backup is active.' : 'No scheduled backup.');
      setNotificationEmail(res.data.notificationEmail || '');
      setLoading(false);
    } catch (err) {
      setError('Failed to load backup config.');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await axios.post('/api/csv/backup-config', {
        backupDir,
        frequency,
        notificationEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('Backup settings updated.');
      fetchConfig();
    } catch (err) {
      setError('Failed to update backup settings.');
    }
    setSaving(false);
  };

  const handleManualBackup = async () => {
    setManualBackupLoading(true);
    setError('');
    setStatus('');
    try {
      const res = await axios.post('/api/csv/backup', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('Manual backup successful!');
      setLastBackupFile(res.data.file);
    } catch (err) {
      setError('Manual backup failed.');
    }
    setManualBackupLoading(false);
  };

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <>
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        p: 2
      }}>
        <Box sx={{
          width: '100%',
          maxWidth: 500,
          background: '#fff',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(44,62,80,0.18)',
          p: 4,
          mb: 3
        }}>
          <Typography variant="h4" sx={{ mb: 2, color: theme.palette.primary.main, fontWeight: 'bold' }}>
            🗄️ Backup Settings
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Backup Directory Path"
              value={backupDir}
              onChange={e => setBackupDir(e.target.value)}
              fullWidth
              helperText="Where backup CSVs will be saved on the server."
            />
            <TextField
              select
              label="Backup Frequency"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              fullWidth
              helperText="How often to run automatic backup."
            >
              {frequencies.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notification Email"
              value={notificationEmail}
              onChange={e => setNotificationEmail(e.target.value)}
              fullWidth
              helperText="Email to notify after scheduled backup."
              type="email"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              sx={{ fontWeight: 'bold', borderRadius: 3, py: 1.5 }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleManualBackup}
              disabled={manualBackupLoading}
              sx={{ fontWeight: 'bold', borderRadius: 3, py: 1.5 }}
            >
              {manualBackupLoading ? 'Backing Up...' : 'Run Manual Backup Now'}
            </Button>
            {lastBackupFile && (
              <Alert severity="success">Last backup file: {lastBackupFile}</Alert>
            )}
            {status && <Alert severity="info">{status}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <Alert severity="warning">
              Only the last 4 backup files are kept. Older files are deleted automatically.<br/>
              <b>Note:</b> Backups are saved on the server, not your local device.
            </Alert>
          </Stack>
        </Box>
        <Footer showDeveloper={true} />
      </Box>
    </>
  );
};

export default BackupSettings; 