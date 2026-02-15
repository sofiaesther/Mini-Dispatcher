import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocations } from './useLocations';
import { useWebSocket } from '@/hooks/useWebSocket';
import { EDriverStatus, POLL_MS_ON_RIDE, POLL_MS_AVAILABLE, EClientType, EDriverLocationType } from '@constants';
import { useClient } from '@context/ClientContext';

type UseDriverArgs = {
  driverId: string;
};

const useDriver = ({ driverId }: UseDriverArgs) => {
	const [driverStatus, setDriverStatus] = useState<EDriverStatus>(EDriverStatus.OFFLINE);
	const { getClientLocation } = useLocations();
	const { driverLocationType } = useClient();
	const [manualLocation, setManualLocation] = useState<{ lat: number; lon: number } | undefined>(undefined);

	const { isConnected, sendDriverLocation, sendDriverStatus, respondToRide, updateRideStatus } =
    useWebSocket(EClientType.DRIVER, driverId);

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const runIdRef = useRef(0);
	const inFlightRef = useRef(false);

	const shouldSendLocation =
    driverStatus === EDriverStatus.AVAILABLE || driverStatus === EDriverStatus.ON_RIDE;

	const intervalMs =
    driverStatus === EDriverStatus.ON_RIDE ? POLL_MS_ON_RIDE : POLL_MS_AVAILABLE;

	const pushLocation = useCallback(async () => {
		if (!isConnected) return;
		if (inFlightRef.current) return;

		inFlightRef.current = true;

		try {
			const loc = driverLocationType === EDriverLocationType.CURRENT
				? await getClientLocation()
				: manualLocation ? {...manualLocation} : undefined;
			if (loc == null || typeof loc.lat !== 'number' || typeof loc.lon !== 'number' || !loc) return;

			sendDriverLocation({
				lat: loc.lat,
				lng: loc.lon,
			});
		} catch (e) {
			console.error('location send error', e);
		} finally {
			inFlightRef.current = false;
		}
	}, [isConnected, driverLocationType, manualLocation]);

	useEffect(() => {
		if (!isConnected) return;
		sendDriverStatus(driverStatus as EDriverStatus);
	}, [driverStatus, isConnected]);

	// Push location to backend every intervalMs
	useEffect(() => {
		runIdRef.current += 1;
		const myRunId = runIdRef.current;

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		if (!shouldSendLocation) return;

		const run = async () => {
			if (runIdRef.current !== myRunId) return;

			await pushLocation();

			if (runIdRef.current !== myRunId) return;

			timeoutRef.current = setTimeout(run, intervalMs);
		};

		run();

		return () => {
			runIdRef.current += 1;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [shouldSendLocation, intervalMs]);

	const handleStatus = useCallback(() => {
		if (!isConnected && driverStatus === EDriverStatus.OFFLINE) {
			toast.error('Realtime not connected yet');
			return;
		}

		if (driverStatus === EDriverStatus.ON_RIDE) {
			toast.error('You are already on a ride');
			return;
		}

		setDriverStatus((prev) =>
			prev === EDriverStatus.AVAILABLE ? EDriverStatus.OFFLINE : EDriverStatus.AVAILABLE,
		);
	}, [driverStatus, isConnected]);

	const setOnRide = useCallback(() => {
		setDriverStatus(EDriverStatus.ON_RIDE);
	}, []);

	const setAvailable = useCallback(() => {
		setDriverStatus(EDriverStatus.AVAILABLE);
	}, []);

	const setOffline = useCallback(() => {
		setDriverStatus(EDriverStatus.OFFLINE);
	}, []);

	/** Manually set and send location to backend (e.g. from lat/lon inputs or map click). */
	const updateLocation = useCallback(
		(lat: number, lng: number) => {
			if (!isConnected) return;
			setManualLocation({ lat, lon: lng });
			sendDriverLocation({ lat, lng: lng });
		},
		[isConnected],
	);

	return {
		driverStatus,
		handleStatus,
		isConnected,
		setOnRide,
		setAvailable,
		setOffline,
		updateLocation,
		respondToRide,
		updateRideStatus,
	};
};

export default useDriver;
