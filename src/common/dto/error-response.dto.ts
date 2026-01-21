import { ApiProperty } from '@nestjs/swagger';
import { ErrorResponseOptions } from '@/common/interfaces/error-response.interface';

export class BadRequestErrorResponseDto implements ErrorResponseOptions {
  @ApiProperty({
    type: String,
    description: 'Error description',
    example: 'Invalid post id',
  })
  message: string;

  @ApiProperty({
    type: String,
    description: 'Error name',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    type: Number,
    description: 'Error code',
    example: 400,
  })
  statusCode: number;
}

export class ForbiddenErrorResponseDto implements ErrorResponseOptions {
  @ApiProperty({
    type: String,
    description: 'Error message',
    example: 'Token expired',
  })
  message: string;

  @ApiProperty({
    type: String,
    description: 'Error name',
    example: 'Forbidden',
  })
  error: string;

  @ApiProperty({
    type: Number,
    description: 'Error code',
    example: 403,
  })
  statusCode: number;
}

export class NotFoundErrorResponseDto implements ErrorResponseOptions {
  @ApiProperty({
    type: String,
    description: 'Error message',
    example: 'Post not found',
  })
  message: string;

  @ApiProperty({
    type: String,
    description: 'Error name',
    example: 'Not found',
  })
  error: string;

  @ApiProperty({
    type: Number,
    description: 'Error code',
    example: 404,
  })
  statusCode: number;
}

export class UnAuthorizeErrorResponseDto implements ErrorResponseOptions {
  @ApiProperty({
    type: String,
    description: 'Error name',
    example: 'Unauthorized',
  })
  error: string;

  @ApiProperty({
    type: Number,
    description: 'Error code',
    example: 401,
  })
  statusCode: number;
}

export class InternalServerErrorResponseDto implements ErrorResponseOptions {
  @ApiProperty({
    type: Object,
    description: 'Error message',
    example: 'property must be a string',
  })
  message: string;

  @ApiProperty({
    type: String,
    description: 'Error name',
    example: 'Internal Server Error',
  })
  error: string;

  @ApiProperty({
    type: Number,
    description: 'Error code',
    example: 500,
  })
  statusCode: number;
}
