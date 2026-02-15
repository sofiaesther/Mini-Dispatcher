export interface QuoteResult {
  fare: number;
  distanceKm: number;
  durationMin: number;
}

export interface RideRequestPayload {
  passengerId: string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  fare: number;
  distanceKm: number;
  durationMin: number;
}
