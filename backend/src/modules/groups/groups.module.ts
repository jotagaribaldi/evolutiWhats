import { Module } from '@nestjs/common';
import { GroupsService } from './application/groups.service';
import { GroupsController } from './infrastructure/groups.controller';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
