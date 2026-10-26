import type { AppSettings } from '@/types';
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from '@/constants/config';
import { STANDARD_HOURS, cloneHours } from './hours';

export const defaultSettings: AppSettings = {
  shop: {
    name: 'BarberFlow Demo Shop',
    email: 'hello@barberflow.demo',
    phone: '+44 20 7946 0800',
    addressLine1: '42 Shoreditch High Street',
    city: 'London',
    postalCode: 'E1 6PN',
    country: 'United Kingdom',
    currency: DEFAULT_CURRENCY,
    timezone: DEFAULT_TIMEZONE,
    locale: 'en-US',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
  },
  businessHours: cloneHours(STANDARD_HOURS),
  booking: {
    minimumNoticeHours: 2,
    maximumAdvanceDays: 60,
    cancellationWindowHours: 12,
    cancellationPolicy:
      'Appointments may be cancelled or rescheduled free of charge up to 12 hours before the booked time. Later cancellations and no-shows may be charged at 50% of the service price.',
    allowOnlineBooking: true,
    requireDeposit: false,
    slotIntervalMinutes: 30,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    reminderLeadHours: 24,
    marketingEmails: false,
    staffDailyDigest: true,
  },
};
