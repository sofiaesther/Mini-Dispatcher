'use client';

import Link from 'next/link';
import { useClient } from '@/context/ClientContext';
import { EClientType } from '@/constants';
import { useMemo } from 'react';
import { Button } from '@/components/Buttons/Button';
import { Home } from 'lucide-react';

export default function DriverNotFoundPage() {
	const { clientType } = useClient();
	const homeHref = useMemo(() => {
		if (clientType === EClientType.PASSENGER) return '/passenger';
		if (clientType === EClientType.DRIVER) return '/drivers';
		return '/';
	}, [clientType]);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
			<h1 className="font-semibold text-4xl text-[#964edd] text-center mb-8">DRIVER NOT FOUND</h1>
			<Link href={homeHref}>
				<Button color="secondary" text="Homepage" icon={<Home className="h-5 w-5" />} />
			</Link>
		</div>
	);
}
