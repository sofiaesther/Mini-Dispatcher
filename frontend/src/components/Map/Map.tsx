'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useClient } from "@context";
import { useLocations } from "@hooks/useLocations";
import { CENTER_LOCATION_POSITION, CENTER_LOCATION_TITLE } from '@constants';

const MapDynamic = dynamic(() => import("@components/Map/MapInner"), {
	ssr: false,
	loading: () => (
		<div className="w-full h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
			<div className="text-center">
				<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				<p className="mt-4 text-gray-600">Loading map...</p>
			</div>
		</div>
	),
});

export const Map = () => {
	const { mapMarkers } = useClient();
	const { getClientLocation } = useLocations();
	const [mounted, setMounted] = useState(false);
	const ranOnce = useRef(false);

	useEffect(() => {
		if (mounted || ranOnce.current) return;
		ranOnce.current = true;

		getClientLocation().then(() => {
			setMounted(true);
		});
	}, [mounted, getClientLocation]);

	const centerLocation = mapMarkers.length > 0 ? mapMarkers.find((marker) => marker.title === CENTER_LOCATION_TITLE)?.position : CENTER_LOCATION_POSITION;

	if (!centerLocation) return null;

	return (
		<div className="fixed top-0 left-0 w-full h-full shadow-md mb-6 z-0">
			{mapMarkers.length > 0 ? (
				<MapDynamic
					key={centerLocation[0] + centerLocation[1]}
					center={centerLocation as [number, number]}
					zoom={13}
					markers={mapMarkers}
					height="100%"
					className="overflow-hidden"
				/>
			) : (
				<div className="w-full h-full bg-gray-200 flex items-center justify-center">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
						<p className="mt-4 text-gray-600">Loading your location...</p>
					</div>
				</div>
			)}
		</div>
	);
};
