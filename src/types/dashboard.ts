import type { ID } from './common';

export type DateRangeKey = 'today' | 'week' | 'month' | 'quarter' | 'year';

/** A headline number plus its period-over-period movement. */
export interface MetricDelta {
  value: number;
  /** Signed percentage change vs the comparison period. */
  changePercent: number;
  /** Short label describing the comparison, e.g. "compared to yesterday". */
  comparisonLabel: string;
}

export interface DashboardSummary {
  appointmentsToday: MetricDelta;
  revenueToday: MetricDelta;
  newCustomers: MetricDelta;
  barbersAvailable: {
    available: number;
    total: number;
  };
}

export interface RevenuePoint {
  /** Axis label, already formatted for display. */
  label: string;
  /** ISO date the point represents, for tooltips and drill-down. */
  date: string;
  revenue: number;
  appointments: number;
}

export interface PopularService {
  serviceId: ID;
  name: string;
  price: number;
  duration: number;
  bookings: number;
  revenue: number;
  category: string;
}

export interface BarberRevenuePoint {
  barberId: ID;
  name: string;
  revenue: number;
  appointments: number;
}

export interface CustomerGrowthPoint {
  label: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface ReportSummary {
  totalRevenue: MetricDelta;
  totalAppointments: MetricDelta;
  averageAppointmentValue: MetricDelta;
  newCustomers: MetricDelta;
}

export interface ReportsData {
  summary: ReportSummary;
  revenueByDay: RevenuePoint[];
  revenueByBarber: BarberRevenuePoint[];
  popularServices: PopularService[];
  customerGrowth: CustomerGrowthPoint[];
  statusBreakdown: { status: string; count: number }[];
}
