"use client";

import { EClientType } from "@constants";
import { useClient } from "@context";
import { useRouter } from "next/navigation";
import { UserIcon, CarIcon } from "lucide-react";
import { Button, PopUps } from "@components";
import { TPopupKey } from "@components/Popups/IPopup";
import { useState } from "react";

export default function Home() {
	const router = useRouter();
	const { updateClient } = useClient();
	const [popup, setPopup] = useState<TPopupKey | undefined>(undefined);

	const handlePassengerClick = () => {
		updateClient(EClientType.PASSENGER, typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '');
		router.push(`/passenger`);
	};

	const handleDriverClick = () => {
		setPopup('auth');
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-200 font-sans">
			<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 shadow-lg bg-white sm:items-start">
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-3xl font-semibold leading-tight tracking-tight text-black sm:text-4xl md:text-5xl md:leading-10">
						<span className="text-[#79c145]">MINI</span><span className="text-[#964edd]">DISPATCHER</span>
					</h1>
					<p className="max-w-md text-lg leading-8 text-zinc-600">
						The MiniDispatcher is a platform for drivers and passengers to find each other in the simplest way possible.
					</p>
				</div>
				<div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
					<Button
						color="secondary"
						text="Passenger"
						icon={<UserIcon />}
						onClick={handlePassengerClick}
					/>
					<Button
						color="primary"
						text="Driver"
						icon={<CarIcon />}
						onClick={handleDriverClick}
					/>
					<PopUps popup={popup} setPopup={setPopup} />
				</div>
			</main>
		</div>
	);
}
