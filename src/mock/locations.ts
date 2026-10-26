import type { Location } from '@/types';
import { EXTENDED_HOURS, STANDARD_HOURS, cloneHours } from './hours';

/**
 * Three fictional branches. The architecture is multi-location from day one:
 * every barber, customer and appointment carries a `locationId`.
 */
export const mockLocations: Location[] = [
  {
    id: 'loc_1',
    name: 'Downtown Branch',
    addressLine1: '42 Shoreditch High Street',
    city: 'London',
    postalCode: 'E1 6PN',
    country: 'United Kingdom',
    countryCode: 'GB',
    phone: '+44 20 7946 0812',
    email: 'downtown@barberflow.demo',
    timezone: 'Europe/London',
    currency: 'GBP',
    openingHours: cloneHours(EXTENDED_HOURS),
    imageUrl:
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=70',
    active: true,
    createdAt: '2021-03-14T09:00:00.000Z',
  },
  {
    id: 'loc_2',
    name: 'Central Branch',
    addressLine1: '18 King Street West',
    city: 'Manchester',
    postalCode: 'M2 6AG',
    country: 'United Kingdom',
    countryCode: 'GB',
    phone: '+44 161 496 0233',
    email: 'central@barberflow.demo',
    timezone: 'Europe/London',
    currency: 'GBP',
    openingHours: cloneHours(STANDARD_HOURS),
    imageUrl:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=70',
    active: true,
    createdAt: '2022-07-01T09:00:00.000Z',
  },
  {
    id: 'loc_3',
    name: 'Harbourside Studio',
    addressLine1: '9 Marina Parade',
    city: 'Brighton',
    postalCode: 'BN2 1TL',
    country: 'United Kingdom',
    countryCode: 'GB',
    phone: '+44 1273 558 004',
    email: 'harbourside@barberflow.demo',
    timezone: 'Europe/London',
    currency: 'GBP',
    openingHours: cloneHours(STANDARD_HOURS),
    imageUrl:
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=70',
    active: true,
    createdAt: '2024-02-19T09:00:00.000Z',
  },
];
