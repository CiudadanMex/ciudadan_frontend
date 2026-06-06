import { fetchJson, STRAPI_URL } from '../../utils/request.utils';

export const assignUserAreas = (userId, areaIds) => {
  if (!userId) return Promise.reject(new Error('Usuario invalido'));

  return fetchJson(
    `${STRAPI_URL}/api/users/${userId}/areas`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaIds }),
    },
    'No se pudieron asignar las areas'
  );
};
