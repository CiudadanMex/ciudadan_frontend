import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

// Íconos
import GroupIcon from '@mui/icons-material/Group';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaidIcon from '@mui/icons-material/Paid';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BookIcon from '@mui/icons-material/Book';
import Tareas, { TareaCard } from './../../components/Cowork/Tareas.jsx';
import TareasEspecializadas from './../../components/Cowork/TareasEspecializadas.jsx';
import EventosGrid from './../Eventos/EventosGrid.jsx';
import HerramientrasGrid from './../../components/Cowork/HerramientrasGrid.jsx';
import { useRoles } from '../../Contexts/RolesContext.jsx';
import { useSearchParams } from 'react-router-dom';
import { getGeneralTodos } from '../../services/cowork/queryServices.js';
import { createTask, updateTodoStatus } from '../../services/cowork/mutationsServices.js';
import { useRecurrenciaValidation } from '../../hooks/useRecurrenciaValidation.jsx';

// Colores base
const neonGreen = '#00ff99';
const amarilloCiudadan = '#f5c400';
const darkGray = '#1a1a1a';
const fondoVerdeOscuro = '#022b23'; // 🟢 Nuevo color de fondo

const getTabFromSearchParams = (searchParams) => {
  const tabParam = searchParams.get('tab');

  switch (tabParam) {
    case 'socio':
      return 0;
    case 'generales':
      return 1;
    case 'especializadas':
      return 2;
    default:
      return 0;
  }
};

// 🔹 Tabs principales (barra amarilla)
const StyledTab = styled(Tab)(({ theme }) => ({
  color: 'white',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.9rem',
  padding: theme.spacing(1.5, 3),
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '& .MuiSvgIcon-root': {
    fontSize: '1.3rem',
  },
  '&.Mui-selected': {
    color: amarilloCiudadan,
  },
  '&:hover': {
    color: amarilloCiudadan,
  },
}));

const StyledTabs = styled((props) => (
  <Tabs {...props} TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }} />
))({
  '& .MuiTabs-indicator': {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 3,
  },
  '& .MuiTabs-indicatorSpan': {
    width: '60%',
    backgroundColor: amarilloCiudadan,
    borderRadius: 2,
    boxShadow: `0 0 10px ${amarilloCiudadan}`,
  },
});

// 🔹 Subtabs (barra verde neón)
const SubTab = styled(Tab)(({ theme }) => ({
  color: '#bbb',
  fontWeight: 500,
  textTransform: 'none',
  fontSize: '0.9rem',
  padding: theme.spacing(1.2, 2),
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
  },
  '&.Mui-selected': {
    color: neonGreen,
    textShadow: `0 0 6px ${neonGreen}`,
  },
  '&:hover': {
    color: neonGreen,
  },
}));

const SubTabs = styled((props) => (
  <Tabs {...props} TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }} />
))({
  '& .MuiTabs-indicator': {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 2,
  },
  '& .MuiTabs-indicatorSpan': {
    width: '40%',
    backgroundColor: neonGreen,
    borderRadius: 2,
    boxShadow: `0 0 8px ${neonGreen}`,
  },
});

const CooWork = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => getTabFromSearchParams(searchParams));
  const [subTab, setSubTab] = useState(0);
  const [generalTodos, setGeneralTodos] = useState([]);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [resolvingGeneralId, setResolvingGeneralId] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const theme = useTheme();
  const { userData } = useRoles();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { canUserTakeTask } = useRecurrenciaValidation();

  useEffect(() => {
    if (!searchParams.get('tab')) return;
    setTab(getTabFromSearchParams(searchParams));
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleTabChange = (event, newValue) => setTab(newValue);
  const handleSubTabChange = (event, newValue) => setSubTab(newValue);

  const fetchGeneralTodos = useCallback(async () => {
    try {
      setLoadingGeneral(true);
      setGeneralError(null);
      const json = await getGeneralTodos();
      setGeneralTodos(
        (json.data || [])
          .map((item) => {
            const attrs = item.attributes || item;
            return {
              id: item.id,
              titulo: attrs.titulo || 'Sin título',
              descripcion: attrs.descripcion || '',
              tiempoMin: attrs.minutos_desarrollo || 0,
              labory: attrs.recompensa ?? attrs.pagos_laborys ?? 0,
              efectivo: attrs.pagos_efectivo || 0,
              fechaEntrega: attrs.fecha_entrega || null,
              status: attrs.status,
              nivel: attrs.nivel,
              recurrencia: attrs.recurrencia,
            };
          })
          .filter((todo) => todo.status === 'publicada' && todo.nivel === 'general')
      );
    } catch (err) {
      console.error('Error cargando tareas generales:', err);
      setGeneralError('No se pudieron cargar las tareas generales');
    } finally {
      setLoadingGeneral(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 1) fetchGeneralTodos();
  }, [tab, fetchGeneralTodos]);

  const handleResolveGeneral = useCallback(
    async (todo) => {
      const userId = userData?.id;
      if (!userId) return;

      if (!canUserTakeTask(todo, userId)) {
        setGeneralError('Esta tarea ya no está disponible para ser asignada.');
        return;
      }

      try {
        setResolvingGeneralId(todo.id);
        setGeneralError(null);

        await createTask(userId, todo.id);
        await updateTodoStatus(todo.id, 'asignada');

        setGeneralTodos((prev) => prev.filter((t) => t.id !== todo.id));
      } catch (err) {
        console.error('Error asignando tarea general:', err);
        setGeneralError(err.message || 'No se pudo asignar la tarea');
      } finally {
        setResolvingGeneralId(null);
      }
    },
    [userData?.id, canUserTakeTask]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: fondoVerdeOscuro, // 🟢 Fondo aplicado aquí
        color: 'white',
        pb: 6,
      }}
    >
      {/* 🟨 Barra amarilla de tabs principales */}
      <Box
        sx={{
          width: '100%',
          bgcolor: 'purple',
          color: 'white',
          top: 64,
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center' }}>
          <StyledTabs
            value={tab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            allowScrollButtonsMobile
            centered={!isMobile}
          >
            <StyledTab icon={<GroupIcon />} label="Socio" />
            <StyledTab icon={<WorkOutlineIcon />} label="Tareas Generales" />
            <StyledTab icon={<PrecisionManufacturingIcon />} label="Tareas Especializadas" />
          </StyledTabs>
        </Container>
      </Box>
      {/* 💚 Sub-barra (solo en Socio) */}
      <AnimatePresence>
        {tab === 0 && (
          <motion.div
            key="subbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                width: '100%',
                bgcolor: darkGray,
                color: 'white',
                borderTop: '1px solid #333',
                borderBottom: '1px solid #333',
              }}
            >
              <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center' }}>
                <SubTabs
                  value={subTab}
                  onChange={handleSubTabChange}
                  variant={isMobile ? 'scrollable' : 'standard'}
                  scrollButtons={isMobile ? 'auto' : false}
                  allowScrollButtonsMobile
                  centered={!isMobile}
                >
                  <SubTab icon={<AssignmentIcon />} label="Tareas" />
                  <SubTab icon={<BuildIcon />} label="Herramientas" />
                  <SubTab icon={<BookIcon />} label="Bitácora" />
                  <SubTab icon={<PaidIcon />} label="Historial de Pagos" />
                </SubTabs>
              </Container>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 🔸 Contenido principal */}
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        {tab === 0 && (
          <motion.div
            key="socio-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {subTab === 0 && <Tareas userId={userData?.id} subTab={subTab} />}
            {subTab === 1 && <HerramientrasGrid />}
            {subTab === 2 && <EventosGrid />}
            {subTab === 3 && (
              <>
                <Typography variant="h5" fontWeight={700} gutterBottom color="white">
                  💸 Historial de Pagos
                </Typography>
                <Typography color="#ccc">
                  Consulta tus aportaciones, movimientos y balances personales.
                </Typography>
              </>
            )}
          </motion.div>
        )}

        {tab === 1 && (
          <motion.div
            key="generales"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom color="white">
              🧱 Tareas Generales
            </Typography>
            <Typography color="#ccc" sx={{ mb: 3 }}>
              Estas tareas están disponibles para que cualquier socio las resuelva.
            </Typography>

            {generalError && (
              <Typography color="error" sx={{ mb: 2 }}>
                {generalError}
              </Typography>
            )}

            {loadingGeneral ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: amarilloCiudadan }} />
              </Box>
            ) : generalTodos.length === 0 ? (
              <Typography sx={{ color: '#aaa', textAlign: 'center', py: 6 }}>
                No hay tareas generales disponibles en este momento.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {generalTodos.map((todo) => (
                  <TareaCard
                    key={todo.id}
                    tarea={todo}
                    actions={
                      canUserTakeTask(todo, userData?.id) ? (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={resolvingGeneralId === todo.id}
                          onClick={() => handleResolveGeneral(todo)}
                          sx={{
                            bgcolor: neonGreen,
                            color: '#002200',
                            fontWeight: 700,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#00e68a' },
                            '&.Mui-disabled': {
                              bgcolor: 'rgba(0,255,153,0.3)',
                              color: '#004d33',
                            },
                          }}
                        >
                          {resolvingGeneralId === todo.id ? 'Asignando...' : 'Resolver tarea'}
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </Stack>
            )}
          </motion.div>
        )}

        {tab === 2 && (
          <motion.div
            key="especializadas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom color="white">
              ⚙️ Tareas Especializadas
            </Typography>
            <Typography color="#ccc">
              Gestiona tareas técnicas y de alto impacto dentro del ecosistema Ciudadan.
            </Typography>
            <TareasEspecializadas />
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default CooWork;
