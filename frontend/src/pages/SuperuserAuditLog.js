import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

const columns = [
  { field: 'id', headerName: 'Serial No', width: 90 },
  { field: 'username', headerName: 'Username', width: 220 },
  { field: 'action', headerName: 'Action', width: 180 },
  { field: 'details', headerName: 'Details', width: 300, flex: 1 },
  { field: 'created_at', headerName: 'Timestamp', width: 200 },
];

const parseLogLine = (line, idx) => {
  // Example: [2024-07-22T22:00:00.000Z] ACTION: {"key":"value"}
  const match = line.match(/^\[(.*?)\] (.*?): (.*)$/);
  if (!match) return null;
  const [, created_at, action, details] = match;
  let detailsObj = {};
  try { detailsObj = JSON.parse(details); } catch {}
  // Try to extract username/email from details
  let username = detailsObj.username || detailsObj.email || detailsObj.admin_email || detailsObj.admin_username || '';
  // Fallback: if action is LOGIN or FAILED_LOGIN and details has no username, show empty
  return {
    id: idx + 1,
    username,
    action,
    details: JSON.stringify(detailsObj),
    created_at,
  };
};

const SuperuserAuditLog = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/su/audit-log', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const lines = res.data.split('\n').filter(Boolean);
        const parsed = lines.map(parseLogLine).filter(Boolean);
        setRows(parsed);
      } catch (err) {
        setError('Failed to fetch audit log.');
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all superuser audit logs? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/auth/su/audit-log', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows([]);
    } catch (err) {
      setError('Failed to clear audit log.');
    }
  };

  const filteredRows = rows.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 6, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color='text.primary'>Superuser Audit Log</Typography>
        <Box>
          <Button variant="outlined" sx={{ mr: 2 }} onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          <Button variant="outlined" color="error" onClick={handleClearLogs}>Clear All Logs</Button>
        </Box>
      </Box>
      <TextField
        label="Search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <DataGrid
          rows={filteredRows}
          columns={columns}
          autoHeight
          pageSize={20}
          rowsPerPageOptions={[10, 20, 50, 100]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-root': {
              color: '#000000',
            },
            '& .MuiDataGrid-cell': {
              color: '#000000',
            },
            '& .MuiDataGrid-columnHeaders': {
              color: '#000000',
            },
            '& .MuiDataGrid-footerContainer': {
              color: '#000000',
            },
            '& .MuiDataGrid-columnHeader': {
              color: '#000000',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: '#000000',
            },
            '& .MuiDataGrid-virtualScroller': {
              color: '#000000',
            },
            '& .MuiDataGrid-virtualScrollerContent': {
              color: '#000000',
            },
            '& .MuiDataGrid-virtualScrollerRenderZone': {
              color: '#000000',
            },
            '& .MuiDataGrid-selectedRowCount': {
              color: '#000000',
            },
            '& .MuiDataGrid-footer': {
              color: '#000000',
            },
            // Fix pagination text color
            '& .MuiTablePagination-root': {
              color: '#ffffff !important',
            },
            '& .MuiTablePagination-selectLabel': {
              color: '#ffffff !important',
            },
            '& .MuiTablePagination-displayedRows': {
              color: '#ffffff !important',
            },
            '& .MuiTablePagination-actions': {
              color: '#ffffff !important',
            },
            '& .MuiTablePagination-select': {
              color: '#ffffff !important',
            },
            '& .MuiTablePagination-selectIcon': {
              color: '#ffffff !important',
            },
            '& .MuiIconButton-root': {
              color: '#ffffff !important',
            },
            '& .MuiIconButton-root.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.5) !important',
            },
          }}
        />
      )}
    </Box>
  );
};

export default SuperuserAuditLog; 