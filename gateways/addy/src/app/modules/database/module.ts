import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IEnvironmentOptions } from '@shared/interfaces/config/main';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<IEnvironmentOptions>) => {
        const config = configService.getOrThrow('database', { infer: true });

        return {
          dialect: 'postgres',
          autoLoadModels: true,
          synchronize: true,
          ...config,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
