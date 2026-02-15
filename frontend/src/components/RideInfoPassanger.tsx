import Link from 'next/link';
import { ERideStatus } from "@constants";
import { Loader2, CheckCircle, MapPin, CarIcon, XCircle, User } from "lucide-react";
import { Button } from "./Buttons/Button";
import { IRideResponse } from '@/hooks/useWebSocket';

const RideInfoPassanger = ({ status, currentRide, handleRequestRide, handleCancelRide }: { status: string; currentRide?: IRideResponse | null; handleRequestRide: () => void; handleCancelRide: () => void }) => {

	if (status === ERideStatus.PENDING) {
		return (
			<div className="flex small:flex-col gap-3 small:w-full">
				<Button
					type="button"
					color="gray"
					text="Cancel ride"
					icon={<XCircle className="h-4 w-4" />}
					onClick={handleCancelRide}
					className="max-w-[160px]"
				/>
				<div className="flex items-center w-full gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
					<Loader2 className="h-5 w-5 animate-spin shrink-0" />
					<span>Finding a driver...</span>
				</div>
			</div>
		);
	}
	if (status === ERideStatus.ACCEPTED) {
		const name = currentRide?.driverName ?? 'Driver';
		const car = currentRide?.driverCar;
		const driverId = currentRide?.driverId;
		const carText =
			car && (car.model || car.color || car.plate)
				? ` will arrive in a ${[car.color, car.model].filter(Boolean).join(' ')} with plate ${car.plate || '—'}.`
				: ' is on your way!';

		return (
			<div className="flex small:flex-col gap-3 small:w-full">
				<div className="flex small:flex-col gap-2 small:w-full">
					<Button
						type="button"
						color="danger"
						text="Cancel ride"
						icon={<XCircle className="h-4 w-4" />}
						onClick={handleCancelRide}
					/>
					{driverId && (
						<Link href={`/drivers/${driverId}`} className="inline-flex">
							<Button
								type="button"
								color="ghost"
								text="View driver profile"
								icon={<User className="h-4 w-4" />}
								className="max-w-[200px]"
							/>
						</Link>
					)}
				</div>

				<div className="flex items-center w-auto gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
					<CheckCircle className="h-5 w-5 shrink-0" />
					<span>
						Ride accepted! {name}
						{carText}
					</span>
				</div>
			</div>
		);
	}
	if (status === ERideStatus.INITIATED) {
		const driverId = currentRide?.driverId;
		const arrivalTime = currentRide?.duration|| 0;
		const arrivalTimeString = new Date(Date.now() + arrivalTime * 60 * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

		return (
			<div className="flex small:flex-col gap-3 small:w-full">
				{driverId && (
					<Link href={`/drivers/${driverId}`} className="inline-flex">
						<Button
							type="button"
							color="ghost"
							text="View driver profile"
							icon={<User className="h-4 w-4" />}
							className="max-w-[200px]"
						/>
					</Link>
				)}
				<div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-800">
					<MapPin className="h-5 w-5 shrink-0" />
					<span>Ride in progress, you should arrive at {arrivalTimeString}.</span>
				</div>
			</div>
		);
	}

	return (
		<Button
			color="secondary"
			text="Request Ride"
			icon={<CarIcon />}
			onClick={handleRequestRide}
		/>
	);
};

export default RideInfoPassanger;
