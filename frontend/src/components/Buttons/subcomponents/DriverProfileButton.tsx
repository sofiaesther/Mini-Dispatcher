import { useClient } from "@/context/ClientContext";
import { useCallback } from "react";
import { Button } from "@components/Buttons";
import { UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const DriverProfileButton = () => {
	const { clientId } = useClient();

	const router = useRouter();

	const handleClick = useCallback(() => {
		router.push(`/drivers/${clientId}`);
	}, [clientId, router]);

	return (
		<Button
			color="secondary"
			text=""
			icon={<UserIcon className="h-5 w-5" />}
			className="w-auto"
			onClick={handleClick}
		/>
	);
};

export default DriverProfileButton;