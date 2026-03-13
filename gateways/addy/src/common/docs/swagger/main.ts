import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IEnvironmentOptions } from '../../../shared/interfaces/config/main';
import basicAuth from 'express-basic-auth';
import { IS_PROD } from '../../../shared/constants/app/main';

export const setupAppSwaggerDocumentation = (app: NestExpressApplication) => {
  const config = app.get(ConfigService<IEnvironmentOptions>);
  const title =
    config.get('application.title', { infer: true }) ?? 'Addy bitrix24';
  const description =
    config.get('application.description', { infer: true }) ?? '';
  const version =
    config.get('application.docs.swagger.version', { infer: true }) ?? '1.0';

  const swaggerConfig = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .build();

  // Если на проде включаем авторизацию для документации
  if (IS_PROD) {
    const username = config.getOrThrow('application.docs.swagger.username', {
      infer: true,
    });
    const password = config.getOrThrow('application.docs.swagger.password', {
      infer: true,
    });

    app.use(
      ['/docs', '/docs-json'],
      basicAuth({
        challenge: true,
        users: {
          [username]: password,
        },
      }),
    );
  }

  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, swaggerConfig),
    {
      swaggerOptions: {
        filter: true,
        docExpansion: 'none',
        // showExtensions: true,
        showCommonExtensions: false,
        displayRequestDuration: true,
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
      },
      customfavIcon: '/public/favicon.ico',
      customSiteTitle: title,
    },
  );
};
