'use client';

import { Button } from '@/components/Buttons/Button';
import { CheckCircle, XCircle } from 'lucide-react';
import type { IRideRequest } from '@hooks/useWebSocket';

type IncomingRideRequestProps = {
  request: IRideRequest;
  onAccept: () => void;
  onReject: () => void;
};

export default function IncomingRideRequest({
	request,
	onAccept,
	onReject,
}: IncomingRideRequestProps) {
	return (
		<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
			<h2 className="text-sm font-semibold text-amber-900 mb-3">New ride request</h2>
			<div className="space-y-2 text-sm text-amber-800 mb-4">
				<p><strong>Pick-up:</strong> {request.from.lat.toFixed(4)}, {request.from.lng.toFixed(4)}</p>
				<p><strong>Drop-off:</strong> {request.to.lat.toFixed(4)}, {request.to.lng.toFixed(4)}</p>
				<p><strong>Fare:</strong> £{request.price.toFixed(2)} · {request.distance} km · {request.duration} min</p>
			</div>
			<div className="flex gap-3">
				<Button
					color="primary"
					text="Accept"
					icon={<CheckCircle className="h-5 w-5" />}
					onClick={onAccept}
					className="flex-1"
				/>
				<Button
					color="ghost"
					text="Reject"
					icon={<XCircle className="h-5 w-5" />}
					onClick={onReject}
					className="flex-1"
				/>
			</div>
		</div>
	);
}
