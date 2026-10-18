import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'Логин пользователя',
    type: String,
    required: true,
    example: 'ivan.petrov',
  })
  @IsNotEmpty({ message: 'Поле "login" должно быть заполнено' })
  @IsString({ message: 'Поле "login" должно быть строкой' })
  readonly login: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    type: String,
    required: true,
    example: 'StrongPassword123',
  })
  @IsNotEmpty({ message: 'Поле "password" должно быть заполнено' })
  @IsString({ message: 'Поле "password" должно быть строкой' })
  readonly password: string;
}
