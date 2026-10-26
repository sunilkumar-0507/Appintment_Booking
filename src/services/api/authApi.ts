import type { AuthRepository } from '../contracts';
import type { AuthSession, LoginRequest, RegisterRequest, User } from '@/types';
import { http, writeStoredSession } from './apiClient';

export const apiAuthRepository: AuthRepository = {
  async login(payload: LoginRequest) {
    const session = await http.post<AuthSession>('/auth/login', payload);
    writeStoredSession(session);
    return session;
  },

  async register(payload: RegisterRequest) {
    const session = await http.post<AuthSession>('/auth/register', payload);
    writeStoredSession(session);
    return session;
  },

  async refresh(refreshToken: string) {
    const session = await http.post<AuthSession>('/auth/refresh', { refreshToken });
    writeStoredSession(session);
    return session;
  },

  async logout() {
    try {
      await http.post<void>('/auth/logout');
    } finally {
      // The local session is cleared even if the server call fails.
      writeStoredSession(null);
    }
  },

  me() {
    return http.get<User>('/auth/me');
  },
};
