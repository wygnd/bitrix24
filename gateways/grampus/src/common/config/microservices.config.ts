import { IMicroservicesConfig } from '@/common/interfaces/microservices-config.interface';

export default (): { microservices: IMicroservicesConfig } => ({
  microservices: {
    users: {
      port: process.env.MICROSERVICES_NEURO_PORT,
    },
    robots: {
      host: process.env.MICROSERVICES_ROBOTS_HOST
    }
  },
});
