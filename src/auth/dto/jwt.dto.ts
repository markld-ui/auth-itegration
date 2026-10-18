import { ApiProperty } from '@nestjs/swagger';

export class JwtDto {
  @ApiProperty({
    type: String,
    description: 'Access JWT',
    required: true,
  })
  readonly access: string;

  @ApiProperty({
    type: String,
    description: 'Refresh JWT',
    required: true,
  })
  readonly refresh: string;
}

export class RefreshJwtDto {
  @ApiProperty({
    type: String,
    description: 'Refresh JWT',
    required: true,
  })
  readonly refresh: string;
}
