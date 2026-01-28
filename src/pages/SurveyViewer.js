import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Print,
  PictureAsPdf,
  Description as DocIcon,
  Article
} from '@mui/icons-material';
import { surveyAPI } from '../services/api';

const SurveyViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportAnchor, setExportAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const response = await surveyAPI.getOne(id);
      setSurvey(response.data.survey);

      if (response.data.survey.status !== 'completed') {
        navigate(`/survey/${id}/progress`);
      }
    } catch (err) {
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportAnchor(null);
    setExporting(true);

    try {
      const response = await surveyAPI.export(id, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'markdown' ? 'md' : format;
      link.setAttribute('download', `survey_${id}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export survey');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !survey) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Survey not found'}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* AppBar */}
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '@media print': {
            display: 'none'
          }
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
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1, fontWeight: 'bold' }}>
            Literature Survey
          </Typography>

          <Button
            color="inherit"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Print
          </Button>

          <Button
            color="inherit"
            startIcon={exporting ? <CircularProgress size={20} /> : <Download />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            disabled={exporting}
          >
            Export
          </Button>

          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
          >
            <MenuItem onClick={() => handleExport('pdf')}>
              <PictureAsPdf sx={{ mr: 1 }} /> Export as PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('docx')}>
              <DocIcon sx={{ mr: 1 }} /> Export as DOCX
            </MenuItem>
            <MenuItem onClick={() => handleExport('markdown')}>
              <Article sx={{ mr: 1 }} /> Export as Markdown
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Survey Metadata */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 3,
            '@media print': {
              boxShadow: 'none',
              border: 'none'
            }
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {survey.topic}
          </Typography>

          {survey.additionalInfo && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {survey.additionalInfo}
            </Typography>
          )}

          <Box display="flex" gap={2} flexWrap="wrap" mt={2}>
            <Chip
              label={`Created: ${new Date(survey.createdAt).toLocaleDateString()}`}
              size="small"
            />
            {survey.completedAt && (
              <Chip
                label={`Completed: ${new Date(survey.completedAt).toLocaleDateString()}`}
                size="small"
              />
            )}
            {survey.generatedSurvey?.wordCount && (
              <Chip
                label={`${survey.generatedSurvey.wordCount} words`}
                size="small"
                color="primary"
              />
            )}
            {survey.retrievedPapers?.length > 0 && (
              <Chip
                label={`${survey.retrievedPapers.length} papers`}
                size="small"
                color="secondary"
              />
            )}
          </Box>
        </Paper>

        {/* Quality Reports */}
        <Box
          display="flex"
          gap={2}
          mb={3}
          sx={{
            '@media print': {
              display: 'none'
            }
          }}
        >
          {survey.verificationReport && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Verification Score
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {survey.verificationReport.confidenceScore}%
                </Typography>
              </CardContent>
            </Card>
          )}

          {survey.plagiarismReport && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Originality Score
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {survey.plagiarismReport.originalityScore}%
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Survey Content */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            '@media print': {
              boxShadow: 'none',
              border: 'none'
            }
          }}
        >
          {survey.generatedSurvey?.content ? (
            <Box
              sx={{
                '& h1': {
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  mt: 4,
                  mb: 2
                },
                '& h2': {
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  mt: 3,
                  mb: 2
                },
                '& h3': {
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  mt: 2,
                  mb: 1
                },
                '& p': {
                  lineHeight: 1.8,
                  mb: 2,
                  textAlign: 'justify'
                },
                '& ul, & ol': {
                  pl: 3,
                  mb: 2
                },
                '& li': {
                  mb: 1
                }
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: survey.generatedSurvey.content
                    .replace(/\n/g, '<br />')
                    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                }}
              />
            </Box>
          ) : (
            <Alert severity="info">
              Survey content is being generated. Please check back later.
            </Alert>
          )}

          {/* Citations */}
          {survey.citations && survey.citations.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h5" fontWeight="600" gutterBottom>
                References
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                {survey.citations.map((citation, index) => (
                  <Typography
                    component="li"
                    key={index}
                    variant="body2"
                    sx={{ mb: 1 }}
                  >
                    {citation.formattedCitation}
                  </Typography>
                ))}
              </Box>
            </>
          )}
        </Paper>

        {/* Retrieved Papers */}
        {survey.retrievedPapers && survey.retrievedPapers.length > 0 && (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mt: 3,
              '@media print': {
                display: 'none'
              }
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Retrieved Papers ({survey.retrievedPapers.length})
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {survey.retrievedPapers.slice(0, 10).map((paper, index) => (
                <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                  <strong>{paper.title}</strong>
                  {paper.authors && paper.authors.length > 0 && (
                    <> - {paper.authors.join(', ')}</>
                  )}
                  {paper.year && <> ({paper.year})</>}
                  {paper.source && (
                    <Chip
                      label={paper.source}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SurveyViewer;
