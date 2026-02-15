import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Server, WebSocket } from 'ws';
import { generateConnectionId } from '../common/ids';
import * as presence from './presence.store';
import { RealtimeService } from './realtime.service';

interface WsEnvelope {
  type: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class RealtimeGateway implements OnModuleDestroy {
  private server: Server | null = null;

  constructor(private readonly realtime: RealtimeService) {}

  attachToServer(httpServer: import('http').Server): void {
    if (this.server) {
      this.server.close();
    }
    this.server = new Server({ server: httpServer, path: '/ws' });
    this.server.on('connection', (ws: WebSocket) => this.handleConnection(ws));
    console.log('WebSocket server attached at path /ws (same port as HTTP)');
  }

  onModuleDestroy(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private handleConnection(ws: WebSocket): void {
    const connectionId = generateConnectionId();
    presence.setConnection(connectionId, ws);

    ws.on('message', (data: Buffer) => {
      let envelope: WsEnvelope;
      try {
        envelope = JSON.parse(data.toString()) as WsEnvelope;
      } catch {
        this.sendError(ws, 'Invalid message format');
        return;
      }
      void this.handleMessage(connectionId, envelope);
    });

    ws.on('close', () => this.realtime.handleDisconnection(connectionId));
    ws.on('error', () => this.realtime.handleDisconnection(connectionId));

    this.send(ws, { type: 'connected', connectionId });
  }

  private async handleMessage(connectionId: string, envelope: WsEnvelope): Promise<void> {
    const { type, data = {} } = envelope;

    if (type === 'register') {
      const clientType = data.clientType as 'driver' | 'passenger';
      const clientId = String(data.clientId ?? '');
      const rideToken = data.rideToken != null ? String(data.rideToken) : '';
      if (clientType && clientId) {
        this.realtime.registerClient(connectionId, clientType, clientId);
        this.send(presence.getWs(connectionId), {
          type: 'registered',
          connectionId,
          clientType,
          clientId,
        });
        if (clientType === 'passenger' && rideToken) {
          await this.realtime.restoreRideByToken(connectionId, rideToken);
        }
        if (clientType === 'driver' && rideToken) {
          this.realtime.restoreRideByTokenForDriver(connectionId, rideToken);
        }
      }
      return;
    }

    if (type === 'driver:location') {
      const lat = Number(data.lat);
      const lng = Number(data.lng ?? data.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        await this.realtime.handleDriverLocation(connectionId, lat, lng);
      }
      return;
    }

    if (type === 'driver:status') {
      const raw = data.status as string;
      const status = raw === 'on_ride' ? 'busy' : (raw as 'available' | 'busy' | 'offline');
      if (status) {
        await this.realtime.handleDriverStatus(connectionId, status);
      }
      return;
    }

    if (type === 'ride:update-status') {
      const rideId = String(data.rideId ?? '');
      const status = data.status as 'accepted' | 'initiated' | 'completed';
      if (rideId && (status === 'initiated' || status === 'completed')) {
        await this.realtime.handleRideStatusUpdate(connectionId, rideId, status);
      }
      return;
    }

    if (type === 'driver:ride-response') {
      const rideId = String(data.rideId ?? '');
      const accepted = Boolean(data.accepted);
      if (rideId) {
        await this.realtime.handleRideResponse(connectionId, rideId, accepted);
      }
      return;
    }

    if (type === 'passenger:cancel-ride') {
      const rideId = String(data.rideId ?? '');
      if (rideId) {
        await this.realtime.handlePassengerCancelRide(connectionId, rideId);
      }
      return;
    }

    if (type === 'passenger:ride-evaluation') {
      const d = data as Record<string, unknown>;
      await this.realtime.handlePassengerRideEvaluation(connectionId, {
        rideId: d.rideId != null ? String(d.rideId) : undefined,
        passengerId: d.passengerId != null ? String(d.passengerId) : undefined,
        driverId: d.driverId != null ? String(d.driverId) : undefined,
        rating: typeof d.rating === 'number' ? d.rating : Number(d.rating),
        comment: d.comment != null ? String(d.comment) : undefined,
      });
      return;
    }

    if (type === 'passenger:request-ride') {
      const d = data as Record<string, unknown>;
      const from = d.from as { lat: number; lng?: number; lon?: number };
      const to = d.to as { lat: number; lng?: number; lon?: number };
      const passengerId = String(d.passengerId ?? '');
      const price = Number(d.price ?? 0);
      const distance = Number(d.distance ?? 0);
      const duration = Number(d.duration ?? 0);
      if (passengerId && from?.lat != null && to?.lat != null) {
        const rideId = randomUUID();
        this.realtime.dispatchRideRequest(rideId, {
          passengerId,
          from: { lat: from.lat, lon: (from.lng ?? from.lon) ?? 0 },
          to: { lat: to.lat, lon: (to.lng ?? to.lon) ?? 0 },
          fare: price,
          distanceKm: distance,
          durationMin: duration,
        });
        this.send(presence.getWs(connectionId), { type: 'ride:request-sent', data: { rideId } });
      }
      return;
    }
  }

  private send(ws: WebSocket | undefined, message: object): void {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify(message));
  }

  private sendError(ws: WebSocket | undefined, error: string): void {
    this.send(ws, { type: 'error', error });
  }
}
