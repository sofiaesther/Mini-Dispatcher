import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { haversineKm } from '../common/geo';
import { DriversService } from '../drivers/drivers.service';
import * as presence from './presence.store';
import type { RideRequestPayload } from '../rides/rides.types';

const DISPATCH_TIMEOUT_MS = 15_000;
const RIDE_TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

interface RideTokenData {
  rideId: string;
  passengerId: string;
  driverId: string;
  exp: number;
}

const rideTokenByToken = new Map<string, RideTokenData>();
const rideIdToToken = new Map<string, string>();

interface PendingDispatch {
  rideId: string;
  payload: RideRequestPayload;
  driverIndex: number;
  timeoutId: ReturnType<typeof setTimeout> | undefined;
}

const pendingDispatches = new Map<string, PendingDispatch>();

export type ActiveRideStatus = 'accepted' | 'initiated' | 'completed';

interface ActiveRide {
  rideId: string;
  driverId: string;
  passengerId: string;
  status: ActiveRideStatus;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  price: number;
  distance: number;
  duration: number;
}

const activeRidesByRideId = new Map<string, ActiveRide>();
const activeRidesByDriverId = new Map<string, string>(); // driverId -> rideId

function sendToConnection(connectionId: string, type: string, data: object): void {
  const ws = presence.getWs(connectionId);
  if (!ws || ws.readyState !== 1) return; // OPEN = 1
  ws.send(JSON.stringify({ type, data }));
}

@Injectable()
export class RealtimeService {
  constructor(private readonly drivers: DriversService) {}

  registerClient(connectionId: string, clientType: 'driver' | 'passenger', clientId: string): void {
    presence.registerClient(connectionId, clientType, clientId);
  }

  /** Restore driver into active ride when reconnecting with valid ride token (e.g. after refresh). */
  restoreRideByTokenForDriver(connectionId: string, rideToken: string): void {
    const data = rideTokenByToken.get(rideToken);
    if (!data || data.exp < Date.now()) {
      if (data) {
        rideTokenByToken.delete(rideToken);
        rideIdToToken.delete(data.rideId);
      }
      return;
    }
    const ride = activeRidesByRideId.get(data.rideId);
    const client = presence.getClient(connectionId);
    if (!ride || !client || client.clientType !== 'driver' || ride.driverId !== client.clientId) return;

    const ridePayload = {
      rideId: ride.rideId,
      driverId: ride.driverId,
      passengerId: ride.passengerId,
      status: ride.status,
      from: ride.from,
      to: ride.to,
      price: ride.price,
      distance: ride.distance,
      duration: ride.duration,
      rideToken,
    };
    sendToConnection(connectionId, 'ride:accepted', ridePayload);
  }

  /** Restore passenger into active ride when reconnecting with valid ride token (e.g. after refresh). */
  async restoreRideByToken(connectionId: string, rideToken: string): Promise<void> {
    const data = rideTokenByToken.get(rideToken);
    if (!data || data.exp < Date.now()) {
      if (data) {
        rideTokenByToken.delete(rideToken);
        rideIdToToken.delete(data.rideId);
      }
      return;
    }
    const ride = activeRidesByRideId.get(data.rideId);
    if (!ride || ride.passengerId !== data.passengerId) return;

    const driverProfile = await this.drivers.getPublicProfile(ride.driverId);
    const driverName = driverProfile?.name ?? 'Driver';
    const driverCar = driverProfile?.car
      ? {
          model: driverProfile.car.model || '',
          color: driverProfile.car.color || '',
          plate: driverProfile.car.plate || '',
        }
      : undefined;
    const ridePayload = {
      rideId: ride.rideId,
      driverId: ride.driverId,
      driverName,
      driverCar,
      passengerId: ride.passengerId,
      status: ride.status,
      from: ride.from,
      to: ride.to,
      price: ride.price,
      distance: ride.distance,
      duration: ride.duration,
      rideToken,
    };
    sendToConnection(connectionId, 'ride:accepted', ridePayload);
  }

  /** Passenger cancels ride; only allowed while status is 'accepted' (before driver picks up). */
  async handlePassengerCancelRide(connectionId: string, rideId: string): Promise<void> {
    const client = presence.getClient(connectionId);
    if (!client || client.clientType !== 'passenger') return;
    const ride = activeRidesByRideId.get(rideId);
    if (!ride || ride.passengerId !== client.clientId) return;
    if (ride.status !== 'accepted') return;

    const token = rideIdToToken.get(rideId);
    if (token) {
      rideTokenByToken.delete(token);
      rideIdToToken.delete(rideId);
    }
    activeRidesByRideId.delete(rideId);
    activeRidesByDriverId.delete(ride.driverId);
    await this.drivers.updateStatus(ride.driverId, 'available');

    const passengerConnId = presence.getPassengerConnectionId(ride.passengerId);
    if (passengerConnId) {
      sendToConnection(passengerConnId, 'ride:cancelled', { rideId });
    }
    const driverConnId = presence.getDriverConnectionId(ride.driverId);
    if (driverConnId) {
      sendToConnection(driverConnId, 'ride:cancelled-by-passenger', { rideId });
    }
  }

  handleDisconnection(connectionId: string): void {
    presence.removeConnection(connectionId);
  }

  async handleDriverLocation(connectionId: string, lat: number, lon: number): Promise<void> {
    const client = presence.getClient(connectionId);
    if (client?.clientType !== 'driver') return;
    const driverId = client.clientId;
    await this.drivers.updateLocation(driverId, lat, lon);
    // Broadcast driver location to passenger if driver is on an active ride
    const rideId = activeRidesByDriverId.get(driverId);
    if (rideId) {
      const ride = activeRidesByRideId.get(rideId);
      if (ride) {
        const passengerConnId = presence.getPassengerConnectionId(ride.passengerId);
        if (passengerConnId) {
          const presenceData = await this.drivers.getPresence(driverId);
          sendToConnection(passengerConnId, 'driver:location-update', {
            driverId,
            lat,
            lng: lon,
            status: presenceData?.status ?? 'busy',
          });
        }
      }
    }
  }

  async handleDriverStatus(connectionId: string, status: 'available' | 'busy' | 'offline' | 'on_ride'): Promise<void> {
    const client = presence.getClient(connectionId);
    if (client?.clientType !== 'driver') return;
    const mapped = status === 'on_ride' ? 'busy' : status;
    await this.drivers.updateStatus(client.clientId, mapped);
  }

  async handleRideResponse(connectionId: string, rideId: string, accepted: boolean): Promise<void> {
    const pending = pendingDispatches.get(rideId);
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pendingDispatches.delete(rideId);

    const client = presence.getClient(connectionId);
    if (client?.clientType !== 'driver') return;
    const driverId = client.clientId;

    const passengerConnId = presence.getPassengerConnectionId(pending.payload.passengerId);
    if (!passengerConnId) return;

    if (accepted) {
      await this.drivers.updateStatus(driverId, 'busy');
      await this.drivers.createRide(
        rideId,
        driverId,
        pending.payload.passengerId,
        { lat: pending.payload.from.lat, lng: pending.payload.from.lon },
        { lat: pending.payload.to.lat, lng: pending.payload.to.lon },
        pending.payload.fare,
        pending.payload.distanceKm,
        pending.payload.durationMin,
      );
      const rideToken = randomBytes(24).toString('hex');
      const exp = Date.now() + RIDE_TOKEN_EXPIRY_MS;
      rideTokenByToken.set(rideToken, {
        rideId,
        passengerId: pending.payload.passengerId,
        driverId,
        exp,
      });
      rideIdToToken.set(rideId, rideToken);

      const driverProfile = await this.drivers.getPublicProfile(driverId);
      const driverName = driverProfile?.name ?? 'Driver';
      const driverCar = driverProfile?.car
        ? {
            model: driverProfile.car.model || '',
            color: driverProfile.car.color || '',
            plate: driverProfile.car.plate || '',
          }
        : undefined;
      const ridePayload = {
        rideId,
        driverId,
        driverName,
        driverCar,
        passengerId: pending.payload.passengerId,
        status: 'accepted',
        from: { lat: pending.payload.from.lat, lng: pending.payload.from.lon },
        to: { lat: pending.payload.to.lat, lng: pending.payload.to.lon },
        price: pending.payload.fare,
        distance: pending.payload.distanceKm,
        duration: pending.payload.durationMin,
        rideToken,
      };
      sendToConnection(passengerConnId, 'ride:accepted', ridePayload);
      // Store active ride and send ride:accepted to driver (with token for refresh persistence)
      const activeRide: ActiveRide = {
        rideId,
        driverId,
        passengerId: pending.payload.passengerId,
        status: 'accepted',
        from: ridePayload.from,
        to: ridePayload.to,
        price: ridePayload.price,
        distance: ridePayload.distance,
        duration: ridePayload.duration,
      };
      activeRidesByRideId.set(rideId, activeRide);
      activeRidesByDriverId.set(driverId, rideId);
      const driverConnId = presence.getDriverConnectionId(driverId);
      if (driverConnId) {
        sendToConnection(driverConnId, 'ride:accepted', ridePayload);
      }
    } else {
      void this.tryNextDriver(rideId, pending);
    }
  }

  async handleRideStatusUpdate(connectionId: string, rideId: string, status: ActiveRideStatus): Promise<void> {
    const client = presence.getClient(connectionId);
    if (client?.clientType !== 'driver') return;
    const driverId = client.clientId;
    const ride = activeRidesByRideId.get(rideId);
    if (!ride || ride.driverId !== driverId) return;

    ride.status = status;
    const payload = {
      rideId,
      driverId,
      passengerId: ride.passengerId,
      status,
      from: ride.from,
      to: ride.to,
      price: ride.price,
      distance: ride.distance,
      duration: ride.duration,
    };
    const passengerConnId = presence.getPassengerConnectionId(ride.passengerId);
    if (passengerConnId) {
      sendToConnection(passengerConnId, 'ride:status-update', payload);
    }
    const driverConnId = presence.getDriverConnectionId(driverId);
    if (driverConnId) {
      sendToConnection(driverConnId, 'ride:status-update', payload);
    }

    await this.drivers.updateRideStatus(rideId, status);

    if (status === 'completed') {
      const token = rideIdToToken.get(rideId);
      if (token) {
        rideTokenByToken.delete(token);
        rideIdToToken.delete(rideId);
      }
      activeRidesByRideId.delete(rideId);
      activeRidesByDriverId.delete(driverId);
      await this.drivers.updateStatus(driverId, 'available');
    }
  }

  /** Passenger submits ride evaluation (rating 1–5, optional comment). Persists to DB. */
  async handlePassengerRideEvaluation(
    connectionId: string,
    data: { rideId?: string; passengerId?: string; driverId?: string; rating?: number; comment?: string },
  ): Promise<void> {
    const client = presence.getClient(connectionId);
    if (!client || client.clientType !== 'passenger') return;
    const rideId = data.rideId != null ? String(data.rideId) : '';
    const passengerId = data.passengerId != null ? String(data.passengerId) : '';
    const driverId = data.driverId != null ? String(data.driverId) : '';
    const rating = typeof data.rating === 'number' ? data.rating : Number(data.rating);
    const comment = data.comment != null ? String(data.comment).trim() || undefined : undefined;
    if (!rideId || !passengerId || !driverId || Number.isNaN(rating)) return;
    if (passengerId !== client.clientId) return;
    await this.drivers.createRideEvaluation(rideId, passengerId, driverId, rating, comment);
  }

  dispatchRideRequest(rideId: string, payload: RideRequestPayload): void {
    pendingDispatches.set(rideId, {
      rideId,
      payload,
      driverIndex: -1,
      timeoutId: undefined,
    });
    void this.tryNextDriver(rideId, null);
  }

  private async tryNextDriver(rideId: string, prev: PendingDispatch | null): Promise<void> {
    const payload = prev?.payload ?? (pendingDispatches.get(rideId)?.payload);
    if (!payload) return;

    const available = await this.drivers.getAvailableDrivers();
    const fromLat = payload.from.lat;
    const fromLon = payload.from.lon;
    const sorted = [...available].sort((a, b) => {
      const distA = haversineKm(fromLat, fromLon, a.lat, a.lon);
      const distB = haversineKm(fromLat, fromLon, b.lat, b.lon);
      return distA - distB;
    });

    const driverIndex = prev === null ? 0 : prev.driverIndex + 1;
    if (driverIndex >= sorted.length) {
      pendingDispatches.delete(rideId);
      const passengerConnId = presence.getPassengerConnectionId(payload.passengerId);
      if (passengerConnId) {
        sendToConnection(passengerConnId, 'ride:no-drivers', { rideId });
      }
      return;
    }

    const driver = sorted[driverIndex];
    const connId = presence.getDriverConnectionId(driver.driverId);
    if (!connId) {
      const next =
        prev !== null
          ? { ...prev, driverIndex, timeoutId: prev.timeoutId }
          : { rideId, payload, driverIndex, timeoutId: undefined as ReturnType<typeof setTimeout> | undefined };
      void this.tryNextDriver(rideId, next);
      return;
    }

    const timeoutId = setTimeout(() => {
      const current = pendingDispatches.get(rideId);
      if (!current) return;
      pendingDispatches.delete(rideId);
      void this.tryNextDriver(rideId, {
        ...current,
        driverIndex: current.driverIndex + 1,
        timeoutId: undefined,
      });
    }, DISPATCH_TIMEOUT_MS);

    pendingDispatches.set(rideId, {
      rideId,
      payload,
      driverIndex,
      timeoutId,
    });

    sendToConnection(connId, 'ride:request', {
      rideId,
      passengerId: payload.passengerId,
      from: { lat: payload.from.lat, lng: payload.from.lon },
      to: { lat: payload.to.lat, lng: payload.to.lon },
      price: payload.fare,
      distance: payload.distanceKm,
      duration: payload.durationMin,
    });
  }
}
