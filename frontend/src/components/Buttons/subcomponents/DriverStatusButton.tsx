import { useClient } from "@/context/ClientContext";
import { useMemo } from "react";
import { Button } from "@components/Buttons";
import { CarIcon } from "lucide-react";
import { EDriverStatus } from "@/constants";
import useDriver from "@/hooks/useDriver";

const DriverStatusButton = () => {
	const { clientId } = useClient();
	const { driverStatus, handleStatus } = useDriver({ driverId: clientId });

	const buttonInfo = useMemo((): { color: 'primary' | 'secondary' | 'ghost' | 'gray'; text: string } => {
		if (driverStatus === EDriverStatus.AVAILABLE) {
			return { color: 'secondary', text: 'Searching rides' };
		}
		if (driverStatus === EDriverStatus.ON_RIDE) {
			return { color: 'gray', text: 'Ride in progress' };
		}
		return { color: 'ghost', text: 'Go online' };
	}, [driverStatus]);

	return (
		<Button
			color={buttonInfo.color}
			text={buttonInfo.text}
			icon={<CarIcon className="h-5 w-5" />}
			className="w-auto"
			onClick={handleStatus}
		/>
	);
};

export default DriverStatusButton;