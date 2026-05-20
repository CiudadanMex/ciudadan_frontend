import React from "react";
import { Grid2 as Grid, Typography } from "@mui/material";
import DocumentUploadField from "../DocumentUploadField";

const fields = [
  { name: "foto_vehiculo_frontal", label: "Foto vehiculo frontal", helper: "Toma frontal completa.", required: true },
  { name: "foto_vehiculo_lateral", label: "Foto vehiculo lateral", helper: "Al menos una lateral.", required: true },
  { name: "foto_vehiculo_trasera", label: "Foto vehiculo trasera", helper: "Debe ser legible.", required: true },
  { name: "foto_interior", label: "Foto interior", helper: "Muestra asientos y condiciones.", required: true },
  { name: "tarjeta_circulacion", label: "Tarjeta de circulacion", helper: "Documento vigente.", required: true },
  { name: "seguro_vehiculo", label: "Seguro del vehiculo", helper: "Poliza vigente.", required: true },
];

const StepFotosVehiculo = () => {
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Typography variant="h6" fontWeight={800}>
          Fotos y documentos del vehiculo
        </Typography>
      </Grid>
      {fields.map((item) => (
        <Grid size={{ xs: 12, md: 6 }} key={item.name}>
          <DocumentUploadField {...item} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StepFotosVehiculo;
