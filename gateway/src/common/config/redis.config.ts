import { RedisOptions } from 'bullmq';

export default (): { redisConfig: RedisOptions } => ({
  redisConfig: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? +process.env.REDIS_PORT : 6379,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
  },
});
