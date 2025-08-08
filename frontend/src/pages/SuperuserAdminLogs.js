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
  { field: 'admin_email', headerName: 'Admin Email', width: 220 },
  { field: 'action', headerName: 'Action', width: 180 },
  {
    field: 'details',
    headerName: 'Details',
    width: 300,
    flex: 1,
    renderCell: (params) => {
      let employeeCode = '';
      
      if (params.value === null || params.value === undefined) {
        employeeCode = 'No details';
      } else if (typeof params.value === 'object') {
        employeeCode = params.value.employee_code || 'No employee code';
      } else if (typeof params.value === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(params.value);
          employeeCode = parsed.employee_code || 'No employee code';
        } catch {
          // If not valid JSON, display as string
          employeeCode = params.value;
        }
      } else {
        employeeCode = String(params.value);
      }
      
      return (
        <span style={{ 
          color: '#000000',
          fontSize: '14px'
        }}>
          {employeeCode}
        </span>
      );
    }
  },
  { field: 'created_at', headerName: 'Timestamp', width: 200 },
];

const SuperuserAdminLogs = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/su/admin-logs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Expecting res.data to be an array of log entries
        setRows(res.data.map((row, idx) => ({ ...row, id: idx + 1 })));
      } catch (err) {
        setError('Failed to fetch admin logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all admin audit logs? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/auth/su/admin-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows([]);
    } catch (err) {
      setError('Failed to clear admin logs.');
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
        <Typography variant="h4" fontWeight="bold" color='text.primary'>Admin Audit Log</Typography>
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

export default SuperuserAdminLogs; 