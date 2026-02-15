import { EDriverStatus } from "@constants";

export function formatDateStart(ms: number): string {
	const d = new Date(ms);
	return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function getStatusColor(status: string | undefined): string {
	if (!status) return 'bg-gray-500';
	if (status === EDriverStatus.AVAILABLE) return 'bg-green-500';
	if (status === EDriverStatus.ON_RIDE) return 'bg-red-500';
	if (status === EDriverStatus.OFFLINE) return 'bg-gray-500';
	return 'bg-gray-500';
}