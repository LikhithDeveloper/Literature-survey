import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Container,
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  RadioButtonUnchecked,
  HourglassEmpty,
  Description,
  Search,
  Article,
  FormatQuote,
  VerifiedUser,
  Plagiarism
} from '@mui/icons-material';
import { surveyAPI } from '../services/api';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const SurveyProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState('');
  const [message, setMessage] = useState('Initializing...');
  const [agentStatuses, setAgentStatuses] = useState({
    document_retrieval: 'pending',
    paper_retrieval: 'pending',
    summarization: 'pending',
    citation: 'pending',
    verification: 'pending',
    plagiarism_check: 'pending'
  });
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Fetch survey details
    fetchSurvey();

    // Connect to Socket.IO
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join_survey', id);
    });

    socket.on('progress_update', (data) => {
      console.log('Progress update:', data);
      setProgress(data.progress || 0);
      setCurrentAgent(data.agent || '');
      setMessage(data.message || '');

      // Update agent status
      if (data.agent) {
        setAgentStatuses((prev) => ({
          ...prev,
          [data.agent]: data.progress === 100 ? 'completed' : 'processing'
        }));
      }
    });

    socket.on('agent_started', (data) => {
      console.log('Agent started:', data);
      setAgentStatuses((prev) => ({
        ...prev,
        [data.agent]: 'processing'
      }));
    });

    socket.on('agent_completed', (data) => {
      console.log('Agent completed:', data);
      setAgentStatuses((prev) => ({
        ...prev,
        [data.agent]: 'completed'
      }));
    });

    socket.on('survey_completed', (data) => {
      console.log('Survey completed:', data);
      setCompleted(true);
      setProgress(100);
      setMessage('Survey completed successfully!');
    });

    socket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message || 'An error occurred');
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const response = await surveyAPI.getOne(id);
      setSurvey(response.data.survey);
      setProgress(response.data.survey.progress || 0);
      setCurrentAgent(response.data.survey.currentAgent || '');

      // Check if already completed
      if (response.data.survey.status === 'completed') {
        setCompleted(true);
        navigate(`/survey/${id}`);
      }
    } catch (err) {
      setError('Failed to load survey');
    }
  };

  const agents = [
    {
      key: 'document_retrieval',
      name: 'Document Retrieval',
      icon: <Description />,
      description: 'Extracting text from uploaded documents'
    },
    {
      key: 'paper_retrieval',
      name: 'Paper Retrieval',
      icon: <Search />,
      description: 'Searching for relevant research papers'
    },
    {
      key: 'summarization',
      name: 'Summarization',
      icon: <Article />,
      description: 'Generating literature survey'
    },
    {
      key: 'citation',
      name: 'Citation',
      icon: <FormatQuote />,
      description: 'Adding citations and bibliography'
    },
    {
      key: 'verification',
      name: 'Verification',
      icon: <VerifiedUser />,
      description: 'Verifying facts and claims'
    },
    {
      key: 'plagiarism_check',
      name: 'Plagiarism Check',
      icon: <Plagiarism />,
      description: 'Checking for plagiarism'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
        return <HourglassEmpty color="primary" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      default:
        return 'default';
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
            Survey Progress
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Survey Info */}
        {survey && (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" fontWeight="600" gutterBottom>
              {survey.topic}
            </Typography>
            {survey.additionalInfo && (
              <Typography variant="body2" color="text.secondary">
                {survey.additionalInfo}
              </Typography>
            )}
          </Paper>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Completion Alert */}
        {completed && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(`/survey/${id}`)}
              >
                View Survey
              </Button>
            }
          >
            Survey completed successfully! You can now view and download your literature survey.
          </Alert>
        )}

        {/* Overall Progress */}
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="600">
              Overall Progress
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {Math.round(progress)}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              mb: 2,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }
            }}
          />

          <Typography variant="body2" color="text.secondary" textAlign="center">
            {message}
          </Typography>
        </Paper>

        {/* Agent Status List */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Agent Pipeline
          </Typography>

          <List>
            {agents.map((agent, index) => (
              <ListItem
                key={agent.key}
                sx={{
                  bgcolor:
                    agentStatuses[agent.key] === 'processing'
                      ? 'action.hover'
                      : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor:
                    agentStatuses[agent.key] === 'processing'
                      ? 'primary.main'
                      : 'divider'
                }}
              >
                <ListItemIcon>{getStatusIcon(agentStatuses[agent.key])}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {index + 1}. {agent.name}
                      </Typography>
                      <Chip
                        label={agentStatuses[agent.key]}
                        size="small"
                        color={getStatusColor(agentStatuses[agent.key])}
                      />
                    </Box>
                  }
                  secondary={agent.description}
                />
                {agentStatuses[agent.key] === 'processing' && (
                  <CircularProgress size={24} />
                )}
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Estimated Time */}
        {!completed && (
          <Paper
            sx={{
              mt: 3,
              p: 3,
              textAlign: 'center',
              background:
                'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Estimated time remaining: 5-10 minutes
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              You can safely close this page. We'll send you an email when it's ready.
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SurveyProgress;
