'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClient } from '@/context/ClientContext';
import { EClientType } from '@/constants';
import { useEffect, useState, useMemo } from 'react';
import { clientFetchDriverPublicProfile } from "@lib/driverApi";
import type { TDriverPublicProfile } from "@lib/driverApi";
import DriverProfile from '@/components/DriverProfile/DriverProfile';
import { Button } from '@/components/Buttons/Button';
import { Home } from 'lucide-react';

export default function DriverPublicProfilePage() {
	const params = useParams();
	const router = useRouter();
	const driverId = typeof params.id === 'string' ? params.id : '';
	const { setRideMarkers, clientType } = useClient();
	const homeHref = useMemo(() => {
		if (clientType === EClientType.PASSENGER) return '/passenger';
		if (clientType === EClientType.DRIVER) return '/drivers';
		return '/';
	}, [clientType]);
	const [profile, setProfile] = useState<TDriverPublicProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Polling for real-time status/presence
	useEffect(() => {
		if (!driverId) return;

		let isMounted = true;
		const fetchProfile = async (showLoading = true) => {
			if (showLoading) {
				setLoading(true);
				setError(null);
			}
			try {
				const data = await clientFetchDriverPublicProfile(driverId);
				if (isMounted) {
					setProfile(data ?? null);
					if (!data) {
						setError('Driver not found');
						router.replace('/drivers/404');
					}
				}
			} catch {
				if (isMounted) {
					setError('Failed to load driver');
					router.replace('/drivers/404');
				}
			} finally {
				if (isMounted && showLoading) setLoading(false);
			}
		};

		fetchProfile(true);

		const interval = setInterval(() => {
			fetchProfile(false);
		}, 5000);

		return () => {
			isMounted = false;
			clearInterval(interval);
		};
	}, [driverId, router]);

	// Show driver on map when presence is available
	useEffect(() => {
		if (!profile?.presence || typeof profile.presence.lat !== 'number' || typeof profile.presence.lon !== 'number') {
			setRideMarkers([]);
			return;
		}
		setRideMarkers([
			{
				position: [profile.presence.lat, profile.presence.lon],
				title: profile.name,
				description: `Status: ${profile.presence.status}`,
				color: 'black',
			},
		]);
		return () => setRideMarkers([]);
	}, [profile?.presence, profile?.name]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7349a3]" />
					<p className="mt-4 text-slate-600">Loading driver...</p>
				</div>
			</div>
		);
	}

	if (error || !profile) {
		return null;
	}

	return (
		<div className="min-h-screen fixed top-0 left-0 w-full z-10">
			<div className="absolute left-0 top-0 bottom-0 w-full max-w-md flex flex-col bg-indigo-50 shadow-xl z-20">
				<div className="bg-[#7349a3] rounded-br-xl shadow-md p-4 flex-shrink-0">
					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div>
							<h1 className="text-xl font-bold text-[#b7f394]">Driver profile</h1>
							<p className="text-white/90 text-sm">Public information</p>
						</div>
						<Link href={homeHref}>
							<Button color="ghost" text="Home" icon={<Home className="h-5 w-5" />} />
						</Link>
					</div>
				</div>
				<div className="flex-1 overflow-y-auto p-4">
					<DriverProfile profile={profile} />
					{profile.presence && (
						<p className="mt-4 text-sm text-slate-600 text-center">
							Driver location is shown on the map when available.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
