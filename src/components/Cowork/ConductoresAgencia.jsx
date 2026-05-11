import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

const neonGreen = '#00ff99';
const darkGray = '#1a1a1a';

const RowCard = styled(Paper)(({ theme }) => ({
  backgroundColor: darkGray,
  color: 'white',
  padding: theme.spacing(2),
  border: `1px solid ${neonGreen}`,
  borderRadius: 8,
  transition: 'all 0.25s ease',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  '&:hover': {
    boxShadow: `0 0 12px ${neonGreen}`,
    transform: 'translateY(-2px)',
  },
}));

const ConductoresAgencia = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const STRAPI_URL = process.env.REACT_APP_STRAPI_URL;

  useEffect(() => {
    const fetchConductores = async () => {
      try {
        const url = `${STRAPI_URL}/api/agendas?filters[descripcion][$containsi]=Preregistro conductor&filters[estado][$eq]=pendiente&sort=createdAt:desc`;

        const res = await fetch(url);
        const json = await res.json();

        setData(json.data || []);
      } catch (error) {
        console.error('Error cargando conductores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConductores();
  }, [STRAPI_URL]);

  const goToDetalle = (id) => {
    const link = `/herramientas/procesar-conductor/${id}`;
    window.history.pushState({}, '', link);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, color: 'white', fontWeight: 600 }}
      >
        Conductores pendientes
      </Typography>

      <Grid container spacing={2}>
        {data.map((item) => {
          const a = item.attributes;

          return (
            <Grid item xs={12} key={item.id}>
              <RowCard onClick={() => goToDetalle(item.id)}>
                <DirectionsCarIcon sx={{ color: neonGreen }} />

                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={600}>
                    {a.titulo || 'Sin título'}
                  </Typography>

                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {a.ciudad} {a.estado ? `• ${a.estado}` : ''}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5, opacity: 0.6 }}
                  >
                    {a.descripcion}
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{ color: neonGreen, fontWeight: 600 }}
                >
                  Ver →
                </Typography>
              </RowCard>
            </Grid>
          );
        })}
      </Grid>

      {data.length === 0 && (
        <Typography sx={{ mt: 3, opacity: 0.6 }}>
          No hay conductores pendientes
        </Typography>
      )}
    </Box>
  );
};

export default ConductoresAgencia;