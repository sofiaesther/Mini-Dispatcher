'use server';
import type { TGeocodeResult } from "@components/Map";

function getApiUrl(): string {
	const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
	return String(base).replace(/\/$/, '');
}

export async function geocodePlace(query: string): Promise<TGeocodeResult[]> {
	const res = await fetch(
		`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json` +
		`?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
	);

	if (!res.ok) throw new Error("Geocoding failed");

	const data = await res.json();

	return data.features.map((f: { geometry: { coordinates: [number, number] }; place_name: string }) => ({
		lat: f.geometry.coordinates[1],
		lon: f.geometry.coordinates[0],
		name: f.place_name,
	}));
}


export async function serverRideInfo(from: { lat: number; lon: number }, end: { lat: number; lon: number }) {
	const params = new URLSearchParams({
		fromLat: String(from.lat),
		fromLon: String(from.lon),
		toLat: String(end.lat),
		toLon: String(end.lon),
	});

	const res = await fetch(
		`${getApiUrl()}/rides?${params}`,
		{ cache: 'no-store', method: 'GET' }
	);

	if (!res.ok) throw new Error("Ride price and time failed");

	const data = await res.json();

	return data;
}

export async function serverDriverAuth(
	email: string,
	password: string,
): Promise<{ success: boolean; driverId: string }> {
	const res = await fetch(`${getApiUrl()}/drivers/auth`, {
		cache: 'no-store',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error((body as { message?: string }).message || 'Driver auth failed');
	}
	return res.json();
}

export type DriverPublicProfile = {
  driverId: string;
  name: string;
  city: string;
  dateStart: number;
  rating?: number;
  rideCount: number;
  car: { model: string; plate: string; year: number; color: string };
  presence?: { lat: number; lon: number; status: string };
};

export async function fetchDriverPublicProfile(driverId: string): Promise<DriverPublicProfile | null> {
	const base = getApiUrl();
	const res = await fetch(`${base}/drivers/${encodeURIComponent(driverId)}`, { cache: 'no-store' });
	if (res.status === 404) return null;
	if (!res.ok) throw new Error('Failed to load driver');
	return res.json();
}

export type DriverCarInput = {
  model: string;
  plate: string;
  year: number;
  color: string;
};

export async function serverDriverRegister(data: {
  name: string;
  password: string;
  phone: string;
  email: string;
  city: string;
  car: DriverCarInput;
}): Promise<{ driverId: string }> {
	const base = getApiUrl();
	const url = `${base}/drivers/register-account`;
	const city = typeof data.city === 'string' ? data.city.trim() : '';
	const car = data.car && typeof data.car === 'object'
		? {
			model: String(data.car.model ?? '').trim(),
			plate: String(data.car.plate ?? '').trim(),
			year: Number(data.car.year ?? new Date().getFullYear()),
			color: String(data.car.color ?? '').trim(),
		}
		: {
			model: '',
			plate: '',
			year: new Date().getFullYear(),
			color: '',
		};
	const payload = {
		name: String(data.name ?? '').trim(),
		password: String(data.password ?? ''),
		phone: String(data.phone ?? '').trim(),
		email: String(data.email ?? '').trim(),
		city,
		car,
	};
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
		cache: 'no-store',
	});
	if (!res.ok) {
		const errBody = await res.json().catch(() => ({})) as { message?: string | string[] };
		const msg = Array.isArray(errBody?.message)
			? errBody.message.join(', ')
			: (errBody?.message ?? `Registration failed (${res.status})`);
		throw new Error(msg);
	}
	return res.json() as Promise<{ driverId: string }>;
}
