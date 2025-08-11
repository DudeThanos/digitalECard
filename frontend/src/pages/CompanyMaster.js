import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useTheme } from '@mui/material/styles';
import BusinessIcon from '@mui/icons-material/Business';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import useViewport from '../hooks/useViewport';

const API_BASE = '/api';

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [form, setForm] = useState({ company_name: '', branch_name: '' });
  const [logoFile, setLogoFile] = useState(null);
  const theme = useTheme();
  const viewport = useViewport();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/company`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCompanies(response.data.companies);
    } catch (err) {
      setError('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      if (editingCompany) {
        // Update existing company
        await axios.put(`${API_BASE}/company/${editingCompany.id}`, form, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSuccess('Company updated successfully!');
      } else {
        // Create new company
        await axios.post(`${API_BASE}/company`, form, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSuccess('Company created successfully!');
      }

      // Upload logo if selected
      if (logoFile && editingCompany) {
        const logoData = new FormData();
        logoData.append('logo', logoFile);
        await axios.post(`${API_BASE}/company/${editingCompany.id}/logo`, logoData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setDialogOpen(false);
      setEditingCompany(null);
      setForm({ company_name: '', branch_name: '' });
      setLogoFile(null);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save company');
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setForm({ company_name: company.company_name, branch_name: company.branch_name });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/company/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Company deleted successfully!');
      fetchCompanies();
    } catch (err) {
      setError('Failed to delete company');
    }
  };

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  // Mobile Card Component
  const MobileCompanyCard = ({ company }) => (
    <Card sx={{ 
      mb: 2, 
      boxShadow: 2, 
      borderRadius: 2,
      '&:hover': { 
        boxShadow: 4,
        transform: 'translateY(-2px)',
        transition: 'all 0.2s ease'
      }
    }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
              {company.company_name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              🏢 {company.branch_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              onClick={() => handleEdit(company)}
              size="small"
              sx={{ color: '#1976d2' }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              onClick={() => handleDelete(company.id)}
              size="small"
              sx={{ color: '#d32f2f' }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {company.logo_url ? (
            <img 
                                src={`${company.logo_url}`} 
              alt="Company Logo" 
              style={{ 
                width: 60, 
                height: 60, 
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}
            />
          ) : (
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5'
            }}>
              <BusinessIcon sx={{ color: '#ccc', fontSize: 30 }} />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            {company.logo_url ? 'Logo uploaded' : 'No logo uploaded'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      p: viewport.isMobile ? 1 : 3,
      paddingTop: viewport.isMobile ? '80px' : '24px'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 4,
        flexDirection: viewport.isMobile ? 'column' : 'row',
        textAlign: viewport.isMobile ? 'center' : 'left'
      }}>
        <BusinessIcon sx={{ 
          fontSize: viewport.isMobile ? 32 : 40, 
          color: theme.palette.primary.main, 
          mr: viewport.isMobile ? 0 : 2,
          mb: viewport.isMobile ? 1 : 0
        }} />
        <Typography 
          variant={viewport.isMobile ? "h5" : "h4"} 
          sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 'bold',
            textAlign: viewport.isMobile ? 'center' : 'left'
          }}
        >
          Company Master Management
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: viewport.isMobile ? 'column' : 'row',
        gap: viewport.isMobile ? 2 : 0
      }}>
        <Typography 
          variant={viewport.isMobile ? "body1" : "h6"}
          sx={{ textAlign: viewport.isMobile ? 'center' : 'left' }}
        >
          Manage Companies and Branches
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.secondary.main,
            },
            width: viewport.isMobile ? '100%' : 'auto',
            fontSize: viewport.isMobile ? '0.9rem' : '0.875rem'
          }}
        >
          Add Company
        </Button>
      </Box>

      {/* Mobile View - Cards */}
      {viewport.isMobile ? (
        <Box>
          {companies.map((company) => (
            <MobileCompanyCard key={company.id} company={company} />
          ))}
          
          {companies.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No companies found. Add your first company to get started.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* Desktop View - Table */
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Company Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Branch</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Logo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>{company.company_name}</TableCell>
                  <TableCell>{company.branch_name}</TableCell>
                  <TableCell>
                    {company.logo_url ? (
                      <img 
                        src={`${company.logo_url}`} 
                        alt="Company Logo" 
                        style={{ width: 50, height: 50, objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No logo
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleEdit(company)}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(company.id)}
                      sx={{ color: theme.palette.error.main }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={viewport.isMobile}
      >
        <DialogTitle>
          {editingCompany ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Company Name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Branch Name"
              value={form.branch_name}
              onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
              fullWidth
              margin="normal"
              required
            />
            {editingCompany && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload Logo (Optional)
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ marginTop: 8 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingCompany ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CompanyMaster; 