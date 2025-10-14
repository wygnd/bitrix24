import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { authProviders } from './auth.providers';

@Module({
  imports: [DatabaseModule],
  providers: [...authProviders],
})
export class AuthModule {}
