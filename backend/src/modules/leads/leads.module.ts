import { Module } from '@nestjs/common';
import { LeadsService } from './application/leads.service';
import { LeadsController } from './infrastructure/leads.controller';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
