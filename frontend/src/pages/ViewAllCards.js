import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ButtonGroup from '@mui/material/ButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import ClearIcon from '@mui/icons-material/Clear';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import useViewport from '../hooks/useViewport';

const ViewAllCards = () => {
  const navigate = useNavigate();
  const viewport = useViewport();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [editDialog, setEditDialog] = useState({ open: false, card: null, form: {} });
  const [view, setView] = useState('all'); // 'all', 'internal', 'external'
  
  // Get current user info and permissions
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userPermissions = currentUser.permissions || {};
  const userEmployeeCode = currentUser.employee_code;

  useEffect(() => {
    fetchCards();
  }, []);

  // Auto-dismiss error and success messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/card/cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCards(res.data.cards);
    } catch (err) {
      setError('Failed to load cards');
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic for view
  const internalCards = cards.filter(card => card.employee_code?.toUpperCase().startsWith('HR-EMP-'));
  const externalCards = cards.filter(card => card.employee_code?.toUpperCase().startsWith('EX-THP-'));
  const allCards = cards;
  const viewCards =
    view === 'internal' ? internalCards :
    view === 'external' ? externalCards :
    allCards;

  const filteredCards = viewCards.filter(card =>
    card.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (card.name || `${card.first_name || ''} ${card.last_name || ''}`.trim())?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to check if user can delete a specific card
  const canDeleteCard = (cardEmployeeCode) => {
    // Superusers can delete any card
    if (currentUser.role === 'superuser') return true;
    
    // Admins need delete_any_card permission and cannot delete their own card
    if (currentUser.role === 'admin') {
      return userPermissions.delete_any_card && cardEmployeeCode !== userEmployeeCode;
    }
    
    // Regular users cannot delete any cards
    return false;
  };

  // Helper function to check if user can edit a specific card
  const canEditCard = (cardEmployeeCode) => {
    // Superusers can edit any card
    if (currentUser.role === 'superuser') return true;
    
    // Admins need edit_any_card permission
    if (currentUser.role === 'admin') {
      return userPermissions.edit_any_card;
    }
    
    // Regular users can only edit their own card
    return cardEmployeeCode === userEmployeeCode;
  };

  const paginatedCards = filteredCards.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (employeeCode) => {
    navigate(`/card/${employeeCode}`);
  };

  const handleEdit = (card) => {
    setEditDialog({
      open: true,
      card: card,
      form: { ...card }
    });
  };

  const handleEditChange = (field, value) => {
    setEditDialog(prev => ({
      ...prev,
      form: { ...prev.form, [field]: value }
    }));
  };

  const handleEditSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/card/${editDialog.card.employee_code}/update`, editDialog.form, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEditDialog({ open: false, card: null, form: {} });
      setSuccess(`Card ${editDialog.card.employee_code} updated successfully`);
      fetchCards(); // Refetch cards from backend after update
    } catch (err) {
      setError('Failed to update card');
    }
  };

  const handleDelete = (employeeCode) => {
    if (window.confirm(`Are you sure you want to delete the card for ${employeeCode}?`)) {
      deleteCard(employeeCode);
    }
  };

  const deleteCard = async (employeeCode) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/card/${employeeCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCards(cards.filter(card => card.employee_code !== employeeCode));
      setSuccess(`Card ${employeeCode} deleted successfully`);
    } catch (err) {
      setError('Failed to delete card');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Mobile Card Component
  const MobileCard = ({ card }) => (
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {card.employee_code}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              onClick={() => handleView(card.employee_code)}
              size="small"
              sx={{ color: '#1976d2' }}
            >
              <VisibilityIcon />
            </IconButton>
            {canEditCard(card.employee_code) && (
              <IconButton 
                onClick={() => handleEdit(card)}
                size="small"
                sx={{ color: '#ed6c02' }}
              >
                <EditIcon />
              </IconButton>
            )}
            {canDeleteCard(card.employee_code) && (
              <IconButton 
                onClick={() => handleDelete(card.employee_code)}
                size="small"
                sx={{ color: '#d32f2f' }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        
        <Typography variant="body1" fontWeight="500" sx={{ mb: 1 }}>
          {card.name || `${card.first_name || ''} ${card.last_name || ''}`.trim()}
        </Typography>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            📧 {card.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            📞 {card.phone || 'N/A'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Chip 
            label={card.role} 
            color={card.role === 'admin' ? 'secondary' : 'default'}
            size="small"
          />
          <Chip 
            label={card.status} 
            color={card.status === 'active' ? 'success' : 'error'}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            🏢 {card.department || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🏢 {card.company || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🏢 {card.branch || 'N/A'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      maxWidth: 1400, 
      mx: 'auto', 
      mt: 2, 
      p: viewport.isMobile ? 1 : 3,
      paddingTop: viewport.isMobile ? '80px' : '24px'
    }}>
      <Typography variant="h5" mb={2} color='text.primary' sx={{ 
        textAlign: viewport.isMobile ? 'center' : 'left',
        fontSize: viewport.isMobile ? '1.5rem' : '2rem'
      }}>
        All Cards
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Search and Filter Section */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: viewport.isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: viewport.isMobile ? 'stretch' : 'center',
        gap: viewport.isMobile ? 2 : 0
      }}>
        <TextField
          label="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            width: viewport.isMobile ? '100%' : 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
          InputProps={{
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchTerm('')}
                  edge="end"
                  size="medium"
                  sx={{ 
                    color: '#AC212F',
                    backgroundColor: 'rgba(172, 33, 47, 0.1)',
                    marginRight: '4px',
                    '&:hover': { 
                      backgroundColor: 'rgba(172, 33, 47, 0.2)',
                      color: '#8A1A25',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <ClearIcon sx={{ fontSize: '20px', fontWeight: 'bold' }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: viewport.isMobile ? 'column' : 'row',
          alignItems: 'center', 
          gap: viewport.isMobile ? 1 : 2
        }}>
          <ButtonGroup 
            orientation={viewport.isMobile ? 'vertical' : 'horizontal'}
            sx={{ 
              width: viewport.isMobile ? '100%' : 'auto',
              '& .MuiButton-root': {
                fontSize: viewport.isMobile ? '0.8rem' : '0.875rem',
                padding: viewport.isMobile ? '8px 12px' : '6px 16px'
              }
            }}
          >
            <Button
              variant={view === 'internal' ? 'contained' : 'outlined'}
              onClick={() => setView('internal')}
            >
              Internal ({internalCards.length})
            </Button>
            <Button
              variant={view === 'external' ? 'contained' : 'outlined'}
              onClick={() => setView('external')}
            >
              External ({externalCards.length})
            </Button>
            <Button
              variant={view === 'all' ? 'contained' : 'outlined'}
              onClick={() => setView('all')}
            >
              All ({allCards.length})
            </Button>
          </ButtonGroup>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')} 
            sx={{ 
              width: viewport.isMobile ? '100%' : 'auto',
              fontSize: viewport.isMobile ? '0.8rem' : '0.875rem'
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      {/* Mobile View - Cards */}
      {viewport.isMobile ? (
        <Box>
          {paginatedCards.map((card) => (
            <MobileCard key={card.employee_code} card={card} />
          ))}
          
          {paginatedCards.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm ? 'No cards found matching your search.' : 'No cards found.'}
              </Typography>
            </Box>
          )}
          
          {/* Mobile Pagination */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 3,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              {`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredCards.length)} of ${filteredCards.length}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                disabled={page === 0}
                onClick={() => handleChangePage(null, page - 1)}
                size="small"
              >
                Previous
              </Button>
              <Button
                disabled={page >= Math.ceil(filteredCards.length / rowsPerPage) - 1}
                onClick={() => handleChangePage(null, page + 1)}
                size="small"
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        /* Desktop View - Table */
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Employee Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px' }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '12px 8px', width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCards.map((card) => (
                  <TableRow key={card.employee_code} hover sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                    <TableCell sx={{ padding: '12px 8px', fontWeight: '500' }}>{card.employee_code}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontWeight: '500' }}>{card.name || `${card.first_name || ''} ${card.last_name || ''}`.trim()}</TableCell>
                    <TableCell sx={{ padding: '12px 8px', maxWidth: '150px' }}>
                      <Box sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        '&:hover': { color: '#AC212F' }
                      }} title={card.email}>
                        {card.email?.length > 5 ? `${card.email.substring(0, 5)}...` : card.email}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ padding: '12px 8px' }}>{card.phone || 'N/A'}</TableCell>
                    <TableCell sx={{ padding: '12px 8px' }}>
                      <Chip 
                        label={card.role} 
                        color={card.role === 'admin' ? 'secondary' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.75rem', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '12px 8px', maxWidth: '120px' }}>
                      <Box sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        '&:hover': { color: '#AC212F' }
                      }} title={card.department || 'N/A'}>
                        {(card.department || 'N/A')?.length > 5 ? `${(card.department || 'N/A').substring(0, 5)}...` : (card.department || 'N/A')}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ padding: '12px 8px' }}>
                      <Chip 
                        label={card.status} 
                        color={card.status === 'active' ? 'success' : 'error'}
                        size="small"
                        sx={{ fontSize: '0.75rem', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '12px 8px', maxWidth: '120px' }}>
                      <Box sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        '&:hover': { color: '#AC212F' }
                      }} title={card.company || 'N/A'}>
                        {(card.company || 'N/A')?.length > 5 ? `${(card.company || 'N/A').substring(0, 5)}...` : (card.company || 'N/A')}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ padding: '12px 8px' }}>{card.branch || 'N/A'}</TableCell>
                    <TableCell sx={{ padding: '8px', whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <IconButton 
                          onClick={() => handleView(card.employee_code)}
                          color="primary"
                          size="small"
                          title="View Card"
                          sx={{ 
                            padding: '4px',
                            '&:hover': { backgroundColor: 'rgba(172, 33, 47, 0.1)' }
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: '18px' }} />
                        </IconButton>
                        {canEditCard(card.employee_code) && (
                          <IconButton 
                            onClick={() => handleEdit(card)}
                            color="secondary"
                            size="small"
                            title="Edit Card"
                            sx={{ 
                              padding: '4px',
                              '&:hover': { backgroundColor: 'rgba(219, 93, 4, 0.1)' }
                            }}
                          >
                            <EditIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                        )}
                        {canDeleteCard(card.employee_code) && (
                          <IconButton 
                            onClick={() => handleDelete(card.employee_code)}
                            color="error"
                            size="small"
                            title="Delete Card"
                            sx={{ 
                              padding: '4px',
                              '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[25, 50, 100]}
            component="div"
            count={filteredCards.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
            sx={{
              '.MuiTablePagination-toolbar': {
                backgroundColor: '#DB5D04',
                color: '#ffffff',
                padding: '8px 16px',
              },
              '.MuiTablePagination-selectLabel': {
                color: '#ffffff',
                margin: 0,
              },
              '.MuiTablePagination-displayedRows': {
                color: '#ffffff',
                margin: 0,
              },
              '.MuiTablePagination-actions': {
                marginLeft: 'auto',
              },
              '.MuiIconButton-root': {
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '.MuiSelect-select': {
                color: '#ffffff',
              },
              '.MuiSelect-icon': {
                color: '#ffffff',
              },
              '.MuiInputBase-root': {
                color: '#ffffff',
              },
              '.MuiInputBase-input': {
                color: '#ffffff',
              },
              '.MuiFormControl-root': {
                color: '#ffffff',
              }
            }}
          />
        </Paper>
      )}

      {!viewport.isMobile && filteredCards.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? 'No cards found matching your search.' : 'No cards found.'}
          </Typography>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, card: null, form: {} })} 
        maxWidth="md" 
        fullWidth
        fullScreen={viewport.isMobile}
      >
        <DialogTitle>Edit Card: {editDialog.card?.employee_code}</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: viewport.isMobile ? '1fr' : '1fr 1fr', 
            gap: 2, 
            mt: 2 
          }}>
            <TextField
              label="Name"
              value={editDialog.form.name || ''}
              onChange={(e) => handleEditChange('name', e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              value={editDialog.form.email || ''}
              onChange={(e) => handleEditChange('email', e.target.value)}
              fullWidth
            />
            <TextField
              label="Phone"
              value={editDialog.form.phone || ''}
              onChange={(e) => handleEditChange('phone', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editDialog.form.role || 'user'}
                onChange={(e) => handleEditChange('role', e.target.value)}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Department"
              value={editDialog.form.department || ''}
              onChange={(e) => handleEditChange('department', e.target.value)}
              fullWidth
            />
            <TextField
              label="Designation"
              value={editDialog.form.designation || ''}
              onChange={(e) => handleEditChange('designation', e.target.value)}
              fullWidth
            />
            <TextField
              label="Company"
              value={editDialog.form.company || ''}
              onChange={(e) => handleEditChange('company', e.target.value)}
              fullWidth
            />
            <TextField
              label="Branch"
              value={editDialog.form.branch || ''}
              onChange={(e) => handleEditChange('branch', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editDialog.form.status || 'active'}
                onChange={(e) => handleEditChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Address"
              value={editDialog.form.address || ''}
              onChange={(e) => handleEditChange('address', e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{ gridColumn: viewport.isMobile ? '1' : '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, card: null, form: {} })}>
            Cancel
          </Button>
          <Button onClick={handleEditSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewAllCards; 