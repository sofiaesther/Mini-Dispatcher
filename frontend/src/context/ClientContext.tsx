'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { EClientType, EDriverLocationType } from "@constants";
import { TMapMarker } from "@components/Map";

interface ClientContextType {
	clientType: EClientType;
    mapMarkers: TMapMarker[];
    clientId: string;
    userLocationMarker: TMapMarker | null;
    setUserLocationMarker: React.Dispatch<React.SetStateAction<TMapMarker | null>>;
	clearClient: () => void;
	updateClient: (clientType: EClientType, clientId: string) => void;
	setRideMarkers: React.Dispatch<React.SetStateAction<TMapMarker[]>>;
    driverLocationType: EDriverLocationType;
    setDriverLocationType: React.Dispatch<React.SetStateAction<EDriverLocationType>>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClient = () => {
	const context = useContext(ClientContext);
	if (context === undefined) {
		throw new Error('useClient must be used within a ClientProvider');
	}
	return context;
};

interface ClientProviderProps {
	children: ReactNode;
}

export const ClientProvider = ({ children }: ClientProviderProps) => {
	const [clientType, setClientType] = useState<EClientType>(EClientType.NONE);
	const [clientId, setClientId] = useState<string>('');
	const [rideMarkers, setRideMarkers] = useState<TMapMarker[]>([]);
	const [userLocationMarker, setUserLocationMarker] = useState<TMapMarker | null>(null);
	const [driverLocationType, setDriverLocationType] = useState<EDriverLocationType>(EDriverLocationType.CUSTOM);

	const mapMarkers = useMemo(
		() => [...rideMarkers, ...(userLocationMarker ? [userLocationMarker] : [])],
		[rideMarkers, userLocationMarker],
	);

	const updateClient = useCallback((clientType: EClientType, clientId: string) => {
		setClientType(clientType);
		setClientId(clientId);
	}, []);

	const clearClient = useCallback(() => {
		setClientType(EClientType.NONE);
		setClientId('');
		setRideMarkers([]);
		setUserLocationMarker(null);
		if (typeof window !== 'undefined') window.sessionStorage.removeItem('driverId');
	}, []);

	return (
		<ClientContext.Provider
			value={{
				updateClient,
				clearClient,
				clientType,
				clientId,
				mapMarkers,
				userLocationMarker,
				setUserLocationMarker,
				setRideMarkers,
				driverLocationType,
				setDriverLocationType,
			}}
		>
			{children}
		</ClientContext.Provider>
	);
};
