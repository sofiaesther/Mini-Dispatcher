'use client';

import { useMemo, useCallback } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/Buttons/Button';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { CENTER_LOCATION_POSITION } from '@constants';

const LocationMapPicker = dynamic(
	() => import('@/components/Map/LocationMapPicker'),
	{
		ssr: false,
		loading: () => (
			<div className="h-[240px] rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
        Loading map…
			</div>
		),
	},
);

export interface LocationChangeProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  loadingLocation: boolean;
  latInput: string;
  lonInput: string;
  setLatInput: (v: string) => void;
  setLonInput: (v: string) => void;
  onUseCurrentLocation: () => Promise<void>;
  onUpdateLocation: (lat: number, lon: number) => void;
}

export default function LocationChange({
	isOpen,
	onClose,
	isConnected,
	loadingLocation,
	latInput,
	lonInput,
	setLatInput,
	setLonInput,
	onUseCurrentLocation,
	onUpdateLocation,
}: LocationChangeProps) {
	const mapCenter = useMemo((): [number, number] => {
		const lat = parseFloat(latInput);
		const lon = parseFloat(lonInput);
		return !Number.isNaN(lat) && !Number.isNaN(lon)
			? [lat, lon]
			: (CENTER_LOCATION_POSITION as [number, number]);
	}, [latInput, lonInput]);

	const handlePositionFromMap = useCallback(
		(lat: number, lng: number) => {
			setLatInput(String(lat));
			setLonInput(String(lng));
			if (isConnected) {
				onUpdateLocation(lat, lng);
				toast.success('Location updated from map');
			}
		},
		[isConnected, onUpdateLocation, setLatInput, setLonInput],
	);

	const handleUpdateLocation = useCallback(() => {
		const lat = parseFloat(latInput);
		const lon = parseFloat(lonInput);
		if (Number.isNaN(lat) || Number.isNaN(lon)) {
			toast.error('Enter valid lat/lon numbers');
			return;
		}
		if (!isConnected) {
			toast.error('Not connected yet');
			return;
		}
		onUpdateLocation(lat, lon);
		toast.success('Location updated');
	}, [latInput, lonInput, isConnected, onUpdateLocation]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="location-change-title"
		>
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				aria-label="Close"
			/>

			<div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-h-[90vh] overflow-y-auto">
				<div className="flex items-start justify-between gap-2 mb-3">
					<h2
						id="location-change-title"
						className="text-sm font-semibold text-slate-700 flex items-center gap-2"
					>
						<MapPin className="h-4 w-4 shrink-0" />
            Set your location
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
						aria-label="Close"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<p className="text-xs text-slate-500 mb-3">
          Drag the marker on the map, use current location, or enter coordinates.
				</p>

				<div className="flex flex-col gap-3">
					<Button
						color="secondary"
						text={loadingLocation ? 'Getting location…' : 'Use current location'}
						icon={<Navigation className="h-5 w-5" />}
						onClick={onUseCurrentLocation}
						disabled={!isConnected || loadingLocation}
					/>

					<div className="rounded-lg overflow-hidden border border-slate-200">
						<LocationMapPicker
							center={mapCenter}
							onPositionChange={handlePositionFromMap}
							height="240px"
						/>
					</div>

					<div className="flex gap-2 flex-wrap items-center">
						<input
							type="text"
							placeholder="Lat"
							value={latInput}
							onChange={(e) => setLatInput(e.target.value)}
							className="flex-1 min-w-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
						/>
						<input
							type="text"
							placeholder="Lon"
							value={lonInput}
							onChange={(e) => setLonInput(e.target.value)}
							className="flex-1 min-w-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
						/>
						<Button
							color="primary"
							text="Update location"
							icon={<MapPin className="h-5 w-5" />}
							onClick={handleUpdateLocation}
							className="shrink-0"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
