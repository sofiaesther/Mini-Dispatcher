'use client';

import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { SearchData, FormData } from '@/components/Popups/subcomponents/RequestRidePopUp/RequestRidePopUp'
import { RideInfo } from '@/hooks/useRides'
import { Button } from '@/components/Buttons/Button'

interface RequestRideProps {
    handleConfirmRide: () => void;
	searchData: SearchData;
	handleSteps: () => { next: () => void; back: () => void; reset: () => void };
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    formData: FormData;
    rideInfo: RideInfo | undefined;
}

export default function RequestRide({
    handleConfirmRide,
    formData,
	handleSteps,
    rideInfo,
}: RequestRideProps) {
    const arrivalTime = useMemo(() => {
        const now = new Date();
        const durationMin = rideInfo?.durationMin ?? 0;
        const arrival = new Date(now.getTime() + durationMin * 60 * 1000);
        return arrival.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }, [rideInfo]);

    const destinationName = formData?.endPointCord?.name ? formData.endPointCord.name.split(',').slice(0, 2).join(', ') : 'Destination';

    return (
        <div className="p-6 space-y-5">
			<div className="space-y-2">
				<h2 className="text-lg font-medium text-slate-600"><b>Trip To:</b> {destinationName}</h2>
				<div className="space-y-2 max-h-48 overflow-y-auto text-slate-600">
                    <h5><b>Arrival Time:</b> {arrivalTime}</h5>
                    <h5><b>Price:</b> £{rideInfo?.fare ?? rideInfo?.coreFare ?? 0} {rideInfo?.currency ?? 'GBP'}</h5>
                    <h6><b>Distance:</b> {rideInfo?.distanceKm ?? 0} km</h6>
                    <h6><b>Duration:</b> {rideInfo?.durationMin ?? 0} min</h6>
				</div>
			</div>

			<div className="flex gap-3 pt-2">
				<Button
					color="ghost"
					text="Back"
					icon={<ArrowLeft className="h-5 w-5" />}
					onClick={handleSteps().back}
				/>
				<Button
					color="secondary"
					text="Confirm Ride"
					icon={<CheckCircle className="h-5 w-5" />}
                    className="w-unset"
					onClick={handleConfirmRide}
				/>
			</div>
		</div>
	);
}
