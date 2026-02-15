'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { EClientType } from '@/constants';

interface ClientContextType {
	clientType: EClientType;
	updateClient: (clientType: EClientType) => void;
	clearClient: () => void;
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

	const updateClient = useCallback((clientType: EClientType) => {
		setClientType(clientType);
	}, []);

	const clearClient = useCallback(() => {
		setClientType(EClientType.NONE);
		if (typeof window !== 'undefined') window.sessionStorage.removeItem('driverId');
	}, []);

	return (
		<ClientContext.Provider
			value={{
				updateClient,
				clearClient,
				clientType,
			}}
		>
			{children}
		</ClientContext.Provider>
	);
};
