'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { useShallow } from 'zustand/react/shallow';
import { useRealtimeStore } from '@hooks/useRealtimeStore';
import { EDriverStatus, ERideStatus, CONNECTION_ID_COOKIE_NAME, CONNECTION_ID_EXPIRY_MINUTES, RECONNECT_DELAY, RIDE_SESSION_TOKEN_COOKIE_NAME, DRIVER_RIDE_SESSION_TOKEN_COOKIE_NAME, PASSENGER_ID_COOKIE_NAME, RIDE_COOKIE_OPTIONS, EClientType } from '@constants';

export interface IDriverLocation {
	driverId: string;
	lat: number;
	lng: number;
	status: EDriverStatus;
}

export interface IRideRequest {
	rideId: string;
	passengerId: string;
	from: { lat: number; lng: number };
	to: { lat: number; lng: number };
	price: number;
	distance: number;
	duration: number;
}

export interface IRideResponse {
	rideId: string;
	driverId?: string;
	driverName?: string;
	driverCar?: { model: string; color: string; plate: string };
	passengerId: string;
	status: ERideStatus;
	from: { lat: number; lng: number };
	to: { lat: number; lng: number };
	price: number;
	distance: number;
	duration: number;
}

export interface IDriverRideResponse {
	rideId: string;
	accepted: boolean;
	driverId: string;
}

export interface IRideEvaluation {
	rideId: string;
	passengerId: string;
	driverId: string;
	rating: number;
	comment?: string;
}

interface IWebSocketMessage {
	type: string;
	data?: unknown;
	error?: string;
	connectionId?: string;
}

function setRideSessionCookie(token: string): void {
	if (typeof window === 'undefined') return;
	setCookie(RIDE_SESSION_TOKEN_COOKIE_NAME, token, RIDE_COOKIE_OPTIONS);
}

function setDriverRideSessionCookie(token: string): void {
	if (typeof window === 'undefined') return;
	setCookie(DRIVER_RIDE_SESSION_TOKEN_COOKIE_NAME, token, RIDE_COOKIE_OPTIONS);
}

export function clearRideSessionCookie(): void {
	if (typeof window === 'undefined') return;
	deleteCookie(RIDE_SESSION_TOKEN_COOKIE_NAME, { path: '/' });
}

function clearDriverRideSessionCookie(): void {
	if (typeof window === 'undefined') return;
	deleteCookie(DRIVER_RIDE_SESSION_TOKEN_COOKIE_NAME, { path: '/' });
}

export function setPassengerIdCookie(passengerId: string): void {
	if (typeof window === 'undefined') return;
	setCookie(PASSENGER_ID_COOKIE_NAME, passengerId, RIDE_COOKIE_OPTIONS);
}

export function clearPassengerSessionCookies(): void {
	if (typeof window === 'undefined') return;
	deleteCookie(PASSENGER_ID_COOKIE_NAME, { path: '/' });
	clearRideSessionCookie();
}

/** If there is an active ride session token, returns the persisted passenger id to restore (same clientId as before refresh). */
export function getRestoredPassengerClientId(): string | null {
	if (typeof window === 'undefined') return null;
	const token = getCookie(RIDE_SESSION_TOKEN_COOKIE_NAME);
	const id = getCookie(PASSENGER_ID_COOKIE_NAME);
	if (token && id && typeof id === 'string') return id;
	return null;
}

export function useWebSocket(
	clientType: EClientType,
	clientId: string | null,
) {
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const manuallyClosedRef = useRef(false);
	const connectRef = useRef<() => void>(() => {});

	// Always start as null to avoid hydration mismatch (server has no cookie; client might).
	// Cookie is read in connect() and state is updated after mount.
	const [connectionId, setConnectionIdLocal] = useState<string | null>(null);

	const setConnected = useRealtimeStore((s) => s.setConnected);
	const setConnectionId = useRealtimeStore((s) => s.setConnectionId);
	const setDisconnectWs = useRealtimeStore((s) => s.setDisconnectWs);
	const upsertDriver = useRealtimeStore((s) => s.upsertDriver);
	const updateDriverStatusInStore = useRealtimeStore((s) => s.updateDriverStatus);
	const setCurrentRide = useRealtimeStore((s) => s.setCurrentRide);
	const mergeCurrentRide = useRealtimeStore((s) => s.mergeCurrentRide);
	const setCurrentDriverRide = useRealtimeStore((s) => s.setCurrentDriverRide);
	const setRideCancelledByPassenger = useRealtimeStore((s) => s.setRideCancelledByPassenger);
	const pushRideRequest = useRealtimeStore((s) => s.pushRideRequest);
	const pushNoDrivers = useRealtimeStore((s) => s.pushNoDrivers);

	const isConnected = useRealtimeStore((s) => s.isConnected);
	const currentRide = useRealtimeStore((s) => s.currentRide);
	const drivers = useRealtimeStore(
		useShallow((s) => Object.values(s.driversById)),
	);

	const saveConnectionId = useCallback((id: string | null) => {
		if (typeof window === 'undefined') return;

		if (id) {
	  const expires = new Date(Date.now() + CONNECTION_ID_EXPIRY_MINUTES * 60 * 1000);
	  setCookie(CONNECTION_ID_COOKIE_NAME, id, { expires });
		} else {
	  setCookie(CONNECTION_ID_COOKIE_NAME, '', { expires: new Date(0) });
		}
	}, []);

	const handleMessage = useCallback(
		(message: IWebSocketMessage) => {
	  switch (message.type) {
				case 'connected':
				case 'registered': {
		  if (message.connectionId) {
						setConnectionIdLocal(message.connectionId);
						saveConnectionId(message.connectionId);
						setConnectionId(message.connectionId);
		  }
		  break;
				}

				case 'driver:location-update': {
		  const raw = message.data as Record<string, unknown>;
		  const lat = Number(raw?.lat);
		  const lng = Number(raw?.lng ?? raw?.lon);

		  if (raw?.driverId != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
						upsertDriver({
			  driverId: String(raw.driverId),
			  lat,
			  lng,
			  status: (raw?.status as EDriverStatus) ?? EDriverStatus.ON_RIDE,
						});
		  }
		  break;
				}

				case 'driver:status-update': {
		  const data = message.data as { driverId: string; status: EDriverStatus };
		  updateDriverStatusInStore(data.driverId, data.status);
		  break;
				}

				case 'ride:request': {
		  pushRideRequest(message.data as IRideRequest);
		  break;
				}

				case 'ride:request-sent': {
		  const data = message.data as { rideId?: string };
		  if (data?.rideId) {
						setCurrentRide({
			  rideId: data.rideId,
			  status: ERideStatus.PENDING,
			  passengerId: '',
			  from: { lat: 0, lng: 0 },
			  to: { lat: 0, lng: 0 },
			  price: 0,
			  distance: 0,
			  duration: 0,
						});
		  }
		  break;
				}

				case 'ride:accepted': {
		  const payload = message.data as IRideResponse & { rideToken?: string };
		  if (payload?.rideToken) {
						if (clientType === 'passenger') {
			  setRideSessionCookie(payload.rideToken);
			  if (payload.passengerId) setPassengerIdCookie(payload.passengerId);
						}
						if (clientType === 'driver') setDriverRideSessionCookie(payload.rideToken);
		  }
		  if (clientType === 'passenger') setCurrentRide(payload);
		  if (clientType === 'driver') setCurrentDriverRide(payload);
		  break;
				}
				case 'ride:status-update': {
		  const ride = message.data as IRideResponse;
		  if (clientType === 'passenger') mergeCurrentRide(ride);
		  if (clientType === 'driver') {
						setCurrentDriverRide(ride?.status === ERideStatus.COMPLETED || ride?.status === ERideStatus.CANCELLED ? null : ride);
						if (ride?.status === ERideStatus.COMPLETED || ride?.status === ERideStatus.CANCELLED) clearDriverRideSessionCookie();
		  }
		  if (clientType === 'passenger' && (ride?.status === ERideStatus.COMPLETED || ride?.status === ERideStatus.CANCELLED)) {
						clearRideSessionCookie();
		  }
		  break;
				}

				case 'ride:info': {
		  setCurrentRide(message.data as IRideResponse);
		  break;
				}

				case 'ride:cancelled': {
		  if (clientType === 'passenger') {
						setCurrentRide(null);
						clearRideSessionCookie();
		  }
		  break;
				}
				case 'ride:cancelled-by-passenger': {
		  if (clientType === 'driver') {
						setCurrentDriverRide(null);
						clearDriverRideSessionCookie();
						setRideCancelledByPassenger(true);
		  }
		  break;
				}

				case 'ride:no-drivers': {
		  const data = message.data as { rideId?: string };
		  pushNoDrivers(data?.rideId ?? 'unknown');
		  break;
				}

				case 'error':
		  console.error('[WS ERROR]', message.error);
		  break;
	  }
		},
		[
	  clientType,
	  saveConnectionId,
	  setConnectionId,
	  upsertDriver,
	  updateDriverStatusInStore,
	  setCurrentRide,
	  mergeCurrentRide,
	  setCurrentDriverRide,
	  setRideCancelledByPassenger,
	  pushRideRequest,
	  pushNoDrivers,
		],
	);

	const connect = useCallback(() => {
		if (!clientType || !clientId) return;

		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

		const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/';
		const base = rawWsUrl.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://').replace(/\/$/, '');
		const wsUrl = base.endsWith('/ws') ? base : `${base}/ws`;
		manuallyClosedRef.current = false;

		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;

		ws.onopen = () => {
	  setConnected(true);

	  const savedConnectionId = getCookie(CONNECTION_ID_COOKIE_NAME);

	  const rideToken =
		clientType === 'passenger'
		  ? (getCookie(RIDE_SESSION_TOKEN_COOKIE_NAME) as string | undefined)
		  : clientType === 'driver'
				? (getCookie(DRIVER_RIDE_SESSION_TOKEN_COOKIE_NAME) as string | undefined)
				: undefined;
	  ws.send(
				JSON.stringify({
		  type: 'register',
		  data: {
						clientType,
						clientId,
						connectionId: savedConnectionId || undefined,
						...(rideToken ? { rideToken } : {}),
		  },
				}),
	  );
		};

		ws.onmessage = (event) => {
	  try {
				handleMessage(JSON.parse(event.data));
	  } catch (e) {
				console.error('Invalid WS message', e);
	  }
		};

		ws.onerror = () => {
	  setConnected(false);
		};

		ws.onclose = () => {
	  setConnected(false);
	  wsRef.current = null;

	  if (manuallyClosedRef.current) return;

	  reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), RECONNECT_DELAY);
		};
	}, [clientType, clientId, handleMessage, setConnected]);

	useEffect(() => {
		connectRef.current = connect;
	}, [connect]);

	const sendMessage = useCallback((type: string, data: unknown) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
	  console.warn('[WS] not connected, message skipped:', type);
	  return;
		}
		ws.send(JSON.stringify({ type, data }));
	}, []);

	// Driver methods
	const sendDriverLocation = useCallback(
		(location: { lat: number; lng: number }) => {
	  sendMessage('driver:location', {
				lat: location.lat,
				lng: location.lng,
	  });
		},
		[sendMessage],
	);

	const sendDriverStatus = useCallback(
		(status: EDriverStatus) => {
	  sendMessage('driver:status', { status });
		},
		[sendMessage],
	);

	const respondToRide = useCallback(
		(rideId: string, accepted: boolean) => {
	  sendMessage('driver:ride-response', { rideId, accepted });
		},
		[sendMessage],
	);

	// Passenger methods
	const requestRide = useCallback(
		(rideRequest: IRideRequest) => {
	  sendMessage('passenger:request-ride', rideRequest);
		},
		[sendMessage],
	);

	const getRide = useCallback(
		(rideId: string) => {
	  sendMessage('passenger:get-ride', { rideId });
		},
		[sendMessage],
	);

	const cancelRide = useCallback(
		(rideId: string) => {
	  sendMessage('passenger:cancel-ride', { rideId });
		},
		[sendMessage],
	);

	const updateRideStatus = useCallback(
		(rideId: string, status: ERideStatus) => {
	  sendMessage('ride:update-status', { rideId, status });
		},
		[sendMessage],
	);

	const evaluateRide = useCallback(
		(evaluation: IRideEvaluation) => {
	  sendMessage('passenger:ride-evaluation', evaluation);
	  clearRideSessionCookie();
		},
		[sendMessage],
	);

	const disconnect = useCallback(() => {
		manuallyClosedRef.current = true;
		if (reconnectTimeoutRef.current) {
	  clearTimeout(reconnectTimeoutRef.current);
	  reconnectTimeoutRef.current = null;
		}
		wsRef.current?.close();
		wsRef.current = null;
		setConnected(false);
	}, [setConnected]);

	useEffect(() => {
		setDisconnectWs(() => disconnect);
		return () => {
	  setDisconnectWs(null);
	  disconnect();
		};
	}, [setDisconnectWs, disconnect]);

	useEffect(() => {
		connect();
	}, [connect]);

	return {
		isConnected,
		connectionId,
		drivers,
		currentRide,

		sendDriverLocation,
		sendDriverStatus,
		respondToRide,

		requestRide,
		getRide,
		cancelRide,
		updateRideStatus,
		evaluateRide,
	};
}
