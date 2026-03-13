import { ApiProperty } from '@nestjs/swagger';

export class AppHealthResponseDTO {
  @ApiProperty({
    type: Boolean,
    description: 'Статус',
    example: true,
  })
  status: boolean;
}
