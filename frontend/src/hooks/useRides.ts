'use client';
import { useCallback } from "react";
import { serverRideInfo } from "./useServer";

export type RideInfo = {
    currency: string;
    fare: number;
    distanceKm: number;
    durationMin: number;
    coreFare: number;
};

const useRides = () => {
	const getRideInfo = useCallback(async (from: { lat: number; lon: number }, end: { lat: number; lon: number }): Promise<RideInfo> => {
		const data = await serverRideInfo(from, end) as { fare?: number; distanceKm?: number; durationMin?: number };
		const fare = Number(data.fare ?? 0);
		const distanceKm = Number(data.distanceKm ?? 0);
		const durationMin = Number(data.durationMin ?? 0);
		return {
			currency: 'GBP',
			fare,
			coreFare: fare,
			distanceKm,
			durationMin,
		};
	}, []);

	return { getRideInfo };
};

export default useRides;
