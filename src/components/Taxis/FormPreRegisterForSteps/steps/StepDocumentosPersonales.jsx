import React from "react";
import { Grid2 as Grid, Typography } from "@mui/material";
import DocumentUploadField from "../DocumentUploadField";

const fields = [
  { name: "foto_perfil", label: "Foto de perfil", helper: "Imagen clara de tu rostro.", required: true },
  {
    name: "selfie_verificacion",
    label: "Selfie de verificacion",
    helper: "Selfie actual para validar identidad.",
    required: true,
  },
  { name: "ine_frente", label: "INE frente", helper: "Foto o PDF legible.", required: true },
  { name: "ine_reverso", label: "INE reverso", helper: "Foto o PDF legible.", required: true },
  { name: "licencia_frente", label: "Licencia frente", helper: "Licencia vigente por ambos lados.", required: true },
  { name: "licencia_reverso", label: "Licencia reverso", helper: "Licencia vigente por ambos lados.", required: true },
  {
    name: "comprobante_domicilio",
    label: "Comprobante de domicilio",
    helper: "Recibo reciente. Puedes subir mas de uno.",
    required: true,
  },
];

const StepDocumentosPersonales = () => {
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Typography variant="h6" fontWeight={800}>
          Documentos personales
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

export default StepDocumentosPersonales;
