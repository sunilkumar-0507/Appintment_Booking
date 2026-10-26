import type { SettingsRepository } from '../contracts';
import type { AppSettings } from '@/types';
import { db } from '@/mock/db';
import { latency } from './mockUtils';

export const mockSettingsRepository: SettingsRepository = {
  async getSettings() {
    await latency();
    return JSON.parse(JSON.stringify(db.settings)) as AppSettings;
  },

  async updateSettings(payload: Partial<AppSettings>) {
    await latency();
    db.settings = {
      ...db.settings,
      ...payload,
      shop: { ...db.settings.shop, ...payload.shop },
      businessHours: payload.businessHours ?? db.settings.businessHours,
      booking: { ...db.settings.booking, ...payload.booking },
      notifications: { ...db.settings.notifications, ...payload.notifications },
    };
    return JSON.parse(JSON.stringify(db.settings)) as AppSettings;
  },
};
