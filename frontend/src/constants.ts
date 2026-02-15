export enum EClientType {
	NONE = 'none',
	PASSENGER = 'passenger',
	DRIVER = 'driver',
}

export enum EDriverStatus {
	AVAILABLE = 'available',
	ON_RIDE = 'on_ride',
	OFFLINE = 'offline',
}

export enum ERideStatus {
	PENDING = 'pending',
	ACCEPTED = 'accepted',
	INITIATED = 'initiated',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled',
	NONE = 'none'
}

export enum EDriverLocationType {
	CUSTOM = 'custom',
	CURRENT = 'current',
}

export const CENTER_LOCATION_TITLE = 'Your Location';
export const CENTER_LOCATION_DESCRIPTION = 'You are here';
export const CENTER_LOCATION_POSITION = [51.5074, -0.1278]; // London

export const CONNECTION_ID_COOKIE_NAME = 'ws_connection_id';
export const CONNECTION_ID_EXPIRY_MINUTES = 30;
export const RECONNECT_DELAY = 3000;

export const RIDE_SESSION_TOKEN_COOKIE_NAME = 'ride_session_token';
export const DRIVER_RIDE_SESSION_TOKEN_COOKIE_NAME = 'driver_ride_session_token';
export const PASSENGER_ID_COOKIE_NAME = 'passenger_id';
export const RIDE_SESSION_TOKEN_MAX_AGE_SEC = 2 * 60 * 60;
export const RIDE_COOKIE_OPTIONS = { maxAge: RIDE_SESSION_TOKEN_MAX_AGE_SEC, sameSite: 'lax' as const, path: '/' };


export const POLL_MS_AVAILABLE = 15000;
export const POLL_MS_ON_RIDE = 2000;

export const STARS = [1, 2, 3, 4, 5] as const;


export const DEBOUNCE_MS = 500;
export const MIN_CHARS = 3;

