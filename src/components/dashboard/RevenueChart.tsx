import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { Card, CardHeader } from '@/components/common/Card';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SkeletonChart } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/States';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';
import { DASHBOARD_RANGE_OPTIONS } from '@/constants/domain';
import type { ApiError, DateRangeKey, RevenuePoint } from '@/types';
import { sum } from '@/utils/helpers';

export interface RevenueChartProps {
  data: RevenuePoint[] | undefined;
  loading: boolean;
  error?: ApiError;
  onRetry: () => void;
  range: DateRangeKey;
  onRangeChange: (range: DateRangeKey) => void;
}

export function RevenueChart({
  data,
  loading,
  error,
  onRetry,
  range,
  onRangeChange,
}: RevenueChartProps) {
  const { formatMoney } = useSettings();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(17,17,19,0.07)';
  const axisColor = isDark ? '#88888f' : '#88888f';

  const totals = useMemo(
    () => ({
      revenue: sum(data ?? [], (point) => point.revenue),
      appointments: sum(data ?? [], (point) => point.appointments),
    }),
    [data],
  );

  // Long month/quarter series need fewer tick labels to stay readable.
  const tickInterval = data && data.length > 14 ? Math.floor(data.length / 8) : 0;

  return (
    <Card padded={false} className="flex h-full flex-col">
      <div className="p-5 pb-2">
        <CardHeader
          title="Revenue & Appointments"
          description={
            data
              ? `${formatMoney(totals.revenue)} from ${totals.appointments} appointments`
              : 'Booked and completed revenue over time'
          }
          action={
            <SegmentedControl
              options={DASHBOARD_RANGE_OPTIONS}
              value={range}
              onChange={onRangeChange}
              size="sm"
              aria-label="Revenue period"
            />
          }
        />
      </div>

      <div className="min-h-0 flex-1 px-2 pb-4 pt-2">
        {loading && <SkeletonChart className="px-3" />}

        {!loading && error && (
          <ErrorState error={error} onRetry={onRetry} compact title="Unable to load revenue" className="m-3" />
        )}

        {!loading && !error && data && (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e3a534" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#e3a534" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
                tick={{ fontSize: 11 }}
                dy={6}
              />
              <YAxis
                yAxisId="revenue"
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={54}
                tickFormatter={(value: number) => formatMoney(value, { notation: 'compact' })}
              />
              <YAxis yAxisId="appointments" hide />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,17,19,0.04)' }}
                content={<RevenueTooltip formatMoney={formatMoney} />}
              />

              <Bar
                yAxisId="appointments"
                dataKey="appointments"
                fill={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(17,17,19,0.07)'}
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#e3a534"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: isDark ? '#1b1b1e' : '#ffffff' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function RevenueTooltip({
  active,
  payload,
  label,
  formatMoney,
}: TooltipProps<number, string> & { formatMoney: (value: number) => string }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload as RevenuePoint;

  return (
    <div className="rounded-xl border border-ink-200/70 bg-[rgb(var(--surface-card))] px-3 py-2.5 shadow-float dark:border-white/10">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 font-display text-lg font-bold leading-none text-ink-900 dark:text-white">
        {formatMoney(point.revenue)}
      </p>
      <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">
        {point.appointments} appointment{point.appointments === 1 ? '' : 's'}
      </p>
    </div>
  );
}
