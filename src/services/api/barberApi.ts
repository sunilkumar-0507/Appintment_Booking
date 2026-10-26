import type { BarberRepository } from '../contracts';
import type {
  AvailabilitySlot,
  Barber,
  BarberStats,
  CreateBarberRequest,
  ID,
  UpdateBarberRequest,
} from '@/types';
import { http } from './apiClient';

export const apiBarberRepository: BarberRepository = {
  getBarbers(params = {}) {
    return http.get<Barber[]>('/barbers', { ...params });
  },

  getBarber(id: ID) {
    return http.get<Barber>(`/barbers/${id}`);
  },

  createBarber(payload: CreateBarberRequest) {
    return http.post<Barber>('/barbers', payload);
  },

  updateBarber(id: ID, payload: UpdateBarberRequest) {
    return http.put<Barber>(`/barbers/${id}`, payload);
  },

  deleteBarber(id: ID) {
    return http.delete(`/barbers/${id}`);
  },

  getBarberAvailability(id: ID, date: string, serviceId?: ID) {
    return http.get<AvailabilitySlot[]>(`/barbers/${id}/availability`, { date, serviceId });
  },

  getBarberStats(id: ID) {
    return http.get<BarberStats>(`/barbers/${id}/stats`);
  },

  getAllBarberStats(locationId?: ID) {
    return http.get<BarberStats[]>('/barbers/stats', { locationId });
  },
};
