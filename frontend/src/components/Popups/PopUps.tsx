"use client";

import { useEffect, useCallback } from "react";
import RequestRidePopUp from "./subcomponents/RequestRidePopUp/RequestRidePopUp";
import AuthPopUp from "./subcomponents/AuthPopUp/AuthPopUp";
import IncomingRideRequest from "./subcomponents/RequestRidePopUp";
import RideEvaluationPopUp from "./subcomponents/RideEvaluationPopUp";
import { IPopupProps } from "./IPopup";

const PopUps = ({
	popup,
	setPopup,
	requestRide,
	passengerId,
	incomingRequest,
	onAcceptRequest,
	onRejectRequest,
	onEvaluateRide,
}: IPopupProps) => {

	useEffect(() => {
		if (popup === 'incomingRideRequest' && !incomingRequest) {
			setPopup(undefined);
		}
	}, [popup, incomingRequest, setPopup]);

	const handleClose = useCallback(() => {
		setPopup(undefined);
	}, [setPopup]);

	if (!popup || (popup === 'incomingRideRequest' && !incomingRequest)) return null;

	const renderContent = () => {
		switch (popup) {
			case 'requestRide':
				return <RequestRidePopUp handleClose={handleClose} requestRide={requestRide} passengerId={passengerId} />;
			case 'auth':
				return <AuthPopUp handleClose={handleClose} />;
			case 'incomingRideRequest':
				return incomingRequest && onAcceptRequest && onRejectRequest ? (
					<IncomingRideRequest
						request={incomingRequest}
						onAccept={onAcceptRequest}
						onReject={onRejectRequest}
					/>
				) : null;
			case 'rideEvaluation':
				return onEvaluateRide ? (
					<RideEvaluationPopUp handleClose={handleClose} onSubmit={onEvaluateRide} />
				) : null;
			default:
				return null;
		}
	};

	return (
		<>
			<button
				type="button"
				aria-label="Close"
				onClick={handleClose}
				className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
			/>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
				<div className="relative w-full max-w-md max-h-[90vh] rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 p-4 pointer-events-auto md:max-w-100vw">
					{renderContent()}
				</div>
			</div>
		</>
	);
};

export default PopUps;
