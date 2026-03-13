import { REDIS_MAX_RETRY_DURATION } from '../constants/constants';
import { RedisRetryStrategyType } from '../types/types';

export const redisRetryStrategy = (
  times: number,
  totalRetryDuration: number,
): RedisRetryStrategyType => {
  const delay = Math.min(1000 * 2 ** times, 30000);
  const currentRetryDuration = totalRetryDuration + delay;

  if (currentRetryDuration >= REDIS_MAX_RETRY_DURATION) {
    console.error(
      `Redis connection retry, attempt ${times}, waiting for ${delay}ms`,
    );
    return {
      delay: null,
      retryDuration: currentRetryDuration,
    };
  }

  return {
    delay: delay,
    retryDuration: currentRetryDuration,
  };
};
