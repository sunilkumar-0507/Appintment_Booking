import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, CalendarDays, Receipt, UserPlus, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SkeletonChart, SkeletonStatCards } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';
import { dashboardRepository } from '@/services';
import { APPOINTMENT_STATUS_META, CHART_COLORS, REPORT_RANGE_OPTIONS } from '@/constants/domain';
import type { DateRangeKey } from '@/types';

export default function ReportsPage() {
  const [range, setRange] = useState<DateRangeKey>('month');
  const { formatMoney } = useSettings();
  const { theme } = useTheme();

  const reports = useAsyncData(() => dashboardRepository.getReports(range), [range]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(17,17,19,0.07)';
  const axisTick = { fontSize: 11, fill: '#88888f' };

  const tooltipStyle = {
    backgroundColor: isDark ? '#1b1b1e' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,19,0.08)'}`,
    borderRadius: 12,
    fontSize: 13,
    boxShadow: '0 12px 24px -6px rgb(16 24 40 / 0.12)',
    color: isDark ? '#ffffff' : '#1b1b1e',
  };

  const data = reports.data;
  // Long ranges need thinned tick labels to stay readable.
  const tickInterval = data && data.revenueByDay.length > 14 ? Math.floor(data.revenueByDay.length / 8) : 0;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Revenue, demand and customer growth across your shop."
        actions={
          <SegmentedControl
            options={REPORT_RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            aria-label="Reporting period"
          />
        }
      />

      {reports.error && (
        <ErrorState
          error={reports.error}
          title="Unable to load reports."
          onRetry={reports.refetch}
          className="surface-card border-solid"
        />
      )}

      {!reports.error && (
        <>
          {/* Headline metrics */}
          {reports.loading && !data ? (
            <SkeletonStatCards />
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Revenue"
                value={formatMoney(data?.summary.totalRevenue.value ?? 0)}
                icon={Wallet}
                changePercent={data?.summary.totalRevenue.changePercent}
                caption={data?.summary.totalRevenue.comparisonLabel}
                accent="green"
              />
              <StatCard
                label="Total Appointments"
                value={data?.summary.totalAppointments.value ?? 0}
                icon={CalendarDays}
                changePercent={data?.summary.totalAppointments.changePercent}
                caption={data?.summary.totalAppointments.comparisonLabel}
                accent="gold"
              />
              <StatCard
                label="Avg. Appointment Value"
                value={formatMoney(data?.summary.averageAppointmentValue.value ?? 0)}
                icon={Receipt}
                changePercent={data?.summary.averageAppointmentValue.changePercent}
                caption={data?.summary.averageAppointmentValue.comparisonLabel}
                accent="blue"
              />
              <StatCard
                label="New Customers"
                value={data?.summary.newCustomers.value ?? 0}
                icon={UserPlus}
                changePercent={data?.summary.newCustomers.changePercent}
                caption={data?.summary.newCustomers.comparisonLabel}
                accent="violet"
              />
            </section>
          )}

          {/* Revenue by day */}
          <Card className="mt-5">
            <CardHeader title="Revenue by day" description="Completed and confirmed bookings" />
            <div className="mt-4">
              {reports.loading && !data ? (
                <SkeletonChart />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.revenueByDay ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e3a534" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#e3a534" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval={tickInterval} dy={6} />
                    <YAxis
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(value: number) => formatMoney(value, { notation: 'compact' })}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [formatMoney(value), 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#e3a534"
                      strokeWidth={2.5}
                      fill="url(#reportRevenue)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {/* Appointments by day */}
            <Card>
              <CardHeader title="Appointments by day" description="Booking volume over the period" />
              <div className="mt-4">
                {reports.loading && !data ? (
                  <SkeletonChart />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data?.revenueByDay ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval={tickInterval} dy={6} />
                      <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,17,19,0.04)' }}
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [value, 'Appointments']}
                      />
                      <Bar dataKey="appointments" fill="#2e90fa" radius={[5, 5, 0, 0]} maxBarSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Revenue by barber */}
            <Card>
              <CardHeader title="Revenue by barber" description="Who is bringing the money in" />
              <div className="mt-4">
                {reports.loading && !data ? (
                  <SkeletonChart />
                ) : data && data.revenueByBarber.length === 0 ? (
                  <EmptyState icon={BarChart3} title="No revenue in this period" compact />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={data?.revenueByBarber ?? []}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => formatMoney(value, { notation: 'compact' })}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                        width={104}
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,17,19,0.04)' }}
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [formatMoney(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" radius={[0, 5, 5, 0]} maxBarSize={26}>
                        {(data?.revenueByBarber ?? []).map((entry, index) => (
                          <Cell key={entry.barberId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Popular services */}
            <Card>
              <CardHeader title="Popular services" description="Bookings by service" />
              <div className="mt-4">
                {reports.loading && !data ? (
                  <SkeletonChart />
                ) : data && data.popularServices.length === 0 ? (
                  <EmptyState icon={BarChart3} title="No bookings in this period" compact />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data?.popularServices ?? []}
                        dataKey="bookings"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={100}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {(data?.popularServices ?? []).map((entry, index) => (
                          <Cell key={entry.serviceId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => [`${value} bookings`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={48}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Customer growth */}
            <Card>
              <CardHeader title="Customer growth" description="New sign-ups vs returning clients" />
              <div className="mt-4">
                {reports.loading && !data ? (
                  <SkeletonChart />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={data?.customerGrowth ?? []}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} dy={6} />
                      <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="newCustomers"
                        name="New customers"
                        stroke="#e3a534"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="returningCustomers"
                        name="Active customers"
                        stroke="#2e90fa"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Status breakdown */}
          {data && data.statusBreakdown.length > 0 && (
            <Card className="mt-5">
              <CardHeader
                title="Appointment outcomes"
                description="How bookings in this period ended up"
              />
              <ul className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {data.statusBreakdown.map((entry) => {
                  const meta = Object.values(APPOINTMENT_STATUS_META).find(
                    (candidate) => candidate.label === entry.status,
                  );
                  const total = data.statusBreakdown.reduce((acc, item) => acc + item.count, 0);
                  const share = total === 0 ? 0 : Math.round((entry.count / total) * 100);

                  return (
                    <li key={entry.status} className="rounded-xl border border-ink-200/70 p-4 dark:border-white/[0.07]">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: meta?.hex ?? '#88888f' }}
                          aria-hidden
                        />
                        <span className="text-[13px] font-medium text-ink-600 dark:text-ink-300">
                          {entry.status}
                        </span>
                      </span>
                      <p className="mt-2 font-display text-2xl font-bold text-ink-900 dark:text-white">
                        {entry.count}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink-500 dark:text-ink-400">{share}% of total</p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </>
  );
}
