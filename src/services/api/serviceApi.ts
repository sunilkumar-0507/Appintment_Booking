import type { ServiceRepository } from '../contracts';
import type { CreateServiceRequest, ID, Service, UpdateServiceRequest } from '@/types';
import { http } from './apiClient';

export const apiServiceRepository: ServiceRepository = {
  getServices(params = {}) {
    return http.get<Service[]>('/services', { ...params });
  },

  getService(id: ID) {
    return http.get<Service>(`/services/${id}`);
  },

  createService(payload: CreateServiceRequest) {
    return http.post<Service>('/services', payload);
  },

  updateService(id: ID, payload: UpdateServiceRequest) {
    return http.put<Service>(`/services/${id}`, payload);
  },

  deleteService(id: ID) {
    return http.delete(`/services/${id}`);
  },
};
