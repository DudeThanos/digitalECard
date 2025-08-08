import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import DialogContentText from '@mui/material/DialogContentText';

const ADMIN_FEATURES = [
  { key: 'bulk_upload', label: 'Bulk CSV Upload', default: true },
  { key: 'single_card', label: 'Single Card Creation', default: true },
  { key: 'view_all_cards', label: 'View All Cards', default: true },
  { key: 'edit_any_card', label: 'Edit Any Card', default: true },
  { key: 'delete_any_card', label: 'Delete Any Card', default: false },
  { key: 'company_master', label: 'Company Master', default: false },
  { key: 'reset_user_password', label: 'Reset User Password', default: false },
  { key: 'backup_settings', label: 'Backup Settings', default: false },
];

const SuperuserAdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Move handleEditClick inside the component so it can access state
  const handleEditClick = (row) => {
    setSelectedAdmin(row);
    setPermissions({ ...ADMIN_FEATURES.reduce((acc, f) => {
      acc[f.key] = f.default;
      return acc;
    }, {}), ...(row.permissions || {}) });
    setModalOpen(true);
  };

  // Update columns to use the local handleEditClick
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'employee_code', headerName: 'Employee Code', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'role', headerName: 'Role', width: 120 },
    {
      field: 'edit',
      headerName: 'Edit Permissions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleEditClick(params.row)}
          sx={{ fontWeight: 'bold', borderRadius: 2, boxShadow: 1 }}
        >
          Edit Permissions
        </Button>
      ),
    },
  ];

  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/su/admins', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmins(res.data.admins.map((a, idx) => ({ ...a, id: a.id || idx + 1 })));
      } catch (err) {
        setError('Failed to fetch admins.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const handlePermissionChange = (key) => (e) => {
    setPermissions((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/su/admins/permissions', {
        admin_id: selectedAdmin.id,
        permissions,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalOpen(false);
      setSuccess(true);
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert('Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  // Check if all optional permissions (last 4) are selected
  const optionalFeatures = ADMIN_FEATURES.filter(f => !f.default);
  const allOptionalChecked = optionalFeatures.every(f => permissions[f.key]);
  
  const handleSelectAll = () => {
    const newState = !allOptionalChecked;
    setPermissions(prev => {
      const updated = { ...prev };
      // Only toggle optional permissions (last 4), keep mandatory ones (first 4) always true
      optionalFeatures.forEach(f => { 
        updated[f.key] = newState; 
      });
      return updated;
    });
  };



  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 7, p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color='text.primary'>Admin Permissions</Typography>
      </Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <DataGrid
          rows={admins}
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
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          Set Permissions for <br />
          <span style={{ color: '#1976d2' }}>{selectedAdmin?.name || selectedAdmin?.email}</span>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            <Button
              variant={allOptionalChecked ? 'outlined' : 'contained'}
              color="primary"
              onClick={handleSelectAll}
              sx={{ mb: 1, fontWeight: 'bold', borderRadius: 2, minWidth: 140, boxShadow: 1 }}
              size="small"
            >
              {allOptionalChecked ? 'Unselect Optional' : 'Select Optional'}
            </Button>
            <Stack spacing={1} sx={{ width: '100%' }}>
              {ADMIN_FEATURES.map(f => (
                <FormControlLabel
                  key={f.key}
                  control={
                    <Checkbox
                      checked={permissions[f.key] || false}
                      onChange={handlePermissionChange(f.key)}
                      disabled={f.default}
                    />
                  }
                  label={
                    <span style={{ fontWeight: f.default ? 600 : 400, color: f.default ? '#888' : undefined }}>
                      {f.label}{f.default ? ' (Default, always enabled)' : ''}
                    </span>
                  }
                />
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={saving} variant="outlined">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ fontWeight: 'bold' }}>Save</Button>
        </DialogActions>
      </Dialog>
      {success && (
        <Box sx={{ position: 'fixed', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1300 }}>
          <Alert severity="success" sx={{ minWidth: 300, fontWeight: 'bold' }}>Permissions updated successfully!</Alert>
        </Box>
      )}
    </Box>
  );
};

export default SuperuserAdminManagement; 