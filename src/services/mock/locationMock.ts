import type { LocationRepository } from '../contracts';
import type {
  CreateLocationRequest,
  ID,
  Location,
  LocationStats,
  UpdateLocationRequest,
} from '@/types';
import { db } from '@/mock/db';
import { generateId, sum } from '@/utils/helpers';
import { apiError, latency, notFound } from './mockUtils';

function findOrThrow(id: ID): Location {
  const location = db.locations.find((entry) => entry.id === id);
  if (!location) throw notFound('location');
  return location;
}

export const mockLocationRepository: LocationRepository = {
  async getLocations() {
    await latency();
    return db.locations.map((location) => ({ ...location }));
  },

  async getLocation(id: ID) {
    await latency();
    return { ...findOrThrow(id) };
  },

  async createLocation(payload: CreateLocationRequest) {
    await latency();

    const location: Location = {
      id: generateId('loc'),
      ...payload,
      imageUrl:
        payload.imageUrl ||
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=70',
      createdAt: new Date().toISOString(),
    };

    db.locations.push(location);
    return location;
  },

  async updateLocation(id: ID, payload: UpdateLocationRequest) {
    await latency();
    const location = findOrThrow(id);
    Object.assign(location, payload);
    return { ...location };
  },

  async deleteLocation(id: ID) {
    await latency();
    const index = db.locations.findIndex((entry) => entry.id === id);
    if (index === -1) throw notFound('location');

    const staffed = db.barbers.filter((barber) => barber.locationId === id).length;
    if (staffed > 0) {
      throw apiError(
        409,
        `This branch still has ${staffed} barber${staffed === 1 ? '' : 's'} assigned. Move them first.`,
      );
    }

    db.locations.splice(index, 1);
  },

  async getLocationStats() {
    await latency();
    return db.locations.map<LocationStats>((location) => {
      const appointments = db.appointments.filter(
        (appointment) => appointment.locationId === location.id,
      );
      const completed = appointments.filter((appointment) => appointment.status === 'completed');

      return {
        locationId: location.id,
        barberCount: db.barbers.filter((barber) => barber.locationId === location.id).length,
        appointmentCount: appointments.length,
        revenue: sum(completed, (appointment) => appointment.price),
      };
    });
  },
};
