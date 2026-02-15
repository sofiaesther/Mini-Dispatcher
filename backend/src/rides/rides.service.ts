import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { haversineKm } from '../common/geo';
import { FARE, AVG_SPEED_KMH } from './rides.constants';
import type { QuoteResult, RideRequestPayload } from './rides.types';
import { DriversService } from '../drivers/drivers.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class RidesService {
  constructor(
    private readonly drivers: DriversService,
    private readonly realtime: RealtimeService,
  ) {}

  quote(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
  ): QuoteResult {
    const distanceKm = haversineKm(fromLat, fromLon, toLat, toLon);
    const durationMin = (distanceKm / AVG_SPEED_KMH) * 60;
    const fare =
      FARE.BASE_GBP +
      distanceKm * FARE.PER_KM_GBP +
      durationMin * FARE.PER_MIN_GBP;
    return {
      fare: Math.round(fare * 100) / 100,
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMin: Math.round(durationMin * 10) / 10,
    };
  }

  requestRide(payload: RideRequestPayload): { rideId: string } {
    const rideId = randomUUID();
    this.realtime.dispatchRideRequest(rideId, payload);
    return { rideId };
  }
}
