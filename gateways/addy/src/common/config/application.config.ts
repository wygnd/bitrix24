import { IEnvironmentAppOptions } from '@shared/interfaces/config/app/main';

export default (): { application: IEnvironmentAppOptions } => ({
  application: {
    title: process.env.ADDY_GATEWAY_APP_TITLE,
    description: process.env.ADDY_GATEWAY_APP_DESCRIPTION,
    port: process.env.ADDY_GATEWAY_APP_PORT ?? '3000',
    docs: {
      swagger: {
        version: process.env.ADDY_GATEWAY_APP_DOCS_SWAGGER_VERSION,
        username: process.env.ADDY_GATEWAY_APP_DOCS_SWAGGER_USERNAME,
        password: process.env.ADDY_GATEWAY_APP_DOCS_SWAGGER_PASSWORD,
      },
    },
    auth: {
      token: process.env.ADDY_GATEWAY_APP_AUTH_TOKEN ?? '',
    },
  },
});
