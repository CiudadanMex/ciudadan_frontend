import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  ActivityTimeline,
  DocumentGrid,
  FinalActions,
  OperativeChecklist,
  ReviewerObservations,
  VerificationHeader,
  VerificationSidebar,
} from '../../components/Taxis/driver-verification';
import { getValidationReviewBundle } from '../../services/driverVerification/gettters';
import { mapValidationToReviewViewModel } from '../../services/driverVerification/validationMappers';

const DriverVerificationPage = () => {
  const { validationId } = useParams();
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationDetails, setValidationDetails] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [documents, setDocuments] = useState([]);
  const [observations, setObservations] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDetails = async () => {
      if (!validationId) {
        setError('No se proporcionó un ID de validación.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getValidationReviewBundle(validationId);
        if (!mounted) return;
        setValidationDetails(data);
      } catch (fetchError) {
        if (!mounted) return;
        setError(fetchError?.message || 'No se pudo cargar la validación del conductor.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      mounted = false;
    };
  }, [validationId, reloadKey]);

  const viewModel = useMemo(
    () => mapValidationToReviewViewModel(validationDetails),
    [validationDetails]
  );

  useEffect(() => {
    if (!viewModel) return;
    setDocuments(viewModel.documents || []);
    setObservations(viewModel.observations || '');
  }, [viewModel]);

  useEffect(() => {
    if (!viewModel?.sections?.length) return;
    if (viewModel.sections.some((section) => section.id === activeSection)) return;
    setActiveSection(viewModel.sections[0].id);
  }, [activeSection, viewModel]);

  const updateDocumentStatus = (docId, status) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, status } : doc)));
  };

  const handleApprove = (docId) => updateDocumentStatus(docId, 'approved');
  const handleReject = (docId) => updateDocumentStatus(docId, 'rejected');
  const handleRequestResub = (docId) => updateDocumentStatus(docId, 'resub_requested');

  if (loading) {
    return (
      <Box sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Cargando expediente de validación...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => setReloadKey((prev) => prev + 1)}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!viewModel) {
    return (
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Alert severity="info">No hay información disponible para esta validación.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            lg: '260px minmax(0, 1fr) 320px',
          },
          gridTemplateAreas: {
            xs: '"header" "main" "left" "right"',
            lg: '"header header header" "left main right"',
          },
          alignItems: 'start',
        }}
      >
        <Box sx={{ gridArea: 'header' }}>
          <VerificationHeader driver={viewModel.driver} validation={viewModel.validation} />
        </Box>

        <Box sx={{ gridArea: 'left', minWidth: 0 }}>
          <VerificationSidebar
            sections={viewModel.sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            score={viewModel.score}
          />
        </Box>

        <Box sx={{ gridArea: 'main', minWidth: 0 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <DocumentGrid
              documents={documents}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestResub={handleRequestResub}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              vehicle={viewModel.vehicle}
              biometric={viewModel.biometric}
            />
          </Paper>
        </Box>

        <Box sx={{ gridArea: 'right', minWidth: 0 }}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Checklist operativo
              </Typography>
              <OperativeChecklist documents={documents} />
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Observaciones del revisor
              </Typography>
              <ReviewerObservations
                value={observations}
                onChange={setObservations}
                onSave={() => {}}
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Actividad reciente
              </Typography>
              <ActivityTimeline events={viewModel.events} />
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Acciones finales
              </Typography>
              <FinalActions
                documents={documents}
                onApprove={() => {}}
                onReject={() => {}}
                onRequestResub={() => {}}
              />
            </Paper>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default DriverVerificationPage;
