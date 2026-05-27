import { normalizeEntity, parseJsonSafe } from '../../utils/preRegisterForSteps/helpers';

const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || '';
const buildJsonOptions = (method, payload) => ({
  method,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

export const updateDriverDetails = async (id, payload) => {
  const url = `${STRAPI_URL}/api/drivers/${id}`;
  const res = await fetch(url, buildJsonOptions('PUT', payload));
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(data?.error?.message || 'No se pudo actualizar los detalles del conductor.');
  }
  return normalizeEntity(data?.data);
};
