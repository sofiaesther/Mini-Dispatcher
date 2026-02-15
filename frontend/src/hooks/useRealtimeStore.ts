'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { IDriverLocation, IRideRequest, IRideResponse } from '@hooks/useWebSocket';
import { EDriverStatus } from '@constants';

type IRideRequestEvent = {
  rideRequest: IRideRequest;
  receivedAt: number;
};

type INoDriversEvent = {
  rideId: string;
  receivedAt: number;
};

type RealtimeState = {
  // Connection/UI
  isConnected: boolean;
  connectionId: string | null;

  // Data
  driversById: Record<string, IDriverLocation>;
  currentRide: IRideResponse | null;
  currentDriverRide: IRideResponse | null;

  // events
  lastRideRequest: IRideRequestEvent | null;
  lastNoDrivers: INoDriversEvent | null;
  rideCancelledByPassenger: boolean;

  // Actions
  setConnected: (v: boolean) => void;
  setConnectionId: (id: string | null) => void;

  upsertDriver: (driver: IDriverLocation) => void;
  updateDriverStatus: (driverId: string, status: EDriverStatus) => void;
  removeDriver: (driverId: string) => void;

  setCurrentRide: (ride: IRideResponse | null) => void;
  /** Merge payload into current ride */
  mergeCurrentRide: (partial: Partial<IRideResponse>) => void;
  setCurrentDriverRide: (ride: IRideResponse | null) => void;

  pushRideRequest: (rideRequest: IRideRequest) => void;
  pushNoDrivers: (rideId: string) => void;
  setRideCancelledByPassenger: (v: boolean) => void;

  // Optional helpers
  clearEvents: () => void;

  // WS disconnect (called on logout)
  disconnectWs: (() => void) | null;
  setDisconnectWs: (fn: (() => void) | null) => void;
};

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
	isConnected: false,
	connectionId: null,

	driversById: {},
	currentRide: null,
	currentDriverRide: null,

	lastRideRequest: null,
	lastNoDrivers: null,
	rideCancelledByPassenger: false,

	setConnected: (v) => set({ isConnected: v }),
	setConnectionId: (id) => set({ connectionId: id }),

	upsertDriver: (driver) =>
		set((state) => ({
			driversById: {
				...state.driversById,
				[driver.driverId]: driver,
			},
		})),

	updateDriverStatus: (driverId, status) =>
		set((state) => {
			const existing = state.driversById[driverId];
			if (!existing) return state;

			if (status === EDriverStatus.OFFLINE) {
				const { [driverId]: _, ...rest } = state.driversById;
				return { driversById: rest };
			}

			return {
				driversById: {
					...state.driversById,
					[driverId]: { ...existing, status },
				},
			};
		}),

	removeDriver: (driverId) =>
		set((state) => {
			const { [driverId]: _, ...rest } = state.driversById;
			return { driversById: rest };
		}),

	setCurrentRide: (ride) => set({ currentRide: ride }),
	mergeCurrentRide: (partial) =>
		set((state) => {
			if (!state.currentRide) return { currentRide: partial as IRideResponse };
			if (partial.rideId && partial.rideId !== state.currentRide.rideId) return { currentRide: partial as IRideResponse };
			return {
				currentRide: {
					...state.currentRide,
					...partial,
					driverName: partial.driverName ?? state.currentRide.driverName,
					driverCar: partial.driverCar ?? state.currentRide.driverCar,
				},
			};
		}),
	setCurrentDriverRide: (ride) => set({ currentDriverRide: ride }),

	pushRideRequest: (rideRequest) =>
		set({
			lastRideRequest: { rideRequest, receivedAt: Date.now() },
		}),

	pushNoDrivers: (rideId) =>
		set({
			lastNoDrivers: { rideId, receivedAt: Date.now() },
		}),

	setRideCancelledByPassenger: (v) => set({ rideCancelledByPassenger: v }),

	clearEvents: () => set({ lastRideRequest: null, lastNoDrivers: null }),


	disconnectWs: null,
	setDisconnectWs: (fn) => set({ disconnectWs: fn }),
}));

export const useDrivers = () =>
	useRealtimeStore(useShallow((s) => Object.values(s.driversById)));
