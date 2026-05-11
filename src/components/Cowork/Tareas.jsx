import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";

const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || "http://localhost:1337";

// convertir minutos a hh:mm
const minutosAHoras = (min = 0) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const TareaCard = ({ tarea }) => {
  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        bgcolor: "#002200",
        color: "white",
        width: "100%",
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        gap={2}
      >
        {/* titulo */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.1rem", md: "1.25rem" },
          }}
        >
          {tarea.titulo}
        </Typography>

        {/* datos */}
        <Box
          display="flex"
          flexWrap="wrap"
          gap={2}
          justifyContent={{ xs: "flex-start", md: "flex-end" }}
        >
          <Typography variant="body2">
            ⏱ {tarea.tiempoMin} min ({minutosAHoras(tarea.tiempoMin)})
          </Typography>

          <Typography variant="body2">
            💎 {tarea.labory}
          </Typography>

          <Typography variant="body2">
            💵 ${tarea.efectivo}
          </Typography>

          <Typography variant="body2">
            📅 {tarea.fechaEntrega || "—"}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const Tareas = ({ userId }) => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTareas = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${STRAPI_URL}/api/tareas?filters[usuario][id][$eq]=${userId}&populate[todo]=*`
        );

        if (!res.ok) throw new Error("Error cargando tareas");

        const json = await res.json();

        if (!json.data || json.data.length === 0) {
          setTareas([]);
          setLoading(false);
          return;
        }

        const parsed = json.data.map((t) => {
          const attrs = t.attributes || t;
          const todo = attrs.todo?.data?.attributes || attrs.todo || {};

          return {
            id: t.id,
            titulo: todo.titulo || attrs.titulo || "Sin título",
            tiempoMin: todo.minutos_desarrollo || 0,
            labory: todo.recompensa || 0,
            efectivo: todo.pagos_efectivo || 0,
            fechaEntrega: todo.fecha_entrega || null,
          };
        });

        setTareas(parsed);
      } catch (err) {
        setError("No se pudieron cargar las tareas");
      }

      setLoading(false);
    };

    fetchTareas();
  }, [userId]);

  // loading
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>Cargando tareas...</Typography>
      </Box>
    );
  }

  // error
  if (error) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // sin tareas
  if (tareas.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            opacity: 0.8,
            fontSize: { xs: "1.1rem", md: "1.3rem" },
          }}
        >
          No tienes tareas asignadas
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, md: 3 },
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {tareas.map((tarea) => (
          <Grid item xs={12} key={tarea.id}>
            <TareaCard tarea={tarea} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Tareas;