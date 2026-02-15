import { Module } from '@nestjs/common';
import { DriversModule } from '../drivers/drivers.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';

@Module({
  imports: [DriversModule, RealtimeModule],
  controllers: [RidesController],
  providers: [RidesService],
})
export class RidesModule {}
