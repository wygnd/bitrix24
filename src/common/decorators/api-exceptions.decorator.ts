import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

export const ApiExceptions = () => {
  return applyDecorators(
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad Request',
      type: ErrorResponseDto,
    }),
    // ApiResponse({
    //   status: HttpStatus.UNAUTHORIZED,
    //   description: 'Unauthorized error',
    //   type: ErrorResponseDto,
    // }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden request',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Not found',
      type: ErrorResponseDto,
    }),
  );
};
