import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
  BadRequestErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  NotFoundErrorResponseDto,
  UnAuthorizeErrorResponseDto,
} from '../dto/error-response.dto';

export const ApiExceptions = () => {
  return applyDecorators(
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad Request',
      type: BadRequestErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      type: UnAuthorizeErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden',
      type: ForbiddenErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not found',
      type: NotFoundErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal Server Error',
      type: InternalServerErrorResponseDto,
    }),
  );
};
