'use client';

import { useCallback, useState } from 'react';
import FindEndPoints from './subcomponents/FindEndPoints';
import { type TGeocodeResult } from '@components/Map';
import RequestRide from './subcomponents/RequestRide';
import { RideInfo } from '@/hooks/useRides';
import type { IRideRequest as RideRequest } from '@/hooks/useWebSocket';

export type SearchData = {
	initialPointResult?: TGeocodeResult;
	endPointResults: TGeocodeResult[];
}

export type FormData = {
	initialPointCord: { lat: number; lon: number; name: string };
	initialPointSearch: string;
	endPointSearch: string;
	endPointCord: { lat: number; lon: number; name: string };
}

type RequestRidePopUpProps = {
  handleClose: () => void;
  requestRide?: (payload: RideRequest) => void;
  passengerId?: string;
};

const RequestRidePopUp = ({ handleClose, requestRide, passengerId }: RequestRidePopUpProps) => {
	const [step, setStep] = useState(1);
	const [isSearching, setIsSearching] = useState(false);
	const [rideInfo, setRideInfo] = useState<RideInfo | undefined>(undefined);
	const [searchData, setSearchData] = useState<{initialPointResult?: TGeocodeResult; endPointResults: TGeocodeResult[] }>({ endPointResults: [] });

	const [formData, setFormData] = useState<FormData>({
		initialPointCord: { lat: 0, lon: 0, name: '' },
		initialPointSearch: '',
		endPointSearch: '',
		endPointCord: { lat: 0, lon: 0, name: '' },
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSteps = useCallback(() => {
		const next = () => {
			if (step < 2) setStep(step + 1);
		};
		const back = () => {
			if (step > 1) setStep(step - 1);
		};
		const reset = () => {
			setStep(1);
			setSearchData({ endPointResults: [] });
			setFormData({
				initialPointCord: { lat: 0, lon: 0, name: '' },
				initialPointSearch: '',
				endPointSearch: '',
				endPointCord: { lat: 0, lon: 0, name: '' },
			});
			setRideInfo(undefined);
		};
		return { next, back, reset };
	}, [step]);

	const handleConfirmRide = useCallback(async () => {
		if (!requestRide || !passengerId || !rideInfo) {
			handleClose();
			handleSteps().reset();
			return;
		}
		try {
			requestRide({
				rideId: '',
				passengerId,
				from: { lat: formData.initialPointCord.lat, lng: formData.initialPointCord.lon },
				to: { lat: formData.endPointCord.lat, lng: formData.endPointCord.lon },
				price: rideInfo.fare,
				distance: rideInfo.distanceKm,
				duration: rideInfo.durationMin,
			});
			handleClose();
			handleSteps().reset();
		} catch (error) {
			console.error(error);
			handleSteps().back();
		}
	}, [handleClose, handleSteps, requestRide, passengerId, rideInfo, formData.initialPointCord, formData.endPointCord]);

	return (
		<div className="flex items-center justify-center p-4">
			{step === 1 && (
				<FindEndPoints
					formData={formData}
					setFormData={setFormData}
					onChange={handleChange}
					isSearching={isSearching}
					setIsSearching={setIsSearching}
					handleSteps={handleSteps}
					setRideInfo={setRideInfo}
				/>
			)}
			{step === 2 && (
				<RequestRide
					handleConfirmRide={handleConfirmRide}
					searchData={searchData}
					handleSteps={handleSteps}
					setFormData={setFormData}
					formData={formData}
					rideInfo={rideInfo}
				/>
			)}
		</div>
	);
};

export default RequestRidePopUp;
