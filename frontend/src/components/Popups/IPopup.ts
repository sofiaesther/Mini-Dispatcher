import { IRideRequest } from "@/hooks/useWebSocket";
import { Dispatch, SetStateAction } from "react";

export type TPopupKey = 'requestRide' | 'auth' | 'incomingRideRequest' | 'rideEvaluation';

export type IPopupProps = {
	popup?: TPopupKey;
	setPopup: Dispatch<SetStateAction<TPopupKey | undefined>>;
	requestRide?: (payload: IRideRequest) => void;
	passengerId?: string;
	incomingRequest?: IRideRequest | null;
	onAcceptRequest?: () => void;
	onRejectRequest?: () => void;
	onEvaluateRide?: (rating: number, comment?: string) => void;
};