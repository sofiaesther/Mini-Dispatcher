import type { WebSocket } from 'ws';
import type { ClientType, RegisteredClient } from './realtime.types';

const connectionToClient = new Map<string, { ws: WebSocket; client?: RegisteredClient }>();
const driverIdToConnectionId = new Map<string, string>();
const passengerIdToConnectionId = new Map<string, string>();

export function setConnection(connectionId: string, ws: WebSocket): void {
  connectionToClient.set(connectionId, { ws });
}

export function registerClient(connectionId: string, clientType: ClientType, clientId: string): void {
  const entry = connectionToClient.get(connectionId);
  if (!entry) return;
  entry.client = { connectionId, clientType, clientId };
  if (clientType === 'driver') {
    driverIdToConnectionId.set(clientId, connectionId);
  } else {
    passengerIdToConnectionId.set(clientId, connectionId);
  }
}

export function getClient(connectionId: string): RegisteredClient | undefined {
  return connectionToClient.get(connectionId)?.client;
}

export function getWs(connectionId: string): WebSocket | undefined {
  return connectionToClient.get(connectionId)?.ws;
}

export function getDriverConnectionId(driverId: string): string | undefined {
  return driverIdToConnectionId.get(driverId);
}

export function getPassengerConnectionId(passengerId: string): string | undefined {
  return passengerIdToConnectionId.get(passengerId);
}

export function removeConnection(connectionId: string): void {
  const entry = connectionToClient.get(connectionId);
  if (entry?.client) {
    if (entry.client.clientType === 'driver') {
      driverIdToConnectionId.delete(entry.client.clientId);
    } else {
      passengerIdToConnectionId.delete(entry.client.clientId);
    }
  }
  connectionToClient.delete(connectionId);
}
