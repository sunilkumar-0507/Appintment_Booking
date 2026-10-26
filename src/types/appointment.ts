import type { ID, ISODate, PaginationParams, SortDirection, TimeString } from './common';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export type AppointmentSource = 'walk-in' | 'phone' | 'online' | 'staff';

export interface Appointment {
  id: ID;
  /** Human-friendly reference shown to customers, e.g. `BF-4821`. */
  reference: string;
  customerId: ID;
  barberId: ID;
  serviceId: ID;
  locationId: ID;
  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;
  status: AppointmentStatus;
  price: number;
  source: AppointmentSource;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * An appointment joined with the records it references. Lists and detail views
 * consume this so no component ever has to cross-reference ids by hand.
 */
export interface AppointmentDetail extends Appointment {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAvatarUrl?: string;
  barberName: string;
  barberAvatarUrl: string;
  barberColor: string;
  serviceName: string;
  serviceDuration: number;
  locationName: string;
}

export interface CreateAppointmentRequest {
  customerId: ID;
  barberId: ID;
  serviceId: ID;
  locationId: ID;
  date: ISODate;
  startTime: TimeString;
  status?: AppointmentStatus;
  source?: AppointmentSource;
  notes?: string;
}

export type UpdateAppointmentRequest = Partial<CreateAppointmentRequest>;

export interface RescheduleAppointmentRequest {
  date: ISODate;
  startTime: TimeString;
  barberId?: ID;
}

export interface AppointmentFilters extends PaginationParams {
  search?: string;
  /** Inclusive lower bound, `yyyy-MM-dd`. */
  dateFrom?: ISODate;
  /** Inclusive upper bound, `yyyy-MM-dd`. */
  dateTo?: ISODate;
  barberId?: ID;
  serviceId?: ID;
  customerId?: ID;
  locationId?: ID;
  status?: AppointmentStatus | 'all';
  sortBy?: 'date' | 'customer' | 'price' | 'status';
  sortDir?: SortDirection;
}

export interface AvailabilityQuery {
  barberId: ID;
  serviceId: ID;
  locationId: ID;
  date: ISODate;
  /** Excluded from conflict checks — used when rescheduling an existing booking. */
  excludeAppointmentId?: ID;
}

/** Payload accepted by the public `/book` portal — creates the customer if needed. */
export interface PublicBookingRequest {
  locationId: ID;
  serviceId: ID;
  barberId: ID;
  date: ISODate;
  startTime: TimeString;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  notes?: string;
}
