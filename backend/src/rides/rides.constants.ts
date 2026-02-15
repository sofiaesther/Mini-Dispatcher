/** Fare formula: Base + (Distance × Price/km) + (Time × Price/min) */
export const FARE = {
  BASE_GBP: 1.5,
  PER_KM_GBP: 0.8,
  PER_MIN_GBP: 0.15,
} as const;

/** Average speed for time estimate (km/h) */
export const AVG_SPEED_KMH = 30;
