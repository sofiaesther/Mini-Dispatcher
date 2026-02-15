'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useClient } from '@/context/ClientContext';
import { EClientType } from '@/constants';
import { useWebSocket } from '@hooks';

type PassengerWsApi = ReturnType<typeof useWebSocket>;

const PassengerRealtimeContext = createContext<PassengerWsApi | undefined>(undefined);

export function usePassengerRealtime(): PassengerWsApi | undefined {
	return useContext(PassengerRealtimeContext);
}

/** Keeps passenger WebSocket connected when navigating between /passenger and /drivers/[id] so driver location keeps updating. */
export function PassengerRealtimeBridge({ children }: { children: ReactNode }) {
	const { clientType, clientId } = useClient();
	const api = useWebSocket(
		clientType === EClientType.PASSENGER ? EClientType.PASSENGER : EClientType.NONE,
		clientType === EClientType.PASSENGER ? clientId : null,
	);
	return (
		<PassengerRealtimeContext.Provider value={api}>
			{children}
		</PassengerRealtimeContext.Provider>
	);
}
