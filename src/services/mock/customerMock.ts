import type { CustomerRepository } from '../contracts';
import type { CreateCustomerRequest, Customer, ID, UpdateCustomerRequest } from '@/types';
import { db, recalculateCustomer, refreshDerivedData } from '@/mock/db';
import { todayISO } from '@/utils/datetime';
import { generateId, matchesQuery } from '@/utils/helpers';
import { apiError, latency, notFound, paginate, toDetail } from './mockUtils';

function findOrThrow(id: ID): Customer {
  const customer = db.customers.find((entry) => entry.id === id);
  if (!customer) throw notFound('customer');
  return customer;
}

export const mockCustomerRepository: CustomerRepository = {
  async getCustomers(params = {}) {
    await latency();
    const { search, status, locationId, page = 1, pageSize = 10 } = params;

    const filtered = db.customers
      .filter((customer) => {
        if (locationId && customer.locationId !== locationId) return false;
        if (status && status !== 'all' && customer.status !== status) return false;
        if (search && !matchesQuery(`${customer.name} ${customer.email} ${customer.phone}`, search)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b.lastVisit ?? '').localeCompare(a.lastVisit ?? '') || a.name.localeCompare(b.name));

    return paginate(filtered, page, pageSize);
  },

  async getCustomer(id: ID) {
    await latency();
    return { ...findOrThrow(id) };
  },

  async createCustomer(payload: CreateCustomerRequest) {
    await latency();

    const email = payload.email.trim().toLowerCase();
    if (db.customers.some((entry) => entry.email.toLowerCase() === email)) {
      throw apiError(422, 'A customer with that email already exists.', {
        email: 'This email is already on file.',
      });
    }

    const name = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
    const customer: Customer = {
      id: generateId('cus'),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      name,
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        name,
      )}&backgroundColor=2c2c30&textColor=e3a534&radius=50`,
      status: 'new',
      locationId: payload.locationId,
      totalVisits: 0,
      totalSpent: 0,
      favoriteServiceIds: [],
      preferredBarberId: payload.preferredBarberId,
      notes: payload.notes,
      joinedAt: new Date().toISOString(),
    };

    db.customers.push(customer);
    return customer;
  },

  async updateCustomer(id: ID, payload: UpdateCustomerRequest) {
    await latency();
    const customer = findOrThrow(id);

    if (payload.email) {
      const email = payload.email.trim().toLowerCase();
      const clash = db.customers.some(
        (entry) => entry.id !== id && entry.email.toLowerCase() === email,
      );
      if (clash) {
        throw apiError(422, 'A customer with that email already exists.', {
          email: 'This email is already on file.',
        });
      }
    }

    Object.assign(customer, payload);
    customer.name = `${customer.firstName} ${customer.lastName}`.trim();

    // Keep the derived figures honest after a manual edit; an explicitly set
    // status wins over the automatically derived tier.
    const recalculated = recalculateCustomer(customer, db.appointments);
    Object.assign(customer, recalculated, { status: payload.status ?? recalculated.status });

    return { ...customer };
  },

  async deleteCustomer(id: ID) {
    await latency();
    const index = db.customers.findIndex((entry) => entry.id === id);
    if (index === -1) throw notFound('customer');

    // Cancel rather than orphan any future bookings this customer holds.
    const today = todayISO();
    db.appointments.forEach((appointment) => {
      if (appointment.customerId === id && appointment.date >= today) {
        appointment.status = 'cancelled';
      }
    });

    db.customers.splice(index, 1);
    refreshDerivedData();
  },

  async getCustomerAppointments(id: ID) {
    await latency();
    findOrThrow(id);
    return db.appointments
      .filter((appointment) => appointment.customerId === id)
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
      .map(toDetail);
  },

  async getCustomerStats(locationId?: ID) {
    await latency();
    const scoped = locationId
      ? db.customers.filter((customer) => customer.locationId === locationId)
      : db.customers;

    const monthPrefix = todayISO().slice(0, 7);

    return {
      total: scoped.length,
      newThisMonth: scoped.filter((customer) => customer.joinedAt.slice(0, 7) === monthPrefix).length,
      returning: scoped.filter((customer) => customer.totalVisits >= 5).length,
      vip: scoped.filter((customer) => customer.status === 'vip').length,
    };
  },
};
