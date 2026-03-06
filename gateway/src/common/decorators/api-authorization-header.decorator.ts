import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export const ApiAuthHeader = () => {
  return applyDecorators(
    ApiHeader({
      name: 'Authorization',
      description: 'Токен авторизации',
      example: 'bga token',
      required: true,
    }),
  );
};
