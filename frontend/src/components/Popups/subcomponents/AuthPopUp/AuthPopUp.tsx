'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import DriverLoginForm from './subcomponents/DriverLoginForm';
import DriverRegisterForm from './subcomponents/DriverRegisterForm';

interface AuthPopUpProps {
	handleClose: () => void;
}

export default function AuthPopUp({ handleClose }: AuthPopUpProps) {
	const [mode, setMode] = useState<'login' | 'register'>('login');

	return (
		<div className="flex flex-col overflow-y-auto justify-center p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold text-[#964edd]">
					{mode === 'login' ? 'Driver login' : 'Driver registration'}
				</h2>
				<button
					type="button"
					onClick={handleClose}
					className="p-1 rounded hover:bg-gray-100 text-gray-500"
					aria-label="Close"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{mode === 'login' ? (
				<DriverLoginForm
					handleClose={handleClose}
					onSwitchToRegister={() => setMode('register')}
				/>
			) : (
				<DriverRegisterForm
					handleClose={handleClose}
					onSwitchToLogin={() => setMode('login')}
				/>
			)}
		</div>
	);
}
