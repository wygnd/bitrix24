import { RedisOptions } from 'bullmq';

export default (): { redisConfig: RedisOptions } => ({
  redisConfig: {
    url: process.env.REDIS_URL,
  },
});
