import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Delete,
  Description,
  Send
} from '@mui/icons-material';
import { surveyAPI } from '../services/api';

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topic: '',
    additionalInfo: ''
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    // Filter for PDF, DOC, DOCX only
    const validFiles = acceptedFiles.filter((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['pdf', 'doc', 'docx'].includes(ext);
    });

    if (validFiles.length !== acceptedFiles.length) {
      setError('Only PDF, DOC, and DOCX files are allowed');
    } else {
      setError('');
    }

    setFiles((prev) => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    if (formData.topic.length < 10) {
      setError('Topic must be at least 10 characters long');
      return;
    }

    setLoading(true);

    try {
      // Create FormData
      const data = new FormData();
      data.append('topic', formData.topic);
      data.append('additionalInfo', formData.additionalInfo);

      // Append files
      files.forEach((file) => {
        data.append('documents', file);
      });

      // Submit
      const response = await surveyAPI.create(data);
      const surveyId = response.data.surveyId;

      // Navigate to progress page
      navigate(`/survey/${surveyId}/progress`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create survey');
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* AppBar */}
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
            Create Literature Survey
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            Survey Details
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Provide information about your literature survey
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Topic */}
            <TextField
              fullWidth
              label="Topic *"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              margin="normal"
              placeholder="e.g., Machine Learning in Healthcare"
              helperText="Enter the main topic for your literature survey (min 10 characters)"
              inputProps={{ minLength: 10, maxLength: 200 }}
            />

            {/* Additional Info */}
            <TextField
              fullWidth
              label="Additional Information"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="e.g., Focus on diagnostic applications, recent papers from 2020-2024, specific keywords..."
              helperText="Optional: Provide specific focus areas, keywords, time period, or other constraints"
              inputProps={{ maxLength: 1000 }}
            />

            {/* File Upload */}
            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Upload Documents (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Upload relevant papers or documents (PDF, DOC, DOCX). Max 10 files, 10MB each.
              </Typography>

              <Paper
                {...getRootProps()}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  {isDragActive
                    ? 'Drop files here...'
                    : 'Drag & drop files here, or click to select'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported: PDF, DOC, DOCX (Max 10MB per file)
                </Typography>
              </Paper>

              {/* File List */}
              {files.length > 0 && (
                <List sx={{ mt: 2 }}>
                  {files.map((file, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        bgcolor: 'background.paper',
                        mb: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Description sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveFile(index)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {files.length > 0 && (
                <Chip
                  label={`${files.length} file(s) selected`}
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>

            {/* Submit Button */}
            <Box mt={4} display="flex" gap={2}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                sx={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
                  }
                }}
              >
                {loading ? 'Creating Survey...' : 'Start Survey'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Info Box */}
        <Paper
          sx={{
            mt: 3,
            p: 3,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
          }}
        >
          <Typography variant="subtitle2" fontWeight="600" gutterBottom>
            What happens next?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Our AI agents will:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Extract and analyze content from your uploaded documents
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Search and retrieve relevant research papers from ArXiv, Semantic Scholar, and PubMed
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Generate a comprehensive, well-structured literature survey
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Add proper citations and bibliography
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Verify facts and check for plagiarism
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={2}>
            Estimated time: 10-15 minutes
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateSurvey;
