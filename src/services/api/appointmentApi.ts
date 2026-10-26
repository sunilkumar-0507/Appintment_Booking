import type { AppointmentRepository } from '../contracts';
import type {
  Appointment,
  AppointmentDetail,
  AppointmentFilters,
  AppointmentStatus,
  AvailabilityQuery,
  AvailabilitySlot,
  CreateAppointmentRequest,
  ID,
  Paginated,
  PublicBookingRequest,
  RescheduleAppointmentRequest,
  UpdateAppointmentRequest,
} from '@/types';
import { http } from './apiClient';

export const apiAppointmentRepository: AppointmentRepository = {
  getAppointments(filters: AppointmentFilters = {}) {
    return http.get<Paginated<AppointmentDetail>>('/appointments', { ...filters });
  },

  getAppointmentsInRange(from: string, to: string, filters: AppointmentFilters = {}) {
    return http.get<AppointmentDetail[]>('/appointments', {
      ...filters,
      dateFrom: from,
      dateTo: to,
      pageSize: 0, // convention: 0 disables paging for calendar fetches
    });
  },

  getAppointment(id: ID) {
    return http.get<AppointmentDetail>(`/appointments/${id}`);
  },

  createAppointment(payload: CreateAppointmentRequest) {
    return http.post<Appointment>('/appointments', payload);
  },

  updateAppointment(id: ID, payload: UpdateAppointmentRequest) {
    return http.put<Appointment>(`/appointments/${id}`, payload);
  },

  deleteAppointment(id: ID) {
    return http.delete(`/appointments/${id}`);
  },

  updateStatus(id: ID, status: AppointmentStatus) {
    return http.patch<Appointment>(`/appointments/${id}/status`, { status });
  },

  reschedule(id: ID, payload: RescheduleAppointmentRequest) {
    return http.patch<Appointment>(`/appointments/${id}/reschedule`, payload);
  },

  getAvailability(query: AvailabilityQuery) {
    return http.get<AvailabilitySlot[]>('/appointments/availability', { ...query });
  },

  createPublicBooking(payload: PublicBookingRequest) {
    return http.post<AppointmentDetail>('/appointments/public', payload);
  },
};
