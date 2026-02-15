'use client';

import type { TDriverPublicProfile } from '@lib/driverApi';
import { Car, User, MapPin, Calendar, Star, CarFront } from 'lucide-react';
import { formatDateStart, getStatusColor } from './helpers';

type DriverProfilePopUpProps = {
  profile: TDriverPublicProfile;
};

export default function DriverProfilePopUp({ profile }: DriverProfilePopUpProps) {
	const statusColor = getStatusColor(profile.presence?.status);

	return (
		<div className="p-4 space-y-10">
			<section>
				<div className="flex items-center gap-2">
					<User className="h-5 w-5 text-gray-500 shrink-0" />
					<h6 className="text-xl text-gray-400">Personal</h6>
				</div>
				<ul className="space-y-3 text-sm align-middle text-slate-700">
					<li className="flex items-center gap-2 align-middle">
						<h1 className="text-2xl font-bold">{profile.name}</h1>
						<div className={`w-3 h-3 border border-gray-500 rounded-full align-middle ${statusColor}`} />
					</li>
					<li className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-slate-400 shrink-0" />
						<span>{profile.city}</span>
					</li>
					<li className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-slate-400 shrink-0" />
						<span>Member since {formatDateStart(profile.dateStart)}</span>
					</li>
					<li className="flex items-center gap-2">
						<Star className="h-4 w-4 text-slate-400 shrink-0" />
						<span>{profile.rating != null ? `${profile.rating} ★` : 'No ratings yet'}</span>
					</li>
					<li className="flex items-center gap-2">
						<CarFront className="h-4 w-4 text-slate-400 shrink-0" />
						<span>{profile.rideCount} {profile.rideCount === 1 ? 'ride' : 'rides'} completed</span>
					</li>
				</ul>
			</section>
			<section>
				<div className="flex items-center gap-2">
					<Car className="h-5 w-5 text-gray-500 shrink-0" />
					<h6 className="text-xl text-gray-400">Car</h6>
				</div>
				<ul className="space-y-1.5 text-sm text-slate-700">
					<li><strong>Model:</strong> {profile.car.model}</li>
					<li><strong>Plate:</strong> {profile.car.plate}</li>
					<li><strong>Year:</strong> {profile.car.year}</li>
					<li><strong>Color:</strong> {profile.car.color}</li>
				</ul>
			</section>
			{profile.presence && (
				<section>
					<h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-2">
              Status
						<span className="inline-flex items-center gap-1 text-[10px] font-normal normal-case text-emerald-600">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                Live
						</span>
					</h4>
					<p className="text-sm text-slate-600 capitalize">{profile.presence.status}</p>
				</section>
			)}
		</div>

	);
}
