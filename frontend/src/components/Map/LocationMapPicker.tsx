'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

if (typeof window !== 'undefined') {
	const getIconUrl = (icon: unknown): string => {
		if (typeof icon === 'string') return icon;
		if (icon && typeof icon === 'object' && 'src' in icon) return (icon as { src: string }).src;
		return '';
	};
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: getIconUrl(markerIcon2x),
		iconUrl: getIconUrl(markerIcon),
		shadowUrl: getIconUrl(markerShadow),
	});
}

type Position = [number, number];

interface LocationMapPickerProps {
  center: Position;
  onPositionChange: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

function DraggableMarker({
	position,
	onPositionChange,
}: {
  position: Position;
  onPositionChange: (lat: number, lng: number) => void;
}) {
	const eventHandlers = useCallback(
		(e: L.LeafletEvent) => {
			const marker = e.target as L.Marker;
			const latlng = marker.getLatLng();
			onPositionChange(latlng.lat, latlng.lng);
		},
		[onPositionChange],
	);

	return (
		<Marker
			position={position}
			draggable
			eventHandlers={{ dragend: eventHandlers }}
		/>
	);
}

export default function LocationMapPicker({
	center,
	onPositionChange,
	height = '240px',
	className = '',
}: LocationMapPickerProps) {
	const [position, setPosition] = useState<Position>(center);
	const [mounted, setMounted] = useState(false);

	const centerLat = center[0];
	const centerLng = center[1];
	useEffect(() => {
		let cancelled = false;
		queueMicrotask(() => {
			if (!cancelled) setPosition(center);
		});
		return () => {
			cancelled = true;
		};
	}, [center, centerLat, centerLng]);

	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 100);
		return () => clearTimeout(t);
	}, []);

	const handlePositionChange = useCallback(
		(lat: number, lng: number) => {
			setPosition([lat, lng]);
			onPositionChange(lat, lng);
		},
		[onPositionChange],
	);

	if (!mounted) {
		return (
			<div className={`rounded-lg bg-slate-200 ${className}`} style={{ height }}>
				<div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading map…</div>
			</div>
		);
	}

	return (
		<div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
			<MapContainer
				center={position}
				zoom={14}
				style={{ height: '100%', width: '100%' }}
				scrollWheelZoom
				key={`${position[0]}-${position[1]}`}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; OpenStreetMap contributors'
					url={`https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ''}`}
					maxZoom={20}
				/>
				<DraggableMarker position={position} onPositionChange={handlePositionChange} />
			</MapContainer>
		</div>
	);
}
