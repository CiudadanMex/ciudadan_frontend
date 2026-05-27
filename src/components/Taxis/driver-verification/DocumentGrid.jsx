import React from 'react';
import PropTypes from 'prop-types';
import { Box, Grid2 as Grid, Tab, Tabs, Typography } from '@mui/material';
import DocumentCard from './DocumentCard';
import VehicleDataCard from './VehicleDataCard';
import BiometricComparison from './BiometricComparison';

const DocumentGrid = ({
  documents,
  onApprove,
  onReject,
  onRequestResub,
  activeTab,
  onTabChange,
  vehicle,
  biometric,
}) => {
  const docsForGeneral = documents.filter((doc) => doc.type !== 'vehicle');
  const docsForVehicle = documents.filter((doc) => doc.type === 'vehicle');
  const showEmptyState = (copy) => (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {copy}
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, next) => onTabChange(next)} sx={{ mb: 2 }}>
        <Tab label="Identidad y documentos" />
        <Tab label="Vehículo" />
        <Tab label="Datos personales" />
        <Tab label="Comparación biométrica" />
      </Tabs>

      {activeTab === 0 && (
        docsForGeneral.length ? (
          <Grid container spacing={2}>
            {docsForGeneral.map((doc) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                <DocumentCard
                  doc={doc}
                  onApprove={onApprove}
                  onReject={onReject}
                  onRequestResub={onRequestResub}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          showEmptyState('No hay documentos de identidad disponibles.')
        )
      )}

      {activeTab === 1 && (
        docsForVehicle.length ? (
          <Grid container spacing={2}>
            {docsForVehicle.map((doc) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                <DocumentCard
                  doc={doc}
                  onApprove={onApprove}
                  onReject={onReject}
                  onRequestResub={onRequestResub}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          showEmptyState('No hay archivos del vehículo disponibles.')
        )
      )}

      {activeTab === 2 && <VehicleDataCard vehicle={vehicle} />}
      {activeTab === 3 && (
        <BiometricComparison
          selfieUrl={biometric?.selfieUrl}
          ineUrl={biometric?.ineUrl}
          similarityScore={biometric?.similarityScore}
        />
      )}
    </Box>
  );
};

DocumentGrid.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      note: PropTypes.string,
    })
  ).isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onRequestResub: PropTypes.func.isRequired,
  activeTab: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  vehicle: PropTypes.shape({
    brand: PropTypes.string,
    model: PropTypes.string,
    year: PropTypes.string,
    color: PropTypes.string,
    plates: PropTypes.string,
    vin: PropTypes.string,
  }),
  biometric: PropTypes.shape({
    selfieUrl: PropTypes.string,
    ineUrl: PropTypes.string,
    similarityScore: PropTypes.number,
  }),
};

export default DocumentGrid;
