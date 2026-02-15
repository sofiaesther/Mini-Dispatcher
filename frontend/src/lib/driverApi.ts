'use client';
/**
 * Client-side API calls to the drivers backend.
 * Used for registration so the request body is sent directly from the browser (no Server Action serialization).
 */

function getApiUrl(): string {
	if (typeof window === 'undefined') {
		const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
		return String(base).replace(/\/$/, '');
	}
	const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
	return String(base).replace(/\/$/, '');
}

export type TDriverRegisterPayload = {
  name: string;
  password: string;
  phone: string;
  email: string;
  city: string;
  car: {
    model: string;
    plate: string;
    year: number;
    color: string;
  };
};

export async function clientDriverRegister(payload: TDriverRegisterPayload): Promise<{ driverId: string }> {
	const url = `${getApiUrl()}/drivers/register-account`;
	const body = JSON.stringify({
		name: payload.name.trim(),
		password: payload.password,
		phone: payload.phone.trim(),
		email: payload.email.trim(),
		city: payload.city.trim(),
		car: {
			model: payload.car.model.trim(),
			plate: payload.car.plate.trim(),
			year: Number(payload.car.year),
			color: payload.car.color.trim(),
		},
	});
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body,
		cache: 'no-store',
	});
	if (!res.ok) {
		const errBody = (await res.json().catch(() => ({}))) as { message?: string | string[] };
		const msg = Array.isArray(errBody?.message)
			? errBody.message.join(', ')
			: (errBody?.message ?? `Registration failed (${res.status})`);
		throw new Error(msg);
	}
	return res.json();
}

export async function clientDriverAuth(
	email: string,
	password: string,
): Promise<{ success: boolean; driverId: string }> {
	const url = `${getApiUrl()}/drivers/auth`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: email.trim(), password }),
		cache: 'no-store',
	});
	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as { message?: string };
		throw new Error(body?.message ?? 'Invalid email or password');
	}
	return res.json();
}

export type TDriverPublicProfile = {
  driverId: string;
  name: string;
  city: string;
  dateStart: number;
  rating?: number;
  rideCount: number;
  car: { model: string; plate: string; year: number; color: string };
  presence?: { lat: number; lon: number; status: string };
};

export async function clientFetchDriverPublicProfile(
	driverId: string,
): Promise<TDriverPublicProfile | null> {
	const url = `${getApiUrl()}/drivers/${encodeURIComponent(driverId)}`;
	const res = await fetch(url, { cache: 'no-store' });
	if (res.status === 404) return null;
	if (!res.ok) throw new Error('Failed to load driver');
	return res.json();
}
