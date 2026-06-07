import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { DatabaseModule } from '../../core/database';

@Module({
  imports: [DatabaseModule],
  controllers: [TenantsController],
})
export class TenantsModule {}
