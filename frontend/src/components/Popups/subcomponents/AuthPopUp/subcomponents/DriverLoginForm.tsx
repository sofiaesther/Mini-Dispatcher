'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClient } from '@/context/ClientContext';
import { Button } from '@/components/Buttons/Button';
import { X, LogIn } from 'lucide-react';
import { clientDriverAuth } from "@lib/driverApi";
import { EClientType } from '@/constants';

interface DriverLoginFormProps {
	handleClose: () => void;
	onSwitchToRegister: () => void;
}

export default function DriverLoginForm({
	handleClose,
	onSwitchToRegister,
}: DriverLoginFormProps) {
	const { updateClient } = useClient();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const emailTrimmed = email.trim();
		const pwd = password.trim();
		if (!emailTrimmed) {
			setError('Enter your email');
			return;
		}
		if (!pwd) {
			setError('Enter your password');
			return;
		}
		setError('');
		setLoading(true);
		try {
			const { driverId } = await clientDriverAuth(emailTrimmed, pwd);
			updateClient(EClientType.DRIVER, driverId);
			if (typeof window !== 'undefined') window.sessionStorage.setItem('driverId', driverId);
			handleClose();
			router.push('/drivers');
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Invalid email or password',
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<p className="text-sm text-gray-500 mb-4">
				Enter your email and password
			</p>
			<form onSubmit={handleSubmit} className="flex flex-col gap-3">
				<input
					id="driverEmail"
					type="email"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						setError('');
					}}
					placeholder="Email"
					className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-[#964edd] focus:outline-none focus:ring-1 focus:ring-[#964edd]"
					disabled={loading}
				/>
				<input
					id="driverPassword"
					type="password"
					value={password}
					onChange={(e) => {
						setPassword(e.target.value);
						setError('');
					}}
					placeholder="Password"
					className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-[#964edd] focus:outline-none focus:ring-1 focus:ring-[#964edd]"
					disabled={loading}
				/>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<div className="flex flex-wrap gap-2 pt-2 w-full md:flex-nowrap">
					<Button
						type="submit"
						color="secondary"
						text={loading ? 'Checking…' : 'Continue as Driver'}
						icon={<LogIn />}
						className="w-full md:w-auto"
					/>
					<Button
						type="button"
						color="ghost"
						text="Cancel"
						onClick={handleClose}
						icon={<X />}
						className="w-full md:w-auto"
					/>
				</div>
			</form>
			<button
				type="button"
				onClick={onSwitchToRegister}
				className="mt-4 text-sm text-[#964edd] hover:underline"
			>
				Create driver account
			</button>
		</>
	);
}
