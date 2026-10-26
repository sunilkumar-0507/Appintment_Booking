import type { User } from '@/types';

/** Demo accounts. Passwords are checked against `DEMO_CREDENTIALS` only. */
export const mockUsers: User[] = [
  {
    id: 'usr_1',
    name: 'Admin',
    email: 'admin@barberflow.demo',
    role: 'admin',
    phone: '+44 20 7946 0800',
    locationId: 'loc_1',
    avatarUrl:
      'https://api.dicebear.com/9.x/notionists/svg?seed=BarberFlowAdmin&backgroundColor=2c2c30&radius=50',
    createdAt: '2021-03-14T09:00:00.000Z',
  },
  {
    id: 'usr_2',
    name: 'Daniel Carter',
    email: 'daniel.carter@barberflow.demo',
    role: 'barber',
    barberId: 'brb_2',
    locationId: 'loc_1',
    avatarUrl:
      'https://api.dicebear.com/9.x/notionists/svg?seed=DanielCarter&backgroundColor=f6f6f7&radius=50',
    createdAt: '2021-05-02T09:00:00.000Z',
  },
  {
    id: 'usr_3',
    name: 'Grace Turner',
    email: 'reception@barberflow.demo',
    role: 'receptionist',
    locationId: 'loc_1',
    avatarUrl:
      'https://api.dicebear.com/9.x/notionists/svg?seed=Reception&backgroundColor=f6f6f7&radius=50',
    createdAt: '2023-02-11T09:00:00.000Z',
  },
];
