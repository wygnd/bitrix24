import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AddyService } from '@/modules/addy/services/service';

@Module({
  imports: [HttpModule],
  providers: [AddyService],
  exports: [AddyService],
})
export class AddyModule {}
