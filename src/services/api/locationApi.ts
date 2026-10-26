import type { LocationRepository } from '../contracts';
import type {
  CreateLocationRequest,
  ID,
  Location,
  LocationStats,
  UpdateLocationRequest,
} from '@/types';
import { http } from './apiClient';

export const apiLocationRepository: LocationRepository = {
  getLocations() {
    return http.get<Location[]>('/locations');
  },

  getLocation(id: ID) {
    return http.get<Location>(`/locations/${id}`);
  },

  createLocation(payload: CreateLocationRequest) {
    return http.post<Location>('/locations', payload);
  },

  updateLocation(id: ID, payload: UpdateLocationRequest) {
    return http.put<Location>(`/locations/${id}`, payload);
  },

  deleteLocation(id: ID) {
    return http.delete(`/locations/${id}`);
  },

  getLocationStats() {
    return http.get<LocationStats[]>('/locations/stats');
  },
};
