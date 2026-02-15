import { CarIcon, LogOutIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "@context";
import { Button, DriverStatusButton, DriverProfileButton } from "@components/Buttons";
import { EClientType } from "@/constants";

interface DashboardProps {
	onRequestRide?: () => void;
	children?: React.ReactNode;
}

const Dashboard = ({ children }: DashboardProps) => {
	const { clientType, clearClient } = useClient();
	const router = useRouter();

	const {title, description} = useMemo(() => {
		return {
			title: clientType === EClientType.PASSENGER ? "Welcome!" : "Welcome!",
			description: clientType === EClientType.PASSENGER ? "Passenger Dashboard" : "You are logged in as a driver",
		};
	}, [clientType]);

	const handleLogout = useCallback(() => {
		clearClient();
		router.push('/');
	}, [router, clearClient]);

	return (
		<div className="fixed top-0 left-0 w-full h-full z-10 min-h-screen bg-transparent from-blue-50 to-indigo-100">
			<div className="container mx-auto px-4 py-6">
				<div className="bg-[#7349a3] rounded-lg shadow-md p-4 mb-6">
					<div className="flex items-center justify-between flex-wrap gap-4">
						<div>
							<h1 className="text-2xl font-bold text-[#b7f394]">{title}</h1>
							<p className="text-white text-sm">{description}</p>
						</div>
						<div className="flex items-end gap-3 flex-wrap">
							{clientType === EClientType.DRIVER && (
								<>
									<DriverStatusButton />
									<DriverProfileButton />
								</>
							)}

							<Button
								color="ghost"
								text="Log Out"
								icon={<LogOutIcon />}
								onClick={handleLogout}
							/>
						</div>
					</div>
				</div>
				{children}
			</div>
		</div>
	);
};

export default Dashboard;