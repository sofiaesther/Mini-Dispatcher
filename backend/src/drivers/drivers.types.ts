export type DriverStatus = 'available' | 'busy' | 'offline';

export interface DriverCar {
  model: string;
  plate: string;
  year: number;
  color: string;
}

export interface DriverProfile {
  driverId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  city?: string;
  createdAt?: number;
  car?: DriverCar;
}

export interface DriverPresence {
  driverId: string;
  lat: number;
  lon: number;
  status: DriverStatus;
  updatedAt: number;
}

/** Public driver info (no password). Used for GET /drivers/:id */
export interface DriverPublicProfile {
  driverId: string;
  name: string;
  city: string;
  /** Timestamp (ms) when the account was created */
  dateStart: number;
  /** Average rating 1–5 from ride evaluations; undefined if no evaluations */
  rating?: number;
  /** Number of completed rides */
  rideCount: number;
  car: DriverCar;
  presence?: {
    lat: number;
    lon: number;
    status: DriverStatus;
  };
}
