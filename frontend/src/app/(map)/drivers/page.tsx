'use client';

/**
 * Authenticated driver dashboard at /drivers. Driver must be logged in (clientType DRIVER, clientId set).
 * Redirects to home if not a driver.
 */
import { useRouter } from 'next/navigation';
import { useClient } from "@context";
import { Button } from "@components/Buttons";
import { MapPin, Flag } from "lucide-react";
import { CENTER_LOCATION_DESCRIPTION, CENTER_LOCATION_TITLE, EClientType, EDriverLocationType, ERideStatus } from "@constants";
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Dashboard, PopUps, LocationChange } from '@components';
import { TPopupKey } from '@components/Popups/IPopup';
import { EDriverStatus } from '@constants';
import { useDriver, useLocations, useRealtimeStore } from '@hooks';
import ManualLocationButton from '@components/Buttons/subcomponents/ManualLocationButton';

export default function DriversDashboardPage() {
	const router = useRouter();
	const {clientType, clientId, updateClient, setUserLocationMarker, setRideMarkers, driverLocationType
		, setDriverLocationType } = useClient();
	const driverId = clientId;

	useEffect(() => {
		if (clientType === EClientType.DRIVER && driverId) {
			return;
		}
		const storedDriverId = typeof window !== 'undefined' ? window.sessionStorage.getItem('driverId') : null;
		if (storedDriverId) {
			updateClient(EClientType.DRIVER, storedDriverId);
			return;
		}
		toast.error('You are not a driver');
		router.replace('/');
	}, [clientType, driverId, updateClient, router]);

	const {
		driverStatus,
		isConnected,
		setOnRide,
		setAvailable,
		updateLocation,
		respondToRide,
		updateRideStatus,
	} = useDriver({ driverId });
	const [popup, setPopup] = useState<TPopupKey | undefined>(undefined);
	const [latInput, setLatInput] = useState('');
	const [lonInput, setLonInput] = useState('');
	const [loadingLocation, setLoadingLocation] = useState(false);
	const [showLocationChange, setShowLocationChange] = useState(false);
	const [driverCurrentRide, setDriverCurrentRide] = useState<{
		rideId: string
		from: { lat: number; lng: number }
		to: { lat: number; lng: number }
		status: 'accepted' | 'initiated'
	} | null>(null);
	const sentCurrentLocationRef = useRef(false);

	const { getClientLocation } = useLocations();
	const lastRideRequest = useRealtimeStore((s) => s.lastRideRequest);
	const currentDriverRideFromStore = useRealtimeStore((s) => s.currentDriverRide);
	const rideCancelledByPassenger = useRealtimeStore((s) => s.rideCancelledByPassenger);
	const setRideCancelledByPassenger = useRealtimeStore((s) => s.setRideCancelledByPassenger);
	const clearEvents = useRealtimeStore((s) => s.clearEvents);

	useEffect(() => {
		if (lastRideRequest) setPopup('incomingRideRequest');
	}, [lastRideRequest]);

	// Sync from store when ride is restored after refresh (ride token), status updated (e.g. initiated), or cancelled by passenger
	useEffect(() => {
		if (currentDriverRideFromStore) {
			setDriverCurrentRide({
				rideId: currentDriverRideFromStore.rideId,
				from: currentDriverRideFromStore.from,
				to: currentDriverRideFromStore.to,
				status: (currentDriverRideFromStore.status as 'accepted' | 'initiated') || 'accepted',
			});
			setOnRide();
		} else {
			setDriverCurrentRide(null);
			setRideMarkers([]);
			setAvailable();
		}
	}, [currentDriverRideFromStore, setOnRide, setAvailable, setRideMarkers]);

	useEffect(() => {
		if (rideCancelledByPassenger) {
			toast.info('Ride cancelled by passenger');
			setRideCancelledByPassenger(false);
		}
	}, [rideCancelledByPassenger, setRideCancelledByPassenger]);

	useEffect(() => {
		if (!isConnected || sentCurrentLocationRef.current) return;
		sentCurrentLocationRef.current = true;
		getClientLocation().then((loc) => {
			if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
				updateLocation(loc.lat, loc.lon);
				setLatInput(String(loc.lat));
				setLonInput(String(loc.lon));
			}
		});
	}, [isConnected]);

	const handleUpdateLocation = useCallback(
		(lat: number, lon: number) => {
			setUserLocationMarker({ position: [lat, lon], title: CENTER_LOCATION_TITLE, description: CENTER_LOCATION_DESCRIPTION });
			updateLocation(lat, lon);
			setDriverLocationType(EDriverLocationType.CUSTOM);
		},
		[updateLocation, setUserLocationMarker, setDriverLocationType],
	);

	const handleUseCurrentLocation = useCallback(async () => {
		if (!isConnected) {
			toast.error('Not connected yet');
			return;
		}
		sentCurrentLocationRef.current = false;
		setLoadingLocation(true);
		try {
			const loc = await getClientLocation();
			if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
				setLatInput(String(loc.lat));
				setLonInput(String(loc.lon));
				handleUpdateLocation(loc.lat, loc.lon);
				toast.success('Location updated');
			} else {
				toast.error('Could not get location');
			}
		} finally {
			setLoadingLocation(false);
			setDriverLocationType(EDriverLocationType.CURRENT);
		}
	}, [isConnected, getClientLocation, handleUpdateLocation]);

	const handleAccept = useCallback(() => {
		if (!lastRideRequest?.rideRequest) return;
		const req = lastRideRequest.rideRequest;
		respondToRide(req.rideId, true);
		setOnRide();
		setDriverCurrentRide({
			rideId: req.rideId,
			from: req.from,
			to: req.to,
			status: 'accepted',
		});
		setRideMarkers([
			{ position: [req.from.lat, req.from.lng], title: 'Pick-up', color: 'green' },
			{ position: [req.to.lat, req.to.lng], title: 'Destination', color: 'purple' }
		]);
		clearEvents();
		toast.success('Ride accepted');
	}, [lastRideRequest, respondToRide, setOnRide, clearEvents, setRideMarkers]);

	const handleReject = useCallback(() => {
		if (!lastRideRequest?.rideRequest) return;
		const { rideId } = lastRideRequest.rideRequest;
		respondToRide(rideId, false);
		clearEvents();
		toast.info('Ride rejected');
	}, [lastRideRequest, respondToRide, clearEvents]);

	useEffect(() => {
		if (!driverCurrentRide) {
			setRideMarkers([]);
			return;
		}
		if (driverCurrentRide.status === 'accepted') {
			setRideMarkers([
				{ position: [driverCurrentRide.from.lat, driverCurrentRide.from.lng], title: 'Pick-up', color: 'green' },
				{ position: [driverCurrentRide.to.lat, driverCurrentRide.to.lng], title: 'Destination', color: 'purple' },
			]);
		} else {
			setRideMarkers([
				{ position: [driverCurrentRide.to.lat, driverCurrentRide.to.lng], title: 'Destination', color: 'green' },
			]);
		}
	}, [driverCurrentRide, setRideMarkers]);


	useEffect(() => {
		if (lastRideRequest) setPopup('incomingRideRequest');
	}, [lastRideRequest]);

	const handlePassengerPickedUp = useCallback(() => {
		if (!driverCurrentRide || driverCurrentRide.status !== 'accepted') return;
		updateRideStatus(driverCurrentRide.rideId, ERideStatus.INITIATED);
		setDriverCurrentRide((prev) => (prev ? { ...prev, status: 'initiated' } : null));
		toast.success('Ride in progress');
	}, [driverCurrentRide, updateRideStatus]);

	const handleEndRide = useCallback(() => {
		if (!driverCurrentRide) return;
		updateRideStatus(driverCurrentRide.rideId, ERideStatus.COMPLETED);
		setDriverCurrentRide(null);
		setRideMarkers([]);
		setAvailable();
		toast.success('Ride ended – you are available again');
	}, [driverCurrentRide, updateRideStatus, setAvailable, setRideMarkers]);

	if (clientType !== EClientType.DRIVER || !driverId) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
					<p className="mt-4 text-gray-600">Redirecting...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="min-h-screen fixed top-0 left-0 w-full z-10">
				<div className="container mx-auto px-3 py-6 max-w-xlg">
					<Dashboard>
						<ManualLocationButton onClick={() => setShowLocationChange(true)} />
					</Dashboard>

					{driverStatus === EDriverStatus.ON_RIDE && driverCurrentRide && (
						<div className="fixed z-10 bottom-0 left-[50%] translate-x-[-50%] max-w-md bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
							<p className="text-sm text-indigo-900 mb-3">
								{driverCurrentRide.status === 'accepted'
									? 'Go to pick-up. When passenger is in the car, tap below.'
									: 'Ride in progress. Tap End Ride when done.'}
							</p>
							<div className="flex flex-col gap-2">
								{driverCurrentRide.status === 'accepted' && (
									<Button
										color="secondary"
										text="Passenger picked up"
										icon={<MapPin className="h-5 w-5" />}
										onClick={handlePassengerPickedUp}
									/>
								)}
								<Button
									color="ghost"
									text="End Ride"
									icon={<Flag className="h-5 w-5" />}
									onClick={handleEndRide}
								/>
							</div>
						</div>
					)}

					<LocationChange
						isOpen={showLocationChange}
						onClose={() => setShowLocationChange(false)}
						isConnected={isConnected}
						loadingLocation={loadingLocation}
						latInput={latInput}
						lonInput={lonInput}
						setLatInput={setLatInput}
						setLonInput={setLonInput}
						onUseCurrentLocation={handleUseCurrentLocation}
						onUpdateLocation={handleUpdateLocation}
					/>
				</div>
			</div>
			<PopUps
				popup={popup}
				setPopup={setPopup}
				incomingRequest={lastRideRequest?.rideRequest}
				onAcceptRequest={handleAccept}
				onRejectRequest={handleReject}
			/>
		</>
	);
}
