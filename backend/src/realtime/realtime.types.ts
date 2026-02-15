export type ClientType = 'driver' | 'passenger';

export interface RegisteredClient {
  connectionId: string;
  clientType: ClientType;
  clientId: string;
}
