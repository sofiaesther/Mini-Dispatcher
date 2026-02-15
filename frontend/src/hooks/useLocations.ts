import { useCallback } from "react";
import { useClient } from "@context";
import { geocodePlace } from "./useServer";
import { toast } from "react-toastify";
import type { TGeocodeResult } from "@components/Map";
import { CENTER_LOCATION_DESCRIPTION, CENTER_LOCATION_TITLE } from "@constants";

export const useLocations = () => {
	const { setUserLocationMarker } = useClient();

	const getClientLocation = useCallback(async (): Promise<{ lat: number; lon: number } | undefined> => {
		return new Promise((resolve) => {
			if (typeof window === 'undefined' || !navigator.geolocation) {
				toast.error('Geolocation is not available');
				resolve(undefined);
				return;
			}

			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setUserLocationMarker({
						position: [latitude, longitude],
						title: CENTER_LOCATION_TITLE,
						description: CENTER_LOCATION_DESCRIPTION,
					});
					resolve({ lat: latitude, lon: longitude });
				},
				(_error) => {
					toast.error('Unable to get your location');
					resolve(undefined);
				},
				{
					enableHighAccuracy: false,
					timeout: 10000,
					maximumAge: 60000,
				}
			);
		});
	}, [setUserLocationMarker]);

	const searchRideEndPoints = useCallback(
		async (params: { selectedLocation: string }): Promise<{ results: TGeocodeResult[] }> => {
			const results = await geocodePlace(params.selectedLocation);
			if (!results.length) {
				throw new Error('Could not find location');
			}
			return { results };
		},
		[]
	);

	return { getClientLocation, searchRideEndPoints } as const;
};

export default useLocations;
