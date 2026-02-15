"use client";

import { EClientType } from "@/constants";
import { useClient } from "@/context/ClientContext";
import { useRouter } from "next/navigation";
import { UserIcon, CarIcon } from "lucide-react";
import { Button } from "@/components/Buttons/Button";

export default function Home() {
	const router = useRouter();
	const { updateClient } = useClient();

	const handlePassengerClick = () => {
		updateClient(EClientType.PASSENGER);
		router.push(`/passenger`);
	};

	const handleDriverClick = () => {
		updateClient(EClientType.DRIVER);
		router.push(`/driver`);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-200 font-sans">
			<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 shadow-lg bg-white sm:items-start">
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-5xl font-semibold leading-10 tracking-tight text-black">
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
				</div>
			</main>
		</div>
	);
}
