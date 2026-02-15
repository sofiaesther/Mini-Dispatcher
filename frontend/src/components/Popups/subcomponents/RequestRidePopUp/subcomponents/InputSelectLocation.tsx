'use client';

import { DEBOUNCE_MS, MIN_CHARS } from '@constants';
import { useLocations } from '@hooks';
import type { TGeocodeResult } from '@components/Map';
import { ChevronRight, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface InputSelectLocationProps {
	value: string;
	name: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSelectResult: (result: TGeocodeResult) => void;
	origin: 'pickup' | 'dropoff';
	placeholder?: string;
	minChars?: number;
	debounceMs?: number;
}

export default function InputSelectLocation({
	value,
	name,
	onChange,
	onSelectResult,
	placeholder = 'Search for a location',
	minChars = MIN_CHARS,
	debounceMs = DEBOUNCE_MS,
}: Omit<InputSelectLocationProps, 'origin'> & { origin?: 'pickup' | 'dropoff' }) {
	const { searchRideEndPoints } = useLocations();
	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [results, setResults] = useState<TGeocodeResult[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		const trimmed = value.trim();
		debounceTimerRef.current = setTimeout(() => {
			setDebouncedQuery(trimmed);
			debounceTimerRef.current = null;
			if (trimmed.length < minChars) {
				setResults([]);
			}
		}, debounceMs);
		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [value, debounceMs, minChars]);

	useEffect(() => {
		if (debouncedQuery.length < minChars) return;
		if (typeof searchRideEndPoints !== 'function') return;
		let cancelled = false;
		searchRideEndPoints({
			selectedLocation: debouncedQuery,
		}).then((res) => {
			if (!cancelled) {
				setResults(res.results);
			}
		});
		return () => { cancelled = true; };
	}, [debouncedQuery, minChars, searchRideEndPoints]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent | TouchEvent) => {
			if (containerRef.current?.contains(e.target as Node)) return;
			setShowSuggestions(false);
		};
		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('touchstart', handleClickOutside, { passive: true });
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('touchstart', handleClickOutside);
		};
	}, []);

	const handleSelect = (result: TGeocodeResult) => {
		onSelectResult(result);
		setShowSuggestions(false);
	};

	return (
		<div ref={containerRef} className="relative w-full">
			<input
				type="text"
				name={name}
				value={value}
				onChange={(e) => {
					onChange(e);
					setShowSuggestions(true);
				}}
				placeholder={placeholder}
				className="w-full bg-transparent text-slate-800 placeholder-slate-400 outline-none"
				autoComplete="off"
			/>
			{showSuggestions && results.length > 0 && (
				<div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
					{results.map((result, index) => (
						<button
							key={`${result.lat}-${result.lon}-${index}`}
							type="button"
							onClick={() => handleSelect(result)}
							className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
						>
							<MapPin className="h-5 w-5 shrink-0 text-slate-400" />
							<span className="flex-1 text-sm text-slate-800 line-clamp-2">{result.name}</span>
							<ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
						</button>
					))}
				</div>
			)}
		</div>
	);
}
