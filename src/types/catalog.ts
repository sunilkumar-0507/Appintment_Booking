import type { ID, WeeklyHours } from './common';

/* -------------------------------------------------------------------------- */
/* Service                                                                     */
/* -------------------------------------------------------------------------- */

export type ServiceCategory = 'hair' | 'beard' | 'shave' | 'styling' | 'treatment' | 'package';

export interface Service {
  id: ID;
  name: string;
  description: string;
  /** Minutes. */
  duration: number;
  price: number;
  category: ServiceCategory;
  /** Barber ids qualified to perform this service. Empty means "any barber". */
  barberIds: ID[];
  active: boolean;
  /** Lifetime bookings — surfaced on the "Popular services" cards. */
  bookingCount: number;
  createdAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: ServiceCategory;
  barberIds: ID[];
  active: boolean;
}

export type UpdateServiceRequest = Partial<CreateServiceRequest>;

/* -------------------------------------------------------------------------- */
/* Barber                                                                      */
/* -------------------------------------------------------------------------- */

export type BarberStatus = 'available' | 'busy' | 'off' | 'disabled';

export interface BarberReview {
  id: ID;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Barber {
  id: ID;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  specialization: string;
  bio: string;
  /** Years in the trade. */
  experience: number;
  rating: number;
  reviewCount: number;
  locationId: ID;
  serviceIds: ID[];
  workingHours: WeeklyHours;
  status: BarberStatus;
  /** Chair / station number inside the shop. */
  chairNumber: number;
  /** Accent colour used for this barber's blocks in the calendar. */
  color: string;
  reviews: BarberReview[];
  joinedAt: string;
}

export interface CreateBarberRequest {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
  experience: number;
  locationId: ID;
  serviceIds: ID[];
  chairNumber: number;
  status: BarberStatus;
  avatarUrl?: string;
  workingHours?: WeeklyHours;
}

export type UpdateBarberRequest = Partial<CreateBarberRequest>;

/** Derived, read-only performance figures shown on barber cards and profiles. */
export interface BarberStats {
  barberId: ID;
  appointmentsToday: number;
  revenueToday: number;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  completionRate: number;
  /** Percentage of working minutes booked today. */
  utilization: number;
}

export interface BarberAvailability {
  barberId: ID;
  date: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  /** `HH:mm`. */
  time: string;
  available: boolean;
  /** Populated when the slot is taken, so the calendar can explain the conflict. */
  reason?: 'booked' | 'closed' | 'break' | 'past';
}

/* -------------------------------------------------------------------------- */
/* Location                                                                    */
/* -------------------------------------------------------------------------- */

export interface Location {
  id: ID;
  name: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  openingHours: WeeklyHours;
  imageUrl: string;
  active: boolean;
  createdAt: string;
}

export interface CreateLocationRequest {
  name: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  openingHours: WeeklyHours;
  active: boolean;
  imageUrl?: string;
}

export type UpdateLocationRequest = Partial<CreateLocationRequest>;

/** Aggregated figures per location, shown on the Locations page. */
export interface LocationStats {
  locationId: ID;
  barberCount: number;
  appointmentCount: number;
  revenue: number;
}
