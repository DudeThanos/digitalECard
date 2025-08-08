import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Footer from '../components/Footer';

const BulkUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/csv/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(`Upload completed! Created: ${res.data.created}, Failed: ${res.data.failed}`);
      setResults(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `employee_code,first_name,last_name,name,email,phone,photo_url,password,role,department,designation,company,branch,address,status
hr-emp-0001,John,Doe,John Doe,john@example.com,1234567890,,password123,user,IT,Developer,Kaynes Branch 1,Mysore,"123 Main St",active
hr-emp-0002,Jane,Smith,Jane Smith,jane@example.com,9876543210,,password456,user,HR,Manager,Kaynes Branch 2,Bangalore,"456 Oak Ave",active
hr-emp-0003,Bob,Johnson,Bob Johnson,bob@example.com,5551234567,,password789,user,Finance,Accountant,Kaynes Branch 3,Chennai,"789 Pine Rd",active`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_users.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 6, p: 3 }}>
      <Typography variant="h5" mb={2}>Bulk CSV Upload</Typography>
      
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Upload CSV File</Typography>
        <Box sx={{ mb: 2 }}>
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-file-input"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-input">
            <Button variant="contained" component="span">
              Choose CSV File
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {file.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploading}
          sx={{ mr: 2 }}
        >
          {uploading ? <CircularProgress size={20} /> : 'Upload'}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Sample CSV</Typography>
        <Typography variant="body2" mb={2}>
          Download a sample CSV file to see the required format:
        </Typography>
        <Button variant="outlined" onClick={downloadSampleCSV}>
          Download Sample CSV
        </Button>
      </Paper>

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Upload Results</Typography>
          
          {results.results && results.results.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" mb={1}>Successfully Created:</Typography>
              <List dense>
                {results.results.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`${item.name || item.employee_code}`}
                      secondary={`Code: ${item.employee_code} | Email: ${item.email} | Branch: ${item.branch || ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {results.failed && results.failed.length > 0 && (
            <Box>
              <Typography variant="subtitle1" mb={1} color="error">Failed to Create:</Typography>
              <List dense>
                {results.failed.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`${item.record?.name || item.record?.employee_code || 'Unknown'}`}
                      secondary={`Branch: ${item.record?.branch || ''} | Error: ${item.error}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      )}
      <Footer showDeveloper={true} />
    </Box>
  );
};

export default BulkUpload; 