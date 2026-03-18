import { IEnvironmentRedisOptions } from '@shared/interfaces/config/redis/main';

export default (): { redis: IEnvironmentRedisOptions } => ({
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: process.env.REDIS_PORT ?? '6379',
    user: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
  },
});
