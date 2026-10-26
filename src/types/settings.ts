import type { WeeklyHours } from './common';

export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'AUD' | 'CAD' | 'AED' | 'INR';

export type DateFormatKey = 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'dd MMM yyyy';

export type TimeFormatKey = '12h' | '24h';

export interface ShopSettings {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  currency: CurrencyCode;
  timezone: string;
  locale: string;
  dateFormat: DateFormatKey;
  timeFormat: TimeFormatKey;
}

export interface BookingSettings {
  /** Hours of notice required before a slot can be booked online. */
  minimumNoticeHours: number;
  /** How far ahead customers may book, in days. */
  maximumAdvanceDays: number;
  /** Hours before the appointment after which cancelling is no longer free. */
  cancellationWindowHours: number;
  cancellationPolicy: string;
  allowOnlineBooking: boolean;
  requireDeposit: boolean;
  /** Minutes between selectable slots. */
  slotIntervalMinutes: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  /** Hours before the appointment that a reminder fires. */
  reminderLeadHours: number;
  marketingEmails: boolean;
  staffDailyDigest: boolean;
}

export interface AppSettings {
  shop: ShopSettings;
  businessHours: WeeklyHours;
  booking: BookingSettings;
  notifications: NotificationSettings;
}
