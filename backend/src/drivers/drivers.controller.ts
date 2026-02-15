import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriverAuthDto } from './dto/driver-auth.dto';
import { DriverRegisterDto } from './dto/driver-register.dto';
import { UpdateDriverLocationDto } from './dto/update-location.dto';
import { UpdateDriverStatusDto } from './dto/update-status.dto';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get(':id')
  async getPublicProfile(@Param('id') driverId: string) {
    const profile = await this.drivers.getPublicProfile(driverId);
    if (!profile) {
      throw new NotFoundException('Driver not found');
    }
    return profile;
  }

  @Post('auth')
  async auth(@Body() dto: DriverAuthDto): Promise<{ success: boolean; driverId: string }> {
    const result = await this.drivers.validateDriverByEmail(dto.email, dto.password);
    if (!result) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return { success: true, driverId: result.driverId };
  }

  @Post('register-account')
  register(@Body() dto: DriverRegisterDto) {
    return this.drivers.registerDriver(dto);
  }

  @Post(':id/location')
  async updateLocation(
    @Param('id') driverId: string,
    @Body() dto: UpdateDriverLocationDto,
  ): Promise<{ ok: boolean }> {
    await this.drivers.updateLocation(driverId, dto.lat, dto.lon);
    return { ok: true };
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') driverId: string,
    @Body() dto: UpdateDriverStatusDto,
  ): Promise<{ ok: boolean }> {
    await this.drivers.updateStatus(driverId, dto.status);
    return { ok: true };
  }
}
