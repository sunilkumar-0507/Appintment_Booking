import type { AuthRepository } from '../contracts';
import type { AuthSession, LoginRequest, RegisterRequest, User } from '@/types';
import { DEMO_CREDENTIALS } from '@/constants/config';
import { db } from '@/mock/db';
import { writeStoredSession, readStoredSession } from '../api/apiClient';
import { apiError, latency } from './mockUtils';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function buildSession(user: User): AuthSession {
  return {
    user,
    token: `demo.${btoa(user.id)}.${Date.now().toString(36)}`,
    refreshToken: `demo-refresh.${btoa(user.id)}`,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

export const mockAuthRepository: AuthRepository = {
  async login({ email, password }: LoginRequest) {
    await latency();

    const user = db.users.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase());

    // Demo rule: any seeded account is reachable with the shared demo password.
    if (!user || password !== DEMO_CREDENTIALS.password) {
      throw apiError(401, 'That email and password combination is not recognised.', {
        password: 'Incorrect email or password.',
      });
    }

    const session = buildSession(user);
    writeStoredSession(session);
    return session;
  },

  async register({ name, email }: RegisterRequest) {
    await latency();

    if (db.users.some((entry) => entry.email.toLowerCase() === email.trim().toLowerCase())) {
      throw apiError(422, 'That email address is already registered.', {
        email: 'An account with this email already exists.',
      });
    }

    const user: User = {
      id: `usr_${db.users.length + 1}`,
      name,
      email,
      role: 'admin',
      locationId: db.locations[0]?.id,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);

    const session = buildSession(user);
    writeStoredSession(session);
    return session;
  },

  async refresh() {
    await latency();
    const existing = readStoredSession();
    if (!existing) throw apiError(401, 'Your session has expired. Please sign in again.');

    const session = buildSession(existing.user);
    writeStoredSession(session);
    return session;
  },

  async logout() {
    await latency();
    writeStoredSession(null);
  },

  async me() {
    await latency();
    const session = readStoredSession();
    if (!session) throw apiError(401, 'Your session has expired. Please sign in again.');

    const user = db.users.find((entry) => entry.id === session.user.id);
    if (!user) throw apiError(401, 'Your session has expired. Please sign in again.');
    return user;
  },
};
