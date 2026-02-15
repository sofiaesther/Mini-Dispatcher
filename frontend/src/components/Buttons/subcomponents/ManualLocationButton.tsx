import { MapPin } from "lucide-react";
import { Button } from "../Button";

interface IMButtonProps {
    onClick: () => void;
}

export default function ManualLocationButton({ onClick }: IMButtonProps) {
	return (
		<Button
			color="ghost"
			text="Set / change location"
			icon={<MapPin className="h-5 w-5" />}
			onClick={onClick}
			className="w-auto mb-6"
		/>
	);
}