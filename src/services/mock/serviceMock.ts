import type { ServiceRepository } from '../contracts';
import type { CreateServiceRequest, ID, Service, UpdateServiceRequest } from '@/types';
import { db } from '@/mock/db';
import { todayISO } from '@/utils/datetime';
import { generateId, matchesQuery } from '@/utils/helpers';
import { apiError, isBlocking, latency, notFound } from './mockUtils';

function findOrThrow(id: ID): Service {
  const service = db.services.find((entry) => entry.id === id);
  if (!service) throw notFound('service');
  return service;
}

/** Keeps `barber.serviceIds` and `service.barberIds` from drifting apart. */
function syncBarberAssignments(serviceId: ID, barberIds: ID[]): void {
  db.barbers.forEach((barber) => {
    const shouldOffer = barberIds.includes(barber.id);
    const alreadyOffers = barber.serviceIds.includes(serviceId);

    if (shouldOffer && !alreadyOffers) {
      barber.serviceIds = [...barber.serviceIds, serviceId];
    } else if (!shouldOffer && alreadyOffers) {
      barber.serviceIds = barber.serviceIds.filter((id) => id !== serviceId);
    }
  });
}

export const mockServiceRepository: ServiceRepository = {
  async getServices(params = {}) {
    await latency();
    const { search, category, activeOnly } = params;

    return db.services
      .filter((service) => {
        if (activeOnly && !service.active) return false;
        if (category && category !== 'all' && service.category !== category) return false;
        if (search && !matchesQuery(`${service.name} ${service.description}`, search)) return false;
        return true;
      })
      .map((service) => ({ ...service }));
  },

  async getService(id: ID) {
    await latency();
    return { ...findOrThrow(id) };
  },

  async createService(payload: CreateServiceRequest) {
    await latency();

    if (db.services.some((entry) => entry.name.toLowerCase() === payload.name.trim().toLowerCase())) {
      throw apiError(422, 'A service with that name already exists.', {
        name: 'Pick a name that is not already in use.',
      });
    }

    const service: Service = {
      id: generateId('svc'),
      name: payload.name.trim(),
      description: payload.description.trim(),
      duration: payload.duration,
      price: payload.price,
      category: payload.category,
      barberIds: payload.barberIds,
      active: payload.active,
      bookingCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.services.push(service);
    syncBarberAssignments(service.id, service.barberIds);
    return service;
  },

  async updateService(id: ID, payload: UpdateServiceRequest) {
    await latency();
    const service = findOrThrow(id);

    if (payload.name) {
      const name = payload.name.trim().toLowerCase();
      if (db.services.some((entry) => entry.id !== id && entry.name.toLowerCase() === name)) {
        throw apiError(422, 'A service with that name already exists.', {
          name: 'Pick a name that is not already in use.',
        });
      }
    }

    Object.assign(service, payload);
    if (payload.barberIds) syncBarberAssignments(service.id, payload.barberIds);
    return { ...service };
  },

  async deleteService(id: ID) {
    await latency();
    const index = db.services.findIndex((entry) => entry.id === id);
    if (index === -1) throw notFound('service');

    const today = todayISO();
    const upcoming = db.appointments.filter(
      (appointment) =>
        appointment.serviceId === id && appointment.date >= today && isBlocking(appointment),
    );

    if (upcoming.length > 0) {
      throw apiError(
        409,
        `${upcoming.length} upcoming appointment${
          upcoming.length === 1 ? ' uses' : 's use'
        } this service. Disable it instead so the history stays intact.`,
      );
    }

    db.services.splice(index, 1);
    syncBarberAssignments(id, []);
  },
};
