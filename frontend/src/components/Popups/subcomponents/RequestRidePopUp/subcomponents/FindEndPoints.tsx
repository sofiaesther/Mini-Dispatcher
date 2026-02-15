'use client';

import { MapPin, Navigation, ChevronRight } from 'lucide-react';
import { useClient } from '@/context/ClientContext';
import { useState, useEffect, useCallback } from 'react';
import useRides from '@/hooks/useRides';
import { FormData } from '@/components/Popups/subcomponents/RequestRidePopUp/RequestRidePopUp';
import { toast } from 'react-toastify';
import { Button } from '@/components/Buttons/Button';
import { useLocations } from '@hooks';
import InputSelectLocation from './InputSelectLocation';
import type { TGeocodeResult } from '@components/Map';
import type { RideInfo } from '@hooks/useRides';
import { DEBOUNCE_MS, MIN_CHARS } from '@constants';

interface FindEndPointsProps {
	formData: FormData;
	setFormData: React.Dispatch<React.SetStateAction<FormData>>;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isSearching: boolean;
	setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
	handleSteps: () => { next: () => void; back: () => void; reset: () => void };
	setRideInfo: React.Dispatch<React.SetStateAction<RideInfo | undefined>>;
}

export default function FindEndPoints({
	formData,
	setFormData,
	onChange,
	isSearching,
	setIsSearching,
	handleSteps,
	setRideInfo,
}: FindEndPointsProps) {
	const { mapMarkers } = useClient();
	const [useCurrentLocation, setUseCurrentLocation] = useState(true);
	const { getRideInfo } = useRides();
	const { getClientLocation } = useLocations();

	useEffect(() => {
		if (!useCurrentLocation ||
            (formData.initialPointCord.lat !== 0 && formData.initialPointCord.lon !== 0)
		) return;

		if (mapMarkers.length > 0) {
			const [lat, lon] = mapMarkers[0].position;
			setFormData((prev) => ({
				...prev,
				initialPointCord: { lat, lon, name: 'Your Location' },
			}));
		} else {
			getClientLocation().then((loc) => {
				if (loc) {
					setFormData((prev) => ({
						...prev,
						initialPointCord: { lat: loc.lat, lon: loc.lon, name: 'Your Location' },
					}));
				}
			});
		}
	}, []);

	const handleSelectEndPoint = useCallback(
		(result: TGeocodeResult, origin: 'pickup' | 'dropoff') => {
			setFormData((prev) => ({
				...prev,
				[origin === 'pickup' ? 'initialPointCord' : 'endPointCord']: { lat: result.lat, lon: result.lon, name: result.name },
				[origin === 'pickup' ? 'initialPointSearch' : 'endPointSearch']: result.name,
			}));
		},
		[setFormData],
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const hasEndPoint = formData.endPointCord?.lat != null && formData.endPointCord?.lon != null;
			if (!hasEndPoint) {
				toast.error('Please select a destination from the suggestions');
				return;
			}

			setIsSearching(true);
			try {
				const ride = await getRideInfo(
					{ lat: formData.initialPointCord.lat, lon: formData.initialPointCord.lon },
					{ lat: formData.endPointCord.lat, lon: formData.endPointCord.lon },
				);
				setRideInfo(ride);
				handleSteps().next();
			} catch (error) {
				console.error(error);
				toast.error('Failed to get ride details');
			} finally {
				setIsSearching(false);
			}
		},
		[
			formData.endPointCord,
			formData.initialPointCord,
			getRideInfo,
			setRideInfo,
			setIsSearching,
			handleSteps,
		],
	);

	return (
		<form onSubmit={handleSubmit} className="p-6 space-y-5">
			<div className="space-y-2">
				<label className="text-sm font-medium text-slate-600">Pick-up</label>
				{useCurrentLocation ? (
					<button
						type="button"
						onClick={() => setUseCurrentLocation(!useCurrentLocation)}
						className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 disabled:opacity-60"
					>
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
							<Navigation className="h-5 w-5" />
						</div>
						<span className="flex-1">
							Start from current location
						</span>
						<ChevronRight className="h-5 w-5 text-slate-400" />
					</button>
				) : (
					<div className="flex relative items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
						<MapPin className="h-5 w-5 shrink-0 text-slate-400" />
						<InputSelectLocation
							value={formData.initialPointSearch}
							name="initialPointSearch"
							onChange={onChange}
							onSelectResult={(result) => handleSelectEndPoint(result, 'pickup')}
							origin="pickup"
							placeholder="Enter pick-up address"
							minChars={MIN_CHARS}
							debounceMs={DEBOUNCE_MS}
						/>
					</div>
				)}
				<button
					type="button"
					onClick={() => setUseCurrentLocation(!useCurrentLocation)}
					className="text-sm text-indigo-600 hover:text-indigo-700"
				>
					{useCurrentLocation ? 'Enter address instead' : 'Use current location instead'}
				</button>
			</div>

			<div className="space-y-2 relative">
				<label className="text-sm font-medium text-slate-600">Drop-off</label>
				<div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
					<div className="flex items-center gap-3">
						<MapPin className="h-5 w-5 shrink-0 text-slate-400" />
						<InputSelectLocation
							value={formData.endPointSearch}
							name="endPointSearch"
							onChange={onChange}
							onSelectResult={(result) => handleSelectEndPoint(result, 'dropoff')}
							origin="dropoff"
							placeholder={`Where to? (type at least ${MIN_CHARS} characters)`}
							minChars={MIN_CHARS}
							debounceMs={DEBOUNCE_MS}
						/>
					</div>
					{formData.endPointSearch.length > 0 && formData.endPointSearch.length < MIN_CHARS && (
						<p className="text-xs text-slate-500 pl-8">Type at least {MIN_CHARS} characters for suggestions</p>
					)}
				</div>
			</div>

			<Button
				color="secondary"
				text={isSearching ? 'Searching...' : 'Search ride'}
				icon={<ChevronRight className="h-5 w-5" />}
				className="w-full"
				type="submit"
				disabled={isSearching || !formData.endPointCord?.lat}
			/>
		</form>
	);
}
