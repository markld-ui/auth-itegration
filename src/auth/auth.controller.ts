import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { JwtDto, RefreshJwtDto } from './dto/jwt.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: SignInDto): Promise<JwtDto> {
    return this.authService.login(dto);
  }

  @Post('refresh/token')
  refreshToken(@Body() dto: RefreshJwtDto): Promise<JwtDto> {
    return this.authService.refreshToken(dto);
  }
}
