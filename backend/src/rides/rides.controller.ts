import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  constructor(private readonly rides: RidesService) {}

  @Get()
  quote(
    @Query('fromLat') fromLat: string,
    @Query('fromLon') fromLon: string,
    @Query('toLat') toLat: string,
    @Query('toLon') toLon: string,
  ) {
    const fromLatN = parseFloat(fromLat);
    const fromLonN = parseFloat(fromLon);
    const toLatN = parseFloat(toLat);
    const toLonN = parseFloat(toLon);
    if (
      Number.isNaN(fromLatN) ||
      Number.isNaN(fromLonN) ||
      Number.isNaN(toLatN) ||
      Number.isNaN(toLonN)
    ) {
      return { error: 'Invalid coordinates' };
    }
    return this.rides.quote(fromLatN, fromLonN, toLatN, toLonN);
  }

  @Post('request')
  request(@Body() body: {
    passengerId: string;
    from: { lat: number; lon: number };
    to: { lat: number; lon: number };
    fare: number;
    distanceKm: number;
    durationMin: number;
  }) {
    return this.rides.requestRide(body);
  }
}
