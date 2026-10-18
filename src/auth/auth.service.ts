import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InternalAccountService } from '../internal/account/account.service.js';
import { REDIS_TOKEN } from '../config/redis/redis.constant.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { JwtDto, RefreshJwtDto } from './dto/jwt.dto.js';

type JwtPayload = {
  login: string;
  userId: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    private readonly accountService: InternalAccountService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private getJwtAlgorithm(): 'HS256' | 'RS256' {
    const value = this.config.get<string>('JWT_ALG', 'HS256') ?? 'HS256';

    return value === 'RS256' ? 'RS256' : 'HS256';
  }

  private buildTokens(payload: JwtPayload): JwtDto {
    const algorithm = this.getJwtAlgorithm();

    const access = this.jwtService.sign(payload as any, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET', 'accessSecret'),
      algorithm,
      expiresIn: this.config.get<string>('JWT_ACCESS_EXP', '1h') as any,
    } as any);

    const refresh = this.jwtService.sign(payload as any, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refreshSecret'),
      algorithm,
      expiresIn: this.config.get<string>('JWT_REFRESH_EXP', '24h') as any,
    } as any);

    return { access, refresh };
  }

  async login(params: SignInDto): Promise<JwtDto> {
    const isPasswordCorrect = await this.accountService.verification(params);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid login or password');
    }

    let userId = await this.redis.get(params.login);
    let login = params.login;

    if (!userId) {
      const users = await this.accountService.getUsersByFilter({ login: params.login });
      const user = users.items[0];

      if (!user) {
        throw new NotFoundException('User not found');
      }

      userId = user.userId;
      login = user.login;
      await this.redis.set(login, userId);
    }

    return this.buildTokens({ login, userId });
  }

  async refreshToken(params: RefreshJwtDto): Promise<JwtDto> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(params.refresh, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refreshSecret'),
        algorithms: [this.getJwtAlgorithm()],
      } as any);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const users = await this.accountService.getUsersByFilter({ userIds: [payload.userId] });
    const user = users.items[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPayload: JwtPayload = { login: user.login, userId: user.userId };

    return this.buildTokens(newPayload);
  }
}
