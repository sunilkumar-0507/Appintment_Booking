import type { SettingsRepository } from '../contracts';
import type { AppSettings } from '@/types';
import { http } from './apiClient';

export const apiSettingsRepository: SettingsRepository = {
  getSettings() {
    return http.get<AppSettings>('/settings');
  },

  updateSettings(payload: Partial<AppSettings>) {
    return http.put<AppSettings>('/settings', payload);
  },
};
