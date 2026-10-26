import type { Repositories } from '../contracts';
import { mockAppointmentRepository } from './appointmentMock';
import { mockAuthRepository } from './authMock';
import { mockBarberRepository } from './barberMock';
import { mockCustomerRepository } from './customerMock';
import { mockDashboardRepository } from './dashboardMock';
import { mockLocationRepository } from './locationMock';
import { mockServiceRepository } from './serviceMock';
import { mockSettingsRepository } from './settingsMock';

/** In-memory implementation — used when `VITE_USE_MOCK_API=true`. */
export const mockRepositories: Repositories = {
  auth: mockAuthRepository,
  dashboard: mockDashboardRepository,
  appointments: mockAppointmentRepository,
  customers: mockCustomerRepository,
  barbers: mockBarberRepository,
  services: mockServiceRepository,
  locations: mockLocationRepository,
  settings: mockSettingsRepository,
};
