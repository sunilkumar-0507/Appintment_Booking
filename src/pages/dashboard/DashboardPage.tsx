import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, DollarSign, Plus, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { BarberRoster, PopularServices, RevenueChart, TodaySchedule } from '@/components/dashboard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { barberRepository, dashboardRepository } from '@/services';
import { greetingForHour } from '@/utils/helpers';
import { formatLongDate } from '@/utils/datetime';
import type { DateRangeKey } from '@/types';

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { formatMoney } = useSettings();
  const [range, setRange] = useState<DateRangeKey>('week');

  const summary = useAsyncData(() => dashboardRepository.getSummary(), []);
  const revenue = useAsyncData(() => dashboardRepository.getRevenue(range), [range]);
  const schedule = useAsyncData(() => dashboardRepository.getTodaySchedule(), []);
  const popular = useAsyncData(() => dashboardRepository.getPopularServices(4), []);
  const barbers = useAsyncData(() => barberRepository.getBarbers(), []);
  const barberStats = useAsyncData(() => barberRepository.getAllBarberStats(), []);

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {greetingForHour()}, {firstName}
            <span className="animate-fade-in" aria-hidden>
              👋
            </span>
          </span>
        }
        description={`Here's what's happening at your shop today — ${formatLongDate(new Date())}.`}
        actions={
          can('appointments.manage') && (
            <Link to="/appointments/new">
              <Button variant="accent" leftIcon={<Plus className="h-4 w-4" />}>
                New Appointment
              </Button>
            </Link>
          )
        }
      />

      {/* Headline metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Appointments"
          value={summary.data?.appointmentsToday.value ?? 0}
          icon={CalendarDays}
          changePercent={summary.data?.appointmentsToday.changePercent}
          caption={summary.data?.appointmentsToday.comparisonLabel}
          accent="gold"
          loading={summary.loading}
        />
        <StatCard
          label="Today's Revenue"
          value={formatMoney(summary.data?.revenueToday.value ?? 0)}
          icon={DollarSign}
          changePercent={summary.data?.revenueToday.changePercent}
          caption={summary.data?.revenueToday.comparisonLabel}
          accent="green"
          loading={summary.loading}
        />
        <StatCard
          label="New Customers"
          value={summary.data?.newCustomers.value ?? 0}
          icon={UserPlus}
          changePercent={summary.data?.newCustomers.changePercent}
          caption={summary.data?.newCustomers.comparisonLabel}
          accent="blue"
          loading={summary.loading}
        />
        <StatCard
          label="Available Barbers"
          value={
            summary.data
              ? `${summary.data.barbersAvailable.available} / ${summary.data.barbersAvailable.total}`
              : '—'
          }
          icon={Users}
          caption="Currently working"
          accent="violet"
          loading={summary.loading}
        />
      </section>

      {/* Chart + schedule */}
      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart
            data={revenue.data}
            loading={revenue.loading}
            error={revenue.error}
            onRetry={revenue.refetch}
            range={range}
            onRangeChange={setRange}
          />
        </div>
        <div className="xl:col-span-1 xl:max-h-[430px]">
          <TodaySchedule
            appointments={schedule.data}
            loading={schedule.loading}
            error={schedule.error}
            onRetry={schedule.refetch}
          />
        </div>
      </section>

      {/* Services + roster */}
      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PopularServices
            services={popular.data}
            loading={popular.loading}
            error={popular.error}
            onRetry={popular.refetch}
          />
        </div>
        <div className="xl:col-span-1">
          <BarberRoster
            barbers={barbers.data}
            stats={barberStats.data}
            loading={barbers.loading || barberStats.loading}
          />
        </div>
      </section>
    </>
  );
}
