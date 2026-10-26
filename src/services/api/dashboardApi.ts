import type { DashboardRepository } from '../contracts';
import type {
  AppointmentDetail,
  DashboardSummary,
  DateRangeKey,
  ID,
  PopularService,
  ReportsData,
  RevenuePoint,
} from '@/types';
import { http } from './apiClient';

export const apiDashboardRepository: DashboardRepository = {
  getSummary(locationId?: ID) {
    return http.get<DashboardSummary>('/dashboard/summary', { locationId });
  },

  getRevenue(range: DateRangeKey, locationId?: ID) {
    return http.get<RevenuePoint[]>('/dashboard/revenue', { range, locationId });
  },

  getTodaySchedule(locationId?: ID) {
    return http.get<AppointmentDetail[]>('/dashboard/appointments', { locationId });
  },

  getPopularServices(limit = 4, locationId?: ID) {
    return http.get<PopularService[]>('/dashboard/popular-services', { limit, locationId });
  },

  getReports(range: DateRangeKey, locationId?: ID) {
    return http.get<ReportsData>('/reports', { range, locationId });
  },
};
