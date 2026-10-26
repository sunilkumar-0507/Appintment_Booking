import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageLoader } from '@/components/common/Loading';
import { RedirectIfAuthenticated, RequireAuth, RequirePermission } from './guards';

/*
 * Every page is code-split. The dashboard bundle stays small and the public
 * booking portal never downloads the admin UI at all.
 */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const AppointmentsPage = lazy(() => import('@/pages/appointments/AppointmentsPage'));
const NewAppointmentPage = lazy(() => import('@/pages/appointments/NewAppointmentPage'));
const AppointmentDetailPage = lazy(() => import('@/pages/appointments/AppointmentDetailPage'));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('@/pages/customers/CustomerDetailPage'));
const BarbersPage = lazy(() => import('@/pages/barbers/BarbersPage'));
const BarberDetailPage = lazy(() => import('@/pages/barbers/BarberDetailPage'));
const ServicesPage = lazy(() => import('@/pages/services/ServicesPage'));
const LocationsPage = lazy(() => import('@/pages/locations/LocationsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const BookingPortalPage = lazy(() => import('@/pages/booking/BookingPortalPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route path="/book" element={<BookingPortalPage />} />

        {/* Authenticated shell */}
        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route
            path="/appointments/new"
            element={
              <RequirePermission permission="appointments.manage">
                <NewAppointmentPage />
              </RequirePermission>
            }
          />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />

          <Route path="/calendar" element={<CalendarPage />} />

          <Route
            path="/customers"
            element={
              <RequirePermission permission="customers.view">
                <CustomersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <RequirePermission permission="customers.view">
                <CustomerDetailPage />
              </RequirePermission>
            }
          />

          <Route
            path="/barbers"
            element={
              <RequirePermission permission="barbers.view">
                <BarbersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/barbers/:id"
            element={
              <RequirePermission permission="barbers.view">
                <BarberDetailPage />
              </RequirePermission>
            }
          />

          <Route
            path="/services"
            element={
              <RequirePermission permission="services.view">
                <ServicesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/locations"
            element={
              <RequirePermission permission="locations.view">
                <LocationsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/reports"
            element={
              <RequirePermission permission="reports.view">
                <ReportsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/settings"
            element={
              <RequirePermission permission="settings.manage">
                <SettingsPage />
              </RequirePermission>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
