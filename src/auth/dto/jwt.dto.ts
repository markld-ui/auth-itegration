import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Refresh JWT',
    required: true,
  })
  readonly refresh: string;
}
