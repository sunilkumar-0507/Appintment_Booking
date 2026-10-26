import type { CustomerRepository } from '../contracts';
import type {
  AppointmentDetail,
  CreateCustomerRequest,
  Customer,
  CustomerStats,
  ID,
  Paginated,
  UpdateCustomerRequest,
} from '@/types';
import { http } from './apiClient';

export const apiCustomerRepository: CustomerRepository = {
  getCustomers(params = {}) {
    return http.get<Paginated<Customer>>('/customers', { ...params });
  },

  getCustomer(id: ID) {
    return http.get<Customer>(`/customers/${id}`);
  },

  createCustomer(payload: CreateCustomerRequest) {
    return http.post<Customer>('/customers', payload);
  },

  updateCustomer(id: ID, payload: UpdateCustomerRequest) {
    return http.put<Customer>(`/customers/${id}`, payload);
  },

  deleteCustomer(id: ID) {
    return http.delete(`/customers/${id}`);
  },

  getCustomerAppointments(id: ID) {
    return http.get<AppointmentDetail[]>(`/customers/${id}/appointments`);
  },

  getCustomerStats(locationId?: ID) {
    return http.get<CustomerStats>('/customers/stats', { locationId });
  },
};
