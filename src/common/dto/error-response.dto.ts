import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    name: 'Error message',
    type: 'string',
    example: 'Invalid user id',
  })
  message: string;

  @ApiProperty({
    name: 'Error type',
    type: 'string',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    name: 'Error status code',
    type: 'number',
    example: 400,
  })
  statusCode: number;
}
