import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DriversModule } from './drivers/drivers.module';
import { RidesModule } from './rides/rides.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [PrismaModule, DriversModule, RidesModule, RealtimeModule],
})
export class AppModule {}
