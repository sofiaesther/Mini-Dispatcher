'use client';

import { useClient } from "@context";
import { EClientType, ERideStatus } from "@constants";
import { Dashboard, PopUps } from "@components/index";
import { useCallback, useState, useEffect, useRef } from "react";
import type { TPopupKey } from "@components/Popups/IPopup";
import RideInfoPassanger from "@components/RideInfoPassanger";
import { toast } from "react-toastify";
import { useRealtimeStore } from "@hooks";
import { usePassengerRealtime } from "@context/PassengerRealtimeContext";
import { clientFetchDriverPublicProfile } from "@lib/driverApi";
import { TMapMarkerColor } from "@components/Map";
import { clearRideSessionCookie, getRestoredPassengerClientId, setPassengerIdCookie } from "@/hooks/useWebSocket";


export default function PassengerPage() {
	const {clientType, updateClient, clientId, setRideMarkers } = useClient();
	const [popup, setPopup] = useState<TPopupKey | undefined>(undefined);
	const passengerWs = usePassengerRealtime();
	const { cancelRide, requestRide, evaluateRide } = passengerWs ?? { cancelRide: () => {}, requestRide: undefined, evaluateRide: () => {} };
	const currentRide = useRealtimeStore((s) => s.currentRide);
	const lastNoDrivers = useRealtimeStore((s) => s.lastNoDrivers);
	const mergeCurrentRide = useRealtimeStore((s) => s.mergeCurrentRide);
	const lastCompletedRideIdRef = useRef<string | null>(null);
	const driverLocation = useRealtimeStore((s) => currentRide?.driverId ? s.driversById[currentRide.driverId] : null);

	const handleRequestRide = useCallback(() => {
		setPopup('requestRide');
	}, []);

	useEffect(() => {
		if (currentRide && lastNoDrivers && currentRide.status === ERideStatus.PENDING) {
			toast.error('Sorry, no drivers are available right now. Please try again later.');
			clearRideSessionCookie();
		}
	}, [lastNoDrivers, currentRide]);

	// Ensure passenger has a clientId for WebSocket and ride requests (restore same id from cookie when reconnecting during active ride)
	useEffect(() => {
		if (clientType !== EClientType.PASSENGER || !clientId) {
			const restored = getRestoredPassengerClientId();
			const id = restored ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '');
			if (id) {
				updateClient(EClientType.PASSENGER, id);
				setPassengerIdCookie(id);
			}
		}
	}, [clientType, clientId, updateClient]);

	// When ride has driver but no car info (e.g. backend restarted), fetch driver profile and merge
	useEffect(() => {
		const ride = currentRide;
		if (!ride?.driverId || ride.status === ERideStatus.COMPLETED || ride.status === ERideStatus.CANCELLED) return;
		const hasCar = ride.driverCar && (ride.driverCar.model || ride.driverCar.color || ride.driverCar.plate);
		if (hasCar) return;

		let cancelled = false;
		clientFetchDriverPublicProfile(ride.driverId)
			.then((profile) => {
				if (cancelled || !profile) return;
				mergeCurrentRide({
					driverName: profile.name ?? ride.driverName,
					driverCar: profile.car
						? { model: profile.car.model ?? '', color: profile.car.color ?? '', plate: profile.car.plate ?? '' }
						: undefined,
				});
			})
			.catch(() => {});
		return () => { cancelled = true; };
	}, [currentRide, mergeCurrentRide]);

    	// Show pick-up, destination and driver (real-time) when ride is ACCEPTED or INITIATED
	useEffect(() => {
		const inRide = currentRide && (currentRide.status === ERideStatus.ACCEPTED || currentRide.status === ERideStatus.INITIATED);
		if (!inRide || currentRide.status === ERideStatus.COMPLETED || currentRide.status === ERideStatus.CANCELLED) {
			setRideMarkers([]);
			return;
		}

		const from = currentRide.from;
		const to = currentRide.to;
		const hasFrom = typeof from?.lat === 'number' && typeof from?.lng === 'number';
		const hasTo = typeof to?.lat === 'number' && typeof to?.lng === 'number';
		const hasDriver = currentRide.driverId && driverLocation && typeof driverLocation.lat === 'number' && typeof driverLocation.lng === 'number';

		const markers: Array<{ position: [number, number]; title?: string; description?: string; color?: TMapMarkerColor; customColor?: string }> = [];
		if (hasFrom) {
			markers.push({ position: [from.lat, from.lng], title: 'Pick-up', description: 'Partida', color: 'green' });
		}
		if (hasTo) {
			markers.push({ position: [to.lat, to.lng], title: 'Destination', description: 'Destino', color: 'purple' });
		}

		if (hasDriver) {
			markers.push({
				position: [driverLocation!.lat, driverLocation!.lng],
				title: 'Driver',
				description: 'Your driver',
				color: 'black',
			});
		}

		setRideMarkers(markers);
	}, [currentRide?.status, currentRide?.driverId, driverLocation?.lat, driverLocation?.lng]);

	// Open evaluation popup once when ride completes
	useEffect(() => {
		if (!currentRide) {
			lastCompletedRideIdRef.current = null;
			return;
		}
		if (currentRide.status === ERideStatus.COMPLETED && currentRide.rideId && currentRide.rideId !== lastCompletedRideIdRef.current) {
			lastCompletedRideIdRef.current = currentRide.rideId;
			let cancelled = false;
			queueMicrotask(() => {
				if (!cancelled) setPopup('rideEvaluation');
			});
			return () => { cancelled = true; };
		}
	}, [currentRide]);

	const handleCancelRide = useCallback(() => {
		if (currentRide?.status !== ERideStatus.ACCEPTED || !currentRide.rideId) return;
		cancelRide(currentRide.rideId);
		toast.error('Ride cancelled');
	}, [cancelRide, currentRide]);

	const handleEvaluateRide = useCallback(
		(rating: number, comment?: string) => {
			if (currentRide?.rideId && currentRide?.driverId && clientId) {
				evaluateRide({
					rideId: currentRide.rideId,
					passengerId: clientId,
					driverId: currentRide.driverId,
					rating,
					comment,
				});
			}
		},
		[currentRide, clientId, evaluateRide],
	);

	if (clientType !== EClientType.PASSENGER) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[100] min-h-screen bg-transparent from-blue-50 to-indigo-100">
			<Dashboard onRequestRide={handleRequestRide}>
				<RideInfoPassanger
					status={currentRide && !lastNoDrivers ? currentRide?.status : ERideStatus.NONE}
					handleRequestRide={handleRequestRide}
					handleCancelRide={handleCancelRide}
				/>
			</Dashboard>
			<PopUps
				popup={popup}
				setPopup={setPopup}
				requestRide={requestRide}
				passengerId={clientId ?? undefined}
				onEvaluateRide={handleEvaluateRide}
			/>
		</div>
	);
}
