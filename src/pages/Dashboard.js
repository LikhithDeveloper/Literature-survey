import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add,
  AccountCircle,
  Logout,
  Description,
  Delete,
  Visibility,
  Download,
  Pending,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { surveyAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await surveyAPI.getAll();
      setSurveys(response.data.surveys);
    } catch (err) {
      setError('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await surveyAPI.delete(id);
        setSurveys(surveys.filter((s) => s._id !== id));
      } catch (err) {
        alert('Failed to delete survey');
      }
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
        return <HourglassEmpty color="primary" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <Pending color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            LIT GENIUS
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              My Literature Surveys
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.name}!
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate('/create-survey')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 3,
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
              }
            }}
          >
            Create New Survey
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : surveys.length === 0 ? (
          /* Empty State */
          <Paper
            sx={{
              p: 8,
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
            }}
          >
            <Description sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No surveys yet
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Create your first literature survey to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/create-survey')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Create Survey
            </Button>
          </Paper>
        ) : (
          /* Survey Grid */
          <Grid container spacing={3}>
            {surveys.map((survey) => (
              <Grid item xs={12} md={6} lg={4} key={survey._id}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Chip
                        icon={getStatusIcon(survey.status)}
                        label={survey.status.toUpperCase()}
                        color={getStatusColor(survey.status)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(survey.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Typography variant="h6" gutterBottom fontWeight="600" noWrap>
                      {survey.topic}
                    </Typography>

                    {survey.additionalInfo && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {survey.additionalInfo}
                      </Typography>
                    )}

                    {survey.status === 'processing' && (
                      <Box mt={2}>
                        <Typography variant="caption" color="text.secondary">
                          Progress: {survey.progress}%
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            height: 6,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            mt: 0.5
                          }}
                        >
                          <Box
                            sx={{
                              width: `${survey.progress}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                              borderRadius: 1,
                              transition: 'width 0.3s'
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box>
                      {survey.status === 'processing' && (
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/survey/${survey._id}/progress`)}
                        >
                          View Progress
                        </Button>
                      )}
                      {survey.status === 'completed' && (
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/survey/${survey._id}`)}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(survey._id)}
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
