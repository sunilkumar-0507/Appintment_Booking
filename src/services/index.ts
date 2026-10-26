import { USE_MOCK_API } from '@/constants/config';
import type { Repositories } from './contracts';
import { apiRepositories } from './api';
import { mockRepositories } from './mock';

/**
 * The one place demo mode and live mode diverge.
 *
 * Every page, hook and context imports from here, so pointing the app at a real
 * REST API is a `.env` change (`VITE_USE_MOCK_API=false`) — no component,
 * container or business rule is touched.
 */
const repositories: Repositories = USE_MOCK_API ? mockRepositories : apiRepositories;

export const authRepository = repositories.auth;
export const dashboardRepository = repositories.dashboard;
export const appointmentRepository = repositories.appointments;
export const customerRepository = repositories.customers;
export const barberRepository = repositories.barbers;
export const serviceRepository = repositories.services;
export const locationRepository = repositories.locations;
export const settingsRepository = repositories.settings;

export { repositories };
export { isApiError, normaliseError, onUnauthorized } from './api/apiClient';
export type * from './contracts';
