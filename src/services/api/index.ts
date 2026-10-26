import type { Repositories } from '../contracts';
import { apiAppointmentRepository } from './appointmentApi';
import { apiAuthRepository } from './authApi';
import { apiBarberRepository } from './barberApi';
import { apiCustomerRepository } from './customerApi';
import { apiDashboardRepository } from './dashboardApi';
import { apiLocationRepository } from './locationApi';
import { apiServiceRepository } from './serviceApi';
import { apiSettingsRepository } from './settingsApi';

/** Live REST implementation — used when `VITE_USE_MOCK_API=false`. */
export const apiRepositories: Repositories = {
  auth: apiAuthRepository,
  dashboard: apiDashboardRepository,
  appointments: apiAppointmentRepository,
  customers: apiCustomerRepository,
  barbers: apiBarberRepository,
  services: apiServiceRepository,
  locations: apiLocationRepository,
  settings: apiSettingsRepository,
};

export { apiClient, http, normaliseError, isApiError, onUnauthorized } from './apiClient';
