import type {
  Appointment,
  AppointmentDetail,
  AppointmentFilters,
  AppSettings,
  AuthSession,
  AvailabilitySlot,
  AvailabilityQuery,
  Barber,
  BarberStats,
  CreateAppointmentRequest,
  CreateBarberRequest,
  CreateCustomerRequest,
  CreateLocationRequest,
  CreateServiceRequest,
  Customer,
  CustomerStats,
  DashboardSummary,
  DateRangeKey,
  ID,
  Location,
  LocationStats,
  LoginRequest,
  Paginated,
  PopularService,
  PublicBookingRequest,
  RegisterRequest,
  ReportsData,
  RescheduleAppointmentRequest,
  RevenuePoint,
  Service,
  UpdateAppointmentRequest,
  UpdateBarberRequest,
  UpdateCustomerRequest,
  UpdateLocationRequest,
  UpdateServiceRequest,
  User,
  AppointmentStatus,
} from '@/types';

/**
 * The contracts every page and hook programs against. Two implementations
 * satisfy them — `services/mock/*` (in-memory) and `services/api/*` (Axios to a
 * REST backend) — and `services/index.ts` picks one at startup. Because pages
 * only ever see these interfaces, swapping the demo for a real ASP.NET Core API
 * is a one-line environment change.
 */

export interface AuthRepository {
  /** `POST /api/auth/login` */
  login(payload: LoginRequest): Promise<AuthSession>;
  /** `POST /api/auth/register` */
  register(payload: RegisterRequest): Promise<AuthSession>;
  /** `POST /api/auth/refresh` */
  refresh(refreshToken: string): Promise<AuthSession>;
  /** `POST /api/auth/logout` */
  logout(): Promise<void>;
  /** `GET /api/auth/me` */
  me(): Promise<User>;
}

export interface DashboardRepository {
  /** `GET /api/dashboard/summary` */
  getSummary(locationId?: ID): Promise<DashboardSummary>;
  /** `GET /api/dashboard/revenue` */
  getRevenue(range: DateRangeKey, locationId?: ID): Promise<RevenuePoint[]>;
  /** `GET /api/dashboard/appointments` — today's schedule timeline. */
  getTodaySchedule(locationId?: ID): Promise<AppointmentDetail[]>;
  /** `GET /api/dashboard/popular-services` */
  getPopularServices(limit?: number, locationId?: ID): Promise<PopularService[]>;
  /** Aggregate feed behind the Reports page. */
  getReports(range: DateRangeKey, locationId?: ID): Promise<ReportsData>;
}

export interface AppointmentRepository {
  /** `GET /api/appointments` */
  getAppointments(filters?: AppointmentFilters): Promise<Paginated<AppointmentDetail>>;
  /** Unpaginated fetch used by the calendar views. */
  getAppointmentsInRange(from: string, to: string, filters?: AppointmentFilters): Promise<AppointmentDetail[]>;
  /** `GET /api/appointments/{id}` */
  getAppointment(id: ID): Promise<AppointmentDetail>;
  /** `POST /api/appointments` */
  createAppointment(payload: CreateAppointmentRequest): Promise<Appointment>;
  /** `PUT /api/appointments/{id}` */
  updateAppointment(id: ID, payload: UpdateAppointmentRequest): Promise<Appointment>;
  /** `DELETE /api/appointments/{id}` */
  deleteAppointment(id: ID): Promise<void>;
  /** `PATCH /api/appointments/{id}/status` */
  updateStatus(id: ID, status: AppointmentStatus): Promise<Appointment>;
  /** `PATCH /api/appointments/{id}/reschedule` */
  reschedule(id: ID, payload: RescheduleAppointmentRequest): Promise<Appointment>;
  /** `GET /api/appointments/availability` */
  getAvailability(query: AvailabilityQuery): Promise<AvailabilitySlot[]>;
  /** Public portal booking — creates the customer record when needed. */
  createPublicBooking(payload: PublicBookingRequest): Promise<AppointmentDetail>;
}

export interface CustomerRepository {
  /** `GET /api/customers` */
  getCustomers(params?: {
    search?: string;
    status?: string;
    locationId?: ID;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Customer>>;
  /** `GET /api/customers/{id}` */
  getCustomer(id: ID): Promise<Customer>;
  /** `POST /api/customers` */
  createCustomer(payload: CreateCustomerRequest): Promise<Customer>;
  /** `PUT /api/customers/{id}` */
  updateCustomer(id: ID, payload: UpdateCustomerRequest): Promise<Customer>;
  /** `DELETE /api/customers/{id}` */
  deleteCustomer(id: ID): Promise<void>;
  /** `GET /api/customers/{id}/appointments` */
  getCustomerAppointments(id: ID): Promise<AppointmentDetail[]>;
  /** Headline counters for the Customers page. */
  getCustomerStats(locationId?: ID): Promise<CustomerStats>;
}

export interface BarberRepository {
  /** `GET /api/barbers` */
  getBarbers(params?: { locationId?: ID; search?: string; serviceId?: ID }): Promise<Barber[]>;
  /** `GET /api/barbers/{id}` */
  getBarber(id: ID): Promise<Barber>;
  /** `POST /api/barbers` */
  createBarber(payload: CreateBarberRequest): Promise<Barber>;
  /** `PUT /api/barbers/{id}` */
  updateBarber(id: ID, payload: UpdateBarberRequest): Promise<Barber>;
  /** `DELETE /api/barbers/{id}` */
  deleteBarber(id: ID): Promise<void>;
  /** `GET /api/barbers/{id}/availability` */
  getBarberAvailability(id: ID, date: string, serviceId?: ID): Promise<AvailabilitySlot[]>;
  /** Derived performance figures for barber cards and profiles. */
  getBarberStats(id: ID): Promise<BarberStats>;
  /** Stats for every barber in one call — used by the Barbers grid. */
  getAllBarberStats(locationId?: ID): Promise<BarberStats[]>;
}

export interface ServiceRepository {
  /** `GET /api/services` */
  getServices(params?: { search?: string; category?: string; activeOnly?: boolean }): Promise<Service[]>;
  /** `GET /api/services/{id}` */
  getService(id: ID): Promise<Service>;
  /** `POST /api/services` */
  createService(payload: CreateServiceRequest): Promise<Service>;
  /** `PUT /api/services/{id}` */
  updateService(id: ID, payload: UpdateServiceRequest): Promise<Service>;
  /** `DELETE /api/services/{id}` */
  deleteService(id: ID): Promise<void>;
}

export interface LocationRepository {
  /** `GET /api/locations` */
  getLocations(): Promise<Location[]>;
  /** `GET /api/locations/{id}` */
  getLocation(id: ID): Promise<Location>;
  /** `POST /api/locations` */
  createLocation(payload: CreateLocationRequest): Promise<Location>;
  /** `PUT /api/locations/{id}` */
  updateLocation(id: ID, payload: UpdateLocationRequest): Promise<Location>;
  /** `DELETE /api/locations/{id}` */
  deleteLocation(id: ID): Promise<void>;
  /** Per-branch aggregates for the Locations page. */
  getLocationStats(): Promise<LocationStats[]>;
}

export interface SettingsRepository {
  getSettings(): Promise<AppSettings>;
  updateSettings(payload: Partial<AppSettings>): Promise<AppSettings>;
}

/** The full surface the app binds to. */
export interface Repositories {
  auth: AuthRepository;
  dashboard: DashboardRepository;
  appointments: AppointmentRepository;
  customers: CustomerRepository;
  barbers: BarberRepository;
  services: ServiceRepository;
  locations: LocationRepository;
  settings: SettingsRepository;
}
