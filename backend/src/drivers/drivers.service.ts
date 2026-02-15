import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { DriverStatus, DriverPublicProfile, DriverCar } from './drivers.types';
import type { DriverRegisterDto } from './dto/driver-register.dto';

function hashPassword(password: unknown): string {
  const s = typeof password === 'string' ? password : '';
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function carFromJson(car: unknown): DriverCar {
  if (car && typeof car === 'object' && 'model' in car) {
    const c = car as Record<string, unknown>;
    return {
      model: String(c.model ?? '').trim(),
      plate: String(c.plate ?? '').trim(),
      year: Number(c.year ?? new Date().getFullYear()),
      color: String(c.color ?? '').trim(),
    };
  }
  return {
    model: '',
    plate: '',
    year: new Date().getFullYear(),
    color: '',
  };
}

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {
    if (!this.prisma) {
      throw new Error('DriversService: PrismaService was not injected. Ensure PrismaModule is imported by DriversModule.');
    }
  }

  async validateDriver(driverId: string, password: string): Promise<boolean> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });
    if (!driver) return false;
    return verifyPassword(password, driver.passwordHash);
  }

  async validateDriverByEmail(
    email: string,
    password: string,
  ): Promise<{ driverId: string } | null> {
    const driver = await this.prisma.driver.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!driver) return null;
    if (!verifyPassword(password, driver.passwordHash)) return null;
    return { driverId: driver.id };
  }

  async registerDriver(dto: DriverRegisterDto): Promise<{ driverId: string }> {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Invalid request body');
    }
    const raw = dto as unknown as Record<string, unknown>;
    const name = String(raw.name ?? '').trim();
    const email = String(raw.email ?? '').trim();
    const phone = String(raw.phone ?? '').trim();
    const password = raw.password;
    const passwordStr = password != null ? String(password) : '';
    const city = String(raw.city ?? '').trim();
    const carRaw = raw.car as Record<string, unknown> | undefined;
    const car = {
      model: String(carRaw?.model ?? '').trim(),
      plate: String(carRaw?.plate ?? '').trim(),
      year: Number(carRaw?.year ?? new Date().getFullYear()),
      color: String(carRaw?.color ?? '').trim(),
    };
    if (!name || !email || !phone || !passwordStr) {
      throw new BadRequestException('name, email, phone and password are required');
    }
    if (!city || !car.model || !car.plate || !car.color) {
      throw new BadRequestException('city and car (model, plate, year, color) are required');
    }
    const existing = await this.prisma.driver.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const driver = await this.prisma.driver.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash: hashPassword(String(passwordStr)),
        city,
        car: car as object,
      },
    });
    await this.prisma.driverPresence.create({
      data: {
        driverId: driver.id,
        lat: 0,
        lon: 0,
        status: 'offline',
      },
    });
    return { driverId: driver.id };
  }

  async getPublicProfile(driverId: string): Promise<DriverPublicProfile | null> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { presence: true },
    });
    if (!driver) return null;
    const dateStart = driver.createdAt.getTime();
    const car = carFromJson(driver.car);

    const [rideCount, ratingAgg] = await Promise.all([
      this.prisma.ride.count({
        where: { driverId, status: 'completed' },
      }),
      this.prisma.rideEvaluation.aggregate({
        where: { driverId },
        _avg: { rating: true },
      }),
    ]);

    const rating =
      ratingAgg._avg.rating != null
        ? Math.round(ratingAgg._avg.rating * 10) / 10
        : undefined;

    const result: DriverPublicProfile = {
      driverId: driver.id,
      name: driver.name,
      city: driver.city ?? '',
      dateStart,
      rating,
      rideCount,
      car,
    };
    const presence = driver.presence;
    if (presence && (presence.lat !== 0 || presence.lon !== 0)) {
      result.presence = {
        lat: presence.lat,
        lon: presence.lon,
        status: presence.status as DriverStatus,
      };
    }
    return result;
  }

  async updateLocation(driverId: string, lat: number, lon: number): Promise<void> {
    await this.prisma.driverPresence.upsert({
      where: { driverId },
      create: {
        driverId,
        lat,
        lon,
        status: 'offline',
      },
      update: { lat, lon },
    });
  }

  async updateStatus(driverId: string, status: DriverStatus): Promise<void> {
    await this.prisma.driverPresence.upsert({
      where: { driverId },
      create: {
        driverId,
        lat: 0,
        lon: 0,
        status,
      },
      update: { status },
    });
  }

  async getAvailableDrivers(): Promise<
    { driverId: string; lat: number; lon: number; status: string; updatedAt: number }[]
  > {
    const list = await this.prisma.driverPresence.findMany({
      where: { status: 'available' },
    });
    return list.map((p: { driverId: string; lat: number; lon: number; status: string; updatedAt: Date }) => ({
      driverId: p.driverId,
      lat: p.lat,
      lon: p.lon,
      status: p.status,
      updatedAt: p.updatedAt.getTime(),
    }));
  }

  /** Persist ride to DB when driver accepts (so evaluations can be linked later). */
  async createRide(
    rideId: string,
    driverId: string,
    passengerId: string,
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    price: number,
    distanceKm: number,
    durationMin: number,
  ): Promise<void> {
    await this.prisma.ride.upsert({
      where: { id: rideId },
      create: {
        id: rideId,
        driverId,
        passengerId,
        status: 'accepted',
        fromLat: from.lat,
        fromLon: from.lng,
        toLat: to.lat,
        toLon: to.lng,
        price,
        distanceKm,
        durationMin,
      },
      update: {},
    });
  }

  /** Update ride status in DB (initiated | completed). */
  async updateRideStatus(rideId: string, status: 'accepted' | 'initiated' | 'completed'): Promise<void> {
    await this.prisma.ride.updateMany({
      where: { id: rideId },
      data: { status },
    });
  }

  /**
   * Create ride evaluation (idRide, idDriver, rating). Call after ride is completed.
   * Returns true if created; false if ride invalid or already evaluated.
   */
  async createRideEvaluation(
    rideId: string,
    passengerId: string,
    driverId: string,
    rating: number,
    comment?: string | null,
  ): Promise<boolean> {
    const r = Math.round(rating);
    if (r < 1 || r > 5) return false;
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });
    if (!ride || ride.status !== 'completed' || ride.driverId !== driverId || ride.passengerId !== passengerId) {
      return false;
    }
    const existing = await this.prisma.rideEvaluation.findFirst({
      where: { rideId },
    });
    if (existing) return false;
    await this.prisma.rideEvaluation.create({
      data: {
        rideId,
        passengerId,
        driverId,
        rating: r,
        comment: comment ?? null,
      },
    });
    return true;
  }

  async getPresence(driverId: string): Promise<{
    driverId: string;
    lat: number;
    lon: number;
    status: string;
    updatedAt: number;
  } | null> {
    const p = await this.prisma.driverPresence.findUnique({
      where: { driverId },
    });
    if (!p) return null;
    return {
      driverId: p.driverId,
      lat: p.lat,
      lon: p.lon,
      status: p.status,
      updatedAt: p.updatedAt.getTime(),
    };
  }

  async getAllPresence(): Promise<
    { driverId: string; lat: number; lon: number; status: string; updatedAt: number }[]
  > {
    const list = await this.prisma.driverPresence.findMany();
    return list.map((p: { driverId: string; lat: number; lon: number; status: string; updatedAt: Date }) => ({
      driverId: p.driverId,
      lat: p.lat,
      lon: p.lon,
      status: p.status,
      updatedAt: p.updatedAt.getTime(),
    }));
  }
}
