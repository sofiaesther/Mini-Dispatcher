'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { TMapProps } from './IMap';
import { createCircleIconForColor } from './helpers';

// Configure Leaflet icons only on client side
if (typeof window !== 'undefined') {
	const getIconUrl = (icon: unknown): string => {
		if (typeof icon === 'string') return icon;
		if (icon && typeof icon === 'object' && 'src' in icon) {
			return (icon as { src: string }).src;
		}
		return '';
	};

	L.Icon.Default.mergeOptions({
		iconRetinaUrl: getIconUrl(markerIcon2x),
		iconUrl: getIconUrl(markerIcon),
		shadowUrl: getIconUrl(markerShadow),
	});

}

// Map updates when center changes
function MapUpdater({ center }: { center: [number, number] }) {
	const map = useMap();

	useEffect(() => {
		map.setView(center, map.getZoom());
	}, [center, map]);

	return null;
}

// Component to handle map size invalidation on mount
function MapSizeFixer() {
	const map = useMap();

	useEffect(() => {
		// Invalidate size after a short delay to ensure container is fully rendered
		const timer = setTimeout(() => {
			map.invalidateSize();
		}, 100);

		return () => clearTimeout(timer);
	}, [map]);

	return null;
}

export default function Map({
	center = [51.505, -0.09], // Default: London
	zoom = 13,
	markers = [],
	height = '400px',
	className = '',
}: TMapProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setTimeout(() => {
			setIsMounted(true);
		}, 100);
	}, []);

	if (!isMounted) {
		return (
			<div className={`w-full ${className}`} style={{ height }}>
				<div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
						<p className="mt-4 text-gray-600">Initializing map...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`w-full ${className}`}
			style={{
				height,
				position: 'relative',
				zIndex: 0,
				minHeight: height
			}}>
			<MapContainer
				center={center}
				zoom={zoom}
				style={{ height: '100%', width: '100%', zIndex: 0 }}
				scrollWheelZoom={true}
				key={`${center[0]}-${center[1]}`}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
					url={`https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
					maxZoom={20}
				/>

				<MapSizeFixer />
				<MapUpdater center={center} />
				{markers.map((marker, index) => {
					const icon = marker.color ? createCircleIconForColor(marker.color) : undefined;

					return (
						<Marker
							key={`${marker.position[0]}-${marker.position[1]}-${index}`}
							position={marker.position}
							{...(icon ? { icon } : {})}
						>
							{(marker.title || marker.description) && (
								<Popup>
									{marker.title && <h3 className="font-semibold mb-1">{marker.title}</h3>}
									{marker.description && <p className="text-sm">{marker.description}</p>}
								</Popup>
							)}
						</Marker>
					);
				})}
			</MapContainer>
		</div>
	);
}
