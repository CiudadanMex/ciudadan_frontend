import React, { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import { useRoles } from '../../Contexts/RolesContext.jsx';
import {
  OnboardingIntro,
  SaveStatusIndicator,
  StepNavigation,
  WizardHeader,
  StepCuenta,
  StepVerificacion,
  StepDatosPersonales,
  StepDocumentosPersonales,
  StepLicencia,
  StepVehiculo,
  StepFotosVehiculo,
  StepCitaPresencial,
  StepResumen,
} from '../../components/Taxis/FormPreRegisterForSteps';
import { STEP_FIELDS, WIZARD_STEPS } from '../../utils/preRegisterForSteps/stepsConfig';
import { buildStepRules } from '../../utils/preRegisterForSteps/stepValidators.js';
import { useDraftPersistence } from '../../hooks/FormPreRegisterForSteps/useDraftPersistence';
import { useFileUploads } from '../../hooks/FormPreRegisterForSteps/useFileUploads';
import { usePreregistroWizard } from '../../hooks/FormPreRegisterForSteps/usePreregistroWizard';
import {
  buildFinalDriverPayload,
  DEFAULT_FORM_VALUES,
  hydrateFormFromDriver,
  toDriverPayloadByStep,
} from '../../services/FormPreRegisterForSteps/driverPayloadMappers.js';
import {
  createDriverAgenda,
  createDriverDraft,
  createValidationFromAgenda,
  fetchAgencies,
  fetchResubmissionContext,
  getLatestDriverAgendaByUser,
  getDriverDraftByUser,
  getUserByEmail,
  registerAccount,
  updateStrapiUserProfile,
  updateDriverDraft,
} from '../../services/FormPreRegisterForSteps/driverDraftApi.js';
import { getAgendaEstadoLabel } from '../../constants/agendaEstado';
import {
  getPendingResubFieldsForStep,
  getResubMetaByField,
  getPendingResubStepIds,
} from '../../utils/preRegisterForSteps/resubmissionFieldMap';
import { syncValidationFromDriver } from '../../services/driverVerification/setters.js';

const documentosDespues = [
  'Validacion fisica de originales en la cita',
  'Coincidencia de datos con tu identificacion',
  'Documentos complementarios que te indiquen en la revision',
  'Cualquier archivo faltante que el validador marque en la cita',
];

const AGENDA_FLOW_BYPASS_STORAGE_KEY = 'preregister_allow_existing_agenda_flow';

const isExistingAgendaBypassEnabled = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AGENDA_FLOW_BYPASS_STORAGE_KEY) === 'true';
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const buildUserProfilePayload = (values) => {
  const nombreCompleto = [values.nombre, values.apellido_paterno, values.apellido_materno]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');

  return {
    nombre_completo: nombreCompleto,
    telefono: String(values.telefono || '')
      .replace(/\D/g, '')
      .slice(0, 10),
    fecha_nacimiento: values.fecha_nacimiento
      ? new Date(`${values.fecha_nacimiento}T12:00:00`).toISOString()
      : null,
    ciudad: String(values.ciudad || '').trim(),
    curp: String(values.curp || '')
      .trim()
      .toUpperCase(),
    rfc: String(values.rfc || '')
      .trim()
      .toUpperCase(),
    verificado: false,
  };
};

const buildAgendaPayload = (values, userId, agencies = [], driverId = null) => {
  const appointmentDate = values.fecha ? new Date(values.fecha) : null;
  const isDateValid = appointmentDate && !Number.isNaN(appointmentDate.getTime());
  const selectedAgency = agencies.find((agency) => String(agency.id) === String(values.sede || ''));
  const nombreCompleto = [values.nombre, values.apellido_paterno, values.apellido_materno]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  const telefono = String(values.telefono || '')
    .replace(/\D/g, '')
    .slice(0, 10);
  const fechaISO = isDateValid ? appointmentDate.toISOString() : null;
  const ciudad = String(values.ciudad || '').trim() || selectedAgency?.nombre || '—';

  return {
    titulo: `Cita conductor ${nombreCompleto || 'sin nombre'}`,
    slug: `preregistro-conductor-${userId}-${Date.now()}`,
    usuario: userId,
    ciudad,
    estado: 'pendiente',
    fecha_inicio: fechaISO,
    descripcion: 'Preregistro conductor',
    observaciones: 'preregistro conductor',
    checked: false,
    metadata: {
      preregistro_conductor: {
        version: 1,
        user_id: userId,
        nombre_completo: nombreCompleto,
        telefono,
        fecha_nacimiento: values.fecha_nacimiento || null,
        ciudad,
        curp: String(values.curp || '')
          .trim()
          .toUpperCase(),
        rfc: String(values.rfc || '')
          .trim()
          .toUpperCase(),
        fecha_cita: fechaISO,
        sede_id: values.sede || null,
        sede_nombre: selectedAgency?.nombre || null,
        revisado_en: new Date().toISOString(),
        driver_id: driverId || null,
      },
    },
  };
};

const hasMediaReference = (value) =>
  Boolean(value?.id || value?.data?.id || value?.attributes?.url || value?.url);

const isMediaFieldValue = (value) => {
  if (!value) return false;
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (Array.isArray(value)) {
    return value.some(
      (item) => (typeof File !== 'undefined' && item instanceof File) || hasMediaReference(item)
    );
  }
  return hasMediaReference(value);
};

const buildResubmissionStepOrder = (requiredDocuments = []) => {
  const pendingStepIds = getPendingResubStepIds(requiredDocuments);
  const orderedPendingSteps = WIZARD_STEPS.map((step) => step.id).filter((stepId) =>
    pendingStepIds.has(stepId)
  );

  return ['bienvenida', ...orderedPendingSteps];
};

const FormPreRegisterForSteps = () => {
  const allowExistingAgendaFlow = isExistingAgendaBypassEnabled();
  const methods = useForm({
    mode: 'onBlur',
    defaultValues: DEFAULT_FORM_VALUES,
  });

  console.log('methods', methods.getValues());
  const stepRules = useMemo(() => buildStepRules(), []);
  const { user: auth0User } = useAuth0();
  const { userData } = useRoles();

  const [bootLoading, setBootLoading] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [needsAccount, setNeedsAccount] = useState(false);
  const [driverDraft, setDriverDraft] = useState(null);
  const [existingAgenda, setExistingAgenda] = useState(null);
  const [resubmissionContext, setResubmissionContext] = useState(null);
  const [resubSuccessModalOpen, setResubSuccessModalOpen] = useState(false);
  const [successAgenda, setSuccessAgenda] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [identity, setIdentity] = useState({ email: '', userId: null });

  const inResubMode = Boolean(resubmissionContext?.canEditPreregister);
  const resubmissionStepOrder = useMemo(
    () =>
      inResubMode ? buildResubmissionStepOrder(resubmissionContext?.requiredDocuments || []) : null,
    [inResubMode, resubmissionContext?.requiredDocuments]
  );
  const wizard = usePreregistroWizard({ needsAccount, stepOrderOverride: resubmissionStepOrder });
  const persistence = useDraftPersistence();
  const uploads = useFileUploads();
  const phoneVerified = methods.watch('phoneVerified');

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      setBootLoading(true);
      setScreenError('');

      const local = persistence.readLocalDraft();
      const localValues = local?.values;
      const rawEmail = userData?.email || auth0User?.email || '';

      try {
        const [agencyList, foundUser] = await Promise.all([
          fetchAgencies(),
          rawEmail ? getUserByEmail(rawEmail) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setAgencies(agencyList || []);
        setSuccessAgenda(null);

        if (foundUser?.id) {
          const agenda = await getLatestDriverAgendaByUser(foundUser.id);
          if (!mounted) return;
          setExistingAgenda(agenda || null);

          let draft = await getDriverDraftByUser(foundUser.id);
          let createdDraft = false;
          if (!draft?.id) {
            draft = await createDriverDraft({ userId: foundUser.id, email: rawEmail });
            createdDraft = true;
          }
          if (!mounted) return;

          const backendValues = hydrateFormFromDriver(draft);
          const localValues = local?.values || {};
          const localTime = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;
          const backendTime = draft?.updatedAt ? new Date(draft.updatedAt).getTime() : 0;
          const preferred = localTime > backendTime ? localValues : backendValues;

          methods.reset({
            ...DEFAULT_FORM_VALUES,
            ...backendValues,
            ...preferred,
            email: rawEmail || backendValues.email || '',
          });
          setIdentity({ email: rawEmail, userId: foundUser.id });
          setDriverDraft(draft);

          let resubContext = null;
          if (draft?.id) {
            try {
              resubContext = await fetchResubmissionContext(draft.id);
            } catch {
              resubContext = null;
            }
          }
          if (!mounted) return;
          setResubmissionContext(resubContext);

          setNeedsAccount(false);
          const hasDraftProgress = Boolean(
            draft?.profile_completed ||
              draft?.documents_completed ||
              draft?.appointment_scheduled ||
              draft?.firstname ||
              draft?.lastname ||
              draft?.curp ||
              draft?.rfc ||
              draft?.license_number ||
              draft?.vehicle_brand
          );
          const backendStep =
            !createdDraft &&
            hasDraftProgress &&
            draft?.current_step &&
            draft.current_step !== 'cuenta'
              ? draft.current_step
              : 'bienvenida';
          // Nota temporal: rehabilitar el forzado a "verificacion" cuando backend exponga y persista
          // el campo phone_verified de forma confiable. Por ahora se respeta el current_step.
          // const forceVerification =
          //   !backendValues.phoneVerified &&
          //   ["personales", "documentos", "licencia", "vehiculo", "fotos", "cita", "resumen"].includes(backendStep);
          const resumeFromResub = resubContext?.canEditPreregister ? 'bienvenida' : null;
          const blockedByAgendaOnly =
            Boolean(agenda?.id) && !allowExistingAgendaFlow && !resubContext?.canEditPreregister;
          wizard.setCurrentStepId(
            resumeFromResub || (blockedByAgendaOnly ? 'bienvenida' : backendStep)
          );
        } else {
          methods.reset({
            ...DEFAULT_FORM_VALUES,
            ...(localValues || undefined),
            email: rawEmail || '',
          });
          setNeedsAccount(true);
          setIdentity({ email: rawEmail || '', userId: null });
          setExistingAgenda(null);
          setResubmissionContext(null);
          wizard.setCurrentStepId('bienvenida');
        }
      } catch (error) {
        const fallbackValues = localValues || undefined;
        methods.reset({
          ...DEFAULT_FORM_VALUES,
          ...(fallbackValues || undefined),
          email: rawEmail || fallbackValues?.email || '',
        });
        setNeedsAccount(!rawEmail);
        setExistingAgenda(null);
        setResubmissionContext(null);
        setScreenError(
          error?.message || 'No se pudo cargar el preregistro. Puedes continuar con respaldo local.'
        );
      } finally {
        if (mounted) setBootLoading(false);
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [auth0User?.email, userData?.email, allowExistingAgendaFlow]);

  const saveCurrentStep = async () => {
    setScreenError('');
    setGlobalSuccess('');
    const currentStepId = wizard.currentStepId;
    const inResubMode = Boolean(resubmissionContext?.canEditPreregister);
    const blockedByExistingAgenda =
      Boolean(existingAgenda?.id) && !allowExistingAgendaFlow && !inResubMode;

    if (blockedByExistingAgenda) {
      persistence.setSaveStatus('error');
      persistence.setSaveMessage('Ya existe una cita agendada para este conductor.');
      setScreenError(
        'Ya existe una cita agendada para este conductor. No es posible avanzar en este flujo.'
      );
      return;
    }

    if (currentStepId === 'bienvenida') {
      wizard.goNext();
      return;
    }

    if (inResubMode) {
      const allowedSteps = new Set(wizard.stepOrder.filter((stepId) => stepId !== 'bienvenida'));
      if (!allowedSteps.has(currentStepId)) {
        persistence.setSaveStatus('error');
        persistence.setSaveMessage('Este paso no requiere corrección en este reenvío.');
        setScreenError(
          'Este paso no requiere corrección. Continúa en los pasos indicados por el revisor.'
        );
        return;
      }
    }

    persistence.setSaveStatus('saving');
    persistence.setSaveMessage('Guardando avance del paso...');

    try {
      const fields = STEP_FIELDS[currentStepId] || [];
      if (fields.length) {
        const valid = await methods.trigger(fields);
        if (!valid) {
          persistence.setSaveStatus('error');
          persistence.setSaveMessage('Revisa los campos marcados en rojo.');
          return;
        }
      }

      const values = methods.getValues();
      console.log('values', values);

      if (currentStepId === 'cuenta') {
        const accountEmail = values.email?.trim();
        await registerAccount({
          email: accountEmail,
          password: values.password,
          telefono: values.telefono,
        });
        const user = await getUserByEmail(accountEmail);
        if (!user?.id) throw new Error('No se pudo resolver el usuario creado.');
        let draft = await getDriverDraftByUser(user.id);
        if (!draft?.id) draft = await createDriverDraft({ userId: user.id, email: accountEmail });
        setIdentity({ email: accountEmail, userId: user.id });
        setDriverDraft(draft);
        persistence.saveSnapshot({
          driverId: draft.id,
          currentStep: 'verificacion',
          values,
        });
        setNeedsAccount(false);
        wizard.setCurrentStepId('verificacion');
        persistence.setSaveStatus('saved');
        persistence.setSaveMessage('Cuenta creada y avance guardado.');
        return;
      }

      let currentDraft = driverDraft;
      if (!currentDraft?.id && identity?.userId) {
        currentDraft = await getDriverDraftByUser(identity.userId);
        if (!currentDraft?.id) {
          currentDraft = await createDriverDraft({
            userId: identity.userId,
            email: identity.email,
          });
        }
        setDriverDraft(currentDraft);
      }
      if (!currentDraft?.id)
        throw new Error('No se encontro un borrador de preregistro para guardar.');

      const uploadFields = fields.filter((fieldName) => isMediaFieldValue(values[fieldName]));
      const mediaIds = uploadFields.length
        ? await uploads.uploadStepFiles(uploadFields, values)
        : {};
      const stepPayload = toDriverPayloadByStep(currentStepId, values, mediaIds);
      const updated = await updateDriverDraft(currentDraft.id, stepPayload);
      setDriverDraft(updated);

      if (Object.keys(mediaIds).length) {
        Object.entries(mediaIds).forEach(([key, mediaValue]) => {
          methods.setValue(key, mediaValue, { shouldDirty: false });
        });
      }

      persistence.saveSnapshot({
        driverId: updated.id,
        currentStep: wizard.isLastStep ? currentStepId : wizard.stepOrder[wizard.currentIndex + 1],
        values: values,
      });

      if (inResubMode && uploadFields.length > 0) {
        persistence.setSaveStatus('saved');
        persistence.setSaveMessage('Documentos actualizados correctamente.');
        if (!wizard.isLastStep) {
          wizard.goNext();
          return;
        }

        try {
          await syncValidationFromDriver({
            driverId: currentDraft.id,
            userId: identity?.userId,
            origin: 'reupload',
          });
          const refreshed = await fetchResubmissionContext(currentDraft.id);
          setResubmissionContext(refreshed);
        } catch (syncError) {
          const message = syncError?.message || '';
          if (!message.includes('No hay una validación activa')) {
            throw syncError;
          }
        }

        setResubSuccessModalOpen(true);
        return;
      }

      if (currentStepId === 'resumen') {
        if (!identity?.userId) {
          throw new Error('No encontramos tu usuario para agendar la cita.');
        }
        const userPayload = buildUserProfilePayload(values);
        await updateStrapiUserProfile(identity.userId, userPayload);

        const agendaPayload = buildAgendaPayload(values, identity.userId, agencies, updated.id);
        if (!agendaPayload.fecha_inicio) {
          throw new Error('Selecciona una fecha y hora valida para la cita.');
        }
        const createdAgenda = await createDriverAgenda(agendaPayload);

        await createValidationFromAgenda({
          driverId: updated.id,
          agendaId: createdAgenda.id,
          agencyId: values.sede || null,
          userId: identity.userId,
          appointmentDate: agendaPayload.fecha_inicio,
        });

        await updateDriverDraft(updated.id, buildFinalDriverPayload(values));
        persistence.clearLocalDraft();
        persistence.setSaveStatus('saved');
        persistence.setSaveMessage('Cita agendada correctamente.');
        setSuccessAgenda({
          ...createdAgenda,
          fecha_inicio: createdAgenda?.fecha_inicio || agendaPayload.fecha_inicio,
          ciudad: createdAgenda?.ciudad || agendaPayload.ciudad,
          estado: createdAgenda?.estado || 'pendiente',
        });
        setGlobalSuccess('Tu cita quedo agendada correctamente.');
        return;
      }

      persistence.setSaveStatus('saved');
      persistence.setSaveMessage('Paso guardado correctamente.');
      wizard.goNext();
    } catch (error) {
      persistence.setSaveStatus('error');
      persistence.setSaveMessage(error?.message || 'Ocurrio un error al guardar el paso.');
      setScreenError(error?.message || 'No se pudo guardar el paso actual.');
    }
  };

  const pendingResubFields = useMemo(
    () =>
      inResubMode
        ? getPendingResubFieldsForStep(
            wizard.currentStepId,
            resubmissionContext?.requiredDocuments || []
          )
        : null,
    [inResubMode, wizard.currentStepId, resubmissionContext?.requiredDocuments]
  );
  const resubMetaByField = useMemo(
    () => (inResubMode ? getResubMetaByField(resubmissionContext?.requiredDocuments || []) : {}),
    [inResubMode, resubmissionContext?.requiredDocuments]
  );

  const handleResubSuccessModalClose = async () => {
    setResubSuccessModalOpen(false);
    if (driverDraft?.id) {
      try {
        const refreshed = await fetchResubmissionContext(driverDraft.id);
        setResubmissionContext(refreshed);
      } catch {
        // Mantener contexto previo si el refetch falla.
      }
    }
    wizard.setCurrentStepId('bienvenida');
    window.location.reload();
  };

  const renderStep = () => {
    const id = wizard.currentStepId;
    const pendingCount = pendingResubFields?.size || 0;
    if (pendingCount > 0) {
      return (
        <Alert severity="info" sx={{ border: '1px solid #7c3aed', bgcolor: '#faf5ff' }}>
          Los documentos con borde morado deben cargarse de nuevo antes de guardar.
        </Alert>
      );
    }
    if (id === 'bienvenida') return <OnboardingIntro />;
    if (id === 'cuenta') return <StepCuenta rules={stepRules} />;
    if (id === 'verificacion') return <StepVerificacion />;
    if (id === 'personales') return <StepDatosPersonales rules={stepRules} />;
    if (id === 'documentos') {
      return (
        <StepDocumentosPersonales
          pendingResubFields={pendingResubFields}
          resubMetaByField={resubMetaByField}
        />
      );
    }
    if (id === 'licencia') return <StepLicencia rules={stepRules} />;
    if (id === 'vehiculo') return <StepVehiculo rules={stepRules} />;
    if (id === 'fotos') {
      return (
        <StepFotosVehiculo
          pendingResubFields={pendingResubFields}
          resubMetaByField={resubMetaByField}
        />
      );
    }
    if (id === 'cita') return <StepCitaPresencial rules={stepRules} agencies={agencies} />;
    if (id === 'resumen') return <StepResumen onEditStep={wizard.goTo} />;
    return null;
  };

  const visibleSteps = WIZARD_STEPS.filter((step) => wizard.stepOrder.includes(step.id));
  const blockedByExistingAgenda =
    Boolean(existingAgenda?.id) && !successAgenda && !allowExistingAgendaFlow && !inResubMode;
  const showExistingAgendaNotice = blockedByExistingAgenda && wizard.currentStepId === 'bienvenida';
  const showResubmissionNotice = inResubMode && wizard.currentStepId === 'bienvenida';
  const agendaEstadoLabel = getAgendaEstadoLabel(
    resubmissionContext?.agenda?.estado || existingAgenda?.estado
  );
  let nextButtonLabel;
  if (blockedByExistingAgenda) {
    nextButtonLabel = 'Ya existe una cita';
  } else if (showResubmissionNotice) {
    nextButtonLabel = 'Corregir mis documentos';
  } else if (wizard.currentStepId === 'resumen') {
    nextButtonLabel = 'Agendar cita';
  }

  if (bootLoading) {
    return (
      <Box sx={{ minHeight: '65vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (successAgenda) {
    return (
      <Container maxWidth="lg" sx={{ py: 2, marginBottom: 10 }}>
        <Paper
          elevation={0}
          sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid #e2e8f0' }}
        >
          <Stack spacing={2}>
            <Stack spacing={1} alignItems="center">
              <CheckCircleIcon sx={{ color: '#1bb358', fontSize: 34 }} />
              <Typography variant="h4" fontWeight={900} align="center">
                Tu cita quedo agendada
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 700 }} align="center">
                Ya registramos tu preregistro de conductor. En la cita vamos a revisar tus datos,
                tus archivos y la documentacion original.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.2}>
                    <Typography fontWeight={800}>Datos de tu cita</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EventIcon fontSize="small" />
                      <Typography variant="body2">
                        {formatDate(successAgenda.fecha_inicio)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlaceIcon fontSize="small" />
                      <Typography variant="body2">{successAgenda.ciudad || '—'}</Typography>
                    </Stack>
                    <Chip
                      label={successAgenda.estado || 'pendiente'}
                      size="small"
                      sx={{ width: 'fit-content' }}
                    />
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.2}>
                    <Typography fontWeight={800}>Lleva a tu cita</Typography>
                    {documentosDespues.map((item) => (
                      <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircleIcon sx={{ color: '#1bb358', fontSize: 18, mt: '2px' }} />
                        <Typography variant="body2">{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="success">
              Ya puedes cerrar esta pantalla. Tu cita quedo guardada.
            </Alert>
            <Button
              variant="contained"
              onClick={() => window.history.back()}
              sx={{
                bgcolor: '#1bb358',
                textTransform: 'none',
                fontWeight: 800,
                '&:hover': { bgcolor: '#17954a' },
              }}
            >
              Volver
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2, marginBottom: 10 }}>
      <Stack spacing={2}>
        <WizardHeader
          steps={visibleSteps}
          currentStepId={wizard.currentStepId}
          progress={wizard.progress}
        />

        {wizard.currentStepId !== 'bienvenida' && (
          <SaveStatusIndicator status={persistence.saveStatus} message={persistence.saveMessage} />
        )}

        {uploads.uploadErrors?.global ? (
          <Alert severity="error">{uploads.uploadErrors.global}</Alert>
        ) : null}
        {allowExistingAgendaFlow ? (
          <Alert severity="info">
            Modo pruebas activo: se permite continuar el flujo aunque ya exista una cita agendada.
          </Alert>
        ) : null}
        {screenError ? <Alert severity="error">{screenError}</Alert> : null}
        {globalSuccess ? <Alert severity="success">{globalSuccess}</Alert> : null}
        {showExistingAgendaNotice ? (
          <Alert severity="warning">
            Ya existe una cita agendada para este conductor (
            {formatDate(existingAgenda?.fecha_inicio)}). Este flujo queda bloqueado para evitar
            duplicados.
          </Alert>
        ) : null}
        {showExistingAgendaNotice ? (
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #f59e0b' }}>
            <Stack spacing={1.2}>
              <Typography fontWeight={800}>Datos de tu cita actual</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventIcon fontSize="small" />
                <Typography variant="body2">{formatDate(existingAgenda?.fecha_inicio)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceIcon fontSize="small" />
                <Typography variant="body2">{existingAgenda?.ciudad || '—'}</Typography>
              </Stack>
              <Chip
                label={getAgendaEstadoLabel(existingAgenda?.estado)}
                size="small"
                sx={{ width: 'fit-content' }}
              />
            </Stack>
          </Paper>
        ) : null}
        {showResubmissionNotice ? (
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #f59e0b' }}>
            <Stack spacing={1.5}>
              <Typography fontWeight={800}>Acción requerida</Typography>
              {resubmissionContext?.validation?.observations ? (
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {resubmissionContext.validation.observations}
                </Typography>
              ) : null}
              <Stack spacing={1}>
                {(resubmissionContext?.requiredDocuments || []).map((doc) => (
                  <Paper
                    key={doc.evidenceId || doc.evidenceType}
                    variant="outlined"
                    sx={{ p: 1.5 }}
                  >
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700} variant="body2">
                        {doc.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Estado: {doc.status === 'rejected' ? 'Rechazado' : 'Reenvío solicitado'}
                        {doc.wizardStep ? ` · Paso: ${doc.wizardStep}` : ''}
                      </Typography>
                      {doc.reviewerNote ? (
                        <Typography variant="caption">{doc.reviewerNote}</Typography>
                      ) : null}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventIcon fontSize="small" />
                <Typography variant="body2">
                  {formatDate(
                    resubmissionContext?.agenda?.fecha_inicio || existingAgenda?.fecha_inicio
                  )}
                </Typography>
              </Stack>
              <Chip label={agendaEstadoLabel} size="small" sx={{ width: 'fit-content' }} />
            </Stack>
          </Paper>
        ) : null}

        <Paper
          elevation={0}
          sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid #e2e8f0' }}
        >
          <FormProvider {...methods}>{renderStep()}</FormProvider>
          <StepNavigation
            canGoBack={wizard.canGoBack}
            isLastStep={wizard.currentStepId === 'resumen'}
            loading={persistence.saveStatus === 'saving' || uploads.uploading}
            nextDisabled={
              blockedByExistingAgenda || (wizard.currentStepId === 'verificacion' && !phoneVerified)
            }
            onBack={wizard.goBack}
            onNext={saveCurrentStep}
            nextLabel={nextButtonLabel}
          />
        </Paper>

        <Dialog
          open={resubSuccessModalOpen}
          onClose={handleResubSuccessModalClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Documentos actualizados</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: '#475569' }}>
              Se han actualizado los documentos correctamente. Puedes volver al inicio para revisar
              si falta corregir algún otro archivo pendiente.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="contained"
              onClick={handleResubSuccessModalClose}
              sx={{
                bgcolor: '#7c3aed',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#6d28d9' },
              }}
            >
              Volver al inicio
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
};

export default FormPreRegisterForSteps;
